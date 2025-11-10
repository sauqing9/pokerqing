// ===================================
// INISIALISASI ELEMEN (DOM)
// ===================================
// (Sama, tidak berubah)
const screens = document.querySelectorAll('.screen');
const mainMenu = document.getElementById('main-menu');
const botSetup = document.getElementById('bot-setup');
const gameBoard = document.getElementById('game-board');
const btnPlayBot = document.getElementById('btn-play-bot');
const btnStartGame = document.getElementById('btn-start-game');
const btnBackToMenu = document.getElementById('btn-back-to-menu');
const btnSortCards = document.getElementById('btn-sort-cards');
const btnPlayCard = document.getElementById('btn-play-card');
const btnSkipTurn = document.getElementById('btn-skip-turn');
const selectDifficulty = document.getElementById('select-difficulty');
const selectPlayerCount = document.getElementById('select-player-count');
const playerHandElement = document.getElementById('player-hand');
const bot1HandElement = document.getElementById('bot-1-hand');
const bot2HandElement = document.getElementById('bot-2-hand');
const bot3HandElement = document.getElementById('bot-3-hand');
const bot3ContainerElement = document.getElementById('bot-3-container');
const discardPileCardElement = document.getElementById('discard-pile-card');
const gameStatusElement = document.getElementById('current-player-status');
const playPileElement = document.getElementById('play-pile');
const hintControlsElement = document.getElementById('hint-controls');
const playerCardCount = document.getElementById('player-card-count');
const bot1CardCount = document.getElementById('bot-1-card-count');
const bot2CardCount = document.getElementById('bot-2-card-count');
const bot3CardCount = document.getElementById('bot-3-card-count');
const btnResetSort = document.getElementById('btn-reset-sort'); // <-- TAMBAHKAN INI
const btnHintPair = document.getElementById('btn-hint-pair');
const btnHintCombo = document.getElementById('btn-hint-combo');
const hintComboCountElement = document.getElementById('hint-combo-count');
const btnInGameMenu = document.getElementById('btn-in-game-menu');
const inGameMenuOverlay = document.getElementById('in-game-menu-overlay');
const btnMenuBack = document.getElementById('btn-menu-back');
const btnMenuRules = document.getElementById('btn-menu-rules');
const btnMenuRestart = document.getElementById('btn-menu-restart');
const btnMenuMain = document.getElementById('btn-menu-main');
const endGameScreen = document.getElementById('end-game-screen');
const endGameResultsElement = document.getElementById('end-game-results');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnEndGameMainMenu = document.getElementById('btn-end-game-main-menu');
const btnKomboChance = document.getElementById('btn-kombo-chance');
const komboChanceCountElement = document.getElementById('kombo-chance-count');
const btnUnselect = document.getElementById('btn-unselect');

// ===================================
// KONFIGURASI GAME
// ===================================
const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
const SUITS = ['diamond', 'club', 'heart', 'spade'];
const RANK_VALUES = {};
RANKS.forEach((rank, index) => { RANK_VALUES[rank] = index; });
const SUIT_VALUES = {};
SUITS.forEach((suit, index) => { SUIT_VALUES[suit] = index; });
const HIGH_CARD_CUTOFF = RANK_VALUES['Q'] * 4; // Nilai 'Q'
const HIGH_CARD_CUTOFF_HARD = RANK_VALUES['J'] * 4;

// BARU: Hierarki Pangkat 5 Kartu
const COMBO_5_CARD_RANKS = {
    'straight': 1,
    'flush': 2,
    'full-house': 3,
    'straight-flush': 4
};

// ===================================
// GLOBAL GAME STATE
// ===================================
let gameState = {
    difficulty: 'easy',
    playerCount: 4,
    playerHands: [],
    currentPlayerIndex: 0,
    currentPlayPile: [],
    lastPlayerToPlay: -1,
    isFirstTurn: true,
    discardPile: null,
    playerStatus: [],
};

let sortableInstance = null;
let isSortMode = false;
let lastGameWinnerIndex = -1;
let hintPairState = {
    index: 0,
    hints: [] // Akan diisi dengan [combo1, combo2, ...]
};
let hintComboState = {
    index: 0,
    hints: [] // Akan diisi dengan [combo1, combo2, ...]
};
let komboChanceState = { index: 0, hints: [] };

const GAME_STATE_KEY = 'pokerGameStateV39';

// ===================================
// FUNGSI UTAMA GAME (Membuat & Membagi Kartu)
// ===================================
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                rank: rank, suit: suit,
                rankValue: RANK_VALUES[rank], suitValue: SUIT_VALUES[suit],
                value: (RANK_VALUES[rank] * 4) + SUIT_VALUES[suit],
                id: `${rank}-${suit}`
            });
        }
    }
    return deck;
}
function shuffle(deck) {
    let currentIndex = deck.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
    }
    return deck;
}
function dealCards(deck, playerCount) {
    gameState.playerHands = [];
    for (let i = 0; i < playerCount; i++) {
        gameState.playerHands.push([]);
    }
    let cardIndex = 0;
    if (playerCount === 4) {
        while (cardIndex < 52) {
            for (let i = 0; i < playerCount; i++) {
                gameState.playerHands[i].push(deck[cardIndex]);
                cardIndex++;
            }
        }
    } else if (playerCount === 3) {
        while (cardIndex < 51) {
            for (let i = 0; i < playerCount; i++) {
                gameState.playerHands[i].push(deck[cardIndex]);
                cardIndex++;
            }
        }
        gameState.discardPile = deck[51];
        discardPileCardElement.classList.remove('hidden');
        discardPileCardElement.innerHTML = createCardBackHTML();
    }
    for (let i = 0; i < playerCount; i++) {
        gameState.playerHands[i].sort((a, b) => a.value - b.value);
    }
    renderHands(playerCount);
}

// ===================================
// FUNGSI PENENTUAN GILIRAN PERTAMA
// ===================================
function find3sShowWinner(allPlayer3s) {
    const contenders = allPlayer3s.filter(p => p.threes.length > 0);
    if (contenders.length === 0) return null;
    contenders.sort((a, b) => b.threes.length - a.threes.length);
    const topCount = contenders[0].threes.length;
    const topContenders = contenders.filter(p => p.threes.length === topCount);
    if (topContenders.length === 1) {
        return topContenders[0];
    }
    topContenders.forEach(p => {
        p.high3Value = p.threes.sort((a, b) => b.value - a.value)[0].value;
    });
    topContenders.sort((a, b) => b.high3Value - a.high3Value);
    return topContenders[0];
}
function initiatePlayAll3sPhase() {
    let allPlayed3s = [];
    let playerContributions = [];
    let showMessage = "--- FASE BUANG KARTU 3 ---\n";
    showMessage += "Semua pemain mengeluarkan kartu 3...\n\n";

    for (let i = 0; i < gameState.playerCount; i++) {
        const hand = gameState.playerHands[i];
        const threesInHand = hand.filter(card => card.rank === '3');
        if (threesInHand.length > 0) {
            playerContributions.push({ playerIndex: i, threes: threesInHand });
            allPlayed3s.push(...threesInHand);
            gameState.playerHands[i] = hand.filter(card => card.rank !== '3');
        } else {
            playerContributions.push({ playerIndex: i, threes: [] });
        }
        const playerName = (i === 0) ? "Anda" : `Bot ${i}`;
        const cardNames = threesInHand.map(c => c.id).join(', ') || "Tidak Punya";
        showMessage += `Pemain ${playerName}: [ ${cardNames} ]\n`;
    }

    const winner = find3sShowWinner(playerContributions);
    if (winner === null) {
        alert("ERROR! Tidak ada pemain yang punya kartu 3.");
        switchScreen('main-menu');
        return;
    }

    gameState.lastPlayerToPlay = winner.playerIndex;
    gameState.currentPlayerIndex = winner.playerIndex;
    gameState.isFirstTurn = false;
    gameState.currentPlayPile = [];

    const winnerName = (winner.playerIndex === 0) ? "Anda" : `Bot ${winner.playerIndex}`;
    const nextPlayerName = (gameState.currentPlayerIndex === 0) ? "Anda" : `Bot ${gameState.currentPlayerIndex}`;
    showMessage += `\n---> Pemenang Adu 3: ${winnerName}\n`;
    showMessage += `Semua kartu 3 telah dibuang. Permainan dimulai oleh ${nextPlayerName}.`;
    alert(showMessage);

    renderHands(gameState.playerCount);
    renderPlayPile();
    updateGameStatus(`Giliran ${nextPlayerName} (Mulai Permainan)`);

    updateHintButtons(); // <-- TAMBAHKAN INI (V25)

    if (gameState.currentPlayerIndex !== 0) {
        btnPlayCard.disabled = true;
        btnSkipTurn.disabled = true;
        setButtonState('neutral');
        runBotTurn(gameState.currentPlayerIndex);
    } else {
        btnPlayCard.disabled = false;
        btnSkipTurn.disabled = false;
        setButtonState('red');
        validatePlayerSelection();
    }
    saveGameState();
}

/**
 * BARU (V41):
 * Logika untuk memulai game TANPA Adu 3 (dipanggil oleh "Main Lagi")
 */
function skipAdu3Phase(startingPlayerIndex) {
    console.log(`Game dimulai ulang. Juara 1 (Pemain ${startingPlayerIndex}) jalan pertama.`);
    
//     // Hapus semua kartu 3 dari tangan (karena tidak ada fase Adu 3)
//     for (let i = 0; i < gameState.playerCount; i++) {
//         gameState.playerHands[i] = gameState.playerHands[i].filter(card => card.rank !== '3');
//     }
    
    // Atur Juara 1 sebagai pemain pertama
    gameState.lastPlayerToPlay = startingPlayerIndex;
    gameState.currentPlayerIndex = startingPlayerIndex;
    gameState.isFirstTurn = false;
    gameState.currentPlayPile = [];

    const nextPlayerName = (gameState.currentPlayerIndex === 0) ? "Anda" : `Bot ${gameState.currentPlayerIndex}`;
    
    renderHands(gameState.playerCount); // Render tangan (tanpa kartu 3)
    renderPlayPile();
    updateGameStatus(`Giliran ${nextPlayerName} (Mulai Permainan)`);
    updateHintButtons();
    saveGameState(); // Simpan state game baru

    if (gameState.currentPlayerIndex !== 0) {
        btnPlayCard.disabled = true;
        btnSkipTurn.disabled = true;
        runBotTurn(gameState.currentPlayerIndex);
    } else {
        btnPlayCard.disabled = false;
        btnSkipTurn.disabled = false;
        validatePlayerSelection();
    }
}

/**
 * BARU (V41):
 * Fungsi 'wrapper' untuk memulai game baru.
 * Ini menggantikan 90% logika btnStartGame.
 */
function startNewGame(options) {
    // { difficulty, playerCount, startingPlayerIndex }
    clearGameState(); // Wajib hapus save lama

    gameState.difficulty = options.difficulty;
    gameState.playerCount = options.playerCount;
    gameState.isFirstTurn = true;
    gameState.currentPlayPile = [];
    gameState.discardPile = null;
    playPileElement.innerHTML = '';
    discardPileCardElement.classList.add('hidden');
    gameState.playerStatus = new Array(gameState.playerCount).fill(0);
    playerCardCount.textContent = '0';
    bot1CardCount.textContent = '0';
    bot2CardCount.textContent = '0';
    bot3CardCount.textContent = '0';
    
    switchScreen('game-board');
    
    const deck = createDeck();
    const shuffledDeck = shuffle(deck);
    dealCards(shuffledDeck, gameState.playerCount);
    
    // Inisialisasi ulang SortableJS
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = new Sortable(playerHandElement, {
        animation: 150, disabled: true,
        onEnd: (evt) => updateHandOrderFromDOM()
    });
    isSortMode = false; 
    btnSortCards.textContent = "Susun Kartu";
    btnSortCards.style.backgroundColor = "";
    playerHandElement.classList.remove('sorting-mode');
    btnResetSort.classList.add('hidden');
    btnPlayCard.classList.remove('hidden');
    btnSkipTurn.classList.remove('hidden');

    // --- TAMBAHAN (V45) ---
    btnKomboChance.classList.add('hidden');
    btnUnselect.classList.add('hidden');
    // --- AKHIR TAMBAHAN ---

    // Inisialisasi ulang Tombol Hint
    btnHintPair.classList.add('hidden');
    btnHintCombo.classList.add('hidden');
    if (gameState.difficulty === 'easy') {
        btnHintPair.classList.remove('hidden');
        btnHintCombo.classList.remove('hidden'); 
    } else if (gameState.difficulty === 'normal') {
        btnHintPair.classList.remove('hidden');
    }

    // --- LOGIKA INTI V41 ---
    if (options.startingPlayerIndex === -1) {
        // Mulai game normal -> Adu 3
        setTimeout(initiatePlayAll3sPhase, 1000); 
    } else {
        // Mulai game "Main Lagi" -> Juara 1 jalan
        skipAdu3Phase(options.startingPlayerIndex);
    }
}

// ===================================
// FUNGSI LOGIKA KOMBO (OTAK UTAMA)
// ===================================
function getRankCounts(cards) {
    const counts = {};
    for (const card of cards) { counts[card.rank] = (counts[card.rank] || 0) + 1; }
    return counts;
}
function isStraight(cards) {
    if (cards.length < 3) return false;
    for (let i = 1; i < cards.length; i++) {
        if (cards[i].rankValue !== cards[i - 1].rankValue + 1) { return false; }
    }
    return true;
}
function isFlush(cards) {
    if (cards.length === 0) return false;
    const suit = cards[0].suit;
    return cards.every(card => card.suit === suit);
}
function isSeri(cards) {
    if (cards.length !== 3) return false;
    return isStraight(cards) && isFlush(cards);
}
function getComboDetails(cards) {
    if (!cards || cards.length === 0) return { type: 'invalid' };
    cards.sort((a, b) => a.value - b.value);
    const len = cards.length;
    const counts = getRankCounts(cards);
    const ranks = Object.keys(counts);
    if (len === 5) {
        const straight = isStraight(cards);
        const flush = isFlush(cards);
        const highCard = cards[len - 1];
        if (straight && flush) {
            return { type: 'straight-flush', value: highCard.value, cards: cards, isBomb: true };
        }
        if (ranks.length === 2 && (counts[ranks[0]] === 3 || counts[ranks[1]] === 3)) {
            const trisRank = (counts[ranks[0]] === 3) ? ranks[0] : ranks[1];
            const trisHighCard = cards.findLast(c => c.rank === trisRank);
            return { type: 'full-house', value: trisHighCard.value, cards: cards };
        }
        if (flush) {
            return { type: 'flush', value: highCard.value, cards: cards };
        }
        if (straight) {
            return { type: 'straight', value: highCard.value, cards: cards };
        }
        let pairRank = null;
        for (const rank in counts) {
            if (counts[rank] === 2) { pairRank = rank; break; }
        }
        if (pairRank) {
            const otherCards = cards.filter(c => c.rank !== pairRank);
            if (isSeri(otherCards)) {
                return { type: 'seri-buntut', value: otherCards[2].value, cards: cards };
            }
        }
    }
    if (len === 4) {
        if (ranks.length === 1) {
            return { type: '4-of-a-kind', value: cards[3].value, cards: cards, isBomb: true };
        }
        if (ranks.length === 2 && counts[ranks[0]] === 2 && counts[ranks[1]] === 2) {
            const rankVal1 = RANK_VALUES[ranks[0]];
            const rankVal2 = RANK_VALUES[ranks[1]];
            if (Math.abs(rankVal1 - rankVal2) === 1) {
                return { type: 'bro-sis', value: cards[3].value, cards: cards };
            }
        }
    }
    if (len === 3) {
        if (ranks.length === 1) {
            return { type: 'tris', value: cards[2].value, cards: cards };
        }
        if (isStraight(cards) && isFlush(cards)) {
            return { type: 'seri', value: cards[2].value, cards: cards };
        }
    }
    if (len === 2) {
        if (ranks.length === 1) {
            return { type: '1-pair', value: cards[1].value, cards: cards };
        }
    }
    if (len === 1) {
        return { type: 'one-card', value: cards[0].value, cards: cards };
    }
    return { type: 'invalid' };
}

// ===================================
// FUNGSI LOGIKA AI (BOT)
// ===================================

/**
 * DIPERBARUI (dari V9):
 * AI Bot: Mencari SEMUA kombo valid untuk MELAWAN
 * Termasuk Logika BOMB vs '2' dan Hierarki 5-Kartu
 */
function findPossibleCounters(hand, pileCombo) {
    const possiblePlays = [];
    const n = hand.length;
    const pileType = pileCombo.type;
    const pileValue = pileCombo.value;

    // --- BARU: Logika Cek BOMB ---
    const isPileSingleTwo = (
        pileType === 'one-card' &&
        pileCombo.cards[0].rank === '2'
    );

    if (isPileSingleTwo) {
        // Meja adalah '2' tunggal! AI harus cari BOMB.
        console.log("AI: Meja adalah '2' tunggal, mencari Bomb...");
        
        const allCombos = findAllOpeningCombos(hand); // (Kita 'curi' fungsi ini)
        const allBombs = allCombos.filter(c =>
            c.type === '4-of-a-kind' || c.type === 'straight-flush'
        );
        
        if (allBombs.length > 0) {
            allBombs.sort((a, b) => a.value - b.value);
            console.log(`AI: Menemukan ${allBombs.length} Bomb!`);
            return allBombs; // Kembalikan semua Bomb yg mungkin
        }
    }
    // --- AKHIR LOGIKA BOMB ---

    // --- LOGIKA NORMAL (Jika BUKAN '2' tunggal) ---
    const comboLength = pileCombo.cards.length;

    // Fungsi rekursif untuk mencari kombinasi
    function findCombinations(startIndex, currentCombo) {
        if (currentCombo.length === comboLength) {
            const combo = getComboDetails([...currentCombo]);

            if (combo.type === 'invalid') {
                return; // Jika 5 kartu ini bukan kombo, stop & coba kombinasi lain
            }

            // --- Logika Validasi Normal (Hierarki 5-kartu & Tipe-sama) ---
            let isValidPlay = false;

            const pileRank = COMBO_5_CARD_RANKS[pileCombo.type];
            const newRank = COMBO_5_CARD_RANKS[combo.type];

            if (combo.cards.length === 5 && pileCombo.cards.length === 5 && newRank && pileRank) {
                // Hierarki 5 Kartu (Straight < Flush < Full House < Straight Flush)
                if (newRank > pileRank) {
                    isValidPlay = true;
                } else if (newRank === pileRank && combo.value > pileValue) {
                    isValidPlay = true;
                }
            } else if (combo.type === pileType && combo.value > pileValue) {
                // Hierarki Standar (Tipe-sama)
                isValidPlay = true;
            }

            if (isValidPlay) {
                possiblePlays.push(combo);
            }
            // --- Akhir Logika Validasi Normal ---

            return;
        }
        for (let i = startIndex; i < n; i++) {
            currentCombo.push(hand[i]);
            findCombinations(i + 1, currentCombo);
            currentCombo.pop(); // Backtrack
        }
    }
    
    findCombinations(0, []);
    possiblePlays.sort((a, b) => a.value - b.value);
    return possiblePlays;
}


/**
 * DIPERBARUI (V37):
 * AI Bot: Mencari SEMUA kombo untuk MEMULAI
 * (Sekarang menyertakan 'seri', 'bro-sis', '4-of-a-kind', 'seri-buntut')
 */
function findAllOpeningCombos(hand) {
    const allCombos = [];
    const n = hand.length;

    // 1. Cari semua 1-card
    for (let i = 0; i < n; i++) {
        allCombos.push(getComboDetails([hand[i]]));
    }
    // 2. Cari semua 1-pair
    for (let i = 0; i < n - 1; i++) {
        if (hand[i].rank === hand[i+1].rank) {
            allCombos.push(getComboDetails([hand[i], hand[i+1]]));
        }
    }
    // 3. Cari semua 3-card (Tris DAN Seri)
    
    // (Looping manual untuk Tris masih cepat)
    for (let i = 0; i < n - 2; i++) {
        if (hand[i].rank === hand[i+1].rank && hand[i+1].rank === hand[i+2].rank) {
            allCombos.push(getComboDetails([hand[i], hand[i+1], hand[i+2]]));
        }
    }
    // (Rekursif untuk 'Seri' - 3 card straight flush)
    if (n >= 3) {
        function find3CardCombinations(startIndex, currentCombo) {
            if (currentCombo.length === 3) {
                const combo = getComboDetails([...currentCombo]);
                if (combo.type === 'seri') { // Hanya 'seri'
                    allCombos.push(combo);
                }
                return;
            }
            if (startIndex >= n) return;
            for (let i = startIndex; i < n; i++) {
                currentCombo.push(hand[i]);
                find3CardCombinations(i + 1, currentCombo);
                currentCombo.pop();
            }
        }
        find3CardCombinations(0, []);
    }

    // 4. Cari semua 4-card (4-of-a-kind DAN Bro-sis)
    
    // (Looping manual untuk 4-of-a-kind)
    for (let i = 0; i < n - 3; i++) {
        if (hand[i].rank === hand[i+1].rank && hand[i+1].rank === hand[i+2].rank && hand[i+2].rank === hand[i+3].rank) {
            allCombos.push(getComboDetails([hand[i], hand[i+1], hand[i+2], hand[i+3]]));
        }
    }
    // (Rekursif untuk 'Bro-sis')
    if (n >= 4) {
        function find4CardCombinations(startIndex, currentCombo) {
            if (currentCombo.length === 4) {
                const combo = getComboDetails([...currentCombo]);
                if (combo.type === 'bro-sis') { // Hanya 'bro-sis'
                    allCombos.push(combo);
                }
                return;
            }
            if (startIndex >= n) return;
            for (let i = startIndex; i < n; i++) {
                currentCombo.push(hand[i]);
                find4CardCombinations(i + 1, currentCombo);
                currentCombo.pop();
            }
        }
        find4CardCombinations(0, []);
    }
    
    // 5. Cari semua 5-card (Termasuk 'Seri-buntut')
    if (n >= 5) {
        function find5CardCombinations(startIndex, currentCombo) {
            if (currentCombo.length === 5) {
                const combo = getComboDetails([...currentCombo]);
                
                // --- PERBAIKAN DI SINI ---
                if (combo.type === 'straight' || combo.type === 'flush' || 
                    combo.type === 'full-house' || combo.type === 'straight-flush' ||
                    combo.type === 'seri-buntut') { // <-- TAMBAHKAN INI
                    allCombos.push(combo);
                }
                return;
            }
            if (startIndex >= n) return;
            const limit = Math.min(startIndex + (n - startIndex), n); 
            for (let i = startIndex; i < limit; i++) {
                if (allCombos.length > 50) break; // Jangan cari kebanyakan
                
                currentCombo.push(hand[i]);
                find5CardCombinations(i + 1, currentCombo);
                currentCombo.pop();
            }
        }
        find5CardCombinations(0, []);
   }
    
    // 6. Saring yg 'invalid' dan urutkan
    const validCombos = allCombos.filter(c => c.type !== 'invalid');
    
    // Hapus duplikat (penting karena rekursi + loop)
    const uniqueCombos = [];
    const seenCombos = new Set();
    for (const combo of validCombos) {
        const comboId = combo.cards.map(c => c.id).join(',');
        if (!seenCombos.has(comboId)) {
            seenCombos.add(comboId);
            uniqueCombos.push(combo);
        }
    }

    uniqueCombos.sort((a, b) => a.value - b.value);
    return uniqueCombos;
}

/**
 * DIPERBARUI (V36): Otak AI memilih KOMBO PEMBUKA
 * Bot Hard sekarang "Agresif" di Awal (main J,Q,K)
 * dan "Defensif" di Akhir (simpan J,Q,K,A,2).
 */
function chooseOpeningPlay(allOpeners, hand, playerIndex) {
    if (allOpeners.length === 0) return null;

    // --- Cek "End Game" (untuk Bot Hard) ---
    // (Logika V35 ini sudah bagus)
    let isEndGame = false;
    if (gameState.difficulty === 'hard') {
        for (let i = 0; i < gameState.playerCount; i++) {
            if (i !== playerIndex && gameState.playerHands[i].length <= 1 && gameState.playerStatus[i] === 0) {
                isEndGame = true;
                break;
            }
        }
    }
    if (isEndGame) {
        console.log(`Bot ${playerIndex} (Hard): END GAME! Player sisa 1. Main kartu tinggi.`);
        const highPairs = allOpeners.filter(c => c.type === '1-pair' && c.value >= HIGH_CARD_CUTOFF_HARD);
        const highSingles = allOpeners.filter(c => c.type === 'one-card' && c.value >= HIGH_CARD_CUTOFF_HARD && c.cards[0].rank !== '2');
        if (highPairs.length > 0) return highPairs[highPairs.length - 1]; 
        if (highSingles.length > 0) return highSingles[highSingles.length - 1]; 
    }
    // --- AKHIR END GAME ---

    // --- LOGIKA EASY (V33 - Tidak berubah) ---
    if (gameState.difficulty === 'easy') {
        // ... (Logika Easy V33 Anda sudah OK) ...
        const playPair = Math.random() < 0.25; 
        if (playPair) {
            const weakestPair = allOpeners.find(c => c.type === '1-pair');
            if (weakestPair) return weakestPair;
        }
        const weakestCard = allOpeners.find(c => c.type === 'one-card');
        if (weakestCard) return weakestCard;
        return allOpeners[0];
    }
    
    // --- LOGIKA NORMAL (V33 - Tidak berubah) ---
    if (gameState.difficulty === 'normal') {
        // ... (Logika Normal V33 Anda sudah OK) ...
        const allPairs = allOpeners.filter(c => c.type === '1-pair');
        const allTris = allOpeners.filter(c => c.type === 'tris');
        const allSingles = allOpeners.filter(c => c.type === 'one-card');
        if (allPairs.length > 0) {
            if (hand.length > 6) { 
                const safePairs = allPairs.filter(c => c.value < RANK_VALUES['A'] * 4);
                if (safePairs.length > 0) return safePairs[0];
            } else {
                return allPairs[0]; 
            }
        }
        if (allTris.length > 0) return allTris[0];
        if (allSingles.length > 0) return allSingles[0];
        return allOpeners[0];
    }

    // --- LOGIKA SULIT (BARU V36) ---
    if (gameState.difficulty === 'hard') {
        const handSize = hand.length;

        if (handSize <= 5) {
            // --- FASE LATE-GAME (<= 5 Kartu): MAIN AMAN / PASIF ---
            // "simpan kartu gede untuk 2 terakhir"
            // (Gunakan Logika V35: Habiskan kartu di Bawah 'J')
            console.log(`Bot ${playerIndex} (Hard): FASE AKHIR (<=5 kartu). Simpan J+`);
            const lowCardCombos = allOpeners.filter(c => c.cards.every(card => card.value < HIGH_CARD_CUTOFF_HARD));
            
            // Prioritas 1: Habiskan 'low' (5>3>2>1)
            const low5 = lowCardCombos.find(c => c.cards.length === 5);
            if (low5) return low5;
            const lowTris = lowCardCombos.find(c => c.type === 'tris');
            if (lowTris) return lowTris;
            const lowPair = lowCardCombos.find(c => c.type === '1-pair');
            if (lowPair) return lowPair;
            const lowSingle = lowCardCombos.find(c => c.type === 'one-card');
            if (lowSingle) return lowSingle; // Ini adalah setup "Poker + Low Card"

            // Prioritas 2: Terpaksa main 'high' (J+)
            console.log(`Bot ${playerIndex} (Hard): Terpaksa main J+ (Opening)`);
            return allOpeners[0]; // Mainkan kartu J+ terlemah
        
        } else {
            // --- FASE EARLY/MID-GAME (> 5 Kartu): MAIN AGRESIF ---
            // "tetep agresif"
            // Prioritas: Main kombo J,Q,K. Tapi simpan A,2.
            console.log(`Bot ${playerIndex} (Hard): FASE AWAL (>5 kartu). Agresif.`);
            const isSafeCard = (card) => card.rank !== 'A' && card.rank !== '2';

            // Cari kombo "Aman" (5-card APAPUN, atau kombo lain tanpa A/2)
            const safeOpeners = allOpeners.filter(c => 
                c.cards.length === 5 || c.cards.every(isSafeCard)
            );

            // Prioritas 1: Mainkan kombo "Aman" (5>3>2>1)
            const safe5 = safeOpeners.find(c => c.cards.length === 5);
            if (safe5) return safe5;
            const safeTris = safeOpeners.find(c => c.type === 'tris');
            if (safeTris) return safeTris;
            const safePair = safeOpeners.find(c => c.type === '1-pair');
            if (safePair) return safePair;
            const safeSingle = safeOpeners.find(c => c.type === 'one-card');
            if (safeSingle) return safeSingle;

            // Prioritas 2: Terpaksa mainkan kombo A/2
            console.log(`Bot ${playerIndex} (Hard): Terpaksa main A/2 (Opening)`);
            return allOpeners[0]; // Mainkan A/2 terlemah
        }
    }
    
    return allOpeners[0]; // Fallback
}

/**
 * DIPERBARUI (V36): Otak AI memilih KARTU LAWAN
 * Bot Hard sekarang "Agresif" di Awal (main J,Q,K)
 * dan "Defensif" di Akhir (simpan J,Q,K,A,2).
 */
function chooseCounterPlay(allCounters, pileCombo, playerIndex) {
    if (allCounters.length === 0) return null;
    
    // --- LOGIKA EASY (V33 - Tidak berubah) ---
    if (gameState.difficulty === 'easy') {
        // ... (Logika Easy V33 Anda sudah OK) ...
        if (pileCombo.type === '1-pair' && pileCombo.value >= RANK_VALUES['Q'] * 4) {
            return null; 
        }
        if (pileCombo.cards.length >= 3 && pileCombo.cards.length <= 4) {
            if (Math.random() < 0.7) return null;
        }
        if (pileCombo.cards.length === 5) {
            if (Math.random() < 0.9) return null;
        }
        return allCounters[0];
    }
    
    // --- LOGIKA NORMAL (V33 - Tidak berubah) ---
    if (gameState.difficulty === 'normal') {
        // ... (Logika Normal V33 Anda sudah OK) ...
        if (pileCombo.cards.length >= 3 && pileCombo.cards.length <= 4) {
            if (Math.random() < 0.3) return null;
        }
        if (pileCombo.cards.length === 5) {
            if (Math.random() < 0.5) return null;
        }
        return allCounters[0];
    }
    
    // --- LOGIKA SULIT (BARU V36) ---
    if (gameState.difficulty === 'hard') {
        const handSize = gameState.playerHands[playerIndex].length;

        // Cek "End Game" (Logika V35 - sudah OK)
        let isEndGame = false;
        for (let i = 0; i < gameState.playerCount; i++) {
            if (i !== playerIndex && gameState.playerHands[i].length <= 1 && gameState.playerStatus[i] === 0) {
                isEndGame = true;
                break;
            }
        }
        if (isEndGame) {
            console.log(`Bot ${playerIndex} (Hard): END GAME! Player sisa 1. Agresif!`);
            return allCounters[0]; // Lawan dengan APAPUN
        }

        if (handSize <= 5) {
            // --- FASE LATE-GAME (<= 5 Kartu): MAIN AMAN / PASIF ---
            // "simpan kartu gede untuk 2 terakhir"
            // (Gunakan Logika V35: Simpan J,Q,K,A,2)
            console.log(`Bot ${playerIndex} (Hard): FASE AKHIR (<=5 kartu). Simpan J+`);
            const lowCardCounters = allCounters.filter(c => c.cards.every(card => card.value < HIGH_CARD_CUTOFF_HARD));
        
            if (lowCardCounters.length > 0) {
                return lowCardCounters[0]; // Punya counter aman (di bawah J)
            }
            
            // Jika tidak ada counter 'low', kita terpaksa pakai 'high' (J+)
            // Lawan main J+? (HIGH_CARD_CUTOFF_HARD)
            if (pileCombo.value >= HIGH_CARD_CUTOFF_HARD) { 
                console.log(`Bot ${playerIndex} (Hard): Terpaksa main J+ (lawan ${pileCombo.type} ${pileCombo.value})`);
                return allCounters[0]; // Mainkan high card terlemah
            } else {
                console.log(`Bot ${playerIndex} (Hard): Lawan ${pileCombo.type} (value ${pileCombo.value}), tapi saya simpan J+. SKIP.`);
                return null; // SKIP
            }

        } else {
            // --- FASE EARLY/MID-GAME (> 5 Kartu): MAIN AGRESIF ---
            // "tetep agresif"
            // Prioritas: Lawan dengan J,Q,K. Tapi simpan A,2.
            console.log(`Bot ${playerIndex} (Hard): FASE AWAL (>5 kartu). Agresif.`);
            const isSafeCard = (card) => card.rank !== 'A' && card.rank !== '2';
         
            // Cari counter "Aman" (5-card APAPUN, atau kombo lain tanpa A/2)
            const safeCounters = allCounters.filter(c => 
                c.cards.length === 5 || c.cards.every(isSafeCard)
            );

            if (safeCounters.length > 0) {
                return safeCounters[0]; // Punya counter aman (non-A/2)
         }

            // Jika terpaksa main A/2 (karena lawan main kartu tinggi)
            if (pileCombo.value >= HIGH_CARD_CUTOFF) { // Lawan Q+
                console.log(`Bot ${playerIndex} (Hard): Terpaksa main A/2 (Counter)`);
                return allCounters[0]; // Mainkan A/2 terlemah
            } else {
                // Lawan main kartu rendah, tapi kita cuma punya A/2
                console.log(`Bot ${playerIndex} (Hard): Lawan ${pileCombo.type} (value ${pileCombo.value}), tapi saya simpan A/2. SKIP.`);
                return null; // SKIP
            }
        }
    }
    
    return allCounters[0]; // Fallback
}


/**
 * DIPERBARUI (Perbaikan Bug V10):
 * Menjalankan giliran Bot
 */
function runBotTurn(playerIndex) {
    console.log(`Bot ${playerIndex} (${gameState.difficulty}) sedang berpikir...`);
    const hand = gameState.playerHands[playerIndex];
    const pileCombo = gameState.currentPlayPile.length > 0 ? getComboDetails(gameState.currentPlayPile) : null;
    
    let playToMake = null;

    // --- INI PERBAIKANNYA ---
    if (pileCombo && pileCombo.type !== 'invalid') {
        // --- LOGIKA MELAWAN KARTU ---
        // 'pileCombo' adalah kombo valid, cari kartu lawan
        const allCounters = findPossibleCounters(hand, pileCombo);
        playToMake = chooseCounterPlay(allCounters, pileCombo, playerIndex);
    
    } else {
        // --- LOGIKA BABAK BARU (MEJA KOSONG) ---
        // (Ini terjadi jika pileCombo 'null' ATAU 'invalid')
        const allOpeners = findAllOpeningCombos(hand);
        playToMake = chooseOpeningPlay(allOpeners, hand, playerIndex);
    }

    // --- TAMBAHAN BARU (V34): VALIDASI KARTU '2' UNTUK BOT ---
    if (playToMake) { // Jika Bot menemukan sebuah langkah
        const remainingCardsCount = hand.length - playToMake.cards.length;

        // Cek 1: Apakah ini langkah terakhir? (Logika V32)
        if (remainingCardsCount === 0) {
            const isAllTwos = playToMake.cards.every(card => card.rank === '2');
            if (isAllTwos && playToMake.cards.length < 5) {
                console.log(`Bot ${playerIndex}: MAU JALAN ${playToMake.type} ('2') TAPI ILEGAL (Finish). SKIP.`);
                playToMake = null; // Batalkan! Paksa Skip.
            }
        }

        // Cek 2: Apakah langkah ini AKAN MENYISAKAN satu kartu '2'? (Logika V32)
        if (remainingCardsCount === 1) {
            // Temukan kartu yang TIDAK diseleksi
            const remainingCard = hand.find(handCard => {
                return !playToMake.cards.some(selectedCard => selectedCard.id === handCard.id);
            });

            if (remainingCard && remainingCard.rank === '2') {
                console.log(`Bot ${playerIndex}: MAU JALAN ${playToMake.type} TAPI AKAN NYISA '2'. ILEGAL. SKIP.`);
                playToMake = null; // Batalkan! Paksa Skip.
            }
        }
    }
    // --- AKHIR VALIDASI V34 ---
    
    // Eksekusi pilihan
    if (playToMake) 
    {
        // --- BARU: Cek Logika BOMB WIN untuk Bot ---
        // (Kita perlu cek 'pileCombo' di sini SEBELUM 'setTimeout')
        const isBotBombing = (
            playToMake.type === 'straight-flush' || 
            playToMake.type === '4-of-a-kind'
        );
        const isPileSingleTwo = (
            pileCombo && // Pastikan pileCombo tidak null
            pileCombo.type === 'one-card' && 
            pileCombo.cards[0].rank === '2'
        );

        if (isBotBombing && isPileSingleTwo) {
            // Bot menang via BOMB!
            console.log(`Bot ${playerIndex}: BOMB WIN!`);
            setTimeout(() => {
                handleBombWin(playerIndex, playToMake);
            }, 1000 + Math.random() * 1000);
            return; // HENTIKAN eksekusi! Jangan panggil playCards() normal.
        }
        // --- AKHIR LOGIKA BOMB WIN ---

        // Bot memilih 'JALAN' (Normal, BUKAN bomb win)
        setTimeout(() => {
            console.log(`Bot ${playerIndex} memainkan ${playToMake.type} (value: ${playToMake.value})`);
            playCards(playerIndex, playToMake.cards);
        }, 1000 + Math.random() * 1000);
        
    } else {
        // Bot memilih 'SKIP'
        setTimeout(() => {
            console.log(`Bot ${playerIndex} memilih 'Skip'.`);
            skipTurn(playerIndex);
        }, 1000);
    }
}


// ===================================
// FUNGSI AKSI (Jalan, Skip, Giliran)
// ===================================
// (Sama, tidak berubah)
function playCards(playerIndex, cardsToPlay) {
    const combo = getComboDetails(cardsToPlay);
    gameState.currentPlayPile = combo.cards;
    gameState.lastPlayerToPlay = playerIndex;
    gameState.turnHistory = [playerIndex];
    
    gameState.playerHands[playerIndex] = gameState.playerHands[playerIndex].filter(card => {
        return !cardsToPlay.some(playedCard => playedCard.id === card.id);
    });
    
    // 1. RENDER KARTU KEMENANGAN & TANGAN KOSONG
    // Ini akan diproses oleh browser SEBELUM setTimeout.
    renderHands(gameState.playerCount);
    renderPlayPile();
    // saveGameState();
    
    if (gameState.isFirstTurn) { gameState.isFirstTurn = false; }

    // --- BLOK LOGIKA KEMENANGAN (DIMODIFIKASI) ---
    if (gameState.playerHands[playerIndex].length === 0) {
        
        // Cek dulu apakah dia memang 'baru' selesai
        if (gameState.playerStatus[playerIndex] === 0) { 
            
            // --- MULAI PERUBAHAN V28 ---
            // Bungkus SEMUA logika kemenangan di setTimeout.
            // Ini memaksa browser me-render tumpukan kartu (di atas)
            // SEBELUM alert() yang memblokir dijalankan.
            setTimeout(() => {
                
                // 2. Hitung dia juara ke berapa
                const finishedCount = gameState.playerStatus.filter(s => s > 0).length;
                const newRank = finishedCount + 1;
                gameState.playerStatus[playerIndex] = newRank; 

                const playerName = (playerIndex === 0) ? "Anda" : `Bot ${playerIndex}`;
                console.log(`Pemain ${playerIndex} selesai sebagai Juara ${newRank}`);
               
                // 3. TAMPILKAN ALERT (Kartu masih terlihat di meja)
               alert(`🎉 ${playerName} Selesai! Juara ${newRank}! 🎉`);

                // 4. SETELAH ALERT DITUTUP, jalankan "Waris"
                console.log("WARIS: Meja dibersihkan untuk pemain berikutnya.");
                gameState.currentPlayPile = [];
                renderPlayPile(); // Update UI agar meja terlihat kosong

                // 5. Cek apakah game berakhir
                if (newRank === gameState.playerCount - 1) {
                    const loserIndex = gameState.playerStatus.findIndex(s => s === 0);
                    const loserName = (loserIndex === 0) ? "Anda" : `Bot ${loserIndex}`;
                    
                    let resultsMessage = "--- HASIL AKHIR ---\n";
                    for (let r = 1; r <= newRank; r++) {
                        const pIdx = gameState.playerStatus.findIndex(s => s === r);
                        const pName = (pIdx === 0) ? "Anda" : `Bot ${pIdx}`;
                        resultsMessage += `Juara ${r}: ${pName}\n`;
                    }
                    resultsMessage += `\nKalah: ${loserName}`;

                    setTimeout(() => {
                        clearGameState(); // Hapus save game
                        // Cari Juara 1 (pemenang)
                        lastGameWinnerIndex = gameState.playerStatus.findIndex(s => s === 1);
                        endGameResultsElement.innerText = resultsMessage;
                        switchScreen('end-game-screen');
                    }, 500);
                    return; // Game Benar-benar Selesai. Stop.
                }
                
                // 6. Jika game belum selesai, panggil nextTurn()
                nextTurn();

            }, 100); // 100ms delay sudah cukup bagi browser untuk me-render
            // --- AKHIR PERUBAHAN V28 ---

            // PENTING: Hentikan eksekusi playCards() di sini.
            // Jangan biarkan nextTurn() di bawah ikut berjalan.
            return; 
        }
    }
    
    // Jika BUKAN pemenang, jalankan nextTurn() seperti biasa.
    nextTurn();
}

function handleBombWin(playerIndex, bombCombo) {
    const winnerName = (playerIndex === 0) ? "KAMU" : `Bot ${playerIndex}`;
    const comboName = bombCombo.type === '4-of-a-kind' ? "4-of-a-Kind" : "Straight Flush";
    
    console.log(`!!! GAME OVER (BOMB): Player ${playerIndex} WINS !!!`);

    // Tampilkan bomb-nya di meja agar terlihat
    gameState.currentPlayPile = bombCombo.cards;
    renderPlayPile(); // Update UI
    
    // Nonaktifkan semua tombol selagi menunggu alert
    btnPlayCard.disabled = true;
    btnSkipTurn.disabled = true;

    // Tentukan siapa saja yang kalah
    let losers = [];
    for (let i = 0; i < gameState.playerCount; i++) {
        if (i !== playerIndex) { // Jika bukan si pemenang
            const loserName = (i === 0) ? "Anda" : `Bot ${i}`;
            losers.push(loserName);
        }
    }
    
    const losersString = losers.join(', ');

    const alertMessage = `🔥 GAME OVER (BOMB!) 🔥\n\n` +
                         `${winnerName} MENGALAHKAN '2' TUNGGAL DENGAN ${comboName}!\n\n` +
                         `--- HASIL AKHIR ---\n` +
                         `Pemenang: ${winnerName}\n` +
                         `Kalah: ${losersString}`;

    // Beri jeda sedikit agar pemain bisa melihat apa yang terjadi
    setTimeout(() => {
        clearGameState(); // Hapus save game
        lastGameWinnerIndex = playerIndex; // Pemenang adalah si pengebom
        endGameResultsElement.innerText = alertMessage; // Tampilkan hasil
        switchScreen('end-game-screen');
    }, 800);
    
    // PENTING: Tidak ada lagi nextTurn(). Game berhenti di sini.
}

function skipTurn(playerIndex) {
    console.log(`Pemain ${playerIndex} 'Skip'`);
    if (!gameState.turnHistory.includes(playerIndex)) {
         gameState.turnHistory.push(playerIndex);
    }
    // saveGameState();
    nextTurn();
}
function nextTurn() {
    let nextPlayer = gameState.currentPlayerIndex;
    let attempts = 0; // Safety net
    
    do {
        nextPlayer = (nextPlayer + 1) % gameState.playerCount;
        attempts++;
        // Loop jika pemain berikutnya sudah selesai ATAU jika game butuh N loop
    } while (gameState.playerStatus[nextPlayer] > 0 && attempts <= gameState.playerCount);

    // (Safety check jika semua pemain 'selesai' tapi game belum berhenti)
    if (attempts > gameState.playerCount) {
        console.error("Error di nextTurn: Tidak menemukan pemain yang masih main.");
        switchScreen('main-menu');
        return;
    }
    
    gameState.currentPlayerIndex = nextPlayer;
    // --- AKHIR LOGIKA BARU ---

    if (gameState.lastPlayerToPlay === nextPlayer) {
        console.log("Babak baru! Tumpukan dibersihkan.");
        gameState.currentPlayPile = [];
        gameState.turnHistory = [nextPlayer]; // Reset history
        renderPlayPile();
    }
    
    const playerName = (nextPlayer === 0) ? 'Anda' : `Bot ${nextPlayer}`;
    updateGameStatus(`Giliran ${playerName}`);
    
    updateHintButtons();

    if (nextPlayer === 0) {
        btnPlayCard.disabled = false;
        btnSkipTurn.disabled = false;
        setButtonState('red');
        validatePlayerSelection();
    } else {
        btnPlayCard.disabled = true;
        btnSkipTurn.disabled = true;
        setButtonState('neutral');    
        runBotTurn(nextPlayer);
    }
    saveGameState();
}


// ===================================
// FUNGSI TAMPILAN (RENDER)
// ===================================
// (Sama, tidak berubah)
function renderHands(playerCount) {
    // 1. Render Tangan Pemain (Player 0)
    playerHandElement.innerHTML = '';
    gameState.playerHands[0].forEach(card => {
        playerHandElement.innerHTML += createCardElement(card);
    });
    // Update hitungan pemain
    playerCardCount.textContent = gameState.playerHands[0].length;

    // 2. Render Tangan Bot (Bot 1, 2, 3)
    const botHandElements = [bot1HandElement, bot2HandElement, bot3HandElement];
    const botCardCounts = [bot1CardCount, bot2CardCount, bot3CardCount];

    for (let i = 1; i < playerCount; i++) {
        const handEl = botHandElements[i - 1];
        const countEl = botCardCounts[i - 1];
        
        handEl.innerHTML = ''; // Kosongkan tangan
        const handLength = gameState.playerHands[i].length;
        
        // Update hitungan kartu (TEKS ANGKA)
        countEl.textContent = handLength; 
        
        // Render semua kartu belakang (TUMPUKAN KARTU)
        for (let j = 0; j < handLength; j++) {
            handEl.innerHTML += createCardBackHTML();
        }
    }

    // 3. Sembunyikan/Tampilkan area Bot 3
    if (playerCount === 3) {
        bot3ContainerElement.classList.add('hidden'); // Gunakan container baru
        bot3CardCount.textContent = 'X'; // Tandai tidak main
    } else {
        bot3ContainerElement.classList.remove('hidden'); // Gunakan container baru
    }
    
    addCardClickListeners();
}

/**
 * ===================================
 * FUNGSI SAVE/LOAD STATE (BARU V39)
 * ===================================
 */

/**
 * (V39) Menyimpan state game saat ini ke localStorage
 */
function saveGameState() {
    // Hanya simpan jika game sedang berjalan
    if (gameState.playerHands.length > 0) {
        try {
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
            console.log("Game state saved.");
        } catch (e) {
            console.error("Gagal menyimpan game state:", e);
        }
    }
}

/**
 * (V39) Menghapus state game dari localStorage
 */
function clearGameState() {
    localStorage.removeItem(GAME_STATE_KEY);
    console.log("Game state cleared.");
}

/**
 * (V39) Otak utama: Mencoba memuat game saat halaman dibuka
 */
function loadAndResumeGame() {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    
    // Jika TIDAK ADA save file, tampilkan main menu
    if (!savedState) {
        switchScreen('main-menu'); 
        return;
    }

    console.log("Memuat game tersimpan...");
    try {
        gameState = JSON.parse(savedState);
    } catch (e) {
        console.error("Gagal memuat save state:", e);
        clearGameState();
        switchScreen('main-menu');
        return;
    }

    // --- LOGIKA MELANJUTKAN GAME ---
    // (Mirip dengan btnStartGame, tapi pakai data yg diload)
    
    // 1. Pindah layar
    switchScreen('game-board');

    // 2. Render ulang papan
    renderHands(gameState.playerCount);
    renderPlayPile();

    // 3. Inisialisasi ulang SortableJS (WAJIB)
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = new Sortable(playerHandElement, {
        animation: 150,
        disabled: true,
        onEnd: (evt) => updateHandOrderFromDOM()
    });
    isSortMode = false;
    
    // 4. Reset tombol susun (V24 logic)
    btnSortCards.textContent = "Susun Kartu";
    btnSortCards.style.backgroundColor = "";
    playerHandElement.classList.remove('sorting-mode');
    btnResetSort.classList.add('hidden');
    btnPlayCard.classList.remove('hidden');
    btnSkipTurn.classList.remove('hidden');

    // 5. Inisialisasi ulang Tombol Hint (V26 logic)
    btnHintPair.classList.add('hidden');
    btnHintCombo.classList.add('hidden');
    if (gameState.difficulty === 'easy') {
        btnHintPair.classList.remove('hidden');
        btnHintCombo.classList.remove('hidden'); 
    } else if (gameState.difficulty === 'normal') {
        btnHintPair.classList.remove('hidden');
    }

    // 6. Update status giliran & validasi
    const playerName = (gameState.currentPlayerIndex === 0) ? 'Anda' : `Bot ${gameState.currentPlayerIndex}`;
    updateGameStatus(`Giliran ${playerName}`);
    updateHintButtons(); // Ini juga memanggil updatePlayerHandInteractiveness

    // 7. Cek giliran siapa
    if (gameState.currentPlayerIndex === 0) {
        // Giliran Anda
        btnPlayCard.disabled = false;
        btnSkipTurn.disabled = false;
        validatePlayerSelection(); // Cek kartu yg mungkin sudah di-select
    } else {
        // Giliran Bot
        btnPlayCard.disabled = true;
        btnSkipTurn.disabled = true;
        setButtonState('neutral');
        runBotTurn(gameState.currentPlayerIndex); // LANJUTKAN GILIRAN BOT
    }
}

function renderPlayPile() {
    playPileElement.innerHTML = '';
    if (gameState.discardPile && gameState.playerCount === 3 && gameState.currentPlayPile.length === 0) {
        discardPileCardElement.classList.remove('hidden');
        discardPileCardElement.innerHTML = createCardBackHTML();
        playPileElement.appendChild(discardPileCardElement);
    }
    gameState.currentPlayPile.forEach(card => {
        playPileElement.innerHTML += createCardElement(card);
    });
}
function createCardElement(card) {
    const suitSymbols = { 'diamond': '♦', 'club': '♣', 'heart': '♥', 'spade': '♠' };
    const color = (card.suit === 'diamond' || card.suit === 'heart') ? 'red' : 'black';
    return `
        <div class="card ${color}" data-id="${card.id}" data-value="${card.value}">
            <span class="rank">${card.rank}</span>
            <span class="suit">${suitSymbols[card.suit]}</span>
            <span class="rank-bottom">${card.rank}</span>
        </div>
    `;
}
function createCardBackHTML() {
    return `<div class="card-back"></div>`;
}
function addCardClickListeners() {
    const cards = playerHandElement.querySelectorAll('.card');
    cards.forEach(cardElement => {
        cardElement.addEventListener('click', () => {
            cardElement.classList.toggle('selected');
            validatePlayerSelection();
            updateUnselectButtonState();
        });
    });
}
function sortPlayerHand() {
    gameState.playerHands[0].sort((a, b) => a.value - b.value);
    renderHands(gameState.playerCount);
}

function updateHandOrderFromDOM() {
    console.log("Menyimpan urutan kartu baru...");
    const cardElements = playerHandElement.querySelectorAll('.card');
    const newHandOrder = [];
    
    cardElements.forEach(cardEl => {
        const cardId = cardEl.getAttribute('data-id');
        // Cari data kartu di gameState berdasarkan ID
        const cardData = gameState.playerHands[0].find(c => c.id === cardId);
        if (cardData) {
            newHandOrder.push(cardData);
        }
    });
    
    // Ganti array lama di gameState dengan array baru yang sudah terurut
    gameState.playerHands[0] = newHandOrder;
    saveGameState();
}

function switchScreen(screenId) {
    screens.forEach(screen => {
        if (screen.id === screenId) {
            screen.classList.add('active');
            screen.classList.remove('hidden');
        } else {
            screen.classList.add('hidden');
            screen.classList.remove('active');
        }
    });
}
function updateGameStatus(text) {
    gameStatusElement.textContent = text;
}


// ===================================
// EVENT LISTENERS UTAMA
// ===================================

btnPlayBot.addEventListener('click', () => switchScreen('bot-setup'));
btnBackToMenu.addEventListener('click', () => switchScreen('main-menu'));

btnInGameMenu.addEventListener('click', () => {
    inGameMenuOverlay.classList.remove('hidden');
    inGameMenuOverlay.classList.add('active');
});

// Sembunyikan Menu Jeda (Tombol "Back")
btnMenuBack.addEventListener('click', () => {
    inGameMenuOverlay.classList.add('hidden');
    inGameMenuOverlay.classList.remove('active');
});

// Tombol "Rules"
btnMenuRules.addEventListener('click', () => {
    window.open('https://sauqing9.github.io/poker-rules/', '_blank');
});

// Tombol "Main Menu"
btnMenuMain.addEventListener('click', () => {
    clearGameState();
    inGameMenuOverlay.classList.add('hidden');
    inGameMenuOverlay.classList.remove('active');
    switchScreen('main-menu');
});

// Tombol "Restart"
btnMenuRestart.addEventListener('click', () => {
    console.log("Restarting game...");
    inGameMenuOverlay.classList.add('hidden');
    inGameMenuOverlay.classList.remove('active');
    
    // Cara tercepat & terbersih untuk Restart:
    // Panggil saja listener "Start Game" lagi.
    // Dia akan otomatis mengambil setting (Easy/Normal, 4 Player) yg terakhir.
    btnStartGame.click();
});

// (Sama, tidak berubah)
// INI KODE V41 YANG BENAR
btnStartGame.addEventListener('click', () => {
    const difficulty = selectDifficulty.value;
    const playerCount = parseInt(selectPlayerCount.value, 10);
    lastGameWinnerIndex = -1; // Reset pemenang

    const options = {
        difficulty: difficulty,
        playerCount: playerCount,
        startingPlayerIndex: -1 // -1 berarti "jalankan Adu 3"
    };
    startNewGame(options);
});

/**
 * DIPERBARUI (V45):
 * Tombol "Susun Kartu" sekarang mengaktifkan mode susun V45
 */
btnSortCards.addEventListener('click', () => {
    isSortMode = !isSortMode; // Toggle mode
    
    if (isSortMode) {
        // --- MASUK KE MODE SUSUN ---
        
        // 1. Aktifkan drag-drop
        sortableInstance.option('disabled', false); 
        
        // 2. Ubah tombol
        btnSortCards.textContent = "✅ Selesai Susun";
        btnSortCards.style.backgroundColor = "#4CAF50"; 
        
        // 3. Sembunyikan tombol game & hint
        btnPlayCard.classList.add('hidden');
        btnSkipTurn.classList.add('hidden');
        btnHintPair.classList.add('hidden');
        btnHintCombo.classList.add('hidden');
        
        // 4. Tampilkan tombol susun
        btnResetSort.classList.remove('hidden');
        btnUnselect.classList.remove('hidden');
        
        // 5. Tampilkan "Kombo Chance" jika Easy
        if (gameState.difficulty === 'easy') {
            updateKomboChanceButton(); // Hitung kombo
            btnKomboChance.classList.remove('hidden');
        }
        
        // 6. Beri style pada tangan & nonaktifkan disabling (V45)
        playerHandElement.classList.add('sorting-mode');
        playerHandElement.querySelectorAll('.card').forEach(c => c.classList.remove('disabled'));
        
        // 7. Deselect semua kartu & update tombol Unselect
        playerHandElement.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
        updateUnselectButtonState(); // Akan disable tombol Unselect

   } else {
        // --- KELUAR DARI MODE SUSUN ---
        
        // 1. Matikan drag-drop
        sortableInstance.option('disabled', true); 
        
        // 2. Kembalikan tombol
        btnSortCards.textContent = "Susun Kartu";
        btnSortCards.style.backgroundColor = "";
        
        // 3. Tampilkan tombol game
        btnPlayCard.classList.remove('hidden');
        btnSkipTurn.classList.remove('hidden');
        
        // 4. Tampilkan HINT yg sesuai (Logika V26)
        if (gameState.difficulty === 'easy') {
            btnHintPair.classList.remove('hidden');
            btnHintCombo.classList.remove('hidden'); 
        } else if (gameState.difficulty === 'normal') {
            btnHintPair.classList.remove('hidden');
     }
        
        // 5. Sembunyikan tombol susun
        btnResetSort.classList.add('hidden');
        btnKomboChance.classList.add('hidden');
        btnUnselect.classList.add('hidden');
        
        // 6. Hapus style & simpan
       playerHandElement.classList.remove('sorting-mode');
        updateHandOrderFromDOM();

        // 7. PENTING: Terapkan kembali disabling kartu & state tombol
        updatePlayerHandInteractiveness(); 
        validatePlayerSelection();
    }
});

/**
 * DIPERBARUI (dari V9):
 * Tombol "Jalan" (Logika BOMB vs '2' dan Hierarki 5-Kartu)
 */
btnPlayCard.addEventListener('click', () => {
    // 1. Ambil kartu yg dipilih
    const selectedElements = playerHandElement.querySelectorAll('.card.selected');
    if (selectedElements.length === 0) {
        alert("Pilih kartu untuk 'Jalan'!");
        return;
    }
    const selectedCards = [];
    selectedElements.forEach(el => {
        const cardId = el.getAttribute('data-id');
        const card = gameState.playerHands[0].find(c => c.id === cardId);
        selectedCards.push(card);
    });
    
    // 2. Validasi kombo
    const newCombo = getComboDetails(selectedCards);
    if (newCombo.type === 'invalid') {
        alert("Kombinasi kartu tidak valid!");
        return;
    }

    // --- VALIDASI KARTU '2' TERAKHIR (V32) ---
    const remainingCardsCount = gameState.playerHands[0].length - selectedCards.length;
    
    // Cek 1: Apakah ini langkah terakhir? (Logika V31 lama)
    if (remainingCardsCount === 0) {
         const isAllTwos = selectedCards.every(card => card.rank === '2');
         if (isAllTwos && newCombo.cards.length < 5) {
             alert("Tidak boleh menyelesaikan permainan dengan kartu 2 (single/pair/tris)!");
             return;
         }
    }

    // Cek 2: Apakah langkah ini AKAN MENYISAKAN satu kartu '2'? (Logika V32 BARU)
    if (remainingCardsCount === 1) {
        const remainingCard = gameState.playerHands[0].find(handCard => {
            return !selectedCards.some(selectedCard => selectedCard.id === handCard.id);
        });
        
        if (remainingCard && remainingCard.rank === '2') {
             alert("Tidak boleh menyisakan 1 kartu '2' (poker) di tangan!");
             return; // Hentikan permainan
    T   }
    }
    // --- AKHIR VALIDASI V32 ---
    
    // 3. Validasi lawan kartu di meja
    if (gameState.currentPlayPile.length > 0) {
        const pileCombo = getComboDetails(gameState.currentPlayPile);
        
        let isValidPlay = false;

        // --- BARU: Cek Logika BOMB ---
        const isNewComboBomb = (
            newCombo.type === 'straight-flush' || 
            newCombo.type === '4-of-a-kind'
        );
        const isPileSingleTwo = (
            pileCombo.type === 'one-card' && 
            pileCombo.cards[0].rank === '2'
        );

        if (isNewComboBomb && isPileSingleTwo) {
            // Pemain nge-BOMB kartu '2' tunggal
            console.log("Pemain: BOMB WIN!");
            handleBombWin(0, newCombo); // Panggil fungsi menang (Player 0)
            return; // HENTIKAN eksekusi! Jangan panggil playCards() normal.
        } 
        // --- AKHIR LOGIKA BOMB ---
        else {
            // --- LOGIKA NORMAL (Hierarki 5-kartu & Tipe-sama) ---
            const pileRank = COMBO_5_CARD_RANKS[pileCombo.type];
            const newRank = COMBO_5_CARD_RANKS[newCombo.type];
            
            if (newCombo.cards.length === 5 && pileCombo.cards.length === 5 && newRank && pileRank) {
                // Hierarki 5 Kartu
                if (newRank > pileRank) {
                    isValidPlay = true; // (Flush > Straight)
                } else if (newRank === pileRank && newCombo.value > pileCombo.value) {
                    isValidPlay = true; // (Flush vs Flush)
                }
            } else if (newCombo.type === pileCombo.type && newCombo.value > pileCombo.value) {
                // Hierarki Standar
                isValidPlay = true; // (1-pair vs 1-pair)
            }
        }
        
        // --- Cek Hasil Validasi ---
        if (!isValidPlay) {
            alert(`Kombo tidak valid! Kartu Anda tidak bisa mengalahkan kartu di meja.`);
            return;
        }
    }
    
    // 4. JIKA SEMUA VALID: Mainkan kartu
    console.log(`Pemain 0 'Jalan' ${newCombo.type} (value: ${newCombo.value})`);
    playCards(0, newCombo.cards);
});

// (Sama, tidak berubah)
btnSkipTurn.addEventListener('click', () => {
    skipTurn(0);
});

btnResetSort.addEventListener('click', () => {
    console.log("Menyusun kartu otomatis (by value)...");

    // 1. Sortir data di gameState
    gameState.playerHands[0].sort((a, b) => a.value - b.value);
    
    // 2. Render ulang tangan (ini menghancurkan instance SortableJS)
    renderHands(gameState.playerCount); 
    saveGameState();

    // 3. Hancurkan instance lama (jika ada)
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    
    // 4. Buat instance SortableJS baru (TETAP DALAM MODE SUSUN)
    // Ini penting agar pemain bisa lanjut menyusun setelah reset.
    sortableInstance = new Sortable(playerHandElement, {
        animation: 150,
        disabled: false, // Tetap aktif karena masih in-sort-mode
        onEnd: (evt) => {
            updateHandOrderFromDOM();
        }
    });

    // 5. Pastikan style sorting-mode tetap ada (safety check)
    playerHandElement.classList.add('sorting-mode');
});

btnPlayAgain.addEventListener('click', () => {
    // Ambil setting dari game sebelumnya
    const options = {
        difficulty: gameState.difficulty,
        playerCount: gameState.playerCount,
        startingPlayerIndex: lastGameWinnerIndex // Gunakan Juara 1
    };
    
    // Sembunyikan layar akhir
    endGameScreen.classList.add('hidden');
    endGameScreen.classList.remove('active');

    // Mulai game baru
    startNewGame(options);
});

btnEndGameMainMenu.addEventListener('click', () => {
    // (Kita sudah clearGameState() saat game berakhir, jadi tinggal pindah)
    endGameScreen.classList.add('hidden');
    endGameScreen.classList.remove('active');
    switchScreen('main-menu');
});

/**
 * ===================================
 * FUNGSI HINT ENGINE (BARU V25)
 * ===================================
 */

/**
 * (Helper V25)
 * Mendapatkan hitungan rank { 'A': 2, 'K': 1, ... }
 * PENTING untuk mencari "pure single".
 */
function getCardRankCounts(hand) {
    const counts = {};
    for (const card of hand) {
        counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return counts;
}

/**
 * (Helper V25)
 * Mengecek apakah kombo baru (newCombo) bisa mengalahkan kombo di meja (pileCombo)
 * Ini adalah duplikat logika dari btnPlayCard.
 */
function isComboValid(newCombo, pileCombo) {
    // Jika meja kosong, semua kombo valid
    if (!pileCombo || pileCombo.type === 'invalid') {
        return true;
    }

    // Cek logika Bomb
    const isNewComboBomb = (newCombo.type === 'straight-flush' || newCombo.type === '4-of-a-kind');
    const isPileSingleTwo = (pileCombo.type === 'one-card' && pileCombo.cards[0].rank === '2');
    if (isNewComboBomb && isPileSingleTwo) {
        return true;
    }

    // Cek logika normal
    const pileRank = COMBO_5_CARD_RANKS[pileCombo.type];
    const newRank = COMBO_5_CARD_RANKS[newCombo.type];

    if (newCombo.cards.length === 5 && pileCombo.cards.length === 5 && newRank && pileRank) {
        // Hierarki 5 Kartu
        if (newRank > pileRank) return true; // (Flush > Straight)
        if (newRank === pileRank && newCombo.value > pileCombo.value) return true; // (Flush vs Flush)
    } else if (newCombo.type === pileCombo.type && newCombo.value > pileCombo.value) {
        // Hierarki Standar
        return true; // (1-pair vs 1-pair)
    }
    
    return false; // Jika semua gagal
}

/**
 * (Helper V25)
 * Memberi "skor" pada hint 1-2 kartu untuk OPENING play.
 * Skor lebih rendah = prioritas lebih tinggi.
 */
function getOpeningPairHintPriority(combo, rankCounts) {
    const value = combo.value;
    const rank = combo.cards[0].rank;

    // Prioritas 1: 1-pair <= 10
    if (combo.type === '1-pair' && value <= RANK_VALUES['10'] * 4 + 3) return 100 + value;
    
    // Prioritas 2: one-card <= K (Pure Single)
    if (combo.type === 'one-card' && rankCounts[rank] === 1 && value <= RANK_VALUES['K'] * 4 + 3) return 200 + value;
    
    // Prioritas 3: 1-pair <= K
    if (combo.type === '1-pair' && value <= RANK_VALUES['K'] * 4 + 3) return 300 + value;
    
    // Prioritas 4: one-card A atau 2 (Pure Single)
    if (combo.type === 'one-card' && rankCounts[rank] === 1) return 400 + value;
    
    // Prioritas 5: 1-pair A atau 2
    if (combo.type === '1-pair') return 500 + value;
    
    // Prioritas 6: one-card (Bukan pure single, misal dari pair)
    if (combo.type === 'one-card') return 600 + value;

    return 999; // Fallback
}

/**
 * (Helper V25)
 * Memberi "skor" pada hint 3+ kartu untuk OPENING play.
 * Skor lebih rendah = prioritas lebih tinggi.
 */
function getOpeningComboHintPriority(combo) {
    const value = combo.value;
    switch (combo.type) {
        case 'straight': return 100 + value;
        case 'flush': return 200 + value;
        case 'full-house': return 300 + value;
        case 'seri-buntut': return 400 + value; // (Tidak ada di findAllOpeningCombos, tapi jika ada)
        case 'bro-sis': return 500 + value; // (Tidak ada di findAllOpeningCombos)
        case 'tris': return 600 + value;
        case 'seri': return 700 + value; // (Tidak ada di findAllOpeningCombos)
        case 'straight-flush': return 800 + value;
        case '4-of-a-kind': return 900 + value;
        default: return 999;
    }
}

/**
 * (Helper V25)
 * Memberi "skor" pada hint 1-2 kartu untuk COUNTER play.
 * Skor lebih rendah = prioritas lebih tinggi.
 */
function getCounterPairHintPriority(combo, rankCounts, pileCombo) {
    const value = combo.value;
    const rank = combo.cards[0].rank;

    // Jika lawan 1-card
    if (pileCombo.type === 'one-card') {
        // Prioritas 1: one-card (Pure Single)
        if (rankCounts[rank] === 1) return 100 + value;
        // Prioritas 2: one-card (dari pair)
        return 200 + value;
    }
    
    // Jika lawan 1-pair
    if (pileCombo.type === '1-pair') {
        // Prioritas 1: 1-pair (murni pair)
        if (rankCounts[rank] === 2) return 100 + value;
        // Prioritas 2: 1-pair (dari tris)
        if (rankCounts[rank] === 3) return 200 + value;
        // Prioritas 3: 1-pair (dari 4-of-a-kind)
        if (rankCounts[rank] === 4) return 300 + value;
    }
    
    return 999; // Fallback
}

/**
 * (Helper V25)
 * Memberi "skor" pada hint 3+ kartu untuk COUNTER play.
 * Skor lebih rendah = prioritas lebih tinggi.
 */
function getCounterComboHintPriority(combo, pileCombo) {
    const value = combo.value;
    
    // Prioritas 1: Lawan dengan Tipe Sama (Straight vs Straight)
    if (combo.type === pileCombo.type) {
        return 100 + value;
    }
    
    // Prioritas 2: Lawan dengan Tipe Beda (Full House vs Straight)
    // Gunakan ranking 5 kartu
    if (COMBO_5_CARD_RANKS[combo.type]) {
        return (COMBO_5_CARD_RANKS[combo.type] * 1000) + value;
    }

    // Prioritas 3: Kombo lain (Tris vs Tris, dll)
    return 9000 + value;
}


/**
 * (OTAK UTAMA HINT V25)
 * Dipanggil setiap giliran berubah.
 * Mencari semua hint, mengurutkannya, dan mengaktifkan tombol.
 */
function updateHintButtons() {

    updatePlayerHandInteractiveness();
    // 1. Reset semua
    hintPairState = { index: 0, hints: [] };
    hintComboState = { index: 0, hints: [] };
    btnHintPair.disabled = true;
    btnHintCombo.disabled = true;
    hintComboCountElement.textContent = "(0)";
    
    // Deselect kartu (jika ada)
    //playerHandElement.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    
    // 2. Hanya jalan jika giliran Player 0
    if (gameState.currentPlayerIndex !== 0) {
        return;
    }
    
    // 3. Ambil konteks
    const hand = gameState.playerHands[0];
    const pileCombo = gameState.currentPlayPile.length > 0 ? getComboDetails(gameState.currentPlayPile) : null;
    const rankCounts = getCardRankCounts(hand); // Penting untuk "pure single"
    
    // 4. Cari SEMUA kemungkinan kombo yang bisa dibuat pemain
    const allPlayerCombos = findAllOpeningCombos(hand);
    
    // 5. Filter kombo-kombo itu berdasarkan konteks (Counter atau Opening)
    const allValidPlays = allPlayerCombos.filter(combo => isComboValid(combo, pileCombo));
    
    let allPairHints = allValidPlays.filter(c => c.cards.length <= 2);
    let allComboHints = allValidPlays.filter(c => c.cards.length >= 3);

    // 6. Sortir hint berdasarkan prioritas
    if (pileCombo) {
        // --- LOGIKA SORTIR COUNTER ---
        allPairHints.sort((a, b) => getCounterPairHintPriority(a, rankCounts, pileCombo) - getCounterPairHintPriority(b, rankCounts, pileCombo));
        allComboHints.sort((a, b) => getCounterComboHintPriority(a, pileCombo) - getCounterComboHintPriority(b, pileCombo));
        
    } else {
        // --- LOGIKA SORTIR OPENING ---
        allPairHints.sort((a, b) => getOpeningPairHintPriority(a, rankCounts) - getOpeningPairHintPriority(b, rankCounts));
        allComboHints.sort((a, b) => getOpeningComboHintPriority(a) - getOpeningComboHintPriority(b));
    }
    
    // 7. Simpan hasil ke state global
    hintPairState.hints = allPairHints;
    hintComboState.hints = allComboHints;
    
    // 8. Update Tombol UI
    if (hintPairState.hints.length > 0) {
        btnHintPair.disabled = false;
    }
    
    if (hintComboState.hints.length > 0) {
        btnHintCombo.disabled = false;
        hintComboCountElement.textContent = `(${hintComboState.hints.length})`;
    }
}

/**
 * BARU (V45):
 * Mengecek apakah tombol Unselect harus aktif (hanya di mode susun)
 */
function updateUnselectButtonState() {
    if (!isSortMode) return; // Hanya jalan di mode susun
    const selectedElements = playerHandElement.querySelectorAll('.card.selected');
    btnUnselect.disabled = (selectedElements.length === 0);
}

/**
 * BARU (V45):
 * Mencari dan mengupdate tombol "Kombo Chance"
 */
function updateKomboChanceButton() {
    komboChanceState = { index: 0, hints: [] }; // Reset
    
    // Ambil SEMUA kombo (termasuk bro-sis, seri, dll)
    const allPlayerCombos = findAllOpeningCombos(gameState.playerHands[0]);
    
    // Filter HANYA 3+ kartu
    const allComboHints = allPlayerCombos.filter(c => c.cards.length >= 3);
    
    // Urutkan berdasarkan prioritas (5-card dulu, baru 4, baru 3)
    allComboHints.sort((a, b) => getOpeningComboHintPriority(a) - getOpeningComboHintPriority(b));
    
    komboChanceState.hints = allComboHints;
    
    if (komboChanceState.hints.length > 0) {
        btnKomboChance.disabled = false;
        komboChanceCountElement.textContent = `(${komboChanceState.hints.length})`;
    } else {
        btnKomboChance.disabled = true;
        komboChanceCountElement.textContent = "(0)";
    }
}

/**
 * (Helper V25)
 * Fungsi untuk menyeleksi kartu di UI.
 */
function selectHintCards(cards) {
    // Deselect semua kartu dulu
    playerHandElement.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    
    // Select kartu yang ada di hint
    if (cards && cards.length > 0) {
        cards.forEach(cardData => {
            const cardEl = playerHandElement.querySelector(`[data-id="${cardData.id}"]`);
            if (cardEl) {
                cardEl.classList.add('selected');
            }
        });
    }
    validatePlayerSelection();
    updateUnselectButtonState();
}

/**
 * BARU (V25): Event listener untuk tombol Hint Pair
 */
btnHintPair.addEventListener('click', () => {
    const selectedElements = playerHandElement.querySelectorAll('.card.selected');
    if (selectedElements.length === 0) {
        // Jika tidak ada, reset index ke 0
        hintPairState.index = 0;
        console.log("Hint Pair reset to index 0 (no selection)");
    }

    // Ambil hint saat ini
    const hint = hintPairState.hints[hintPairState.index];
    
    // Tampilkan di UI
    selectHintCards(hint.cards);
    
    // Pindahkan index untuk klik berikutnya
    hintPairState.index = (hintPairState.index + 1) % hintPairState.hints.length;
});

/**
 * BARU (V25): Event listener untuk tombol Hint Kombo
 */
btnHintCombo.addEventListener('click', () => {
    if (hintComboState.hints.length === 0) return;
    
    // BARU (V27): Cek apakah ada kartu yg ter-select
    const selectedElements = playerHandElement.querySelectorAll('.card.selected');
    if (selectedElements.length === 0) {
        // Jika tidak ada, reset index ke 0
        hintComboState.index = 0;
        console.log("Hint Kombo reset to index 0 (no selection)");
    }
    
    // Ambil hint saat ini
    const hint = hintComboState.hints[hintComboState.index];
    
    // Tampilkan di UI
    selectHintCards(hint.cards);
    
    // Pindahkan index untuk klik berikutnya
    hintComboState.index = (hintComboState.index + 1) % hintComboState.hints.length;
});

/**
 * BARU (V45): Tombol "Kombo Chance" (mode susun)
 */
btnKomboChance.addEventListener('click', () => {
    if (komboChanceState.hints.length === 0) return;
    
    // Ambil hint saat ini
    const hint = komboChanceState.hints[komboChanceState.index];
    
    // Tampilkan di UI
    selectHintCards(hint.cards);
    
    // Pindahkan index untuk klik berikutnya
    komboChanceState.index = (komboChanceState.index + 1) % komboChanceState.hints.length;
    
    // Update tombol Unselect (karena kartu baru saja di-select)
    updateUnselectButtonState(); 
});

/**
 * BARU (V45): Tombol "Unselect" (mode susun)
 */
btnUnselect.addEventListener('click', () => {
    playerHandElement.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    updateUnselectButtonState(); // Akan men-disable dirinya sendiri
});

// ... (Kode "Mulai game") ...

/**
 * DIPERBARUI (V44):
 * Menggelapkan kartu pemain yang tidak bisa
 * digunakan untuk melawan kartu di meja.
 * (Logika 'single 2' vs 'BOMB' yang disempurnakan)
 */
function updatePlayerHandInteractiveness() {
     // 1. Reset semua kartu (buat bisa diklik semua)
    playerHandElement.querySelectorAll('.card').forEach(c => c.classList.remove('disabled'));

    if (isSortMode) return;

    // 2. Cek kondisi:
    // - Jika bukan giliran Player 0, ATAU
    // - Jika meja kosong (babak baru)
    // ...maka jangan nonaktifkan apa-apa.
    if (gameState.currentPlayerIndex !== 0 || gameState.currentPlayPile.length === 0) {
        return;
    }
    
    const pileCombo = getComboDetails(gameState.currentPlayPile);
    if (pileCombo.type === 'invalid') return;

    // 3. Aturan Kombo 5 Kartu:
    // Jika di meja ada 5 kartu, jangan nonaktifkan apa-apa.
    if (pileCombo.cards.length === 5) {
        return; 
    }

    // --- LOGIKA BARU V44 DIMULAI DI SINI ---
    
    // Cek apakah di meja ada 'single 2'
    const isPileSingleTwo = (pileCombo.type === 'one-card' && pileCombo.cards[0].rank === '2');
    
    let benchmarkValue = 0;
    let cardIdsToKeepActive = new Set(); // Kartu yg JANGAN di-disable

    if (isPileSingleTwo) {
        // --- LOGIKA KHUSUS MELAWAN '2' ---
        
        // 1. Patokan adalah nilai '2' di meja
        benchmarkValue = pileCombo.cards[0].value;
        
        // 2. Cari semua BOMB (4-of-a-kind & Straight Flush) di tangan
        const allPlayerCombos = findAllOpeningCombos(gameState.playerHands[0]);
        const allBombs = allPlayerCombos.filter(c => c.type === 'straight-flush' || c.type === '4-of-a-kind');
        
        // 3. Masukkan ID kartu BOMB ke Set
        allBombs.forEach(bomb => {
            bomb.cards.forEach(card => cardIdsToKeepActive.add(card.id));
        });
        
    } else {
        // --- LOGIKA NORMAL (NON-'2') ---
        // Patokan adalah kartu TERENDAH di meja
        benchmarkValue = pileCombo.cards[0].value;
    }

    // 4. Loop terakhir: Nonaktifkan kartu yg tidak lolos
    const playerCards = playerHandElement.querySelectorAll('.card');
    playerCards.forEach(cardEl => {
        const cardValue = parseInt(cardEl.getAttribute('data-value'), 10);
        const cardId = cardEl.getAttribute('data-id');

        let shouldDisable = false;
        
        if (isPileSingleTwo) {
            // Jika melawan '2', kartu harus (lebih besar DARI patokan) ATAU (bagian dari bomb)
            if (cardValue <= benchmarkValue && !cardIdsToKeepActive.has(cardId)) {
                shouldDisable = true;
            }
        } else {
            // Jika melawan normal, kartu harus (lebih besar ATAU SAMA DENGAN patokan)
            if (cardValue < benchmarkValue) {
                shouldDisable = true;
            }
        }
        
        if (shouldDisable) {
            cardEl.classList.add('disabled');
            cardEl.classList.remove('selected'); 
        }
    });
}

/**
 * BARU (V30): Helper untuk mengubah warna tombol "Jalan"
 */
function setButtonState(state) {
    // Hapus semua class warna dulu
    btnPlayCard.classList.remove('btn-enabled-green', 'btn-disabled-red');

    // Jika BUKAN giliran kita (disabled), jangan lakukan apa-apa
    if (btnPlayCard.disabled) {
        return;
    }

    // Tambahkan class warna yang sesuai
    if (state === 'green') {
        btnPlayCard.classList.add('btn-enabled-green');
    } else if (state === 'red') {
        btnPlayCard.classList.add('btn-disabled-red');
    }
}

/**
 * BARU (V30): "Otak" validasi pilihan kartu real-time
 */
function validatePlayerSelection() {
    // 1. Ambil kartu yang diselect
    const selectedElements = playerHandElement.querySelectorAll('.card.selected');

    // 2. Cek 1: Tidak ada kartu dipilih
    if (selectedElements.length === 0) {
        setButtonState('red'); // Merah jika kosong
        return;
    }

    // 3. Ubah elemen DOM menjadi data kartu
    const selectedCards = [];
    selectedElements.forEach(el => {
        const cardId = el.getAttribute('data-id');
        const card = gameState.playerHands[0].find(c => c.id === cardId);
        selectedCards.push(card);
    });

    // 4. Cek 2: Kombo tidak valid (misal 4-5 keriting)
    const newCombo = getComboDetails(selectedCards);
    if (newCombo.type === 'invalid') {
        setButtonState('red'); // Merah jika kombo acak
        return;
    }

    // --- VALIDASI KARTU '2' TERAKHIR (V32) ---
    const remainingCardsCount = gameState.playerHands[0].length - selectedCards.length;

    // Cek 1: Apakah ini langkah terakhir? (Logika V31 lama)
    if (remainingCardsCount === 0) {
        const isAllTwos = selectedCards.every(card => card.rank === '2');
        if (isAllTwos && newCombo.cards.length < 5) {
            setButtonState('red'); // Dilarang main '2' sebagai kartu single/pair/tris terakhir
            return;
        }
    }

    // Cek 2: Apakah langkah ini AKAN MENYISAKAN satu kartu '2'? (Logika V32 BARU)
    if (remainingCardsCount === 1) {
        // Temukan kartu yang TIDAK diseleksi
        const remainingCard = gameState.playerHands[0].find(handCard => {
            // Return true jika handCard.id TIDAK ADA di selectedCards
            return !selectedCards.some(selectedCard => selectedCard.id === handCard.id);
        });

        // Jika kartu sisa itu ada DAN rank-nya '2'
        if (remainingCard && remainingCard.rank === '2') {
            setButtonState('red'); // Merah! Dilarang menyisakan '2' sendirian
            return;
        }
    }
    // --- AKHIR VALIDASI V32 ---

    // 5. Cek 3: Validasi lawan
    const pileCombo = gameState.currentPlayPile.length > 0 ? getComboDetails(gameState.currentPlayPile) : null;
    
    // Gunakan fungsi isComboValid (dari V25)
    if (isComboValid(newCombo, pileCombo)) {
        setButtonState('green'); // HIJAU! Pilihan valid
    } else {
        setButtonState('red'); // Merah jika kombo kalah
    }
}

loadAndResumeGame();