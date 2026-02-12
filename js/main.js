/**
 * main.js - Event Handling & Game Loop
 */

let uiButtons = [];

function createButton(x, y, w, h, stateReq, label, color, action) {
    uiButtons.push({ x, y, w, h, state: stateReq, label, color, action });
}

canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (960 / r.width);
    const my = (e.clientY - r.top) * (650 / r.height);

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
        // Video is now handled by the browser/CSS, but we can still trigger play
        if (typeof bgVideo !== 'undefined') bgVideo.play();
    }
    else if (state === "inventory") {
        if (selectedInvItem && mx > 875 && mx < 905 && my > 115 && my < 145) { 
            selectedInvItem = null; return;
        }
        player.inventory.forEach((item, i) => {
            const x = 450 + (i % 5) * 90, y = 130 + Math.floor(i / 5) * 90;
            if (mx > x && mx < x + 80 && my > y && my < y + 80) selectedInvItem = item;
        });
        ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
            if(player.points > 0 && mx > 340 && mx < 362 && my > 178 + i*32 && my < 200 + i*32) {
                player[s]++;
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
        createButton(80, 250, 240, 180, "camp", "CHAMPION", COLORS.BTN_BLUE, () => state = "inventory");
        createButton(360, 250, 240, 180, "camp", "FORGE", "#5a32a8", () => state = "forge");
        createButton(640, 250, 240, 180, "camp", "BATTLE", COLORS.RED, () => {
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
        });
        if (selectedInvItem) {
            const isEq = (player.weapon === selectedInvItem || player.armor === selectedInvItem);
            createButton(680, 440, 150, 45, "inventory", isEq ? "REMOVE" : "EQUIP", isEq ? COLORS.RED : COLORS.GREEN, () => {
                if (selectedInvItem.type === "weapon") player.weapon = (player.weapon === selectedInvItem) ? null : selectedInvItem;
                else player.armor = (player.armor === selectedInvItem) ? null : selectedInvItem;
                calcStats();
            });
        }
    }

    if (state === "combat" && selAtk && selBlk.length === 2 && !isProcessing) {
        createButton(430, 345, 100, 45, "combat", "FIGHT!", COLORS.RED, () => resolveTurn());
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
    
    // Screen Shake Logic
    if (shake > 0) { 
        ctx.translate(Math.random()*shake - shake/2, Math.random()*shake - shake/2);
        shake *= 0.85;
    }

    /**
     * OPTIMIZATION: 
     * We clear the canvas so it becomes transparent. 
     * The video is now handled by the <video> element in index.html.
     */
    ctx.clearRect(0, 0, 960, 650);

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
    
    ctx.globalAlpha = 1.0;
    ctx.restore();
    requestAnimationFrame(gameLoop);
}

gameLoop();