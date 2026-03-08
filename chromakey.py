
import numpy as np
from PIL import Image
import os
import shutil

def chromakey_with_spill_suppression(image_path, output_path, green_threshold=1.5, spill_threshold=1.1):
    """
    Applies chromakey and spill suppression to an image.
    """
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img, dtype=np.float32)
    
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # 1. Identify Background (Chromakey)
    # Background is where Green is significantly stronger than Red and Blue
    is_bg = (g > r * green_threshold) & (g > b * green_threshold)
    
    # 2. Spill Suppression
    # Reduce Green where it's dominant but not quite the background
    # Usually we cap Green to the average or max of Red and Blue
    is_spill = (g > r * spill_threshold) & (g > b * spill_threshold) & (~is_bg)
    
    # Simple spill suppression: cap green to the average of red and blue
    g[is_spill] = (r[is_spill] + b[is_spill]) / 2.0
    
    # 3. Apply Transparency to Background
    a[is_bg] = 0
    
    # Reassemble and save
    new_data = np.stack([r, g, b, a], axis=2).astype(np.uint8)
    new_img = Image.fromarray(new_data, 'RGBA')
    new_img.save(output_path)

def process_assets():
    assets_dir = r'c:\Users\Mooncake\Documents\GitHub\fightgame\assets'
    backup_dir = os.path.join(assets_dir, 'backups')
    
    green_assets = [
        "camp_icon_battle.png", "camp_icon_champion.png", "camp_icon_craft.png",
        "craft_button.png", "dragon_scale.png", "dragon_tooth.png",
        "fight_button.png", "heavy_mace.png", "ninja_suit.png",
        "reinforced_garb.png", "rusty_dagger.png", "soldier's_sword.png",
        "void_reaver.png"
    ]
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        
    for filename in green_assets:
        filepath = os.path.join(assets_dir, filename)
        if os.path.exists(filepath):
            print(f"Processing {filename}...")
            # Backup
            shutil.copy2(filepath, os.path.join(backup_dir, filename))
            # Chromakey
            chromakey_with_spill_suppression(filepath, filepath)
            print(f"Finished {filename}")
        else:
            print(f"Warning: {filename} not found.")

if __name__ == "__main__":
    process_assets()
