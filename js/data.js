const COLORS = {
    WHITE: "#FFFFFF", BLACK: "#000000", RED: "#FF4646", GREEN: "#46FF46",
    GRAY: "#646464", GOLD: "#FFD700", YELLOW: "#FFFF00",
    DARK_BG: "#0a0a0f", CYAN: "#00FFFF", PANEL: "rgba(40, 40, 60, 0.95)",
    ENEMY_PANEL: "rgba(60, 40, 40, 0.85)", LOG_BG: "rgba(5, 5, 10, 0.9)",
    SLOT_BG: "rgba(20, 20, 30, 0.9)", RARITY_COMMON: "#FFFFFF", RARITY_RARE: "#46A0FF",
    RARITY_EPIC: "#A335EE", RARITY_LEGENDARY: "#FF8C00", BTN_BLUE: "#005a8c",
    BLOOD_RED: "#8a0303", TARNISHED_GOLD: "#b8860b", DIM_GRAY: "#4a4a4a", CREAM: "#FFF5DC",
    STAT_GOLD: "#f0d440", STAT_VALUE: "#ffffff", STAT_CYAN: "#46ffff",
    STAT_ROW_BG: "rgba(40, 30, 20, 0.6)", STAT_BTN_BG: "rgba(20, 20, 20, 0.8)"
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
    ["AETHELGARD", 1200, 85, 0.10, "boss", 9]
];

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
    { name: "Soulguard Plate", type: "armor", STA: 20, DEX: 5, rarity: "LEGENDARY" }
];