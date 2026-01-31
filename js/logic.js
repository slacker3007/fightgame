/**
 * logic.js - Core Game Mechanics
 */

function initPlayer() {
    player = { 
        STR: 5, DEX: 5, STA: 5, LUCK: 5, 
        hp: 0, maxHp: 0, 
        weapon: null, armor: null, 
        inventory: [], points: 0, bonus: {} 
    };
    calcStats();
    player.hp = player.maxHp; 
    pDisplayHp = player.hp;
    log = [];
    addLog("Welcome to the Gauntlet.", COLORS.GOLD);
}

function calcStats() {
    player.bonus = {STR: 0, DEX: 0, STA: 0, LUCK: 0};
    [player.weapon, player.armor].forEach(item => {
        if(item) {
            ["STR", "DEX", "STA", "LUCK"].forEach(s => {
                if(item[s]) player.bonus[s] += item[s];
            });
        }
    });
    player.maxHp = 100 + ((player.STA + player.bonus.STA) * 15);
    player.dmg = 10 + ((player.STR + player.bonus.STR) * 4);
    player.dodge = Math.min(0.60, (player.DEX + player.bonus.DEX) * 0.02);
    player.crit = Math.min(0.50, (player.LUCK + player.bonus.LUCK) * 0.03);
}

function startLevel(lvl) {
    const d = ENEMY_DATA[lvl-1];
    enemy = { name: d[0], hp: d[1], maxHp: d[1], dmg: d[2], dodge: d[3] };
    eDisplayHp = enemy.hp;
    state = "combat";
    addLog(`Encountered ${enemy.name}!`, COLORS.RED);
}

async function resolveTurn() {
    if (isProcessing) return;
    isProcessing = true;
    let eBlkArr = ["1","2","3","4","5"].sort(()=>.5-Math.random()).slice(0,2);
    if(eBlkArr.includes(selAtk)) {
        addLog(`Enemy BLOCKED!`, COLORS.YELLOW);
        spawnText("BLOCKED", 750, 300, COLORS.YELLOW);
        shake = 4; 
    } else {
        let crit = Math.random() < player.crit;
        let d = Math.floor(player.dmg * (crit ? 2 : 1) * (selAtk === "1" ? 1.4 : 1));
        enemy.hp -= d; 
        shake = crit ? 20 : 10; 
        addLog(`You hit for ${d}!`, COLORS.RED);
        spawnText(d + (crit ? "!!" : ""), 750, 250, COLORS.RED);
    }
    await new Promise(r => setTimeout(r, 600));
    if(enemy.hp > 0) {
        let eAtk = Math.floor(Math.random()*5+1).toString();
        if(selBlk.includes(eAtk)) {
            addLog(`Blocked enemy ${ZONE_NAMES[eAtk]} attack!`, COLORS.CYAN);
            spawnText("BLOCK", 180, 300, COLORS.CYAN);
            shake = 2; 
        } else {
            player.hp -= enemy.dmg; 
            shake = 12; 
            addLog(`Enemy hit your ${ZONE_NAMES[eAtk]}!`, COLORS.RED);
            spawnText("-" + enemy.dmg, 180, 250, COLORS.RED);
        }
    }
    selAtk = null; selBlk = []; isProcessing = false;
    checkEnd();
}

function checkEnd() {
    if(enemy.hp <= 0) {
        score += (currentLvl * 100);
        if(currentLvl === 10) { 
            saveScore(); state = "victory"; 
        } else {
            const item = ALL_ITEMS[Math.floor(Math.random()*ALL_ITEMS.length)];
            player.inventory.push(item); 
            player.points += 2;
            player.hp = player.maxHp;
            levelUpTimer = 120; // Trigger the banner (2 seconds at 60fps)
            state = "camp";
        }
    } else if(player.hp <= 0) { saveScore(); state = "gameover"; }
}

function addLog(txt, col) { log.push({txt, col}); if(log.length > 50) log.shift(); }
function spawnText(txt, x, y, col) { particles.push({ txt, x, y, col, life: 1.0, vy: -2 }); }

function saveScore() {
    highScores.push({name: userName || "Hero", score: score});
    highScores.sort((a,b) => b.score - a.score);
    localStorage.setItem('gauntletScores', JSON.stringify(highScores.slice(0, 5)));
}