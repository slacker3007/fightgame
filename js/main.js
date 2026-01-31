// Add a global UI state to track dynamic buttons
let uiButtons = [];

function createButton(x, y, w, h, stateReq, action) {
    uiButtons.push({ x, y, w, h, state: stateReq, action });
}

canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    // Calculate mouse position relative to the internal 960x650 resolution
    const mx = (e.clientX - r.left) * (960 / r.width);
    const my = (e.clientY - r.top) * (650 / r.height);

    // 1. HANDLE DYNAMIC BUTTONS (Camp, Inventory, Menu, Victory)
    const clickedBtn = uiButtons.find(b => 
        state === b.state && mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h
    );
    if (clickedBtn) {
        clickedBtn.action();
        return;
    }

    // 2. STATE-SPECIFIC COMPLEX LOGIC (Preserving original logic)
    if (state === "menu" && userName.length > 0) { 
        initPlayer(); 
        startLevel(1); 
    }
    else if (state === "inventory") {
        // Inventory Detail Close Button (X)
        if (selectedInvItem && mx > 875 && mx < 905 && my > 115 && my < 145) {
            selectedInvItem = null;
            return;
        }

        // Item Selection in Grid
        player.inventory.forEach((item, i) => {
            const x = 450 + (i % 5) * 90, y = 130 + Math.floor(i / 5) * 90;
            if (mx > x && mx < x + 80 && my > y && my < y + 80) selectedInvItem = item;
        });

        // Stat Leveling Buttons
        ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
            if(player.points > 0 && mx > 340 && mx < 362 && my > 178 + i*32 && my < 200 + i*32) {
                player[s]++; 
                player.points--; 
                calcStats();
            }
        });
    } 
    else if (state === "combat" && !isProcessing) {
        // Combat Zone Logic
        for(let i=1; i<=5; i++) {
            const y = 150 + (i-1) * 75;
            // Defense Selection (Left side)
            if(mx > 310 && mx < 380 && my > y && my < y+70) {
                const id = i.toString();
                if(selBlk.includes(id)) selBlk = selBlk.filter(z => z !== id);
                else if(selBlk.length < 2) selBlk.push(id);
            }
            // Attack Selection (Right side)
            if(mx > 580 && mx < 650 && my > y && my < y+70) selAtk = i.toString();
        }
    }
});

// Helper to refresh buttons based on current state
function updateUIButtons() {
    uiButtons = [];
    if (state === "camp") {
        createButton(450, 380, 180, 50, "camp", () => state = "inventory");
        createButton(650, 380, 180, 50, "camp", () => { currentLvl++; startLevel(currentLvl); });
    }
    if (state === "inventory") {
        createButton(430, 530, 150, 40, "inventory", () => { state = "camp"; selectedInvItem = null; });
        if (selectedInvItem) {
            createButton(680, 440, 150, 45, "inventory", () => {
                if (selectedInvItem.type === "weapon") player.weapon = (player.weapon === selectedInvItem) ? null : selectedInvItem;
                else player.armor = (player.armor === selectedInvItem) ? null : selectedInvItem;
                calcStats();
            });
        }
    }
    if (state === "combat" && selAtk && selBlk.length === 2 && !isProcessing) {
        createButton(430, 495, 100, 45, "combat", () => resolveTurn());
    }
    if (state === "gameover" || state === "victory") {
        createButton(380, 480, 200, 60, state, () => { state = "menu"; userName = ""; score = 0; currentLvl = 1; });
    }
}

window.addEventListener('keydown', e => {
    if(state === "menu") {
        if(e.key === "Enter" && userName.length > 0) { initPlayer(); startLevel(1); }
        else if(e.key === "Backspace") userName = userName.slice(0, -1);
        else if(userName.length < 12 && e.key.length === 1) userName += e.key;
    }
    if(e.key.toLowerCase() === 'i' && (state === "camp" || state === "inventory")) {
        state = (state === "inventory" ? "camp" : "inventory");
    }
});

function gameLoop() {
    ctx.save();
    if (shake > 0) { 
        ctx.translate(Math.random()*shake - shake/2, Math.random()*shake - shake/2); 
        shake *= 0.85; 
    }
    ctx.fillStyle = COLORS.DARK_BG; 
    ctx.fillRect(0, 0, 960, 650);
    
    // Smooth HP animation
    pDisplayHp += (player.hp - pDisplayHp) * 0.1; 
    eDisplayHp += (enemy.hp - eDisplayHp) * 0.1;

    updateUIButtons(); // Refresh button hitboxes every frame

    if (state === "menu") drawMenu();
    else if (state === "camp") drawCamp();
    else if (state === "combat") drawCombat();
    else if (state === "inventory") drawInventory();
    else if (state === "gameover" || state === "victory") drawEnd();

    if (["combat", "inventory", "camp"].includes(state)) drawProgressBar();

    particles.forEach((p, i) => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.col; ctx.font = "bold 28px Arial"; ctx.textAlign = "center";
        ctx.fillText(p.txt, p.x, p.y); p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1.0; ctx.restore();
    requestAnimationFrame(gameLoop);
}
gameLoop();