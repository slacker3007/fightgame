"""
Batch: PixelLab API v2 -> character + idle animation -> ZIP -> horizontal idle sheet PNGs.

Requires: PIXELLAB_API_TOKEN (https://pixellab.ai/account)
Optional: run with --zips-dir only (skip API) if you placed {id}.zip files from manual export.

Usage:
  set PIXELLAB_API_TOKEN=...
  python pixellab_batch_idle_sheets.py

  python pixellab_batch_idle_sheets.py --zips-dir pixellab_exports
  python pixellab_batch_idle_sheets.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from pixellab_strip_sheet import build_strip_from_frames, frames_from_zip


def load_json(path: str) -> dict | list:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def unwrap_response(data: dict) -> dict:
    if data.get("success") and isinstance(data.get("data"), dict):
        inner = dict(data["data"])
        inner["_usage"] = data.get("usage")
        return inner
    return data


def api_request(
    base: str,
    token: str,
    method: str,
    path: str,
    body: dict | None = None,
) -> dict:
    url = base.rstrip("/") + path
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        url,
        data=payload,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} {path}: {err_body}") from e
    if not raw:
        return {}
    return json.loads(raw)


def api_get_bytes(base: str, token: str, path: str) -> bytes:
    url = base.rstrip("/") + path
    req = urllib.request.Request(
        url,
        method="GET",
        headers={"Authorization": f"Bearer {token}", "Accept": "*/*"},
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


def poll_job(base: str, token: str, job_id: str, interval: float, timeout: float) -> dict:
    deadline = time.time() + timeout
    path = f"/background-jobs/{job_id}"
    last = ""
    while time.time() < deadline:
        data = unwrap_response(api_request(base, token, "GET", path, None))
        status = data.get("status") or data.get("job_status") or ""
        if status != last:
            print(f"  job {job_id}: {status or data}")
            last = str(status)
        if status in ("completed", "succeeded", "success"):
            return data
        if status in ("failed", "error", "cancelled"):
            raise RuntimeError(f"Job {job_id} failed: {data}")
        time.sleep(interval)
    raise TimeoutError(f"Job {job_id} not finished within {timeout}s")


def create_character_8dir(base: str, token: str, description: str, char_cfg: dict) -> tuple[str, str]:
    body = {
        "description": description,
        "image_size": char_cfg["image_size"],
        "view": char_cfg.get("view"),
        "mode": char_cfg.get("mode", "standard"),
        "outline": char_cfg.get("outline"),
        "shading": char_cfg.get("shading"),
        "detail": char_cfg.get("detail"),
        "text_guidance_scale": char_cfg.get("text_guidance_scale"),
        "template_id": char_cfg.get("template_id"),
        "proportions": char_cfg.get("proportions"),
    }
    body = {k: v for k, v in body.items() if v is not None}
    res = unwrap_response(api_request(base, token, "POST", "/create-character-with-8-directions", body))
    cid = res.get("character_id")
    jid = res.get("background_job_id") or res.get("job_id")
    if not cid or not jid:
        raise RuntimeError(f"Unexpected create response: {res}")
    return cid, jid


def queue_idle_animation(
    base: str,
    token: str,
    character_id: str,
    anim_cfg: dict,
    directions: list[str],
) -> list[str]:
    body = {
        "character_id": character_id,
        "template_animation_id": anim_cfg["template_animation_id"],
        "mode": anim_cfg.get("mode", "template"),
        "directions": directions,
    }
    body = {k: v for k, v in body.items() if v is not None}
    res = unwrap_response(api_request(base, token, "POST", "/characters/animations", body))
    jids = res.get("background_job_ids")
    if isinstance(jids, list) and jids:
        return jids
    single = res.get("background_job_id") or res.get("job_id")
    return [single] if single else []


def download_zip(base: str, token: str, character_id: str, dest_zip: Path) -> None:
    path = f"/characters/{character_id}/zip"
    for attempt in range(60):
        try:
            data = api_get_bytes(base, token, path)
            dest_zip.parent.mkdir(parents=True, exist_ok=True)
            dest_zip.write_bytes(data)
            return
        except urllib.error.HTTPError as e:
            if e.code == 423:
                print(f"  ZIP not ready (423), retry {attempt + 1}/60 ...")
                time.sleep(10)
                continue
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {path}: {err_body[:2000]}") from e
    raise TimeoutError("ZIP download still locked after retries")


def sheet_from_zip_file(zip_path: Path, recipe: dict, role: str):
    strip_cfg = recipe["strip"]
    disc = recipe.get("zip_discovery", {})
    square = strip_cfg["square_size"]
    n = strip_cfg["num_frames"]
    direction = (
        strip_cfg["player_direction"] if role == "player" else strip_cfg["enemy_direction"]
    )
    prefer = disc.get("prefer_animation_folder")
    kws = disc.get("animation_folder_keywords", ["idle"])
    frames = frames_from_zip(str(zip_path), direction, prefer, kws)
    strip = build_strip_from_frames(frames, square, n)
    return strip


def main() -> None:
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (AttributeError, OSError):
        pass
    root = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--recipe", default=str(root / "pixellab_recipe.json"))
    ap.add_argument("--characters", default=str(root / "pixellab_characters.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--zips-dir",
        default="",
        help="Only build sheets from {id}.zip in this folder (no API calls)",
    )
    ap.add_argument("--only", default="", help="Comma-separated character ids to process")
    args = ap.parse_args()

    recipe = load_json(args.recipe)
    chars: list[dict] = load_json(args.characters)
    only = {x.strip() for x in args.only.split(",") if x.strip()}
    if only:
        chars = [c for c in chars if c["id"] in only]

    base = recipe["api_base"]
    interval = float(recipe.get("poll_seconds", 5))
    timeout = float(recipe.get("poll_timeout_seconds", 1800))
    token = os.environ.get("PIXELLAB_API_TOKEN", "").strip()

    zips_dir = Path(args.zips_dir) if args.zips_dir else None

    if args.dry_run:
        print(f"Would process {len(chars)} characters")
        print(f"API base: {base}")
        print(f"Zips-only dir: {zips_dir or '(none)'}")
        for c in chars:
            print(f"  - {c['id']} -> {c['output_idle_sheet']}")
        return

    if not zips_dir and not token:
        print(
            "Set PIXELLAB_API_TOKEN for API generation, or pass --zips-dir with {id}.zip files.",
            file=sys.stderr,
        )
        sys.exit(1)

    for c in chars:
        cid = c["id"]
        out_sheet = root / c["output_idle_sheet"]
        print(f"=== {cid} -> {out_sheet} ===")
        zip_path = (zips_dir / f"{cid}.zip") if zips_dir else None

        if zips_dir:
            if not zip_path or not zip_path.is_file():
                print(f"  SKIP: missing {zip_path}")
                continue
        else:
            export_dir = root / "pixellab_exports"
            export_dir.mkdir(exist_ok=True)
            zip_path = export_dir / f"{cid}.zip"

            char_cfg = recipe["character"]
            anim_cfg = recipe["animation"]
            strip_cfg = recipe["strip"]

            print("  create_character (8-dir)...")
            character_id, job_id = create_character_8dir(base, token, c["description"], char_cfg)
            poll_job(base, token, job_id, interval, timeout)

            direction = (
                strip_cfg["player_direction"]
                if c["role"] == "player"
                else strip_cfg["enemy_direction"]
            )
            print(f"  queue idle animation ({direction})...")
            anim_jobs = queue_idle_animation(
                base, token, character_id, anim_cfg, [direction]
            )
            for jid in anim_jobs:
                poll_job(base, token, jid, interval, timeout)
            if not anim_jobs:
                print("  (no animation job ids; waiting 30s then attempting ZIP)")
                time.sleep(30)

            print("  download ZIP...")
            download_zip(base, token, character_id, zip_path)

        print("  build strip...")
        strip = sheet_from_zip_file(zip_path, recipe, c["role"])
        out_sheet.parent.mkdir(parents=True, exist_ok=True)
        strip.save(str(out_sheet))
        print(f"  wrote {out_sheet} ({strip.size[0]}x{strip.size[1]})")


if __name__ == "__main__":
    main()
