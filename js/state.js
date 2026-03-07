const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let state = "char_select", userName = "", score = 0, currentLvl = 1, maxLvl = 1;
let player = {}, enemy = {}, log = [];
let selAtk = null, selBlk = [], isProcessing = false;
let pDisplayHp = 0, eDisplayHp = 0, fDisplayFury = 0, shake = 0, particles = [], fxParticles = [];
let highScores = JSON.parse(localStorage.getItem('gauntletScores')) || [];
let hoveredItem = null, selectedInvItem = null, tooltipPos = { x: 0, y: 0 };
let craftedItem = null;
let craftingAnimTimer = 0;
let pendingCraftedItem = null;

// Loading State Variables
let assetsLoaded = 0;
let totalAssets = 0;
let isLoaded = false;
let transitionAlpha = 0;
let nextState = null;
let isTransitioning = false;

const assets = {};
function loadAsset(key, path) {
    totalAssets++;
    const img = new Image();
    img.src = path;
    img.onload = () => {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) isLoaded = true;
    };
    img.onerror = () => {
        console.error(`Failed: ${path}`);
        assetsLoaded++;
        if (assetsLoaded === totalAssets) isLoaded = true;
    };
    assets[key] = img;
}

// Begin loading sequence
loadAsset('player_STR', 'assets/player_STR.png');
loadAsset('player_DEX', 'assets/player_DEX.png');
loadAsset('player_LUCK', 'assets/player_luck.png');
loadAsset('player_STA', 'assets/player_STA.png');
loadAsset('player', 'assets/player.png');
loadAsset('forge_bg', 'assets/crafting_window.png');
loadAsset('ore', 'assets/ore.png');
loadAsset('background', 'assets/Background_001.png');
loadAsset('log_bg_img', 'assets/battle_log_background.png');
loadAsset('camp_battle', 'assets/camp_icon_battle.png');
loadAsset('camp_champion', 'assets/camp_icon_champion.png');
loadAsset('camp_craft', 'assets/camp_icon_craft.png');
loadAsset('fight_btn', 'assets/fight_button.png');
loadAsset('craft_btn', 'assets/craft_button.png');
loadAsset('champion_bg', 'assets/Champion_window_background.png');
loadAsset('camp_bg', 'assets/main_camp_background.png');

let selectedChar = null;


for (let i = 1; i <= 10; i++) {
    loadAsset(`enemy_${i}`, `assets/enemy_lvl_${i}.png`);
    loadAsset(`enemy_icon_${i}`, `assets/enemy_lvl_${i}_icon.png`);
}
Object.keys(ZONE_NAMES).forEach(id => loadAsset(`icon_${id}`, `assets/${ZONE_NAMES[id].toLowerCase()}.png`));
ALL_ITEMS.forEach(item => loadAsset(item.name, `assets/${item.name.toLowerCase().replace(/ /g, '_')}.png`));

let levelUpTimer = 0;
const bgVideo = document.getElementById('bgVideoLayer');
bgVideo.play().catch(e => console.log("Waiting for user interaction to play video."));