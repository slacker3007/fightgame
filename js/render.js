function drawStyledBtn(x, y, w, h, txt, baseCol) {
    ctx.fillStyle = COLORS.GOLD; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = baseCol; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.CYAN; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 16px Arial"; ctx.textAlign = "center";
    ctx.fillText(txt, x + w / 2, y + h / 2 + 6);
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
        }
    }
    ctx.lineWidth = 1;
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
    else { ctx.fillStyle = color || "#323232"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(label || key, x + w/2, y + h/2); }
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
    ctx.textAlign = "center"; ctx.fillStyle = COLORS.GOLD; ctx.font = "bold 40px Arial";
    ctx.fillText(`CAMP - PREPARING FOR STAGE ${currentLvl}`, 480, 100);
    ctx.fillStyle = COLORS.PANEL; ctx.fillRect(100, 150, 760, 350);
    drawSprite('player', 150, 200, 250, 250, "HERO");
    ctx.textAlign = "left"; ctx.font = "bold 24px Arial"; ctx.fillStyle = COLORS.CYAN;
    ctx.fillText(userName.toUpperCase(), 450, 220);
    ctx.fillStyle = COLORS.WHITE; ctx.font = "18px Arial";
    ctx.fillText(`MAX HP: ${player.maxHp}`, 450, 260); ctx.fillText(`ATTACK: ${player.dmg}`, 450, 290);
    drawStyledBtn(450, 380, 180, 50, "ARMORY (I)", COLORS.GRAY);
    drawStyledBtn(650, 380, 180, 50, "FIGHT!", COLORS.GREEN);
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

    if(selAtk && selBlk.length === 2) {
        if(!isProcessing) drawStyledBtn(430, 495, 100, 45, "FIGHT", COLORS.GOLD);
    } else {
        ctx.fillStyle = COLORS.WHITE; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
        let msg = "Select 2 DEFENSE and 1 ATTACK area";
        if (selBlk.length < 2) msg = `Select ${2 - selBlk.length} more DEFENSE areas`;
        else if (!selAtk) msg = "Select 1 ATTACK area";
        ctx.fillText(msg, 480, 525);
    }

    ctx.fillStyle = COLORS.LOG_BG; ctx.fillRect(20, 545, 920, 95);
    log.slice(-5).forEach((m, i) => {
        ctx.font = "14px monospace"; ctx.fillStyle = m.col; ctx.textAlign = "left";
        ctx.fillText(`> ${m.txt}`, 40, 570 + i*14);
    });
}

function drawInventory() {
    // 1. LEFT PANEL: Player Stats & Equipped Slots
    ctx.fillStyle = COLORS.PANEL; ctx.fillRect(50, 110, 350, 470);
    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        ctx.fillStyle = COLORS.WHITE; ctx.textAlign = "left"; ctx.font = "bold 18px Arial";
        ctx.fillText(`${s}: ${player[s] + player.bonus[s]}`, 75, 195 + i*32);
        if(player.points > 0) {
            ctx.fillStyle = COLORS.GREEN; ctx.fillRect(340, 178 + i*32, 22, 22);
            ctx.fillStyle = COLORS.WHITE; ctx.fillText("+", 345, 195 + i*32);
        }
    });
    drawSlot(75, 340, "WEAPON", player.weapon); drawSlot(225, 340, "ARMOR", player.armor);
    
    // 2. RIGHT PANEL: The Item Grid
    ctx.fillStyle = "rgba(10, 10, 20, 0.9)"; ctx.fillRect(430, 110, 480, 400);
    player.inventory.forEach((item, i) => {
        const x = 450 + (i % 5) * 90, y = 130 + Math.floor(i / 5) * 90;
        const isEq = (player.weapon === item || player.armor === item);
        ctx.fillStyle = selectedInvItem === item ? COLORS.GOLD : (isEq ? COLORS.CYAN : COLORS.SLOT_BG);
        ctx.fillRect(x, y, 80, 80);
        drawSprite(item.name, x+10, y+10, 60, 60, item.name.substring(0,2), COLORS[`RARITY_${item.rarity}`]);
    });

    // 3. DETAILS OVERLAY: Prevents overlapping with the grid
    if (selectedInvItem) {
        // Clear the right-side area with a solid sub-panel
        ctx.fillStyle = "#1a1a2e"; 
        ctx.fillRect(600, 110, 310, 400); 
        ctx.strokeStyle = COLORS.GOLD;
        ctx.strokeRect(600, 110, 310, 400);

        // Name and Stats
        ctx.fillStyle = COLORS[`RARITY_${selectedInvItem.rarity}`];
        ctx.font = "bold 20px Arial"; ctx.textAlign = "center";
        ctx.fillText(selectedInvItem.name.toUpperCase(), 755, 150);
        
        ctx.fillStyle = COLORS.WHITE; ctx.font = "18px Arial"; ctx.textAlign = "left";
        let statY = 200;
        ["STR", "DEX", "STA", "LUCK"].forEach(s => {
            if (selectedInvItem[s] !== undefined) {
                const val = selectedInvItem[s];
                ctx.fillStyle = val >= 0 ? COLORS.GREEN : COLORS.RED;
                ctx.fillText(`${s}: ${val >= 0 ? "+" : ""}${val}`, 650, statY);
                statY += 30;
            }
        });

        const isEq = (player.weapon === selectedInvItem || player.armor === selectedInvItem);
        drawStyledBtn(680, 440, 150, 45, isEq ? "REMOVE" : "EQUIP", COLORS.BTN_BLUE);

        // Inside if (selectedInvItem) block in drawInventory()
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(875, 115, 30, 30); // Positioned at the top right of the detail panel
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("X", 890, 137);
    }

    drawStyledBtn(430, 530, 150, 40, "BACK", COLORS.GRAY);
}

function drawEnd() {
    ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0,0,960,650);
    ctx.textAlign = "center"; 
    const isVictory = state === "victory";
    ctx.fillStyle = isVictory ? COLORS.GOLD : COLORS.RED;
    ctx.font = "bold 60px Arial"; ctx.fillText(isVictory ? "VICTORY" : "DEFEATED", 480, 100);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)"; ctx.fillRect(330, 140, 300, 300);
    ctx.strokeStyle = COLORS.GOLD; ctx.strokeRect(330, 140, 300, 300);

    ctx.fillStyle = COLORS.CYAN; ctx.font = "bold 24px Arial";
    ctx.fillText("HIGH SCORES", 480, 175);

    ctx.font = "18px monospace";
    highScores.forEach((s, i) => {
        const yPos = 220 + (i * 35);
        ctx.textAlign = "left";
        ctx.fillStyle = s.name === userName ? COLORS.GOLD : COLORS.WHITE;
        ctx.fillText(`${i + 1}. ${s.name.padEnd(12, '.')}`, 350, yPos);
        ctx.textAlign = "right"; ctx.fillText(s.score.toString(), 610, yPos);
    });

    if (highScores.length === 0) {
        ctx.textAlign = "center"; ctx.fillStyle = COLORS.GRAY;
        ctx.fillText("No scores yet", 480, 280);
    }

    ctx.textAlign = "center";
    drawStyledBtn(380, 480, 200, 60, "NEW JOURNEY", COLORS.GREEN);
}