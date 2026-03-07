from PIL import Image
import os

def get_chroma_color(image_path):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        return img.getpixel((0, 0))

def chroma_key(image_path, chroma_color, threshold=50):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            # item is (r, g, b, a)
            r_diff = abs(item[0] - chroma_color[0])
            g_diff = abs(item[1] - chroma_color[1])
            b_diff = abs(item[2] - chroma_color[2])
            
            if r_diff < threshold and g_diff < threshold and b_diff < threshold:
                new_data.append((0, 0, 0, 0))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        # Create a backup
        backup_path = image_path + ".bak"
        if not os.path.exists(backup_path):
            os.rename(image_path, backup_path)
        img.save(image_path)
        print(f"Processed {image_path}")

if __name__ == "__main__":
    assets_dir = r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets"
    files = ["player_STR.png", "player_DEX.png", "player_luck.png", "player_STA.png"]
    
    for f in files:
        path = os.path.join(assets_dir, f)
        backup_path = path + ".bak"
        
        # If backup exists, use it as the source
        if os.path.exists(backup_path):
            img_to_check = backup_path
        elif os.path.exists(path):
            img_to_check = path
        else:
            print(f"File not found: {path}")
            continue

        with Image.open(img_to_check) as img:
            img = img.convert("RGBA")
            chroma_rgb = img.getpixel((0, 0))
            # If the top-left is already transparent, we might need to restore or we're done
            if chroma_rgb[3] == 0:
                print(f"{f} already appears to be processed (transparent at 0,0).")
                continue

        print(f"Processing {f} with detected chroma color: {chroma_rgb}")
        chroma_key(path, chroma_rgb)
