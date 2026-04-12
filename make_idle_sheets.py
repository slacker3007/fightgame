"""
Generate horizontal idle sprite sheets (8 frames) for players and enemies.
Subtle idle: light breath (scale/bob), tiny feet-pivot rotation, slight sway.
Output size: (8 * canvas_w) x canvas_h — matches render.js sheet detection.
"""
import math
import os

from PIL import Image


def create_idle_sheet(
    input_path: str,
    output_path: str,
    num_frames: int = 8,
    bob_px: float = 2.0,
    scale_amp: float = 0.0045,
    rot_deg_amp: float = 0.28,
    sway_px_amp: float = 1.2,
) -> None:
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    bbox = img.getbbox()
    if not bbox:
        raise ValueError(f"Image is entirely transparent: {input_path}")

    left, upper, right, lower = bbox
    char_img = img.crop(bbox)
    char_w, char_h = char_img.size

    sheet = Image.new("RGBA", (width * num_frames, height), (0, 0, 0, 0))

    orig_center_x = left + char_w / 2
    orig_bottom_y = lower

    for i in range(num_frames):
        if num_frames > 1:
            phase = math.pi * i / (num_frames - 1)
        else:
            phase = 0.0
        breath = math.sin(phase)
        bob_y = int(round(bob_px * breath))
        scale = 1.0 + scale_amp * breath
        rot_deg = rot_deg_amp * breath
        sway_x = sway_px_amp * math.sin(2.0 * phase)

        new_w = max(1, int(round(char_w * scale)))
        new_h = max(1, int(round(char_h * scale)))
        resized = char_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        pivot = (new_w / 2.0, float(new_h))
        transformed = resized.rotate(
            rot_deg,
            resample=Image.Resampling.BICUBIC,
            expand=True,
            fillcolor=(0, 0, 0, 0),
            center=pivot,
        )

        rb = transformed.getbbox()
        frame = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        if rb:
            l, u, r, b = rb
            bcx = (l + r) / 2.0
            paste_x = int(round(orig_center_x + sway_x - bcx))
            paste_y = int(round(orig_bottom_y + bob_y - b))
            frame.paste(transformed, (paste_x, paste_y), transformed)
        else:
            paste_x = int(round(orig_center_x + sway_x - new_w / 2))
            paste_y = int(round(orig_bottom_y + bob_y - new_h))
            frame.paste(transformed, (paste_x, paste_y), transformed)

        sheet.paste(frame, (i * width, 0))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)) or ".", exist_ok=True)
    sheet.save(output_path)
    print(f"Wrote {output_path} ({sheet.size[0]}x{sheet.size[1]})")


def main() -> None:
    root = os.path.dirname(os.path.abspath(__file__))
    assets = os.path.join(root, "assets")

    jobs = []
    for base in ("player_STR", "player_DEX", "player_STA", "player_luck"):
        jobs.append((os.path.join(assets, f"{base}.png"), os.path.join(assets, f"{base}_idle_sheet.png")))
    for i in range(1, 11):
        jobs.append(
            (
                os.path.join(assets, f"enemy_lvl_{i}.png"),
                os.path.join(assets, f"enemy_lvl_{i}_idle_sheet.png"),
            )
        )

    for inp, out in jobs:
        if not os.path.isfile(inp):
            print(f"Skip (missing): {inp}")
            continue
        create_idle_sheet(inp, out)


if __name__ == "__main__":
    main()
