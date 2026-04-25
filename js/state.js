const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let state = "account_auth", userName = "", score = 0, currentLvl = 1, maxLvl = 1;
/** "gate" = hub after login/refresh; "browse" = opened from header, CLOSE returns. */
let accountProfileMode = "gate";
/** State to restore when closing browse-mode account profile. */
let accountProfileReturnState = "camp";
/** Draft text on account_nickname screen (saved with setAccountNickname on continue). */
let accountNicknameInput = "";
/** Local auth form state (register/login screens). */
let accountAuthNicknameInput = "";
let accountAuthPasswordInput = "";
let accountAuthMessage = "";
let accountAuthBusy = false;
let accountAuthActiveField = "nickname";
/** Persistent meta; owned by js/account.js (localStorage, future cloud). */
let accountXp = 0, accountLevel = 1;
let scoreDetails = { hits: 0, crits: 0, blocks: 0, dodges: 0, hpBonus: 0, stageClear: 0 };
let player = {}, enemy = {}, log = [];
let selAtk = null, selBlk = [], isProcessing = false;
let pDisplayHp = 0, eDisplayHp = 0, fDisplayFury = 0, shake = 0, particles = [], fxParticles = [];
/** Sprite rects in combat view — keep in sync with drawCombat positions */
const COMBAT_PLAYER_SPRITE = { x: 20, y: 130, w: 350, h: 350 };
const COMBAT_ENEMY_SPRITE = { x: 590, y: 130, w: 350, h: 350 };
let combatFlashes = [];
let combatVignette = 0;
let highScores = JSON.parse(localStorage.getItem('gauntletScores')) || [];
let hoveredItem = null, selectedInvItem = null, tooltipPos = { x: 0, y: 0 };
/** Champion screen: hovered stat key for tooltip, or null */
let inventoryStatHover = null;
let inventoryHoverPt = { x: 0, y: 0 };
/** Account profile roadmap: mouse hover hit `{ kind:'major', milestone }` or `{ kind:'minor', level }`, else null */
let accountRoadmapHover = null;
let accountRoadmapHoverPt = { x: 0, y: 0 };
/** Two shop slots: `{ item, price }` or `null` if sold out until refresh/fill. */
let shopVisibleOffers = [null, null];
/** Permutation of tier indices 0–5 for the six mystery UI slots (local order: slots 1,2,3 then 5,6,7). */
let shopMysterySlotMap = null;
/** Mystery chest UI slots consumed this shop cycle; keys are slot numbers (1,2,3,5,6,7). */
let shopConsumedMysterySlots = {};
/** Merchant screen: hovered mystery-chest slot index (1,2,3,5,6,7), else -1 */
let shopChestHoverSlot = -1;
let showBattleTip = !localStorage.getItem('battleTipShown');
/** Stage-2 autoplay intro; permanent dismiss via localStorage */
let showAutoplayTip = false;
const GAUNTLET_AUTOPLAY_TIP_DISMISSED_KEY = 'gauntletAutoplayTipDismissed';

function getAutoplayTipLayout() {
    const w = 640, h = 400;
    const x = (960 - w) / 2, y = (650 - h) / 2;
    const btnY = y + h - 52, btnH = 38;
    return {
        panel: { x, y, w, h },
        gotIt: { x: x + 48, y: btnY, w: 120, h: btnH },
        neverAgain: { x: x + 188, y: btnY, w: 404, h: btnH }
    };
}

let isFetchingScores = false;

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
loadAsset('shop_bg', 'assets/shop_bg.png');
loadAsset('gold', 'assets/gold.png');
loadAsset('background', 'assets/Background_001.png');
loadAsset('log_bg_img', 'assets/battle_log_background.png');
loadAsset('camp_battle', 'assets/camp_icon_battle.png');
loadAsset('camp_champion', 'assets/camp_icon_champion.png');
loadAsset('camp_shop', 'assets/camp_icon_shop.png');
loadAsset('fight_btn', 'assets/fight_button.png');
loadAsset('autoplay_btn', 'assets/autoplay_button.png');
/** Shop mystery chests: 2×3 atlas, row-major Rust→Void (see drawMysteryBoxAtlas in render.js). */
loadAsset('mystery_boxes_atlas', 'assets/mystery_boxes_all_6.png');
loadAsset('champion_bg', 'assets/Champion_window_background.png');
loadAsset('camp_bg', 'assets/main_camp_background.png');
loadAsset('god_strike_btn', 'assets/god_strike_button.png');
loadAsset('stat_icon_str', 'assets/stat_icon_str.png');
loadAsset('stat_icon_dex', 'assets/stat_icon_dex.png');
loadAsset('stat_icon_sta', 'assets/stat_icon_sta.png');
loadAsset('stat_icon_luck', 'assets/stat_icon_luck.png');
loadAsset('back_to_camp_btn', 'assets/back_to_camp.png');

loadAsset('player_STR', 'assets/player_STR.png');
loadAsset('player_DEX', 'assets/player_DEX.png');
loadAsset('player_STA', 'assets/player_STA.png');
loadAsset('player_LUCK', 'assets/player_luck.png');

const devIdleStaEnabled = new URLSearchParams(location.search).get('devIdleSta') === '1';
const DEV_STA_IDLE_FILES = [
    'assets/dev_idle_sta/option_01_subtle.png',
    'assets/dev_idle_sta/option_02_weight_shift.png',
    'assets/dev_idle_sta/option_03_minimal_motion.png'
];
const DEV_STA_IDLE_KEYS = ['sta_idle_opt_0', 'sta_idle_opt_1', 'sta_idle_opt_2'];
let devStaIdleOptionIndex = 0;

if (devIdleStaEnabled) {
    DEV_STA_IDLE_KEYS.forEach((key, i) => loadAsset(key, DEV_STA_IDLE_FILES[i]));
}

let selectedChar = null;


for (let i = 1; i <= 10; i++) {
    loadAsset(`enemy_icon_${i}`, `assets/enemy_lvl_${i}_icon.png`);
    loadAsset(`enemy_${i}`, `assets/enemy_lvl_${i}.png`);
}
const ZONE_MAPPING = {
    "1": "assets/hit_zone_head.png",
    "2": "assets/hit_zone_neck.png",
    "3": "assets/hit_zone_chest.png",
    "4": "assets/hit_zone_legs.png",
    "5": "assets/hit_zone_feet.png"
};
Object.keys(ZONE_MAPPING).forEach(id => loadAsset(`icon_${id}`, ZONE_MAPPING[id]));
["weapon", "helm", "shield", "gloves", "armor", "boots", "ring", "necklace", "banner"].forEach(slotId => {
    loadAsset(`equip_slot_${slotId}`, `assets/equip_slot_${slotId}.png`);
});
ALL_ITEMS.forEach(item => loadAsset(item.name, `assets/${item.name.toLowerCase().replace(/ /g, '_')}.png`));

let levelUpTimer = 0;

/** Autoplay: toggled in combat (unlocks after first stage clear or account Lv 2+); speed persists for the run */
const AUTOPLAY_BASE_STEP_MS = 1000;
let combatAutoplayActive = false;
let combatAutoplaySpeed = 1;
let combatAutoplayCancelled = false;
let autoplayCancelGen = 0;
let autoplayKickPending = false;
