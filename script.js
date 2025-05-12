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
    const duelLogElement = document.getElementById('duel-log');

    // --- Game Constants ---
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

    // --- Game State Variables ---
    let fullDeck = []; let playerHand = []; let aiHand = [];
    let gameBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    let draggedCardData = null; let currentPlayer = PLAYER_ID; let activeStatPopups = [];

    // --- Utility Functions ---
    function getRandomInt(min,max){min=Math.ceil(min);max=Math.floor(max);return Math.floor(Math.random()*(max-min+1))+min;}
    function shuffleArray(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}}
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // --- Duel Log Function ---
    function logEvent(message,isImportant=false){const le=document.createElement('p');le.innerHTML=message;if(isImportant)le.style.fontWeight='bold';duelLogElement.prepend(le);const mle=100;if(duelLogElement.children.length>mle)duelLogElement.removeChild(duelLogElement.lastChild);}

    // --- Card Data Functions ---
    function getCardTypeAndRank(name,suit){if(suit===SUITS.MAJOR)return{type:CARD_TYPES.MAJOR,rank:name,numericRank:FULL_MAJOR_ARCANA_LIST.indexOf(name)};const p=name.split(' of ');const r=p[0];if(COURT_RANKS.includes(r))return{type:CARD_TYPES.COURT,rank:r,numericRank:COURT_RANKS.indexOf(r)+11};if(PIP_RANKS.includes(r))return{type:CARD_TYPES.PIP,rank:r,numericRank:r==='Ace'?1:parseInt(r)};return{type:'Unknown',rank:'Unknown',numericRank:-1};}
    function calculateStats(cardInfo){let atk,pDef,mDef;const{type,numericRank,suit}=cardInfo;let csK=Object.keys(SUITS).find(k=>SUITS[k]===suit);const eS=ELEMENT_SYMBOLS[csK]||'X';if(type===CARD_TYPES.MAJOR){const rF=numericRank/(FULL_MAJOR_ARCANA_LIST.length-1);const sR=MAX_MAJOR_STAT-MIN_MAJOR_STAT;const cWS=()=>{const bV=MIN_MAJOR_STAT+(rF*sR);const rO=getRandomInt(-STAT_VARIANCE,STAT_VARIANCE);const cS=Math.round(bV)+rO;return Math.max(MIN_MAJOR_STAT,Math.min(MAX_MAJOR_STAT,cS));};atk=cWS();pDef=cWS();mDef=cWS();}else if(type===CARD_TYPES.COURT){atk=getRandomInt(4,7);pDef=getRandomInt(4,7);mDef=getRandomInt(4,7);}else if(type===CARD_TYPES.PIP){if(numericRank>=2&&numericRank<=5){atk=getRandomInt(1,4);pDef=getRandomInt(1,4);mDef=getRandomInt(1,4);}else{atk=getRandomInt(3,6);pDef=getRandomInt(3,6);mDef=getRandomInt(3,6);}}else{atk=pDef=mDef=1;}const maxBP=DEFAULT_MAX_BP;const currentBP=maxBP;return{atk,pDef,mDef,elementSymbol:eS,maxBP,currentBP};}
    function assignRandomDirections(){const n=getRandomInt(2,6);const aD=[...DIRECTIONS];shuffleArray(aD);return aD.slice(0,n).sort();}

    function generateTarotDeck(){const deck=[];for(const suitKey in SUITS){const suitName=SUITS[suitKey];if(suitName===SUITS.MAJOR){for(const name of FULL_MAJOR_ARCANA_LIST){const cardInfo={name,suit:SUITS.MAJOR,...getCardTypeAndRank(name,SUITS.MAJOR)};let stats=calculateStats(cardInfo);let directions=assignRandomDirections();if(name==='The Fool'){stats={...stats,atk:MAX_MAJOR_STAT,pDef:MAX_MAJOR_STAT,mDef:MAX_MAJOR_STAT,elementSymbol:'X'};directions=[...DIRECTIONS];}
    if(SERPENTARIUS_CARD_NAMES.includes(name)){cardInfo.zodiacSign="Serpentarius";}else{let assigned=false;for(const sign in ZODIAC_ASSIGNMENTS){if(ZODIAC_ASSIGNMENTS[sign].includes(name)){cardInfo.zodiacSign=sign;assigned=true;break;}}if(!assigned)console.warn(`Major Arcana ${name} not in Serpentarius or ZODIAC_ASSIGNMENTS!`);}deck.push({...cardInfo,...stats,directions});}}else{for(const rank of PIP_RANKS.concat(COURT_RANKS)){const name=`${rank} of ${suitName}`;const cardInfo={name,suit:suitName,...getCardTypeAndRank(name,suitName)};const stats=calculateStats(cardInfo);const directions=assignRandomDirections();let assigned=false;for(const sign in ZODIAC_ASSIGNMENTS){if(ZODIAC_ASSIGNMENTS[sign].includes(name)){cardInfo.zodiacSign=sign;assigned=true;break;}}if(!assigned)console.warn(`Minor Arcana ${name} not in ZODIAC_ASSIGNMENTS!`);deck.push({...cardInfo,...stats,directions});}}}
    console.log(`Total cards generated with Zodiac signs: ${deck.length}`);if(deck.length!==78)console.error(`Error: Expected 78 cards, got ${deck.length}.`);Object.values(ZODIAC_ASSIGNMENTS).flat().forEach(cN=>{if(!deck.find(c=>c.name===cN))console.error(`Card "${cN}" from ZODIAC_ASSIGNMENTS not found in generated deck.`);});return deck;}

    function getArrowSymbol(direction){const s={'N':'↑','NE':'↗','E':'→','SE':'↘','S':'↓','SW':'↙','W':'←','NW':'↖'};return s[direction]||'';}

    // --- Rendering Functions ---
    function renderCard(card,ownerId,onBoard=false){const ce=document.createElement('div');ce.classList.add('card');if(ownerId===PLAYER_ID)ce.classList.add('player-card-visual');else if(ownerId===AI_ID)ce.classList.add('ai-card-visual');const aC=document.createElement('div');aC.classList.add('arrow-container');card.directions.forEach(dir=>{const ae=document.createElement('div');ae.classList.add('arrow',`arrow-${dir.toLowerCase()}`);ae.textContent=getArrowSymbol(dir);aC.appendChild(ae);});const zS=ZODIAC_UNICODE[card.zodiacSign]||ZODIAC_UNICODE.Serpentarius;if(onBoard){ce.classList.add('card-on-board');ce.innerHTML=`<div class="zodiac-board-symbol">${zS}</div><div class="name">${card.name.substring(0,12)}${card.name.length>12?'...':''}</div><div class="stats-condensed">${card.atk}${card.elementSymbol}${card.pDef}${card.mDef}</div>`;ce.appendChild(aC);}else{ce.classList.add('card-in-hand');ce.innerHTML=`<div class="name">${card.name} <span class="zodiac-hand-symbol">${zS}</span></div><div class="stats"><span class="atk">Atk: ${card.atk}</span><span class="elem">Elem: ${card.elementSymbol}</span><span class="pdef">PDef: ${card.pDef}</span><span class="mdef">MDef: ${card.mDef}</span><span class="bp">BP: ${card.currentBP}/${card.maxBP}</span></div>`;ce.appendChild(aC);}return ce;}
    function renderHand(hand,element,ownerId){element.innerHTML='';hand.forEach((c,i)=>{const ce=renderCard(c,ownerId,false);if(ownerId===PLAYER_ID)ce.dataset.cardIndex=i;element.appendChild(ce);});if(ownerId===PLAYER_ID)disablePlayerHandInteractions(currentPlayer!==PLAYER_ID);}
    function renderBoard(){gameBoardElement.innerHTML='';for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++){const ce=document.createElement('div');ce.classList.add('grid-cell');ce.dataset.row=r;ce.dataset.col=c;const cd=gameBoard[r][c];if(cd){const caE=renderCard(cd.card,cd.owner,true);ce.appendChild(caE);}else if(currentPlayer===PLAYER_ID){ce.addEventListener('dragover',handleDragOver);ce.addEventListener('drop',handleDrop);}gameBoardElement.appendChild(ce);}}
    function disablePlayerHandInteractions(disable){const pc=playerHandElement.querySelectorAll('.card');pc.forEach(ce=>{ce.draggable=!disable;ce.classList.toggle('disabled',disable);});gameBoardElement.querySelectorAll('.grid-cell').forEach(ce=>{const r=parseInt(ce.dataset.row),c=parseInt(ce.dataset.col);if(r>=0&&r<GRID_SIZE&&c>=0&&c<GRID_SIZE&&!gameBoard[r][c]){ce.removeEventListener('dragover',handleDragOver);ce.removeEventListener('drop',handleDrop);if(!disable){ce.addEventListener('dragover',handleDragOver);ce.addEventListener('drop',handleDrop);}}});}
    function clearHighlightsAndPopups(){document.querySelectorAll('.card-on-board.clash-attacker,.card-on-board.clash-defender,.card-on-board.clash-winner,.card-on-board.clash-loser,.card-on-board.hit-spark,.card-on-board.block-shield').forEach(el=>{el.className=el.className.replace(/\bclash-\w+\b/g,'').replace(/\bhit-spark\b/g,'').replace(/\bblock-shield\b/g,'').trim();});activeStatPopups.forEach(p=>p.remove());activeStatPopups=[];}

    // --- Game Flow & Turn Logic ---
    function initializeGame(){
        alert("INITIALIZE GAME CALLED!"); 
        console.log("--- initializeGame function started ---"); 
        statusArea.textContent='Generating deck...';playAgainButton.classList.add('hidden');clearHighlightsAndPopups();duelLogElement.innerHTML='';logEvent("New duel started!",true);
        console.log("Log cleared and 'New duel started' logged.");
        fullDeck=generateTarotDeck();
        console.log("generateTarotDeck CALLED. Deck length:", fullDeck.length); 
        if(fullDeck.length!==78){console.error("Deck generation failed. Aborting.",fullDeck);statusArea.textContent="Error: Deck generation failed.";return;}
        shuffleArray(fullDeck);console.log("Deck shuffled.");
        console.log("Full Deck Sample (First 10 with Zodiac & BP):",fullDeck.slice(0,10).map(c=>`${c.name} (${c.zodiacSign}, E:${c.elementSymbol}, BP:${c.currentBP}/${c.maxBP})`));
        playerHand=fullDeck.slice(0,5);aiHand=fullDeck.slice(5,10);gameBoard=Array(GRID_SIZE).fill(null).map(()=>Array(GRID_SIZE).fill(null));currentPlayer=PLAYER_ID;console.log("Hands dealt, board initialized, current player set.");
        statusArea.textContent="Player's turn. Place a card!";logEvent("Player's turn.",true);console.log("Status and log updated for player's turn.");
        renderHand(playerHand,playerHandElement,PLAYER_ID);console.log("Player hand rendered.");
        renderHand(aiHand,aiHandElement,AI_ID);console.log("AI hand rendered.");
        renderBoard();console.log("Game board rendered.");
        disablePlayerHandInteractions(false);console.log("Player interactions enabled. --- initializeGame function finished ---");
    }

    function handleDragStart(event){if(currentPlayer!==PLAYER_ID){event.preventDefault();return;}const ce=event.target.closest('.card');if(!ce||ce.classList.contains('disabled')||ce.closest('#player-hand')!==playerHandElement){event.preventDefault();return;}const ci=parseInt(ce.dataset.cardIndex);if(playerHand[ci]){draggedCardData={card:playerHand[ci],handIndex:ci,ownerId:PLAYER_ID};event.dataTransfer.setData('text/plain',playerHand[ci].name);ce.classList.add('dragging');statusArea.textContent=`Dragging ${playerHand[ci].name}...`;}else{event.preventDefault();}}
    function handleDragEnd(event){const ce=event.target.closest('.card');if(ce)ce.classList.remove('dragging');draggedCardData=null;}
    function handleDragOver(event){if(currentPlayer!==PLAYER_ID)return;event.preventDefault();const tc=event.target.closest('.grid-cell');if(tc){const r=parseInt(tc.dataset.row),c=parseInt(tc.dataset.col);if(r>=0&&r<GRID_SIZE&&c>=0&&c<GRID_SIZE&&!gameBoard[r][c])tc.classList.add('drag-over');}}
    gameBoardElement.addEventListener('dragleave',event=>{if(event.target.classList.contains('grid-cell'))event.target.classList.remove('drag-over');});
    async function handleDrop(event){if(currentPlayer!==PLAYER_ID)return;event.preventDefault();const tc=event.target.closest('.grid-cell');if(tc)tc.classList.remove('drag-over');if(draggedCardData&&tc){const r=parseInt(tc.dataset.row),c=parseInt(tc.dataset.col);if(r>=0&&r<GRID_SIZE&&c>=0&&c<GRID_SIZE&&gameBoard[r][c]===null)await placeCardOnBoard(draggedCardData.card,draggedCardData.handIndex,r,c,draggedCardData.ownerId);else statusArea.textContent='Cell is already occupied or invalid!';}draggedCardData=null;}
    async function placeCardOnBoard(card,handIndex,row,col,ownerId){if(gameBoard[row][col])return;if(card.maxBP===undefined)card.maxBP=DEFAULT_MAX_BP;if(card.currentBP===undefined)card.currentBP=card.maxBP;gameBoard[row][col]={card,owner:ownerId};let pbn=ownerId===PLAYER_ID?'Player':'AI';const pmsg=`${pbn} placed ${card.name} ${ZODIAC_UNICODE[card.zodiacSign]||''} (BP ${card.currentBP}/${card.maxBP}) at (${row},${col}).`;logEvent(pmsg);
    if(ownerId===PLAYER_ID)playerHand.splice(handIndex,1);else aiHand.splice(handIndex,1);
    renderHand(playerHand,playerHandElement,PLAYER_ID);renderHand(aiHand,aiHandElement,AI_ID);renderBoard();
    await resolveFlips(row,col,ownerId,card.name,pbn);
    if(isBoardFull()||(!canAnyPlayerMove()&&(playerHand.length===0||aiHand.length===0))){endGame();return;}
    if(ownerId===PLAYER_ID){if(aiHand.length===0&&playerHand.length>0&&!isBoardFull()){statusArea.textContent="AI has no cards. Player's turn again.";logEvent("AI has no cards. Player's turn again.",true);disablePlayerHandInteractions(false);return;}currentPlayer=AI_ID;statusArea.textContent="AI's turn...";logEvent("AI's turn.",true);disablePlayerHandInteractions(true);setTimeout(aiTakeTurn,1200+Math.random()*1200);}
    else{if(playerHand.length===0&&aiHand.length>0&&!isBoardFull()){statusArea.textContent="Player has no cards. AI's turn again.";logEvent("Player has no cards. AI's turn again.",true);setTimeout(aiTakeTurn,1200+Math.random()*1200);return;}currentPlayer=PLAYER_ID;statusArea.textContent="Player's turn.";logEvent("Player's turn.",true);disablePlayerHandInteractions(false);}}
    function canAnyPlayerMove(){const hec=gameBoard.flat().some(c=>c===null);const pcm=playerHand.length>0&&hec;const acm=aiHand.length>0&&hec;return pcm||acm;}
    async function aiTakeTurn(){if(currentPlayer!==AI_ID||aiHand.length===0||isBoardFull()){if(!isBoardFull()&&playerHand.length>0&&canAnyPlayerMove()){statusArea.textContent="AI cannot play. Player's turn.";logEvent("AI passes. Player's turn.",true);currentPlayer=PLAYER_ID;disablePlayerHandInteractions(false);}else{endGame();}return;}const ctp=aiHand[0];const ci=0;const ec=[];for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++)if(!gameBoard[r][c])ec.push({r,c});if(ec.length>0){const t=ec[Math.floor(Math.random()*ec.length)];await placeCardOnBoard(ctp,ci,t.r,t.c,AI_ID);}else{endGame();}}
    function getOppositeDirection(d){const o={'N':'S','NE':'SW','E':'W','SE':'NW','S':'N','SW':'NE','W':'E','NW':'SE'};return o[d];}
    function getNeighborCoords(r,c,d){const dt={'N':[-1,0],'NE':[-1,1],'E':[0,1],'SE':[1,1],'S':[1,0],'SW':[1,-1],'W':[0,-1],'NW':[-1,-1]};const[dr,dc]=dt[d];const nr=r+dr;const nc=c+dc;if(nr>=0&&nr<GRID_SIZE&&nc>=0&&nc<GRID_SIZE)return[nr,nc];return null;}
    function getElementalBonus(aS,dS){if(aS==='X'||dS==='X')return 0;const ad={'W':'F','F':'A','A':'E','E':'W'};if(ad[aS]===dS)return 2;return 0;}
    function createStatPopup(txt,tgtEl,type){const p=document.createElement('div');p.classList.add('stat-popup',`stat-popup-${type}`);p.textContent=txt;tgtEl.closest('.grid-cell').appendChild(p);activeStatPopups.push(p);void p.offsetWidth;p.classList.add('visible');}
    async function resolveFlips(pR,pC,aOI,oCN,pN){clearHighlightsAndPopups();let cFTT=0;let iS=`${pN} placed ${oCN} ${ZODIAC_UNICODE[gameBoard[pR][pC].card.zodiacSign]||''} (BP ${gameBoard[pR][pC].card.currentBP}/${gameBoard[pR][pC].card.maxBP}) at (${pR},${pC}).`;statusArea.innerHTML=iS;
    let cTPF=[{r:pR,c:pC}];let aCIC=new Set();
    const ED=800,SRD=1500,OD=1000,FD=800;
    while(cTPF.length>0){const cAP=cTPF.shift();const cAK=`${cAP.r}-${cAP.c}`;if(aCIC.has(cAK))continue;aCIC.add(cAK);
    const cACD=gameBoard[cAP.r][cAP.c];if(!cACD||cACD.card.currentBP<=0){if(cACD&&cACD.card.currentBP<=0){let exM=`${cACD.card.name} ${ZODIAC_UNICODE[cACD.card.zodiacSign]||''} is exhausted (BP: 0) and cannot attack.`;statusArea.innerHTML=iS+'<br>'+exM;logEvent(exM);await delay(OD);}continue;}
    const aCard=cACD.card;const aEl=gameBoardElement.querySelector(`.grid-cell[data-row='${cAP.r}'][data-col='${cAP.c}'] .card-on-board`);
    for(const dir of aCard.directions){const nC=getNeighborCoords(cAP.r,cAP.c,dir);if(nC){const[nr,nc]=nC;const dD=gameBoard[nr][nc];const dEl=gameBoardElement.querySelector(`.grid-cell[data-row='${nr}'][data-col='${nc}'] .card-on-board`);
    if(dD&&dD.owner!==cACD.owner&&aEl&&dEl){let cBS=[];const dCard=dD.card;const oD=getOppositeDirection(dir);let flip=false;let bH=false;let bDesc="";
    let aTD='',dTD='';let eB=getElementalBonus(aCard.elementSymbol,dCard.elementSymbol);let eA=aCard.atk+eB;let rD=0;let eBT=eB>0?` (+${eB} Elem)`:"";
    if(aCard.elementSymbol==='X'){aTD='Arcane';rD=Math.min(dCard.pDef,dCard.mDef);dTD=rD===dCard.pDef?'P.Def':'M.Def';}
    else if(aCard.elementSymbol==='F'||aCard.elementSymbol==='A'){aTD='P.Atk';rD=dCard.pDef;dTD='P.Def';}
    else{aTD='M.Atk';rD=dCard.mDef;dTD='M.Def';}
    aEl.classList.add('clash-attacker');dEl.classList.add('clash-defender');let engMsg=`Engaging: ${aCard.name} ${ZODIAC_UNICODE[aCard.zodiacSign]||''} vs ${dCard.name} ${ZODIAC_UNICODE[dCard.zodiacSign]||''}`;cBS.push(engMsg);statusArea.innerHTML=iS+'<br>'+cBS.join('<br>');logEvent(engMsg);await delay(ED);
    createStatPopup(`${aTD}: ${eA}${eBT}`,aEl,'attacker');createStatPopup(`${dTD}: ${rD}`,dEl,'defender');await delay(SRD);
    if(dCard.directions.includes(oD)){bH=true;if(eA>rD){flip=true;bDesc=`<span class="battle-win">beats</span>`;aEl.classList.add('clash-winner');dEl.classList.add('clash-loser','hit-spark');}else{bDesc=`<span class="battle-lose">fails vs</span>`;aEl.classList.add('clash-loser');dEl.classList.add('clash-winner','block-shield');}let clMsg=`${aCard.name} ${ZODIAC_UNICODE[aCard.zodiacSign]||''} (${aTD} ${eA}${eBT}) ${bDesc} ${dCard.name} ${ZODIAC_UNICODE[dCard.zodiacSign]||''} (${dTD} ${rD})!`;cBS.push(clMsg);statusArea.innerHTML=iS+'<br>'+cBS.join('<br>');logEvent(clMsg);}
    else{bH=true;flip=true;bDesc=`is <span class="battle-flank">flanked</span> by`;let flMsg=`${dCard.name} ${ZODIAC_UNICODE[dCard.zodiacSign]||''} ${bDesc} ${aCard.name} ${ZODIAC_UNICODE[aCard.zodiacSign]||''} ! (Auto-flip)`;cBS.push(flMsg);statusArea.innerHTML=iS+'<br>'+cBS.join('<br>');logEvent(flMsg);aEl.classList.add('clash-winner');dEl.classList.add('hit-spark');}
    if(bH)await delay(OD);activeStatPopups.forEach(p=>p.remove());activeStatPopups=[];
    if(flip){aCard.currentBP=Math.max(0,aCard.currentBP-1);logEvent(`${aCard.name} ${ZODIAC_UNICODE[aCard.zodiacSign]||''} BP reduced to ${aCard.currentBP}.`);
    gameBoard[nr][nc].owner=cACD.owner;dCard.currentBP=BP_ON_FLIP;logEvent(`${dCard.name} ${ZODIAC_UNICODE[dCard.zodiacSign]||''} BP reset to ${dCard.currentBP} for new owner.`);
    cFTT++;cTPF.push({r:nr,c:nc});let fMsg=`${dCard.name} ${ZODIAC_UNICODE[dCard.zodiacSign]||''} flipped to ${cACD.owner}'s side!`;cBS.push(fMsg);statusArea.innerHTML=iS+'<br>'+cBS.join('<br>');logEvent(fMsg);
    renderHand(playerHand,playerHandElement,PLAYER_ID);renderHand(aiHand,aiHandElement,AI_ID);renderBoard();await delay(FD);}
    aEl.classList.remove('clash-attacker','clash-winner','clash-loser','hit-spark','block-shield');dEl.classList.remove('clash-defender','clash-winner','clash-loser','hit-spark','block-shield');}}}
    if(aEl)aEl.classList.remove('clash-attacker','clash-winner','clash-loser','hit-spark','block-shield');}
    if(cFTT>0)console.log(`Total cards flipped in chain: ${cFTT}`);clearHighlightsAndPopups();renderBoard();statusArea.innerHTML=iS+(statusArea.innerHTML.includes('<br>')?statusArea.innerHTML.substring(statusArea.innerHTML.indexOf('<br>')):(cFTT>0?"<br>Chain resolved.":"<br>No further flips."));}
    function isBoardFull(){/* ... (no change) ... */ for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++)if(gameBoard[r][c]===null)return false;return true;}
    function countScores(){/* ... (no change) ... */ let pS=0,aS=0;for(let r=0;r<GRID_SIZE;r++)for(let c=0;c<GRID_SIZE;c++)if(gameBoard[r][c])gameBoard[r][c].owner===PLAYER_ID?pS++:aS++;return{playerScore:pS,aiScore:aS};}
    function endGame(){/* ... (no change) ... */ clearHighlightsAndPopups();const s=countScores();let m=`Game Over! Player: ${s.playerScore}, AI: ${s.aiScore}. `;if(s.playerScore>s.aiScore)m+="Player wins!";else if(s.aiScore>s.playerScore)m+="AI wins!";else m+="It's a draw!";statusArea.textContent=m;logEvent(m,true);disablePlayerHandInteractions(true);playAgainButton.classList.remove('hidden');}
    duelButton.addEventListener('click',()=>{splashScreen.classList.add('hidden');gameScreen.classList.remove('hidden');initializeGame();});
    playAgainButton.addEventListener('click',initializeGame);
    playerHandElement.addEventListener('dragstart',handleDragStart);
    playerHandElement.addEventListener('dragend',handleDragEnd);
});