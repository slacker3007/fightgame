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

    if (state === "char_select") {
        // Handled by uiButtons
    }
    else if (state === "name_menu") {
        // Handled by uiButtons (Start Game / Back)
    }
    else if (state === "inventory") {
        handleInventoryClick(mx, my);
    }
    else if (state === "combat" && !isProcessing) {
        handleCombatClick(mx, my);
    }
});

function startGame() {
    initPlayer(selectedChar);
    currentLvl = 1;
    startLevel(1);
    if (typeof bgVideo !== 'undefined') bgVideo.play();
}

function handleInventoryClick(mx, my) {
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
        if (player.points > 0 && player["base" + s] < 20 && mx > centerLine + 220 && mx < centerLine + 246 && my > buttonY && my < buttonY + 26) {
            player["base" + s]++;
            player.points--;
            calcStats();
        }
    });
}

function handleCombatClick(mx, my) {
    for (let i = 1; i <= 5; i++) {
        const y = 140 + (i - 1) * 65;
        if (mx > 320 && mx < 380 && my > y && my < y + 60) {
            const id = i.toString();
            if (selBlk.includes(id)) selBlk = selBlk.filter(z => z !== id);
            else if (selBlk.length < 2) selBlk.push(id);
        }
        if (mx > 580 && mx < 640 && my > y && my < y + 60) selAtk = i.toString();
    }
}

function updateUIButtons() {
    uiButtons = [];
    if (state === "char_select") {
        const chars = ["STR", "DEX", "LUCK", "STA"];
        chars.forEach((c, i) => {
            const x = 50 + i * 225 + 20;
            const y = 150 + 340;
            createButton(x, y, 170, 40, "char_select", "SELECT", COLORS.BTN_BLUE, () => {
                selectedChar = c;
                changeState("name_menu");
            });
        });
    }
    if (state === "name_menu") {
        createButton(20, 590, 120, 40, "name_menu", "BACK", COLORS.GRAY, () => changeState("char_select"));
        if (userName.length > 0) {
            createButton(400, 590, 160, 40, "name_menu", "START GAME", COLORS.GREEN, () => startGame());
        }
    }
    if (state === "camp") {
        createButton(29, 150, 281, 297, "camp", "CHAMPION", COLORS.BTN_BLUE, () => changeState("inventory"));
        createButton(340, 150, 281, 297, "camp", "FORGE", "#5a32a8", () => changeState("forge"));
        createButton(651, 150, 281, 297, "camp", "BATTLE", COLORS.RED, () => {
            changeState("battle_select");
        });
    }
    if (state === "forge") {
        if (craftingAnimTimer > 0) {
            // No buttons during animation
        } else if (craftedItem) {
            createButton(300, 500, 160, 50, "forge", "KEEP", COLORS.GREEN, () => resolveCrafting(true));
            createButton(500, 500, 160, 50, "forge", "SALVAGE", COLORS.RED, () => resolveCrafting(false));
        } else {
            createButton(320, 390, 320, 218, "forge", "CRAFT", "#cc8400", () => craftItem());
            createButton(20, 590, 120, 40, "forge", "BACK", COLORS.GRAY, () => changeState("camp"));
        }
    }
    if (state === "inventory") {
        createButton(405, 540, 150, 40, "inventory", "BACK TO CAMP", COLORS.GRAY, () => {
            changeState("camp");
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
    if (state === "battle_select") {
        createButton(405, 590, 150, 40, "battle_select", "BACK", COLORS.GRAY, () => changeState("camp"));

        const barWidth = 700, startX = (canvas.width - barWidth) / 2, startY = 150, slotW = barWidth / 5;
        for (let i = 1; i <= 10; i++) {
            const row = Math.floor((i - 1) / 5);
            const col = (i - 1) % 5;
            const x = startX + col * slotW + 10;
            const y = startY + row * 150;

            if (i === maxLvl) {
                const btn = { x, y, w: slotW - 20, h: 120, state: "battle_select", label: "", color: "transparent", action: () => startLevel(i), noDraw: true };
                uiButtons.push(btn);
            }
        }
    }
    if (state === "combat" && selAtk && selBlk.length === 2 && !isProcessing) {
        createButton(400, 260, 160, 88, "combat", "FIGHT!", COLORS.RED, () => resolveTurn());

        if (player.fury >= player.maxFury) {
            createButton(400, 360, 160, 40, "combat", "GOD STRIKE", COLORS.GOLD, () => {
                player.isGodStrike = true;
                resolveTurn();
            });
        }
    }
    if (state === "gameover" || state === "victory") {
        createButton(380, 480, 200, 60, state, "NEW JOURNEY", COLORS.BTN_BLUE, () => {
            changeState("char_select"); userName = ""; score = 0; currentLvl = 1; maxLvl = 1;
        });
    }
}

window.addEventListener('keydown', e => {
    if (state === "name_menu") {
        if (e.key === "Enter" && userName.length > 0) {
            startGame();
        }
        else if (e.key === "Backspace") userName = userName.slice(0, -1);
        else if (userName.length < 12 && e.key.length === 1) userName += e.key;
    }
});

function changeState(s) {
    if (state === s) return;
    isTransitioning = true;
    nextState = s;
    transitionAlpha = 0;
}

function gameLoop() {
    ctx.save();
    if (shake > 0) {
        ctx.translate(Math.random() * shake - shake / 2, Math.random() * shake - shake / 2);
        shake *= 0.85;
    }
    ctx.clearRect(0, 0, 960, 650);

    if (!isLoaded) {
        drawLoadingScreen();
    } else {
        if (isTransitioning) {
            transitionAlpha += 0.05;
            if (transitionAlpha >= 1) {
                state = nextState;
                isTransitioning = false;
                transitionAlpha = 1; // Start fading back out
            }
        } else if (transitionAlpha > 0) {
            transitionAlpha -= 0.05;
        }

        if (craftingAnimTimer > 0) {
            // ... (keep crafting logic)
            craftingAnimTimer--;
            shake = 3;
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 120 + Math.random() * 50;
                fxParticles.push({
                    x: 480 + Math.cos(angle) * dist,
                    y: 300 + Math.sin(angle) * dist,
                    vx: -Math.cos(angle) * 12,
                    vy: -Math.sin(angle) * 12,
                    life: 0.5,
                    color: Math.random() > 0.5 ? COLORS.GOLD : COLORS.WHITE,
                    size: Math.random() * 3 + 1
                });
            }
            if (craftingAnimTimer === 0) {
                craftedItem = pendingCraftedItem;
                const rColor = COLORS[`RARITY_${craftedItem.rarity}`];
                for (let i = 0; i < 80; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 15 + 2;
                    fxParticles.push({
                        x: 480, y: 300,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.0 + Math.random(),
                        color: rColor,
                        size: Math.random() * 5 + 2
                    });
                }
                pendingCraftedItem = null;
                shake = 20;
            }
        }

        // Update FX Particles
        for (let i = fxParticles.length - 1; i >= 0; i--) {
            let p = fxParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) fxParticles.splice(i, 1);
        }

        pDisplayHp += (player.hp - pDisplayHp) * 0.1;
        eDisplayHp += (enemy.hp - eDisplayHp) * 0.1;
        updateUIButtons();

        if (state === "char_select") drawCharSelect();
        else if (state === "name_menu") drawMenu();
        else if (state === "camp") drawCamp();
        else if (state === "forge") drawForge();
        else if (state === "combat") drawCombat();
        else if (state === "inventory") drawInventory();
        else if (state === "battle_select") drawBattleSelect();
        else if (state === "gameover" || state === "victory") drawEnd();
        drawFxParticles();

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

        // Draw Transition Overlay
        if (transitionAlpha > 0) {
            ctx.globalAlpha = transitionAlpha;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 960, 650);
            ctx.globalAlpha = 1.0;
        }
    }
    ctx.restore();
    requestAnimationFrame(gameLoop);
}
gameLoop();