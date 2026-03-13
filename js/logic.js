const INV_LIMIT = 20;
const LEADERBOARD_URL = "https://script.google.com/macros/s/AKfycbxPyKw_jf7WT8zP9RvlZaCTp2O3FdfdxCRDvJ6iuJP3bHBPPLgEC15mPVfL3YsFM0wB/exec";
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
    scoreDetails = { hits: 0, crits: 0, blocks: 0, hpBonus: 0, stageClear: 0 };
    addLog(`Welcome, ${charType} Champion.`, COLORS.TARNISHED_GOLD);
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
    addLog(`Encountered ${enemy.name}!`, COLORS.BLOOD_RED);
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
        addLog(`GOD STRIKE UNLEASHED!`, COLORS.TARNISHED_GOLD);
        spawnText("GOD STRIKE", 750, 400, COLORS.GOLD);
    }

    if (!isHit) {
        AudioEngine.playBlock();
        addLog(`Enemy BLOCKED!`, COLORS.DIM_GRAY);
        spawnText("BLOCKED", 750, 300, COLORS.YELLOW);
        shake = 4;
    } else {
        if (useGodStrike) AudioEngine.playGodStrike();
        else {
            let crit = (Math.random() < player.crit);
            if (crit) AudioEngine.playCrit();
            else AudioEngine.playHit();
        }
        let crit = (Math.random() < player.crit) || useGodStrike;
        let d = Math.floor(player.dmg * (crit ? 2 : 1) * (selAtk === "1" ? 1.4 : 1));
        enemy.hp -= d;
        shake = crit ? 20 : 10;
        addLog(`You hit for ${d}!`, COLORS.BLOOD_RED);
        spawnText(d + (crit ? "!!" : ""), 750, 250, COLORS.RED);

        scoreDetails.hits++;
        if (crit) {
            scoreDetails.crits++;
            score += 50;
        } else {
            score += 20;
        }

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
            AudioEngine.playBlock();
            addLog(`Blocked enemy ${ZONE_NAMES[eAtk]} attack!`, COLORS.DIM_GRAY);
            spawnText("BLOCK", 180, 300, COLORS.CYAN);
            shake = 2;
            player.fury = Math.min(player.maxFury, player.fury + 10);
            scoreDetails.blocks++;
            score += 30;
        } else {
            let d = enemy.dmg;
            // STA Special Ability: Damage Reduction
            if (player.baseSTA >= 15) {
                const reduced = Math.floor(d * 0.20);
                d -= reduced;
                addLog(`Mitigated ${reduced} DMG!`, COLORS.GREEN);
            }
            player.hp -= d;
            AudioEngine.playHit();
            shake = 12;
            addLog(`Enemy hit your ${ZONE_NAMES[eAtk]}!`, COLORS.BLOOD_RED);
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
        const stagePoints = (currentLvl * 100);
        const hpBonus = Math.floor((player.hp / player.maxHp) * 50);
        score += stagePoints + hpBonus;
        scoreDetails.stageClear += stagePoints;
        scoreDetails.hpBonus += hpBonus;

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
            AudioEngine.playLevelUp();
            levelUpTimer = 120;
            changeState("camp");
        }
    } else if (player.hp <= 0) {
        AudioEngine.playGameOver();
        saveScore();
        changeState("gameover");
    }
}

function craftItem() {
    if (player.inventory.length >= INV_LIMIT) {
        inventoryError = true;
        addLog("Inventory Full!", COLORS.BLOOD_RED);
        return;
    }

    const COST = 10;
    if (player.ore < COST) {
        addLog(`Need ${COST} Ore!`, COLORS.BLOOD_RED);
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
    AudioEngine.playCast();
    craftingAnimTimer = 60; // 1 second animation
}

function resolveCrafting(keep) {
    if (!craftedItem) return;

    if (keep) {
        player.inventory.push(craftedItem);
        AudioEngine.playLevelUp(); // Triumph sound for keeping
        spawnText("CRAFTED!", 480, 280, COLORS.GOLD);
    } else {
        const refund = craftedItem.rarity === "EPIC" ? 8 : (craftedItem.rarity === "RARE" ? 5 : 3);
        player.ore += refund;
        AudioEngine.playBlock(); // Metallic sound for salvage
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

    addLog(`Salvaged ${item.name} for ${refund} Ore.`, COLORS.DIM_GRAY);
    selectedInvItem = null;
    salvageConfirm = null;
}

function addLog(txt, col) { log.push({ txt, col }); if (log.length > 50) log.shift(); }
function spawnText(txt, x, y, col) { particles.push({ txt, x, y, col, life: 1.0, vy: -2 }); }


// Initial fetch on load
fetchScoresFromSheets();

async function saveScore() {
    const entry = { name: userName || "Hero", score: score };

    // Save locally first
    highScores.push(entry);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('gauntletScores', JSON.stringify(highScores));

    // Try to save globally
    if (LEADERBOARD_URL) {
        await sendScoreToSheets(entry.name, entry.score);
        await fetchScoresFromSheets();
    }
}

async function sendScoreToSheets(name, score) {
    console.log(`Attempting to send score for ${name}: ${score}...`);
    try {
        // We use text/plain to ensure it's a "simple" request that avoids CORS preflight.
        // Google Apps Script can still read the JSON string from e.postData.contents.
        const response = await fetch(LEADERBOARD_URL, {
            method: 'POST',
            mode: 'no-cors', // Essential for Google Apps Script to avoid preflight
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ name, score })
        });
        console.log("Score submission sent (waiting for sheet to process).");
    } catch (err) {
        console.error("Critical error sending score:", err);
    }
}

async function fetchScoresFromSheets() {
    if (!LEADERBOARD_URL || isFetchingScores) return;
    isFetchingScores = true;
    try {
        const response = await fetch(LEADERBOARD_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
            highScores = data;
            localStorage.setItem('gauntletScores', JSON.stringify(highScores));
        }
    } catch (err) {
        console.warn("Global scores unavailable, using local fallback.", err);
    } finally {
        isFetchingScores = false;
    }
}