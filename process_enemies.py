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
            if g > r and g > b:
                new_g = int((r + b) / 2)
                new_data.append((r, new_g, b, new_a))
            else:
                new_data.append((r, g, b, new_a))
        
        img.putdata(new_data)
        img.save(target_path, "PNG")
        print(f"Processed with spill suppression: {target_path}")

if __name__ == "__main__":
    assets_dir = r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets"
    
    # Process enemies 1 to 10
    files = [f"enemy_lvl_{i}.png" for i in range(1, 11)]
    
    for f in files:
        path = os.path.join(assets_dir, f)
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
            
        backup_path = path + ".bak"
        
        # Create backup if it doesn't exist
        if not os.path.exists(backup_path):
            os.rename(path, backup_path)
            print(f"Created backup: {backup_path}")
            source = backup_path
        else:
            print(f"Using existing backup: {backup_path}")
            source = backup_path
            
        # Detect chroma color from top-left pixel (0,0) of the backup
        with Image.open(source) as img:
            img = img.convert("RGBA")
            chroma_rgb = img.getpixel((0, 0))
            
        print(f"Applying spill suppression to {f} (Detected Chroma: {chroma_rgb})")
        apply_spill_suppression(source, path, chroma_rgb)
