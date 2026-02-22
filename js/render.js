function drawLoadingScreen() {
    ctx.fillStyle = COLORS.DARK_BG;
    ctx.fillRect(0, 0, 960, 650);

    const barWidth = 400;
    const progress = assetsLoaded / totalAssets;
    const currentWidth = (barWidth - 10) * progress;

    // Outer Bar
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(480 - barWidth/2, 325, barWidth, 30);

    // Inner Progress
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillRect(485 - barWidth/2, 330, currentWidth, 20);

    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "bold 24px Arial";
    ctx.fillText("FORGING ARENA ASSETS...", 480, 300);
    
    ctx.font = "12px monospace";
    ctx.fillStyle = COLORS.GRAY;
    ctx.fillText(`${assetsLoaded} / ${totalAssets} LOADED`, 480, 375);
}

// ... Keep all your existing draw functions (drawMenu, drawCamp, etc.) below this ...
function drawStyledBtn(x, y, w, h, txt, baseCol) {
    ctx.fillStyle = COLORS.GOLD; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = baseCol; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.CYAN; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 20px Arial"; ctx.textAlign = "center";
    ctx.fillText(txt || "???", x + w / 2, y + h / 2 + 7);
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

function drawProgressBar() {
    const barWidth = 700, startX = (canvas.width - barWidth) / 2, startY = 20, slotW = barWidth / 10;
    for (let i = 1; i <= 10; i++) {
        const x = startX + (i - 1) * slotW, isDefeated = i < currentLvl, isCurrent = i === currentLvl;
        ctx.fillStyle = isDefeated ? COLORS.GRAY : (isCurrent ? COLORS.CYAN : "rgba(40, 40, 60, 0.6)");
        ctx.fillRect(x + 5, startY, slotW - 10, 24);
        ctx.strokeStyle = isCurrent ? COLORS.GOLD : COLORS.WHITE;
        ctx.strokeRect(x + 5, startY, slotW - 10, 24);
        if (isDefeated) {
            ctx.strokeStyle = COLORS.RED; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(x + 8, startY + 4); ctx.lineTo(x + slotW - 12, startY + 20);
            ctx.moveTo(x + slotW - 12, startY + 4); ctx.lineTo(x + 8, startY + 20); ctx.stroke();
            ctx.lineWidth = 1;
        }
    }
}

function drawHealthBar(x, y, w, val, max, name) {
    ctx.fillStyle = "rgba(200, 50, 50, 0.3)"; ctx.fillRect(x, y, w, 20);
    ctx.fillStyle = COLORS.GREEN; ctx.fillRect(x, y, w * (Math.max(0, val)/max), 20);
    ctx.strokeStyle = "white"; ctx.strokeRect(x, y, w, 20);
    ctx.fillStyle = "white"; ctx.font = "bold 12px Arial"; ctx.textAlign = "left";
    ctx.fillText(`${name}: ${Math.floor(val)}/${max}`, x, y - 8);
}

function drawSprite(key, x, y, w, h, label, color) {
    if (assets[key] && assets[key].complete) ctx.drawImage(assets[key], x, y, w, h);
    else { 
        ctx.fillStyle = color || "#323232"; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "white"; ctx.font = "12px Arial"; ctx.textAlign = "center";
        ctx.fillText(label || key, x + w/2, y + h/2);
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
    ctx.fillText(label, x + size/2, y + 25);
    if(item) {
        const imgSize = size * 0.75, offset = (size - imgSize) / 2;
        drawSprite(item.name, x + offset, y + offset + 5, imgSize, imgSize, item.name.substring(0,3), COLORS[`RARITY_${item.rarity}`]);
    }
}

function drawMenu() {
    ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 50px Arial";
    ctx.fillText("GAUNTLET ARENA", 480, 250);
    ctx.fillStyle = COLORS.WHITE; ctx.font = "20px Arial"; ctx.fillText("ENTER NAME & PRESS ENTER", 480, 320);
    ctx.fillStyle = "#28283C"; ctx.fillRect(330, 340, 300, 50);
    ctx.fillStyle = COLORS.CYAN; ctx.fillText(userName + (Math.floor(Date.now()/500)%2==0?"|":""), 480, 372);
}

function drawCamp() {
    ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 45px Arial";
    ctx.fillText("MAIN CAMP", 480, 80);
    ctx.font = "bold 20px Arial"; ctx.fillStyle = COLORS.WHITE;
    ctx.fillText(`Stage Progress: ${currentLvl} / 10`, 480, 120);
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillText(`Ore: ${player.ore}`, 480, 160);
    if (assets['ore'] && assets['ore'].complete) ctx.drawImage(assets['ore'], 410, 140, 25, 25);
    const iconMap = { "CHAMPION": "camp_champion", "FORGE": "camp_craft", "BATTLE": "camp_battle" };
    uiButtons.forEach(btn => {
        if (btn.state === "camp") {
            const assetKey = iconMap[btn.label];
            if (assets[assetKey] && assets[assetKey].complete) ctx.drawImage(assets[assetKey], btn.x, btn.y, btn.w, btn.h);
            else drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
        }
    });
    drawLevelUp();
}

function drawForge() {
    if (assets['forge_bg'] && assets['forge_bg'].complete) ctx.drawImage(assets['forge_bg'], 155, 0, 650, 650);
    ctx.textAlign = "center"; ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 24px Arial";
    ctx.fillText(`${player.ore} ORE AVAILABLE`, 480, 510);
    
    if (inventoryError) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; ctx.fillRect(330, 530, 300, 80);
        ctx.fillStyle = COLORS.RED; ctx.font = "bold 22px Arial"; ctx.fillText("INVENTORY FULL!", 480, 565);
        ctx.font = "14px Arial"; ctx.fillText("(Click anywhere to dismiss)", 480, 585);
    } else {
        uiButtons.forEach(btn => btn.state === "forge" && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
    }
}

function drawCombat() {
    drawSprite('player', 20, 130, 350, 350, "HERO");
    drawSprite(`enemy_${currentLvl}`, 590, 130, 350, 350, enemy.name);
    drawHealthBar(40, 90, 300, pDisplayHp, player.maxHp, userName);
    drawHealthBar(620, 90, 300, eDisplayHp, enemy.maxHp, enemy.name);
    for(let i=1; i<=5; i++) {
        const id = i.toString(), y = 140 + (i-1) * 65;
        ctx.fillStyle = selBlk.includes(id) ? COLORS.CYAN : "rgba(40, 40, 60, 0.7)";
        ctx.fillRect(320, y, 60, 60);
        drawSprite(`icon_${id}`, 325, y+5, 50, 50, ZONE_NAMES[id]);
        ctx.fillStyle = selAtk === id ? COLORS.RED : "rgba(40, 40, 60, 0.7)";
        ctx.fillRect(580, y, 60, 60);
        drawSprite(`icon_${id}`, 585, y+5, 50, 50, ZONE_NAMES[id]);
    }
    if (!isProcessing) {
        ctx.textAlign = "center"; ctx.font = "bold 16px Arial";
        ctx.fillStyle = (selBlk.length === 2) ? COLORS.GREEN : COLORS.CYAN;
        ctx.fillText(`DEFENSE: ${selBlk.length}/2`, 350, 130);
        ctx.fillStyle = (selAtk) ? COLORS.GREEN : COLORS.RED;
        ctx.fillText(`ATTACK: ${selAtk ? 1 : 0}/1`, 610, 130);
    }
    uiButtons.forEach(btn => {
        if (btn.state === "combat") {
            if (btn.label === "FIGHT!" && assets['fight_btn'] && assets['fight_btn'].complete) ctx.drawImage(assets['fight_btn'], btn.x, btn.y, btn.w, btn.h);
            else drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color);
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
    ctx.fillStyle = COLORS.PANEL; ctx.fillRect(30, 80, 900, 520);
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(30, 80, 900, 520);
    drawSprite('player', 40, 120, 400, 400, "CHAMPION");
    
    const centerLine = 410; 
    
    ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 18px Arial"; ctx.textAlign = "left";
    ctx.fillText("EQUIPMENT", centerLine, 120);
    drawSlot(centerLine, 140, "WEAPON", player.weapon, 90);
    drawSlot(centerLine + 100, 140, "ARMOR", player.armor, 90);
    ctx.fillText("STATS", centerLine, 280);
    
    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        const baseY = 315 + i * 40;
        const baseVal = player["base" + s];
        const bonusVal = player.bonus[s];
        const isMax = baseVal >= 20;

        ctx.textAlign = "left"; ctx.font = "20px Arial"; 
        ctx.fillStyle = isMax ? COLORS.GOLD : COLORS.WHITE;
        
        let statTxt = `${s}: ${baseVal}`;
        if (bonusVal > 0) statTxt += ` (+${bonusVal})`;
        if (isMax) statTxt += " (MAX)";
        
        ctx.fillText(statTxt, centerLine, baseY);

        if(player.points > 0 && !isMax) {
            ctx.fillStyle = COLORS.GREEN; ctx.fillRect(centerLine + 220, baseY - 20, 26, 26);
            ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "center"; ctx.fillText("+", centerLine + 233, baseY + 1);
        }
    });
    
    const gridX = 660; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 16px Arial"; ctx.textAlign = "left";
    ctx.fillText(`INVENTORY (${player.inventory.length}/${INV_LIMIT})`, gridX, 120);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(gridX, 135, 260, 340);
    player.inventory.forEach((item, i) => {
        const x = gridX + 10 + (i % 4) * 62, y = 145 + Math.floor(i / 4) * 62, isEq = (player.weapon === item || player.armor === item);
        ctx.fillStyle = selectedInvItem === item ? COLORS.GOLD : (isEq ? COLORS.CYAN : COLORS.SLOT_BG);
        ctx.fillRect(x, y, 55, 55);
        drawSprite(item.name, x+5, y+5, 45, 45, item.name.substring(0,2), COLORS[`RARITY_${item.rarity}`]);
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
    ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0,0,960,650);
    ctx.textAlign = "center";
    const isVictory = state === "victory";
    ctx.fillStyle = isVictory ? COLORS.GOLD : COLORS.RED;
    ctx.font = "bold 60px Arial"; ctx.fillText(isVictory ? "VICTORY" : "DEFEATED", 480, 100);
    highScores.slice(0, 5).forEach((s, i) => {
        ctx.fillStyle = COLORS.WHITE; ctx.font = "18px monospace";
        ctx.fillText(`${i+1}. ${s.name}: ${s.score}`, 480, 200 + i*30);
    });
    uiButtons.forEach(btn => btn.state === state && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}