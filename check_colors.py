from PIL import Image
import os

def check_colors():
    assets_dir = r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets"
    files = ["player_STR.png", "player_DEX.png", "player_luck.png", "player_STA.png"]
    
    for f in files:
        path = os.path.join(assets_dir, f)
        if os.path.exists(path):
            with Image.open(path) as img:
                img = img.convert("RGBA")
                color = img.getpixel((0, 0))
                print(f"{f}: (0,0) color = {color}")
        else:
            print(f"{f}: Not found")

if __name__ == "__main__":
    check_colors()
