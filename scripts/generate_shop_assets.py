#!/usr/bin/env python3
"""
Generate shop UI PNGs for Gauntlet Arena (assets/).

Style target: grimdark fantasy UI (Darkest Dungeon–adjacent: weathered wood, iron,
deep shadows, desaturated browns; Drifters-adjacent: harsh contrast, blood/rust
accents). Avoid clean vector / mobile gradients.

Uses Gemini when GOOGLE_API_KEY is set; otherwise Pillow placeholders with grain
and chiaroscuro.

Resize: API images are resized to expected dimensions so the canvas layout stays stable.
Override model: GEMINI_IMAGE_MODEL (default: gemini-2.5-flash-image, same family as gemini-image MCP).

Mystery boxes: --mystery-boxes-only — Drifters-anime × Darkest Dungeon fusion (see mystery_box_gemini_prompt).
Optional GEMINI_MYSTERY_DELAY_SEC between API calls to reduce rate limits.
"""
from __future__ import annotations

import io
import os
import random
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

# Target sizes (width, height) for each output filename after Gemini or Pillow.
TARGET_SIZE_PX = {
    "gold.png": (72, 72),
    "shop_bg.png": (956, 650),
    "camp_icon_shop.png": (281, 297),
    "mystery_box_0.png": (256, 200),
    "mystery_box_1.png": (256, 200),
    "mystery_box_2.png": (256, 200),
    "mystery_box_3.png": (256, 200),
    "mystery_box_4.png": (256, 200),
    "mystery_box_5.png": (256, 200),
}


def resize_to_target(im: "object", path: Path) -> None:
    from PIL import Image

    if not isinstance(im, Image.Image):
        return
    key = path.name
    if key not in TARGET_SIZE_PX:
        return
    tw, th = TARGET_SIZE_PX[key]
    if im.size != (tw, th):
        im = im.convert("RGBA").resize((tw, th), Image.Resampling.LANCZOS)
    im.save(path, "PNG")


def _noise_overlay(im, alpha_range=(0.03, 0.12), count=900):
    from PIL import ImageDraw

    w, h = im.size
    d = ImageDraw.Draw(im, "RGBA")
    rng = random.Random(42)
    for _ in range(count):
        x = rng.randint(0, w - 1)
        y = rng.randint(0, h - 1)
        a = int(255 * rng.uniform(*alpha_range))
        if rng.random() > 0.5:
            d.point((x, y), (0, 0, 0, a))
        else:
            d.point((x, y), (90, 75, 60, a // 2))


def write_gold_png(path: Path) -> None:
    from PIL import Image, ImageDraw, ImageFilter

    size = 72
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    margin = 5
    d.ellipse(
        (margin, margin, size - margin, size - margin),
        fill=(140, 110, 55, 255),
        outline=(35, 28, 22, 255),
        width=3,
    )
    d.ellipse((12, 12, size - 12, size - 12), fill=(175, 140, 70, 255), outline=(50, 40, 30, 200), width=1)
    d.arc((14, 14, size - 14, size - 14), start=200, end=320, fill=(220, 190, 120, 180), width=4)
    im = im.filter(ImageFilter.GaussianBlur(0.35))
    _noise_overlay(im, (0.02, 0.08), 400)
    im.save(path, "PNG")


def write_shop_bg(path: Path) -> None:
    from PIL import Image, ImageDraw, ImageFilter

    w, h = 956, 650
    im = Image.new("RGBA", (w, h), (18, 14, 16, 255))
    d = ImageDraw.Draw(im)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(22 + t * 8 + 6 * (t * t))
        g = int(16 + t * 10)
        b = int(20 + t * 12)
        d.line([(0, y), (w, y)], fill=(r, g, b, 255))
    for x in (0, w - 1):
        for y in range(h):
            v = int(25 * (1 - abs(y / h - 0.5) * 2))
            p = im.getpixel((x, y))
            im.putpixel((x, y), (max(0, p[0] - v), max(0, p[1] - v), max(0, p[2] - v), 255))
    d.rounded_rectangle((36, 76, w - 36, h - 36), radius=4, outline=(55, 42, 38, 220), width=3)
    d.rounded_rectangle((40, 80, w - 40, h - 40), radius=2, outline=(90, 72, 58, 90), width=1)
    _noise_overlay(im, (0.025, 0.11), 2800)
    im = im.filter(ImageFilter.GaussianBlur(0.4))
    im.save(path, "PNG")


def write_camp_shop_icon(path: Path) -> None:
    from PIL import Image, ImageDraw

    w, h = 281, 297
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((10, 10, w - 10, h - 10), radius=6, fill=(24, 20, 22, 250), outline=(55, 42, 36, 255), width=3)
    for i in range(8):
        y = 95 + i * 14
        d.line([(40, y), (w - 40, y)], fill=(45, 38, 34, 255), width=1)
    d.rectangle((48, 200, w - 48, 248), fill=(32, 26, 24, 255), outline=(70, 55, 45, 255), width=2)
    aw = [(48, 118), (w - 48, 118), (w - 38, 78), (58, 78)]
    d.polygon(aw, fill=(52, 32, 28, 255), outline=(90, 60, 48, 255))
    for j in range(6):
        x0 = 58 + j * 28
        d.line([(x0, 118), (x0 + 8, 78)], fill=(30, 22, 20, 255), width=2)
    d.ellipse((w // 2 - 22, 38, w // 2 + 22, 72), fill=(55, 40, 25, 255), outline=(120, 90, 50, 200), width=2)
    d.ellipse((w // 2 - 10, 48, w // 2 + 10, 64), fill=(200, 150, 70, 90))
    d.rectangle((w // 2 - 3, 210, w // 2 + 3, 248), fill=(60, 50, 45, 255))
    _noise_overlay(im, (0.04, 0.12), 700)
    im.save(path, "PNG")


def write_mystery_box(path: Path, tier: int, accent: tuple[int, int, int]) -> None:
    """Fallback crate when Gemini is unavailable: bold Drifters-like ink edges + DD grime (not final art)."""
    from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

    w, h = 256, 200
    rng = random.Random(3000 + tier * 19)
    ar, ag, ab = accent
    im = Image.new("RGBA", (w, h), (8, 7, 9, 255))
    d = ImageDraw.Draw(im)
    body = (28, 58, w - 28, h - 26)
    # Cel-ish planks with thick black "anime" outlines
    plank = 22
    x = body[0]
    while x < body[2] - 2:
        pw = plank + rng.randint(-4, 5)
        fill = (32 + tier * 2 + rng.randint(0, 8), 24 + rng.randint(0, 6), 20 + rng.randint(0, 5), 255)
        d.rectangle((x, body[1], min(x + pw, body[2]), body[3]), fill=fill, outline=(0, 0, 0, 255), width=3)
        x += pw
    for yy in (body[1] + 20, body[3] - 34):
        d.rectangle((body[0] - 4, yy, body[2] + 4, yy + 7), fill=(40, 38, 42, 255), outline=(0, 0, 0, 255), width=2)
    lid = (22, 22, w - 22, 60)
    d.rounded_rectangle((lid[0], lid[1] + 4, lid[2], lid[3] + 4), radius=4, fill=(0, 0, 0, 180))
    d.rounded_rectangle(lid, radius=4, fill=(48 + tier, 32, 26, 255), outline=(0, 0, 0, 255), width=3)
    lx = w // 2
    d.rectangle((lx - 11, 84, lx + 11, 120), fill=(26, 24, 28, 255), outline=(0, 0, 0, 255), width=2)
    d.rectangle((body[0] + 6, body[1] + 32, body[2] - 6, body[1] + 38), fill=(ar // 4, ag // 4, ab // 4, 240))
    if tier >= 4:
        for _ in range(500):
            im.putpixel((rng.randint(16, w - 16), rng.randint(18, h - 14)), (0, 0, 0, rng.randint(30, 100)))
    if tier >= 5:
        for _ in range(200):
            im.putpixel((rng.randint(body[0], body[2]), rng.randint(body[1], lid[3])), (70, 25, 55, rng.randint(40, 110)))
    _noise_overlay(im, (0.05, 0.16), 900)
    im = im.filter(ImageFilter.GaussianBlur(0.2))
    im = ImageEnhance.Contrast(im).enhance(1.18)
    im.save(path, "PNG")


def _resolve_google_api_key() -> str:
    k = os.environ.get("GOOGLE_API_KEY", "").strip() or os.environ.get("GEMINI_API_KEY", "").strip()
    if k:
        return k
    mcp = ROOT / ".cursor" / "mcp.json"
    if mcp.is_file():
        import json

        try:
            data = json.loads(mcp.read_text(encoding="utf-8"))
            env = (data.get("mcpServers") or {}).get("gemini-image", {}).get("env") or {}
            return (env.get("GOOGLE_API_KEY") or env.get("GEMINI_API_KEY") or "").strip()
        except (OSError, json.JSONDecodeError, TypeError, AttributeError):
            pass
    return ""


def try_gemini_image(
    prompt: str,
    out_path: Path,
    ref_paths: list[Path] | None = None,
    image_aspect: str | None = None,
) -> bool:
    key = _resolve_google_api_key()
    if not key:
        print(f"Gemini skip ({out_path.name}): GOOGLE_API_KEY / GEMINI_API_KEY not set.", file=sys.stderr)
        return False
    try:
        from google import genai
        from google.genai import types
        from PIL import Image
    except ImportError:
        print("Gemini skip: google-genai or Pillow not installed.", file=sys.stderr)
        return False

    client = genai.Client(api_key=key)
    model = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
    req_parts: list = [types.Part.from_text(text=prompt)]
    for rp in ref_paths or []:
        try:
            if not rp.is_file():
                continue
            data = rp.read_bytes()
            mime = "image/png" if rp.suffix.lower() == ".png" else "image/jpeg"
            req_parts.append(types.Part.from_bytes(data=data, mime_type=mime))
        except OSError:
            continue
    cfg_kwargs: dict = {"response_modalities": ["IMAGE"], "candidate_count": 1}
    if image_aspect:
        try:
            cfg_kwargs["image_config"] = types.ImageConfig(aspect_ratio=image_aspect)
        except (TypeError, AttributeError):
            pass
    try:
        r = client.models.generate_content(
            model=model,
            contents=[types.Content(role="user", parts=req_parts)],
            config=types.GenerateContentConfig(**cfg_kwargs),
        )
    except Exception as e:
        print(f"Gemini fail ({out_path.name}) model={model!r}: {e}", file=sys.stderr)
        return False

    out_parts: list = []
    if r.candidates:
        for c in r.candidates:
            if c.content and c.content.parts:
                out_parts.extend(c.content.parts)
    for p in out_parts:
        inline = getattr(p, "inline_data", None)
        if inline is None:
            continue
        data = getattr(inline, "data", None)
        if data:
            raw = data if isinstance(data, (bytes, bytearray)) else bytes(data)
            im = Image.open(io.BytesIO(raw))
            resize_to_target(im, out_path)
            return True
    print(f"Gemini skip ({out_path.name}): no image bytes in response.", file=sys.stderr)
    return False


CAMP_SHOP_ICON_PROMPT = (
    "Portrait-rectangle camp menu tile 281 pixels wide by 297 pixels tall (same slot size as neighboring CHAMPION and BATTLE icons), "
    "main-camp SHOP menu tile matching the FIRST reference image "
    "(game main menu) style: same dark gothic cathedral fantasy mood as CHAMPION and BATTLE tiles. "
    "Heavy weathered dark iron and carved stone square frame with ornate corners, subtle spikes or filigree like "
    "the battle tile, chipped and soot-stained. Inside: one focal subject — iron-bound wooden treasure chest "
    "slightly open with glowing gold coins, OR merchant leather coin pouch on a chain — painterly, high detail, "
    "forged worn metal, not flat vector. Behind the subject: intense roaring fire in deep reds and bright "
    "oranges like the neighboring menu buttons, embers and heat haze. Dramatic chiaroscuro, fire light reflecting "
    "on gold and iron. Grimdark hand-painted game UI, no text, no letters, no watermark, no outer browser frame."
)


def mystery_box_gemini_prompt(tier_index: int, accent: tuple[int, int, int]) -> str:
    """Prompts for gemini-image MCP / Gemini API: Drifters-style harsh anime staging + Darkest Dungeon painterly decay."""
    ar, ag, ab = accent
    moods = [
        "TIER 1 / common: small battered travel crate, humble proportions, splintered planks, thin iron bands, mud-splashed corners, weak lock — feels expendable.",
        "TIER 2 / seasoned: military footlocker energy, colder grey-brown wood, hammered steel straps, salt and dust in crevices, sturdier hasp.",
        "TIER 3 / uneasy: heavier coffer, blue-black tarnished iron, faint sickly cyan catchlight only inside deepest cracks, wood feels 'wrong', slightly tilted lid.",
        "TIER 4 / officer: denser hardwood, oxidized brass corners, riveted bands, weight and status, proud metal lock plate catching one hard rim light.",
        "TIER 5 / war-trophy: burn scorch along lid edge, warm dull gold glints on rivets, deep gouges, imposing padlock, story of survival.",
        "TIER 6 / cursed: violated wood, bruised violet and dried-blood burgundy pooling in under-lid shadow, warped hinges, subtle wrongness, maximum dread.",
    ]
    mood = moods[tier_index] if tier_index < len(moods) else moods[-1]
    return (
        "VIDEO GAME SHOP UI ICON — single mystery loot chest, unified 'unit box' framing: same camera height and chest scale as a set of six tiers, "
        "wide LANDSCAPE composition (~4:3), chest centered, small floor shadow, fills frame with narrow margin. "
        "ART DIRECTION — fuse TWO looks: (A) Drifters / dark seinen ANIME: aggressive graphic read, thick sculptural shadows like ink blocks, "
        "razor rim lights on iron edges, sharp angular speculars, dynamic slight low-angle hero shot, bold silhouette readable at tiny size, "
        "controlled palette (no pastel moe, no glossy gacha). "
        "(B) Darkest Dungeon: hand-painted inventory texture, stress and decay, crosshatched grime, rust blooms, organic wood rot, paper grain, "
        "desaturated earth and iron, crimson shadow accents. "
        f"{mood} "
        f"Optional accent hint only (strap stain / rust / rim light), approximate mood RGB ({ar}, {ag}, {ab}) — never a flat color overlay. "
        "One object only (the chest). No characters, faces, logos, readable text, numbers, watermark, or UI frame outside the prop."
    )


def camp_shop_style_refs(extra: Path | None = None) -> list[Path]:
    refs: list[Path] = []
    if extra is not None and extra.is_file():
        refs.append(extra)
    envp = os.environ.get("CAMP_SHOP_REF", "").strip()
    if envp:
        refs.append(Path(envp))
    p = ASSETS / "_menu_style_ref.png"
    if p.is_file():
        refs.append(p)
    seen: set[str] = set()
    uniq: list[Path] = []
    for r in refs:
        k = str(r.resolve())
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    return uniq


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)

    dd = (
        "Darkest Dungeon inspired: hand-painted look, heavy black shadows, weathered wood and wrought iron, "
        "desaturated browns and deep crimson rust, visible grain and grime, chiaroscuro, NOT clean vector, "
        "NOT neon, NOT glossy mobile UI, no text, no watermark"
    )

    jobs = [
        ("gold.png", f"Ancient tarnished gold coin for grimdark RPG HUD, edge wear, {dd}", write_gold_png),
        ("shop_bg.png", f"956x650 interior merchant stall in ruined stone hall, dim torchlight, {dd}", write_shop_bg),
        ("camp_icon_shop.png", CAMP_SHOP_ICON_PROMPT, write_camp_shop_icon),
    ]
    tier_colors = [
        (95, 75, 58),
        (88, 82, 78),
        (72, 78, 92),
        (110, 95, 88),
        (130, 95, 55),
        (92, 58, 72),
    ]
    for i, rgb in enumerate(tier_colors):
        fn = f"mystery_box_{i}.png"

        def writer(p: Path, _i=i, c=rgb):
            write_mystery_box(p, _i, c)

        jobs.append(
            (
                fn,
                mystery_box_gemini_prompt(i, rgb),
                writer,
            )
        )

    for filename, prompt, fallback in jobs:
        out = ASSETS / filename
        refs = camp_shop_style_refs(None) if filename == "camp_icon_shop.png" else None
        if filename == "camp_icon_shop.png":
            aspect = None
        elif filename.startswith("mystery_box_") and filename.endswith(".png"):
            aspect = "4:3"
        else:
            aspect = None
        if try_gemini_image(prompt, out, ref_paths=refs, image_aspect=aspect):
            print(f"OK (Gemini): {out.relative_to(ROOT)}")
        else:
            tmp = out.with_suffix(out.suffix + ".tmp.png")
            fallback(tmp)
            from PIL import Image

            resize_to_target(Image.open(tmp), out)
            tmp.unlink(missing_ok=True)
            print(f"OK (Pillow): {out.relative_to(ROOT)}")


def run_shop_bg_and_chests_only() -> None:
    """Regenerate shop_bg + mystery_box_0..5 only (plan scope; skips gold/camp icon)."""
    ASSETS.mkdir(parents=True, exist_ok=True)
    dd = (
        "Darkest Dungeon inspired: hand-painted look, heavy black shadows, weathered wood and wrought iron, "
        "desaturated browns and deep crimson rust, visible grain and grime, chiaroscuro, NOT clean vector, "
        "NOT neon, NOT glossy mobile UI, no text, no watermark"
    )
    out_bg = ASSETS / "shop_bg.png"
    prompt_bg = f"956x650 interior merchant stall in ruined stone hall, dim torchlight, {dd}"
    if try_gemini_image(prompt_bg, out_bg, ref_paths=None, image_aspect=None):
        print(f"OK (Gemini): {out_bg.relative_to(ROOT)}")
    else:
        tmp = out_bg.with_suffix(out_bg.suffix + ".tmp.png")
        write_shop_bg(tmp)
        from PIL import Image

        resize_to_target(Image.open(tmp), out_bg)
        tmp.unlink(missing_ok=True)
        print(f"OK (Pillow): {out_bg.relative_to(ROOT)}")
    run_mystery_boxes_only()


def run_mystery_boxes_only() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    delay = float(os.environ.get("GEMINI_MYSTERY_DELAY_SEC", "0") or 0)
    tier_colors = [
        (95, 75, 58),
        (88, 82, 78),
        (72, 78, 92),
        (110, 95, 88),
        (130, 95, 55),
        (92, 58, 72),
    ]
    for i, rgb in enumerate(tier_colors):
        if i > 0 and delay > 0:
            time.sleep(delay)
        fn = f"mystery_box_{i}.png"
        out = ASSETS / fn
        prompt = mystery_box_gemini_prompt(i, rgb)
        if try_gemini_image(prompt, out, ref_paths=None, image_aspect="4:3"):
            print(f"OK (Gemini): {out.relative_to(ROOT)}")
            continue
        tmp = out.with_suffix(out.suffix + ".tmp.png")
        write_mystery_box(tmp, i, rgb)
        from PIL import Image

        resize_to_target(Image.open(tmp), out)
        tmp.unlink(missing_ok=True)
        print(f"OK (Pillow): {out.relative_to(ROOT)}")


def run_camp_shop_only(ref: Path | None) -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    out = ASSETS / "camp_icon_shop.png"
    refs = camp_shop_style_refs(ref)
    if try_gemini_image(CAMP_SHOP_ICON_PROMPT, out, ref_paths=refs or None, image_aspect=None):
        print(f"OK (Gemini): {out.relative_to(ROOT)}")
        return
    tmp = out.with_suffix(out.suffix + ".tmp.png")
    write_camp_shop_icon(tmp)
    from PIL import Image

    resize_to_target(Image.open(tmp), out)
    tmp.unlink(missing_ok=True)
    print(f"OK (Pillow): {out.relative_to(ROOT)}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate shop UI PNGs (Gemini or Pillow fallback).")
    parser.add_argument(
        "--camp-shop-only",
        action="store_true",
        help="Regenerate only assets/camp_icon_shop.png (281×297, same as other camp tiles).",
    )
    parser.add_argument(
        "--ref",
        type=Path,
        default=None,
        help="Optional style reference image path (main menu screenshot).",
    )
    parser.add_argument(
        "--mystery-boxes-only",
        action="store_true",
        help="Regenerate only assets/mystery_box_0.png … mystery_box_5.png (Drifters×DD prompts; Gemini / gemini-image MCP).",
    )
    parser.add_argument(
        "--shop-bg-and-chests-only",
        action="store_true",
        help="Regenerate assets/shop_bg.png and mystery_box_0..5 only (uses GOOGLE_API_KEY / key from .cursor/mcp.json).",
    )
    args = parser.parse_args()
    mode_flags = [args.camp_shop_only, args.mystery_boxes_only, args.shop_bg_and_chests_only]
    if sum(1 for f in mode_flags if f) > 1:
        parser.error("Use only one of --camp-shop-only, --mystery-boxes-only, or --shop-bg-and-chests-only.")
    if args.camp_shop_only:
        run_camp_shop_only(args.ref)
    elif args.mystery_boxes_only:
        run_mystery_boxes_only()
    elif args.shop_bg_and_chests_only:
        run_shop_bg_and_chests_only()
    else:
        main()
