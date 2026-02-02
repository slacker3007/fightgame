/**
 * main.js - Event Handling & Game Loop
 */

let uiButtons = [];

/**
 * Helper to register a button for the current frame
 */
function createButton(x, y, w, h, stateReq, label, color, action) {
    uiButtons.push({ x, y, w, h, state: stateReq, label, color, action });
}

/**
 * Handle Mouse Clicks
 */
canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (960 / r.width);
    const my = (e.clientY - r.top) * (650 / r.height);

    // 1. Check UI Buttons first
    const clickedBtn = uiButtons.find(b => 
        state === b.state && mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h
    );
    if (clickedBtn) { 
        clickedBtn.action(); 
        return; 
    }

    // 2. State-specific manual click logic
    if (state === "menu" && userName.length > 0) { 
        initPlayer(); 
        currentLvl = 1; // Start at level 1
        startLevel(1); 
    }
    else if (state === "inventory") {
        // Close detail view
        if (selectedInvItem && mx > 875 && mx < 905 && my > 115 && my < 145) { 
            selectedInvItem = null; return; 
        }
        // Select item from grid
        player.inventory.forEach((item, i) => {
            const x = 450 + (i % 5) * 90, y = 130 + Math.floor(i / 5) * 90;
            if (mx > x && mx < x + 80 && my > y && my < y + 80) selectedInvItem = item;
        });
        // Allocate Stat Points
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
            const y = 150 + (i-1) * 75;
            // Select Defense Zones (Up to 2)
            if(mx > 310 && mx < 380 && my > y && my < y+70) {
                const id = i.toString();
                if(selBlk.includes(id)) selBlk = selBlk.filter(z => z !== id);
                else if(selBlk.length < 2) selBlk.push(id);
            }
            // Select Attack Zone (1)
            if(mx > 580 && mx < 650 && my > y && my < y+70) selAtk = i.toString();
        }
    }
});

/**
 * Update the list of active buttons based on game state
 */
function updateUIButtons() {
    uiButtons = [];
    
    // MAIN HUB
    if (state === "camp") {
        createButton(80, 250, 240, 180, "camp", "CHAMPION", COLORS.BTN_BLUE, () => state = "inventory");
        createButton(360, 250, 240, 180, "camp", "FORGE", "#5a32a8", () => state = "forge");
        
        // Progression Logic: Increment Level HERE to prevent being stuck in level 1
        createButton(640, 250, 240, 180, "camp", "BATTLE", COLORS.RED, () => {
            if (currentLvl < 10) { 
                currentLvl++; 
                startLevel(currentLvl); 
            } else {
                startLevel(10); // Final Boss
            }
        });
    }

    // THE FORGE
    if (state === "forge") {
        createButton(380, 380, 200, 60, "forge", "CRAFT (10 Scrap)", "#cc8400", () => {
            if (typeof craftItem === "function") craftItem();
        });
        createButton(405, 540, 150, 40, "forge", "BACK TO CAMP", COLORS.GRAY, () => state = "camp");
    }

    // CHAMPION / INVENTORY
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

    // COMBAT ACTION
    if (state === "combat" && selAtk && selBlk.length === 2 && !isProcessing) {
        createButton(430, 495, 100, 45, "combat", "FIGHT!", COLORS.RED, () => resolveTurn());
    }

    // END SCREENS
    if (state === "gameover" || state === "victory") {
        createButton(380, 480, 200, 60, state, "NEW JOURNEY", COLORS.BTN_BLUE, () => { 
            state = "menu"; userName = ""; score = 0; currentLvl = 1; 
        });
    }
}

/**
 * Handle Keyboard Input for Menu
 */
window.addEventListener('keydown', e => {
    if(state === "menu") {
        if(e.key === "Enter" && userName.length > 0) { 
            initPlayer(); 
            currentLvl = 1;
            startLevel(1); 
        }
        else if(e.key === "Backspace") userName = userName.slice(0, -1);
        else if(userName.length < 12 && e.key.length === 1) userName += e.key;
    }
});

/**
 * Core Game Loop
 */
function gameLoop() {
    ctx.save();
    
    // Screen Shake Effect
    if (shake > 0) { 
        ctx.translate(Math.random()*shake - shake/2, Math.random()*shake - shake/2); 
        shake *= 0.85; 
    }
    
    // Background
    ctx.fillStyle = COLORS.DARK_BG; 
    ctx.fillRect(0, 0, 960, 650);
    
    // Smooth Health Interpolation
    pDisplayHp += (player.hp - pDisplayHp) * 0.1; 
    eDisplayHp += (enemy.hp - eDisplayHp) * 0.1;
    
    updateUIButtons();
    
    // Render States
    if (state === "menu") drawMenu();
    else if (state === "camp") drawCamp();
    else if (state === "forge") drawForge();
    else if (state === "combat") drawCombat();
    else if (state === "inventory") drawInventory();
    else if (state === "gameover" || state === "victory") drawEnd();
    
    // HUD Overlays
    if (["combat", "inventory", "camp", "forge"].includes(state)) {
        drawProgressBar();
    }
    
    // Floating Text Particles
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

// Kickstart the game
gameLoop();