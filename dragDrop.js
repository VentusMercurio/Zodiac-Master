// dragDrop.js
// Manages all drag-and-drop functionality.

function handleDragStart(event) {
    if (currentPlayer !== PLAYER_ID) { // Should not happen if disabled, but good check
        event.preventDefault();
        return;
    }
    const cardElement = event.target.closest('.card');
    // Ensure the card is from the player's hand and not disabled
    if (!cardElement || cardElement.classList.contains('disabled') || cardElement.closest('#player-hand') !== playerHandElement) {
        event.preventDefault(); // Not a draggable player card
        return;
    }

    const cardIndex = parseInt(cardElement.dataset.cardIndex);
    if (playerHand[cardIndex]) {
        draggedCardData = {
            card: playerHand[cardIndex],
            handIndex: cardIndex,
            ownerId: PLAYER_ID
        };
        event.dataTransfer.setData('text/plain', playerHand[cardIndex].name); // Necessary for Firefox
        cardElement.classList.add('dragging');
        statusArea.textContent = `Dragging ${playerHand[cardIndex].name}...`;
    } else {
        event.preventDefault(); // Card data not found
    }
}

function handleDragEnd(event) {
    const cardElement = event.target.closest('.card');
    if (cardElement) { // It might be null if drag was cancelled weirdly
        cardElement.classList.remove('dragging');
    }
    // draggedCardData is reset in handleDrop or if drop is unsuccessful
    // No, reset it here unconditionally to be safe
    draggedCardData = null;
}

function handleDragOver(event) {
    if (currentPlayer !== PLAYER_ID) return; // Only allow drop if it's player's turn
    event.preventDefault(); // Allow drop
    const targetCell = event.target.closest('.grid-cell');
    if (targetCell) {
        const r = parseInt(targetCell.dataset.row);
        const c = parseInt(targetCell.dataset.col);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && !gameBoard[r][c]) {
            targetCell.classList.add('drag-over');
        }
    }
}

// This listener should be on gameBoardElement, as it's static.
// Moved to main.js for initial setup.
// gameBoardElement.addEventListener('dragleave', event => {
// if (event.target.classList.contains('grid-cell')) {
// event.target.classList.remove('drag-over');
// }
// });

async function handleDrop(event) {
    if (currentPlayer !== PLAYER_ID) return;
    event.preventDefault();
    const targetCell = event.target.closest('.grid-cell');
    if (targetCell) targetCell.classList.remove('drag-over');

    if (draggedCardData && targetCell) {
        const r = parseInt(targetCell.dataset.row);
        const c = parseInt(targetCell.dataset.col);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && gameBoard[r][c] === null) {
            await placeCardOnBoard(draggedCardData.card, draggedCardData.handIndex, r, c, draggedCardData.ownerId);
        } else {
            statusArea.textContent = 'Cell is already occupied or invalid!';
        }
    }
    draggedCardData = null; // Reset here after drop attempt
}