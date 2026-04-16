function drawLoadingScreen() {
    ctx.fillStyle = COLORS.DARK_BG;
    ctx.fillRect(0, 0, 960, 650);

    const barWidth = 400;
    const progress = assetsLoaded / totalAssets;
    const currentWidth = (barWidth - 10) * progress;

    // Outer Bar
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(480 - barWidth / 2, 325, barWidth, 30);

    // Inner Progress
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillRect(485 - barWidth / 2, 330, currentWidth, 20);

    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "bold 24px Ubuntu";
    ctx.fillText("FORGING ARENA ASSETS...", 480, 300);

    ctx.font = "12px Ubuntu";
    ctx.fillStyle = COLORS.GRAY;
    ctx.fillText(`${assetsLoaded} / ${totalAssets} LOADED`, 480, 375);
}

function drawFxParticles() {
    fxParticles.forEach(p => {
        ctx.save();
        const kind = p.kind || "circle";
        const alpha = Math.min(1, p.life * (kind === "streak" ? 1.5 : 1.15));
        ctx.globalAlpha = alpha;
        if (kind === "circle") {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === "blood") {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.size * 1.15, p.size * 0.82, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === "spark") {
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (kind === "streak") {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.width || 2;
            ctx.lineCap = "round";
            const len = (p.length || 16) * Math.min(1, p.life * 1.4);
            const ang = Math.atan2(p.vy, p.vx);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - Math.cos(ang) * len, p.y - Math.sin(ang) * len);
            ctx.stroke();
        }
        ctx.restore();
    });
}

function drawCombatFlashOverlays() {
    combatFlashes.forEach(f => {
        const rect = f.target === "player" ? COMBAT_PLAYER_SPRITE : COMBAT_ENEMY_SPRITE;
        const a = Math.min(1, f.life * 1.05);
        ctx.save();
        if (f.type === "damage") {
            ctx.globalAlpha = a * 0.72;
            ctx.strokeStyle = `rgba(230,40,40,${a})`;
            ctx.lineWidth = 4 + 6 * f.life;
            ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
        } else if (f.type === "parry") {
            ctx.globalAlpha = a * 0.68;
            ctx.strokeStyle = `rgba(120,245,255,${a})`;
            ctx.lineWidth = 3 + 5 * f.life;
            ctx.shadowBlur = 18 * f.life;
            ctx.shadowColor = "#00e8ff";
            ctx.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
            ctx.shadowBlur = 0;
        } else if (f.type === "enemyBlock") {
            ctx.globalAlpha = a * 0.58;
            ctx.strokeStyle = `rgba(255,215,96,${a})`;
            ctx.lineWidth = 2 + 3 * f.life;
            ctx.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
        } else if (f.type === "godStrike") {
            ctx.globalAlpha = a * 0.88;
            ctx.strokeStyle = `rgba(255,252,220,${a})`;
            ctx.lineWidth = 6 + 8 * f.life;
            ctx.shadowBlur = 28 * f.life;
            ctx.shadowColor = COLORS.GOLD;
            ctx.strokeRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    });
}

// ... Keep all your existing draw functions (drawCamp, etc.) below this ...
function drawStyledBtn(x, y, w, h, txt, baseCol) {
    // Outer Glow/Border
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.CYAN;
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.shadowBlur = 0;

    // Main Gradient
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, baseCol);
    grad.addColorStop(1, "#000000"); // Darken at bottom
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Inner Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Label
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "bold 20px Ubuntu";
    ctx.textAlign = "center";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "black";
    ctx.fillText(txt || "???", x + w / 2, y + h / 2 + 7);
    ctx.shadowBlur = 0;
}

/** Autoplay control: vector plate (no bitmap mat) so it sits cleanly on combat art */
function drawAutoplayPlate(x, y, w, h) {
    ctx.save();
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "#1a1a2e");
    g.addColorStop(0.45, "#16213e");
    g.addColorStop(1, "#0f3460");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    const s = Math.min(10, Math.floor(h * 0.35));
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillRect(x - 1, y - 1, s, 2); ctx.fillRect(x - 1, y - 1, 2, s);
    ctx.fillRect(x + w - s + 1, y - 1, s, 2); ctx.fillRect(x + w - 1, y - 1, 2, s);
    ctx.fillRect(x - 1, y + h - 1, s, 2); ctx.fillRect(x - 1, y + h - s + 1, 2, s);
    ctx.fillRect(x + w - s + 1, y + h - 1, s, 2); ctx.fillRect(x + w - 1, y + h - s + 1, 2, s);
    ctx.restore();
}

/** Scales autoplay PNG uniformly into the button rect; true if the bitmap was drawn */
function tryDrawAutoplayBitmap(btn) {
    const img = assets['autoplay_btn'];
    if (!img || !img.complete || !img.naturalWidth) return false;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.min(btn.w / iw, btn.h / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = btn.x + (btn.w - dw) / 2, dy = btn.y + (btn.h - dh) / 2;
    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
    return true;
}

function drawLevelUp() {
    if (levelUpTimer <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, levelUpTimer / 30);
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 250, 960, 100);
    ctx.strokeStyle = COLORS.GOLD; ctx.lineWidth = 4;
    ctx.strokeRect(0, 250, 960, 100);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 48px Ubuntu";
    ctx.fillText("STAGE CLEAR!", 480, 310);
    ctx.font = "bold 18px Ubuntu"; ctx.fillStyle = COLORS.CYAN;
    ctx.fillText("+2 STAT POINTS & MATERIALS RECEIVED", 480, 335);
    ctx.restore();
    levelUpTimer--;
}


function drawHealthBar(x, y, w, val, max, name, isPlayer = false) {
    ctx.fillStyle = "rgba(200, 50, 50, 0.3)"; ctx.fillRect(x, y, w, 20);
    ctx.fillStyle = COLORS.GREEN; ctx.fillRect(x, y, w * (Math.max(0, val) / max), 20);
    ctx.strokeStyle = "white"; ctx.strokeRect(x, y, w, 20);
    
    ctx.textAlign = "left";
    const fullText = `${name.toUpperCase()}: ${Math.floor(val)}/${max}`;
    
    if (isPlayer) {
        // Player: 26px, Pirata One, Weathered
        let fontSize = 26;
        ctx.font = `${fontSize}px 'Pirata One'`;
        while (ctx.measureText(fullText).width > w && fontSize > 12) {
            fontSize--;
            ctx.font = `${fontSize}px 'Pirata One'`;
        }
        ctx.fillStyle = "#FFF5DC"; // Cream color
        
        // "Weathered" effect applied to the whole string
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(fullText, x, y - 12);
        
        // Reset shadows
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else {
        // Enemy: 23px, New Rocker
        let fontSize = 23;
        ctx.font = `${fontSize}px 'New Rocker', 'Ubuntu', sans-serif`;
        while (ctx.measureText(fullText).width > w && fontSize > 12) {
            fontSize--;
            ctx.font = `${fontSize}px 'New Rocker', 'Ubuntu', sans-serif`;
        }
        ctx.fillStyle = COLORS.RED;
        ctx.fillText(fullText, x, y - 12);
    }
}

function drawSprite(key, x, y, w, h, label, color) {
    const asset = assets[key];

    if (asset && (asset.complete || (asset.readyState !== undefined && asset.readyState >= 1))) {
        try {
            ctx.drawImage(asset, x, y, w, h);
        } catch (e) {}
    } else {
        ctx.fillStyle = color || "#323232";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "white";
        ctx.font = "12px Ubuntu";
        ctx.textAlign = "center";
        ctx.fillText(label || key, x + w / 2, y + h / 2);
    }
}

function drawPlayerClassSprite(charClass, x, y, w, h, label, color) {
    drawSprite(`player_${charClass}`, x, y, w, h, label, color);
}

function drawSpriteStrip8(key, x, y, w, h, frameIndex, label, color) {
    const asset = assets[key];
    if (!asset || !(asset.complete || (asset.readyState !== undefined && asset.readyState >= 1)) || asset.naturalWidth < 8) {
        drawSprite(key, x, y, w, h, label, color);
        return;
    }
    const sw = asset.naturalWidth / 8;
    const sh = asset.naturalHeight;
    const fi = ((frameIndex % 8) + 8) % 8;
    try {
        ctx.drawImage(asset, fi * sw, 0, sw, sh, x, y, w, h);
    } catch (e) {
        drawSprite(key, x, y, w, h, label, color);
    }
}

function drawSlot(x, y, label, item, size = 120, slotOpts) {
    const locked = slotOpts && slotOpts.locked;
    const reqLevel = slotOpts && typeof slotOpts.reqLevel === "number" ? slotOpts.reqLevel : null;
    ctx.fillStyle = COLORS.SLOT_BG;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = item ? COLORS[`RARITY_${item.rarity}`] : COLORS.GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, size, size);
    ctx.lineWidth = 1;
    ctx.fillStyle = COLORS.GRAY; ctx.font = (size <= 60 ? "bold 12px Ubuntu" : "bold 14px Ubuntu"); ctx.textAlign = "center";
    ctx.fillText(label, x + size / 2, y + Math.min(22, size * 0.28));
    if (locked) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = COLORS.DIM_GRAY;
        ctx.font = (size <= 60 ? "bold 10px Ubuntu" : "bold 11px Ubuntu");
        if (reqLevel != null) ctx.fillText("Lv " + reqLevel, x + size / 2, y + size * 0.62);
        ctx.font = (size <= 60 ? "9px Ubuntu" : "10px Ubuntu");
        ctx.fillText("LOCKED", x + size / 2, y + size * 0.78);
    } else if (item) {
        const imgSize = size * 0.75, offset = (size - imgSize) / 2;
        drawSprite(item.name, x + offset, y + offset + 5, imgSize, imgSize, item.name.substring(0, 3), COLORS[`RARITY_${item.rarity}`]);
    }
}

/** Fixed 3x3 equipment grid layout (must match handleInventoryClick in main.js). */
function getInventoryEquipmentGridLayout(centerLine) {
    const slotSize = 56;
    const gap = 6;
    const cols = 3;
    const startY = 140;
    const order = [
        { slotId: "weapon", slotLabel: "WEAPON", baseSlot: true },
        { slotId: "helm", slotLabel: "HELM" },
        { slotId: "shield", slotLabel: "SHIELD" },
        { slotId: "gloves", slotLabel: "GLOVES" },
        { slotId: "armor", slotLabel: "ARMOR", baseSlot: true },
        { slotId: "boots", slotLabel: "BOOTS" },
        { slotId: "ring", slotLabel: "RING" },
        { slotId: "necklace", slotLabel: "NECK" },
        { slotId: "banner", slotLabel: "BANNER" }
    ];
    return order.map((slot, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const m = slot.baseSlot ? null
            : (typeof getAccountMilestoneBySlotId === "function" ? getAccountMilestoneBySlotId(slot.slotId) : null);
        return {
            milestone: m,
            slotId: slot.slotId,
            slotLabel: (m && m.slotLabel) || slot.slotLabel,
            baseSlot: !!slot.baseSlot,
            x: centerLine + col * (slotSize + gap),
            y: startY + row * (slotSize + gap),
            w: slotSize,
            h: slotSize
        };
    });
}

const ACCOUNT_HEADER_OX = 14;
const ACCOUNT_HEADER_OY = 6;

function getAccountHeaderLayout() {
    const pw = 56, ph = 56, textW = 240, gap = 8;
    return {
        hit: { x: ACCOUNT_HEADER_OX, y: ACCOUNT_HEADER_OY, w: pw + gap + textW, h: ph },
        ox: ACCOUNT_HEADER_OX,
        oy: ACCOUNT_HEADER_OY,
        pw,
        ph,
        textW,
        gap
    };
}

function truncateNicknameHeader(ctx, name, maxW) {
    const n = name || "—";
    if (ctx.measureText(n).width <= maxW) return n;
    let s = n;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s + "…";
}

function drawAccountHeaderMini() {
    const { ox, oy, pw, ph, textW, gap } = getAccountHeaderLayout();
    const classKey = selectedChar || "STR";
    tickAccountPortrait(classKey);

    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, pw, ph);
    ctx.fillStyle = "rgba(35,35,48,0.95)";
    ctx.fillRect(ox + 1, oy + 1, pw - 2, ph - 2);

    const st = getPortraitStatus();
    const img = getPortraitDisplayImage();
    if (st === "ok" && img && img.complete && img.naturalWidth > 0) {
        const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = ox + (pw - dw) / 2;
        const dy = oy + (ph - dh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(ox + 1, oy + 1, pw - 2, ph - 2);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
    } else {
        drawPlayerClassSprite(classKey, ox + 4, oy + 4, pw - 8, ph - 8, classKey);
    }

    const badgeCx = ox + pw - 8;
    const badgeCy = oy + 12;
    const badgeR = 12;
    ctx.beginPath();
    ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lv = accountLevel;
    ctx.font = lv >= 100 ? "bold 9px Ubuntu" : lv >= 10 ? "bold 11px Ubuntu" : "bold 12px Ubuntu";
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillText(String(lv), badgeCx, badgeCy);

    const tx = ox + pw + gap;
    const nickY = oy + 14;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 15px Ubuntu";
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillText(truncateNicknameHeader(ctx, getAccountNickname(), textW), tx, nickY);

    const barX = tx;
    const barY = oy + 22;
    const barW = textW;
    const barH = 16;
    const xpIn = accountXpWithinCurrentLevel(accountXp);
    const pct = Math.min(100, Math.round((xpIn / ACCOUNT_XP_PER_LEVEL) * 100));
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillRect(barX, barY, barW * (pct / 100), barH);
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.font = "bold 11px Ubuntu";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillText(pct + "%", barX + barW / 2, barY + barH / 2);
}

function drawAccountNickname() {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, 960, 650);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 40px Ubuntu";
    ctx.fillText("ACCOUNT NAME", 480, 150);
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "20px Ubuntu";
    ctx.fillText("THIS NAME IS USED IN BATTLE AND ON THE LEADERBOARD", 480, 220);
    ctx.fillText("TYPE YOUR NICKNAME, THEN CONTINUE", 480, 255);
    ctx.fillStyle = "#28283C";
    ctx.fillRect(330, 400, 300, 50);
    ctx.strokeStyle = COLORS.GOLD;
    ctx.strokeRect(330, 400, 300, 50);
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = "bold 24px Ubuntu";
    ctx.fillText(accountNicknameInput + (Math.floor(Date.now() / 500) % 2 == 0 ? "|" : ""), 480, 435);
    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawAccountAuth() {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, 960, 650);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 46px Ubuntu";
    ctx.fillText("ACCOUNT", 480, 170);
    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "20px Ubuntu";
    ctx.fillText("Local account login keeps your level, rewards, and portrait.", 480, 240);
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = "16px Ubuntu";
    ctx.fillText("Choose LOGIN for existing account or REGISTER to create one.", 480, 270);
    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawAccountAuthForm(title, submitHint) {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, 960, 650);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 44px Ubuntu";
    ctx.fillText(title, 480, 140);
    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "16px Ubuntu";
    ctx.fillText("Use TAB to switch fields. Press ENTER to submit.", 480, 182);

    const form = typeof getAccountAuthFormLayout === "function" ? getAccountAuthFormLayout() : {
        nicknameBox: { x: 330, y: 250, w: 300, h: 50 },
        passwordBox: { x: 330, y: 335, w: 300, h: 50 }
    };

    const drawField = (rect, label, value, active, mask) => {
        ctx.fillStyle = "rgba(18,18,32,0.9)";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = active ? COLORS.CYAN : COLORS.GOLD;
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.textAlign = "left";
        ctx.fillStyle = COLORS.GRAY;
        ctx.font = "bold 13px Ubuntu";
        ctx.fillText(label, rect.x + 10, rect.y - 8);
        const shown = mask ? "*".repeat(value.length) : value;
        const cursor = active && Math.floor(Date.now() / 450) % 2 === 0 ? "|" : "";
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = "bold 24px Ubuntu";
        ctx.fillText(shown + cursor, rect.x + 12, rect.y + 34);
    };

    drawField(form.nicknameBox, "NICKNAME", accountAuthNicknameInput || "", accountAuthActiveField === "nickname", false);
    drawField(form.passwordBox, "PASSWORD", accountAuthPasswordInput || "", accountAuthActiveField === "password", true);

    if (accountAuthMessage) {
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.RED;
        ctx.font = "bold 15px Ubuntu";
        ctx.fillText(accountAuthMessage, 480, 430);
    } else {
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.CYAN;
        ctx.font = "14px Ubuntu";
        ctx.fillText(submitHint, 480, 430);
    }

    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawAccountRegister() {
    drawAccountAuthForm("REGISTER ACCOUNT", "Create your local account and continue.");
}

function drawAccountLogin() {
    drawAccountAuthForm("LOGIN", "Log into your local account.");
}

function getAccountProfileLayout() {
    const panel = { x: 20, y: 18, w: 920, h: 560 };
    const pad = 24;
    const buttonSafeY = 590;
    const portrait = { x: panel.x + pad, y: panel.y + 78, w: 160, h: 160 };
    const text = {
        x: portrait.x + portrait.w + 20,
        y: portrait.y + 22,
        w: panel.x + panel.w - pad - (portrait.x + portrait.w + 20)
    };
    const bar = {
        x: panel.x + pad,
        w: panel.w - pad * 2,
        h: 20,
        xpY: portrait.y + portrait.h + 24,
        gauntletY: portrait.y + portrait.h + 76
    };
    const rewards = {
        x: bar.x,
        y: bar.gauntletY + 58,
        w: bar.w,
        h: 170
    };
    return { panel, pad, buttonSafeY, portrait, text, bar, rewards };
}

function drawAccountProfilePanelFrame(L) {
    const { x, y, w, h } = L.panel;
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, 960, 650);

    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(22,22,36,0.92)");
    g.addColorStop(1, "rgba(10,10,18,0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
}

function drawAccountProfileBar(x, y, w, h, ratio, label, fillColor) {
    const clamped = Math.max(0, Math.min(1, ratio));
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "bold 15px Ubuntu";
    ctx.fillText(label, x, y - 8);

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w * clamped, h);
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "bold 12px Ubuntu";
    ctx.fillText(Math.round(clamped * 100) + "%", x + w / 2, y + h / 2);
}

/** X position along milestone rail for current accountLevel (partial progress between Lv10,20,…). */
function getMilestoneRailProgressX(accountLv, centers, mileLevels) {
    const n = centers.length;
    if (n === 0) return 0;
    const L = Math.max(1, Math.floor(accountLv));
    const c0 = centers[0];
    if (n === 1) return c0;
    const cLast = centers[n - 1];
    const step01 = centers[1] - centers[0];
    if (L < mileLevels[0]) {
        return c0 + (L - mileLevels[0]) / mileLevels[0] * step01;
    }
    if (L >= mileLevels[n - 1]) {
        return cLast;
    }
    for (let i = 0; i < n - 1; i++) {
        if (L >= mileLevels[i] && L < mileLevels[i + 1]) {
            const span = mileLevels[i + 1] - mileLevels[i];
            const t = span > 0 ? (L - mileLevels[i]) / span : 0;
            return centers[i] + t * (centers[i + 1] - centers[i]);
        }
    }
    return cLast;
}

function drawAccountProfile() {
    const classKey = selectedChar || "STR";
    tickAccountPortrait(classKey);
    const L = getAccountProfileLayout();
    const labels = { STR: "WARRIOR", DEX: "ROGUE", LUCK: "GAMBLER", STA: "DEFENDER" };

    drawAccountProfilePanelFrame(L);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 50px Ubuntu";
    ctx.fillText("YOUR ACCOUNT", 480, L.panel.y + 58);

    const px = L.portrait.x, py = L.portrait.y, pw = L.portrait.w, ph = L.portrait.h;
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = "rgba(32,32,48,0.95)";
    ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);

    const st = getPortraitStatus();
    const img = getPortraitDisplayImage();
    if (st === "ok" && img && img.complete && img.naturalWidth > 0) {
        const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = px + (pw - dw) / 2;
        const dy = py + (ph - dh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(px + 2, py + 2, pw - 4, ph - 4);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
    } else if (st === "loading") {
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.CYAN;
        ctx.font = "bold 15px Ubuntu";
        ctx.fillText("FORGING PORTRAIT…", px + pw / 2, py + ph / 2 + 4);
    } else {
        drawPlayerClassSprite(classKey, px + 18, py + 18, pw - 36, ph - 36, classKey);
        if (st === "error") {
            ctx.textAlign = "center";
            ctx.fillStyle = COLORS.GRAY;
            ctx.font = "12px Ubuntu";
            ctx.fillText("(portrait unavailable)", px + pw / 2, py + ph - 10);
        }
    }

    const badgeCx = px + pw - 12;
    const badgeCy = py + 16;
    const badgeR = 18;
    ctx.beginPath();
    ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = accountLevel >= 100 ? "bold 11px Ubuntu" : "bold 14px Ubuntu";
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillText(String(accountLevel), badgeCx, badgeCy);

    const tx = L.text.x;
    const maxNameW = L.text.w - 6;
    ctx.font = "bold 38px Ubuntu";
    const nick = truncateNicknameHeader(ctx, getAccountNickname(), maxNameW);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = "bold 38px Ubuntu";
    ctx.fillText(nick, tx, L.text.y + 4);
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "bold 30px Ubuntu";
    ctx.fillText((labels[classKey] || classKey) + " · " + classKey + " FOCUS", tx, L.text.y + 40);
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 28px Ubuntu";
    ctx.fillText("ACCOUNT LV. " + accountLevel + "  ·  total XP " + accountXp, tx, L.text.y + 74);

    const passiveBonus = typeof getAccountPermanentStatBonus === "function"
        ? getAccountPermanentStatBonus()
        : { STR: 0 };
    const allStatsBonus = Math.max(0, Math.floor(passiveBonus.STR || 0));
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = "bold 18px Ubuntu";
    ctx.fillText(`Permanent passive: +${allStatsBonus} to all stats`, tx, L.text.y + 102);

    const xpInLv = accountXpWithinCurrentLevel(accountXp);
    drawAccountProfileBar(
        L.bar.x,
        L.bar.xpY,
        L.bar.w,
        L.bar.h,
        xpInLv / ACCOUNT_XP_PER_LEVEL,
        "XP this level: " + Math.floor(xpInLv) + " / " + ACCOUNT_XP_PER_LEVEL,
        COLORS.GREEN
    );

    const best = typeof getBestStageBeaten === "function" ? getBestStageBeaten() : 0;
    drawAccountProfileBar(
        L.bar.x,
        L.bar.gauntletY,
        L.bar.w,
        L.bar.h,
        GAUNTLET_TOTAL_STAGES > 0 ? best / GAUNTLET_TOTAL_STAGES : 0,
        "GAUNTLET — Stages cleared: " + best + " / " + GAUNTLET_TOTAL_STAGES,
        COLORS.CYAN
    );

    const milestones = typeof ACCOUNT_LEVEL_MILESTONES !== "undefined" ? ACCOUNT_LEVEL_MILESTONES : [];
    const reward = L.rewards;
    const slotY = reward.y + 46;
    const passiveY = reward.y + 124;
    const slotNodeW = 46;
    const slotNodeCount = milestones.length;
    const slotGap = slotNodeCount > 1 ? Math.max(6, Math.floor((reward.w - slotNodeW * slotNodeCount) / (slotNodeCount - 1))) : 0;
    const slotCenters = milestones.map((_, i) => reward.x + slotNodeW / 2 + i * (slotNodeW + slotGap));
    const slotLevels = milestones.map(m => m.level);

    const passiveRailMaxLevel = Math.min(200, Math.max(100, accountLevel + 20));
    const passiveLevels = typeof getAccountPassiveMilestoneLevelsThrough === "function"
        ? getAccountPassiveMilestoneLevelsThrough(passiveRailMaxLevel)
        : [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
    const passiveNodeW = 34;
    const passiveGap = passiveLevels.length > 1
        ? Math.max(4, Math.floor((reward.w - passiveNodeW * passiveLevels.length) / (passiveLevels.length - 1)))
        : 0;
    const passiveCenters = passiveLevels.map((_, i) => reward.x + passiveNodeW / 2 + i * (passiveNodeW + passiveGap));

    ctx.fillStyle = "rgba(10,10,18,0.62)";
    ctx.fillRect(reward.x, reward.y, reward.w, reward.h);
    ctx.strokeStyle = "rgba(255,215,0,0.45)";
    ctx.strokeRect(reward.x, reward.y, reward.w, reward.h);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 32px Ubuntu";
    ctx.fillText("ACCOUNT LEVEL REWARDS", 480, reward.y + 32);

    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = "bold 12px Ubuntu";
    ctx.fillText("SLOT UNLOCKS", reward.x + 8, reward.y + 52);
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillText("PASSIVE +1 ALL STATS", reward.x + 8, reward.y + 130);

    if (slotCenters.length > 1) {
        const slotStart = slotCenters[0];
        const slotEnd = slotCenters[slotCenters.length - 1];
        const slotProgress = getMilestoneRailProgressX(accountLevel, slotCenters, slotLevels);
        ctx.strokeStyle = "rgba(0,200,220,0.22)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(slotStart, slotY);
        ctx.lineTo(slotEnd, slotY);
        ctx.stroke();
        ctx.strokeStyle = COLORS.CYAN;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.min(slotStart, slotProgress), slotY);
        ctx.lineTo(Math.max(slotStart, slotProgress), slotY);
        ctx.stroke();
    }

    milestones.forEach((m, i) => {
        const cxn = slotCenters[i];
        const nx = cxn - slotNodeW / 2;
        const ny = slotY - slotNodeW / 2;
        const claimed = typeof isMilestoneClaimed === "function" && isMilestoneClaimed(m.level);
        const locked = accountLevel < m.level;
        ctx.save();
        if (locked) ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(25,25,40,0.95)";
        ctx.fillRect(nx, ny, slotNodeW, slotNodeW);
        ctx.strokeStyle = COLORS.CYAN;
        ctx.lineWidth = 2;
        ctx.strokeRect(nx, ny, slotNodeW, slotNodeW);
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.CYAN;
        ctx.font = "bold 18px Ubuntu";
        const ab = (m.slotLabel || (m.label && m.label.charAt(0)) || "?").charAt(0);
        ctx.fillText(ab, cxn, ny + 28);
        ctx.fillStyle = COLORS.GOLD;
        ctx.font = "bold 11px Ubuntu";
        ctx.fillText("Lv " + m.level, cxn, ny - 6);
        if (claimed) {
            ctx.strokeStyle = COLORS.GREEN;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(nx + 8, ny + 24);
            ctx.lineTo(nx + 18, ny + 35);
            ctx.lineTo(nx + 37, ny + 13);
            ctx.stroke();
        }
        ctx.restore();
    });

    if (passiveCenters.length > 1) {
        const pStart = passiveCenters[0];
        const pEnd = passiveCenters[passiveCenters.length - 1];
        const pProg = getMilestoneRailProgressX(accountLevel, passiveCenters, passiveLevels);
        ctx.strokeStyle = "rgba(255,215,0,0.2)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pStart, passiveY);
        ctx.lineTo(pEnd, passiveY);
        ctx.stroke();
        ctx.strokeStyle = COLORS.GOLD;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.min(pStart, pProg), passiveY);
        ctx.lineTo(Math.max(pStart, pProg), passiveY);
        ctx.stroke();
    }

    passiveLevels.forEach((lv, i) => {
        const cx = passiveCenters[i];
        const claimed = typeof isPassiveMilestoneClaimed === "function" && isPassiveMilestoneClaimed(lv);
        const locked = accountLevel < lv;
        const radius = 14;
        ctx.save();
        if (locked) ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(cx, passiveY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(35,30,10,0.95)";
        ctx.fill();
        ctx.strokeStyle = COLORS.GOLD;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.GOLD;
        ctx.font = "bold 10px Ubuntu";
        ctx.fillText("+1", cx, passiveY + 4);
        ctx.fillStyle = COLORS.CREAM;
        ctx.font = "bold 10px Ubuntu";
        ctx.fillText(String(lv), cx, passiveY + 26);
        if (claimed) {
            ctx.strokeStyle = COLORS.GREEN;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 8, passiveY + 1);
            ctx.lineTo(cx - 3, passiveY + 7);
            ctx.lineTo(cx + 8, passiveY - 5);
            ctx.stroke();
        }
        ctx.restore();
    });

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawCharSelect() {
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, 960, 650);
    ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 40px Ubuntu";
    ctx.fillText("CHOOSE YOUR DESTINY", 480, 80);

    const chars = ["STR", "DEX", "LUCK", "STA"];
    const labels = ["WARRIOR", "ROGUE", "GAMBLER", "DEFENDER"];
    const descriptions = [
        "High strength, high damage.",
        "High dexterity, high dodge.",
        "High luck, high crit & craft rate.",
        "High stamina, high health."
    ];

    const idleFrame = Math.floor(Date.now() / 120) % 8;

    chars.forEach((c, i) => {
        const x = 50 + i * 225, y = 150, w = 210, h = 400;
        
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = (selectedChar === c) ? COLORS.CYAN : COLORS.GOLD;
        ctx.lineWidth = (selectedChar === c) ? 4 : 2;
        ctx.strokeRect(x, y, w, h);

        if (devIdleStaEnabled && c === "STA") {
            const dk = DEV_STA_IDLE_KEYS[devStaIdleOptionIndex % DEV_STA_IDLE_KEYS.length];
            const devImg = assets[dk];
            if (devImg && devImg.complete && devImg.naturalWidth >= 8) {
                drawSpriteStrip8(dk, x + 5, y + 50, 200, 200, idleFrame, c);
                ctx.fillStyle = COLORS.GRAY;
                ctx.font = "11px Ubuntu";
                ctx.textAlign = "center";
                ctx.fillText(`dev STA [ / ] opt ${devStaIdleOptionIndex + 1}/${DEV_STA_IDLE_KEYS.length}`, x + 105, y + 44);
            } else {
                drawPlayerClassSprite(c, x + 5, y + 50, 200, 200, c);
            }
        } else {
            drawPlayerClassSprite(c, x + 5, y + 50, 200, 200, c);
        }

        ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 24px Ubuntu";
        ctx.fillText(labels[i], x + 105, y + 40);

        ctx.font = "bold 18px Ubuntu"; ctx.fillStyle = COLORS.CYAN;
        ctx.fillText(c + " FOCUS", x + 105, y + 270);

        ctx.font = "14px Ubuntu"; ctx.fillStyle = COLORS.GRAY;
        const words = descriptions[i].split(" ");
        ctx.fillText(words.slice(0, 2).join(" "), x + 105, y + 300);
        ctx.fillText(words.slice(2).join(" "), x + 105, y + 320);

        // Buttons are handled by logic, we just draw the visual placeholder or label
        drawStyledBtn(x + 20, y + 340, 170, 40, "SELECT", COLORS.BTN_BLUE);
    });
}

function drawCamp() {
    if (assets['camp_bg'] && assets['camp_bg'].complete) {
        ctx.drawImage(assets['camp_bg'], 0, 0, 960, 650);
    }
    /* 
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 45px 'Segoe UI', Arial";
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.GOLD;
    ctx.fillText("MAIN CAMP", 480, 80);
    ctx.shadowBlur = 0;
    */

    // Ore Display - Moved under Forge/Craft icon (which is at y=150, h=297 -> bottom y=447)
    const oreY = 460;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(410, oreY, 140, 40);
    ctx.strokeStyle = COLORS.GOLD;
    ctx.strokeRect(410, oreY, 140, 40);

    ctx.fillStyle = COLORS.CYAN;
    ctx.textAlign = "left";
    ctx.font = "bold 20px Ubuntu"; // Ensure font is set for ore text
    ctx.fillText(`ORE: ${player.ore}`, 450, oreY + 28);
    if (assets['ore'] && assets['ore'].complete) ctx.drawImage(assets['ore'], 415, oreY + 7, 25, 25);
    
    // Score Display
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 20px Ubuntu";
    ctx.fillText(`SCORE: ${score}`, 480, 30);

    drawAccountHeaderMini();

    const iconMap = { "CHAMPION": "camp_champion", "FORGE": "camp_craft", "BATTLE": "camp_battle" };
    uiButtons.forEach(btn => {
        if (btn.state === "camp") {
            const assetKey = iconMap[btn.label];
            if (assets[assetKey] && assets[assetKey].complete) {
                // Glow if points available or enough ore for crafting
                if ((btn.label === "CHAMPION" && player.points > 0) || (btn.label === "FORGE" && player.ore >= 10)) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = COLORS.GOLD;
                }
                ctx.drawImage(assets[assetKey], btn.x, btn.y, btn.w, btn.h);
                ctx.shadowBlur = 0;
            } else {
                drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
            }
        }
    });
    drawLevelUp();
}

function drawForge() {
    if (assets['forge_bg'] && assets['forge_bg'].complete) ctx.drawImage(assets['forge_bg'], 2, 0, 956, 650);

    if (craftingAnimTimer > 0) {
        ctx.textAlign = "center";
        ctx.font = "bold 36px Ubuntu";
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillText("Forging...", 480, 320);
    } else if (craftedItem) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)"; ctx.fillRect(0, 0, 960, 650);
        ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 36px Ubuntu";
        ctx.fillText("ITEM FORGED!", 480, 150);

        drawSlot(420, 200, "", craftedItem, 120);

        ctx.fillStyle = COLORS[`RARITY_${craftedItem.rarity}`]; ctx.font = "bold 24px Ubuntu";
        ctx.fillText(craftedItem.name, 480, 360);

        let sy = 400; ctx.font = "18px Ubuntu"; ctx.fillStyle = COLORS.WHITE;
        ["STR", "DEX", "STA", "LUCK"].forEach(s => {
            if (craftedItem[s]) {
                ctx.fillText(`${s}: +${craftedItem[s]}`, 480, sy);
                sy += 25;
            }
        });
    } else {
        ctx.textAlign = "center"; ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 24px Ubuntu";
        ctx.fillText(`${player.ore} ORE AVAILABLE`, 480, 410);
        
        ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 18px Ubuntu";
        ctx.fillText("COST: 10 ORE", 480, 440);

        // Display Odds
        const epicCh = 0.05 + (player.total.LUCK * 0.01);
        const rareCh = 0.15 + (player.total.LUCK * 0.02);
        ctx.font = "bold 14px Ubuntu";
        ctx.fillStyle = COLORS.RARITY_EPIC;
        ctx.fillText(`EPIC CHANCE: ${Math.round(epicCh * 100)}%`, 400, 380);
        ctx.fillStyle = COLORS.RARITY_RARE;
        ctx.fillText(`RARE CHANCE: ${Math.round(rareCh * 100)}%`, 560, 380);

        if (player.baseLUCK >= 15) {
            const legCh = 0.02;
            ctx.fillStyle = COLORS.RARITY_LEGENDARY;
            ctx.fillText(`LEGENDARY CHANCE: ${Math.round(legCh * 100)}%`, 480, 360);
        }

        const craftStage = typeof getCurrentCraftStageProgress === "function" ? getCurrentCraftStageProgress() : 1;
        const typeLabelMap = {
            weapon: "Weapon",
            armor: "Armor",
            helm: "Helm",
            shield: "Shield",
            gloves: "Gloves",
            boots: "Boots",
            ring: "Ring",
            necklace: "Necklace",
            banner: "Banner"
        };
        const typeUnlockEntries = typeof ITEM_TYPE_MIN_STAGE !== "undefined"
            ? Object.entries(ITEM_TYPE_MIN_STAGE)
            : [];

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(70, 170, 270, 320);
        ctx.strokeStyle = COLORS.GOLD;
        ctx.strokeRect(70, 170, 270, 320);

        ctx.fillStyle = COLORS.CREAM;
        ctx.font = "bold 17px Ubuntu";
        ctx.fillText("TYPE UNLOCKS", 84, 198);
        ctx.font = "12px Ubuntu";
        ctx.fillStyle = COLORS.CYAN;
        ctx.fillText(`Current Stage: ${craftStage}`, 84, 216);

        let unlockY = 240;
        ctx.font = "bold 12px Ubuntu";
        typeUnlockEntries.forEach(([type, minStage]) => {
            const unlocked = typeof isCraftTypeUnlockedAtStage === "function"
                ? isCraftTypeUnlockedAtStage(type, craftStage)
                : craftStage >= minStage;
            ctx.fillStyle = unlocked ? COLORS.GREEN : COLORS.GRAY;
            const label = typeLabelMap[type] || type.toUpperCase();
            const status = unlocked ? "AVAILABLE" : `UNLOCKS ${minStage}`;
            ctx.fillText(`${label}: ${status}`, 84, unlockY);
            unlockY += 26;
        });

        if (inventoryError) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; ctx.fillRect(330, 530, 300, 80);
            ctx.fillStyle = COLORS.RED; ctx.font = "bold 22px Ubuntu"; ctx.fillText("INVENTORY FULL!", 480, 565);
            ctx.font = "14px Ubuntu"; ctx.fillText("(Click anywhere to dismiss)", 480, 585);
        }
    }

    uiButtons.forEach(btn => {
        if (btn.state === "forge") {
            if (btn.label === "CRAFT" && assets['craft_btn'] && assets['craft_btn'].complete) {
                if (player.ore >= 10) {
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = COLORS.GOLD;
                }
                ctx.drawImage(assets['craft_btn'], btn.x, btn.y, btn.w, btn.h);
                ctx.shadowBlur = 0;
            } else if (btn.label === "BACK TO CAMP" && assets['back_to_camp_btn'] && assets['back_to_camp_btn'].complete) {
                ctx.drawImage(assets['back_to_camp_btn'], btn.x, btn.y, btn.w, btn.h);
            } else {
                drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
            }
        }
    });
}

function drawCombat() {
    drawPlayerClassSprite(selectedChar, COMBAT_PLAYER_SPRITE.x, COMBAT_PLAYER_SPRITE.y, COMBAT_PLAYER_SPRITE.w, COMBAT_PLAYER_SPRITE.h, "HERO");
    const bossSlot = enemy.bossSlot != null ? enemy.bossSlot : getBossSlot(currentLvl);
    drawSprite(`enemy_${bossSlot}`, COMBAT_ENEMY_SPRITE.x, COMBAT_ENEMY_SPRITE.y, COMBAT_ENEMY_SPRITE.w, COMBAT_ENEMY_SPRITE.h, enemy.name);
    drawCombatFlashOverlays();
    drawHealthBar(40, 70, 300, pDisplayHp, player.maxHp, userName, true);
    drawHealthBar(620, 70, 300, eDisplayHp, enemy.maxHp, enemy.name, false);

    // Score Display
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 20px Ubuntu";
    ctx.fillText(`SCORE: ${score}`, 480, 30);

    // Fury Bar
    fDisplayFury += (player.fury - fDisplayFury) * 0.1;
    ctx.fillStyle = "rgba(40, 40, 40, 0.5)"; ctx.fillRect(40, 95, 300, 10);
    ctx.fillStyle = COLORS.GOLD; ctx.fillRect(40, 95, 300 * (fDisplayFury / player.maxFury), 10);
    ctx.strokeStyle = "white"; ctx.strokeRect(40, 95, 300, 10);

    for (let i = 1; i <= 5; i++) {
        const id = i.toString(), y = 140 + (i - 1) * 65;
        ctx.fillStyle = selBlk.includes(id) ? COLORS.CYAN : "rgba(40, 40, 60, 0.7)";
        ctx.fillRect(320, y, 60, 60);
        drawSprite(`icon_${id}`, 325, y + 5, 50, 50, ZONE_NAMES[id]);
        ctx.fillStyle = selAtk === id ? COLORS.RED : "rgba(40, 40, 60, 0.7)";
        ctx.fillRect(580, y, 60, 60);
        drawSprite(`icon_${id}`, 585, y + 5, 50, 50, ZONE_NAMES[id]);
    }
    if (!isProcessing) {
        ctx.textAlign = "center"; ctx.font = "bold 16px Ubuntu";
        ctx.fillStyle = (selBlk.length === 2) ? COLORS.GREEN : COLORS.CYAN;
        ctx.fillText(`DEFENSE: ${selBlk.length}/2`, 350, 125);
        ctx.fillStyle = (selAtk) ? COLORS.GREEN : COLORS.RED;
        ctx.fillText(`ATTACK: ${selAtk ? 1 : 0}/1`, 610, 125);
    }

    uiButtons.forEach(btn => {
        if (btn.state === "combat") {
            const isFightBtn = (btn.label === "FIGHT!" || btn.label === "REGULAR");
            const isGodStrikeBtn = (btn.label === "GOD STRIKE");
            const isAutoplayBtn = btn.label.startsWith("AUTO");
            if (isFightBtn && assets['fight_btn'] && assets['fight_btn'].complete) {
                ctx.drawImage(assets['fight_btn'], btn.x, btn.y, btn.w, btn.h);
            } else if (isGodStrikeBtn && assets['god_strike_btn'] && assets['god_strike_btn'].complete) {
                ctx.drawImage(assets['god_strike_btn'], btn.x, btn.y, btn.w, btn.h);
            } else if (isAutoplayBtn) {
                if (!tryDrawAutoplayBitmap(btn)) {
                    drawAutoplayPlate(btn.x, btn.y, btn.w, btn.h);
                }
                ctx.save();
                ctx.textAlign = "center";
                const autoFontPx = Math.max(12, Math.min(20, Math.round(btn.h * 0.14)));
                ctx.font = `bold ${autoFontPx}px Ubuntu`;
                const cx = btn.x + btn.w / 2, ty = btn.y + btn.h / 2 + Math.round(autoFontPx * 0.32);
                ctx.lineWidth = Math.max(2, Math.round(autoFontPx / 6));
                ctx.strokeStyle = "rgba(0,0,0,0.9)";
                ctx.lineJoin = "round";
                ctx.strokeText(btn.label, cx, ty);
                ctx.fillStyle = btn.color;
                ctx.fillText(btn.label, cx, ty);
                ctx.restore();
            } else {
                drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
            }
        }
    });

    if (assets['log_bg_img'] && assets['log_bg_img'].complete) ctx.drawImage(assets['log_bg_img'], 240, 450, 480, 200);
    else { ctx.fillStyle = COLORS.LOG_BG; ctx.fillRect(20, 510, 920, 120); }

    log.slice(-5).forEach((m, i) => {
        ctx.font = "18px 'Pirata One'"; ctx.fillStyle = m.col; ctx.textAlign = "center";
        ctx.fillText(m.txt, 480, 535 + i * 20);
    });

    if (combatVignette > 0.02) {
        ctx.save();
        const g = ctx.createRadialGradient(480, 305, 90, 480, 305, 520);
        g.addColorStop(0, "rgba(30,0,0,0)");
        g.addColorStop(1, `rgba(85,0,0,${combatVignette * 0.42})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 960, 650);
        ctx.restore();
    }

    if (showBattleTip) drawBattleTip();
    else if (showAutoplayTip) drawAutoplayTip();
}

function drawAutoplayTip() {
    const L = getAutoplayTipLayout();
    const { x, y, w, h } = L.panel;

    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, 960, 650);

    ctx.shadowBlur = 30;
    ctx.shadowColor = "rgba(255, 215, 0, 0.3)";
    const mainGrad = ctx.createLinearGradient(x, y, x, y + h);
    mainGrad.addColorStop(0, "#1a1a2e");
    mainGrad.addColorStop(0.5, "#16213e");
    mainGrad.addColorStop(1, "#0f3460");
    ctx.fillStyle = mainGrad;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);

    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 42px 'Pirata One'";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "black";
    ctx.fillText("AUTOPLAY", 480, y + 58);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "18px Ubuntu";
    const lines = [
        "The AUTO button (above FIGHT) cycles speed:",
        "off (grey) → 1× → 2× → 3× → off. Each click steps once.",
        "Leave it grey if you want full manual control.",
        "Picking attack or defense yourself still pauses autoplay."
    ];
    let lineY = y + 100;
    lines.forEach(line => {
        ctx.fillText(line, 480, lineY);
        lineY += 26;
    });

    drawStyledBtn(L.gotIt.x, L.gotIt.y, L.gotIt.w, L.gotIt.h, "Got it", COLORS.BTN_BLUE);
    drawStyledBtn(L.neverAgain.x, L.neverAgain.y, L.neverAgain.w, L.neverAgain.h, "Don't show this anymore", COLORS.GRAY);

    ctx.fillStyle = COLORS.GOLD;
    const s = 15;
    ctx.fillRect(x - 2, y - 2, s, 4); ctx.fillRect(x - 2, y - 2, 4, s);
    ctx.fillRect(x + w - s + 2, y - 2, s, 4); ctx.fillRect(x + w - 2, y - 2, 4, s);
    ctx.fillRect(x - 2, y + h - 2, s, 4); ctx.fillRect(x - 2, y + h - s + 2, 4, s);
    ctx.fillRect(x + w - s + 2, y + h - 2, s, 4); ctx.fillRect(x + w - 2, y + h - s + 2, 4, s);
}

function drawBattleTip() {
    // Backdrop blur/dim
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, 960, 650);

    const w = 600, h = 350;
    const x = (960 - w) / 2, y = (650 - h) / 2;

    // Outer Glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = "rgba(255, 215, 0, 0.3)";

    // Main Panel Gradient
    const mainGrad = ctx.createLinearGradient(x, y, x, y + h);
    mainGrad.addColorStop(0, "#1a1a2e");
    mainGrad.addColorStop(0.5, "#16213e");
    mainGrad.addColorStop(1, "#0f3460");
    ctx.fillStyle = mainGrad;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;

    // Decorative Border
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    
    // Inner Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);

    // Header with Pirata One
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 42px 'Pirata One'";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "black";
    ctx.fillText("BATTLE COMMANDS", 480, y + 65);
    ctx.shadowBlur = 0;

    // Content
    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "18px Ubuntu";
    ctx.fillText("To survive the gauntlet, you must master your actions:", 480, y + 105);
    
    // Mechanics Section
    const boxY = y + 140;
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(x + 50, boxY, w - 100, 100);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.2)";
    ctx.strokeRect(x + 50, boxY, w - 100, 100);

    ctx.font = "bold 24px Ubuntu";
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillText("DEFENSE: SELECT 2 ZONES", 480, boxY + 40);
    
    ctx.fillStyle = COLORS.RED;
    ctx.fillText("ATTACK: SELECT 1 ZONE", 480, boxY + 75);

    // Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "italic 16px Ubuntu";
    ctx.fillText("Tap anywhere to close and begin the fight", 480, y + 310);
    
    // Corner accents
    ctx.fillStyle = COLORS.GOLD;
    const s = 15;
    ctx.fillRect(x - 2, y - 2, s, 4); ctx.fillRect(x - 2, y - 2, 4, s); // TL
    ctx.fillRect(x + w - s + 2, y - 2, s, 4); ctx.fillRect(x + w - 2, y - 2, 4, s); // TR
    ctx.fillRect(x - 2, y + h - 2, s, 4); ctx.fillRect(x - 2, y + h - s + 2, 4, s); // BL
    ctx.fillRect(x + w - s + 2, y + h - 2, s, 4); ctx.fillRect(x + w - 2, y + h - s + 2, 4, s); // BR
}

function drawInventory() {
    if (assets['champion_bg'] && assets['champion_bg'].complete) {
        ctx.drawImage(assets['champion_bg'], 30, 80, 900, 520);
    } else {
        ctx.fillStyle = COLORS.PANEL; ctx.fillRect(30, 80, 900, 520);
    }
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(30, 80, 900, 520);
    drawAccountHeaderMini();
    drawPlayerClassSprite(selectedChar, 40, 120, 400, 400, "CHAMPION");


    const centerLine = 410;

    ctx.fillStyle = COLORS.CREAM; ctx.font = "bold 18px Ubuntu"; ctx.textAlign = "left";
    ctx.fillText("EQUIPMENT", centerLine, 120);
    const equipmentGridLayout = getInventoryEquipmentGridLayout(centerLine);
    equipmentGridLayout.forEach(entry => {
        const m = entry.milestone;
        const unlocked = entry.baseSlot || (typeof isAccountSlotUnlocked === "function" && isAccountSlotUnlocked(entry.slotId));
        const item = unlocked ? player[entry.slotId] : null;
        drawSlot(entry.x, entry.y, entry.slotLabel, item, entry.w, {
            locked: !entry.baseSlot && !unlocked,
            reqLevel: m && typeof m.level === "number" ? m.level : null
        });
    });

    ctx.fillStyle = COLORS.CREAM; ctx.font = "bold 22px Ubuntu"; ctx.textAlign = "left";
    ctx.fillText("STATS", centerLine, 336);
    if (player.points > 0) {
        ctx.fillStyle = COLORS.CREAM; ctx.font = "bold 14px Ubuntu";
        ctx.fillText(`(AVAILABLE POINTS: ${player.points})`, centerLine + 80, 336);
    }

    const statIconMap = { STR: 'stat_icon_str', DEX: 'stat_icon_dex', STA: 'stat_icon_sta', LUCK: 'stat_icon_luck' };
    const statRowStart = 350;
    const statRowStep = 44;

    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        const rowY = statRowStart + i * statRowStep;
        const baseVal = player["base" + s];
        const accountVal = player.accountBonus ? (player.accountBonus[s] || 0) : 0;
        const bonusVal = player.bonus[s];
        const maxVal = player.maxStats[s];
        const isMax = baseVal >= maxVal;

        // Row background
        ctx.fillStyle = COLORS.STAT_ROW_BG;
        ctx.fillRect(centerLine, rowY, 240, 45);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.strokeRect(centerLine, rowY, 240, 45);

        // Icon
        const iconKey = statIconMap[s];
        if (assets[iconKey] && assets[iconKey].complete) {
            ctx.drawImage(assets[iconKey], centerLine + 5, rowY + 5, 35, 35);
        }

        // Text
        ctx.textAlign = "left"; ctx.font = "bold 20px Ubuntu";
        ctx.fillStyle = COLORS.CREAM;
        ctx.fillText(s + ":", centerLine + 50, rowY + 28);
        
        ctx.fillStyle = COLORS.CREAM;
        let statTxt = `${baseVal}`;
        if (accountVal > 0) statTxt += ` +${accountVal}A`;
        if (bonusVal > 0) statTxt += ` +${bonusVal}G`;
        if (isMax) statTxt += " (MAX)";
        ctx.fillText(statTxt, centerLine + 120, rowY + 28);

        // Subtext for STA or others if needed
        if (s === "STA") {
            ctx.font = "12px Ubuntu"; ctx.fillStyle = COLORS.CREAM;
            ctx.fillText(`Max HP: ${player.maxHp}`, centerLine + 50, rowY + 42);
        } else if (i === 0) {
            ctx.font = "11px Ubuntu"; ctx.fillStyle = COLORS.GRAY;
            ctx.fillText("A=Account bonus, G=Gear bonus", centerLine + 50, rowY + 42);
        }

        // Plus button
        if (player.points > 0 && !isMax) {
            const btnX = centerLine + 205, btnY = rowY + 7;
            ctx.fillStyle = COLORS.STAT_BTN_BG;
            ctx.fillRect(btnX, btnY, 30, 30);
            ctx.strokeStyle = COLORS.GOLD;
            ctx.strokeRect(btnX, btnY, 30, 30);
            
            ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 20px Ubuntu"; ctx.textAlign = "center";
            ctx.fillText("+", btnX + 15, btnY + 22);
        }

        // Special Ability Description
        if (baseVal >= 15) {
            ctx.font = "italic 11px Ubuntu"; ctx.fillStyle = COLORS.CYAN;
            ctx.textAlign = "right";
            let desc = "";
            if (s === "STR") desc = "AOE SPILL DMG (10%)";
            if (s === "DEX") desc = "+10% DODGE & CRIT";
            if (s === "STA") desc = "-20% DMG TAKEN";
            if (s === "LUCK") desc = "LEGENDARY CRAFTING";
            ctx.fillText(desc, centerLine + 235, rowY + 42);
        }
    });

    const gridX = 660; ctx.fillStyle = COLORS.CREAM; ctx.font = "bold 16px Ubuntu"; ctx.textAlign = "left";
    ctx.fillText(`INVENTORY (${player.inventory.length}/${INV_LIMIT})`, gridX, 120);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(gridX, 135, 260, 340);
    player.inventory.forEach((item, i) => {
        const x = gridX + 10 + (i % 4) * 62, y = 145 + Math.floor(i / 4) * 62;
        let isEq = player.weapon === item || player.armor === item;
        if (!isEq && typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
            for (const sid of ACCOUNT_EQUIP_SLOT_IDS) {
                if (player[sid] === item) { isEq = true; break; }
            }
        }
        ctx.fillStyle = selectedInvItem === item ? COLORS.GOLD : (isEq ? COLORS.CYAN : COLORS.SLOT_BG);
        ctx.fillRect(x, y, 55, 55);
        drawSprite(item.name, x + 5, y + 5, 45, 45, item.name.substring(0, 2), COLORS[`RARITY_${item.rarity}`]);
    });
    if (selectedInvItem) renderItemDetails();
    uiButtons.forEach(btn => {
        if (btn.state === "inventory") {
            if (btn.label === "BACK TO CAMP" && assets['back_to_camp_btn'] && assets['back_to_camp_btn'].complete) {
                ctx.drawImage(assets['back_to_camp_btn'], btn.x, btn.y, btn.w, btn.h);
            } else {
                drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
            }
        }
    });
}

function renderItemDetails() {
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(600, 110, 310, 400);
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(600, 110, 310, 400);
    if (salvageConfirm) {
        ctx.fillStyle = COLORS.CREAM; ctx.font = "bold 18px Ubuntu"; ctx.textAlign = "center";
        ctx.fillText("SALVAGE RARE ITEM?", 755, 230);
        ctx.font = "14px Ubuntu"; ctx.fillText("This cannot be undone.", 755, 260);
    } else {
        ctx.fillStyle = COLORS.RED; ctx.fillRect(875, 115, 30, 30);
        ctx.fillStyle = COLORS.CREAM; ctx.textAlign = "center"; ctx.fillText("X", 890, 137);
        ctx.fillStyle = COLORS[`RARITY_${selectedInvItem.rarity}`]; ctx.font = "bold 20px Ubuntu"; ctx.textAlign = "center";
        ctx.fillText(selectedInvItem.name.toUpperCase(), 755, 150);
        let curEquip = null;
        if (selectedInvItem.type === "weapon") curEquip = player.weapon;
        else if (selectedInvItem.type === "armor") curEquip = player.armor;
        else if (typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)
            && ACCOUNT_EQUIP_SLOT_IDS.includes(selectedInvItem.type)) {
            curEquip = player[selectedInvItem.type];
        }
        let sy = 220;
        ["STR", "DEX", "STA", "LUCK"].forEach(s => {
            const newVal = selectedInvItem[s] || 0, oldVal = (curEquip && curEquip !== selectedInvItem) ? (curEquip[s] || 0) : 0, diff = newVal - oldVal;
            if (newVal > 0 || oldVal > 0) {
                ctx.textAlign = "left"; ctx.fillStyle = COLORS.CREAM; ctx.fillText(`${s}: ${newVal}`, 630, sy);
                if (diff !== 0 && curEquip !== selectedInvItem) {
                    ctx.fillStyle = diff > 0 ? COLORS.GREEN : COLORS.RED;
                    ctx.fillText(`(${diff > 0 ? "+" : ""}${diff})`, 730, sy);
                }
                sy += 35;
            }
        });
    }
}

function drawEnd() {
    ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0, 0, 960, 650);
    ctx.textAlign = "center";
    const isVictory = state === "victory";
    ctx.fillStyle = isVictory ? COLORS.GOLD : COLORS.RED;
    ctx.font = "bold 60px Ubuntu"; ctx.fillText(isVictory ? "VICTORY" : "DEFEATED", 480, 80);
    
    // Detailed Score Breakdown
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(280, 110, 400, 220);
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(280, 110, 400, 220);
    
    ctx.textAlign = "left";
    ctx.font = "bold 18px Ubuntu";
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillText("SCORE BREAKDOWN", 300, 140);
    
    ctx.font = "16px Ubuntu";
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillText(`Stages Cleared:`, 300, 175);
    ctx.textAlign = "right";
    ctx.fillText(`${scoreDetails.stageClear}`, 660, 175);
    
    ctx.textAlign = "left";
    ctx.fillText(`Combat (Hits/Crits/Blocks):`, 300, 205);
    ctx.textAlign = "right";
    const combatScore = (scoreDetails.hits * 20) + (scoreDetails.crits * 30) + (scoreDetails.blocks * 30); // Crits already counted as hits
    ctx.fillText(`${combatScore}`, 660, 205);
    
    ctx.textAlign = "left";
    ctx.fillText(`Health Retention Bonus:`, 300, 235);
    ctx.textAlign = "right";
    ctx.fillText(`${scoreDetails.hpBonus}`, 660, 235);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath(); ctx.moveTo(300, 255); ctx.lineTo(660, 255); ctx.stroke();
    
    ctx.textAlign = "left";
    ctx.font = "bold 22px Ubuntu";
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillText(`TOTAL SCORE:`, 300, 290);
    ctx.textAlign = "right";
    ctx.fillText(`${score}`, 660, 290);

    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 24px 'Pirata One'";
    ctx.fillText("GLOBAL LEADERBOARD", 480, 355);
    
    if (isFetchingScores && highScores.length === 0) {
        ctx.fillStyle = COLORS.CYAN; ctx.font = "italic 18px Ubuntu";
        ctx.fillText("Synchronizing with scrolls...", 480, 400);
    } else {
        highScores.slice(0, 3).forEach((s, i) => {
            const y = 385 + i * 32;
            
            // Draw background bar for each entry
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.fillRect(330, y - 22, 300, 28);
            
            // Rank Number / Symbol
            let rankCol = COLORS.WHITE;
            if (i === 0) rankCol = COLORS.GOLD;
            else if (i === 1) rankCol = "#C0C0C0"; // Silver
            else if (i === 2) rankCol = "#CD7F32"; // Bronze
            
            ctx.fillStyle = rankCol;
            ctx.font = "bold 18px Ubuntu";
            ctx.textAlign = "right";
            ctx.fillText(`${i + 1}.`, 360, y - 5);
            
            // Name
            ctx.textAlign = "left";
            ctx.fillStyle = COLORS.CREAM;
            ctx.fillText(s.name.toUpperCase(), 375, y - 5);
            
            // Score
            ctx.textAlign = "right";
            ctx.fillStyle = rankCol;
            ctx.fillText(s.score.toLocaleString(), 620, y - 5);
        });
        
        if (isFetchingScores) {
            ctx.fillStyle = COLORS.CYAN; ctx.font = "12px Ubuntu";
            ctx.textAlign = "center";
            ctx.fillText("Updating...", 480, 560);
        }
    }
    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawBattleSelect() {
    // Overlay background
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, 960, 650);

    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 40px Ubuntu";
    ctx.fillText("SELECT YOUR NEXT BATTLE", 480, 72);

    const tierStart = getBattleSelectTierStart(maxLvl);
    const tierIndex = Math.floor(tierStart / BOSSES_PER_TIER);
    ctx.font = "bold 22px Ubuntu";
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillText(`Ring ${tierIndex + 1} — ${TIER_LABELS[tierIndex]}`, 480, 108);

    // Reuse progress bar logic for visualization but standalone
    const barWidth = 700, startX = (canvas.width - barWidth) / 2, startY = 150, slotW = barWidth / 5;

    for (let i = 1; i <= BOSSES_PER_TIER; i++) {
        const globalStage = tierStart + i;
        const row = Math.floor((i - 1) / 5);
        const col = (i - 1) % 5;
        const x = startX + col * slotW;
        const y = startY + row * 150;

        const isDefeated = globalStage < maxLvl;
        const isNext = globalStage === maxLvl;
        const isLocked = globalStage > maxLvl;

        // Slot Background
        if (isDefeated) {
            ctx.fillStyle = "rgba(50, 70, 50, 0.4)";
        } else if (isNext) {
            ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
        } else {
            ctx.fillStyle = "rgba(20, 20, 30, 0.8)";
        }
        ctx.fillRect(x + 10, y, slotW - 20, 120);

        // Border
        if (isDefeated) {
            ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
        } else if (isNext) {
            ctx.strokeStyle = COLORS.GOLD;
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = COLORS.GRAY;
        }
        ctx.strokeRect(x + 10, y, slotW - 20, 120);
        ctx.lineWidth = 1;

        // Level Number
        ctx.fillStyle = isLocked ? COLORS.GRAY : (isNext ? COLORS.WHITE : "rgba(255,255,255,0.5)");
        ctx.font = "bold 18px Ubuntu";
        ctx.fillText(`STAGE ${globalStage}`, x + slotW / 2, y + 25);

        // Icon Area
        const iconSize = 80;
        const iconX = x + slotW / 2 - iconSize / 2;
        const iconY = y + 35;

        const iconKey = `enemy_icon_${i}`;
        ctx.save();
        if (isLocked) ctx.globalAlpha = 0.3;
        if (isDefeated) ctx.globalAlpha = 0.6;

        if (assets[iconKey] && assets[iconKey].complete) {
            ctx.drawImage(assets[iconKey], iconX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
        }
        ctx.restore();

        // Status / Highlights
        if (isDefeated) {
            ctx.fillStyle = COLORS.GREEN;
            ctx.font = "bold 12px Ubuntu";
            ctx.fillText("BEATEN", x + slotW / 2, y + 115);

            // Large green checkmark
            ctx.strokeStyle = COLORS.GREEN; ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(iconX + 10, iconY + 40);
            ctx.lineTo(iconX + 35, iconY + 70);
            ctx.lineTo(iconX + 70, iconY + 20);
            ctx.stroke();
            ctx.lineWidth = 1;
        } else if (isNext) {
            // Glowing border for current level
            ctx.strokeStyle = COLORS.GOLD;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.GOLD;
            ctx.strokeRect(iconX, iconY, iconSize, iconSize);
            ctx.shadowBlur = 0;

            ctx.fillStyle = COLORS.GOLD;
            ctx.font = "bold 14px Ubuntu";
            ctx.fillText("AVAILABLE", x + slotW / 2, y + 115);
        } else {
            ctx.fillStyle = COLORS.GRAY;
            ctx.font = "bold 12px Ubuntu";
            ctx.fillText("LOCKED", x + slotW / 2, y + 115);
        }
    }

    uiButtons.forEach(btn => {
        if (btn.state === "battle_select" && !btn.noDraw) {
            drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
        }
    });

    drawAccountHeaderMini();
}

function drawMuteBtn() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(915, 10, 35, 35);
    ctx.strokeStyle = COLORS.GOLD;
    ctx.strokeRect(915, 10, 35, 35);
    
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 20px Ubuntu";
    ctx.textAlign = "center";
    ctx.fillText(AudioEngine.isMuted() ? "🔇" : "🔊", 932, 35);
    ctx.restore();
}