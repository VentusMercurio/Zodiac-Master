// gameLogic.js
// Contains the core rules and flow of the game.

function initializeGame() {
    alert("INITIALIZE GAME CALLED!"); // Keep user's alert
    console.log("--- initializeGame function started ---");
    statusArea.textContent = 'Generating deck...';
    playAgainButton.classList.add('hidden');
    clearHighlightsAndPopups();
    duelLogElement.innerHTML = ''; // Clear previous logs
    logEvent("New duel started!", true);
    console.log("Log cleared and 'New duel started' logged.");


    fullDeck = generateTarotDeck();
    console.log("generateTarotDeck CALLED. Deck length:", fullDeck.length);
    if (fullDeck.length !== 78) {
        console.error("Deck generation failed. Aborting.", fullDeck);
        statusArea.textContent = "Error: Deck generation failed.";
        return;
    }
    shuffleArray(fullDeck);
    console.log("Deck shuffled.");
    console.log("Full Deck Sample (First 10 with Zodiac & BP):", fullDeck.slice(0, 10).map(c => `${c.name} (${c.zodiacSign}, E:${c.elementSymbol}, BP:${c.currentBP}/${c.maxBP})`));


    playerHand = fullDeck.slice(0, 5);
    aiHand = fullDeck.slice(5, 10);
    gameBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    currentPlayer = PLAYER_ID;
    console.log("Hands dealt, board initialized, current player set.");

    statusArea.textContent = "Player's turn. Place a card!";
    logEvent("Player's turn.", true);
    console.log("Status and log updated for player's turn.");

    renderHand(playerHand, playerHandElement, PLAYER_ID);
    console.log("Player hand rendered.");
    renderHand(aiHand, aiHandElement, AI_ID); // Render AI hand (usually hidden or card backs)
    console.log("AI hand rendered.");
    renderBoard();
    console.log("Game board rendered.");

    disablePlayerHandInteractions(false); // Player's turn starts
    console.log("Player interactions enabled. --- initializeGame function finished ---");
}

async function placeCardOnBoard(card, handIndex, row, col, ownerId) {
    if (gameBoard[row][col]) return; // Cell already occupied

    // Ensure BP is initialized (it should be from generateTarotDeck)
    if (card.maxBP === undefined) card.maxBP = DEFAULT_MAX_BP;
    if (card.currentBP === undefined) card.currentBP = card.maxBP;

    gameBoard[row][col] = { card: card, owner: ownerId };
    let placerName = ownerId === PLAYER_ID ? 'Player' : 'AI';
    const placedMessage = `${placerName} placed ${card.name} ${ZODIAC_UNICODE[card.zodiacSign] || ''} (BP ${card.currentBP}/${card.maxBP}) at (${row},${col}).`;
    logEvent(placedMessage);


    if (ownerId === PLAYER_ID) {
        playerHand.splice(handIndex, 1);
    } else {
        aiHand.splice(handIndex, 1);
    }

    renderHand(playerHand, playerHandElement, PLAYER_ID);
    renderHand(aiHand, aiHandElement, AI_ID);
    renderBoard(); // Render board to show newly placed card *before* flips

    await resolveFlips(row, col, ownerId, card.name, placerName);

    if (isBoardFull() || (!canAnyPlayerMove() && (playerHand.length === 0 || aiHand.length === 0))) {
        endGame();
        return;
    }

    // Switch turns or let current player play again if opponent is out of cards
    if (ownerId === PLAYER_ID) {
        if (aiHand.length === 0 && playerHand.length > 0 && !isBoardFull()) {
            statusArea.textContent = "AI has no cards. Player's turn again.";
            logEvent("AI has no cards. Player's turn again.", true);
            disablePlayerHandInteractions(false); // Keep interactions enabled for player
            return; // Don't switch to AI
        }
        currentPlayer = AI_ID;
        statusArea.textContent = "AI's turn...";
        logEvent("AI's turn.", true);
        disablePlayerHandInteractions(true);
        setTimeout(aiTakeTurn, 1200 + Math.random() * 1200); // AI takes turn after a delay
    } else { // AI's turn ended
        if (playerHand.length === 0 && aiHand.length > 0 && !isBoardFull()) {
            statusArea.textContent = "Player has no cards. AI's turn again.";
            logEvent("Player has no cards. AI's turn again.", true);
            // AI will take another turn, no need to enable player interactions
            setTimeout(aiTakeTurn, 1200 + Math.random() * 1200);
            return; // Don't switch to Player
        }
        currentPlayer = PLAYER_ID;
        statusArea.textContent = "Player's turn.";
        logEvent("Player's turn.", true);
        disablePlayerHandInteractions(false);
    }
}

function canAnyPlayerMove() {
    const hasEmptyCells = gameBoard.flat().some(cell => cell === null);
    const playerCanMove = playerHand.length > 0 && hasEmptyCells;
    const aiCanMove = aiHand.length > 0 && hasEmptyCells;
    return playerCanMove || aiCanMove;
}


async function aiTakeTurn() {
    if (currentPlayer !== AI_ID || aiHand.length === 0 || isBoardFull()) {
        // If AI can't play but player might, switch back
        if (!isBoardFull() && playerHand.length > 0 && canAnyPlayerMove()) {
            statusArea.textContent = "AI cannot play. Player's turn.";
            logEvent("AI passes. Player's turn.", true);
            currentPlayer = PLAYER_ID;
            disablePlayerHandInteractions(false);
        } else {
            endGame(); // No one can play or board is full
        }
        return;
    }

    const cardToPlay = aiHand[0]; // Simple AI: play the first card
    const cardIndex = 0;

    const emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (!gameBoard[r][c]) {
                emptyCells.push({ r, c });
            }
        }
    }

    if (emptyCells.length > 0) {
        const targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]; // Play randomly
        await placeCardOnBoard(cardToPlay, cardIndex, targetCell.r, targetCell.c, AI_ID);
    } else {
        // This case should be caught by isBoardFull or canAnyPlayerMove earlier
        endGame();
    }
}

function getOppositeDirection(direction) {
    const opposites = { 'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW', 'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE' };
    return opposites[direction];
}

function getNeighborCoords(r, c, direction) {
    const deltas = { 'N': [-1, 0], 'NE': [-1, 1], 'E': [0, 1], 'SE': [1, 1], 'S': [1, 0], 'SW': [1, -1], 'W': [0, -1], 'NW': [-1, -1] };
    const [dr, dc] = deltas[direction];
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) return [nr, nc];
    return null;
}

function getElementalBonus(attackerSymbol, defenderSymbol) {
    if (attackerSymbol === 'X' || defenderSymbol === 'X') return 0; // Major Arcana neutral
    const advantage = { 'W': 'F', 'F': 'A', 'A': 'E', 'E': 'W' }; // Water > Fire > Air > Earth > Water
    if (advantage[attackerSymbol] === defenderSymbol) return 2; // Attacker has advantage
    // No explicit disadvantage penalty, just lack of bonus
    return 0;
}

async function resolveFlips(placedRow, placedCol, attackerOwnerId, originalCardName, placerName) {
    clearHighlightsAndPopups(); // Clear previous battle effects
    let cardsFlippedThisTurn = 0;
    let initialStatus = `${placerName} placed ${originalCardName} ${ZODIAC_UNICODE[gameBoard[placedRow][placedCol].card.zodiacSign]||''} (BP ${gameBoard[placedRow][placedCol].card.currentBP}/${gameBoard[placedRow][placedCol].card.maxBP}) at (${placedRow},${placedCol}).`;
    statusArea.innerHTML = initialStatus; // Use innerHTML for styled messages

    let cardsToProcessForFlip = [{ r: placedRow, c: placedCol }]; // Start with the newly placed card
    let alreadyCheckedInChain = new Set(); // To avoid infinite loops with back-and-forth flips in complex scenarios

    const EFFECT_DELAY = 800;
    const STAT_REVEAL_DELAY = 1500;
    const OUTCOME_DELAY = 1000;
    const FLIP_DELAY = 800;


    while (cardsToProcessForFlip.length > 0) {
        const currentAttackerPos = cardsToProcessForFlip.shift();
        const attackerKey = `${currentAttackerPos.r}-${currentAttackerPos.c}`;

        if (alreadyCheckedInChain.has(attackerKey)) continue; // Already processed this card in current chain
        alreadyCheckedInChain.add(attackerKey);

        const currentAttackerCellData = gameBoard[currentAttackerPos.r][currentAttackerPos.c];

        // Card might have been flipped by another in the same chain, or exhausted
        if (!currentAttackerCellData || currentAttackerCellData.owner !== attackerOwnerId || currentAttackerCellData.card.currentBP <= 0) {
             if (currentAttackerCellData && currentAttackerCellData.card.currentBP <= 0) {
                let exhaustedMsg = `${currentAttackerCellData.card.name} ${ZODIAC_UNICODE[currentAttackerCellData.card.zodiacSign]||''} is exhausted (BP: 0) and cannot attack.`;
                statusArea.innerHTML = initialStatus + '<br>' + exhaustedMsg;
                logEvent(exhaustedMsg);
                await delay(OUTCOME_DELAY);
            }
            continue;
        }


        const attackerCard = currentAttackerCellData.card;
        const attackerElement = gameBoardElement.querySelector(`.grid-cell[data-row='${currentAttackerPos.r}'][data-col='${currentAttackerPos.c}'] .card-on-board`);

        for (const direction of attackerCard.directions) {
            const neighborCoords = getNeighborCoords(currentAttackerPos.r, currentAttackerPos.c, direction);

            if (neighborCoords) {
                const [nr, nc] = neighborCoords;
                const defenderCellData = gameBoard[nr][nc];
                const defenderElement = gameBoardElement.querySelector(`.grid-cell[data-row='${nr}'][data-col='${nc}'] .card-on-board`);

                if (defenderCellData && defenderCellData.owner !== attackerOwnerId && attackerElement && defenderElement) {
                    // Potential battle
                    let currentBattleStatuses = [];
                    const defenderCard = defenderCellData.card;
                    const oppositeDirection = getOppositeDirection(direction);
                    let flipOccurs = false;
                    let battleHappened = false;
                    let battleDescription = "";

                    let attackerDisplayStatType = '', defenderDisplayStatType = '';
                    let elementalBonus = getElementalBonus(attackerCard.elementSymbol, defenderCard.elementSymbol);
                    let effectiveAttack = attackerCard.atk + elementalBonus;
                    let relevantDefense = 0;
                    let elementalBonusText = elementalBonus > 0 ? ` (+${elementalBonus} Elem)` : "";

                    // Determine attack type and relevant defense
                    if (attackerCard.elementSymbol === 'X') { // Major Arcana attacks weakest defense
                        attackerDisplayStatType = 'Arcane';
                        relevantDefense = Math.min(defenderCard.pDef, defenderCard.mDef);
                        defenderDisplayStatType = relevantDefense === defenderCard.pDef ? 'P.Def' : 'M.Def';
                    } else if (attackerCard.elementSymbol === 'F' || attackerCard.elementSymbol === 'A') { // Wands (Fire), Swords (Air) -> Physical
                        attackerDisplayStatType = 'P.Atk';
                        relevantDefense = defenderCard.pDef;
                        defenderDisplayStatType = 'P.Def';
                    } else { // Cups (Water), Pentacles (Earth) -> Magical
                        attackerDisplayStatType = 'M.Atk';
                        relevantDefense = defenderCard.mDef;
                        defenderDisplayStatType = 'M.Def';
                    }

                    attackerElement.classList.add('clash-attacker');
                    defenderElement.classList.add('clash-defender');
                    let engageMsg = `Engaging: ${attackerCard.name} ${ZODIAC_UNICODE[attackerCard.zodiacSign]||''} vs ${defenderCard.name} ${ZODIAC_UNICODE[defenderCard.zodiacSign]||''}`;
                    currentBattleStatuses.push(engageMsg);
                    statusArea.innerHTML = initialStatus + '<br>' + currentBattleStatuses.join('<br>');
                    logEvent(engageMsg);
                    await delay(EFFECT_DELAY);

                    createStatPopup(`${attackerDisplayStatType}: ${effectiveAttack}${elementalBonusText}`, attackerElement, 'attacker');
                    createStatPopup(`${defenderDisplayStatType}: ${relevantDefense}`, defenderElement, 'defender');
                    await delay(STAT_REVEAL_DELAY);


                    if (defenderCard.directions.includes(oppositeDirection)) { // Defender can fight back
                        battleHappened = true;
                        if (effectiveAttack > relevantDefense) {
                            flipOccurs = true;
                            battleDescription = `<span class="battle-win">beats</span>`;
                            attackerElement.classList.add('clash-winner');
                            defenderElement.classList.add('clash-loser', 'hit-spark');
                        } else {
                            battleDescription = `<span class="battle-lose">fails vs</span>`;
                            attackerElement.classList.add('clash-loser');
                            defenderElement.classList.add('clash-winner', 'block-shield');
                        }
                        let clashMessage = `${attackerCard.name} ${ZODIAC_UNICODE[attackerCard.zodiacSign]||''} (${attackerDisplayStatType} ${effectiveAttack}${elementalBonusText}) ${battleDescription} ${defenderCard.name} ${ZODIAC_UNICODE[defenderCard.zodiacSign]||''} (${defenderDisplayStatType} ${relevantDefense})!`;
                        currentBattleStatuses.push(clashMessage);
                        statusArea.innerHTML = initialStatus + '<br>' + currentBattleStatuses.join('<br>');
                        logEvent(clashMessage);
                    } else { // Defender is flanked
                        battleHappened = true;
                        flipOccurs = true;
                        battleDescription = `is <span class="battle-flank">flanked</span> by`;
                        let flankMessage = `${defenderCard.name} ${ZODIAC_UNICODE[defenderCard.zodiacSign]||''} ${battleDescription} ${attackerCard.name} ${ZODIAC_UNICODE[attackerCard.zodiacSign]||''} ! (Auto-flip)`;
                        currentBattleStatuses.push(flankMessage);
                        statusArea.innerHTML = initialStatus + '<br>' + currentBattleStatuses.join('<br>');
                        logEvent(flankMessage);
                        attackerElement.classList.add('clash-winner'); // Attacker wins flank
                        defenderElement.classList.add('hit-spark'); // Defender gets hit
                    }

                    if (battleHappened) await delay(OUTCOME_DELAY);
                    activeStatPopups.forEach(p => p.remove()); // Clear stat popups after showing outcome
                    activeStatPopups = [];

                    if (flipOccurs) {
                        attackerCard.currentBP = Math.max(0, attackerCard.currentBP - 1); // Attacker loses 1 BP for attacking
                        logEvent(`${attackerCard.name} ${ZODIAC_UNICODE[attackerCard.zodiacSign]||''} BP reduced to ${attackerCard.currentBP}.`);

                        gameBoard[nr][nc].owner = attackerOwnerId; // Flip ownership
                        defenderCard.currentBP = BP_ON_FLIP; // Reset BP for newly flipped card
                        logEvent(`${defenderCard.name} ${ZODIAC_UNICODE[defenderCard.zodiacSign]||''} BP reset to ${defenderCard.currentBP} for new owner.`);

                        cardsFlippedThisTurn++;
                        cardsToProcessForFlip.push({ r: nr, c: nc }); // Add newly flipped card to queue for its own attacks

                        let flipMsg = `${defenderCard.name} ${ZODIAC_UNICODE[defenderCard.zodiacSign]||''} flipped to ${attackerOwnerId}'s side!`;
                        currentBattleStatuses.push(flipMsg);
                        statusArea.innerHTML = initialStatus + '<br>' + currentBattleStatuses.join('<br>');
                        logEvent(flipMsg);

                        // Re-render hands (for BP updates) and board (for visual flip)
                        renderHand(playerHand, playerHandElement, PLAYER_ID);
                        renderHand(aiHand, aiHandElement, AI_ID);
                        renderBoard();
                        await delay(FLIP_DELAY);
                    }
                    // Remove clash-specific classes before next interaction or end of loop
                    attackerElement.classList.remove('clash-attacker', 'clash-winner', 'clash-loser', 'hit-spark', 'block-shield');
                    defenderElement.classList.remove('clash-defender', 'clash-winner', 'clash-loser', 'hit-spark', 'block-shield');
                }
            }
        }
        if (attackerElement) attackerElement.classList.remove('clash-attacker', 'clash-winner', 'clash-loser', 'hit-spark', 'block-shield'); // Final cleanup for attacker
    }
    if (cardsFlippedThisTurn > 0) console.log(`Total cards flipped in chain: ${cardsFlippedThisTurn}`);
    clearHighlightsAndPopups(); // Final cleanup of any lingering highlights
    renderBoard(); // Ensure board is in final state for this turn's flips
    statusArea.innerHTML = initialStatus + (statusArea.innerHTML.includes('<br>') ? statusArea.innerHTML.substring(statusArea.innerHTML.indexOf('<br>')) : (cardsFlippedThisTurn > 0 ? "<br>Chain resolved." : "<br>No further flips."));
}


function isBoardFull() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (gameBoard[r][c] === null) return false;
        }
    }
    return true;
}

function countScores() {
    let playerScore = 0;
    let aiScore = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (gameBoard[r][c]) {
                gameBoard[r][c].owner === PLAYER_ID ? playerScore++ : aiScore++;
            }
        }
    }
    return { playerScore, aiScore };
}

function endGame() {
    clearHighlightsAndPopups();
    const scores = countScores();
    let message = `Game Over! Player: ${scores.playerScore}, AI: ${scores.aiScore}. `;
    if (scores.playerScore > scores.aiScore) message += "Player wins!";
    else if (scores.aiScore > scores.playerScore) message += "AI wins!";
    else message += "It's a draw!";

    statusArea.textContent = message;
    logEvent(message, true);
    disablePlayerHandInteractions(true); // Disable all interactions
    playAgainButton.classList.remove('hidden');
}