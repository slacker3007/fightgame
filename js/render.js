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
        const alpha = Math.min(1, p.life * (kind === "streak" ? 1.5 : kind === "smoke" ? 0.85 : 1.15));
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
        } else if (kind === "smoke") {
            const r = p.size * (0.75 + 0.35 * Math.min(1, p.life));
            ctx.fillStyle = p.color || "rgba(120,118,112,0.45)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
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
    if (txt === "\u00D7" && w <= 44 && h <= 44) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(22,22,34,0.92)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(180,175,200,0.45)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.fillStyle = COLORS.UI_TITLE;
        ctx.font = "600 24px 'Exo 2', Ubuntu, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u00D7", x + w / 2, y + h / 2 + 1);
        ctx.textBaseline = "alphabetic";
        return;
    }
    if (txt === "LOG OUT") {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(100,108,128,0.75)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, "#3a2a32");
        g.addColorStop(0.5, "#2a2228");
        g.addColorStop(1, "#181418");
        ctx.fillStyle = g;
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
        ctx.fillStyle = COLORS.UI_MUTED_TEXT;
        ctx.font = "bold 17px Ubuntu, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 0;
        ctx.fillText("LOG OUT", x + w / 2, y + h / 2 + 1);
        ctx.textBaseline = "alphabetic";
        return;
    }
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

function strokeChampionIronFrame(x, y, w, h) {
    ctx.strokeStyle = COLORS.CHAMPION_IRON_OUTER;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = COLORS.CHAMPION_IRON_MID;
    ctx.lineWidth = 1.25;
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    ctx.strokeStyle = COLORS.CHAMPION_IRON_HIGHLIGHT;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
}

/** Muted vector ghost for empty equipment slot (champion screen). */
function drawChampionEquipmentGhost(slotId, cx, cy, unit) {
    const u = (unit || 1) * 50;
    const s = u / 50;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.strokeStyle = "rgba(200,195,180,0.9)";
    ctx.fillStyle = "rgba(80,78,88,0.35)";
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";

    if (slotId === "weapon") {
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(2, 10);
        ctx.lineTo(0, 12);
        ctx.lineTo(-2, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, 10);
        ctx.lineTo(8, 10);
        ctx.lineTo(7, 13);
        ctx.lineTo(-7, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (slotId === "helm") {
        ctx.beginPath();
        ctx.arc(0, -2, 14, Math.PI * 1.05, Math.PI * 1.95);
        ctx.lineTo(12, 8);
        ctx.quadraticCurveTo(0, 14, -12, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (slotId === "shield") {
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.quadraticCurveTo(12, -4, 10, 14);
        ctx.quadraticCurveTo(0, 18, -10, 14);
        ctx.quadraticCurveTo(-14, 0, -10, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (slotId === "armor") {
        ctx.beginPath();
        ctx.moveTo(-12, -10);
        ctx.lineTo(12, -10);
        ctx.lineTo(10, 14);
        ctx.lineTo(-10, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (slotId === "gloves") {
        ctx.fillRect(-14, -6, 10, 14);
        ctx.strokeRect(-14, -6, 10, 14);
        ctx.fillRect(4, -6, 10, 14);
        ctx.strokeRect(4, -6, 10, 14);
    } else if (slotId === "boots") {
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(-6, 12);
        ctx.lineTo(2, 12);
        ctx.lineTo(-2, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, -8);
        ctx.lineTo(6, 12);
        ctx.lineTo(14, 12);
        ctx.lineTo(6, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (slotId === "ring") {
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
    } else if (slotId === "necklace") {
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, 4);
        ctx.lineTo(0, 12);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -14, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else if (slotId === "banner") {
        ctx.fillRect(-2, -14, 4, 28);
        ctx.strokeRect(-2, -14, 4, 28);
        ctx.beginPath();
        ctx.moveTo(2, -12);
        ctx.lineTo(16, -6);
        ctx.lineTo(16, 6);
        ctx.lineTo(2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.rect(-10, -10, 20, 20);
        ctx.stroke();
    }
    ctx.restore();
}

function isAssetDrawable(img) {
    return img && (img.complete || (img.readyState !== undefined && img.readyState >= 1)) && img.naturalWidth > 0;
}

/** Empty-slot placeholder art; returns true if a PNG was drawn (else caller may fall back to ghost). */
function drawEquipmentSlotPlaceholder(slotId, x, y, size) {
    const asset = assets["equip_slot_" + slotId];
    if (!isAssetDrawable(asset)) return false;
    ctx.save();
    ctx.globalAlpha = 0.88;
    try {
        ctx.drawImage(asset, x, y, size, size);
    } catch (e) {
        ctx.restore();
        return false;
    }
    ctx.restore();
    return true;
}

function drawChampionVignette() {
    const g = ctx.createRadialGradient(480, 320, 120, 480, 320, 520);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.55, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 650);
}

function drawChampionTorchFlicker() {
    const t = Date.now() / 850;
    const a = 0.08 + 0.04 * Math.sin(t);
    const g = ctx.createRadialGradient(120, 520, 20, 120, 520, 220);
    g.addColorStop(0, `rgba(255,170,80,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 650);
    const g2 = ctx.createRadialGradient(820, 480, 10, 820, 480, 160);
    g2.addColorStop(0, `rgba(255,200,120,${a * 0.65})`);
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 960, 650);
}

function drawChampionAmbientDust(sprite) {
    const t = Date.now() / 1000;
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 9; i++) {
        const ph = i * 1.7;
        const dx = (sprite.x + sprite.w * 0.2) + Math.sin(t * 0.4 + ph) * (sprite.w * 0.55) + i * 7;
        const dy = sprite.y + sprite.h * 0.25 + (t * 18 + i * 41) % (sprite.h * 0.75);
        ctx.fillStyle = "rgba(220,210,190,0.5)";
        ctx.beginPath();
        ctx.arc(dx, dy, 1 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function championRimTintFromPlayer() {
    if (!player || !player.total) return "rgba(165,130,85,0.5)";
    const tiers = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 };
    let best = 0;
    let col = null;
    const ids = ["weapon", "armor"];
    if (typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
        ids.push(...ACCOUNT_EQUIP_SLOT_IDS);
    }
    for (const sid of ids) {
        const it = player[sid];
        if (it && it.rarity) {
            const t = tiers[it.rarity] || 1;
            if (t >= best) {
                best = t;
                col = COLORS["RARITY_" + it.rarity] || col;
            }
        }
    }
    if (col) return col;
    const T = player.total;
    const m = Math.max(T.STR || 0, T.DEX || 0, T.STA || 0, T.LUCK || 0);
    if (m === T.STR) return "rgba(210,95,75,0.55)";
    if (m === T.DEX) return "rgba(85,165,205,0.55)";
    if (m === T.STA) return "rgba(95,155,115,0.55)";
    return "rgba(205,185,95,0.55)";
}

function drawChampionRimLight(sprite) {
    const tint = championRimTintFromPlayer();
    const cx = sprite.x + sprite.w / 2;
    const cy = sprite.y + sprite.h * 0.48;
    const rx = sprite.w * 0.52;
    const ry = sprite.h * 0.58;
    let r0 = 255, g0 = 200, b0 = 140, aMid = 0.16;
    if (tint.startsWith("#") && tint.length >= 7) {
        const h = tint.slice(1);
        r0 = parseInt(h.slice(0, 2), 16);
        g0 = parseInt(h.slice(2, 4), 16);
        b0 = parseInt(h.slice(4, 6), 16);
        aMid = 0.22;
    } else if (tint.startsWith("rgba")) {
        const m = tint.match(/rgba?\(([^)]+)\)/);
        if (m) {
            const p = m[1].split(",").map(x => parseFloat(x.trim()));
            if (p.length >= 3) {
                r0 = p[0];
                g0 = p[1];
                b0 = p[2];
                aMid = p[3] != null ? p[3] * 1.1 : 0.18;
            }
        }
    }
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(cx, cy, rx * 0.12, cx, cy, Math.max(rx, ry) * 1.02);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(${r0},${g0},${b0},${aMid})`);
    g.addColorStop(0.85, `rgba(${Math.min(255, r0 + 40)},${Math.min(255, g0 + 30)},${b0},0.08)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/** Single source of truth for champion (inventory) screen geometry — keep in sync with handleInventoryClick in main.js */
function getChampionScreenLayout() {
    const sprite = { x: 52, y: 132, w: 338, h: 360 };
    const statsPanel = { x: 418, y: 100, w: 232, h: 204 };
    /* 3×3 equipment grid centered under stats (weapon | helm | shield / gloves | armor | boots / ring | neck | banner) */
    const slotSize = 56;
    const gap = 6;
    const cols = 3;
    const gridW = cols * slotSize + (cols - 1) * gap;
    const gridH = gridW;
    const equipGridY = statsPanel.y + statsPanel.h + 20;
    const equipGridX = statsPanel.x + (statsPanel.w - gridW) / 2;
    const defs = [
        { slotId: "weapon", slotLabel: "WEAPON", baseSlot: true },
        { slotId: "helm", slotLabel: "HELM", baseSlot: false },
        { slotId: "shield", slotLabel: "SHIELD", baseSlot: false },
        { slotId: "gloves", slotLabel: "GLOVES", baseSlot: false },
        { slotId: "armor", slotLabel: "ARMOR", baseSlot: true },
        { slotId: "boots", slotLabel: "BOOTS", baseSlot: false },
        { slotId: "ring", slotLabel: "RING", baseSlot: false },
        { slotId: "necklace", slotLabel: "NECK", baseSlot: false },
        { slotId: "banner", slotLabel: "BANNER", baseSlot: false }
    ];
    const equipmentSlots = defs.map((slot, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const m = slot.baseSlot ? null
            : (typeof getAccountMilestoneBySlotId === "function" ? getAccountMilestoneBySlotId(slot.slotId) : null);
        return {
            milestone: m,
            slotId: slot.slotId,
            slotLabel: (m && m.slotLabel) || slot.slotLabel,
            baseSlot: !!slot.baseSlot,
            x: equipGridX + col * (slotSize + gap),
            y: equipGridY + row * (slotSize + gap),
            w: slotSize,
            h: slotSize
        };
    });
    const stats = {
        panel: statsPanel,
        rowStart: 118,
        rowStep: 44,
        labelColX: statsPanel.x + 10,
        valueX: statsPanel.x + 62,
        rowWidth: statsPanel.w - 12,
        plusRelX: statsPanel.w - 42,
        equipmentLabelY: statsPanel.y + statsPanel.h + 4,
        equipmentGrid: {
            x: equipGridX,
            y: equipGridY,
            w: gridW,
            h: gridH,
            slotSize,
            gap
        }
    };
    const gridX = 662;
    const inv = {
        gridX,
        headerY: 102,
        bodyTop: 132,
        pad: 8,
        cell: 55,
        gap: 7,
        cols: 4,
        bodyW: 268,
        bodyH: 348
    };
    return { sprite, equipmentSlots, stats, inventory: inv };
}

/** @deprecated Use getChampionScreenLayout().equipmentSlots */
function getInventoryEquipmentGridLayout() {
    return getChampionScreenLayout().equipmentSlots;
}

function drawSlot(x, y, label, item, size = 120, slotOpts) {
    const locked = slotOpts && slotOpts.locked;
    const reqLevel = slotOpts && typeof slotOpts.reqLevel === "number" ? slotOpts.reqLevel : null;
    const slotId = slotOpts && slotOpts.slotId;
    const forged = !slotOpts || slotOpts.useForgedFrame !== false;

    ctx.fillStyle = COLORS.SLOT_BG;
    ctx.fillRect(x, y, size, size);
    if (forged) {
        strokeChampionIronFrame(x, y, size, size);
    } else {
        ctx.strokeStyle = item ? COLORS[`RARITY_${item.rarity}`] : COLORS.GOLD;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, size, size);
    }
    ctx.lineWidth = 1;
    if (item) {
        ctx.strokeStyle = COLORS[`RARITY_${item.rarity}`];
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        ctx.lineWidth = 1;
    }

    if (locked) {
        ctx.fillStyle = COLORS.GRAY;
        ctx.font = (size <= 60 ? "bold 11px Ubuntu" : "bold 13px Ubuntu");
        ctx.textAlign = "center";
        ctx.fillText(label, x + size / 2, y + Math.min(20, size * 0.26));
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = COLORS.DIM_GRAY;
        ctx.font = (size <= 60 ? "bold 10px Ubuntu" : "bold 11px Ubuntu");
        if (reqLevel != null) ctx.fillText("Lv " + reqLevel, x + size / 2, y + size * 0.62);
        ctx.font = (size <= 60 ? "9px Ubuntu" : "10px Ubuntu");
        ctx.fillText("LOCKED", x + size / 2, y + size * 0.78);
    } else if (item) {
        const imgSize = size * 0.72, offset = (size - imgSize) / 2;
        drawSprite(item.name, x + offset, y + offset + 4, imgSize, imgSize, item.name.substring(0, 3), COLORS[`RARITY_${item.rarity}`]);
    } else if (slotId) {
        if (!drawEquipmentSlotPlaceholder(slotId, x, y, size)) {
            drawChampionEquipmentGhost(slotId, x + size / 2, y + size / 2 + 2, size / 50);
        }
    } else if (label) {
        ctx.fillStyle = COLORS.GRAY;
        ctx.font = (size <= 60 ? "bold 11px Ubuntu" : "bold 13px Ubuntu");
        ctx.textAlign = "center";
        ctx.fillText(label, x + size / 2, y + Math.min(22, size * 0.28));
    }
}

function drawChampionStatValueSegments(x, y, baseVal, accountVal, bonusVal, isMax) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 18px Ubuntu";
    let cx = x;
    const drawSeg = (txt, color) => {
        ctx.fillStyle = color;
        ctx.fillText(txt, cx, y);
        cx += ctx.measureText(txt).width;
    };
    drawSeg(String(baseVal), COLORS.CHAMPION_STAT_BASE);
    if (accountVal > 0) drawSeg(" +" + accountVal, COLORS.CHAMPION_STAT_ACCOUNT);
    if (bonusVal > 0) drawSeg(" +" + bonusVal, COLORS.CHAMPION_STAT_GEAR);
    if (isMax) drawSeg(" (MAX)", COLORS.GRAY);
    ctx.restore();
}

function buildChampionStatTooltip(stat) {
    if (!player || !player.total) return { title: stat, lines: [] };
    const T = player.total;
    const epicCh = 0.05 + (T.LUCK * 0.01);
    const rareCh = 0.15 + (T.LUCK * 0.02);
    const dodgePct = Math.round(Math.min(0.6, T.DEX * 0.02) * 100);
    const critPct = Math.round(Math.min(0.5, T.LUCK * 0.03) * 100);
    const baseDmg = 10 + T.STR * 4;
    const hp = 100 + T.STA * 15;
    if (stat === "STR") {
        return {
            title: "STR — Strike power",
            lines: [
                `Base hit damage ≈ ${baseDmg} (10 + STR×4), before crit/zone.`,
                "Attacking zone 1 (head) applies ×1.4 to that hit.",
                player.baseSTR >= 15 ? "STR 15+: +10% spill damage after a hit lands." : "Reach base STR 15 for spill damage."
            ]
        };
    }
    if (stat === "DEX") {
        return {
            title: "DEX — Evasion",
            lines: [
                `Dodge chance ≈ ${dodgePct}% (capped at 60%, DEX×2% per point).`,
                player.baseDEX >= 15 ? "DEX 15+: +10% dodge and +10% crit chance." : "Reach base DEX 15 for extra dodge and crit."
            ]
        };
    }
    if (stat === "STA") {
        return {
            title: "STA — Vitality",
            lines: [
                `Max HP = ${hp} (100 + STA×15).`,
                player.baseSTA >= 15 ? "STA 15+: when a hit gets through, reduce it by 20%." : "Reach base STA 15 for damage reduction."
            ]
        };
    }
    if (stat === "LUCK") {
        return {
            title: "LUCK — Fortune",
            lines: [
                `Crit chance ≈ ${critPct}% (capped at 50%, LUCK×3% per point).`,
                `Forge odds scale with total LUCK (e.g. epic ~${Math.min(99, Math.round(epicCh * 100))}%, rare ~${Math.min(99, Math.round(rareCh * 100))}%).`,
                player.baseLUCK >= 15 ? "Base LUCK 15+: legendary craft chance unlocked." : "Reach base LUCK 15 to unlock legendary crafts."
            ]
        };
    }
    return { title: stat, lines: [] };
}

function drawChampionStatTooltip(mx, my, stat) {
    if (!stat) return;
    const { title, lines } = buildChampionStatTooltip(stat);
    const padX = 12;
    const padY = 10;
    const maxW = 260;
    const wrap = (text, font) => {
        ctx.font = font;
        const words = String(text).split(/\s+/).filter(Boolean);
        const out = [];
        let line = "";
        for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (ctx.measureText(test).width > maxW && line) {
                out.push(line);
                line = w;
            } else line = test;
        }
        if (line) out.push(line);
        return out;
    };
    const titleLines = wrap(title, "bold 13px Ubuntu, sans-serif");
    const body = [];
    lines.forEach(l => wrap(l, "12px Ubuntu, sans-serif").forEach(x => body.push(x)));
    let tw = 0;
    titleLines.forEach(t => { tw = Math.max(tw, ctx.measureText(t).width); });
    body.forEach(t => { tw = Math.max(tw, ctx.measureText(t).width); });
    const boxW = Math.min(420, Math.ceil(tw) + padX * 2);
    const lineH1 = 16;
    const lineH2 = 14;
    const boxH = padY * 2 + titleLines.length * lineH1 + (body.length ? 6 : 0) + body.length * lineH2;
    let bx = mx + 14;
    let by = my + 16;
    if (bx + boxW > 950) bx = 950 - boxW;
    if (by + boxH > 640) by = my - boxH - 10;
    if (bx < 6) bx = 6;
    if (by < 6) by = 6;
    ctx.save();
    ctx.fillStyle = "rgba(12,10,18,0.92)";
    ctx.fillRect(bx, by, boxW, boxH);
    strokeChampionIronFrame(bx, by, boxW, boxH);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    let ly = by + padY + 12;
    ctx.fillStyle = COLORS.UI_TITLE;
    ctx.font = "bold 13px Ubuntu, sans-serif";
    titleLines.forEach(t => {
        ctx.fillText(t, bx + padX, ly);
        ly += lineH1;
    });
    ly += 2;
    ctx.fillStyle = COLORS.UI_MUTED_TEXT;
    ctx.font = "12px Ubuntu, sans-serif";
    body.forEach(t => {
        ctx.fillText(t, bx + padX, ly);
        ly += lineH2;
    });
    ctx.restore();
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
    const fillFrac = pct / 100;
    const trackGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    trackGrad.addColorStop(0, "#3a3428");
    trackGrad.addColorStop(0.5, "#2a2620");
    trackGrad.addColorStop(1, "#1a1814");
    ctx.fillStyle = trackGrad;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = "rgba(90,82,68,0.9)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    const fillW = barW * fillFrac;
    if (fillW > 1) {
        const fillGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY + barH);
        fillGrad.addColorStop(0, "#5c3a22");
        fillGrad.addColorStop(0.45, "#8b5a28");
        fillGrad.addColorStop(1, "#c9a44a");
        ctx.fillStyle = fillGrad;
        ctx.fillRect(barX + 1, barY + 1, fillW - 2, barH - 2);
        const sealCx = barX + fillW - 2;
        const sealCy = barY + barH / 2;
        if (fillFrac > 0.08) {
            ctx.beginPath();
            ctx.arc(sealCx, sealCy, 5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(60,28,22,0.95)";
            ctx.fill();
            ctx.strokeStyle = "rgba(180,140,90,0.85)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = "rgba(200,80,60,0.55)";
            ctx.font = "bold 7px Ubuntu";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("★", sealCx, sealCy + 0.5);
        }
    }
    ctx.font = "bold 11px Ubuntu";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.CREAM;
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
    const portrait = { x: panel.x + pad, y: panel.y + 62, w: 208, h: 208 };
    const gutter = 18;
    const text = {
        x: portrait.x + portrait.w + gutter,
        y: portrait.y + 14,
        w: panel.x + panel.w - pad - (portrait.x + portrait.w + gutter)
    };
    const barH = 11;
    const rowGap = 12;
    const labelLift = 13;
    const bar = {
        x: panel.x + pad,
        w: panel.w - pad * 2,
        h: barH,
        iconSlotW: 36,
        xpY: portrait.y + portrait.h + 26,
        gauntletY: portrait.y + portrait.h + 26 + labelLift + barH + rowGap + labelLift
    };
    const rewards = {
        x: bar.x,
        y: bar.gauntletY + barH + 28,
        w: bar.w,
        railY: 0,
        boxTop: 0,
        boxH: 100
    };
    rewards.railY = rewards.y + 54;
    rewards.boxTop = rewards.y + 22;
    const closeBtn = { x: panel.x + panel.w - pad - 40, y: panel.y + 8, w: 38, h: 38 };
    const buffCard = { x: portrait.x + portrait.w - 114, y: portrait.y + portrait.h - 60, w: 110, h: 56 };
    return { panel, pad, portrait, text, bar, rewards, closeBtn, buffCard };
}

function accountProfileLevelToX(level, left, width, maxLevel) {
    const maxL = Math.max(2, Math.floor(maxLevel || 100));
    const L = Math.max(1, Math.min(maxL, Math.floor(level)));
    return left + ((L - 1) / (maxL - 1)) * width;
}

function drawAccountProfilePanelFrame(L) {
    const browse = typeof accountProfileMode === "string" && accountProfileMode === "browse";
    const scrimCore = browse ? 0.52 : 0.82;
    const scrimEdge = browse ? 0.78 : 0.93;
    const rg = ctx.createRadialGradient(480, 320, 60, 480, 320, 520);
    rg.addColorStop(0, `rgba(18,18,28,${scrimCore})`);
    rg.addColorStop(0.55, `rgba(10,10,16,${(scrimCore + scrimEdge) / 2})`);
    rg.addColorStop(1, `rgba(4,4,10,${scrimEdge})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, 960, 650);
    if (browse) {
        for (let i = 0; i < 72; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.022})`;
            ctx.fillRect(Math.random() * 960, Math.random() * 650, 2, 2);
        }
    }
    const { x, y, w, h } = L.panel;
    const pa = browse ? 0.78 : 0.9;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `rgba(26,26,40,${pa})`);
    g.addColorStop(1, `rgba(12,12,22,${pa})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = `rgba(92,100,120,${browse ? 0.55 : 0.65})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(201,164,74,0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
}

function drawAccountProfileXpGlyph(cx, cy) {
    ctx.save();
    ctx.strokeStyle = COLORS.UI_AMBER;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 2, 5, 0.9, 2.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 6);
    ctx.lineTo(cx + 8, cy + 6);
    ctx.stroke();
    ctx.restore();
}

function drawAccountProfileGauntletGlyph(cx, cy) {
    ctx.save();
    ctx.strokeStyle = COLORS.UI_AMBER;
    ctx.fillStyle = "rgba(232,168,56,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 7);
    ctx.lineTo(cx - 8, cy - 2);
    ctx.lineTo(cx - 4, cy - 6);
    ctx.lineTo(cx, cy - 3);
    ctx.lineTo(cx + 4, cy - 6);
    ctx.lineTo(cx + 8, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawAccountProfileSleekBar(barX, trackY, totalW, trackH, ratio, opts) {
    const { kind, valueText } = opts;
    const clamped = Math.max(0, Math.min(1, ratio));
    const iconW = 36;
    const innerX = barX + iconW;
    const innerW = totalW - iconW;
    const r = Math.max(2, trackH / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.UI_MUTED_TEXT;
    ctx.font = "11px Ubuntu, sans-serif";
    ctx.fillText(valueText, innerX, trackY - 2);

    const roundRectPath = (ix, iy, iw, ih, rad) => {
        ctx.beginPath();
        ctx.moveTo(ix + rad, iy);
        ctx.lineTo(ix + iw - rad, iy);
        ctx.quadraticCurveTo(ix + iw, iy, ix + iw, iy + rad);
        ctx.lineTo(ix + iw, iy + ih - rad);
        ctx.quadraticCurveTo(ix + iw, iy + ih, ix + iw - rad, iy + ih);
        ctx.lineTo(ix + rad, iy + ih);
        ctx.quadraticCurveTo(ix, iy + ih, ix, iy + ih - rad);
        ctx.lineTo(ix, iy + rad);
        ctx.quadraticCurveTo(ix, iy, ix + rad, iy);
        ctx.closePath();
    };

    roundRectPath(innerX, trackY, innerW, trackH, r);
    ctx.fillStyle = "rgba(6,8,14,0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(80,88,110,0.65)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (kind === "gauntlet") {
        ctx.save();
        ctx.beginPath();
        roundRectPath(innerX, trackY, innerW, trackH, r);
        ctx.clip();
        for (let i = 1; i <= 9; i++) {
            const nx = innerX + (innerW * i) / 10;
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nx, trackY);
            ctx.lineTo(nx, trackY + trackH);
            ctx.stroke();
        }
        ctx.restore();
    }

    const fillW = innerW * clamped;
    if (fillW > 0.5) {
        ctx.save();
        ctx.beginPath();
        roundRectPath(innerX, trackY, fillW, trackH, r);
        ctx.clip();
        let grad;
        if (kind === "xp") {
            grad = ctx.createLinearGradient(innerX, trackY, innerX + fillW, trackY);
            grad.addColorStop(0, "#0d3d24");
            grad.addColorStop(0.5, "#1a6b38");
            grad.addColorStop(1, "#5cff8a");
        } else {
            grad = ctx.createLinearGradient(innerX, trackY, innerX + fillW, trackY);
            grad.addColorStop(0, "#1a2438");
            grad.addColorStop(0.45, "#2a3a58");
            grad.addColorStop(1, "#e8a838");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(innerX, trackY, fillW, trackH);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerX + 1, trackY + 1.5);
        ctx.lineTo(innerX + fillW - 1, trackY + 1.5);
        ctx.stroke();
        ctx.restore();
    }

    const icx = barX + iconW / 2;
    const icy = trackY + trackH / 2;
    if (kind === "xp") drawAccountProfileXpGlyph(icx, icy);
    else drawAccountProfileGauntletGlyph(icx, icy);
}

function drawAccountIconSword(cx, cy, s, muted) {
    ctx.save();
    ctx.strokeStyle = muted ? "rgba(180,190,210,0.5)" : COLORS.UI_TITLE;
    ctx.fillStyle = muted ? "rgba(120,130,155,0.35)" : "rgba(232,168,56,0.35)";
    ctx.lineWidth = 1.8;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(2, 8);
    ctx.lineTo(0, 10);
    ctx.lineTo(-2, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.lineTo(7, 8);
    ctx.lineTo(6, 11);
    ctx.lineTo(-6, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawAccountIconStar(cx, cy, s, muted) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const a2 = a + (2 * Math.PI) / 5;
        const rO = 10, rI = 4;
        const xo = Math.cos(a) * rO, yo = Math.sin(a) * rO;
        const xi = Math.cos(a2) * rI, yi = Math.sin(a2) * rI;
        if (i === 0) ctx.moveTo(xo, yo);
        else ctx.lineTo(xo, yo);
        ctx.lineTo(xi, yi);
    }
    ctx.closePath();
    ctx.fillStyle = muted ? "rgba(140,130,90,0.4)" : "rgba(255,220,120,0.9)";
    ctx.strokeStyle = muted ? "rgba(160,150,110,0.45)" : COLORS.UI_GOLD;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawAccountIconHeart(cx, cy, s, muted) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.fillStyle = muted ? "rgba(150,100,110,0.35)" : "rgba(232,120,140,0.85)";
    ctx.strokeStyle = muted ? "rgba(180,140,145,0.4)" : "rgba(255,200,210,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-9, -6, -9, 4, 0, 11);
    ctx.bezierCurveTo(9, 4, 9, -6, 0, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawAccountCheckmark(cx, cy, scale, col) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.2 * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 7 * scale, cy);
    ctx.lineTo(cx - 2 * scale, cy + 6 * scale);
    ctx.lineTo(cx + 8 * scale, cy - 7 * scale);
    ctx.stroke();
    ctx.restore();
}

function hitTestAccountRoadmap(mx, my, L) {
    const milestones = typeof ACCOUNT_LEVEL_MILESTONES !== "undefined" ? ACCOUNT_LEVEL_MILESTONES : [];
    const passiveRailMaxLevel = Math.min(200, Math.max(100, accountLevel + 20));
    const passiveLevels = typeof getAccountPassiveMilestoneLevelsThrough === "function"
        ? getAccountPassiveMilestoneLevelsThrough(passiveRailMaxLevel)
        : [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
    const RX = L.rewards.x;
    const RW = L.rewards.w;
    const railY = L.rewards.railY;
    const boxTop = L.rewards.boxTop;
    const boxH = L.rewards.boxH;
    const maxLv = 100;
    const majorHitR = 21;
    const minorHitR = 9;
    if (mx < RX - 10 || mx > RX + RW + 10) return null;
    if (my < boxTop - 12 || my > boxTop + boxH + 20) return null;

    const inCircle = (cx, cy, r) => {
        const dx = mx - cx;
        const dy = my - cy;
        return dx * dx + dy * dy <= r * r;
    };

    const majorSet = new Set(milestones.map(m => m.level));
    for (let i = milestones.length - 1; i >= 0; i--) {
        const m = milestones[i];
        const cx = accountProfileLevelToX(m.level, RX, RW, maxLv);
        if (inCircle(cx, railY, majorHitR)) return { kind: "major", milestone: m };
    }
    const minorLevels = passiveLevels.filter(lv => !majorSet.has(lv));
    for (let i = minorLevels.length - 1; i >= 0; i--) {
        const lv = minorLevels[i];
        const cx = accountProfileLevelToX(lv, RX, RW, maxLv);
        if (inCircle(cx, railY, minorHitR)) return { kind: "minor", level: lv };
    }
    return null;
}

function buildAccountRoadmapTooltipLines(hit) {
    const accLv = Math.max(1, Math.floor(accountLevel || 1));
    if (hit.kind === "major") {
        const m = hit.milestone;
        const claimed = typeof isMilestoneClaimed === "function" && isMilestoneClaimed(m.level);
        const locked = accLv < m.level;
        const detail = [];
        let title;
        if (m.rewardType === "passive") {
            title = `Lv ${m.level} — Milestone bonus`;
            detail.push("Account tier reward at this level (star on the roadmap).");
        } else {
            const name = m.label || m.slotLabel || m.slotId || "Gear";
            title = `Lv ${m.level} — ${name}`;
            detail.push(`Unlocks the ${String(name).toLowerCase()} equipment slot on your champion.`);
        }
        if (locked) detail.push(`Locked until account Lv ${m.level}.`);
        else if (claimed) detail.push("Unlocked — reward applied to your account.");
        else detail.push(`Reach account Lv ${m.level} to receive this unlock.`);
        return { title, detail };
    }
    const lv = hit.level;
    const claimed = typeof isPassiveMilestoneClaimed === "function" && isPassiveMilestoneClaimed(lv);
    const locked = accLv < lv;
    const title = `Lv ${lv} — +1 all stats`;
    const detail = [
        "Permanent bonus to STR, DEX, STA, and LUCK when you reach this account level."
    ];
    if (locked) detail.push(`Locked until account Lv ${lv}.`);
    else if (claimed) detail.push("Unlocked — bonus is active.");
    else detail.push(`Reach account Lv ${lv} to receive this passive.`);
    return { title, detail };
}

function drawAccountRoadmapTooltip(mx, my, hit) {
    if (!hit) return;
    const { title, detail } = buildAccountRoadmapTooltipLines(hit);
    const padX = 14;
    const padY = 12;
    const maxW = 268;
    const lineHTitle = 17;
    const lineHDetail = 15;

    const wrapWords = (text, font, maxPx) => {
        ctx.font = font;
        const words = String(text).split(/\s+/).filter(Boolean);
        const lines = [];
        let line = "";
        for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (ctx.measureText(test).width > maxPx && line) {
                lines.push(line);
                line = w;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    };

    const titleLines = wrapWords(title, "bold 13px Ubuntu, sans-serif", maxW);
    const detailLineChunks = [];
    detail.forEach(d => {
        wrapWords(d, "12px Ubuntu, sans-serif", maxW).forEach(L => detailLineChunks.push(L));
    });

    let tw = 0;
    ctx.font = "bold 13px Ubuntu, sans-serif";
    titleLines.forEach(t => { tw = Math.max(tw, ctx.measureText(t).width); });
    ctx.font = "12px Ubuntu, sans-serif";
    detailLineChunks.forEach(t => { tw = Math.max(tw, ctx.measureText(t).width); });

    const boxW = Math.min(440, Math.ceil(tw) + padX * 2);
    const titleBlockH = titleLines.length * lineHTitle;
    const detailBlockH = detailLineChunks.length * lineHDetail;
    const boxH = padY * 2 + titleBlockH + (detailLineChunks.length ? 6 : 0) + detailBlockH;

    let bx = mx + 16;
    let by = my + 20;
    if (bx + boxW > 952) bx = 952 - boxW;
    if (bx < 8) bx = 8;
    if (by + boxH > 642) by = my - boxH - 12;
    if (by < 8) by = 8;

    ctx.save();
    ctx.fillStyle = "rgba(12,12,20,0.94)";
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = "rgba(201,164,74,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);
    ctx.strokeStyle = "rgba(100,108,128,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 2.5, by + 2.5, boxW - 5, boxH - 5);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    let ly = by + padY + 13;
    ctx.fillStyle = COLORS.UI_GOLD;
    ctx.font = "bold 13px Ubuntu, sans-serif";
    titleLines.forEach(t => {
        ctx.fillText(t, bx + padX, ly);
        ly += lineHTitle;
    });
    ly += 2;
    ctx.fillStyle = COLORS.UI_MUTED_TEXT;
    ctx.font = "12px Ubuntu, sans-serif";
    detailLineChunks.forEach(t => {
        ctx.fillText(t, bx + padX, ly);
        ly += lineHDetail;
    });
    ctx.restore();
}

function drawAccountBuffCard(rect, allStatsBonus) {
    const { x, y, w, h } = rect;
    const r = 8;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(40,36,28,0.96)");
    g.addColorStop(1, "rgba(18,16,24,0.98)");
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(201,164,74,0.75)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.save();
    drawAccountIconHeart(x + 22, y + 26, 0.85, false);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.UI_TITLE;
    ctx.font = "bold 13px Ubuntu, sans-serif";
    ctx.fillText(`+${allStatsBonus} ALL`, x + 40, y + 22);
    ctx.fillStyle = COLORS.UI_MUTED_TEXT;
    ctx.font = "600 9px 'Exo 2', Ubuntu, sans-serif";
    ctx.fillText("STATS", x + 40, y + 34);
    ctx.fillStyle = "rgba(201,164,74,0.9)";
    ctx.font = "600 8px 'Exo 2', Ubuntu, sans-serif";
    ctx.fillText("PERMANENT", x + 8, y + h - 8);
}

function drawAccountRoadmap(L, milestones, passiveLevels) {
    const RX = L.rewards.x;
    const RW = L.rewards.w;
    const railY = L.rewards.railY;
    const boxTop = L.rewards.boxTop;
    const boxH = L.rewards.boxH;
    const maxLv = 100;
    const majorSet = new Set(milestones.map(m => m.level));
    const minorLevels = passiveLevels.filter(lv => !majorSet.has(lv));
    const accLv = Math.max(1, Math.floor(accountLevel || 1));
    const progressX = accountProfileLevelToX(Math.min(accLv, maxLv), RX, RW, maxLv);
    const pulse = 0.45 + 0.55 * Math.sin(Date.now() / 240);

    ctx.fillStyle = "rgba(8,10,18,0.5)";
    ctx.fillRect(RX, boxTop, RW, boxH);
    ctx.strokeStyle = "rgba(201,164,74,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(RX + 0.5, boxTop + 0.5, RW - 1, boxH - 1);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.UI_GOLD;
    ctx.font = "600 20px 'Exo 2', Ubuntu, sans-serif";
    ctx.fillText("ACCOUNT ROADMAP", RX + RW / 2, L.rewards.y + 18);

    const x1 = accountProfileLevelToX(1, RX, RW, maxLv);
    const xEnd = accountProfileLevelToX(maxLv, RX, RW, maxLv);
    ctx.strokeStyle = "rgba(60,58,72,0.85)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, railY);
    ctx.lineTo(xEnd, railY);
    ctx.stroke();
    ctx.strokeStyle = `rgba(232,168,56,${0.28 + 0.22 * pulse})`;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, railY);
    ctx.lineTo(Math.max(x1, progressX), railY);
    ctx.stroke();

    const allLevelsSorted = [...new Set([...milestones.map(m => m.level), ...passiveLevels])].sort((a, b) => a - b);
    let nextLocked = null;
    for (const lv of allLevelsSorted) {
        if (accLv < lv) {
            nextLocked = lv;
            break;
        }
    }
    if (nextLocked === null) nextLocked = maxLv;

    const drawMinor = lv => {
        const cx = accountProfileLevelToX(lv, RX, RW, maxLv);
        const claimed = typeof isPassiveMilestoneClaimed === "function" && isPassiveMilestoneClaimed(lv);
        const locked = accLv < lv;
        const goalPulse = locked && lv === nextLocked;
        ctx.save();
        if (locked) ctx.globalAlpha = 0.38;
        ctx.beginPath();
        ctx.arc(cx, railY, 5, 0, Math.PI * 2);
        ctx.fillStyle = claimed ? "rgba(80,200,120,0.5)" : "rgba(50,52,70,0.95)";
        ctx.fill();
        ctx.strokeStyle = goalPulse ? `rgba(232,168,56,${0.5 + 0.45 * pulse})` : "rgba(160,155,180,0.55)";
        ctx.lineWidth = goalPulse ? 2.5 : 1.2;
        ctx.stroke();
        if (claimed) drawAccountCheckmark(cx, railY, 0.45, "rgba(220,255,200,0.95)");
        drawAccountIconHeart(cx, railY, locked ? 0.28 : 0.36, locked && !claimed);
        ctx.restore();
    };

    minorLevels.forEach(drawMinor);

    milestones.forEach(m => {
        const cx = accountProfileLevelToX(m.level, RX, RW, maxLv);
        const claimed = typeof isMilestoneClaimed === "function" && isMilestoneClaimed(m.level);
        const locked = accLv < m.level;
        const isStar = m.rewardType === "passive";
        const goalPulse = locked && m.level === nextLocked;
        const R = 17;
        ctx.save();
        if (locked) ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(cx, railY, R, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(cx - 4, railY - 4, 2, cx, railY, R);
        if (claimed) {
            nodeGrad.addColorStop(0, "rgba(255,240,180,0.95)");
            nodeGrad.addColorStop(1, "rgba(120,90,40,0.9)");
        } else {
            nodeGrad.addColorStop(0, "rgba(55,58,78,0.95)");
            nodeGrad.addColorStop(1, "rgba(22,22,32,0.98)");
        }
        ctx.fillStyle = nodeGrad;
        ctx.fill();
        ctx.strokeStyle = goalPulse ? `rgba(255,210,120,${0.65 + 0.3 * pulse})` : "rgba(201,164,74,0.55)";
        ctx.lineWidth = goalPulse ? 3 : 2;
        ctx.stroke();
        if (isStar) drawAccountIconStar(cx, railY - 1, 0.62, locked && !claimed);
        else drawAccountIconSword(cx, railY, 0.72, locked && !claimed);
        if (claimed) drawAccountCheckmark(cx + 10, railY - 10, 0.55, "rgba(40,120,60,0.95)");
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.UI_MUTED_TEXT;
        ctx.font = "9px Ubuntu, sans-serif";
        if (locked) ctx.globalAlpha *= 0.55;
        ctx.fillText("Lv" + m.level, cx, railY + R + 11);
        ctx.restore();
    });
}

function drawAccountProfile() {
    const classKey = selectedChar || "STR";
    tickAccountPortrait(classKey);
    const L = getAccountProfileLayout();
    const labels = { STR: "WARRIOR", DEX: "ROGUE", LUCK: "GAMBLER", STA: "DEFENDER" };

    drawAccountProfilePanelFrame(L);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.UI_GOLD;
    ctx.font = "600 36px 'Exo 2', Ubuntu, sans-serif";
    ctx.fillText("YOUR ACCOUNT", 480, L.panel.y + 50);

    const px = L.portrait.x, py = L.portrait.y, pw = L.portrait.w, ph = L.portrait.h;
    const inset = 5;
    const goldFrame = accountLevel >= 50;
    const frameOuter = goldFrame ? "rgba(218,178,80,0.95)" : "rgba(188,198,218,0.92)";
    const frameMid = goldFrame ? "rgba(140,110,55,0.85)" : "rgba(90,98,118,0.82)";
    const frameHighlight = goldFrame ? "rgba(255,248,210,0.55)" : "rgba(235,240,255,0.5)";
    const frameShadow = "rgba(8,8,14,0.65)";
    ctx.save();
    ctx.shadowBlur = goldFrame ? 28 : 22;
    ctx.shadowColor = goldFrame ? "rgba(218,165,40,0.48)" : "rgba(160,175,205,0.42)";
    ctx.strokeStyle = frameOuter;
    ctx.lineWidth = 5;
    ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = frameMid;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    ctx.strokeStyle = frameHighlight;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(px - 1, py + ph * 0.35);
    ctx.lineTo(px - 1, py - 1);
    ctx.lineTo(px + pw * 0.4, py - 1);
    ctx.stroke();
    ctx.strokeStyle = frameShadow;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(px + pw * 0.55, py - 1);
    ctx.lineTo(px + pw + 1, py - 1);
    ctx.lineTo(px + pw + 1, py + ph * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + pw + 1, py + ph * 0.58);
    ctx.lineTo(px + pw + 1, py + ph + 1);
    ctx.lineTo(px + pw * 0.45, py + ph + 1);
    ctx.stroke();
    ctx.strokeStyle = frameHighlight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + pw * 0.38, py + ph + 1);
    ctx.lineTo(px - 1, py + ph + 1);
    ctx.lineTo(px - 1, py + ph * 0.62);
    ctx.stroke();
    ctx.strokeStyle = goldFrame ? "rgba(255,236,160,0.38)" : "rgba(220,228,240,0.32)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 3, py + 3, pw - 6, ph - 6);
    ctx.restore();

    ctx.fillStyle = "rgba(24,24,38,0.98)";
    ctx.fillRect(px + inset, py + inset, pw - inset * 2, ph - inset * 2);

    const innerPad = 20;
    const sprX = px + inset + innerPad;
    const sprY = py + inset + innerPad;
    const sprW = pw - 2 * (inset + innerPad);
    const sprH = ph - 2 * (inset + innerPad);

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
        ctx.rect(px + inset, py + inset, pw - inset * 2, ph - inset * 2);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
    } else if (st === "loading") {
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.UI_AMBER;
        ctx.font = "600 15px 'Exo 2', Ubuntu, sans-serif";
        ctx.fillText("FORGING PORTRAIT…", px + pw / 2, py + ph / 2 + 4);
    } else {
        drawPlayerClassSprite(classKey, sprX, sprY, sprW, sprH, classKey);
        if (st === "error") {
            ctx.textAlign = "center";
            ctx.fillStyle = COLORS.UI_MUTED_TEXT;
            ctx.font = "12px Ubuntu, sans-serif";
            ctx.fillText("(portrait unavailable)", px + pw / 2, py + ph - 10);
        }
    }

    const passiveBonus = typeof getAccountPermanentStatBonus === "function"
        ? getAccountPermanentStatBonus()
        : { STR: 0 };
    const allStatsBonus = Math.max(0, Math.floor(passiveBonus.STR || 0));
    drawAccountBuffCard(L.buffCard, allStatsBonus);

    const tx = L.text.x;
    const maxNameW = L.text.w - 6;
    const nick = truncateNicknameHeader(ctx, getAccountNickname(), maxNameW);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.UI_TITLE;
    ctx.font = "600 34px 'Exo 2', Ubuntu, sans-serif";
    ctx.fillText(nick, tx, L.text.y + 8);
    ctx.fillStyle = COLORS.UI_MUTED_TEXT;
    ctx.font = "600 16px Ubuntu, sans-serif";
    ctx.fillText((labels[classKey] || classKey) + "  \u2022  " + classKey + " FOCUS", tx, L.text.y + 40);
    ctx.fillStyle = COLORS.UI_GOLD;
    ctx.font = "600 22px 'Exo 2', Ubuntu, sans-serif";
    ctx.fillText("ACCOUNT LV. " + accountLevel, tx, L.text.y + 70);
    ctx.fillStyle = COLORS.UI_MUTED_TEXT;
    ctx.font = "12px Ubuntu, sans-serif";
    ctx.fillText("Total XP  " + accountXp, tx, L.text.y + 92);

    const xpInLv = accountXpWithinCurrentLevel(accountXp);
    drawAccountProfileSleekBar(L.bar.x, L.bar.xpY, L.bar.w, L.bar.h, xpInLv / ACCOUNT_XP_PER_LEVEL, {
        kind: "xp",
        valueText: Math.floor(xpInLv) + " / " + ACCOUNT_XP_PER_LEVEL + " XP this level"
    });

    const best = typeof getBestStageBeaten === "function" ? getBestStageBeaten() : 0;
    drawAccountProfileSleekBar(L.bar.x, L.bar.gauntletY, L.bar.w, L.bar.h,
        GAUNTLET_TOTAL_STAGES > 0 ? best / GAUNTLET_TOTAL_STAGES : 0,
        { kind: "gauntlet", valueText: best + " / " + GAUNTLET_TOTAL_STAGES + " stages cleared" });

    const milestones = typeof ACCOUNT_LEVEL_MILESTONES !== "undefined" ? ACCOUNT_LEVEL_MILESTONES : [];
    const passiveRailMaxLevel = Math.min(200, Math.max(100, accountLevel + 20));
    const passiveLevels = typeof getAccountPassiveMilestoneLevelsThrough === "function"
        ? getAccountPassiveMilestoneLevelsThrough(passiveRailMaxLevel)
        : [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
    drawAccountRoadmap(L, milestones, passiveLevels);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));

    if (accountRoadmapHover && typeof accountRoadmapHoverPt === "object") {
        drawAccountRoadmapTooltip(accountRoadmapHoverPt.x, accountRoadmapHoverPt.y, accountRoadmapHover);
    }
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

        drawSlot(420, 200, "", craftedItem, 120, { useForgedFrame: false });

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
    const L = getChampionScreenLayout();
    const { sprite, equipmentSlots, stats: S, inventory: inv } = L;

    if (assets['champion_bg'] && assets['champion_bg'].complete) {
        ctx.drawImage(assets['champion_bg'], 30, 80, 900, 520);
    } else {
        ctx.fillStyle = COLORS.PANEL;
        ctx.fillRect(30, 80, 900, 520);
    }
    drawChampionVignette();
    drawChampionTorchFlicker();

    ctx.fillStyle = COLORS.CHAMPION_PANEL_GLASS;
    ctx.fillRect(26, 88, 392, 508);
    const gGlass = ctx.createLinearGradient(26, 88, 420, 596);
    gGlass.addColorStop(0, "rgba(30,26,38,0.25)");
    gGlass.addColorStop(1, "rgba(8,8,14,0.45)");
    ctx.fillStyle = gGlass;
    ctx.fillRect(26, 88, 392, 508);

    const eqg = S.equipmentGrid;
    const statsEquipPadY = 6;
    const statsEquipTop = S.panel.y - statsEquipPadY;
    const statsEquipH = (eqg.y + eqg.h + statsEquipPadY) - statsEquipTop;
    ctx.fillStyle = COLORS.CHAMPION_PANEL_GLASS;
    ctx.fillRect(S.panel.x - 4, statsEquipTop, S.panel.w + 8, statsEquipH);
    ctx.fillRect(inv.gridX - 6, inv.bodyTop - 28, inv.bodyW + 12, inv.bodyH + 36);

    strokeChampionIronFrame(30, 80, 900, 520);

    drawAccountHeaderMini();

    drawChampionRimLight(sprite);
    drawPlayerClassSprite(selectedChar, sprite.x, sprite.y, sprite.w, sprite.h, "CHAMPION");
    drawChampionAmbientDust(sprite);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "bold 13px Ubuntu";
    ctx.fillText("STATS", S.panel.x, S.panel.y - 2);
    if (player.points > 0) {
        ctx.font = "bold 12px Ubuntu";
        ctx.fillStyle = COLORS.UI_AMBER;
        ctx.fillText(`(${player.points} pts)`, S.panel.x + 52, S.panel.y - 2);
    }

    const statIconMap = { STR: "stat_icon_str", DEX: "stat_icon_dex", STA: "stat_icon_sta", LUCK: "stat_icon_luck" };
    const pulse = 0.45 + 0.55 * Math.sin(Date.now() / 220);

    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        const rowY = S.rowStart + i * S.rowStep;
        const baseVal = player["base" + s];
        const accountVal = player.accountBonus ? (player.accountBonus[s] || 0) : 0;
        const bonusVal = player.bonus[s];
        const maxVal = player.maxStats[s];
        const isMax = baseVal >= maxVal;

        ctx.fillStyle = "rgba(22,18,28,0.65)";
        ctx.fillRect(S.panel.x + 2, rowY, S.rowWidth, 42);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.strokeRect(S.panel.x + 2, rowY, S.rowWidth, 42);

        const iconKey = statIconMap[s];
        if (assets[iconKey] && assets[iconKey].complete) {
            ctx.drawImage(assets[iconKey], S.labelColX, rowY + 5, 30, 30);
        }

        ctx.textAlign = "left";
        ctx.font = "bold 17px Ubuntu";
        ctx.fillStyle = COLORS.CREAM;
        const statLabelX = S.labelColX + 36;
        ctx.fillText(s + ":", statLabelX, rowY + 26);
        const valueX = statLabelX + ctx.measureText(s + ":").width + 4;
        drawChampionStatValueSegments(valueX, rowY + 26, baseVal, accountVal, bonusVal, isMax);

        if (s === "STA") {
            ctx.font = "11px Ubuntu";
            ctx.fillStyle = COLORS.UI_MUTED_TEXT;
            ctx.fillText(`HP ${player.maxHp}`, statLabelX, rowY + 39);
        } else if (i === 0 && (accountVal > 0 || bonusVal > 0)) {
            ctx.font = "10px Ubuntu";
            ctx.fillStyle = COLORS.GRAY;
            ctx.fillText("White base · Green account · Blue gear", statLabelX, rowY + 39);
        }

        if (player.points > 0 && !isMax) {
            const btnX = S.panel.x + S.plusRelX;
            const btnY = rowY + 6;
            ctx.fillStyle = COLORS.STAT_BTN_BG;
            ctx.fillRect(btnX, btnY, 30, 30);
            ctx.shadowBlur = 8 * pulse;
            ctx.shadowColor = `rgba(232,168,56,${0.35 + 0.4 * pulse})`;
            ctx.strokeStyle = COLORS.UI_AMBER;
            ctx.lineWidth = 1.5 + pulse * 0.5;
            ctx.strokeRect(btnX, btnY, 30, 30);
            ctx.shadowBlur = 0;
            ctx.fillStyle = COLORS.UI_AMBER;
            ctx.font = "bold 20px Ubuntu";
            ctx.textAlign = "center";
            ctx.fillText("+", btnX + 15, btnY + 22);
        }

        if (baseVal >= 15) {
            ctx.font = "italic 10px Ubuntu";
            ctx.fillStyle = COLORS.CYAN;
            ctx.textAlign = "right";
            let desc = "";
            if (s === "STR") desc = "SPILL 10%";
            if (s === "DEX") desc = "+10% DODGE/CRIT";
            if (s === "STA") desc = "-20% DMG";
            if (s === "LUCK") desc = "LEGENDARY CRAFT";
            ctx.fillText(desc, S.panel.x + S.rowWidth - 2, rowY + 39);
        }
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "bold 13px Ubuntu";
    ctx.fillText("EQUIPMENT", S.panel.x, S.equipmentLabelY);
    strokeChampionIronFrame(eqg.x - 3, eqg.y - 3, eqg.w + 6, eqg.h + 6);
    equipmentSlots.forEach(entry => {
        const m = entry.milestone;
        const unlocked = entry.baseSlot || (typeof isAccountSlotUnlocked === "function" && isAccountSlotUnlocked(entry.slotId));
        const item = unlocked ? player[entry.slotId] : null;
        drawSlot(entry.x, entry.y, entry.slotLabel, item, entry.w, {
            locked: !entry.baseSlot && !unlocked,
            reqLevel: m && typeof m.level === "number" ? m.level : null,
            slotId: entry.slotId,
            useForgedFrame: true
        });
    });

    ctx.fillStyle = COLORS.CREAM;
    ctx.font = "bold 15px Ubuntu";
    ctx.fillText(`INVENTORY (${player.inventory.length}/${INV_LIMIT})`, inv.gridX, inv.headerY);
    ctx.fillStyle = "rgba(12,10,18,0.55)";
    ctx.fillRect(inv.gridX - 4, inv.bodyTop - 6, inv.bodyW, inv.bodyH);
    strokeChampionIronFrame(inv.gridX - 4, inv.bodyTop - 6, inv.bodyW, inv.bodyH);

    const cellStride = inv.cell + inv.gap;
    for (let i = 0; i < 4; i++) {
        const x = inv.gridX + inv.pad + i * cellStride;
        const y = inv.bodyTop;
        const item = player.inventory[i];
        if (item) {
            let isEq = player.weapon === item || player.armor === item;
            if (!isEq && typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
                for (const sid of ACCOUNT_EQUIP_SLOT_IDS) {
                    if (player[sid] === item) {
                        isEq = true;
                        break;
                    }
                }
            }
            ctx.fillStyle = selectedInvItem === item ? COLORS.GOLD : (isEq ? COLORS.CYAN : COLORS.SLOT_BG);
            ctx.fillRect(x, y, inv.cell, inv.cell);
            strokeChampionIronFrame(x, y, inv.cell, inv.cell);
            drawSprite(item.name, x + 5, y + 5, inv.cell - 10, inv.cell - 10, item.name.substring(0, 2), COLORS[`RARITY_${item.rarity}`]);
        } else {
            ctx.fillStyle = "rgba(30,28,40,0.5)";
            ctx.fillRect(x, y, inv.cell, inv.cell);
            ctx.strokeStyle = "rgba(100,96,118,0.35)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, inv.cell - 1, inv.cell - 1);
        }
    }
    for (let i = 4; i < player.inventory.length; i++) {
        const x = inv.gridX + inv.pad + (i % inv.cols) * cellStride;
        const y = inv.bodyTop + Math.floor(i / inv.cols) * cellStride;
        const item = player.inventory[i];
        let isEq = player.weapon === item || player.armor === item;
        if (!isEq && typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)) {
            for (const sid of ACCOUNT_EQUIP_SLOT_IDS) {
                if (player[sid] === item) {
                    isEq = true;
                    break;
                }
            }
        }
        ctx.fillStyle = selectedInvItem === item ? COLORS.GOLD : (isEq ? COLORS.CYAN : COLORS.SLOT_BG);
        ctx.fillRect(x, y, inv.cell, inv.cell);
        strokeChampionIronFrame(x, y, inv.cell, inv.cell);
        drawSprite(item.name, x + 5, y + 5, inv.cell - 10, inv.cell - 10, item.name.substring(0, 2), COLORS[`RARITY_${item.rarity}`]);
    }

    if (selectedInvItem) renderItemDetails();
    if (inventoryStatHover) {
        drawChampionStatTooltip(inventoryHoverPt.x, inventoryHoverPt.y, inventoryStatHover);
    }
    uiButtons.forEach(btn => {
        if (btn.state === "inventory") {
            if (btn.label === "BACK TO CAMP" && assets["back_to_camp_btn"] && assets["back_to_camp_btn"].complete) {
                ctx.drawImage(assets["back_to_camp_btn"], btn.x, btn.y, btn.w, btn.h);
            } else {
                drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
            }
        }
    });
}

function renderItemDetails() {
    ctx.fillStyle = "rgba(18,16,28,0.94)";
    ctx.fillRect(600, 110, 310, 400);
    strokeChampionIronFrame(600, 110, 310, 400);
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