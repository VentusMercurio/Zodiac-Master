// config.js
// Stores all game constants and configuration settings.

const SUITS = { WANDS: 'Wands', CUPS: 'Cups', SWORDS: 'Swords', PENTACLES: 'Pentacles', MAJOR: 'Major Arcana' };
const CARD_TYPES = { PIP: 'Pip', COURT: 'Court', MAJOR: 'Major' };
const PIP_RANKS = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const COURT_RANKS = ['Page', 'Knight', 'Queen', 'King'];
const FULL_MAJOR_ARCANA_LIST = [
    'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
    'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
    'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
    'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
    'Judgement', 'The World'
];
const SERPENTARIUS_CARD_NAMES = ['The Fool', 'The World', 'Judgement', 'Death', 'Wheel of Fortune', 'The Tower'];
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const PLAYER_ID = 'player';
const AI_ID = 'ai';
const GRID_SIZE = 4;
const ELEMENT_SYMBOLS = { WANDS: 'F', CUPS: 'W', SWORDS: 'A', PENTACLES: 'E', MAJOR: 'X' };
const MIN_MAJOR_STAT = 3;
const MAX_MAJOR_STAT = 9;
const STAT_VARIANCE = 1;
const DEFAULT_MAX_BP = 3;
const BP_ON_FLIP = 1;
const ZODIAC_UNICODE = {
    "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋", "Leo": "♌", "Virgo": "♍",
    "Libra": "♎", "Scorpio": "♏", "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒",
    "Pisces": "♓", "Serpentarius": "⛎"
};
const ZODIAC_ASSIGNMENTS = {
    "Aries": ["The Emperor", "Ace of Wands", "Knight of Wands", "3 of Wands", "5 of Wands", "8 of Swords"],
    "Taurus": ["The Empress", "Ace of Pentacles", "King of Pentacles", "4 of Pentacles", "7 of Pentacles", "6 of Cups"],
    "Gemini": ["The Magician", "Ace of Swords", "Knight of Swords", "3 of Swords", "8 of Wands", "Page of Cups"],
    "Cancer": ["The High Priestess", "2 of Cups", "Queen of Cups", "4 of Cups", "6 of Wands", "Page of Swords"],
    "Leo": ["The Chariot", "The Sun", "King of Wands", "5 of Pentacles", "Page of Wands", "9 of Pentacles"],
    "Virgo": ["The Hierophant", "Knight of Pentacles", "Queen of Swords", "3 of Pentacles", "6 of Pentacles", "9 of Swords"],
    "Libra": ["The Lovers", "Justice", "King of Swords", "2 of Swords", "6 of Swords", "4 of Wands"],
    "Scorpio": ["Strength", "The Devil", "King of Cups", "5 of Cups", "8 of Cups", "7 of Swords"],
    "Sagittarius": ["Temperance", "Queen of Wands", "3 of Cups", "Ace of Cups", "9 of Wands", "Page of Pentacles"],
    "Capricorn": ["The Hermit", "Queen of Pentacles", "Knight of Cups", "7 of Wands", "10 of Wands", "10 of Pentacles"],
    "Aquarius": ["The Star", "Ace of Pentacles", "Knight of Swords", "4 of Swords", "5 of Swords", "10 of Cups"],
    "Pisces": ["The Hanged Man", "The Moon", "Knight of Cups", "7 of Cups", "9 of Cups", "10 of Swords"]
};