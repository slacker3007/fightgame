let uiButtons = [];
let salvageConfirm = null;

function createButton(x, y, w, h, stateReq, label, color, action) {
    uiButtons.push({ x, y, w, h, state: stateReq, label, color, action });
}

canvas.addEventListener('mousedown', e => {
    if (!isLoaded) return; // Ignore clicks while loading
    
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (960 / r.width);
    const my = (e.clientY - r.top) * (650 / r.height);

    if (inventoryError) inventoryError = false;

    const clickedBtn = uiButtons.find(b => 
        state === b.state && mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h
    );
    if (clickedBtn) { 
        clickedBtn.action(); 
        return; 
    }

    if (state === "menu" && userName.length > 0) { 
        initPlayer();
        currentLvl = 1; 
        startLevel(1);
        if (typeof bgVideo !== 'undefined') bgVideo.play();
    }
    else if (state === "inventory") {
        if (salvageConfirm) return;

        if (selectedInvItem && mx > 875 && mx < 905 && my > 115 && my < 145) { 
            selectedInvItem = null; return;
        }
        
        const centerLine = 410; 
        if (mx > centerLine && mx < centerLine + 90 && my > 140 && my < 230) selectedInvItem = player.weapon;
        if (mx > centerLine + 100 && mx < centerLine + 190 && my > 140 && my < 230) selectedInvItem = player.armor;

        const gridX = 660;
        player.inventory.forEach((item, i) => {
            const x = gridX + 10 + (i % 4) * 62; 
            const y = 145 + Math.floor(i / 4) * 62;
            if (mx > x && mx < x + 55 && my > y && my < y + 55) {
                selectedInvItem = item;
                salvageConfirm = null;
            }
        });
        
        ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
            const buttonY = 315 + i * 40 - 20; 
            if(player.points > 0 && player["base" + s] < 20 && mx > centerLine + 220 && mx < centerLine + 246 && my > buttonY && my < buttonY + 26) {
                player["base" + s]++;
                player.points--;
                calcStats();
            }
        });
    } 
    else if (state === "combat" && !isProcessing) {
        for(let i=1; i<=5; i++) {
            const y = 140 + (i-1) * 65;
            if(mx > 320 && mx < 380 && my > y && my < y+60) {
                const id = i.toString();
                if(selBlk.includes(id)) selBlk = selBlk.filter(z => z !== id);
                else if(selBlk.length < 2) selBlk.push(id);
            }
            if(mx > 580 && mx < 640 && my > y && my < y+60) selAtk = i.toString();
        }
    }
});

function updateUIButtons() {
    uiButtons = [];
    if (state === "camp") {
        createButton(80, 250, 244, 256, "camp", "CHAMPION", COLORS.BTN_BLUE, () => state = "inventory");
        createButton(360, 250, 244, 256, "camp", "FORGE", "#5a32a8", () => state = "forge");
        createButton(640, 250, 244, 256, "camp", "BATTLE", COLORS.RED, () => {
            currentLvl++;
            if(currentLvl > 10) currentLvl = 10;
            startLevel(currentLvl);
        });
    }
    if (state === "forge") {
        createButton(380, 540, 200, 60, "forge", "TRANSMUTE (10)", "#cc8400", () => craftItem());
        createButton(20, 590, 120, 40, "forge", "BACK", COLORS.GRAY, () => state = "camp");
    }
    if (state === "inventory") {
        createButton(405, 540, 150, 40, "inventory", "BACK TO CAMP", COLORS.GRAY, () => { 
            state = "camp";
            selectedInvItem = null;
            salvageConfirm = null;
        });

        if (selectedInvItem) {
            const isEq = (player.weapon === selectedInvItem || player.armor === selectedInvItem);
            
            if (salvageConfirm) {
                createButton(650, 300, 100, 40, "inventory", "YES", COLORS.RED, () => salvageItem(selectedInvItem));
                createButton(770, 300, 100, 40, "inventory", "NO", COLORS.GRAY, () => salvageConfirm = null);
            } else {
                createButton(680, 440, 150, 45, "inventory", isEq ? "REMOVE" : "EQUIP", isEq ? COLORS.RED : COLORS.GREEN, () => {
                    if (selectedInvItem.type === "weapon") player.weapon = (player.weapon === selectedInvItem) ? null : selectedInvItem;
                    else player.armor = (player.armor === selectedInvItem) ? null : selectedInvItem;
                    calcStats();
                    selectedInvItem = null;
                });

                if (!isEq) {
                    createButton(680, 385, 150, 45, "inventory", "SALVAGE", "#964B00", () => {
                        if (selectedInvItem.rarity !== "COMMON") salvageConfirm = true;
                        else salvageItem(selectedInvItem);
                    });
                }
            }
        }
    }
    if (state === "combat" && selAtk && selBlk.length === 2 && !isProcessing) {
        createButton(400, 260, 160, 88, "combat", "FIGHT!", COLORS.RED, () => resolveTurn());
    }
    if (state === "gameover" || state === "victory") {
        createButton(380, 480, 200, 60, state, "NEW JOURNEY", COLORS.BTN_BLUE, () => { 
            state = "menu"; userName = ""; score = 0; currentLvl = 1;
        });
    }
}

window.addEventListener('keydown', e => {
    if(state === "menu") {
        if(e.key === "Enter" && userName.length > 0) { 
            initPlayer();
            currentLvl = 1;
            startLevel(1);
            if (typeof bgVideo !== 'undefined') bgVideo.play();
        }
        else if(e.key === "Backspace") userName = userName.slice(0, -1);
        else if(userName.length < 12 && e.key.length === 1) userName += e.key;
    }
});

function gameLoop() {
    ctx.save();
    if (shake > 0) { 
        ctx.translate(Math.random()*shake - shake/2, Math.random()*shake - shake/2);
        shake *= 0.85;
    }
    ctx.clearRect(0, 0, 960, 650);

    if (!isLoaded) {
        drawLoadingScreen();
    } else {
        pDisplayHp += (player.hp - pDisplayHp) * 0.1;
        eDisplayHp += (enemy.hp - eDisplayHp) * 0.1;
        updateUIButtons();
        if (state === "menu") drawMenu();
        else if (state === "camp") drawCamp();
        else if (state === "forge") drawForge();
        else if (state === "combat") drawCombat();
        else if (state === "inventory") drawInventory();
        else if (state === "gameover" || state === "victory") drawEnd();
        if (["combat", "inventory", "camp", "forge"].includes(state)) drawProgressBar();
        particles.forEach((p, i) => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.col;
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";
            ctx.fillText(p.txt, p.x, p.y);
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) particles.splice(i, 1);
        });
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    requestAnimationFrame(gameLoop);
}
gameLoop();