const COLORS = {
    WHITE: "#FFFFFF", BLACK: "#000000", RED: "#FF4646", GREEN: "#46FF46",
    GRAY: "#646464", GOLD: "#FFD700", YELLOW: "#FFFF00", 
    DARK_BG: "#0a0a0f", CYAN: "#00FFFF", PANEL: "rgba(40, 40, 60, 0.95)", 
    ENEMY_PANEL: "rgba(60, 40, 40, 0.85)", LOG_BG: "rgba(5, 5, 10, 0.9)",
    SLOT_BG: "rgba(20, 20, 30, 0.9)", RARITY_COMMON: "#FFFFFF", RARITY_RARE: "#46A0FF", 
    RARITY_EPIC: "#A335EE", BTN_BLUE: "#005a8c"
};

const ZONE_NAMES = { "1": "Head", "2": "Chest", "3": "Stomach", "4": "Belt", "5": "Legs" };

const ENEMY_DATA = [
    ["Scavenger Scout", 60, 10, 0.05], ["Iron-Clad Guard", 160, 12, 0.02],
    ["Arcane Scribe", 100, 22, 0.10], ["Stalker Prowler", 130, 18, 0.20],
    ["Hollowed Sentinel", 250, 20, 0.05], ["Void-Caller Acolyte", 200, 30, 0.10],
    ["Blood-Oath Duelist", 220, 35, 0.15], ["Ruin-Knight Exemplar", 400, 45, 0.05],
    ["Void-General Malakor", 500, 55, 0.15], ["AETHELGARD", 1200, 85, 0.10]
];

const ALL_ITEMS = [
    {name: "Rusty Dagger", type: "weapon", STR: 2, LUCK: 1, rarity: "COMMON"},
    {name: "Soldier's Sword", type: "weapon", STR: 5, LUCK: 2, rarity: "COMMON"},
    {name: "Heavy Mace", type: "weapon", STR: 8, LUCK: 0, rarity: "COMMON"},
    {name: "Void Reaver", type: "weapon", STR: 12, LUCK: 5, rarity: "RARE"},
    {name: "Dragon Tooth", type: "weapon", STR: 15, LUCK: 3, rarity: "EPIC"},
    {name: "Leather Tunic", type: "armor", STA: 2, DEX: 1, rarity: "COMMON"},
    {name: "Reinforced Garb", type: "armor", STA: 4, DEX: 3, rarity: "COMMON"},
    {name: "Plate Mail", type: "armor", STA: 8, DEX: -2, rarity: "COMMON"},
    {name: "Ninja Suit", type: "armor", STA: 2, DEX: 10, rarity: "RARE"},
    {name: "Dragon Scale", type: "armor", STA: 12, DEX: 4, rarity: "EPIC"}
];