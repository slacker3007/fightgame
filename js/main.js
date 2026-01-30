canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top;
    if (state === "menu" && userName.length > 0) { initPlayer(); startLevel(1); }
    else if (state === "camp") {
        if(mx > 450 && mx < 630 && my > 380 && my < 430) state = "inventory";
        if(mx > 650 && mx < 830 && my > 380 && my < 430) { currentLvl++; startLevel(currentLvl); }
    }
    else if (state === "inventory") {

        // Inside if (state === "inventory") block in main.js
        // Check if "X" button is clicked (875, 115, 30, 30)
        if (selectedInvItem && mx > 875 && mx < 905 && my > 115 && my < 145) {
            selectedInvItem = null;
            return; // Exit to prevent other inventory clicks from triggering
        }

        if(mx > 430 && mx < 580 && my > 530 && my < 570) { state = "camp"; selectedInvItem = null; }
        player.inventory.forEach((item, i) => {
            const x = 450 + (i % 5) * 90, y = 130 + Math.floor(i / 5) * 90;
            if (mx > x && mx < x + 80 && my > y && my < y + 80) selectedInvItem = item;
        });
        if (selectedInvItem && mx > 620 && mx < 770 && my > 450 && my < 495) {
            if (selectedInvItem.type === "weapon") player.weapon = (player.weapon === selectedInvItem) ? null : selectedInvItem;
            else player.armor = (player.armor === selectedInvItem) ? null : selectedInvItem;
            calcStats();
        }
        ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
            if(player.points > 0 && mx > 340 && mx < 362 && my > 178 + i*32 && my < 200 + i*32) {
                player[s]++; player.points--; calcStats();
            }
        });
    } else if (state === "combat" && !isProcessing) {
        for(let i=1; i<=5; i++) {
            const y = 150 + (i-1) * 75;
            if(mx > 310 && mx < 380 && my > y && my < y+70) {
                if(selBlk.includes(id = i.toString())) selBlk = selBlk.filter(z => z !== id);
                else if(selBlk.length < 2) selBlk.push(id);
            }
            if(mx > 580 && mx < 650 && my > y && my < y+70) selAtk = i.toString();
        }
        if(selAtk && selBlk.length === 2 && mx > 430 && mx < 530 && my > 495 && my < 540) resolveTurn();
    } else if (state === "gameover" || state === "victory") {
        if(mx > 380 && mx < 580 && my > 480 && my < 540) { state = "menu"; userName = ""; score = 0; currentLvl = 1; }
    }
});

window.addEventListener('keydown', e => {
    if(state === "menu") {
        if(e.key === "Enter" && userName.length > 0) { initPlayer(); startLevel(1); }
        else if(e.key === "Backspace") userName = userName.slice(0, -1);
        else if(userName.length < 12 && e.key.length === 1) userName += e.key;
    }
    if(e.key.toLowerCase() === 'i' && (state === "camp" || state === "inventory")) state = (state === "inventory" ? "camp" : "inventory");
});

function gameLoop() {
    ctx.save();
    if (shake > 0) { ctx.translate(Math.random()*shake - shake/2, Math.random()*shake - shake/2); shake *= 0.85; }
    ctx.fillStyle = COLORS.DARK_BG; ctx.fillRect(0, 0, 960, 650);
    pDisplayHp += (player.hp - pDisplayHp) * 0.1; eDisplayHp += (enemy.hp - eDisplayHp) * 0.1;

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