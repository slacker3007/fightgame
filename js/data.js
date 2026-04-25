const COLORS = {
    WHITE: "#FFFFFF", BLACK: "#000000", RED: "#FF4646", GREEN: "#46FF46",
    GRAY: "#646464", GOLD: "#FFD700", YELLOW: "#FFFF00",
    /** Account profile / premium HUD (hybrid dark + readable) */
    UI_GOLD: "#c9a44a",
    UI_SLATE: "#5c6478",
    UI_AMBER: "#e8a838",
    UI_MUTED_TEXT: "#9aa4b8",
    UI_TITLE: "#f2ede3",
    DARK_BG: "#0a0a0f", CYAN: "#00FFFF", PANEL: "rgba(40, 40, 60, 0.95)",
    ENEMY_PANEL: "rgba(60, 40, 40, 0.85)", LOG_BG: "rgba(5, 5, 10, 0.9)",
    SLOT_BG: "rgba(20, 20, 30, 0.9)", RARITY_COMMON: "#FFFFFF", RARITY_RARE: "#46A0FF",
    RARITY_EPIC: "#A335EE", RARITY_LEGENDARY: "#FF8C00", BTN_BLUE: "#005a8c",
    BLOOD_RED: "#8a0303", TARNISHED_GOLD: "#b8860b", DIM_GRAY: "#4a4a4a", CREAM: "#FFF5DC",
    STAT_GOLD: "#f0d440", STAT_VALUE: "#ffffff", STAT_CYAN: "#46ffff",
    STAT_ROW_BG: "rgba(40, 30, 20, 0.6)", STAT_BTN_BG: "rgba(20, 20, 20, 0.8)",
    CHAMPION_STAT_BASE: "#f2ede3",
    CHAMPION_STAT_ACCOUNT: "#6ecf7a",
    CHAMPION_STAT_GEAR: "#7ab8ff",
    CHAMPION_PANEL_GLASS: "rgba(14, 12, 22, 0.72)",
    CHAMPION_IRON_OUTER: "rgba(42, 38, 36, 0.95)",
    CHAMPION_IRON_MID: "rgba(92, 78, 62, 0.85)",
    CHAMPION_IRON_HIGHLIGHT: "rgba(160, 148, 128, 0.35)"
};

const ZONE_NAMES = { "1": "Head", "2": "Chest", "3": "Stomach", "4": "Belt", "5": "Legs" };

const ENEMY_DATA = [
    ["Scavenger Scout", 60, 10, 0.05, "balanced", 0],
    ["Iron-Clad Guard", 160, 12, 0.02, "heavy", 1],
    ["Arcane Scribe", 100, 22, 0.10, "balanced", 2],
    ["Stalker Prowler", 130, 18, 0.20, "agile", 3],
    ["Hollowed Sentinel", 250, 20, 0.05, "heavy", 4],
    ["Void-Caller Acolyte", 200, 30, 0.10, "balanced", 5],
    ["Blood-Oath Duelist", 220, 35, 0.15, "agile", 6],
    ["Ruin-Knight Exemplar", 400, 45, 0.05, "heavy", 7],
    ["Void-General Malakor", 500, 55, 0.15, "agile", 8],
    /** Finale boss: tuned down from 1200/85 so tier scaling does not two-shot mid-gauntlet builds. */
    ["AETHELGARD", 1050, 72, 0.10, "boss", 9]
];

const GAUNTLET_TOTAL_STAGES = 100;
const BOSSES_PER_TIER = 10;

/**
 * Account level milestones (every 10 levels). Lv 10–70: extra gear `slotId` on `player`; Lv 80/90/100: passive rewards (no gear slot).
 * Gear `slotId` matches `player[slotId]` and item `type`. `gold` is 0 for these milestones (reserved for future rewards).
 */
const ACCOUNT_LEVEL_MILESTONES = [
    { level: 10, gold: 0, slotId: "shield", label: "Shield", slotLabel: "SHIELD" },
    { level: 20, gold: 0, slotId: "helm", label: "Helm", slotLabel: "HELM" },
    { level: 30, gold: 0, slotId: "gloves", label: "Gloves", slotLabel: "GLOVES" },
    { level: 40, gold: 0, slotId: "boots", label: "Boots", slotLabel: "BOOTS" },
    { level: 50, gold: 0, slotId: "ring", label: "Ring", slotLabel: "RING" },
    { level: 60, gold: 0, slotId: "necklace", label: "Necklace", slotLabel: "NECK" },
    { level: 70, gold: 0, slotId: "banner", label: "Banner", slotLabel: "BANNER" },
    { level: 80, gold: 0, rewardType: "passive", label: "Passive", slotLabel: "★" },
    { level: 90, gold: 0, rewardType: "passive", label: "Passive", slotLabel: "★" },
    { level: 100, gold: 0, rewardType: "passive", label: "Passive", slotLabel: "★" }
];

const ACCOUNT_PASSIVE_MILESTONE_FIRST = 5;
const ACCOUNT_PASSIVE_MILESTONE_STEP = 10;

function isAccountPassiveMilestoneLevel(level) {
    if (typeof level !== "number") return false;
    return level >= ACCOUNT_PASSIVE_MILESTONE_FIRST
        && ((level - ACCOUNT_PASSIVE_MILESTONE_FIRST) % ACCOUNT_PASSIVE_MILESTONE_STEP === 0);
}

function getAccountPassiveMilestoneLevelsThrough(maxLevel) {
    const out = [];
    const cap = Math.max(1, Math.floor(maxLevel || 1));
    for (let lv = ACCOUNT_PASSIVE_MILESTONE_FIRST; lv <= cap; lv += ACCOUNT_PASSIVE_MILESTONE_STEP) {
        out.push(lv);
    }
    return out;
}

/** Seven accessory slots (nine total gear pieces with weapon + armor). */
const ACCOUNT_EQUIP_SLOT_IDS = ["shield", "helm", "gloves", "boots", "ring", "necklace", "banner"];

function getAccountMilestoneBySlotId(slotId) {
    if (!slotId || typeof ACCOUNT_LEVEL_MILESTONES === "undefined") return null;
    return ACCOUNT_LEVEL_MILESTONES.find(m => m.slotId === slotId) || null;
}

const TIER_LABELS = [
    "Easy", "Normal", "Hard", "Very Hard", "Brutal",
    "Nightmare", "Inferno", "Torment", "Annihilation", "Supreme"
];

/** Per-tier multipliers; tier 0 is 1×. Top HP tiers below legacy 4×/5× for mid-core pacing. */
const TIER_HP_MUL = [1, 1.18, 1.4, 1.65, 1.95, 2.3, 2.75, 3.3, 3.85, 4.75];
/** Late tiers softened (was 2.4 / 2.8 / 3.3) for mid-core: skilled play can stabilize without lottery one-shots. */
const TIER_DMG_MUL = [1, 1.12, 1.26, 1.42, 1.58, 1.76, 1.98, 2.22, 2.48, 2.75];
const TIER_DODGE_MUL = [1, 1.05, 1.08, 1.1, 1.12, 1.14, 1.16, 1.18, 1.2, 1.22];

function getGauntletTier(stage) {
    return Math.floor((stage - 1) / BOSSES_PER_TIER);
}

function getBossSlot(stage) {
    return ((stage - 1) % BOSSES_PER_TIER) + 1;
}

/** First global stage index (1-based) shown in battle select for current progress. */
function getBattleSelectTierStart(maxLvl) {
    if (maxLvl < 1) return 0;
    return Math.floor((maxLvl - 1) / BOSSES_PER_TIER) * BOSSES_PER_TIER;
}

/** Stages 11–20 (Normal tier) were undertuned; +50% to hp, dmg, and dodge scaling. */
const NORMAL_TIER_STAGE_BOOST = 1.5;
/** Slot-10 finales in that band (stage 20 only): no Normal-tier band multiplier (1× tier scaling only). */
const NORMAL_TIER_STAGE_BOSS_BOOST = 1.0;

function getScaledEnemyForStage(stage) {
    const slot = getBossSlot(stage);
    const t = getGauntletTier(stage);
    const d = ENEMY_DATA[slot - 1];
    const hpM = TIER_HP_MUL[t];
    const dmgM = TIER_DMG_MUL[t];
    const dodgeM = TIER_DODGE_MUL[t];
    const inNormalBand = stage >= 11 && stage <= 20;
    const normalBlockBoost = inNormalBand
        ? (slot === 10 ? NORMAL_TIER_STAGE_BOSS_BOOST : NORMAL_TIER_STAGE_BOOST)
        : 1;
    const baseName = d[0];
    const label = TIER_LABELS[t];
    return {
        bossSlot: slot,
        tier: t,
        name: `${baseName} (${label})`,
        hp: Math.round(d[1] * hpM * normalBlockBoost),
        dmg: Math.round(d[2] * dmgM * normalBlockBoost),
        dodge: Math.min(0.95, d[3] * dodgeM * normalBlockBoost),
        archetype: d[4] || "balanced"
    };
}

/**
 * Shop / loot type unlocks are tied to current run progress (`maxLvl`) and not account level.
 * Item types unlock every 10 stages after armor, starting from:
 * weapon 1, armor 1, helm 11.
 */
const ITEM_TYPE_MIN_STAGE = Object.freeze({
    weapon: 1,
    armor: 1,
    shield: 11,
    helm: 21,
    gloves: 31,
    boots: 41,
    ring: 51,
    necklace: 61,
    banner: 71
});

function getCraftTypeMinStage(type) {
    if (!type) return Number.POSITIVE_INFINITY;
    return Object.prototype.hasOwnProperty.call(ITEM_TYPE_MIN_STAGE, type)
        ? ITEM_TYPE_MIN_STAGE[type]
        : Number.POSITIVE_INFINITY;
}

function isCraftTypeUnlockedAtStage(type, stage) {
    return stage >= getCraftTypeMinStage(type);
}

function getUnlockedCraftTypesAtStage(stage) {
    return Object.keys(ITEM_TYPE_MIN_STAGE).filter(type => isCraftTypeUnlockedAtStage(type, stage));
}

const ALL_ITEMS = [
    { name: "Rusty Dagger", type: "weapon", STR: 2, LUCK: 1, rarity: "COMMON" },
    { name: "Soldier's Sword", type: "weapon", STR: 5, LUCK: 2, rarity: "COMMON" },
    { name: "Heavy Mace", type: "weapon", STR: 8, LUCK: 0, rarity: "COMMON" },
    { name: "Void Reaver", type: "weapon", STR: 12, LUCK: 5, rarity: "RARE" },
    { name: "Dragon Tooth", type: "weapon", STR: 15, LUCK: 3, rarity: "EPIC" },
    { name: "Leather Tunic", type: "armor", STA: 2, DEX: 1, rarity: "COMMON" },
    { name: "Reinforced Garb", type: "armor", STA: 4, DEX: 3, rarity: "COMMON" },
    { name: "Plate Mail", type: "armor", STA: 8, DEX: -2, rarity: "COMMON" },
    { name: "Ninja Suit", type: "armor", STA: 2, DEX: 10, rarity: "RARE" },
    { name: "Dragon Scale", type: "armor", STA: 12, DEX: 4, rarity: "EPIC" },
    { name: "Sunstrider Sword", type: "weapon", STR: 20, LUCK: 10, rarity: "LEGENDARY" },
    { name: "Soulguard Plate", type: "armor", STA: 20, DEX: 5, rarity: "LEGENDARY" },
    { name: "Buckler", type: "shield", STA: 1, rarity: "COMMON" },
    { name: "Iron Helm", type: "helm", STR: 1, STA: 1, rarity: "COMMON" },
    { name: "Leather Gloves", type: "gloves", DEX: 1, LUCK: 1, rarity: "COMMON" },
    { name: "Travel Boots", type: "boots", STA: 1, DEX: 1, rarity: "COMMON" },
    { name: "Copper Ring", type: "ring", LUCK: 2, rarity: "COMMON" },
    { name: "Bone Charm", type: "necklace", STR: 1, LUCK: 1, rarity: "COMMON" },
    { name: "Tattered Standard", type: "banner", STA: 2, rarity: "COMMON" },
    { name: "Frostguard Helm", type: "helm", STA: 3, DEX: 2, rarity: "RARE" },
    { name: "Warden Visor", type: "helm", STR: 4, STA: 3, rarity: "EPIC" },
    { name: "Aegis Bulwark", type: "shield", STA: 4, STR: 2, rarity: "RARE" },
    { name: "Bastion Ward", type: "shield", STA: 7, STR: 3, rarity: "EPIC" },
    { name: "Quickdraw Grips", type: "gloves", DEX: 3, LUCK: 2, rarity: "RARE" },
    { name: "Shadowweave Gauntlets", type: "gloves", DEX: 5, STR: 2, rarity: "EPIC" },
    { name: "Trailrunner Boots", type: "boots", DEX: 3, STA: 2, rarity: "RARE" },
    { name: "Stormstep Greaves", type: "boots", DEX: 5, STA: 4, rarity: "EPIC" },
    { name: "Lucky Loop", type: "ring", LUCK: 4, DEX: 1, rarity: "RARE" },
    { name: "Astral Band", type: "ring", LUCK: 6, STR: 2, rarity: "EPIC" },
    { name: "Runed Pendant", type: "necklace", STR: 3, LUCK: 3, rarity: "RARE" },
    { name: "Heartfire Talisman", type: "necklace", STR: 4, STA: 4, rarity: "EPIC" },
    { name: "Ironbound Banner", type: "banner", STA: 4, STR: 2, rarity: "RARE" },
    { name: "Warleader Standard", type: "banner", STA: 6, STR: 4, rarity: "EPIC" }
];

/** Gold from clearing a stage (before victory finale). Stage 1 => 30 (affords cheapest chest). */
function getGoldForStageClear(stage) {
    const s = Math.max(1, Math.floor(stage || 1));
    return 24 + s * 6;
}

const SHOP_VISIBLE_RARITY_BASE = Object.freeze({
    COMMON: 45,
    RARE: 140,
    EPIC: 290,
    LEGENDARY: 680
});

function getShopVisibleListPrice(item) {
    if (!item || !item.rarity) return 45;
    const base = SHOP_VISIBLE_RARITY_BASE[item.rarity] != null
        ? SHOP_VISIBLE_RARITY_BASE[item.rarity]
        : SHOP_VISIBLE_RARITY_BASE.COMMON;
    const weaponArmor = item.type === "weapon" || item.type === "armor";
    const mul = weaponArmor ? 1 : 0.92;
    return Math.max(1, Math.floor(base * mul));
}

function getShopRefreshCost(maxStage) {
    const m = Math.max(1, Math.floor(maxStage || 1));
    return 40 + m * 4;
}

const SHOP_SELL_GOLD_BY_RARITY = Object.freeze({
    COMMON: 10,
    RARE: 22,
    EPIC: 45,
    LEGENDARY: 100
});

function getSellGoldForItem(item) {
    if (!item || !item.rarity) return SHOP_SELL_GOLD_BY_RARITY.COMMON;
    return SHOP_SELL_GOLD_BY_RARITY[item.rarity] != null
        ? SHOP_SELL_GOLD_BY_RARITY[item.rarity]
        : SHOP_SELL_GOLD_BY_RARITY.COMMON;
}

/**
 * Six mystery tiers: price and rarity weights (must sum to 1).
 * `assetKey` matches loadAsset in state.js.
 */
const SHOP_MYSTERY_BOXES = Object.freeze([
    { id: "rust", label: "Rust Chest", price: 30, assetKey: "mystery_box_0",
        weights: { COMMON: 0.78, RARE: 0.18, EPIC: 0.035, LEGENDARY: 0.005 } },
    { id: "iron", label: "Iron Chest", price: 55, assetKey: "mystery_box_1",
        weights: { COMMON: 0.55, RARE: 0.32, EPIC: 0.12, LEGENDARY: 0.01 } },
    { id: "steel", label: "Steel Chest", price: 95, assetKey: "mystery_box_2",
        weights: { COMMON: 0.35, RARE: 0.38, EPIC: 0.22, LEGENDARY: 0.05 } },
    { id: "silver", label: "Silver Chest", price: 160, assetKey: "mystery_box_3",
        weights: { COMMON: 0.18, RARE: 0.35, EPIC: 0.38, LEGENDARY: 0.09 } },
    { id: "gold", label: "Gold Chest", price: 280, assetKey: "mystery_box_4",
        weights: { COMMON: 0.08, RARE: 0.22, EPIC: 0.45, LEGENDARY: 0.25 } },
    { id: "void", label: "Void Chest", price: 480, assetKey: "mystery_box_5",
        weights: { COMMON: 0.02, RARE: 0.13, EPIC: 0.40, LEGENDARY: 0.45 } }
]);

/**
 * Shop display distribution for the six mystery slots.
 * Values are probabilities by tier index (0..5), must sum to ~1.
 */
const SHOP_MYSTERY_DISPLAY_WEIGHTS = Object.freeze([
    0.40, // rust
    0.24, // iron
    0.16, // steel
    0.10, // silver
    0.07, // gold
    0.03  // void
]);

function sampleMysteryRarityFromBox(box) {
    const w = box.weights;
    const r = Math.random();
    let t = 0;
    if (r < (t += w.COMMON)) return "COMMON";
    if (r < (t += w.RARE)) return "RARE";
    if (r < (t += w.EPIC)) return "EPIC";
    if (r < (t += w.LEGENDARY)) return "LEGENDARY";
    return "COMMON";
}

/**
 * Merchant grid: 2 rows × 4 columns, slotIndex 0–1 = visible offers, 2–7 = mystery boxes.
 * Geometry shared by render.js and main.js.
 */
/** Paid refresh control (shop header); must match createButton in main.js and draw in render.js. */
const SHOP_REFRESH_TOP_BTN = Object.freeze({ x: 688, y: 12, w: 200, h: 36 });

const SHOP_SLOT_GRID = Object.freeze({
    originX: 364,
    /** Top of first shop row; aligns with left Type Unlocks panel (see getShopScreenLayout). */
    originY: 132,
    cellW: 136,
    gap: 8,
    rowStride: 156,
    labelY: 6,
    artTop: 20,
    slotSize: 100,
    chestImgH: 76,
    buyH: 30
});

/**
 * Merchant screen chrome: sidebar, helper strip, wares headings (shared coords for render).
 */
function getShopScreenLayout() {
    const g = SHOP_SLOT_GRID;
    const top = g.originY;
    const typeCount = typeof ITEM_TYPE_MIN_STAGE !== "undefined"
        ? Object.keys(ITEM_TYPE_MIN_STAGE).length
        : 9;
    const innerPadTop = 28;
    const headerBlockH = 46;
    const listLineH = 24;
    const listH = typeCount * listLineH;
    const unlockPanelH = innerPadTop + headerBlockH + listH + 12;
    const sidebar = { x: 70, y: top, w: 270, h: unlockPanelH };
    const gap = 8;
    const helper = {
        x: sidebar.x,
        y: sidebar.y + sidebar.h + gap,
        w: sidebar.w,
        h: 46
    };
    return {
        sidebar,
        helper,
        innerX: 84,
        titleY: sidebar.y + innerPadTop,
        stageY: sidebar.y + innerPadTop + 18,
        unlockListStartY: sidebar.y + innerPadTop + 40,
        unlockLineH: listLineH,
        waresTitleX: g.originX,
        waresTitleY: top - 18,
        waresSubY: top - 4
    };
}

function getShopSlotLayout(slotIndex) {
    const g = SHOP_SLOT_GRID;
    if (slotIndex < 0 || slotIndex > 7 || typeof slotIndex !== "number") return null;
    const col = slotIndex % 4;
    const row = Math.floor(slotIndex / 4);
    const x = g.originX + col * (g.cellW + g.gap);
    const y = g.originY + row * g.rowStride;
    const cx = x + g.cellW / 2;
    const slotSize = g.slotSize;
    const slotX = x + (g.cellW - slotSize) / 2;
    const slotY = y + g.artTop;
    const chestW = g.cellW - 10;
    const chestX = x + (g.cellW - chestW) / 2;
    const chestY = slotY;
    const buyX = x + 3;
    const buyW = g.cellW - 6;
    const buyY = slotY + Math.max(g.slotSize, g.chestImgH) + 4;
    return {
        x,
        y,
        cellW: g.cellW,
        cellH: g.rowStride - 2,
        cx,
        labelY: y + g.labelY,
        slotX,
        slotY,
        slotSize,
        chestX,
        chestY,
        chestW,
        chestH: g.chestImgH,
        buyX,
        buyY,
        buyW,
        buyH: g.buyH
    };
}

/** Y positions for sell strip below merchant grid (shared by render + main). */
function getShopSellLayout() {
    let bottom = 0;
    for (let s = 0; s < 8; s++) {
        const L = getShopSlotLayout(s);
        if (L) bottom = Math.max(bottom, L.buyY + L.buyH);
    }
    const labelY = bottom + 16;
    const rowY = labelY + 18;
    return { labelY, rowY };
}