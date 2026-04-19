let uiButtons = [];
let salvageConfirm = null;

function createButton(x, y, w, h, stateReq, label, color, action) {
    uiButtons.push({ x, y, w, h, state: stateReq, label, color, action });
}

const mobileInput = document.getElementById('mobileInput');

function getAccountAuthFormLayout() {
    return {
        nicknameBox: { x: 330, y: 250, w: 300, h: 50 },
        passwordBox: { x: 330, y: 335, w: 300, h: 50 }
    };
}

function focusMobileInputForAuth(field) {
    accountAuthActiveField = field === "password" ? "password" : "nickname";
    mobileInput.value = accountAuthActiveField === "password" ? accountAuthPasswordInput : accountAuthNicknameInput;
    mobileInput.focus();
}

function getMousePos(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - r.left) * (960 / r.width),
        y: (clientY - r.top) * (650 / r.height)
    };
}

function handleInteraction(e) {
    if (!isLoaded) return;
    if (e.type === 'touchstart') e.preventDefault(); // Prevent double-triggering and zoom

    AudioEngine.init();
    AudioEngine.startAmbience();

    const pos = getMousePos(e);
    const mx = pos.x;
    const my = pos.y;

    if (inventoryError) inventoryError = false;

    if (state === "camp" || state === "inventory" || state === "battle_select") {
        const H = getAccountHeaderLayout();
        if (mx > H.hit.x && mx < H.hit.x + H.hit.w && my > H.hit.y && my < H.hit.y + H.hit.h) {
            AudioEngine.playClick();
            accountProfileReturnState = state;
            accountProfileMode = "browse";
            changeState("account_profile");
            return;
        }
    }

    if (state === "account_register" || state === "account_login") {
        const form = getAccountAuthFormLayout();
        const inRect = (r) => mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h;
        if (inRect(form.nicknameBox)) {
            focusMobileInputForAuth("nickname");
        } else if (inRect(form.passwordBox)) {
            focusMobileInputForAuth("password");
        }
    }

    if (showBattleTip && state === "combat") {
        showBattleTip = false;
        localStorage.setItem('battleTipShown', 'true');
        return;
    }

    if (state === "combat" && showAutoplayTip) {
        const L = getAutoplayTipLayout();
        const inRect = (r) => mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h;
        if (inRect(L.gotIt)) {
            AudioEngine.playClick();
            showAutoplayTip = false;
            return;
        }
        if (inRect(L.neverAgain)) {
            AudioEngine.playClick();
            showAutoplayTip = false;
            localStorage.setItem(GAUNTLET_AUTOPLAY_TIP_DISMISSED_KEY, 'true');
            return;
        }
        const p = L.panel;
        if (mx < p.x || mx > p.x + p.w || my < p.y || my > p.y + p.h) {
            AudioEngine.playClick();
            showAutoplayTip = false;
            return;
        }
        return;
    }

    // Handle button clicks
    const clickedBtn = uiButtons.find(b =>
        state === b.state && mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h
    );
    if (clickedBtn) {
        AudioEngine.playClick();
        clickedBtn.action();
        return;
    }

    if (state === "account_nickname") {
        mobileInput.value = accountNicknameInput;
        mobileInput.focus();
    } else if (state === "inventory") {
        handleInventoryClick(mx, my);
    }
    else if (state === "combat" && !isProcessing) {
        handleCombatClick(mx, my);
    }
    
    // Global Mute Toggle (e.g., top right corner)
    if (mx > 910 && mx < 950 && my > 10 && my < 50) {
        AudioEngine.toggleMute();
    }
}

canvas.addEventListener('mousedown', handleInteraction);
canvas.addEventListener('touchstart', handleInteraction, { passive: false });

function handleAccountProfileMouseMove(e) {
    if (!isLoaded) return;
    if (state !== "account_profile") {
        accountRoadmapHover = null;
        return;
    }
    if (e && e.touches && e.touches.length) return;
    const pos = getMousePos(e);
    accountRoadmapHoverPt.x = pos.x;
    accountRoadmapHoverPt.y = pos.y;
    const L = getAccountProfileLayout();
    accountRoadmapHover = typeof hitTestAccountRoadmap === "function"
        ? hitTestAccountRoadmap(pos.x, pos.y, L)
        : null;
}

function handleAccountProfileMouseLeave() {
    accountRoadmapHover = null;
}

canvas.addEventListener("mousemove", e => {
    handleAccountProfileMouseMove(e);
    handleInventoryMouseMove(e);
});
canvas.addEventListener("mouseleave", () => {
    handleAccountProfileMouseLeave();
    handleInventoryMouseLeave();
});

window.addEventListener('keydown', (e) => {
    if (!devIdleStaEnabled || !isLoaded) return;
    const n = DEV_STA_IDLE_KEYS.length;
    if (e.key === '[') {
        devStaIdleOptionIndex = (devStaIdleOptionIndex - 1 + n) % n;
        e.preventDefault();
    } else if (e.key === ']') {
        devStaIdleOptionIndex = (devStaIdleOptionIndex + 1) % n;
        e.preventDefault();
    }
});

function prepareNewRunFromClassSelect() {
    AudioEngine.startAmbience();
    initPlayer(selectedChar);
    currentLvl = 1;
    combatAutoplayActive = false;
    combatAutoplaySpeed = 1;
    autoplayKickPending = false;
}

function performLogoutToAuth() {
    logoutLocalAccount();
    selectedChar = null;
    score = 0;
    currentLvl = 1;
    maxLvl = 1;
    selAtk = null;
    selBlk = [];
    isProcessing = false;
    combatAutoplayActive = false;
    combatAutoplaySpeed = 1;
    combatAutoplayCancelled = false;
    autoplayKickPending = false;
    bumpAutoplayCancel();
    accountAuthMessage = "";
    accountAuthNicknameInput = "";
    accountAuthPasswordInput = "";
    accountAuthActiveField = "nickname";
    mobileInput.blur();
    changeState("account_auth");
}

function continueFromAccountProfile() {
    if (accountProfileMode === "browse") return;
    changeState("char_select");
}

function handleInventoryClick(mx, my) {
    if (salvageConfirm) return;

    if (selectedInvItem && mx > 875 && mx < 905 && my > 115 && my < 145) {
        selectedInvItem = null; return;
    }

    const L = typeof getChampionScreenLayout === "function" ? getChampionScreenLayout() : {
        equipmentSlots: [],
        stats: {
            panel: { x: 0, y: 0, w: 0, h: 0 },
            rowStart: 0,
            rowStep: 44,
            rowWidth: 0,
            plusRelX: 0,
            equipmentLabelY: 0,
            equipmentGrid: { x: 0, y: 0, w: 0, h: 0, slotSize: 56, gap: 6 }
        },
        inventory: { gridX: 662, pad: 8, cell: 55, gap: 7, cols: 4, bodyTop: 132 }
    };

    for (const entry of L.equipmentSlots) {
        if (mx > entry.x && mx < entry.x + entry.w && my > entry.y && my < entry.y + entry.h) {
            const unlocked = entry.baseSlot || (typeof isAccountSlotUnlocked === "function" && isAccountSlotUnlocked(entry.slotId));
            if (unlocked) {
                selectedInvItem = player[entry.slotId];
                salvageConfirm = null;
            }
            break;
        }
    }

    const inv = L.inventory;
    const cellStride = inv.cell + inv.gap;
    for (let i = 0; i < 4; i++) {
        const x = inv.gridX + inv.pad + i * cellStride;
        const y = inv.bodyTop;
        if (mx > x && mx < x + inv.cell && my > y && my < y + inv.cell) {
            if (i < player.inventory.length) {
                selectedInvItem = player.inventory[i];
                salvageConfirm = null;
            } else {
                selectedInvItem = null;
                salvageConfirm = null;
            }
            break;
        }
    }
    for (let i = 4; i < player.inventory.length; i++) {
        const x = inv.gridX + inv.pad + (i % inv.cols) * cellStride;
        const y = inv.bodyTop + Math.floor(i / inv.cols) * cellStride;
        if (mx > x && mx < x + inv.cell && my > y && my < y + inv.cell) {
            selectedInvItem = player.inventory[i];
            salvageConfirm = null;
            break;
        }
    }

    const S = L.stats;
    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        const rowY = S.rowStart + i * S.rowStep;
        const btnX = S.panel.x + S.plusRelX;
        const btnY = rowY + 6;
        const maxVal = player.maxStats[s];
        if (player.points > 0 && player["base" + s] < maxVal && mx > btnX && mx < btnX + 30 && my > btnY && my < btnY + 30) {
            player["base" + s]++;
            player.points--;
            if (typeof maybeUnlockNextStatCapTier === "function") {
                maybeUnlockNextStatCapTier();
            }
            calcStats();
        }
    });
}

function handleInventoryMouseMove(e) {
    if (!isLoaded) return;
    if (state !== "inventory") {
        inventoryStatHover = null;
        return;
    }
    if (e && e.touches && e.touches.length) return;
    const pos = getMousePos(e);
    inventoryHoverPt.x = pos.x;
    inventoryHoverPt.y = pos.y;
    const prev = inventoryStatHover;
    inventoryStatHover = null;
    if (typeof getChampionScreenLayout !== "function") return;
    const L = getChampionScreenLayout();
    const S = L.stats;
    const mx = pos.x;
    const my = pos.y;
    ["STR", "DEX", "STA", "LUCK"].forEach((s, i) => {
        const rowY = S.rowStart + i * S.rowStep;
        if (mx >= S.panel.x + 2 && mx <= S.panel.x + 2 + S.rowWidth && my >= rowY && my <= rowY + 42) {
            inventoryStatHover = s;
        }
    });
    if (inventoryStatHover && inventoryStatHover !== prev) {
        for (let n = 0; n < 16; n++) {
            fxParticles.push({
                kind: "smoke",
                x: mx + (Math.random() - 0.5) * 36,
                y: my + (Math.random() - 0.5) * 14,
                vx: (Math.random() - 0.5) * 1.1,
                vy: -0.7 - Math.random() * 1.1,
                life: 0.5 + Math.random() * 0.35,
                size: 3 + Math.random() * 7,
                color: `rgba(110,105,98,${0.2 + Math.random() * 0.18})`
            });
        }
    }
}

function handleInventoryMouseLeave() {
    if (state === "inventory") inventoryStatHover = null;
}

function handleCombatClick(mx, my) {
    if (combatAutoplayActive && !combatAutoplayCancelled) {
        combatAutoplayCancelled = true;
        bumpAutoplayCancel();
    }
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
    if (state === "account_auth") {
        createButton(350, 320, 260, 50, "account_auth", "LOGIN", COLORS.BTN_BLUE, () => {
            accountAuthMessage = "";
            accountAuthNicknameInput = "";
            accountAuthPasswordInput = "";
            accountAuthActiveField = "nickname";
            mobileInput.blur();
            changeState("account_login");
        });
        createButton(350, 385, 260, 50, "account_auth", "REGISTER", COLORS.GREEN, () => {
            accountAuthMessage = "";
            accountAuthNicknameInput = "";
            accountAuthPasswordInput = "";
            accountAuthActiveField = "nickname";
            mobileInput.blur();
            changeState("account_register");
        });
    }
    if (state === "account_register") {
        createButton(260, 500, 170, 44, "account_register", "BACK", COLORS.GRAY, () => {
            accountAuthMessage = "";
            mobileInput.blur();
            changeState("account_auth");
        });
        createButton(500, 500, 200, 44, "account_register", accountAuthBusy ? "WORKING..." : "CREATE ACCOUNT", COLORS.GREEN, async () => {
            if (accountAuthBusy) return;
            accountAuthBusy = true;
            accountAuthMessage = "";
            const res = await registerLocalAccount(accountAuthNicknameInput, accountAuthPasswordInput);
            accountAuthBusy = false;
            if (!res.ok) {
                accountAuthMessage = res.error || "Could not register account.";
                return;
            }
            accountAuthNicknameInput = "";
            accountAuthPasswordInput = "";
            accountAuthMessage = "";
            mobileInput.blur();
            accountProfileMode = "gate";
            changeState("account_profile");
        });
    }
    if (state === "account_login") {
        createButton(260, 500, 170, 44, "account_login", "BACK", COLORS.GRAY, () => {
            accountAuthMessage = "";
            mobileInput.blur();
            changeState("account_auth");
        });
        createButton(520, 500, 160, 44, "account_login", accountAuthBusy ? "WORKING..." : "LOGIN", COLORS.BTN_BLUE, async () => {
            if (accountAuthBusy) return;
            accountAuthBusy = true;
            accountAuthMessage = "";
            const res = await loginLocalAccount(accountAuthNicknameInput, accountAuthPasswordInput);
            accountAuthBusy = false;
            if (!res.ok) {
                accountAuthMessage = res.error || "Login failed.";
                return;
            }
            accountAuthNicknameInput = "";
            accountAuthPasswordInput = "";
            accountAuthMessage = "";
            mobileInput.blur();
            accountProfileMode = "gate";
            changeState("account_profile");
        });
    }
    if (state === "account_nickname") {
        if (accountNicknameInput.length > 0) {
            createButton(380, 590, 200, 40, "account_nickname", "CONTINUE", COLORS.GREEN, () => {
                setAccountNickname(accountNicknameInput);
                mobileInput.blur();
                changeState("char_select");
            });
        }
    }
    if (state === "char_select") {
        const chars = ["STR", "DEX", "LUCK", "STA"];
        chars.forEach((c, i) => {
            const x = 50 + i * 225 + 20;
            const y = 150 + 340;
            createButton(x, y, 170, 40, "char_select", "SELECT", COLORS.BTN_BLUE, () => {
                selectedChar = c;
                prepareNewRunFromClassSelect();
                startLevel(1);
                if (typeof bgVideo !== 'undefined') bgVideo.play();
            });
        });
    }
    if (state === "account_profile") {
        if (accountProfileMode === "browse") {
            const accLayout = getAccountProfileLayout();
            createButton(accLayout.closeBtn.x, accLayout.closeBtn.y, accLayout.closeBtn.w, accLayout.closeBtn.h, "account_profile", "\u00D7", COLORS.GRAY, () => {
                changeState(accountProfileReturnState);
            });
            createButton(260, 590, 180, 40, "account_profile", "LOG OUT", COLORS.DIM_GRAY, () => {
                performLogoutToAuth();
            });
            if (getPortraitApiUrl()) {
                createButton(520, 590, 200, 40, "account_profile", "REGENERATE", COLORS.BTN_BLUE, () => regenerateAccountPortrait());
            }
        } else {
            createButton(300, 588, 360, 44, "account_profile", "CONTINUE TO GAME", COLORS.GREEN, () => continueFromAccountProfile());
            if (getPortraitApiUrl()) {
                createButton(40, 588, 200, 44, "account_profile", "REGENERATE", COLORS.BTN_BLUE, () => regenerateAccountPortrait());
            }
            createButton(680, 588, 160, 44, "account_profile", "LOG OUT", COLORS.DIM_GRAY, () => {
                performLogoutToAuth();
            });
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
            const craftStage = typeof getCurrentCraftStageProgress === "function" ? getCurrentCraftStageProgress() : 1;
            const hasCraftablePool = typeof getCraftableItemsForStage === "function"
                ? getCraftableItemsForStage(craftStage).length > 0
                : true;
            if (hasCraftablePool) {
                createButton(370, 120, 220, 220, "forge", "CRAFT", "#cc8400", () => craftItem());
            } else {
                createButton(370, 120, 220, 220, "forge", "CRAFT LOCKED", COLORS.DIM_GRAY, () => {
                    addLog(`No craftable types unlocked for stage ${craftStage}.`, COLORS.BLOOD_RED);
                    spawnText("FORGE LOCKED", 480, 325, COLORS.RED);
                });
            }
            createButton(350, 530, 225, 60, "forge", "BACK TO CAMP", COLORS.GRAY, () => changeState("camp"));
        }
    }
    if (state === "inventory") {
        createButton(367, 530, 225, 60, "inventory", "BACK TO CAMP", COLORS.GRAY, () => {
            changeState("camp");
            selectedInvItem = null;
            salvageConfirm = null;
        });

        if (selectedInvItem) {
            const isEq = typeof isItemEquippedAnywhere === "function" && isItemEquippedAnywhere(selectedInvItem);

            if (salvageConfirm) {
                createButton(650, 300, 100, 40, "inventory", "YES", COLORS.RED, () => salvageItem(selectedInvItem));
                createButton(770, 300, 100, 40, "inventory", "NO", COLORS.GRAY, () => salvageConfirm = null);
            } else {
                const canEquipExtra = typeof ACCOUNT_EQUIP_SLOT_IDS !== "undefined" && Array.isArray(ACCOUNT_EQUIP_SLOT_IDS)
                    && ACCOUNT_EQUIP_SLOT_IDS.includes(selectedInvItem.type)
                    && typeof isAccountSlotUnlocked === "function" && isAccountSlotUnlocked(selectedInvItem.type);
                const canEquipWeaponArmor = selectedInvItem.type === "weapon" || selectedInvItem.type === "armor";
                const showEquip = isEq || canEquipWeaponArmor || canEquipExtra;

                if (showEquip) {
                    createButton(680, 440, 150, 45, "inventory", isEq ? "REMOVE" : "EQUIP", isEq ? COLORS.RED : COLORS.GREEN, () => {
                        if (selectedInvItem.type === "weapon") {
                            player.weapon = (player.weapon === selectedInvItem) ? null : selectedInvItem;
                        } else if (selectedInvItem.type === "armor") {
                            player.armor = (player.armor === selectedInvItem) ? null : selectedInvItem;
                        } else if (canEquipExtra) {
                            const k = selectedInvItem.type;
                            player[k] = (player[k] === selectedInvItem) ? null : selectedInvItem;
                        }
                        calcStats();
                        const wasEquip = !isEq;
                        selectedInvItem = null;
                        if (wasEquip) {
                            AudioEngine.playEquipClank();
                            shake = 7;
                        }
                    });
                }

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
        const tierStart = getBattleSelectTierStart(maxLvl);
        for (let i = 1; i <= BOSSES_PER_TIER; i++) {
            const globalStage = tierStart + i;
            const row = Math.floor((i - 1) / 5);
            const col = (i - 1) % 5;
            const x = startX + col * slotW + 10;
            const y = startY + row * 150;

            if (globalStage === maxLvl) {
                const btn = {
                    x, y, w: slotW - 20, h: 120, state: "battle_select", label: "", color: "transparent",
                    action: () => startLevel(globalStage),
                    noDraw: true
                };
                uiButtons.push(btn);
            }
        }
    }
    if (state === "combat" && (maxLvl > 1 || accountLevel >= 2)) {
        const autoOn = combatAutoplayActive && !combatAutoplayCancelled;
        const sp = Math.max(1, Math.min(3, combatAutoplaySpeed));
        let autoLabel = "AUTO";
        let autoColor = COLORS.GRAY;
        if (autoOn) {
            if (sp === 1) {
                autoLabel = "AUTO 1x";
                autoColor = COLORS.GREEN;
            } else if (sp === 2) {
                autoLabel = "AUTO 2x";
                autoColor = COLORS.GOLD;
            } else {
                autoLabel = "AUTO 3x";
                autoColor = COLORS.GOLD;
            }
        }
        const combatCenterX = 410;
        const autoW = 140;
        const autoH = 64;
        const autoGap = 8;
        const combatActionColumnTopY = 180;
        const autoY = combatActionColumnTopY - autoGap - autoH;
        createButton(combatCenterX, autoY, autoW, autoH, "combat", autoLabel, autoColor, () => {
            if (!autoOn && isProcessing) return;
            if (!autoOn) {
                combatAutoplaySpeed = 1;
                combatAutoplayActive = true;
                combatAutoplayCancelled = false;
                bumpAutoplayCancel();
                autoplayKickPending = true;
            } else if (sp === 1) {
                combatAutoplaySpeed = 2;
            } else if (sp === 2) {
                combatAutoplaySpeed = 3;
            } else {
                combatAutoplayActive = false;
                combatAutoplayCancelled = true;
                bumpAutoplayCancel();
                autoplayKickPending = false;
            }
        });
    }
    if (state === "combat" && !isProcessing && selAtk && selBlk.length === 2) {
        const cancelAutoplayForManualTurn = () => {
            combatAutoplayCancelled = true;
            bumpAutoplayCancel();
        };
        if (player.fury >= player.maxFury) {
            createButton(410, 180, 140, 140, "combat", "REGULAR", COLORS.RED, () => {
                cancelAutoplayForManualTurn();
                resolveTurn();
            });
            createButton(410, 330, 140, 140, "combat", "GOD STRIKE", COLORS.GOLD, () => {
                cancelAutoplayForManualTurn();
                player.isGodStrike = true;
                resolveTurn();
            });
        } else {
            createButton(410, 240, 140, 140, "combat", "FIGHT!", COLORS.RED, () => {
                cancelAutoplayForManualTurn();
                resolveTurn();
            });
        }
    }
    
    if (state === "gameover" || state === "victory") {
        createButton(380, 480, 200, 60, state, "NEW JOURNEY", COLORS.BTN_BLUE, () => {
            changeState("char_select");
            userName = getAccountNickname();
            score = 0;
            currentLvl = 1;
            maxLvl = 1;
            combatAutoplayActive = false;
            combatAutoplaySpeed = 1;
            combatAutoplayCancelled = false;
            autoplayKickPending = false;
            bumpAutoplayCancel();
        });
    }
}

// Update hidden input when userName changes (e.g. from physical keyboard)
// and update userName when hidden input changes (e.g. from mobile keyboard)
mobileInput.addEventListener('input', () => {
    if (state === "account_nickname") {
        accountNicknameInput = mobileInput.value.slice(0, ACCOUNT_NICKNAME_MAX_LEN);
    } else if (state === "account_register" || state === "account_login") {
        if (accountAuthActiveField === "password") {
            accountAuthPasswordInput = mobileInput.value.slice(0, 24);
        } else {
            accountAuthNicknameInput = mobileInput.value.slice(0, ACCOUNT_NICKNAME_MAX_LEN);
        }
    }
});

window.addEventListener('keydown', e => {
    if (state === "account_register" || state === "account_login") {
        AudioEngine.init();
        if (e.key === "Tab") {
            accountAuthActiveField = accountAuthActiveField === "nickname" ? "password" : "nickname";
            mobileInput.value = accountAuthActiveField === "password" ? accountAuthPasswordInput : accountAuthNicknameInput;
            e.preventDefault();
            return;
        }
        if (e.key === "Enter") {
            const submitBtn = uiButtons.find(b =>
                b.state === state && (b.label === "CREATE ACCOUNT" || b.label === "LOGIN")
            );
            if (submitBtn) submitBtn.action();
            return;
        }
        if (document.activeElement === mobileInput) return;

        const isPassword = accountAuthActiveField === "password";
        const source = isPassword ? accountAuthPasswordInput : accountAuthNicknameInput;
        const maxLen = isPassword ? 24 : ACCOUNT_NICKNAME_MAX_LEN;
        let next = source;
        if (e.key === "Backspace") {
            next = source.slice(0, -1);
            e.preventDefault();
        } else if (e.key.length === 1 && source.length < maxLen) {
            next = source + e.key;
        } else {
            return;
        }
        if (isPassword) accountAuthPasswordInput = next;
        else accountAuthNicknameInput = next;
        mobileInput.value = next;
        return;
    }

    if (state === "account_nickname") {
        AudioEngine.init();
        if (e.key === "Enter" && accountNicknameInput.length > 0) {
            setAccountNickname(accountNicknameInput);
            mobileInput.blur();
            changeState("char_select");
            return;
        }
        if (document.activeElement === mobileInput) return;

        if (e.key === "Backspace") {
            accountNicknameInput = accountNicknameInput.slice(0, -1);
            mobileInput.value = accountNicknameInput;
        } else if (accountNicknameInput.length < ACCOUNT_NICKNAME_MAX_LEN && e.key.length === 1) {
            accountNicknameInput += e.key;
            mobileInput.value = accountNicknameInput;
        }
    }
});

function changeState(s) {
    if (state === s) return;
    if (state === "account_profile" && s !== "account_profile") {
        accountRoadmapHover = null;
    }
    if (state === "inventory" && s !== "inventory") {
        inventoryStatHover = null;
    }
    AudioEngine.playTransition();
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
            if (p.gravity) p.vy += p.gravity;
            if (p.friction) {
                p.vx *= p.friction;
                p.vy *= p.friction;
            }
            if (p.kind === "smoke") {
                p.vx *= 0.97;
                p.vy *= 0.98;
                p.life -= 0.018;
            } else {
                p.life -= 0.02;
            }
            if (p.life <= 0) fxParticles.splice(i, 1);
        }

        for (let i = combatFlashes.length - 1; i >= 0; i--) {
            combatFlashes[i].life -= 0.045;
            if (combatFlashes[i].life <= 0) combatFlashes.splice(i, 1);
        }
        combatVignette *= 0.94;
        if (combatVignette < 0.015) combatVignette = 0;

        pDisplayHp += (player.hp - pDisplayHp) * 0.1;
        eDisplayHp += (enemy.hp - eDisplayHp) * 0.1;
        updateUIButtons();

        if (autoplayKickPending && state === "combat" && !isTransitioning && combatAutoplayActive && !combatAutoplayCancelled) {
            autoplayKickPending = false;
            runCombatAutoplayTurn();
        }

        if (state === "account_nickname") drawAccountNickname();
        else if (state === "account_auth") drawAccountAuth();
        else if (state === "account_register") drawAccountRegister();
        else if (state === "account_login") drawAccountLogin();
        else if (state === "char_select") drawCharSelect();
        else if (state === "account_profile") drawAccountProfile();
        else if (state === "camp") drawCamp();
        else if (state === "forge") drawForge();
        else if (state === "combat") drawCombat();
        else if (state === "inventory") drawInventory();
        else if (state === "battle_select") drawBattleSelect();
        else if (state === "gameover" || state === "victory") drawEnd();
        drawFxParticles();
        drawMuteBtn();

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