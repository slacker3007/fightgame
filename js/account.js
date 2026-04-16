/**
 * Local account auth + profile storage.
 * Multi-account model keyed by nickname (case-insensitive) with local password hash.
 */
const ACCOUNT_STORAGE_KEY = 'fightgame_account_v2';
const ACCOUNT_LEGACY_STORAGE_KEY = 'fightgame_account_v1';
const ACCOUNT_SCHEMA_VERSION = 4;
const ACCOUNT_NICKNAME_MAX_LEN = 12;
/** Total account XP required to go from level L to L+1 is ACCOUNT_XP_PER_LEVEL (flat curve). */
const ACCOUNT_XP_PER_LEVEL = 100;
/** Account XP for clearing stage `stage` (1-based). */
const ACCOUNT_XP_STAGE_BASE = 8;
const ACCOUNT_XP_STAGE_PER_LEVEL = 2;
/** Extra account XP when the full gauntlet is completed. */
const ACCOUNT_XP_GAUNTLET_COMPLETE_BONUS = 250;
const PASSIVE_MILESTONE_FIRST_LEVEL = 5;
const PASSIVE_MILESTONE_STEP = 10;

let accountNickname = '';
/** @type {{ key: string, dataUrl?: string, imageUrl?: string } | null} */
let portraitCache = null;
/** Lifetime: highest gauntlet stage (1–100) cleared at least once. */
let bestStageBeaten = 0;
/** Account levels (10,20,…) for which slot milestones were claimed. */
let claimedMilestoneLevels = [];
/** Account levels (5,15,25,...) for which +1 all-stats passive was claimed. */
let claimedPassiveMilestoneLevels = [];
/** @type {{ schemaVersion: number, activeNicknameKey: string, accounts: Record<string, any> }} */
let accountStore = {
    schemaVersion: ACCOUNT_SCHEMA_VERSION,
    activeNicknameKey: '',
    accounts: {}
};

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

function normalizeNicknameKey(raw) {
    return clampNickname(raw).toLowerCase();
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

function isPassiveMilestoneLevel(level) {
    if (typeof isAccountPassiveMilestoneLevel === 'function') return isAccountPassiveMilestoneLevel(level);
    if (typeof level !== 'number') return false;
    return level >= PASSIVE_MILESTONE_FIRST_LEVEL && ((level - PASSIVE_MILESTONE_FIRST_LEVEL) % PASSIVE_MILESTONE_STEP === 0);
}

function buildPassiveClaimsForLevel(level) {
    const L = Math.max(1, Math.floor(level || 1));
    const out = [];
    for (let cur = PASSIVE_MILESTONE_FIRST_LEVEL; cur <= L; cur += PASSIVE_MILESTONE_STEP) out.push(cur);
    return out;
}

function normalizePassiveMilestones(arr, levelForBackfill) {
    const normalized = normalizeClaimedMilestones(arr).filter(isPassiveMilestoneLevel);
    if (normalized.length > 0) return normalized;
    const lv = typeof levelForBackfill === 'number' ? levelForBackfill : accountLevel;
    return buildPassiveClaimsForLevel(lv);
}

function clonePortrait(data) {
    if (!data || typeof data !== 'object' || typeof data.key !== 'string') return null;
    return {
        key: data.key,
        dataUrl: typeof data.dataUrl === 'string' ? data.dataUrl : undefined,
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined
    };
}

function createDefaultAccountRecord(nickname, passwordHash) {
    return {
        nickname: clampNickname(nickname),
        passwordHash: typeof passwordHash === 'string' ? passwordHash : '',
        accountXp: 0,
        portraitCache: null,
        bestStageBeaten: 0,
        claimedMilestoneLevels: [],
        claimedPassiveMilestoneLevels: []
    };
}

function sanitizeAccountRecord(rawRecord, fallbackNickname) {
    const src = rawRecord && typeof rawRecord === 'object' ? rawRecord : {};
    const xp = typeof src.accountXp === 'number' && Number.isFinite(src.accountXp) && src.accountXp >= 0
        ? Math.floor(src.accountXp)
        : 0;
    const lvl = accountLevelFromXp(xp);
    const nick = clampNickname(src.nickname || fallbackNickname || '');
    const best = typeof src.bestStageBeaten === 'number' && Number.isFinite(src.bestStageBeaten) && src.bestStageBeaten >= 0
        ? Math.min(GAUNTLET_TOTAL_STAGES, Math.floor(src.bestStageBeaten))
        : 0;
    const claimedSlots = normalizeClaimedMilestones(src.claimedMilestoneLevels);
    const claimedPassive = normalizePassiveMilestones(src.claimedPassiveMilestoneLevels, lvl);
    return {
        nickname: nick,
        passwordHash: typeof src.passwordHash === 'string' ? src.passwordHash : '',
        accountXp: xp,
        portraitCache: clonePortrait(src.portraitCache),
        bestStageBeaten: best,
        claimedMilestoneLevels: claimedSlots,
        claimedPassiveMilestoneLevels: claimedPassive
    };
}

function persistAccountStore() {
    try {
        localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accountStore));
    } catch (e) {
        console.warn('account: localStorage save failed', e);
    }
}

function readActiveRecord() {
    const key = accountStore.activeNicknameKey;
    if (!key || !accountStore.accounts || !accountStore.accounts[key]) return null;
    return accountStore.accounts[key];
}

function writeActiveRecord() {
    const key = accountStore.activeNicknameKey;
    if (!key || !accountStore.accounts || !accountStore.accounts[key]) return;
    accountStore.accounts[key] = {
        ...accountStore.accounts[key],
        nickname: accountNickname,
        accountXp: accountXp,
        portraitCache: clonePortrait(portraitCache),
        bestStageBeaten: bestStageBeaten,
        claimedMilestoneLevels: normalizeClaimedMilestones(claimedMilestoneLevels),
        claimedPassiveMilestoneLevels: normalizePassiveMilestones(claimedPassiveMilestoneLevels, accountLevel)
    };
}

function applyRecordToRuntime(record) {
    accountXp = record.accountXp;
    accountLevel = accountLevelFromXp(accountXp);
    accountNickname = record.nickname;
    portraitCache = clonePortrait(record.portraitCache);
    bestStageBeaten = record.bestStageBeaten;
    claimedMilestoneLevels = normalizeClaimedMilestones(record.claimedMilestoneLevels);
    claimedPassiveMilestoneLevels = normalizePassiveMilestones(record.claimedPassiveMilestoneLevels, accountLevel);
    syncUserNameFromAccount();
}

function clearRuntimeAccount() {
    accountXp = 0;
    accountLevel = 1;
    accountNickname = '';
    portraitCache = null;
    bestStageBeaten = 0;
    claimedMilestoneLevels = [];
    claimedPassiveMilestoneLevels = [];
    syncUserNameFromAccount();
}

/** Normalize legacy single-file payloads (schema 1–3) into v3 shape before v4 store migration. */
function migrateLegacyV1ToV2(data) {
    const xp = data.accountXp;
    const safeXp = typeof xp === 'number' && Number.isFinite(xp) && xp >= 0 ? Math.floor(xp) : 0;
    return {
        schemaVersion: 2,
        accountXp: safeXp,
        nickname: '',
        portraitCache: null
    };
}

function migrateLegacyV2ToV3(data) {
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
        schemaVersion: 3,
        accountXp: xp,
        nickname: typeof data.nickname === 'string' ? clampNickname(data.nickname) : '',
        portraitCache: pc,
        bestStageBeaten: 0,
        claimedMilestoneLevels: claimed
    };
}

function normalizeLegacyFileToV3Shape(raw) {
    if (!raw || typeof raw !== 'object') return null;
    let d = raw;
    if (d.schemaVersion === 1) d = migrateLegacyV1ToV2(d);
    if (d && d.schemaVersion === 2) d = migrateLegacyV2ToV3(d);
    if (d && d.schemaVersion === 3) return d;
    return null;
}

function migrateLegacyV3ToV4(rawLegacy) {
    if (!rawLegacy || typeof rawLegacy !== 'object') return null;
    if (rawLegacy.schemaVersion !== 3) return null;
    const nickname = clampNickname(rawLegacy.nickname || 'Traveler');
    if (!nickname) return null;
    const key = normalizeNicknameKey(nickname);
    const record = sanitizeAccountRecord({
        ...rawLegacy,
        nickname,
        passwordHash: ''
    }, nickname);
    return {
        schemaVersion: ACCOUNT_SCHEMA_VERSION,
        activeNicknameKey: key,
        accounts: { [key]: record }
    };
}

function loadAccountStore() {
    accountStore = {
        schemaVersion: ACCOUNT_SCHEMA_VERSION,
        activeNicknameKey: '',
        accounts: {}
    };
    try {
        const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && parsed.schemaVersion === ACCOUNT_SCHEMA_VERSION) {
                const accounts = {};
                const sourceAccounts = parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {};
                Object.keys(sourceAccounts).forEach(key => {
                    const safeKey = normalizeNicknameKey(key);
                    if (!safeKey) return;
                    accounts[safeKey] = sanitizeAccountRecord(sourceAccounts[key], key);
                });
                accountStore = {
                    schemaVersion: ACCOUNT_SCHEMA_VERSION,
                    activeNicknameKey: normalizeNicknameKey(parsed.activeNicknameKey || ''),
                    accounts
                };
                return;
            }
        }

        // One-time migration from pre-auth single-account profile storage.
        const legacyRaw = localStorage.getItem(ACCOUNT_LEGACY_STORAGE_KEY);
        if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            const v3 = normalizeLegacyFileToV3Shape(legacy) || legacy;
            const migrated = migrateLegacyV3ToV4(v3);
            if (migrated) {
                accountStore = migrated;
                persistAccountStore();
                return;
            }
        }
    } catch (e) {
        console.warn('account: localStorage load failed, using defaults', e);
    }
}

function loadLocalAccount() {
    clearRuntimeAccount();
    loadAccountStore();
    const active = readActiveRecord();
    if (!active) return;
    applyRecordToRuntime(sanitizeAccountRecord(active, active.nickname || ''));
}

function saveLocalAccount() {
    if (!accountStore.activeNicknameKey) return;
    writeActiveRecord();
    persistAccountStore();
}

function syncUserNameFromAccount() {
    userName = accountNickname;
}

function getAccountNickname() {
    return accountNickname;
}

function setAccountNickname(name) {
    const clean = clampNickname(name);
    if (!clean || !accountStore.activeNicknameKey) return;
    const oldKey = accountStore.activeNicknameKey;
    const newKey = normalizeNicknameKey(clean);
    if (!newKey) return;
    const existing = accountStore.accounts[oldKey] || createDefaultAccountRecord(clean, '');
    existing.nickname = clean;
    if (oldKey !== newKey) {
        if (accountStore.accounts[newKey]) return;
        delete accountStore.accounts[oldKey];
    }
    accountStore.accounts[newKey] = existing;
    accountStore.activeNicknameKey = newKey;
    accountNickname = clean;
    syncUserNameFromAccount();
    saveLocalAccount();
}

function hasActiveAccountSession() {
    return !!accountStore.activeNicknameKey && !!readActiveRecord();
}

function isAccountNameTaken(nickname) {
    const key = normalizeNicknameKey(nickname);
    return !!key && !!accountStore.accounts[key];
}

async function hashPasswordSha256(password) {
    const text = String(password || '');
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        const bytes = new TextEncoder().encode(text);
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for old runtimes without subtle crypto.
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return `fnv1a-${h.toString(16)}`;
}

async function registerLocalAccount(nickname, password) {
    const cleanNick = clampNickname(nickname);
    if (!cleanNick) return { ok: false, error: 'Name is required.' };
    if (String(password || '').length < 4) return { ok: false, error: 'Password must be at least 4 chars.' };
    const key = normalizeNicknameKey(cleanNick);
    if (accountStore.accounts[key]) return { ok: false, error: 'Name is already registered.' };
    const hash = await hashPasswordSha256(password);
    const record = createDefaultAccountRecord(cleanNick, hash);
    accountStore.accounts[key] = record;
    accountStore.activeNicknameKey = key;
    applyRecordToRuntime(record);
    persistAccountStore();
    return { ok: true };
}

async function loginLocalAccount(nickname, password) {
    const cleanNick = clampNickname(nickname);
    const key = normalizeNicknameKey(cleanNick);
    if (!key || !accountStore.accounts[key]) return { ok: false, error: 'Account not found.' };
    const record = sanitizeAccountRecord(accountStore.accounts[key], cleanNick);
    const hash = await hashPasswordSha256(password);
    if (record.passwordHash && record.passwordHash !== hash) {
        return { ok: false, error: 'Invalid password.' };
    }
    if (!record.passwordHash) {
        // Upgrade migrated legacy account on first login.
        record.passwordHash = hash;
    }
    accountStore.accounts[key] = record;
    accountStore.activeNicknameKey = key;
    applyRecordToRuntime(record);
    persistAccountStore();
    return { ok: true };
}

function logoutLocalAccount() {
    saveLocalAccount();
    accountStore.activeNicknameKey = '';
    persistAccountStore();
    clearRuntimeAccount();
}

function getPortraitCache() {
    return portraitCache;
}

function setPortraitCache(cache) {
    portraitCache = clonePortrait(cache);
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

function getClaimedPassiveMilestoneLevels() {
    return claimedPassiveMilestoneLevels.slice();
}

function isMilestoneClaimed(level) {
    return claimedMilestoneLevels.includes(level);
}

function isPassiveMilestoneClaimed(level) {
    return claimedPassiveMilestoneLevels.includes(level);
}

function getAccountPermanentStatBonus() {
    const total = claimedPassiveMilestoneLevels.length;
    return {
        STR: total,
        DEX: total,
        STA: total,
        LUCK: total
    };
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

function applyAccountLevelMilestoneGrants(oldLevel, newLevel) {
    if (typeof ACCOUNT_LEVEL_MILESTONES === 'undefined' || !Array.isArray(ACCOUNT_LEVEL_MILESTONES)) return;
    const slotSet = new Set(claimedMilestoneLevels);
    const passiveSet = new Set(claimedPassiveMilestoneLevels);
    let changed = false;

    for (const m of ACCOUNT_LEVEL_MILESTONES) {
        if (!m || typeof m.level !== 'number') continue;
        const L = m.level;
        if (oldLevel < L && newLevel >= L && !slotSet.has(L)) {
            slotSet.add(L);
            changed = true;
            const ore = typeof m.ore === 'number' && Number.isFinite(m.ore) ? Math.floor(m.ore) : 0;
            if (ore > 0 && typeof player === 'object' && player && typeof player.ore === 'number') {
                player.ore += ore;
                if (typeof addLog === 'function') addLog(`Account Lv ${L} reward: +${ore} Ore!`, COLORS.GOLD);
            } else if (typeof addLog === 'function') {
                const label = typeof m.label === 'string' && m.label ? m.label : 'Reward';
                const slotHint = m.slotId ? `${label} slot` : label;
                addLog(`Account Lv ${L}: ${slotHint} unlocked!`, COLORS.CYAN);
            }
        }
    }

    for (let L = PASSIVE_MILESTONE_FIRST_LEVEL; L <= newLevel; L += PASSIVE_MILESTONE_STEP) {
        if (oldLevel < L && !passiveSet.has(L)) {
            passiveSet.add(L);
            changed = true;
            if (typeof addLog === 'function') addLog(`Account Lv ${L}: +1 to all stats (permanent)!`, COLORS.GOLD);
        }
    }

    if (changed) {
        claimedMilestoneLevels = Array.from(slotSet).sort((a, b) => a - b);
        claimedPassiveMilestoneLevels = Array.from(passiveSet).sort((a, b) => a - b);
        if (typeof calcStats === 'function' && player && player.total) calcStats();
    }
}

function isAccountSlotUnlocked(slotId) {
    const m = typeof getAccountMilestoneBySlotId === 'function' ? getAccountMilestoneBySlotId(slotId) : null;
    if (!m || typeof m.level !== 'number') return false;
    if (typeof accountLevel !== 'number' || accountLevel < m.level) return false;
    return isMilestoneClaimed(m.level);
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
if (!hasActiveAccountSession()) {
    state = 'account_auth';
}
