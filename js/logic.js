const INV_LIMIT = 20;
let inventoryError = false;

function getMaxStat(charType, statName) {
    return (charType === statName) ? 15 : 10;
}

function initPlayer(charType) {
    selectedChar = charType;
    let base = { STR: 2, DEX: 2, STA: 2, LUCK: 2 };
    if (charType === "STR") base.STR = 5;
    if (charType === "DEX") base.DEX = 5;
    if (charType === "LUCK") base.LUCK = 5;
    if (charType === "STA") base.STA = 5;

    // Map the selected character asset to the generic 'player' key used in rendering
    assets['player'] = assets[`player_${charType}`];

    player = {
        baseSTR: base.STR, baseDEX: base.DEX, baseSTA: base.STA, baseLUCK: base.LUCK,
        maxStats: {
            STR: getMaxStat(charType, "STR"),
            DEX: getMaxStat(charType, "DEX"),
            STA: getMaxStat(charType, "STA"),
            LUCK: getMaxStat(charType, "LUCK")
        },
        hp: 0, maxHp: 0,
        fury: 0, maxFury: 100, isGodStrike: false,
        weapon: null, armor: null,
        inventory: [],
        ore: 0,
        points: 0,
        bonus: { STR: 0, DEX: 0, STA: 0, LUCK: 0 },
        total: { STR: base.STR, DEX: base.DEX, STA: base.STA, LUCK: base.LUCK }
    };
    calcStats();
    player.hp = player.maxHp;
    pDisplayHp = player.hp;
    log = [];
    inventoryError = false;
    addLog(`Welcome, ${charType} Champion.`, COLORS.GOLD);
}

function calcStats() {
    player.bonus = { STR: 0, DEX: 0, STA: 0, LUCK: 0 };
    [player.weapon, player.armor].forEach(item => {
        if (item) {
            ["STR", "DEX", "STA", "LUCK"].forEach(s => {
                if (item[s]) player.bonus[s] += item[s];
            });
        }
    });

    ["STR", "DEX", "STA", "LUCK"].forEach(s => {
        player.total[s] = player["base" + s] + player.bonus[s];
    });

    player.maxHp = 100 + (player.total.STA * 15);
    player.dmg = 10 + (player.total.STR * 4);
    player.dodge = Math.min(0.60, player.total.DEX * 0.02);
    player.crit = Math.min(0.50, player.total.LUCK * 0.03);

    // Special Abilities
    if (player.baseDEX >= 15) {
        player.dodge += 0.10;
        player.crit += 0.10;
    }
}

function startLevel(lvl) {
    currentLvl = lvl;
    const d = ENEMY_DATA[lvl - 1];
    enemy = {
        name: d[0],
        hp: d[1],
        maxHp: d[1],
        dmg: d[2],
        dodge: d[3],
        archetype: d[4] || "balanced",
        nextAtk: null
    };
    player.hp = player.maxHp;
    pDisplayHp = player.hp;
    eDisplayHp = enemy.hp;
    prepareNextEnemyMove();
    changeState("combat");
    addLog(`Encountered ${enemy.name}!`, COLORS.RED);
}

function prepareNextEnemyMove() {
    const r = Math.random();
    if (enemy.archetype === "heavy") {
        enemy.nextAtk = r < 0.7 ? ["1", "2", "3"][Math.floor(Math.random() * 3)] : ["4", "5"][Math.floor(Math.random() * 2)];
    } else if (enemy.archetype === "agile") {
        enemy.nextAtk = r < 0.7 ? ["3", "4", "5"][Math.floor(Math.random() * 3)] : ["1", "2"][Math.floor(Math.random() * 2)];
    } else {
        enemy.nextAtk = Math.floor(Math.random() * 5 + 1).toString();
    }
}

async function resolveTurn() {
    if (isProcessing) return;
    isProcessing = true;

    // Enemy Defense Logic
    let eBlkArr = [];
    const rDef = Math.random();
    if (enemy.archetype === "heavy") {
        eBlkArr = (rDef < 0.6) ? ["1", "2"] : ["1", "2", "3", "4", "5"].sort(() => .5 - Math.random()).slice(0, 2);
    } else if (enemy.archetype === "agile") {
        eBlkArr = (rDef < 0.6) ? ["4", "5"] : ["1", "2", "3", "4", "5"].sort(() => .5 - Math.random()).slice(0, 2);
    } else {
        eBlkArr = ["1", "2", "3", "4", "5"].sort(() => .5 - Math.random()).slice(0, 2);
    }

    // Player Attack Phase
    let isHit = !eBlkArr.includes(selAtk);
    let useGodStrike = player.isGodStrike;

    if (useGodStrike) {
        isHit = true; // God Strike ignores block
        player.isGodStrike = false;
        player.fury = 0;
        addLog(`GOD STRIKE UNLEASHED!`, COLORS.GOLD);
        spawnText("GOD STRIKE", 750, 400, COLORS.GOLD);
    }

    if (!isHit) {
        addLog(`Enemy BLOCKED!`, COLORS.YELLOW);
        spawnText("BLOCKED", 750, 300, COLORS.YELLOW);
        shake = 4;
    } else {
        let crit = (Math.random() < player.crit) || useGodStrike;
        let d = Math.floor(player.dmg * (crit ? 2 : 1) * (selAtk === "1" ? 1.4 : 1));
        enemy.hp -= d;
        shake = crit ? 20 : 10;
        addLog(`You hit for ${d}!`, COLORS.RED);
        spawnText(d + (crit ? "!!" : ""), 750, 250, COLORS.RED);

        // STR Special Ability: Spill Damage
        if (player.baseSTR >= 15) {
            const spill = Math.floor(d * 0.10);
            enemy.hp -= spill;
            addLog(`Spill DMG: ${spill}!`, COLORS.RARITY_LEGENDARY);
            spawnText(spill, 750, 280, COLORS.RARITY_LEGENDARY);
        }

        if (!useGodStrike) player.fury = Math.min(player.maxFury, player.fury + 15);
    }

    await new Promise(r => setTimeout(r, 600));

    if (enemy.hp > 0) {
        let eAtk = enemy.nextAtk;
        if (selBlk.includes(eAtk)) {
            addLog(`Blocked enemy ${ZONE_NAMES[eAtk]} attack!`, COLORS.CYAN);
            spawnText("BLOCK", 180, 300, COLORS.CYAN);
            shake = 2;
            player.fury = Math.min(player.maxFury, player.fury + 10);
        } else {
            let d = enemy.dmg;
            // STA Special Ability: Damage Reduction
            if (player.baseSTA >= 15) {
                const reduced = Math.floor(d * 0.20);
                d -= reduced;
                addLog(`Mitigated ${reduced} DMG!`, COLORS.GREEN);
            }
            player.hp -= d;
            shake = 12;
            addLog(`Enemy hit your ${ZONE_NAMES[eAtk]}!`, COLORS.RED);
            spawnText("-" + d, 180, 250, COLORS.RED);
            player.fury = Math.min(player.maxFury, player.fury + 20);
        }
    }
    selAtk = null;
    selBlk = [];
    isProcessing = false;
    prepareNextEnemyMove();
    checkEnd();
}

function checkEnd() {
    if (enemy.hp <= 0) {
        score += (currentLvl * 100);
        if (currentLvl === 10) {
            saveScore();
            changeState("victory");
        } else {
            if (currentLvl === maxLvl) {
                maxLvl = Math.min(10, maxLvl + 1);
            }
            player.ore += (currentLvl * 5);
            player.points += 2;
            player.hp = player.maxHp;
            levelUpTimer = 120;
            changeState("camp");
        }
    } else if (player.hp <= 0) {
        saveScore();
        changeState("gameover");
    }
}

function craftItem() {
    if (player.inventory.length >= INV_LIMIT) {
        inventoryError = true;
        addLog("Inventory Full!", COLORS.RED);
        return;
    }

    const COST = 10;
    if (player.ore < COST) {
        addLog(`Need ${COST} Ore!`, COLORS.RED);
        spawnText("NEED ORE", 480, 325, COLORS.RED);
        return;
    }
    player.ore -= COST;
    inventoryError = false;

    const epicCh = 0.05 + (player.total.LUCK * 0.01);
    const rareCh = 0.15 + (player.total.LUCK * 0.02);
    const legCh = (player.baseLUCK >= 15) ? 0.02 : 0;
    const roll = Math.random();

    let rarity = "COMMON";
    if (roll < legCh) rarity = "LEGENDARY";
    else if (roll < legCh + epicCh) rarity = "EPIC";
    else if (roll < legCh + epicCh + rareCh) rarity = "RARE";

    const possible = ALL_ITEMS.filter(i => i.rarity === rarity);
    const newItem = JSON.parse(JSON.stringify(possible[Math.floor(Math.random() * possible.length)]));
    pendingCraftedItem = newItem;
    craftingAnimTimer = 60; // 1 second animation
}

function resolveCrafting(keep) {
    if (!craftedItem) return;

    if (keep) {
        player.inventory.push(craftedItem);
        addLog(`Forged: ${craftedItem.name}!`, COLORS[`RARITY_${craftedItem.rarity}`]);
        spawnText("CRAFTED!", 480, 280, COLORS.GOLD);
    } else {
        const refund = craftedItem.rarity === "EPIC" ? 8 : (craftedItem.rarity === "RARE" ? 5 : 3);
        player.ore += refund;
        addLog(`Salvaged ${craftedItem.name} for ${refund} Ore.`, COLORS.CYAN);
        spawnText("SALVAGED", 480, 280, COLORS.CYAN);
    }
    craftedItem = null;
}

function salvageItem(item) {
    if (!item || item === player.weapon || item === player.armor) return;

    const refund = item.rarity === "EPIC" ? 8 : (item.rarity === "RARE" ? 5 : 3);
    player.ore += refund;
    player.inventory = player.inventory.filter(i => i !== item);
    inventoryError = false;

    addLog(`Salvaged ${item.name} for ${refund} Ore.`, COLORS.CYAN);
    selectedInvItem = null;
    salvageConfirm = null;
}

function addLog(txt, col) { log.push({ txt, col }); if (log.length > 50) log.shift(); }
function spawnText(txt, x, y, col) { particles.push({ txt, x, y, col, life: 1.0, vy: -2 }); }

function saveScore() {
    highScores.push({ name: userName || "Hero", score: score });
    highScores.sort((a, b) => b.score - a.score);
    localStorage.setItem('gauntletScores', JSON.stringify(highScores.slice(0, 5)));
}