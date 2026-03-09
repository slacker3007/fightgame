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
    ctx.font = "bold 24px Arial";
    ctx.fillText("FORGING ARENA ASSETS...", 480, 300);

    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.GRAY;
    ctx.fillText(`${assetsLoaded} / ${totalAssets} LOADED`, 480, 375);
}

function drawFxParticles() {
    fxParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// ... Keep all your existing draw functions (drawMenu, drawCamp, etc.) below this ...
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
    ctx.font = "bold 20px 'Segoe UI', Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "black";
    ctx.fillText(txt || "???", x + w / 2, y + h / 2 + 7);
    ctx.shadowBlur = 0;
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
    ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 48px Arial";
    ctx.fillText("STAGE CLEAR!", 480, 310);
    ctx.font = "bold 18px Arial"; ctx.fillStyle = COLORS.CYAN;
    ctx.fillText("+2 STAT POINTS & MATERIALS RECEIVED", 480, 335);
    ctx.restore();
    levelUpTimer--;
}


function drawHealthBar(x, y, w, val, max, name) {
    ctx.fillStyle = "rgba(200, 50, 50, 0.3)"; ctx.fillRect(x, y, w, 20);
    ctx.fillStyle = COLORS.GREEN; ctx.fillRect(x, y, w * (Math.max(0, val) / max), 20);
    ctx.strokeStyle = "white"; ctx.strokeRect(x, y, w, 20);
    ctx.fillStyle = "white"; ctx.font = "bold 12px Arial"; ctx.textAlign = "left";
    ctx.fillText(`${name}: ${Math.floor(val)}/${max}`, x, y - 8);
}

function drawSprite(key, x, y, w, h, label, color) {
    if (assets[key] && assets[key].complete) {
        ctx.drawImage(assets[key], x, y, w, h);
    } else {
        ctx.fillStyle = color || "#323232";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(label || key, x + w / 2, y + h / 2);
    }
}

function drawSlot(x, y, label, item, size = 120) {
    ctx.fillStyle = COLORS.SLOT_BG;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = item ? COLORS[`RARITY_${item.rarity}`] : COLORS.GOLD;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, size, size);
    ctx.lineWidth = 1;
    ctx.fillStyle = COLORS.GRAY; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.fillText(label, x + size / 2, y + 25);
    if (item) {
        const imgSize = size * 0.75, offset = (size - imgSize) / 2;
        drawSprite(item.name, x + offset, y + offset + 5, imgSize, imgSize, item.name.substring(0, 3), COLORS[`RARITY_${item.rarity}`]);
    }
}

function drawMenu() {
    ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0, 0, 960, 650);
    ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 40px Arial";
    ctx.fillText("NAME YOUR CHAMPION", 480, 150);
    
    if (selectedChar) {
        drawSprite(`player_${selectedChar}`, 380, 180, 200, 200, selectedChar);
        ctx.fillStyle = COLORS.CYAN; ctx.font = "bold 24px Arial";
        ctx.fillText(selectedChar + " CLASS", 480, 420);
    }

    ctx.fillStyle = COLORS.WHITE; ctx.font = "20px Arial"; ctx.fillText("TYPE NAME & CLICK 'START GAME' TO BEGIN", 480, 460);
    ctx.fillStyle = "#28283C"; ctx.fillRect(330, 480, 300, 50);
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(330, 480, 300, 50);
    ctx.fillStyle = COLORS.CYAN; ctx.font = "bold 24px Arial";
    ctx.fillText(userName + (Math.floor(Date.now() / 500) % 2 == 0 ? "|" : ""), 480, 515);

    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawCharSelect() {
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, 960, 650);
    ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 40px Arial";
    ctx.fillText("CHOOSE YOUR DESTINY", 480, 80);

    const chars = ["STR", "DEX", "LUCK", "STA"];
    const labels = ["WARRIOR", "ROGUE", "GAMBLER", "DEFENDER"];
    const descriptions = [
        "High strength, high damage.",
        "High dexterity, high dodge.",
        "High luck, high crit & craft rate.",
        "High stamina, high health."
    ];

    chars.forEach((c, i) => {
        const x = 50 + i * 225, y = 150, w = 210, h = 400;
        
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = (selectedChar === c) ? COLORS.CYAN : COLORS.GOLD;
        ctx.lineWidth = (selectedChar === c) ? 4 : 2;
        ctx.strokeRect(x, y, w, h);

        drawSprite(`player_${c}`, x + 5, y + 50, 200, 200, c);

        ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 24px Arial";
        ctx.fillText(labels[i], x + 105, y + 40);

        ctx.font = "bold 18px Arial"; ctx.fillStyle = COLORS.CYAN;
        ctx.fillText(c + " FOCUS", x + 105, y + 270);

        ctx.font = "14px Arial"; ctx.fillStyle = COLORS.GRAY;
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
    ctx.font = "bold 20px 'Segoe UI', Arial"; // Ensure font is set for ore text
    ctx.fillText(`ORE: ${player.ore}`, 450, oreY + 28);
    if (assets['ore'] && assets['ore'].complete) ctx.drawImage(assets['ore'], 415, oreY + 7, 25, 25);

    const iconMap = { "CHAMPION": "camp_champion", "FORGE": "camp_craft", "BATTLE": "camp_battle" };
    uiButtons.forEach(btn => {
        if (btn.state === "camp") {
            const assetKey = iconMap[btn.label];
            if (assets[assetKey] && assets[assetKey].complete) {
                // Draw icon with a small hover effect-like glow if possible? 
                // For now just draw the image
                ctx.drawImage(assets[assetKey], btn.x, btn.y, btn.w, btn.h);
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
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillText("Forging...", 480, 320);
    } else if (craftedItem) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)"; ctx.fillRect(0, 0, 960, 650);
        ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 36px Arial";
        ctx.fillText("ITEM FORGED!", 480, 150);

        drawSlot(420, 200, "", craftedItem, 120);

        ctx.fillStyle = COLORS[`RARITY_${craftedItem.rarity}`]; ctx.font = "bold 24px Arial";
        ctx.fillText(craftedItem.name, 480, 360);

        let sy = 400; ctx.font = "18px Arial"; ctx.fillStyle = COLORS.WHITE;
        ["STR", "DEX", "STA", "LUCK"].forEach(s => {
            if (craftedItem[s]) {
                ctx.fillText(`${s}: +${craftedItem[s]}`, 480, sy);
                sy += 25;
            }
        });
    } else {
        ctx.textAlign = "center"; ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 24px Arial";
        ctx.fillText(`${player.ore} ORE AVAILABLE`, 480, 410);

        // Display Odds
        const epicCh = 0.05 + (player.total.LUCK * 0.01);
        const rareCh = 0.15 + (player.total.LUCK * 0.02);
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = COLORS.RARITY_EPIC;
        ctx.fillText(`EPIC CHANCE: ${Math.round(epicCh * 100)}%`, 400, 380);
        ctx.fillStyle = COLORS.RARITY_RARE;
        ctx.fillText(`RARE CHANCE: ${Math.round(rareCh * 100)}%`, 560, 380);

        if (player.baseLUCK >= 15) {
            const legCh = 0.02;
            ctx.fillStyle = COLORS.RARITY_LEGENDARY;
            ctx.fillText(`LEGENDARY CHANCE: ${Math.round(legCh * 100)}%`, 480, 360);
        }

        if (inventoryError) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; ctx.fillRect(330, 530, 300, 80);
            ctx.fillStyle = COLORS.RED; ctx.font = "bold 22px Arial"; ctx.fillText("INVENTORY FULL!", 480, 565);
            ctx.font = "14px Arial"; ctx.fillText("(Click anywhere to dismiss)", 480, 585);
        }
    }

    uiButtons.forEach(btn => {
        if (btn.state === "forge") {
            if (btn.label === "CRAFT" && assets['craft_btn'] && assets['craft_btn'].complete) {
                ctx.drawImage(assets['craft_btn'], btn.x, btn.y, btn.w, btn.h);
            } else {
                drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
            }
        }
    });
}

function drawCombat() {
    drawSprite('player', 20, 130, 350, 350, "HERO");
    drawSprite(`enemy_${currentLvl}`, 590, 130, 350, 350, enemy.name);
    drawHealthBar(40, 70, 300, pDisplayHp, player.maxHp, userName);
    drawHealthBar(620, 70, 300, eDisplayHp, enemy.maxHp, enemy.name);

    // Fury Bar
    fDisplayFury += (player.fury - fDisplayFury) * 0.1;
    ctx.fillStyle = "rgba(40, 40, 40, 0.5)"; ctx.fillRect(40, 95, 300, 10);
    ctx.fillStyle = COLORS.GOLD; ctx.fillRect(40, 95, 300 * (fDisplayFury / player.maxFury), 10);
    ctx.strokeStyle = "white"; ctx.strokeRect(40, 95, 300, 10);
    ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 10px Arial"; ctx.textAlign = "left";
    ctx.fillText("FURY", 40, 92);

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
        ctx.textAlign = "center"; ctx.font = "bold 16px Arial";
        ctx.fillStyle = (selBlk.length === 2) ? COLORS.GREEN : COLORS.CYAN;
        ctx.fillText(`DEFENSE: ${selBlk.length}/2`, 350, 125);
        ctx.fillStyle = (selAtk) ? COLORS.GREEN : COLORS.RED;
        ctx.fillText(`ATTACK: ${selAtk ? 1 : 0}/1`, 610, 125);
    }

    uiButtons.forEach(btn => {
        if (btn.state === "combat") {
            const isFightBtn = (btn.label === "FIGHT!" || btn.label === "REGULAR");
            const isGodStrikeBtn = (btn.label === "GOD STRIKE");
            if (isFightBtn && assets['fight_btn'] && assets['fight_btn'].complete) {
                ctx.drawImage(assets['fight_btn'], btn.x, btn.y, btn.w, btn.h);
            } else if (isGodStrikeBtn && assets['god_strike_btn'] && assets['god_strike_btn'].complete) {
                ctx.drawImage(assets['god_strike_btn'], btn.x, btn.y, btn.w, btn.h);
            } else {
                drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
            }
        }
    });

    if (assets['log_bg_img'] && assets['log_bg_img'].complete) ctx.drawImage(assets['log_bg_img'], 240, 450, 480, 200);
    else { ctx.fillStyle = COLORS.LOG_BG; ctx.fillRect(20, 510, 920, 120); }

    log.slice(-5).forEach((m, i) => {
        ctx.font = "bold 16px Georgia, serif"; ctx.fillStyle = m.col; ctx.textAlign = "center";
        ctx.fillText(m.txt, 480, 535 + i * 20);
    });
}

function drawInventory() {
    if (assets['champion_bg'] && assets['champion_bg'].complete) {
        ctx.drawImage(assets['champion_bg'], 30, 80, 900, 520);
    } else {
        ctx.fillStyle = COLORS.PANEL; ctx.fillRect(30, 80, 900, 520);
    }
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(30, 80, 900, 520);
    drawSprite('player', 40, 120, 400, 400, "CHAMPION");


    const centerLine = 410;

    ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 18px Arial"; ctx.textAlign = "left";
    ctx.fillText("EQUIPMENT", centerLine, 120);
    drawSlot(centerLine, 140, "WEAPON", player.weapon, 90);
    drawSlot(centerLine + 100, 140, "ARMOR", player.armor, 90);

    ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 18px Arial"; ctx.textAlign = "left";
    ctx.fillText("STATS", centerLine, 280);
    if (player.points > 0) {
        ctx.fillStyle = COLORS.CYAN; ctx.font = "bold 14px Arial";
        ctx.fillText(`(AVAILABLE POINTS: ${player.points})`, centerLine + 70, 280);
    }

    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        const baseY = 315 + i * 40;
        const baseVal = player["base" + s];
        const bonusVal = player.bonus[s];
        const maxVal = player.maxStats[s];
        const isMax = baseVal >= maxVal;

        ctx.textAlign = "left"; ctx.font = "20px Arial";
        ctx.fillStyle = isMax ? COLORS.GOLD : COLORS.WHITE;

        let statTxt = `${s}: ${baseVal}`;
        if (bonusVal > 0) statTxt += ` (+${bonusVal})`;
        if (isMax) statTxt += " (MAX)";

        ctx.fillText(statTxt, centerLine, baseY);

        if (player.points > 0 && !isMax) {
            ctx.fillStyle = COLORS.GREEN; ctx.fillRect(centerLine + 220, baseY - 20, 26, 26);
            ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "center"; ctx.fillText("+", centerLine + 233, baseY + 1);
        }

        // Special Ability Description
        if (baseVal >= 15) {
            ctx.font = "italic 14px Arial"; ctx.fillStyle = COLORS.CYAN;
            ctx.textAlign = "right";
            let desc = "";
            if (s === "STR") desc = "AOE SPILL DMG (10%)";
            if (s === "DEX") desc = "+10% DODGE & CRIT";
            if (s === "STA") desc = "-20% DMG TAKEN";
            if (s === "LUCK") desc = "LEGENDARY CRAFTING";
            ctx.fillText(desc, centerLine + 246, baseY + 18);
        }
    });

    const gridX = 660; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 16px Arial"; ctx.textAlign = "left";
    ctx.fillText(`INVENTORY (${player.inventory.length}/${INV_LIMIT})`, gridX, 120);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(gridX, 135, 260, 340);
    player.inventory.forEach((item, i) => {
        const x = gridX + 10 + (i % 4) * 62, y = 145 + Math.floor(i / 4) * 62, isEq = (player.weapon === item || player.armor === item);
        ctx.fillStyle = selectedInvItem === item ? COLORS.GOLD : (isEq ? COLORS.CYAN : COLORS.SLOT_BG);
        ctx.fillRect(x, y, 55, 55);
        drawSprite(item.name, x + 5, y + 5, 45, 45, item.name.substring(0, 2), COLORS[`RARITY_${item.rarity}`]);
    });
    if (selectedInvItem) renderItemDetails();
    uiButtons.forEach(btn => btn.state === "inventory" && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function renderItemDetails() {
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(600, 110, 310, 400);
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(600, 110, 310, 400);
    if (salvageConfirm) {
        ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 18px Arial"; ctx.textAlign = "center";
        ctx.fillText("SALVAGE RARE ITEM?", 755, 230);
        ctx.font = "14px Arial"; ctx.fillText("This cannot be undone.", 755, 260);
    } else {
        ctx.fillStyle = COLORS.RED; ctx.fillRect(875, 115, 30, 30);
        ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "center"; ctx.fillText("X", 890, 137);
        ctx.fillStyle = COLORS[`RARITY_${selectedInvItem.rarity}`]; ctx.font = "bold 20px Arial"; ctx.textAlign = "center";
        ctx.fillText(selectedInvItem.name.toUpperCase(), 755, 150);
        const curEquip = (selectedInvItem.type === "weapon") ? player.weapon : player.armor;
        let sy = 220;
        ["STR", "DEX", "STA", "LUCK"].forEach(s => {
            const newVal = selectedInvItem[s] || 0, oldVal = (curEquip && curEquip !== selectedInvItem) ? (curEquip[s] || 0) : 0, diff = newVal - oldVal;
            if (newVal > 0 || oldVal > 0) {
                ctx.textAlign = "left"; ctx.fillStyle = COLORS.WHITE; ctx.fillText(`${s}: ${newVal}`, 630, sy);
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
    ctx.font = "bold 60px Arial"; ctx.fillText(isVictory ? "VICTORY" : "DEFEATED", 480, 100);
    highScores.slice(0, 5).forEach((s, i) => {
        ctx.fillStyle = COLORS.WHITE; ctx.font = "18px monospace";
        ctx.fillText(`${i + 1}. ${s.name}: ${s.score}`, 480, 200 + i * 30);
    });
    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawBattleSelect() {
    // Overlay background
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, 960, 650);

    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 40px 'Segoe UI', Arial";
    ctx.fillText("SELECT YOUR NEXT BATTLE", 480, 100);

    // Reuse progress bar logic for visualization but standalone
    const barWidth = 700, startX = (canvas.width - barWidth) / 2, startY = 150, slotW = barWidth / 5;

    // Draw 10 levels in 2 rows
    for (let i = 1; i <= 10; i++) {
        const row = Math.floor((i - 1) / 5);
        const col = (i - 1) % 5;
        const x = startX + col * slotW;
        const y = startY + row * 150;

        const isDefeated = i < maxLvl;
        const isNext = i === maxLvl;
        const isLocked = i > maxLvl;

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
        ctx.font = "bold 18px 'Segoe UI', Arial";
        ctx.fillText(`LEVEL ${i}`, x + slotW / 2, y + 25);

        // Icon Area
        const iconSize = 80;
        const iconX = x + slotW / 2 - iconSize / 2;
        const iconY = y + 35;

        // Draw Icon
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
            ctx.font = "bold 12px Arial";
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
            ctx.font = "bold 14px Arial";
            ctx.fillText("AVAILABLE", x + slotW / 2, y + 115);
        } else {
            ctx.fillStyle = COLORS.GRAY;
            ctx.font = "bold 12px Arial";
            ctx.fillText("LOCKED", x + slotW / 2, y + 115);
        }
    }

    uiButtons.forEach(btn => {
        if (btn.state === "battle_select" && !btn.noDraw) {
            drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
        }
    });
}