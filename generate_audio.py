import os
from google import genai
from google.genai import types

def generate_lyria_audio(client, prompt, filename):
    print(f"Generating {filename}...")
    response = client.models.generate_content(
        model='gemini-2.5-flash-native-audio-latest',
        contents=prompt,
    )
    
    # Extract the audio data from the response part
    if response.candidates and response.candidates[0].content.parts:
        part = response.candidates[0].content.parts[0]
        # Depending on Lyria 3 format, the audio might be in inline_data
        if part.inline_data:
            with open(filename, "wb") as f:
                # GenAI SDK usually returns bytes in inline_data.data
                f.write(part.inline_data.data)
            print(f"Saved {filename}")
        else:
            # Fallback if the SDK provided a URI or something else
            print(f"Unexpected response format for {filename}. Part: {part}")
    else:
        print(f"No content returned for {filename}.")

def main():
    api_key = "AIzaSyAXuVymZy0MsIvcccXU4alCsgphd8s-ZZI"
    client = genai.Client(api_key=api_key)
    
    os.makedirs('assets/audio', exist_ok=True)
    
    # Sound prompts for Darkest Dungeon / dark fantasy style sounds (as requested previously)
    sounds_to_generate = {
        'ambience.wav': 'Continuous dark fantasy eerie dungeon background ambience, ominous drone, dripping water, very subtle wind, no melody, 4 seconds.',
        'click.wav': 'A short dark fantasy ui click sound, like a heavy metallic mechanism or a small bone snapping, 0.1 seconds.',
        'transition.wav': 'A dark fantasy scene transition sound, heavy stone door sliding or a woosh of dark magic, 0.5 seconds.',
        'hit.wav': 'A visceral heavy weapon hitting flesh and armor, sharp impact, dark fantasy combat sound, 0.2 seconds.',
        'crit.wav': 'Devastating critical hit with a heavy blade, intense blood splatter and magical resonance, 0.4 seconds.',
        'block.wav': 'Heavy metal shield blocking a powerful physical sword strike, loud clang and impact noise, 0.3 seconds.',
        'godStrike.wav': 'Anime style ultimate divine or dark magical strike, massive explosion of highly distorted energy, 1.0 seconds.',
        'cast.wav': 'Casting a dark magic spell, ominous low frequency rumble leading to a quick burst of ethereal energy, 0.6 seconds.',
        'levelUp.wav': 'Triumphant but dark orchestral brass and choir chord, leveling up in a grim fantasy world, 1.5 seconds.',
        'gameOver.wav': 'Dissonant heavy bell tolling, descending dark strings fading into silence, signifying death and game over, 3.0 seconds.'
    }
    
    for filename, prompt in sounds_to_generate.items():
        filepath = os.path.join('assets/audio', filename)
        generate_lyria_audio(client, prompt, filepath)
        
    print("Done generating sounds. Be sure to check them!")

if __name__ == '__main__':
    main()
