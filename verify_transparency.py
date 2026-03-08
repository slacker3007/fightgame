
from PIL import Image
import os

def check_transparency_in_corners(image_path):
    try:
        with Image.open(image_path) as img:
            if img.mode != 'RGBA':
                return False
            width, height = img.size
            corners = [
                img.getpixel((0, 0)),
                img.getpixel((width - 1, 0)),
                img.getpixel((0, height - 1)),
                img.getpixel((width - 1, height - 1))
            ]
            
            transparent_count = 0
            for r, g, b, a in corners:
                if a == 0:
                    transparent_count += 1
            
            return transparent_count >= 2
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return False

assets_dir = r'c:\Users\Mooncake\Documents\GitHub\fightgame\assets'
processed_assets = [
    "camp_icon_battle.png", "camp_icon_champion.png", "camp_icon_craft.png",
    "craft_button.png", "dragon_scale.png", "dragon_tooth.png",
    "fight_button.png", "heavy_mace.png", "ninja_suit.png",
    "reinforced_garb.png", "rusty_dagger.png", "soldier's_sword.png",
    "void_reaver.png"
]

all_transparent = True
for filename in processed_assets:
    filepath = os.path.join(assets_dir, filename)
    if not check_transparency_in_corners(filepath):
        print(f"FAILED: {filename} still has opaque corners.")
        all_transparent = False
    else:
        print(f"PASSED: {filename} has transparent corners.")

if all_transparent:
    print("VERIFICATION_SUCCESSFUL")
else:
    print("VERIFICATION_FAILED")
