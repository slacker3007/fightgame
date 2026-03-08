
from PIL import Image
import os

def is_green_background(image_path, threshold=0.5):
    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB')
            width, height = img.size
            # Check corners
            corners = [
                img.getpixel((0, 0)),
                img.getpixel((width - 1, 0)),
                img.getpixel((0, height - 1)),
                img.getpixel((width - 1, height - 1))
            ]
            
            green_count = 0
            for r, g, b in corners:
                # Simple check: green is dominant and significantly larger than red and blue
                if g > r * 1.5 and g > b * 1.5:
                    green_count += 1
            
            return green_count >= 2 # If at least 2 corners are green, it's probably a green screen
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return False

assets_dir = r'c:\Users\Mooncake\Documents\GitHub\fightgame\assets'
green_assets = []

for filename in os.listdir(assets_dir):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        filepath = os.path.join(assets_dir, filename)
        if is_green_background(filepath):
            green_assets.append(filename)

print("GREEN_ASSETS:" + ",".join(green_assets))
