"""
Build horizontal idle sprite sheets for Gauntlet Arena (matches js/render.js drawSprite).

Output: (num_frames * S) x S PNG, transparent background, each cell SxS.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

from PIL import Image


def natural_key(path: Path) -> list:
    s = path.name
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def trim_and_fit_square(im: Image.Image, square: int) -> Image.Image:
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if not bbox:
        return Image.new("RGBA", (square, square), (0, 0, 0, 0))
    cropped = im.crop(bbox)
    cw, ch = cropped.size
    scale = min(square / cw, square / ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (square, square), (0, 0, 0, 0))
    ox = (square - nw) // 2
    oy = (square - nh) // 2
    out.paste(resized, (ox, oy), resized)
    return out


def build_strip_from_frames(frames: list[Image.Image], square: int, num_frames: int) -> Image.Image:
    if len(frames) < num_frames:
        raise ValueError(f"Need at least {num_frames} frames, got {len(frames)}")
    frames = frames[:num_frames]
    row = Image.new("RGBA", (square * num_frames, square), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        cell = trim_and_fit_square(fr, square)
        row.paste(cell, (i * square, 0))
    return row


def split_horizontal_sheet(sheet_path: str, num_frames: int) -> list[Image.Image]:
    im = Image.open(sheet_path).convert("RGBA")
    w, h = im.size
    fw = w // num_frames
    if fw * num_frames != w:
        raise ValueError(f"Sheet width {w} not divisible by num_frames {num_frames}")
    return [im.crop((i * fw, 0, (i + 1) * fw, h)) for i in range(num_frames)]


def collect_pngs(directory: Path) -> list[Path]:
    return sorted(directory.rglob("*.png"), key=natural_key)


def discover_animation_frames(
    root: Path,
    direction: str,
    prefer_folder: str | None,
    keywords: list[str],
) -> list[Path]:
    direction = direction.lower()
    all_pngs = collect_pngs(root)
    if not all_pngs:
        return []

    def path_has_direction(p: Path) -> bool:
        return direction in [part.lower() for part in p.parts]

    directed = [p for p in all_pngs if path_has_direction(p)]
    pool = directed if directed else all_pngs

    prefer = (prefer_folder or "").lower()

    def score_path(p: Path) -> int:
        ps = str(p).lower()
        s = 0
        if prefer and prefer in ps:
            s += 20
        for k in keywords:
            if k.lower() in ps:
                s += 3
        if path_has_direction(p):
            s += 5
        return s

    best = max((score_path(p) for p in pool), default=0)
    candidates = [p for p in pool if score_path(p) == best]
    by_parent: dict[Path, list[Path]] = {}
    for p in candidates:
        by_parent.setdefault(p.parent, []).append(p)
    best_parent = max(by_parent, key=lambda par: len(by_parent[par]))
    return sorted(by_parent[best_parent], key=natural_key)


def frames_from_zip(
    zip_path: str,
    direction: str,
    prefer_folder: str | None,
    keywords: list[str],
) -> list[Image.Image]:
    tmp = tempfile.mkdtemp(prefix="pixellab_zip_")
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmp)
        paths = discover_animation_frames(Path(tmp), direction, prefer_folder, keywords)
        if len(paths) < 4:
            raise RuntimeError(
                f"Too few PNGs matched (got {len(paths)}). "
                f"Try --frames-dir with an explicit folder. "
                f"ZIP had {len(list(Path(tmp).rglob('*.png')))} total PNGs."
            )
        return [Image.open(p).copy() for p in paths]
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main() -> None:
    ap = argparse.ArgumentParser(description="Build horizontal idle sheet for fightgame render.js")
    ap.add_argument("--output", "-o", required=True, help="Output PNG path")
    ap.add_argument("--square", type=int, default=64, help="Cell size S (square frames)")
    ap.add_argument("--num-frames", type=int, default=8, help="Frame count N")
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--frames-dir",
        help="Directory of ordered PNG frames (sorted by filename)",
    )
    group.add_argument("--zip", help="PixelLab character export ZIP")
    group.add_argument(
        "--split-sheet",
        help="Existing horizontal sheet to re-pack (validates pipeline)",
    )
    ap.add_argument(
        "--direction",
        default="east",
        help="For --zip: direction folder name (east, west, ...)",
    )
    ap.add_argument(
        "--prefer-animation",
        default="fight-stance-idle-8-frames",
        help="For --zip: substring to prefer in paths",
    )
    ap.add_argument(
        "--keywords",
        default="fight-stance-idle,idle,breathing",
        help="For --zip: comma-separated path substrings to score matches",
    )
    args = ap.parse_args()

    square = args.square
    n = args.num_frames

    if args.split_sheet:
        frames = split_horizontal_sheet(args.split_sheet, n)
    elif args.frames_dir:
        d = Path(args.frames_dir)
        paths = sorted(d.glob("*.png"), key=natural_key)
        if len(paths) < n:
            paths = collect_pngs(d)[: max(n, len(paths))]
        if len(paths) < n:
            raise SystemExit(f"Need {n} PNGs in {d}, found {len(paths)}")
        frames = [Image.open(p).copy() for p in paths[:n]]
    else:
        kws = [k.strip() for k in args.keywords.split(",") if k.strip()]
        frames = frames_from_zip(args.zip, args.direction, args.prefer_animation or None, kws)

    strip = build_strip_from_frames(frames, square, n)
    out_path = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    strip.save(out_path)
    print(f"Wrote {out_path} ({strip.size[0]}x{strip.size[1]})")


if __name__ == "__main__":
    main()
