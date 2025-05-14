// render.js
// Contains all functions responsible for updating the UI.

function logEvent(message, isImportant = false) {
    const logEntry = document.createElement('p');
    logEntry.innerHTML = message; // Use innerHTML to support span tags for styling
    if (isImportant) logEntry.style.fontWeight = 'bold';
    duelLogElement.prepend(logEntry);
    const maxLogEntries = 100; // Keep the log from getting too long
    if (duelLogElement.children.length > maxLogEntries) {
        duelLogElement.removeChild(duelLogElement.lastChild);
    }
}

function renderCard(cardData, ownerId, onBoard = false) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    if (ownerId === PLAYER_ID) cardElement.classList.add('player-card-visual');
    else if (ownerId === AI_ID) cardElement.classList.add('ai-card-visual');

    const arrowContainer = document.createElement('div');
    arrowContainer.classList.add('arrow-container');
    cardData.directions.forEach(dir => {
        const arrowElement = document.createElement('div');
        arrowElement.classList.add('arrow', `arrow-${dir.toLowerCase()}`);
        arrowElement.textContent = getArrowSymbol(dir);
        arrowContainer.appendChild(arrowElement);
    });

    const zodiacSymbol = ZODIAC_UNICODE[cardData.zodiacSign] || ZODIAC_UNICODE.Serpentarius; // Fallback to Serpentarius if undefined

    if (onBoard) {
        cardElement.classList.add('card-on-board');
        cardElement.innerHTML = `
            <div class="zodiac-board-symbol">${zodiacSymbol}</div>
            <div class="name">${cardData.name.substring(0, 12)}${cardData.name.length > 12 ? '...' : ''}</div>
            <div class="stats-condensed">${cardData.atk}${cardData.elementSymbol}${cardData.pDef}${cardData.mDef}</div>`;
        cardElement.appendChild(arrowContainer); // Arrows are part of the card content
    } else {
        cardElement.classList.add('card-in-hand');
        cardElement.innerHTML = `
            <div class="name">${cardData.name} <span class="zodiac-hand-symbol">${zodiacSymbol}</span></div>
            <div class="stats">
                <span class="atk">Atk: ${cardData.atk}</span>
                <span class="elem">Elem: ${cardData.elementSymbol}</span>
                <span class="pdef">PDef: ${cardData.pDef}</span>
                <span class="mdef">MDef: ${cardData.mDef}</span>
                <span class="bp">BP: ${cardData.currentBP}/${cardData.maxBP}</span>
            </div>`;
        cardElement.appendChild(arrowContainer);
    }
    return cardElement;
}

function renderHand(hand, handElement, ownerId) {
    handElement.innerHTML = ''; // Clear previous cards
    hand.forEach((card, index) => {
        const cardElement = renderCard(card, ownerId, false);
        if (ownerId === PLAYER_ID) { // Only player's hand cards need data attributes for drag/drop
            cardElement.dataset.cardIndex = index;
        }
        handElement.appendChild(cardElement);
    });
    if (ownerId === PLAYER_ID) {
        disablePlayerHandInteractions(currentPlayer !== PLAYER_ID);
    }
}

function renderBoard() {
    gameBoardElement.innerHTML = ''; // Clear previous board
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('grid-cell');
            cellElement.dataset.row = r;
            cellElement.dataset.col = c;

            const cardDataOnCell = gameBoard[r][c];
            if (cardDataOnCell) {
                const cardElement = renderCard(cardDataOnCell.card, cardDataOnCell.owner, true);
                cellElement.appendChild(cardElement);
            } else if (currentPlayer === PLAYER_ID) { // Only add drag listeners to empty cells if it's player's turn
                cellElement.addEventListener('dragover', handleDragOver);
                cellElement.addEventListener('drop', handleDrop);
            }
            gameBoardElement.appendChild(cellElement);
        }
    }
}

function disablePlayerHandInteractions(disable) {
    const playerCards = playerHandElement.querySelectorAll('.card');
    playerCards.forEach(cardElement => {
        cardElement.draggable = !disable;
        cardElement.classList.toggle('disabled', disable);
    });

    // Also manage drag listeners on board cells
    gameBoardElement.querySelectorAll('.grid-cell').forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        // Ensure valid cell and it's empty
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && !gameBoard[r][c]) {
            cell.removeEventListener('dragover', handleDragOver); // Remove first to avoid duplicates
            cell.removeEventListener('drop', handleDrop);
            if (!disable) { // If not disabling, add them back
                cell.addEventListener('dragover', handleDragOver);
                cell.addEventListener('drop', handleDrop);
            }
        }
    });
}

function clearHighlightsAndPopups() {
    document.querySelectorAll('.card-on-board.clash-attacker, .card-on-board.clash-defender, .card-on-board.clash-winner, .card-on-board.clash-loser, .card-on-board.hit-spark, .card-on-board.block-shield')
        .forEach(el => {
            el.className = el.className
                .replace(/\bclash-\w+\b/g, '')
                .replace(/\bhit-spark\b/g, '')
                .replace(/\bblock-shield\b/g, '')
                .trim();
        });
    activeStatPopups.forEach(popup => popup.remove());
    activeStatPopups = []; // Clear the array
}

function createStatPopup(text, targetCardElement, type) {
    const popup = document.createElement('div');
    popup.classList.add('stat-popup', `stat-popup-${type}`);
    popup.textContent = text;
    targetCardElement.closest('.grid-cell').appendChild(popup); // Append to cell for positioning
    activeStatPopups.push(popup);

    // Force reflow to enable CSS transition
    void popup.offsetWidth;
    popup.classList.add('visible');
}