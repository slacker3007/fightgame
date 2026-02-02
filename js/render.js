/**
 * render.js - Full Graphics & UI Output
 */

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

function drawSlot(x, y, label, item) {
    ctx.fillStyle = COLORS.SLOT_BG; ctx.fillRect(x, y, 100, 100);
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(x, y, 100, 100);
    ctx.fillStyle = COLORS.GRAY; ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
    ctx.fillText(label, x + 50, y + 20);
    if(item) drawSprite(item.name, x+15, y+25, 70, 70, item.name.substring(0,3), COLORS[`RARITY_${item.rarity}`]);
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
    ctx.fillText("MAIN CAMP", 480, 100);
    ctx.font = "bold 20px Arial"; ctx.fillStyle = COLORS.WHITE;
    ctx.fillText(`Progress: Stage ${currentLvl}/10`, 480, 140);
    ctx.fillStyle = COLORS.CYAN;
    ctx.fillText(`Materials: ${player.materials}`, 480, 175);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.beginPath(); ctx.moveTo(100, 200); ctx.lineTo(860, 200); ctx.stroke();
    uiButtons.forEach(btn => btn.state === "camp" && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
    drawLevelUp();
}

function drawForge() {
    ctx.textAlign = "center"; ctx.fillStyle = "#A335EE"; ctx.font = "bold 45px Arial";
    ctx.fillText("THE FORGE", 480, 80);
    ctx.fillStyle = "rgba(30, 30, 40, 0.9)";
    ctx.fillRect(200, 140, 560, 220);
    ctx.strokeStyle = COLORS.GOLD; ctx.lineWidth = 3;
    ctx.strokeRect(200, 140, 560, 220);
    ctx.fillStyle = COLORS.WHITE; ctx.font = "24px Arial";
    ctx.fillText(`Scrap Materials: ${player.materials}`, 480, 200);
    ctx.font = "16px Arial"; ctx.fillStyle = COLORS.GRAY;
    ctx.fillText("10 Scrap = 1 Random Item", 480, 230);
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = COLORS.RARITY_COMMON; ctx.fillText("Common: 70%", 400, 270);
    ctx.fillStyle = COLORS.RARITY_RARE; ctx.fillText("Rare: 20%", 480, 270);
    ctx.fillStyle = COLORS.RARITY_EPIC; ctx.fillText("Epic: 10%", 560, 270);
    uiButtons.forEach(btn => btn.state === "forge" && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
}

function drawCombat() {
    drawSprite('player', 20, 150, 350, 350, "HERO"); 
    drawSprite(`enemy_${currentLvl}`, 590, 150, 350, 350, enemy.name);
    drawHealthBar(40, 100, 300, pDisplayHp, player.maxHp, userName);
    drawHealthBar(620, 100, 300, eDisplayHp, enemy.maxHp, enemy.name);
    for(let i=1; i<=5; i++) {
        const id = i.toString(), y = 150 + (i-1) * 75;
        ctx.fillStyle = selBlk.includes(id) ? COLORS.CYAN : "rgba(40, 40, 60, 0.7)";
        ctx.fillRect(310, y, 70, 70); drawSprite(`icon_${id}`, 315, y+5, 60, 60, ZONE_NAMES[id]);
        ctx.fillStyle = selAtk === id ? COLORS.RED : "rgba(40, 40, 60, 0.7)";
        ctx.fillRect(580, y, 70, 70); drawSprite(`icon_${id}`, 585, y+5, 60, 60, ZONE_NAMES[id]);
    }
    uiButtons.forEach(btn => btn.state === "combat" && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
    ctx.fillStyle = COLORS.LOG_BG; ctx.fillRect(20, 545, 920, 95);
    log.slice(-5).forEach((m, i) => {
        ctx.font = "14px monospace"; ctx.fillStyle = m.col; ctx.textAlign = "left";
        ctx.fillText(`> ${m.txt}`, 40, 570 + i*14);
    });
}

function drawInventory() {
    ctx.fillStyle = COLORS.PANEL; ctx.fillRect(50, 110, 350, 470);
    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "left"; ctx.font = "bold 18px Arial";
        ctx.fillText(`${s}: ${player[s] + player.bonus[s]}`, 75, 195 + i*32);
        if(player.points > 0) {
            ctx.fillStyle = COLORS.GREEN; ctx.fillRect(340, 178 + i*32, 22, 22);
            ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "center"; ctx.fillText("+", 351, 195 + i*32);
        }
    });
    drawSlot(75, 340, "WEAPON", player.weapon); drawSlot(225, 340, "ARMOR", player.armor);
    ctx.fillStyle = "rgba(10, 10, 20, 0.9)"; ctx.fillRect(430, 110, 480, 400);
    player.inventory.forEach((item, i) => {
        const x = 450 + (i % 5) * 90, y = 130 + Math.floor(i / 5) * 90;
        const isEq = (player.weapon === item || player.armor === item);
        ctx.fillStyle = selectedInvItem === item ? COLORS.GOLD : (isEq ? COLORS.CYAN : COLORS.SLOT_BG);
        ctx.fillRect(x, y, 80, 80);
        drawSprite(item.name, x+10, y+10, 60, 60, item.name.substring(0,2), COLORS[`RARITY_${item.rarity}`]);
    });
    if (selectedInvItem) {
        ctx.fillStyle = "#1a1a2e"; ctx.fillRect(600, 110, 310, 400); 
        ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(600, 110, 310, 400);
        ctx.fillStyle = COLORS.RED; ctx.fillRect(875, 115, 30, 30); 
        ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "center"; ctx.fillText("X", 890, 137);
        ctx.fillStyle = COLORS[`RARITY_${selectedInvItem.rarity}`]; ctx.font = "bold 20px Arial"; ctx.textAlign = "center";
        ctx.fillText(selectedInvItem.name.toUpperCase(), 755, 150);
        let sy = 200;
        ["STR", "DEX", "STA", "LUCK"].forEach(s => {
            if(selectedInvItem[s]) {
                ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "left";
                ctx.fillText(`${s}: +${selectedInvItem[s]}`, 630, sy); sy += 30;
            }
        });
    }
    uiButtons.forEach(btn => btn.state === "inventory" && drawStyledBtn(btn.x, btn.y, btn.w, btn.h, btn.label, btn.color));
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