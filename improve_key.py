from PIL import Image
import os
import math

def get_distance(c1, c2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])))

def improve_chroma_key(source_path, target_path, chroma_color, threshold=70, soft_edge=30):
    with Image.open(source_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            # item is (r, g, b, a)
            dist = get_distance(item, chroma_color)
            
            if dist < threshold:
                # Fully transparent
                new_data.append((0, 0, 0, 0))
            elif dist < threshold + soft_edge:
                # Soft transition
                ratio = (dist - threshold) / soft_edge
                new_alpha = int(255 * ratio)
                # Keep the original color but fade alpha
                new_data.append((item[0], item[1], item[2], new_alpha))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        
        # Save the result to the target path (PNG)
        img.save(target_path, "PNG")
        print(f"Improved {target_path}")

if __name__ == "__main__":
    assets_dir = r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets"
    files = ["player_STR.png", "player_DEX.png", "player_luck.png", "player_STA.png"]
    
    for f in files:
        path = os.path.join(assets_dir, f)
        backup_path = path + ".bak"
        
        # Always use backup as the source for better quality re-processing
        if os.path.exists(backup_path):
            source_path = backup_path
        elif os.path.exists(path):
            source_path = path
        else:
            print(f"File not found: {path}")
            continue

        with Image.open(source_path) as img:
            img = img.convert("RGBA")
            chroma_rgb = img.getpixel((0, 0))
            
        print(f"Processing {f} with detected chroma color: {chroma_rgb}")
        improve_chroma_key(source_path, path, chroma_rgb)
