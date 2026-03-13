const AudioEngine = (() => {
    let initialized = false;

    // Define Howler sounds
    // Note: The game expects these files to be present in the assets/audio/ directory.
    const sounds = {
        ambience: new Howl({ src: ['assets/audio/ambience.mp3'], loop: true, volume: 0.15 }),
        click: new Howl({ src: ['assets/audio/click.wav'], volume: 0.3 }),
        transition: new Howl({ src: ['assets/audio/transition.wav'], volume: 0.4 }),
        hit: new Howl({ src: ['assets/audio/hit.wav'], volume: 0.5 }),
        crit: new Howl({ src: ['assets/audio/crit.wav'], volume: 0.6 }),
        block: new Howl({ src: ['assets/audio/block.wav'], volume: 0.4 }),
        godStrike: new Howl({ src: ['assets/audio/godStrike.wav'], volume: 0.8 }),
        cast: new Howl({ src: ['assets/audio/cast.wav'], volume: 0.5 }),
        levelUp: new Howl({ src: ['assets/audio/levelUp.wav'], volume: 0.6 }),
        gameOver: new Howl({ src: ['assets/audio/gameOver.wav'], volume: 0.6 })
    };

    let isMuted = false;
    let originalVolumes = {};

    function init() {
        if (!initialized) {
            initialized = true;
            // Store original volumes
            for (let key in sounds) {
                originalVolumes[key] = sounds[key].volume();
            }
        }
    }

    function startAmbience() {
        init();
        if (!sounds.ambience.playing()) {
            sounds.ambience.play();
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        for (let key in sounds) {
            sounds[key].mute(isMuted);
        }
        return isMuted;
    }

    return {
        init,
        startAmbience,
        toggleMute,
        isMuted: () => isMuted,
        playClick: () => sounds.click.play(),
        playTransition: () => sounds.transition.play(),
        playHit: () => sounds.hit.play(),
        playCrit: () => sounds.crit.play(),
        playBlock: () => sounds.block.play(),
        playGodStrike: () => sounds.godStrike.play(),
        playCast: () => sounds.cast.play(),
        playLevelUp: () => sounds.levelUp.play(),
        playGameOver: () => sounds.gameOver.play()
    };
})();
