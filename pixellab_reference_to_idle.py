"""
Build a game idle sheet from a concept/reference image using PixelLab API v2.

Pipeline:
  1) POST /generate-8-rotations-v2  method=create_from_concept  (concept art -> 8-dir character)
  2) Poll background job -> character_id
  3) POST /characters/animations  (idle template, east for player-facing-right)
  4) Download character ZIP -> horizontal strip (pixellab_strip_sheet)

Requires PIXELLAB_API_TOKEN or Bearer in %USERPROFILE%\\.cursor\\mcp.json

Example:
  python pixellab_reference_to_idle.py --image assets/reference_STR_knight_concept.png \\
      --output assets/player_STR_idle_sheet.png
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import sys
from pathlib import Path

from PIL import Image

from pixellab_batch_idle_sheets import (
    api_request,
    download_zip,
    load_json,
    poll_job,
    queue_idle_animation,
    sheet_from_zip_file,
    unwrap_response,
)


def token_from_mcp_json() -> str:
    path = Path.home() / ".cursor" / "mcp.json"
    if not path.is_file():
        return ""
    data = json.loads(path.read_text(encoding="utf-8"))
    auth = (
        data.get("mcpServers", {})
        .get("pixellab", {})
        .get("headers", {})
        .get("Authorization", "")
    )
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    return ""


def prepare_concept_png(path: Path, max_side: int = 1024) -> tuple[bytes, int, int]:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1.0:
        nw = max(1, int(round(w * scale)))
        nh = max(1, int(round(h * scale)))
        im = im.resize((nw, nh), Image.Resampling.LANCZOS)
        w, h = nw, nh
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue(), w, h


def b64_data_url(png_bytes: bytes) -> str:
    b64 = base64.standard_b64encode(png_bytes).decode("ascii")
    return f"data:image/png;base64,{b64}"


def extract_character_id(job_payload: dict) -> str:
    lr = job_payload.get("last_response")
    if isinstance(lr, str):
        try:
            lr = json.loads(lr)
        except json.JSONDecodeError:
            lr = None
    if isinstance(lr, dict):
        cid = lr.get("character_id")
        if cid:
            return str(cid)
    cid = job_payload.get("character_id")
    if cid:
        return str(cid)
    raise RuntimeError(f"No character_id in job payload: {job_payload}")


def main() -> None:
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (AttributeError, OSError):
        pass

    root = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True, type=Path, help="Concept / reference image (PNG/JPG)")
    ap.add_argument(
        "--output",
        type=Path,
        default=root / "assets" / "player_STR_idle_sheet.png",
        help="Idle sprite sheet output path",
    )
    ap.add_argument("--recipe", type=Path, default=root / "pixellab_recipe.json")
    ap.add_argument(
        "--description",
        default=(
            "Heavily armored dark fantasy knight, black plate with spiked pauldrons, "
            "tattered crimson cape and tabard, helmet with glowing white eyes and grimacing teeth, "
            "massive notched greatsword dragging with sparks, Darkest Dungeon ink style, "
            "heavy black linework and cross-hatching, high contrast, side view hero"
        ),
    )
    ap.add_argument(
        "--rotation-size",
        type=int,
        default=64,
        help="Output rotation cell size (width and height) for PixelLab character",
    )
    args = ap.parse_args()

    token = os.environ.get("PIXELLAB_API_TOKEN", "").strip() or token_from_mcp_json()
    if not token:
        print("Set PIXELLAB_API_TOKEN or add pixellab Bearer token to ~/.cursor/mcp.json", file=sys.stderr)
        sys.exit(1)

    recipe = load_json(str(args.recipe))
    base = recipe["api_base"]
    interval = float(recipe.get("poll_seconds", 5))
    timeout = float(recipe.get("poll_timeout_seconds", 1800))
    strip_cfg = recipe["strip"]
    direction = strip_cfg.get("player_direction", "east")

    img_path = args.image if args.image.is_absolute() else root / args.image
    if not img_path.is_file():
        print(f"Image not found: {img_path}", file=sys.stderr)
        sys.exit(1)

    png_bytes, cw, ch = prepare_concept_png(img_path)
    data_url = b64_data_url(png_bytes)

    body = {
        "method": "create_from_concept",
        "concept_image": {
            "image": {"type": "base64", "base64": data_url, "format": "png"},
            "width": cw,
            "height": ch,
        },
        "description": args.description,
        "image_size": {"width": args.rotation_size, "height": args.rotation_size},
        "view": "side",
        "no_background": True,
    }

    print("Submitting generate-8-rotations-v2 (create_from_concept)...")
    res = unwrap_response(
        api_request(base, token, "POST", "/generate-8-rotations-v2", body)
    )
    job_id = res.get("background_job_id")
    if not job_id:
        raise SystemExit(f"Unexpected response: {res}")

    print(f"Polling job {job_id}...")
    done = poll_job(base, token, job_id, interval, timeout)
    character_id = extract_character_id(done)
    print(f"Character ready: {character_id}")

    anim_cfg = recipe["animation"]
    print(f"Queue idle animation ({direction})...")
    anim_jobs = queue_idle_animation(
        base, token, character_id, anim_cfg, [direction]
    )
    for jid in anim_jobs:
        poll_job(base, token, jid, interval, timeout)

    export_dir = root / "pixellab_exports"
    export_dir.mkdir(exist_ok=True)
    zip_path = export_dir / "reference_STR_character.zip"
    print("Downloading ZIP...")
    download_zip(base, token, character_id, zip_path)

    print("Building idle sheet...")
    strip = sheet_from_zip_file(zip_path, recipe, "player")
    out = args.output if args.output.is_absolute() else root / args.output
    out.parent.mkdir(parents=True, exist_ok=True)
    strip.save(str(out))
    print(f"Wrote {out} ({strip.size[0]}x{strip.size[1]})")


if __name__ == "__main__":
    main()
