from PIL import Image
import numpy as np

def chromakey_spillsuppress(filepath):
    img = Image.open(filepath).convert('RGBA')
    arr = np.array(img).astype(np.float32)
    
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    # Calculate chroma key alpha
    max_rb = np.maximum(r, b)
    
    # difference between green and max of red/blue
    dg = g - max_rb
    
    # Soft keying parameters
    low = 10
    high = 60
    
    # mask: 1.0 means transparent green background, 0.0 means opaque foreground
    mask = np.clip((dg - low) / (high - low), 0.0, 1.0)
    
    new_a = a * (1.0 - mask)
    
    # Spill suppression
    new_g = np.where(g > max_rb, max_rb, g)
    
    arr[:,:,1] = new_g
    arr[:,:,3] = new_a
    
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr).save(filepath)
    print(f"Processed {filepath}")

files = [
    r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets\leather_tunic.png",
    r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets\plate_mail.png",
    r"c:\Users\Mooncake\Documents\GitHub\fightgame\assets\ore.png"
]

for f in files:
    try:
        chromakey_spillsuppress(f)
    except Exception as e:
        print(f"Error processing {f}: {e}")
