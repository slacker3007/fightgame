from PIL import Image
import os
import math

def get_distance(c1, c2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])))

def apply_spill_suppression(image_path, target_path, chroma_color, threshold=65, soft_edge=40):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            r, g, b, a = item
            
            # 1. Chroma Keying (Transparency)
            dist = get_distance(item, chroma_color)
            if dist < threshold:
                new_a = 0
            elif dist < threshold + soft_edge:
                ratio = (dist - threshold) / soft_edge
                new_a = int(a * ratio)
            else:
                new_a = a
            
            # 2. Green Spill Suppression (Color Correction)
            # If green is dominant, pull it back to the average of red and blue
            if g > r and g > b:
                # Simple suppression: G = max(R, B)
                # Or even more aggressive: G = (R + B) / 2
                new_g = int((r + b) / 2)
                # Ensure we don't accidentally make it too dark if it was bright
                # but these are outlines, so being a bit darker/neutral is fine.
                new_data.append((r, new_g, b, new_a))
            else:
                new_data.append((r, g, b, new_a))
        
        img.putdata(new_data)
        img.save(target_path, "PNG")
        print(f"Processed with spill suppression: {target_path}")

if __name__ == "__main__":
    assets_dir = r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets"
    files = ["player_STR.png", "player_DEX.png", "player_luck.png", "player_STA.png"]
    
    for f in files:
        path = os.path.join(assets_dir, f)
        backup_path = path + ".bak"
        
        if os.path.exists(backup_path):
            source = backup_path
            with Image.open(source) as img:
                img = img.convert("RGBA")
                chroma_rgb = img.getpixel((0, 0))
            
            print(f"Applying spill suppression to {f} (Chroma: {chroma_rgb})")
            apply_spill_suppression(source, path, chroma_rgb)
        else:
            print(f"Backup not found for {f}, skipping or use current (not ideal).")
