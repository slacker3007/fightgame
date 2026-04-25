/**
 * AI portrait via your own HTTPS proxy (never put API keys in this file).
 *
 * URL resolution (first non-empty wins):
 *   window.__PORTRAIT_API_URL__  — override for local testing
 *   PORTRAIT_API_URL below
 *
 * POST JSON body the client sends:
 *   { nickname, classKey, accountLevel, style }
 *
 * Proxy may respond with:
 *   - image/png or image/jpeg (or any image/*) body → cached as data URL in account
 *   - application/json with { "imageUrl": "https://..." } or { "url": "..." } → cached URL in account
 *
 * CORS: proxy must send Access-Control-Allow-Origin for your game origin (or *).
 */
const PORTRAIT_API_URL = '';
const PORTRAIT_ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);

let portraitStatus = 'idle';
let portraitDisplayImage = null;
let portraitInFlight = false;
let portraitForceRegenerate = false;
let portraitLastHandledKey = '';
let portraitFailedKey = '';

function getPortraitApiUrl() {
    if (typeof window !== 'undefined' && window.__PORTRAIT_API_URL__) {
        return String(window.__PORTRAIT_API_URL__);
    }
    return PORTRAIT_API_URL || '';
}

function buildPortraitCacheKey(nick, classKey, level) {
    return `${nick}|${classKey}|${level}`;
}

function isAllowedRemoteImageUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
    try {
        const parsed = new URL(rawUrl, window.location.href);
        return PORTRAIT_ALLOWED_PROTOCOLS.has(parsed.protocol);
    } catch (_err) {
        return false;
    }
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}

function applyCachedImage(cache, cacheKeyForFail) {
    if (cache.dataUrl) {
        const img = new Image();
        img.onload = () => {
            portraitDisplayImage = img;
            portraitStatus = 'ok';
            portraitFailedKey = '';
        };
        img.onerror = () => {
            portraitStatus = 'error';
            portraitDisplayImage = null;
            portraitFailedKey = cacheKeyForFail || '';
        };
        img.src = cache.dataUrl;
        return;
    }
    if (cache.imageUrl) {
        if (!isAllowedRemoteImageUrl(cache.imageUrl)) {
            portraitStatus = 'error';
            portraitDisplayImage = null;
            portraitFailedKey = cacheKeyForFail || '';
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            portraitDisplayImage = img;
            portraitStatus = 'ok';
            portraitFailedKey = '';
        };
        img.onerror = () => {
            portraitStatus = 'error';
            portraitDisplayImage = null;
            portraitFailedKey = cacheKeyForFail || '';
        };
        img.src = cache.imageUrl;
    }
}

function tickAccountPortrait(classKey) {
    const ck = classKey || selectedChar || 'STR';
    const nick = getAccountNickname();
    const level = accountLevel;
    const key = buildPortraitCacheKey(nick, ck, level);
    const api = getPortraitApiUrl();
    const cache = getPortraitCache();

    if (!portraitForceRegenerate && getPortraitApiUrl() && portraitFailedKey === key && portraitStatus === 'error') {
        return;
    }

    if (!portraitForceRegenerate && cache && cache.key === key && (cache.dataUrl || cache.imageUrl)) {
        if (portraitLastHandledKey === key) {
            if (portraitDisplayImage && portraitDisplayImage.complete && portraitDisplayImage.naturalWidth > 0) {
                portraitStatus = 'ok';
            }
            return;
        }
        portraitLastHandledKey = key;
        portraitStatus = 'loading';
        portraitDisplayImage = null;
        applyCachedImage(cache, key);
        return;
    }

    if (!api) {
        portraitFailedKey = '';
        portraitLastHandledKey = key + '|noapi';
        portraitStatus = 'no_api';
        portraitDisplayImage = null;
        portraitInFlight = false;
        return;
    }

    if (portraitInFlight) return;

    portraitInFlight = true;
    portraitStatus = 'loading';
    portraitDisplayImage = null;
    portraitLastHandledKey = key;

    const body = { nickname: nick, classKey: ck, accountLevel: level, style: 'fantasy_bust_portrait' };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
    })
        .then(async res => {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error('portrait http ' + res.status);
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            if (ct.includes('application/json')) {
                const j = await res.json();
                const imageUrl = j.imageUrl || j.url || j.image;
                if (!isAllowedRemoteImageUrl(imageUrl)) throw new Error('invalid image url');
                setPortraitCache({ key, imageUrl });
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageUrl;
                });
                portraitDisplayImage = img;
                portraitStatus = 'ok';
                portraitFailedKey = '';
            } else {
                const blob = await res.blob();
                const dataUrl = await blobToDataUrl(blob);
                setPortraitCache({ key, dataUrl });
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = dataUrl;
                });
                portraitDisplayImage = img;
                portraitStatus = 'ok';
                portraitFailedKey = '';
            }
            portraitForceRegenerate = false;
        })
        .catch(err => {
            clearTimeout(timeoutId);
            console.warn('portrait: fetch failed', err);
            portraitStatus = 'error';
            portraitDisplayImage = null;
            portraitFailedKey = key;
            portraitForceRegenerate = false;
        })
        .finally(() => {
            portraitInFlight = false;
        });
}

function regenerateAccountPortrait() {
    portraitForceRegenerate = true;
    portraitInFlight = false;
    portraitDisplayImage = null;
    portraitLastHandledKey = '';
    portraitFailedKey = '';
    clearPortraitCache();
}

function getPortraitStatus() {
    return portraitStatus;
}

function getPortraitDisplayImage() {
    return portraitDisplayImage;
}
