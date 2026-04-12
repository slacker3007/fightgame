"""
Generate horizontal 8-frame idle sprite sheets from a reference PNG using Gemini image models.

Requires GEMINI_API_KEY or GOOGLE_API_KEY in the environment.

Example:
  pip install -r requirements-gemini.txt
  set GEMINI_API_KEY=...
  python gemini_idle_sheet_options.py

See https://ai.google.dev/gemini-api/docs/image-generation for model IDs.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from google import genai
from google.genai import types
from PIL import Image


# Override with GEMINI_IMAGE_MODEL env or --model (must support image output).
DEFAULT_MODEL = "gemini-2.5-flash-image"

PRESET_OPTIONS: list[tuple[str, str]] = [
    (
        "option_01_subtle",
        "Using the reference character (same armor, shield, mace, proportions, and pixel-art style), "
        "output ONE horizontal sprite sheet: exactly 8 equal-width frames in a single row, left to right, "
        "showing a subtle idle loop: gentle breathing, tiny shield sway, minimal foot shift. "
        "Transparent background. Do not add text, UI, or borders.",
    ),
    (
        "option_02_weight_shift",
        "Using the reference character (keep design and style faithful), "
        "output ONE horizontal sprite sheet: exactly 8 equal-width frames in a single row, left to right, "
        "idle animation with a heavier defender feel: clear weight shift between feet, shield dips slightly, "
        "mace arm relaxes and tightens. Transparent background. No text or frames around cells.",
    ),
    (
        "option_03_minimal_motion",
        "Using the reference character (match silhouette and pixels closely), "
        "output ONE horizontal sprite sheet: exactly 8 equal-width frames in a single row, left to right, "
        "very minimal motion optimized for small pixel readability—almost static with only micro-movement. "
        "Transparent background. No labels.",
    ),
]


def _api_key() -> str:
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""


def _iter_response_parts(response) -> list:
    parts = getattr(response, "parts", None)
    if parts:
        return list(parts)
    cands = getattr(response, "candidates", None) or []
    if not cands:
        return []
    content = getattr(cands[0], "content", None)
    if content is None:
        return []
    return list(getattr(content, "parts", None) or [])


def _part_to_pil(part) -> Image.Image | None:
    if getattr(part, "inline_data", None) is not None:
        data = getattr(part.inline_data, "data", None)
        if data:
            import base64
            import io

            raw = base64.b64decode(data) if isinstance(data, str) else data
            return Image.open(io.BytesIO(raw)).convert("RGBA")
    fn = getattr(part, "as_image", None)
    if callable(fn):
        try:
            img = fn()
            if img is not None:
                return img.convert("RGBA")
        except Exception:
            pass
    return None


def extract_first_image_pil(response) -> Image.Image | None:
    for part in _iter_response_parts(response):
        img = _part_to_pil(part)
        if img is not None:
            return img
    return None


def normalize_sheet(img: Image.Image, frame_w: int, frame_h: int) -> Image.Image:
    target_w, target_h = frame_w * 8, frame_h
    if img.size == (target_w, target_h):
        return img
    return img.resize((target_w, target_h), Image.Resampling.LANCZOS)


def run_option(
    client: genai.Client,
    model: str,
    ref: Image.Image,
    prompt: str,
    frame_w: int,
    frame_h: int,
    image_config: types.ImageConfig | None,
) -> Image.Image:
    contents: list = [prompt, ref]
    cfg_kwargs: dict = {"response_modalities": ["TEXT", "IMAGE"]}
    if image_config is not None:
        cfg_kwargs["image_config"] = image_config
    config = types.GenerateContentConfig(**cfg_kwargs)
    response = client.models.generate_content(model=model, contents=contents, config=config)
    out = extract_first_image_pil(response)
    if out is None:
        raise RuntimeError("No image in model response (check model name and billing).")
    return normalize_sheet(out, frame_w, frame_h)


def main() -> int:
    root = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description="Gemini idle sheet variants from a reference PNG")
    ap.add_argument("--reference", type=Path, default=root / "assets" / "player_STA.png")
    ap.add_argument("--out-dir", type=Path, default=root / "assets" / "dev_idle_sta")
    ap.add_argument("--model", default=os.environ.get("GEMINI_IMAGE_MODEL", DEFAULT_MODEL))
    ap.add_argument(
        "--aspect-ratio",
        default="",
        metavar="RATIO",
        help='Optional ImageConfig aspect ratio (e.g. "21:9" for a wide strip). Omit for default.',
    )
    ap.add_argument(
        "--image-size",
        default="",
        metavar="SIZE",
        help='Optional image size: "1K", "2K", or "4K". Used with --aspect-ratio.',
    )
    args = ap.parse_args()

    key = _api_key()
    if not key:
        print("Set GEMINI_API_KEY or GOOGLE_API_KEY.", file=sys.stderr)
        return 1

    ref_path = args.reference
    if not ref_path.is_file():
        print(f"Reference not found: {ref_path}", file=sys.stderr)
        return 1

    ref = Image.open(ref_path).convert("RGBA")
    bbox = ref.getbbox()
    if not bbox:
        print("Reference image is fully transparent.", file=sys.stderr)
        return 1
    frame_w, frame_h = ref.size

    args.out_dir.mkdir(parents=True, exist_ok=True)

    client = genai.Client(api_key=key)

    image_cfg: types.ImageConfig | None = None
    if args.aspect_ratio:
        iz = args.image_size or "1K"
        image_cfg = types.ImageConfig(aspect_ratio=args.aspect_ratio, image_size=iz)

    for slug, prompt in PRESET_OPTIONS:
        out_file = args.out_dir / f"{slug}.png"
        print(f"Generating {slug} with {args.model}...")
        sheet = run_option(client, args.model, ref, prompt, frame_w, frame_h, image_cfg)
        sheet.save(out_file)
        print(f"  Wrote {out_file} ({sheet.size[0]}x{sheet.size[1]})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
