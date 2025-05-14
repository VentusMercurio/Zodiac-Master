// main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Debugging Logs (from the first block) ---
    console.log("DOM fully loaded and parsed.");
    console.log("splashScreen element:", splashScreen);
    console.log("gameScreen element:", gameScreen);
    console.log("duelButton element:", duelButton);

    // --- Element Checks (from the first block) ---
    if (!duelButton) {
        console.error("CRITICAL: duelButton not found! Check ID in HTML and domElements.js. App will not work.");
        return; // Stop further execution in this block if duelButton is missing
    }
    if (!splashScreen) {
        console.error("CRITICAL: splashScreen not found! Check ID in HTML and domElements.js. Splash screen will not hide.");
    }
    if (!gameScreen) {
       console.error("CRITICAL: gameScreen not found! Check ID in HTML and domElements.js. Game screen will not show.");
    }

    // --- Event Listeners (combined from both blocks) ---
    duelButton.addEventListener('click', () => {
        console.log("Duel button clicked!"); // From the first block for debugging

        if (splashScreen) {
            console.log("Attempting to hide splashScreen:", splashScreen); // Debugging
            splashScreen.classList.add('hidden');
        } else {
            console.error("Cannot hide splashScreen because the variable is null or undefined!"); // Debugging
        }

        if (gameScreen) {
            console.log("Attempting to show gameScreen:", gameScreen); // Debugging
            gameScreen.classList.remove('hidden');
        } else {
            console.error("Cannot show gameScreen because the variable is null or undefined!"); // Debugging
        }
        
        initializeGame();
    });

    // This listener was in your second block, ensure it's here if playAgainButton is defined
    if (playAgainButton) { // Good practice to check if the element exists
        playAgainButton.addEventListener('click', initializeGame);
    } else {
        console.warn("playAgainButton not found in the DOM. Its event listener will not be attached.");
    }


    // These listeners were in your second block
    // Make sure playerHandElement, handleDragStart, handleDragEnd, and gameBoardElement are defined
    // (They should be if domElements.js and dragDrop.js are loaded correctly before main.js)
    if (playerHandElement) {
        playerHandElement.addEventListener('dragstart', handleDragStart);
        playerHandElement.addEventListener('dragend', handleDragEnd);
    } else {
        console.warn("playerHandElement not found. Drag listeners for player hand not attached.");
    }

    if (gameBoardElement) {
        gameBoardElement.addEventListener('dragleave', event => {
            if (event.target.classList.contains('grid-cell')) {
                event.target.classList.remove('drag-over');
            }
        });
    } else {
        console.warn("gameBoardElement not found. Dragleave listener not attached.");
    }


    // No need to call initializeGame() here directly,
    // it's called when the "Duel" button is clicked.
    // Splash screen is shown by default.
});