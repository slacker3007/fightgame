const INV_LIMIT = 20;
const LEADERBOARD_URL = "https://script.google.com/macros/s/AKfycbxPyKw_jf7WT8zP9RvlZaCTp2O3FdfdxCRDvJ6iuJP3bHBPPLgEC15mPVfL3YsFM0wB/exec";
let inventoryError = false;

function getMaxStat(charType, statName) {
    return (charType === statName) ? 15 : 10;
}

function maybeUnlockNextStatCapTier() {
    const stats = ["STR", "DEX", "STA", "LUCK"];
    const cappedCount = stats.reduce((count, stat) => {
        return count + (player["base" + stat] >= player.maxStats[stat] ? 1 : 0);
    }, 0);

    if (cappedCount < 3) return false;

    stats.forEach(stat => {
        player.maxStats[stat] += 5;
    });
    return true;
}

function initPlayer(charType) {
    selectedChar = charType;
    let base = { STR: 2, DEX: 2, STA: 2, LUCK: 2 };
    if (charType === "STR") base.STR = 5;
    if (charType === "DEX") base.DEX = 5;
    if (charType === "LUCK") base.LUCK = 5;
    if (charType === "STA") base.STA = 5;

    const extraSlots = {};
    if (typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
        for (const sid of ACCOUNT_EQUIP_SLOT_IDS) extraSlots[sid] = null;
    }
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
        ...extraSlots,
        inventory: [],
        gold: 0,
        points: 0,
        accountBonus: { STR: 0, DEX: 0, STA: 0, LUCK: 0 },
        bonus: { STR: 0, DEX: 0, STA: 0, LUCK: 0 },
        total: { STR: base.STR, DEX: base.DEX, STA: base.STA, LUCK: base.LUCK }
    };
    calcStats();
    player.hp = player.maxHp;
    pDisplayHp = player.hp;
    log = [];
    inventoryError = false;
    scoreDetails = { hits: 0, crits: 0, blocks: 0, dodges: 0, hpBonus: 0, stageClear: 0 };
    addLog(`Welcome, ${charType} Champion.`, COLORS.TARNISHED_GOLD);
    if (typeof resetShopForNewRun === "function") resetShopForNewRun();
}

function calcStats() {
    if (typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
        for (const sid of ACCOUNT_EQUIP_SLOT_IDS) {
            if (typeof isAccountSlotUnlocked === "function" && !isAccountSlotUnlocked(sid)) {
                player[sid] = null;
            }
        }
    }
    if (player.mystery80 != null) player.mystery80 = null;
    if (player.mystery90 != null) player.mystery90 = null;
    if (player.mystery100 != null) player.mystery100 = null;
    const accountBonus = typeof getAccountPermanentStatBonus === "function"
        ? getAccountPermanentStatBonus()
        : { STR: 0, DEX: 0, STA: 0, LUCK: 0 };
    player.accountBonus = {
        STR: Math.max(0, Math.floor(accountBonus.STR || 0)),
        DEX: Math.max(0, Math.floor(accountBonus.DEX || 0)),
        STA: Math.max(0, Math.floor(accountBonus.STA || 0)),
        LUCK: Math.max(0, Math.floor(accountBonus.LUCK || 0))
    };
    player.bonus = { STR: 0, DEX: 0, STA: 0, LUCK: 0 };
    const equipList = [player.weapon, player.armor];
    if (typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
        for (const sid of ACCOUNT_EQUIP_SLOT_IDS) {
            if (typeof isAccountSlotUnlocked === "function" && isAccountSlotUnlocked(sid) && player[sid]) {
                equipList.push(player[sid]);
            }
        }
    }
    equipList.forEach(item => {
        if (item) {
            ["STR", "DEX", "STA", "LUCK"].forEach(s => {
                if (item[s]) player.bonus[s] += item[s];
            });
        }
    });

    ["STR", "DEX", "STA", "LUCK"].forEach(s => {
        player.total[s] = player["base" + s] + player.accountBonus[s] + player.bonus[s];
    });

    player.maxHp = 100 + (player.total.STA * 16);
    player.dmg = 10 + (player.total.STR * 4);
    player.dodge = Math.min(0.60, player.total.DEX * 0.02);
    player.crit = Math.min(0.50, player.total.LUCK * 0.03);

    // Special Abilities
    if (player.baseDEX >= 15) {
        player.dodge += 0.10;
        player.crit += 0.10;
    }
}

function bumpAutoplayCancel() {
    autoplayCancelGen++;
}

function startLevel(lvl) {
    bumpAutoplayCancel();
    combatAutoplayActive = false;
    combatAutoplayCancelled = false;
    autoplayKickPending = false;
    currentLvl = lvl;
    const spec = getScaledEnemyForStage(lvl);
    enemy = {
        name: spec.name,
        hp: spec.hp,
        maxHp: spec.hp,
        dmg: spec.dmg,
        dodge: spec.dodge,
        archetype: spec.archetype,
        bossSlot: spec.bossSlot,
        nextAtk: null
    };
    player.hp = player.maxHp;
    pDisplayHp = player.hp;
    eDisplayHp = enemy.hp;
    prepareNextEnemyMove();
    combatFlashes = [];
    combatVignette = 0;
    changeState("combat");
    const autoplayUnlocked = maxLvl > 1 || accountLevel >= 2;
    if (autoplayUnlocked && (lvl === 2 || (lvl === 1 && accountLevel >= 2)) && !localStorage.getItem(GAUNTLET_AUTOPLAY_TIP_DISMISSED_KEY)) {
        showAutoplayTip = true;
    } else {
        showAutoplayTip = false;
    }
    addLog(`Encountered ${enemy.name}!`, COLORS.BLOOD_RED);
}

function autoplaySleep(ms, gen) {
    return new Promise(resolve => {
        setTimeout(() => resolve(gen === autoplayCancelGen), ms);
    });
}

function currentAutoplayStepMs() {
    return AUTOPLAY_BASE_STEP_MS / Math.max(1, Math.min(3, combatAutoplaySpeed));
}

/** Mid-turn pause after player strike; length tracks live autoplay speed / on-off. */
async function waitResolveMidTurnPause() {
    let elapsed = 0;
    while (true) {
        const active = combatAutoplayActive && !combatAutoplayCancelled;
        const totalMs = active ? 600 / Math.max(1, Math.min(3, combatAutoplaySpeed)) : 600;
        if (elapsed >= totalMs) break;
        const slice = Math.min(50, totalMs - elapsed);
        await new Promise(r => setTimeout(r, slice));
        elapsed += slice;
    }
}

function shuffleZonesForAutoplay() {
    const z = ["1", "2", "3", "4", "5"];
    for (let i = z.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [z[i], z[j]] = [z[j], z[i]];
    }
    return z;
}

async function runCombatAutoplayTurn() {
    const gen = autoplayCancelGen;

    const bail = () => state !== "combat" || !combatAutoplayActive || combatAutoplayCancelled || isProcessing;

    if (!(await autoplaySleep(currentAutoplayStepMs(), gen)) || bail()) return;

    const zones = shuffleZonesForAutoplay();
    selBlk = [zones[0]];
    selAtk = null;

    if (!(await autoplaySleep(currentAutoplayStepMs(), gen)) || bail()) return;
    selBlk = [zones[0], zones[1]];

    if (!(await autoplaySleep(currentAutoplayStepMs(), gen)) || bail()) return;
    selAtk = (Math.floor(Math.random() * 5) + 1).toString();

    if (!(await autoplaySleep(currentAutoplayStepMs(), gen)) || bail()) return;

    if (player.fury >= player.maxFury) {
        player.isGodStrike = false;
    }

    if (gen !== autoplayCancelGen || bail()) return;
    await resolveTurn();
}

function maybeScheduleCombatAutoplay() {
    if (state !== "combat" || !combatAutoplayActive || combatAutoplayCancelled || isProcessing) return;
    if (enemy.hp <= 0 || player.hp <= 0) return;
    runCombatAutoplayTurn();
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

function spawnBloodBurst(rect, fromRight) {
    const originX = rect.x + rect.w * (fromRight ? 0.78 : 0.22);
    const originY = rect.y + rect.h * (0.36 + Math.random() * 0.22);
    const count = 14;
    const baseAngle = fromRight ? Math.PI * (0.55 + Math.random() * 0.35) : Math.PI * (-0.35 + Math.random() * 0.35);
    const shades = ["#3d0808", "#5c0c0c", "#8a1212", "#b81818", "#e02828"];
    for (let i = 0; i < count; i++) {
        const ang = baseAngle + (Math.random() - 0.5) * 0.9;
        const speed = 2.5 + Math.random() * 6;
        fxParticles.push({
            kind: "blood",
            x: originX + (Math.random() - 0.5) * 24,
            y: originY + (Math.random() - 0.5) * 24,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            gravity: 0.22,
            friction: 0.985,
            life: 0.52 + Math.random() * 0.38,
            color: shades[Math.floor(Math.random() * shades.length)],
            size: 2 + Math.random() * 3.5
        });
    }
}

function spawnEnemyBlockSparks() {
    const r = COMBAT_ENEMY_SPRITE;
    for (let i = 0; i < 18; i++) {
        fxParticles.push({
            kind: "spark",
            x: r.x + Math.random() * 28,
            y: r.y + r.h * (0.18 + Math.random() * 0.68),
            vx: -3.5 - Math.random() * 5.5,
            vy: (Math.random() - 0.5) * 5.5,
            friction: 0.93,
            life: 0.32 + Math.random() * 0.28,
            color: Math.random() > 0.42 ? "#fff8e8" : "#ffcc44",
            size: 1.2 + Math.random() * 2.2
        });
    }
}

function spawnPlayerParryStreaks() {
    const r = COMBAT_PLAYER_SPRITE;
    for (let i = 0; i < 12; i++) {
        fxParticles.push({
            kind: "streak",
            x: r.x + 12 + Math.random() * 55,
            y: r.y + r.h * (0.32 + Math.random() * 0.38),
            vx: -1.2 - Math.random() * 2,
            vy: -2.8 - Math.random() * 4.5,
            life: 0.38 + Math.random() * 0.36,
            color: Math.random() > 0.48 ? "#9efcff" : "#ffffff",
            length: 14 + Math.random() * 24,
            width: 1.5 + Math.random() * 2.5
        });
    }
}

function spawnCritBurstOnEnemy(count) {
    const r = COMBAT_ENEMY_SPRITE;
    const cx = r.x + r.w * 0.32;
    const cy = r.y + r.h * 0.4;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 11;
        fxParticles.push({
            kind: "spark",
            x: cx + (Math.random() - 0.5) * 30,
            y: cy + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            friction: 0.96,
            life: 0.48 + Math.random() * 0.42,
            color: Math.random() > 0.38 ? COLORS.GOLD : "#ffffff",
            size: 1.4 + Math.random() * 3.2
        });
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
        spawnEnemyBlockSparks();
        combatFlashes.push({ target: "enemy", type: "enemyBlock", life: 1 });
    } else {
        const enemyEvaded = !useGodStrike && Math.random() < enemy.dodge;
        if (enemyEvaded) {
            AudioEngine.playBlock();
            addLog(`Enemy EVADED your strike!`, COLORS.DIM_GRAY);
            spawnText("EVADED", 750, 300, COLORS.YELLOW);
            shake = 4;
            spawnEnemyBlockSparks();
            combatFlashes.push({ target: "enemy", type: "enemyBlock", life: 1 });
        } else {
        const crit = useGodStrike || (Math.random() < player.crit);
        if (useGodStrike) AudioEngine.playGodStrike();
        else if (crit) AudioEngine.playCrit();
        else AudioEngine.playHit();

        let d = Math.floor(player.dmg * (crit ? 2 : 1) * (selAtk === "1" ? 1.4 : 1));
        enemy.hp -= d;
        shake = crit ? 20 : 10;
        addLog(`You hit for ${d}!`, COLORS.BLOOD_RED);
        spawnText(d + (crit ? "!!" : ""), 750, 250, COLORS.RED);

        spawnBloodBurst(COMBAT_ENEMY_SPRITE, false);
        combatFlashes.push({ target: "enemy", type: "damage", life: 1 });
        if (useGodStrike) {
            spawnCritBurstOnEnemy(48);
            combatFlashes.push({ target: "enemy", type: "godStrike", life: 1 });
        } else if (crit) {
            spawnCritBurstOnEnemy(26);
        }

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
    }

    await waitResolveMidTurnPause();

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
            spawnPlayerParryStreaks();
            combatFlashes.push({ target: "player", type: "parry", life: 1 });
        } else if (Math.random() < player.dodge) {
            AudioEngine.playBlock();
            addLog(`You dodged the ${ZONE_NAMES[eAtk]} strike!`, COLORS.CYAN);
            spawnText("DODGE", 180, 300, COLORS.CYAN);
            shake = 2;
            player.fury = Math.min(player.maxFury, player.fury + 10);
            scoreDetails.dodges++;
            score += 30;
            spawnPlayerParryStreaks();
            combatFlashes.push({ target: "player", type: "parry", life: 1 });
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
            spawnBloodBurst(COMBAT_PLAYER_SPRITE, true);
            combatFlashes.push({ target: "player", type: "damage", life: 1 });
            combatVignette = Math.min(1, combatVignette + 0.55);
        }
    }
    selAtk = null;
    selBlk = [];
    isProcessing = false;
    prepareNextEnemyMove();
    checkEnd();
    if (state === "combat" && combatAutoplayActive && !combatAutoplayCancelled) {
        maybeScheduleCombatAutoplay();
    }
}

function checkEnd() {
    if (enemy.hp <= 0) {
        bumpAutoplayCancel();
        combatAutoplayActive = false;
        autoplayKickPending = false;
        const stagePoints = (currentLvl * 100);
        const hpBonus = Math.floor((player.hp / player.maxHp) * 50);
        score += stagePoints + hpBonus;
        scoreDetails.stageClear += stagePoints;
        scoreDetails.hpBonus += hpBonus;

        if (currentLvl === GAUNTLET_TOTAL_STAGES) {
            awardAccountXpForStageClear(currentLvl, true);
            recordBestStageCleared(currentLvl);
            saveScore();
            changeState("victory");
        } else {
            awardAccountXpForStageClear(currentLvl, false);
            if (currentLvl === maxLvl) {
                maxLvl = Math.min(GAUNTLET_TOTAL_STAGES, maxLvl + 1);
            }
            recordBestStageCleared(currentLvl);
            const goldGain = typeof getGoldForStageClear === "function"
                ? getGoldForStageClear(currentLvl)
                : (24 + currentLvl * 6);
            player.gold += goldGain;
            player.points += 2;
            player.hp = player.maxHp;
            AudioEngine.playLevelUp();
            levelUpTimer = 120;
            if (typeof rerollShopVisibleOffersFree === "function") rerollShopVisibleOffersFree();
            if (typeof shuffleShopMysterySlotMap === "function") shuffleShopMysterySlotMap();
            changeState("camp");
        }
    } else if (player.hp <= 0) {
        bumpAutoplayCancel();
        combatAutoplayActive = false;
        autoplayKickPending = false;
        AudioEngine.playGameOver();
        saveScore();
        changeState("gameover");
    }
}

function getCurrentCraftStageProgress() {
    return Math.max(1, maxLvl || 1);
}

function getCraftableItemsForStage(stage, rarity) {
    return ALL_ITEMS.filter(item => {
        if (rarity && item.rarity !== rarity) return false;
        return typeof isCraftTypeUnlockedAtStage === "function"
            ? isCraftTypeUnlockedAtStage(item.type, stage)
            : item.type === "weapon" || item.type === "armor";
    });
}

function resetShopForNewRun() {
    shopVisibleOffers = [null, null];
    shopMysterySlotMap = null;
    shopConsumedMysterySlots = {};
}

function resetShopConsumedMysterySlots() {
    shopConsumedMysterySlots = {};
}

function isShopMysterySlotConsumed(slot) {
    return !!(shopConsumedMysterySlots && shopConsumedMysterySlots[slot]);
}

function markShopMysterySlotConsumed(slot) {
    if (!shopConsumedMysterySlots || typeof shopConsumedMysterySlots !== "object") {
        shopConsumedMysterySlots = {};
    }
    shopConsumedMysterySlots[slot] = true;
}

function shuffleShopMysterySlotMap() {
    const tierCount = (typeof SHOP_MYSTERY_BOXES !== "undefined" && Array.isArray(SHOP_MYSTERY_BOXES))
        ? SHOP_MYSTERY_BOXES.length
        : 6;
    const fallback = 1 / Math.max(1, tierCount);
    const weights = (typeof SHOP_MYSTERY_DISPLAY_WEIGHTS !== "undefined"
        && Array.isArray(SHOP_MYSTERY_DISPLAY_WEIGHTS)
        && SHOP_MYSTERY_DISPLAY_WEIGHTS.length === tierCount)
        ? SHOP_MYSTERY_DISPLAY_WEIGHTS
        : Array(tierCount).fill(fallback);
    const sampleTier = () => {
        const r = Math.random();
        let t = 0;
        for (let i = 0; i < weights.length; i++) {
            t += Math.max(0, weights[i]);
            if (r < t) return i;
        }
        return Math.max(0, weights.length - 1);
    };
    shopMysterySlotMap = Array.from({ length: 6 }, sampleTier);
}

/** Slot 0 / 4 = fixed-price offers; else mystery. */
function shopSlotOfferIndex(slot) {
    if (slot === 0) return 0;
    if (slot === 4) return 1;
    return -1;
}

/** Local mystery index 0–5 for slots 1,2,3,5,6,7. */
function shopSlotMysteryLocalIndex(slot) {
    if (slot === 1 || slot === 2 || slot === 3) return slot - 1;
    if (slot === 5 || slot === 6 || slot === 7) return slot - 2;
    return -1;
}

/** Tier index into SHOP_MYSTERY_BOXES for this grid slot. */
function getMysteryTierIndexForShopSlot(slot) {
    const local = shopSlotMysteryLocalIndex(slot);
    if (local < 0) return -1;
    if (!shopMysterySlotMap || shopMysterySlotMap.length !== 6) return local;
    return shopMysterySlotMap[local];
}

function rollShopVisibleSlot(stage, excludeItemName) {
    let pool = getCraftableItemsForStage(stage);
    if (!pool.length) return null;
    if (excludeItemName) {
        const filtered = pool.filter((it) => it.name !== excludeItemName);
        if (filtered.length) pool = filtered;
    }
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = pool[i];
        pool[i] = pool[j];
        pool[j] = t;
    }
    const pick = pool[0];
    const item = JSON.parse(JSON.stringify(pick));
    const price = typeof getShopVisibleListPrice === "function" ? getShopVisibleListPrice(item) : 45;
    return { item, price };
}

function ensureShopVisibleSlotsFilled() {
    if (typeof shopVisibleOffers === "undefined") return;
    const stage = getCurrentCraftStageProgress();
    if (shopMysterySlotMap == null && typeof shuffleShopMysterySlotMap === "function") {
        shuffleShopMysterySlotMap();
    }
    for (let i = 0; i < 2; i++) {
        if (!shopVisibleOffers[i]) {
            const ex = i === 1 && shopVisibleOffers[0] && shopVisibleOffers[0].item
                ? shopVisibleOffers[0].item.name
                : null;
            shopVisibleOffers[i] = rollShopVisibleSlot(stage, ex);
        }
    }
    if (shopVisibleOffers[0] && shopVisibleOffers[1] && shopVisibleOffers[0].item && shopVisibleOffers[1].item
        && shopVisibleOffers[0].item.name === shopVisibleOffers[1].item.name) {
        shopVisibleOffers[1] = rollShopVisibleSlot(
            stage,
            shopVisibleOffers[0].item.name
        );
    }
}

/** Reroll both fixed-price shop rows (no gold). Used after stage wins and after paid refresh. */
function rerollShopVisibleOffersFree() {
    if (typeof shopVisibleOffers === "undefined") return;
    const stage = getCurrentCraftStageProgress();
    shopVisibleOffers[0] = rollShopVisibleSlot(stage, null);
    shopVisibleOffers[1] = rollShopVisibleSlot(
        stage,
        shopVisibleOffers[0] && shopVisibleOffers[0].item ? shopVisibleOffers[0].item.name : null
    );
    resetShopConsumedMysterySlots();
}

function tryPurchaseShopVisible(slotIndex) {
    const off = shopVisibleOffers[slotIndex];
    if (!off || !off.item) return;

    if (player.inventory.length >= INV_LIMIT) {
        inventoryError = true;
        addLog("Inventory Full!", COLORS.BLOOD_RED);
        return;
    }
    if (player.gold < off.price) {
        addLog(`Need ${off.price} gold.`, COLORS.BLOOD_RED);
        spawnText("NEED GOLD", 480, 300, COLORS.RED);
        return;
    }
    inventoryError = false;
    player.gold -= off.price;
    player.inventory.push(JSON.parse(JSON.stringify(off.item)));
    shopVisibleOffers[slotIndex] = null;
    AudioEngine.playLevelUp();
    spawnText("BOUGHT!", 480, 280, COLORS.GOLD);
    addLog(`Bought ${off.item.name} for ${off.price} gold.`, COLORS.TARNISHED_GOLD);
}

function rollItemFromMysteryBox(boxIndex) {
    const box = typeof SHOP_MYSTERY_BOXES !== "undefined" ? SHOP_MYSTERY_BOXES[boxIndex] : null;
    if (!box) return null;
    const craftStage = getCurrentCraftStageProgress();
    const unlockedPool = getCraftableItemsForStage(craftStage);
    if (!unlockedPool.length) return null;

    let rarity = typeof sampleMysteryRarityFromBox === "function"
        ? sampleMysteryRarityFromBox(box)
        : "COMMON";
    if (rarity === "LEGENDARY" && player.baseLUCK < 15) {
        rarity = "EPIC";
    }

    let possible = getCraftableItemsForStage(craftStage, rarity);
    if (possible.length === 0) {
        possible = unlockedPool;
    }
    if (possible.length === 0) return null;
    return JSON.parse(JSON.stringify(possible[Math.floor(Math.random() * possible.length)]));
}

function tryPurchaseMysteryBox(boxIndex, shopSlot) {
    const box = typeof SHOP_MYSTERY_BOXES !== "undefined" ? SHOP_MYSTERY_BOXES[boxIndex] : null;
    if (!box) return;
    if (typeof shopSlot === "number" && isShopMysterySlotConsumed(shopSlot)) return;

    if (player.inventory.length >= INV_LIMIT) {
        inventoryError = true;
        addLog("Inventory Full!", COLORS.BLOOD_RED);
        return;
    }
    if (player.gold < box.price) {
        addLog(`Need ${box.price} gold.`, COLORS.BLOOD_RED);
        spawnText("NEED GOLD", 480, 300, COLORS.RED);
        return;
    }

    const newItem = rollItemFromMysteryBox(boxIndex);
    if (!newItem) {
        addLog("No eligible items for this chest.", COLORS.BLOOD_RED);
        return;
    }

    inventoryError = false;
    player.gold -= box.price;
    player.inventory.push(newItem);
    if (typeof shopSlot === "number") markShopMysterySlotConsumed(shopSlot);
    AudioEngine.playCast();
    spawnText("OPENED!", 480, 280, COLORS.GOLD);
    addLog(`Opened ${box.label}: ${newItem.name}.`, COLORS.TARNISHED_GOLD);
}

function performShopRefresh() {
    const cost = typeof getShopRefreshCost === "function" ? getShopRefreshCost(maxLvl) : 44;
    if (player.gold < cost) {
        addLog(`Need ${cost} gold to refresh.`, COLORS.BLOOD_RED);
        spawnText("NEED GOLD", 480, 300, COLORS.RED);
        return;
    }
    player.gold -= cost;
    rerollShopVisibleOffersFree();
    if (typeof shuffleShopMysterySlotMap === "function") shuffleShopMysterySlotMap();
    AudioEngine.playClick();
    addLog(`Shop refreshed (-${cost} gold).`, COLORS.CYAN);
}

function isItemEquippedAnywhere(item) {
    if (!item || !player) return false;
    if (item === player.weapon || item === player.armor) return true;
    if (typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
        for (const sid of ACCOUNT_EQUIP_SLOT_IDS) {
            if (player[sid] === item) return true;
        }
    }
    return false;
}

function sellItemForGold(item) {
    if (!item || isItemEquippedAnywhere(item)) return;
    const g = typeof getSellGoldForItem === "function" ? getSellGoldForItem(item) : 10;
    player.gold += g;
    player.inventory = player.inventory.filter(i => i !== item);
    inventoryError = false;
    addLog(`Sold ${item.name} for ${g} gold.`, COLORS.DIM_GRAY);
    selectedInvItem = null;
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