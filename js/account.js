/**
 * Local account profile (versioned JSON). Same shape can later sync via GET/PATCH.
 */
const ACCOUNT_STORAGE_KEY = 'fightgame_account_v1';
const ACCOUNT_SCHEMA_VERSION = 3;
const ACCOUNT_NICKNAME_MAX_LEN = 12;
/** Total account XP required to go from level L to L+1 is ACCOUNT_XP_PER_LEVEL (flat curve). */
const ACCOUNT_XP_PER_LEVEL = 100;
/** Account XP for clearing stage `stage` (1-based). */
const ACCOUNT_XP_STAGE_BASE = 8;
const ACCOUNT_XP_STAGE_PER_LEVEL = 2;
/** Extra account XP when the full gauntlet is completed. */
const ACCOUNT_XP_GAUNTLET_COMPLETE_BONUS = 250;

let accountNickname = '';
/** @type {{ key: string, dataUrl?: string, imageUrl?: string } | null} */
let portraitCache = null;
/** Lifetime: highest gauntlet stage (1–100) cleared at least once. */
let bestStageBeaten = 0;
/** Account levels (10,20,…) for which milestone ore was granted (or backfilled on migrate without ore). */
let claimedMilestoneLevels = [];

function accountLevelFromXp(xp) {
    return 1 + Math.floor(Math.max(0, xp) / ACCOUNT_XP_PER_LEVEL);
}

function accountXpWithinCurrentLevel(xp) {
    const lv = accountLevelFromXp(xp);
    return xp - (lv - 1) * ACCOUNT_XP_PER_LEVEL;
}

function clampNickname(raw) {
    return String(raw || '').trim().slice(0, ACCOUNT_NICKNAME_MAX_LEN);
}

function normalizeClaimedMilestones(arr) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const x of arr) {
        const n = typeof x === 'number' ? Math.floor(x) : parseInt(x, 10);
        if (Number.isFinite(n) && !out.includes(n)) out.push(n);
    }
    return out.sort((a, b) => a - b);
}

function saveLocalAccount() {
    const payload = {
        schemaVersion: ACCOUNT_SCHEMA_VERSION,
        accountXp: accountXp,
        nickname: accountNickname,
        portraitCache: portraitCache,
        bestStageBeaten: bestStageBeaten,
        claimedMilestoneLevels: claimedMilestoneLevels
    };
    try {
        localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('account: localStorage save failed', e);
    }
}

function migrateV1ToV2(data) {
    const xp = data.accountXp;
    const safeXp = typeof xp === 'number' && Number.isFinite(xp) && xp >= 0 ? Math.floor(xp) : 0;
    return {
        schemaVersion: 2,
        accountXp: safeXp,
        nickname: '',
        portraitCache: null
    };
}

/** v2 → v3: add progress fields; mark milestones ≤ current account level as claimed without retro-ore. */
function migrateV2ToV3(data) {
    const xp = typeof data.accountXp === 'number' && Number.isFinite(data.accountXp) && data.accountXp >= 0
        ? Math.floor(data.accountXp) : 0;
    const accLv = accountLevelFromXp(xp);
    const claimed = [];
    if (typeof ACCOUNT_LEVEL_MILESTONES !== 'undefined' && Array.isArray(ACCOUNT_LEVEL_MILESTONES)) {
        for (const m of ACCOUNT_LEVEL_MILESTONES) {
            if (m && typeof m.level === 'number' && m.level <= accLv) claimed.push(m.level);
        }
    }
    let pc = null;
    if (data.portraitCache && typeof data.portraitCache === 'object' && typeof data.portraitCache.key === 'string') {
        pc = {
            key: data.portraitCache.key,
            dataUrl: typeof data.portraitCache.dataUrl === 'string' ? data.portraitCache.dataUrl : undefined,
            imageUrl: typeof data.portraitCache.imageUrl === 'string' ? data.portraitCache.imageUrl : undefined
        };
    }
    return {
        schemaVersion: ACCOUNT_SCHEMA_VERSION,
        accountXp: xp,
        nickname: typeof data.nickname === 'string' ? clampNickname(data.nickname) : '',
        portraitCache: pc,
        bestStageBeaten: 0,
        claimedMilestoneLevels: claimed
    };
}

function readPortraitFromData(data) {
    if (data.portraitCache && typeof data.portraitCache === 'object' && typeof data.portraitCache.key === 'string') {
        portraitCache = {
            key: data.portraitCache.key,
            dataUrl: typeof data.portraitCache.dataUrl === 'string' ? data.portraitCache.dataUrl : undefined,
            imageUrl: typeof data.portraitCache.imageUrl === 'string' ? data.portraitCache.imageUrl : undefined
        };
    } else {
        portraitCache = null;
    }
}

function applyAccountLevelMilestoneGrants(oldLevel, newLevel) {
    if (typeof ACCOUNT_LEVEL_MILESTONES === 'undefined' || !Array.isArray(ACCOUNT_LEVEL_MILESTONES)) return;
    const set = new Set(claimedMilestoneLevels);
    let changed = false;
    for (const m of ACCOUNT_LEVEL_MILESTONES) {
        if (!m || typeof m.level !== 'number') continue;
        const L = m.level;
        if (oldLevel < L && newLevel >= L && !set.has(L)) {
            set.add(L);
            changed = true;
            const ore = typeof m.ore === 'number' && Number.isFinite(m.ore) ? Math.floor(m.ore) : 0;
            if (ore > 0 && typeof player === 'object' && player && typeof player.ore === 'number') {
                player.ore += ore;
                if (typeof addLog === 'function') {
                    addLog(`Account Lv ${L} reward: +${ore} Ore!`, COLORS.GOLD);
                }
            } else if (typeof addLog === 'function') {
                if (m.rewardType === 'passive') {
                    addLog(`Account Lv ${L}: Passive reward unlocked! (Details coming soon.)`, COLORS.CYAN);
                } else {
                    const label = typeof m.label === 'string' && m.label ? m.label : 'Reward';
                    const slotHint = m.slotId ? `${label} slot` : label;
                    addLog(`Account Lv ${L}: ${slotHint} unlocked!`, COLORS.CYAN);
                }
            }
        }
    }
    if (changed) {
        claimedMilestoneLevels = Array.from(set).sort((a, b) => a - b);
    }
}

function isAccountSlotUnlocked(slotId) {
    const m = typeof getAccountMilestoneBySlotId === 'function' ? getAccountMilestoneBySlotId(slotId) : null;
    if (!m || typeof m.level !== 'number') return false;
    if (typeof accountLevel !== 'number' || accountLevel < m.level) return false;
    return isMilestoneClaimed(m.level);
}

function loadLocalAccount() {
    accountXp = 0;
    accountLevel = 1;
    accountNickname = '';
    portraitCache = null;
    bestStageBeaten = 0;
    claimedMilestoneLevels = [];
    try {
        const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
        if (!raw) {
            syncUserNameFromAccount();
            return;
        }
        let data = JSON.parse(raw);
        if (!data || typeof data !== 'object') {
            syncUserNameFromAccount();
            return;
        }
        if (data.schemaVersion === 1) {
            data = migrateV1ToV2(data);
            try {
                localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn('account: migrate save failed', e);
            }
        }
        if (data.schemaVersion === 2) {
            data = migrateV2ToV3(data);
            try {
                localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn('account: v3 migrate save failed', e);
            }
        }
        if (data.schemaVersion !== ACCOUNT_SCHEMA_VERSION) {
            syncUserNameFromAccount();
            return;
        }
        const xp = data.accountXp;
        if (typeof xp !== 'number' || !Number.isFinite(xp) || xp < 0) {
            syncUserNameFromAccount();
            return;
        }
        accountXp = Math.floor(xp);
        accountLevel = accountLevelFromXp(accountXp);
        if (typeof data.nickname === 'string') {
            accountNickname = clampNickname(data.nickname);
        }
        readPortraitFromData(data);
        if (typeof data.bestStageBeaten === 'number' && Number.isFinite(data.bestStageBeaten) && data.bestStageBeaten >= 0) {
            bestStageBeaten = Math.min(GAUNTLET_TOTAL_STAGES, Math.floor(data.bestStageBeaten));
        }
        claimedMilestoneLevels = normalizeClaimedMilestones(data.claimedMilestoneLevels);
    } catch (e) {
        console.warn('account: localStorage load failed, using defaults', e);
    }
    syncUserNameFromAccount();
}

function syncUserNameFromAccount() {
    userName = accountNickname;
}

function getAccountNickname() {
    return accountNickname;
}

function setAccountNickname(name) {
    accountNickname = clampNickname(name);
    syncUserNameFromAccount();
    saveLocalAccount();
}

function getPortraitCache() {
    return portraitCache;
}

function setPortraitCache(cache) {
    if (!cache) {
        portraitCache = null;
    } else if (typeof cache === 'object' && typeof cache.key === 'string') {
        portraitCache = {
            key: cache.key,
            dataUrl: typeof cache.dataUrl === 'string' ? cache.dataUrl : undefined,
            imageUrl: typeof cache.imageUrl === 'string' ? cache.imageUrl : undefined
        };
    } else {
        portraitCache = null;
    }
    saveLocalAccount();
}

function clearPortraitCache() {
    portraitCache = null;
    saveLocalAccount();
}

function getBestStageBeaten() {
    return bestStageBeaten;
}

function getClaimedMilestoneLevels() {
    return claimedMilestoneLevels.slice();
}

function isMilestoneClaimed(level) {
    return claimedMilestoneLevels.includes(level);
}

function recordBestStageCleared(stage) {
    const s = typeof stage === 'number' && stage >= 1 ? Math.floor(stage) : 0;
    if (s < 1) return;
    const capped = Math.min(GAUNTLET_TOTAL_STAGES, s);
    if (capped > bestStageBeaten) {
        bestStageBeaten = capped;
        saveLocalAccount();
    }
}

function grantAccountXp(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return;
    const oldLevel = accountLevelFromXp(accountXp);
    accountXp += Math.floor(amount);
    accountLevel = accountLevelFromXp(accountXp);
    applyAccountLevelMilestoneGrants(oldLevel, accountLevel);
    saveLocalAccount();
}

/** Single entry point from gameplay; keep for future remote sync hooks. */
function awardAccountXpForStageClear(stage, isGauntletComplete) {
    const st = typeof stage === 'number' && stage >= 1 ? stage : 1;
    let xp = ACCOUNT_XP_STAGE_BASE + st * ACCOUNT_XP_STAGE_PER_LEVEL;
    if (isGauntletComplete) xp += ACCOUNT_XP_GAUNTLET_COMPLETE_BONUS;
    grantAccountXp(xp);
}

loadLocalAccount();

if (!accountNickname) {
    state = 'account_nickname';
}
