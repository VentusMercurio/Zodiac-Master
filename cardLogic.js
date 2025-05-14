// cardLogic.js
// Handles logic related to card creation, stats, and properties.

function getCardTypeAndRank(name, suit) {
    if (suit === SUITS.MAJOR) return { type: CARD_TYPES.MAJOR, rank: name, numericRank: FULL_MAJOR_ARCANA_LIST.indexOf(name) };
    const parts = name.split(' of ');
    const rank = parts[0];
    if (COURT_RANKS.includes(rank)) return { type: CARD_TYPES.COURT, rank: rank, numericRank: COURT_RANKS.indexOf(rank) + 11 };
    if (PIP_RANKS.includes(rank)) return { type: CARD_TYPES.PIP, rank: rank, numericRank: rank === 'Ace' ? 1 : parseInt(rank) };
    return { type: 'Unknown', rank: 'Unknown', numericRank: -1 };
}

function calculateStats(cardInfo) {
    let atk, pDef, mDef;
    const { type, numericRank, suit } = cardInfo;
    let cardSuitKey = Object.keys(SUITS).find(key => SUITS[key] === suit);
    const elementSymbol = ELEMENT_SYMBOLS[cardSuitKey] || 'X';

    if (type === CARD_TYPES.MAJOR) {
        const rankFactor = numericRank / (FULL_MAJOR_ARCANA_LIST.length - 1);
        const statRange = MAX_MAJOR_STAT - MIN_MAJOR_STAT;
        const calculateWeightedStat = () => {
            const baseValue = MIN_MAJOR_STAT + (rankFactor * statRange);
            const randomOffset = getRandomInt(-STAT_VARIANCE, STAT_VARIANCE);
            const calculatedStat = Math.round(baseValue) + randomOffset;
            return Math.max(MIN_MAJOR_STAT, Math.min(MAX_MAJOR_STAT, calculatedStat));
        };
        atk = calculateWeightedStat();
        pDef = calculateWeightedStat();
        mDef = calculateWeightedStat();
    } else if (type === CARD_TYPES.COURT) {
        atk = getRandomInt(4, 7);
        pDef = getRandomInt(4, 7);
        mDef = getRandomInt(4, 7);
    } else if (type === CARD_TYPES.PIP) {
        if (numericRank >= 2 && numericRank <= 5) {
            atk = getRandomInt(1, 4);
            pDef = getRandomInt(1, 4);
            mDef = getRandomInt(1, 4);
        } else { // Aces and 6-10
            atk = getRandomInt(3, 6);
            pDef = getRandomInt(3, 6);
            mDef = getRandomInt(3, 6);
        }
    } else { // Unknown type
        atk = pDef = mDef = 1;
    }
    const maxBP = DEFAULT_MAX_BP;
    const currentBP = maxBP;
    return { atk, pDef, mDef, elementSymbol, maxBP, currentBP };
}

function assignRandomDirections() {
    const numDirections = getRandomInt(2, 6);
    const availableDirections = [...DIRECTIONS];
    shuffleArray(availableDirections);
    return availableDirections.slice(0, numDirections).sort();
}

function generateTarotDeck() {
    const deck = [];
    for (const suitKey in SUITS) {
        const suitName = SUITS[suitKey];
        if (suitName === SUITS.MAJOR) {
            for (const name of FULL_MAJOR_ARCANA_LIST) {
                const cardInfo = { name, suit: SUITS.MAJOR, ...getCardTypeAndRank(name, SUITS.MAJOR) };
                let stats = calculateStats(cardInfo);
                let directions = assignRandomDirections();
                // Special handling for "The Fool"
                if (name === 'The Fool') {
                    stats = { ...stats, atk: MAX_MAJOR_STAT, pDef: MAX_MAJOR_STAT, mDef: MAX_MAJOR_STAT, elementSymbol: 'X' };
                    directions = [...DIRECTIONS];
                }
                // Assign Zodiac Sign
                if (SERPENTARIUS_CARD_NAMES.includes(name)) {
                    cardInfo.zodiacSign = "Serpentarius";
                } else {
                    let assigned = false;
                    for (const sign in ZODIAC_ASSIGNMENTS) {
                        if (ZODIAC_ASSIGNMENTS[sign].includes(name)) {
                            cardInfo.zodiacSign = sign;
                            assigned = true;
                            break;
                        }
                    }
                    if (!assigned) console.warn(`Major Arcana ${name} not in Serpentarius or ZODIAC_ASSIGNMENTS!`);
                }
                deck.push({ ...cardInfo, ...stats, directions });
            }
        } else { // Pip and Court Cards
            for (const rank of PIP_RANKS.concat(COURT_RANKS)) {
                const name = `${rank} of ${suitName}`;
                const cardInfo = { name, suit: suitName, ...getCardTypeAndRank(name, suitName) };
                const stats = calculateStats(cardInfo);
                const directions = assignRandomDirections();
                // Assign Zodiac Sign
                let assigned = false;
                for (const sign in ZODIAC_ASSIGNMENTS) {
                    if (ZODIAC_ASSIGNMENTS[sign].includes(name)) {
                        cardInfo.zodiacSign = sign;
                        assigned = true;
                        break;
                    }
                }
                if (!assigned) console.warn(`Minor Arcana ${name} not in ZODIAC_ASSIGNMENTS!`);
                deck.push({ ...cardInfo, ...stats, directions });
            }
        }
    }
    console.log(`Total cards generated with Zodiac signs: ${deck.length}`);
    if (deck.length !== 78) console.error(`Error: Expected 78 cards, got ${deck.length}.`);
    Object.values(ZODIAC_ASSIGNMENTS).flat().forEach(cardName => {
        if (!deck.find(card => card.name === cardName)) console.error(`Card "${cardName}" from ZODIAC_ASSIGNMENTS not found in generated deck.`);
    });
    return deck;
}

function getArrowSymbol(direction) {
    const symbols = { 'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘', 'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖' };
    return symbols[direction] || '';
}