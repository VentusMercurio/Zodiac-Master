document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Constants ---
    const splashScreen = document.getElementById('splash-screen');
    const gameScreen = document.getElementById('game-screen');
    const duelButton = document.getElementById('duel-button');
    const gameBoardElement = document.getElementById('game-board');
    const playerHandElement = document.getElementById('player-hand');
    const aiHandElement = document.getElementById('ai-hand');
    const statusArea = document.getElementById('status-area');
    const playAgainButton = document.getElementById('play-again-button');

    // --- Game Constants ---
    const SUITS = { WANDS: 'Wands', CUPS: 'Cups', SWORDS: 'Swords', PENTACLES: 'Pentacles', MAJOR: 'Major Arcana' };
    const CARD_TYPES = { PIP: 'Pip', COURT: 'Court', MAJOR: 'Major' };
    const PIP_RANKS = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const COURT_RANKS = ['Page', 'Knight', 'Queen', 'King'];
    const MAJOR_ARCANA = [
        'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
        'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
        'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
        'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
        'Judgement', 'The World'
    ];
    const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const PLAYER_ID = 'player';
    const AI_ID = 'ai';
    const GRID_SIZE = 4;
    const ELEMENT_SYMBOLS = { WANDS: 'F', CUPS: 'W', SWORDS: 'A', PENTACLES: 'E', MAJOR: 'X' };
    const MIN_MAJOR_STAT = 3;
    const MAX_MAJOR_STAT = 9;
    const STAT_VARIANCE = 1;

    // --- Game State Variables ---
    let fullDeck = [];
    let playerHand = [];
    let aiHand = [];
    let gameBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    let draggedCardData = null;
    let currentPlayer = PLAYER_ID;
    let activeStatPopups = []; // To keep track of dynamically created popups

    // --- Utility Functions ---
    function getRandomInt(min, max) { /* ... (no change) ... */
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function shuffleArray(array) { /* ... (no change) ... */
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // --- Card Data Functions ---
    function getCardTypeAndRank(name, suit) { /* ... (no change) ... */
        if (suit === SUITS.MAJOR) {
            return { type: CARD_TYPES.MAJOR, rank: name, numericRank: MAJOR_ARCANA.indexOf(name) };
        }
        const parts = name.split(' of ');
        const rank = parts[0];
        if (COURT_RANKS.includes(rank)) {
            return { type: CARD_TYPES.COURT, rank: rank, numericRank: COURT_RANKS.indexOf(rank) + 11 };
        }
        if (PIP_RANKS.includes(rank)) {
            return { type: CARD_TYPES.PIP, rank: rank, numericRank: rank === 'Ace' ? 1 : parseInt(rank) };
        }
        return { type: 'Unknown', rank: 'Unknown', numericRank: -1 };
    }
    function calculateStats(cardInfo) { /* ... (no change from previous version with weighted majors) ... */
        let atk, pDef, mDef;
        const { type, numericRank, suit } = cardInfo;
        const elementSymbol = ELEMENT_SYMBOLS[suit] || 'X';

        if (type === CARD_TYPES.MAJOR) {
            const rankFraction = numericRank / (MAJOR_ARCANA.length - 1);
            const statRange = MAX_MAJOR_STAT - MIN_MAJOR_STAT;
            const calculateWeightedStat = () => {
                const baseValue = MIN_MAJOR_STAT + (rankFraction * statRange);
                const randomOffset = getRandomInt(-STAT_VARIANCE, STAT_VARIANCE);
                const calculatedStat = Math.round(baseValue) + randomOffset;
                return Math.max(MIN_MAJOR_STAT, Math.min(MAX_MAJOR_STAT, calculatedStat));
            };
            atk = calculateWeightedStat();
            pDef = calculateWeightedStat();
            mDef = calculateWeightedStat();
        } else if (type === CARD_TYPES.COURT) {
            atk = getRandomInt(4, 7); pDef = getRandomInt(4, 7); mDef = getRandomInt(4, 7);
        } else if (type === CARD_TYPES.PIP) {
            if (numericRank >= 2 && numericRank <= 5) {
                atk = getRandomInt(1, 4); pDef = getRandomInt(1, 4); mDef = getRandomInt(1, 4);
            } else {
                atk = getRandomInt(3, 6); pDef = getRandomInt(3, 6); mDef = getRandomInt(3, 6);
            }
        } else { atk = pDef = mDef = 1; }
        return { atk, pDef, mDef, elementSymbol };
    }
    function assignRandomDirections() { /* ... (no change) ... */
        const numDirections = getRandomInt(2, 6);
        const availableDirections = [...DIRECTIONS];
        shuffleArray(availableDirections);
        return availableDirections.slice(0, numDirections).sort();
    }
    function generateTarotDeck() { /* ... (no change from previous version with Fool override) ... */
        const deck = [];
        for (const suit of [SUITS.WANDS, SUITS.CUPS, SUITS.SWORDS, SUITS.PENTACLES]) {
            for (const rank of PIP_RANKS) {
                const name = `${rank} of ${suit}`;
                const cardInfo = { name, suit, ...getCardTypeAndRank(name, suit) };
                const stats = calculateStats(cardInfo);
                const directions = assignRandomDirections();
                deck.push({ ...cardInfo, ...stats, directions });
            }
            for (const rank of COURT_RANKS) {
                const name = `${rank} of ${suit}`;
                const cardInfo = { name, suit, ...getCardTypeAndRank(name, suit) };
                const stats = calculateStats(cardInfo);
                const directions = assignRandomDirections();
                deck.push({ ...cardInfo, ...stats, directions });
            }
        }
        for (const name of MAJOR_ARCANA) {
             const cardInfo = { name, suit: SUITS.MAJOR, ...getCardTypeAndRank(name, SUITS.MAJOR) };
             let stats = calculateStats(cardInfo);
             let directions = assignRandomDirections();
             if (name === 'The Fool') {
                 stats = { atk: MAX_MAJOR_STAT, pDef: MAX_MAJOR_STAT, mDef: MAX_MAJOR_STAT, elementSymbol: 'X' };
                 directions = [...DIRECTIONS];
             }
             deck.push({ ...cardInfo, ...stats, directions });
        }
        return deck;
    }

    // --- Rendering Functions ---
    function getArrowSymbol(direction) { /* ... (no change) ... */
        const symbols = { 'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘', 'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖' };
        return symbols[direction] || '';
    }
    function renderCard(card, ownerId, onBoard = false) { /* ... (no change) ... */
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        if (ownerId === PLAYER_ID) cardElement.classList.add('player-card-visual');
        else if (ownerId === AI_ID) cardElement.classList.add('ai-card-visual');

        const arrowContainer = document.createElement('div');
        arrowContainer.classList.add('arrow-container');
        card.directions.forEach(dir => {
            const arrowEl = document.createElement('div');
            arrowEl.classList.add('arrow', `arrow-${dir.toLowerCase()}`);
            arrowEl.textContent = getArrowSymbol(dir);
            arrowContainer.appendChild(arrowEl);
        });

        if (onBoard) {
            cardElement.classList.add('card-on-board');
            cardElement.innerHTML = `
                <div class="name">${card.name.substring(0, 15)}${card.name.length > 15 ? '...' : ''}</div>
                <div class="stats-condensed">
                    ${card.atk}${card.elementSymbol}${card.pDef}${card.mDef}
                </div>
            `;
            cardElement.appendChild(arrowContainer);
        } else {
            cardElement.classList.add('card-in-hand');
            cardElement.innerHTML = `
                <div class="name">${card.name}</div>
                <div class="stats">
                    <span class="atk">Atk: ${card.atk}</span>
                    <span class="elem">Elem: ${card.elementSymbol}</span>
                    <span class="pdef">PDef: ${card.pDef}</span>
                    <span class="mdef">MDef: ${card.mDef}</span>
                </div>
            `;
            cardElement.appendChild(arrowContainer);
        }
        return cardElement;
    }
    function renderHand(hand, element, ownerId) { /* ... (no change) ... */
        element.innerHTML = '';
        hand.forEach((card, index) => {
            const cardElement = renderCard(card, ownerId, false);
            if (ownerId === PLAYER_ID) {
                cardElement.dataset.cardIndex = index;
            }
            element.appendChild(cardElement);
        });
        if (ownerId === PLAYER_ID) {
            disablePlayerHandInteractions(currentPlayer !== PLAYER_ID);
        }
    }
    function renderBoard() { /* ... (no change) ... */
        gameBoardElement.innerHTML = '';
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                const cellData = gameBoard[r][c];
                if (cellData) {
                    const cardElement = renderCard(cellData.card, cellData.owner, true);
                    cell.appendChild(cardElement);
                } else if (currentPlayer === PLAYER_ID) {
                    cell.addEventListener('dragover', handleDragOver);
                    cell.addEventListener('drop', handleDrop);
                }
                gameBoardElement.appendChild(cell);
            }
        }
    }

    // --- Interaction Logic ---
    function disablePlayerHandInteractions(disable) { /* ... (no change) ... */
        const playerCards = playerHandElement.querySelectorAll('.card');
        playerCards.forEach(cardElement => {
            cardElement.draggable = !disable;
            cardElement.classList.toggle('disabled', disable);
        });
        gameBoardElement.querySelectorAll('.grid-cell').forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && !gameBoard[r][c]) {
                cell.removeEventListener('dragover', handleDragOver);
                cell.removeEventListener('drop', handleDrop);
                if (!disable) {
                    cell.addEventListener('dragover', handleDragOver);
                    cell.addEventListener('drop', handleDrop);
                }
            }
        });
    }
    function clearHighlightsAndPopups() {
        document.querySelectorAll('.card-on-board.clash-attacker, .card-on-board.clash-defender, .card-on-board.clash-winner, .card-on-board.clash-loser, .card-on-board.hit-spark, .card-on-board.block-shield').forEach(el => {
            el.className = el.className.replace(/\bclash-\w+\b/g, '').replace(/\bhit-spark\b/g, '').replace(/\bblock-shield\b/g, '').trim();
        });
        activeStatPopups.forEach(popup => popup.remove());
        activeStatPopups = [];
    }

    // --- Game Flow & Turn Logic ---
    function initializeGame() { /* ... (no change, but calls clearHighlightsAndPopups) ... */
        statusArea.textContent = 'Generating deck...';
        playAgainButton.classList.add('hidden');
        clearHighlightsAndPopups();

        fullDeck = generateTarotDeck();
        shuffleArray(fullDeck);
        console.log("Deck Sample (First 5):", fullDeck.slice(0,5).map(c => `${c.name} (ATK:${c.atk}, E:${c.elementSymbol}, PD:${c.pDef}, MD:${c.mDef})`));


        playerHand = fullDeck.slice(0, 5);
        aiHand = fullDeck.slice(5, 10);
        gameBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        currentPlayer = PLAYER_ID;

        statusArea.textContent = "Player's turn. Place a card!";

        renderHand(playerHand, playerHandElement, PLAYER_ID);
        renderHand(aiHand, aiHandElement, AI_ID);
        renderBoard();
        disablePlayerHandInteractions(false);
    }
    function handleDragStart(event) { /* ... (no change) ... */
        if (currentPlayer !== PLAYER_ID) { event.preventDefault(); return; }
        const cardElement = event.target.closest('.card');
        if (!cardElement || cardElement.classList.contains('disabled') || cardElement.closest('#player-hand') !== playerHandElement) {
            event.preventDefault(); return;
        }
        const cardIndex = parseInt(cardElement.dataset.cardIndex);
        if (playerHand[cardIndex]) {
            draggedCardData = { card: playerHand[cardIndex], handIndex: cardIndex, ownerId: PLAYER_ID };
            event.dataTransfer.setData('text/plain', playerHand[cardIndex].name);
            cardElement.classList.add('dragging');
            statusArea.textContent = `Dragging ${playerHand[cardIndex].name}...`;
        } else { event.preventDefault(); }
    }
    function handleDragEnd(event) { /* ... (no change) ... */
        const cardElement = event.target.closest('.card');
        if (cardElement) cardElement.classList.remove('dragging');
        draggedCardData = null;
    }
    function handleDragOver(event) { /* ... (no change) ... */
         if (currentPlayer !== PLAYER_ID) return;
         event.preventDefault();
         const targetCell = event.target.closest('.grid-cell');
         if (targetCell) targetCell.classList.add('drag-over');
    }
    gameBoardElement.addEventListener('dragleave', (event) => { /* ... (no change) ... */
         if (event.target.classList.contains('grid-cell')) event.target.classList.remove('drag-over');
    });
    async function handleDrop(event) { /* ... (no change) ... */
        if (currentPlayer !== PLAYER_ID) return;
        event.preventDefault();
        const targetCell = event.target.closest('.grid-cell');
        if (targetCell) targetCell.classList.remove('drag-over');

        if (draggedCardData && targetCell) {
            const row = parseInt(targetCell.dataset.row);
            const col = parseInt(targetCell.dataset.col);
            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE && gameBoard[row][col] === null) {
                await placeCardOnBoard(draggedCardData.card, draggedCardData.handIndex, row, col, draggedCardData.ownerId);
            } else { statusArea.textContent = 'Cell is already occupied or invalid!'; }
        }
        draggedCardData = null;
    }
    async function placeCardOnBoard(card, handIndex, row, col, ownerId) { /* ... (no change) ... */
        if (gameBoard[row][col]) return;
        gameBoard[row][col] = { card, owner: ownerId };
        if (ownerId === PLAYER_ID) playerHand.splice(handIndex, 1);
        else aiHand.splice(handIndex, 1);
        renderHand(playerHand, playerHandElement, PLAYER_ID);
        renderHand(aiHand, aiHandElement, AI_ID);
        renderBoard();
        await resolveFlips(row, col, ownerId, card.name, ownerId === PLAYER_ID ? 'Player' : 'AI');
        if (isBoardFull() || (!canAnyPlayerMove() && (playerHand.length === 0 || aiHand.length === 0)) ) {
             endGame(); return;
         }
        if (ownerId === PLAYER_ID) {
             if(aiHand.length === 0 && playerHand.length > 0 && !isBoardFull()) {
                 statusArea.textContent = "AI has no cards. Player's turn again.";
                 disablePlayerHandInteractions(false); return;
             }
             currentPlayer = AI_ID; statusArea.textContent = "AI's turn...";
             disablePlayerHandInteractions(true); setTimeout(aiTakeTurn, 1200 + Math.random() * 1200);
         } else {
             if(playerHand.length === 0 && aiHand.length > 0 && !isBoardFull()){
                 statusArea.textContent = "Player has no cards. AI's turn again.";
                 setTimeout(aiTakeTurn, 1200 + Math.random() * 1200); return;
             }
             currentPlayer = PLAYER_ID; statusArea.textContent = "Player's turn.";
             disablePlayerHandInteractions(false);
         }
    }
    function canAnyPlayerMove() { /* ... (no change) ... */
        const hasEmptyCell = gameBoard.flat().some(cell => cell === null);
        const playerCanMove = playerHand.length > 0 && hasEmptyCell;
        const aiCanMove = aiHand.length > 0 && hasEmptyCell;
        return playerCanMove || aiCanMove;
    }
    async function aiTakeTurn() { /* ... (no change) ... */
        if (currentPlayer !== AI_ID || aiHand.length === 0 || isBoardFull()) {
            if (!isBoardFull() && playerHand.length > 0 && canAnyPlayerMove()) {
                 statusArea.textContent = "AI cannot play. Player's turn.";
                 currentPlayer = PLAYER_ID; disablePlayerHandInteractions(false);
            } else { endGame(); }
            return;
        }
        const aiCardToPlay = aiHand[0]; const aiCardHandIndex = 0;
        const emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) { if (!gameBoard[r][c]) emptyCells.push({r, c}); }
        }
        if (emptyCells.length > 0) {
            const targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            await placeCardOnBoard(aiCardToPlay, aiCardHandIndex, targetCell.r, targetCell.c, AI_ID);
        } else { endGame(); }
    }

    // --- Battle Logic & Elemental System ---
    function getOppositeDirection(direction) { /* ... (no change) ... */
        const opposites = {'N':'S','NE':'SW','E':'W','SE':'NW','S':'N','SW':'NE','W':'E','NW':'SE'};
        return opposites[direction];
    }
    function getNeighborCoords(r, c, direction) { /* ... (no change) ... */
        const deltas = {'N':[-1,0],'NE':[-1,1],'E':[0,1],'SE':[1,1],'S':[1,0],'SW':[1,-1],'W':[0,-1],'NW':[-1,-1]};
        const [dr,dc] = deltas[direction]; const nr = r+dr; const nc = c+dc;
        if (nr>=0 && nr<GRID_SIZE && nc>=0 && nc<GRID_SIZE) return [nr,nc];
        return null;
    }
    function getElementalBonus(attackerSymbol, defenderSymbol) { /* ... (no change) ... */
        if (attackerSymbol === 'X' || defenderSymbol === 'X') return 0;
        const advantages = { 'W': 'F', 'F': 'A', 'A': 'E', 'E': 'W' };
        if (advantages[attackerSymbol] === defenderSymbol) return 2;
        return 0;
    }

    function createStatPopup(text, targetCardElement, type) { // type can be 'attacker' or 'defender'
        const popup = document.createElement('div');
        popup.classList.add('stat-popup', `stat-popup-${type}`);
        popup.textContent = text;
        targetCardElement.closest('.grid-cell').appendChild(popup); // Append to grid cell for positioning
        activeStatPopups.push(popup);
        // Trigger reflow to apply animation
        void popup.offsetWidth; 
        popup.classList.add('visible');
    }

    async function resolveFlips(placedRow, placedCol, attackerOwnerId, originalCardName, placerName) {
        clearHighlightsAndPopups();

        let cardsFlippedThisTurn = 0;
        let statusUpdates = [`${placerName} placed ${originalCardName} at (${placedRow},${placedCol}).`];
        statusArea.innerHTML = statusUpdates.join('<br>');

        let cardsToProcessForFlip = [{ r: placedRow, c: placedCol }];
        let alreadyCheckedInChain = new Set();

        // Slower, more deliberate delays
        const ENGAGEMENT_DELAY = 700;
        const STAT_REVEAL_DELAY = 1200; // Allow time to read stats
        const OUTCOME_DELAY = 900;
        const FLIP_DELAY = 700;

        while (cardsToProcessForFlip.length > 0) {
            const currentAttackerPos = cardsToProcessForFlip.shift();
            const currentAttackerKey = `${currentAttackerPos.r}-${currentAttackerPos.c}`;

            if (alreadyCheckedInChain.has(currentAttackerKey)) continue;
            alreadyCheckedInChain.add(currentAttackerKey);

            const currentAttackerCellData = gameBoard[currentAttackerPos.r][currentAttackerPos.c];
            if (!currentAttackerCellData) continue;

            const attackerCard = currentAttackerCellData.card;
            const attackerElement = gameBoardElement.querySelector(`.grid-cell[data-row='${currentAttackerPos.r}'][data-col='${currentAttackerPos.c}'] .card-on-board`);

            for (const direction of attackerCard.directions) {
                const neighborCoords = getNeighborCoords(currentAttackerPos.r, currentAttackerPos.c, direction);
                if (neighborCoords) {
                    const [nr, nc] = neighborCoords;
                    const defenderData = gameBoard[nr][nc];
                    const defenderElement = gameBoardElement.querySelector(`.grid-cell[data-row='${nr}'][data-col='${nc}'] .card-on-board`);

                    if (defenderData && defenderData.owner !== currentAttackerCellData.owner && attackerElement && defenderElement) {
                        const defenderCard = defenderData.card;
                        const oppositeDir = getOppositeDirection(direction);
                        let flip = false;
                        let battleHappened = false;
                        let battleDescription = "";

                        let attackTypeDisplay = '';
                        let defenseTypeDisplay = '';
                        let effectiveAttack = attackerCard.atk + getElementalBonus(attackerCard.elementSymbol, defenderCard.elementSymbol);
                        let relevantDefense = 0;
                        let elementalBonusText = getElementalBonus(attackerCard.elementSymbol, defenderCard.elementSymbol) > 0 ? ` (+${getElementalBonus(attackerCard.elementSymbol, defenderCard.elementSymbol)})` : "";


                        if (attackerCard.elementSymbol === 'X') {
                            attackTypeDisplay = 'Arcane';
                            relevantDefense = Math.min(defenderCard.pDef, defenderCard.mDef);
                            defenseTypeDisplay = relevantDefense === defenderCard.pDef ? 'P.Def' : 'M.Def';
                        } else if (attackerCard.elementSymbol === 'F' || attackerCard.elementSymbol === 'A') {
                            attackTypeDisplay = 'P.Atk';
                            relevantDefense = defenderCard.pDef;
                            defenseTypeDisplay = 'P.Def';
                        } else {
                            attackTypeDisplay = 'M.Atk';
                            relevantDefense = defenderCard.mDef;
                            defenseTypeDisplay = 'M.Def';
                        }

                        // 1. Initial Engagement Highlight
                        attackerElement.classList.add('clash-attacker');
                        defenderElement.classList.add('clash-defender');
                        await delay(ENGAGEMENT_DELAY);

                        // 2. Stat Reveal Pop-ups
                        createStatPopup(`${attackTypeDisplay}: ${effectiveAttack}${elementalBonusText}`, attackerElement, 'attacker');
                        createStatPopup(`${defenseTypeDisplay}: ${relevantDefense}`, defenderElement, 'defender');
                        await delay(STAT_REVEAL_DELAY);

                        if (defenderCard.directions.includes(oppositeDir)) { // CLASH
                            battleHappened = true;
                            if (effectiveAttack > relevantDefense) {
                                flip = true;
                                battleDescription = `<span class="battle-win">beats</span>`;
                                attackerElement.classList.add('clash-winner');
                                defenderElement.classList.add('clash-loser', 'hit-spark'); // Add hit-spark
                            } else {
                                battleDescription = `<span class="battle-lose">fails vs</span>`;
                                attackerElement.classList.add('clash-loser');
                                defenderElement.classList.add('clash-winner', 'block-shield'); // Add block-shield
                            }
                            statusUpdates.push(`${attackerCard.name} (${attackTypeDisplay} ${effectiveAttack}${elementalBonusText}) ${battleDescription} ${defenderCard.name} (${defenseTypeDisplay} ${relevantDefense})!`);
                        } else { // FLANK
                            battleHappened = true;
                            flip = true;
                            battleDescription = `is <span class="battle-flank">flanked</span> by`;
                            statusUpdates.push(`${defenderCard.name} ${battleDescription} ${attackerCard.name}! (auto-flip)`);
                            attackerElement.classList.add('clash-winner');
                            defenderElement.classList.add('hit-spark'); // Flanked card gets "hit"
                        }
                        
                        statusArea.innerHTML = statusUpdates.join('<br>');
                        if (battleHappened) await delay(OUTCOME_DELAY);

                        // Clear stat pop-ups for this pair
                        activeStatPopups.forEach(popup => popup.remove());
                        activeStatPopups = [];

                        if (flip) {
                            gameBoard[nr][nc].owner = currentAttackerCellData.owner;
                            cardsFlippedThisTurn++;
                            cardsToProcessForFlip.push({ r: nr, c: nc });
                            statusUpdates.push(`${defenderCard.name} flipped to ${currentAttackerCellData.owner}'s side!`);
                            renderBoard();
                            statusArea.innerHTML = statusUpdates.join('<br>');
                            await delay(FLIP_DELAY);
                        }
                        
                        attackerElement.classList.remove('clash-attacker', 'clash-winner', 'clash-loser', 'hit-spark', 'block-shield');
                        defenderElement.classList.remove('clash-defender', 'clash-winner', 'clash-loser', 'hit-spark', 'block-shield');
                    }
                }
            }
            if(attackerElement) attackerElement.classList.remove('clash-attacker', 'clash-winner', 'clash-loser', 'hit-spark', 'block-shield');
        }

        if (cardsFlippedThisTurn > 0) console.log(`Total cards flipped in chain: ${cardsFlippedThisTurn}`);
        clearHighlightsAndPopups();
        renderBoard();
    }

    // --- Game End Functions ---
    function isBoardFull() { /* ... (no change) ... */
        for (let r=0;r<GRID_SIZE;r++) for (let c=0;c<GRID_SIZE;c++) if(gameBoard[r][c]===null) return false;
        return true;
    }
    function countScores() { /* ... (no change) ... */
        let pS=0,aS=0; for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++) if(gameBoard[r][c]) gameBoard[r][c].owner===PLAYER_ID?pS++:aS++;
        return {playerScore:pS,aiScore:aS};
    }
    function endGame() { /* ... (no change, but calls clearHighlightsAndPopups) ... */
        clearHighlightsAndPopups();
        const scores = countScores();
        let msg = `Game Over! Player: ${scores.playerScore}, AI: ${scores.aiScore}. `;
        if(scores.playerScore > scores.aiScore) msg+="Player wins!";
        else if(scores.aiScore > scores.playerScore) msg+="AI wins!";
        else msg+="It's a draw!";
        statusArea.textContent = msg;
        disablePlayerHandInteractions(true);
        playAgainButton.classList.remove('hidden');
    }

    // --- Initial Event Listeners ---
    duelButton.addEventListener('click', () => { /* ... (no change) ... */
        splashScreen.classList.add('hidden'); gameScreen.classList.remove('hidden'); initializeGame();
    });
    playAgainButton.addEventListener('click', initializeGame);
    playerHandElement.addEventListener('dragstart', handleDragStart);
    playerHandElement.addEventListener('dragend', handleDragEnd);

}); // End DOMContentLoaded