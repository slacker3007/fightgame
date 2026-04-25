#!/usr/bin/env node
/**
 * Balance Monte Carlo — keep in sync with js/data.js (getScaledEnemyForStage)
 * and js/logic.js (prepareNextEnemyMove + resolveTurn combat math).
 *
 * Usage: node scripts/balance-sim.js
 */

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
    ["AETHELGARD", 1050, 72, 0.10, "boss", 9]
];

const BOSSES_PER_TIER = 10;
const TIER_HP_MUL = [1, 1.18, 1.4, 1.65, 1.95, 2.3, 2.75, 3.3, 3.85, 4.75];
const TIER_DMG_MUL = [1, 1.12, 1.26, 1.42, 1.58, 1.76, 1.98, 2.22, 2.48, 2.75];
const TIER_DODGE_MUL = [1, 1.05, 1.08, 1.1, 1.12, 1.14, 1.16, 1.18, 1.2, 1.22];
const NORMAL_TIER_STAGE_BOOST = 1.5;
const NORMAL_TIER_STAGE_BOSS_BOOST = 1.0;

function getGauntletTier(stage) {
    return Math.floor((stage - 1) / BOSSES_PER_TIER);
}

function getBossSlot(stage) {
    return ((stage - 1) % BOSSES_PER_TIER) + 1;
}

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
    return {
        hp: Math.round(d[1] * hpM * normalBlockBoost),
        dmg: Math.round(d[2] * dmgM * normalBlockBoost),
        dodge: Math.min(0.95, d[3] * dodgeM * normalBlockBoost),
        archetype: d[4] || "balanced"
    };
}

function prepareNextEnemyMove(enemy) {
    const r = Math.random();
    if (enemy.archetype === "heavy") {
        enemy.nextAtk = r < 0.7 ? ["1", "2", "3"][Math.floor(Math.random() * 3)] : ["4", "5"][Math.floor(Math.random() * 2)];
    } else if (enemy.archetype === "agile") {
        enemy.nextAtk = r < 0.7 ? ["3", "4", "5"][Math.floor(Math.random() * 3)] : ["1", "2"][Math.floor(Math.random() * 2)];
    } else {
        enemy.nextAtk = Math.floor(Math.random() * 5 + 1).toString();
    }
}

function rollEnemyBlockZones(enemy) {
    const rDef = Math.random();
    if (enemy.archetype === "heavy") {
        return (rDef < 0.6) ? ["1", "2"] : ["1", "2", "3", "4", "5"].sort(() => 0.5 - Math.random()).slice(0, 2);
    }
    if (enemy.archetype === "agile") {
        return (rDef < 0.6) ? ["4", "5"] : ["1", "2", "3", "4", "5"].sort(() => 0.5 - Math.random()).slice(0, 2);
    }
    return ["1", "2", "3", "4", "5"].sort(() => 0.5 - Math.random()).slice(0, 2);
}

function makePlayer(charType, gearBonus) {
    const g = { STR: 0, DEX: 0, STA: 0, LUCK: 0, ...gearBonus };
    const base = { STR: 2, DEX: 2, STA: 2, LUCK: 2 };
    if (charType === "STR") base.STR = 5;
    if (charType === "DEX") base.DEX = 5;
    if (charType === "LUCK") base.LUCK = 5;
    if (charType === "STA") base.STA = 5;
    const total = {
        STR: base.STR + g.STR,
        DEX: base.DEX + g.DEX,
        STA: base.STA + g.STA,
        LUCK: base.LUCK + g.LUCK
    };
    let dodge = Math.min(0.6, total.DEX * 0.02);
    let crit = Math.min(0.5, total.LUCK * 0.03);
    if (base.DEX >= 15) {
        dodge += 0.1;
        crit += 0.1;
    }
    return {
        baseSTR: base.STR,
        baseDEX: base.DEX,
        baseSTA: base.STA,
        baseLUCK: base.LUCK,
        total,
        maxHp: 100 + total.STA * 16,
        dmg: 10 + total.STR * 4,
        dodge,
        crit,
        fury: 0,
        maxFury: 100,
        isGodStrike: false
    };
}

function pickRandomZone() {
    return (Math.floor(Math.random() * 5) + 1).toString();
}

function pickRandomTwoZones() {
    const z = ["1", "2", "3", "4", "5"].sort(() => 0.5 - Math.random());
    return [z[0], z[1]];
}

function pickOracleBlock(nextAtk) {
    const rest = ["1", "2", "3", "4", "5"].filter(z => z !== nextAtk);
    const second = rest[Math.floor(Math.random() * rest.length)];
    return [nextAtk, second];
}

/** Human-like priors: same 70% zone bias as enemy attacks; no hidden nextAtk. */
function pickWeightedBlock(archetype) {
    const pickFrom = pool => pool[Math.floor(Math.random() * pool.length)];
    let a;
    let b;
    if (archetype === "heavy") {
        const hi = ["1", "2", "3"];
        const lo = ["4", "5"];
        a = Math.random() < 0.7 ? pickFrom(hi) : pickFrom(["1", "2", "3", "4", "5"]);
        b = Math.random() < 0.7 ? pickFrom(hi) : pickFrom(["1", "2", "3", "4", "5"]);
    } else if (archetype === "agile") {
        const lo = ["3", "4", "5"];
        const hi = ["1", "2"];
        a = Math.random() < 0.7 ? pickFrom(lo) : pickFrom(["1", "2", "3", "4", "5"]);
        b = Math.random() < 0.7 ? pickFrom(lo) : pickFrom(["1", "2", "3", "4", "5"]);
    } else {
        a = pickFrom(["1", "2", "3", "4", "5"]);
        b = pickFrom(["1", "2", "3", "4", "5"]);
    }
    if (a === b) {
        const alt = ["1", "2", "3", "4", "5"].filter(z => z !== a);
        b = alt[Math.floor(Math.random() * alt.length)];
    }
    return [a, b];
}

function pickOracleAttack(eBlkArr) {
    const candidates = ["1", "2", "3", "4", "5"].filter(z => !eBlkArr.includes(z));
    if (candidates.length === 0) return pickRandomZone();
    return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * @param {"random"|"weighted"|"oracle_block"|"oracle_full"} policy
 * oracle_* uses hidden info (upper bounds); weighted uses archetype priors only.
 */
function simulateFight(stage, player, policy, maxTurns = 800) {
    const spec = getScaledEnemyForStage(stage);
    const enemy = {
        hp: spec.hp,
        maxHp: spec.hp,
        dmg: spec.dmg,
        dodge: spec.dodge,
        archetype: spec.archetype,
        nextAtk: null
    };
    let hp = player.maxHp;
    let turns = 0;
    let fury = 0;

    while (enemy.hp > 0 && hp > 0 && turns < maxTurns) {
        turns++;
        prepareNextEnemyMove(enemy);
        const eBlkArr = rollEnemyBlockZones(enemy);
        let selAtk;
        let selBlk;
        if (policy === "random") {
            selAtk = pickRandomZone();
            selBlk = pickRandomTwoZones();
        } else if (policy === "weighted") {
            selAtk = pickRandomZone();
            selBlk = pickWeightedBlock(enemy.archetype);
        } else if (policy === "oracle_block") {
            selAtk = pickRandomZone();
            selBlk = pickOracleBlock(enemy.nextAtk);
        } else {
            selAtk = pickOracleAttack(eBlkArr);
            selBlk = pickOracleBlock(enemy.nextAtk);
        }

        const useGodStrike = false;
        let isHit = !eBlkArr.includes(selAtk);
        if (useGodStrike) {
            isHit = true;
            fury = 0;
        }

        if (!isHit) {
            /* whiff */
        } else {
            const enemyEvaded = !useGodStrike && Math.random() < enemy.dodge;
            if (!enemyEvaded) {
                const crit = useGodStrike || Math.random() < player.crit;
                let d = Math.floor(player.dmg * (crit ? 2 : 1) * (selAtk === "1" ? 1.4 : 1));
                enemy.hp -= d;
                if (player.baseSTR >= 15) {
                    enemy.hp -= Math.floor(d * 0.1);
                }
                if (!useGodStrike) fury = Math.min(player.maxFury, fury + 15);
            }
        }

        if (enemy.hp <= 0) break;

        const eAtk = enemy.nextAtk;
        if (selBlk.includes(eAtk)) {
            fury = Math.min(player.maxFury, fury + 10);
        } else if (Math.random() < player.dodge) {
            fury = Math.min(player.maxFury, fury + 10);
        } else {
            let d = enemy.dmg;
            if (player.baseSTA >= 15) {
                d -= Math.floor(d * 0.2);
            }
            hp -= d;
            fury = Math.min(player.maxFury, fury + 20);
        }
    }

    const win = enemy.hp <= 0 && hp > 0;
    return {
        win,
        turns,
        hpFrac: win ? hp / player.maxHp : 0
    };
}

function runTrials(stage, charType, gearBonus, policy, trials) {
    const player = makePlayer(charType, gearBonus);
    let wins = 0;
    let sumTurns = 0;
    let sumHpFrac = 0;
    for (let i = 0; i < trials; i++) {
        const r = simulateFight(stage, player, policy);
        if (r.win) {
            wins++;
            sumTurns += r.turns;
            sumHpFrac += r.hpFrac;
        }
    }
    const wr = wins / trials;
    const avgTurns = wins ? sumTurns / wins : 0;
    const avgHp = wins ? sumHpFrac / wins : 0;
    return { wr, avgTurns, avgHp };
}

/**
 * Approximates gear by depth: sqrt curve (early bosses assume some shop gear) plus
 * a small floor so slot-10 checks are not "naked vs AETHELGARD".
 */
function gearForStageFraction(f) {
    const f0 = Math.max(0, Math.min(1, f));
    const c = Math.sqrt(f0);
    return {
        STR: Math.round(30 * c) + 4,
        STA: Math.round(24 * c) + 6,
        DEX: Math.round(14 * c) + 2,
        LUCK: Math.round(10 * c) + 1
    };
}

const TRIALS = 300;
const STAGES = [1, 10, 20, 30, 50, 70, 90, 100];
const CHAR_TYPES = ["STR", "DEX", "STA", "LUCK"];

function main() {
    console.log("Gauntlet balance sim. Trials:", TRIALS);
    console.log("Policies: random | weighted (archetype priors) | oracle_* (hidden-info ceiling)\n");
    console.log("CSV: stage,char,policy,gear,winRate,avgTurnsWin,avgHpFracWin\n");

    for (const stage of STAGES) {
        const frac = (stage - 1) / 99;
        const gear = gearForStageFraction(frac);
        for (const char of CHAR_TYPES) {
            for (const policy of ["random", "weighted", "oracle_block", "oracle_full"]) {
                const naked = runTrials(stage, char, { STR: 0, DEX: 0, STA: 0, LUCK: 0 }, policy, TRIALS);
                const geared = runTrials(stage, char, gear, policy, TRIALS);
                console.log(
                    `${stage},${char},${policy},naked,${naked.wr.toFixed(3)},${naked.avgTurns.toFixed(1)},${naked.avgHp.toFixed(3)}`
                );
                console.log(
                    `${stage},${char},${policy},scaled,${geared.wr.toFixed(3)},${geared.avgTurns.toFixed(1)},${geared.avgHp.toFixed(3)}`
                );
            }
        }
    }

    console.log("\n--- Primary metric: weighted + scaled gear (mid-core) ---");
    for (const stage of [10, 20, 50, 70, 90, 100]) {
        const frac = (stage - 1) / 99;
        const gear = gearForStageFraction(frac);
        const parts = [];
        for (const char of CHAR_TYPES) {
            const r = runTrials(stage, char, gear, "weighted", TRIALS);
            parts.push(`${char}:${(r.wr * 100).toFixed(0)}%`);
        }
        console.log(`stage ${stage}: ${parts.join("  ")}`);
    }
}

main();
