// state.js
// Manages the dynamic state of the game.

let fullDeck = [];
let playerHand = [];
let aiHand = [];
let gameBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)); // Initialized here
let draggedCardData = null;
let currentPlayer = PLAYER_ID; // Initialized here
let activeStatPopups = [];