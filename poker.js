/* ═══════════════════════════════════════════════════
   POCKET ACES — Texas Hold'em Poker
   Complete Game Logic, Networking, Sound Synth, Live Chat & Gate
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── CONSTANTS & CONFIGURATION ─────────────────
    const SITE_PASSWORD = 'pokerwin';

    const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
    const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const VALUE_NAMES = { 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9', 10:'10', 11:'J', 12:'Q', 13:'K', 14:'A' };
    const SUIT_SYMBOLS = { hearts:'♥', diamonds:'♦', clubs:'♣', spades:'♠' };
    const SUIT_COLORS  = { hearts:'red', diamonds:'red', clubs:'black', spades:'black' };

    // Exact starting stack specified by user:
    // 1×$500 + 2×$100 + 3×$50 + 5×$20 + 5×$10 = $1,000
    const STARTING_CHIPS = 1000;
    const CHIP_DENOMS = [500, 100, 50, 20, 10];
    const SMALL_BLIND = 10;
    const BIG_BLIND   = 20;
    const MAX_PLAYERS = 12;
    const PEER_PREFIX = 'pocketaces-';

    const BOT_NAMES = [
        'Bot Ace', 'Bot Sophia', 'Bot Maverick', 'Bot Oliver',
        'Bot Luna', 'Bot Jasper', 'Bot Hunter', 'Bot Chloe',
        'Bot Duke', 'Bot Bella', 'Bot Jax', 'Bot Ruby'
    ];
    const AVATAR_COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00cec9','#6c5ce7','#fd79a8','#fdcb6e'];

    // ─── APPLICATION STATE ─────────────────────────
    let myId     = 'p_' + Math.random().toString(36).substring(2, 9);
    let myName   = '';
    let isHost   = false;
    let roomCode = '';

    let mqttClient = null;
    let mqttConnected = false;
    let activeSubscriptions = new Set();

    let gameState = null;  // Host-authoritative game state
    let viewState = null;  // Client-side view of game state

    let nextHandTimer = null;
    let soundEnabled = false;
    let isDealingAnimation = false;

    // Chat state
    let unreadChatCount = 0;
    let isGameChatOpen = false;

    // ═══════════════════════════════════════════════
    // SECTION 1: AUDIO SYNTHESIZER (DISABLED / REMOVED)
    // ═══════════════════════════════════════════════

    function playDealSound() {}
    function playSnapSound() {}
    function playShuffleSound() {}
    function playChipSound() {}
    function playCheckSound() {}
    function playFoldSound() {}
    function playWinSound() {}
    function playChatPopSound() {}

    // ═══════════════════════════════════════════════
    // SECTION 2: CARD UTILITIES
    // ═══════════════════════════════════════════════

    function createDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (const value of VALUES) {
                deck.push({ suit, value });
            }
        }
        return deck;
    }

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    function dealCard(state) {
        return state.deck.pop();
    }

    // ═══════════════════════════════════════════════
    // SECTION 3: HAND EVALUATION
    // ═══════════════════════════════════════════════

    function getCombinations(arr, k) {
        if (k === 0) return [[]];
        if (arr.length < k) return [];
        const [first, ...rest] = arr;
        const with_first = getCombinations(rest, k - 1).map(c => [first, ...c]);
        const without    = getCombinations(rest, k);
        return [...with_first, ...without];
    }

    function evaluate5Cards(cards) {
        const vals = cards.map(c => c.value).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        const isFlush = suits.every(s => s === suits[0]);

        const counts = {};
        vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });

        const groups = Object.entries(counts)
            .map(([v, c]) => ({ value: +v, count: c }))
            .sort((a, b) => b.count - a.count || b.value - a.value);

        const uniq = [...new Set(vals)].sort((a, b) => b - a);
        let isStraight = false, straightHigh = 0;
        if (uniq.length === 5) {
            if (uniq[0] - uniq[4] === 4) {
                isStraight = true;
                straightHigh = uniq[0];
            } else if (uniq[0] === 14 && uniq[1] === 5 && uniq[2] === 4 && uniq[3] === 3 && uniq[4] === 2) {
                isStraight = true;
                straightHigh = 5;
            }
        }

        if (isFlush && isStraight) {
            return straightHigh === 14
                ? { rank: 10, tb: [14], name: 'Royal Flush' }
                : { rank: 9,  tb: [straightHigh], name: `Straight Flush (${VALUE_NAMES[straightHigh]} High)` };
        }
        if (groups[0].count === 4) {
            return { rank: 8, tb: [groups[0].value, groups[1].value], name: `Four of a Kind (${VALUE_NAMES[groups[0].value]}s)` };
        }
        if (groups[0].count === 3 && groups[1].count === 2) {
            return { rank: 7, tb: [groups[0].value, groups[1].value], name: `Full House (${VALUE_NAMES[groups[0].value]}s full of ${VALUE_NAMES[groups[1].value]}s)` };
        }
        if (isFlush) {
            return { rank: 6, tb: vals, name: `Flush (${VALUE_NAMES[vals[0]]} High)` };
        }
        if (isStraight) {
            return { rank: 5, tb: [straightHigh], name: `Straight (${VALUE_NAMES[straightHigh]} High)` };
        }
        if (groups[0].count === 3) {
            const kickers = groups.filter(g => g.count === 1).map(g => g.value).sort((a, b) => b - a);
            return { rank: 4, tb: [groups[0].value, ...kickers], name: `Three of a Kind (${VALUE_NAMES[groups[0].value]}s)` };
        }
        if (groups[0].count === 2 && groups[1].count === 2) {
            const pairs = [groups[0].value, groups[1].value].sort((a, b) => b - a);
            return { rank: 3, tb: [...pairs, groups[2].value], name: `Two Pair (${VALUE_NAMES[pairs[0]]}s & ${VALUE_NAMES[pairs[1]]}s)` };
        }
        if (groups[0].count === 2) {
            const kickers = groups.filter(g => g.count === 1).map(g => g.value).sort((a, b) => b - a);
            return { rank: 2, tb: [groups[0].value, ...kickers], name: `Pair of ${VALUE_NAMES[groups[0].value]}s` };
        }
        return { rank: 1, tb: vals, name: `High Card (${VALUE_NAMES[vals[0]]})` };
    }

    function evaluateBestHand(holeCards, community) {
        const all = [...(holeCards || []), ...(community || [])];
        if (all.length < 5) {
            if (holeCards && holeCards.length === 2) {
                if (holeCards[0].value === holeCards[1].value) {
                    return { rank: 2, name: `Pocket Pair of ${VALUE_NAMES[holeCards[0].value]}s` };
                }
                const high = Math.max(holeCards[0].value, holeCards[1].value);
                return { rank: 1, name: `High Card (${VALUE_NAMES[high]})` };
            }
            return { rank: 0, name: '' };
        }
        const combos = getCombinations(all, 5);
        let best = null;
        for (const c of combos) {
            const hand = evaluate5Cards(c);
            if (!best || compareHands(hand, best) > 0) {
                best = hand;
                best.cards = c;
            }
        }
        return best;
    }

    function compareHands(a, b) {
        if (a.rank !== b.rank) return a.rank - b.rank;
        for (let i = 0; i < Math.min(a.tb.length, b.tb.length); i++) {
            if (a.tb[i] !== b.tb[i]) return a.tb[i] - b.tb[i];
        }
        return 0;
    }

    // ═══════════════════════════════════════════════
    // SECTION 4: HELPERS & UTILITIES
    // ═══════════════════════════════════════════════

    function generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    function chipBreakdown(amount) {
        const bd = [];
        let rem = amount;
        for (const d of CHIP_DENOMS) {
            const count = Math.min(Math.floor(rem / d), 3);
            for (let i = 0; i < count; i++) bd.push(d);
            rem %= d;
        }
        return bd;
    }

    function getAvatar(name) {
        const safeName = name || 'Player';
        const hash = safeName.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
        return {
            initials: safeName.substring(0, 2).toUpperCase(),
            color: AVATAR_COLORS[hash % AVATAR_COLORS.length]
        };
    }

    function getSeatLayout(count) {
        const layouts = {
            1:  [0],
            2:  [0, 6],
            3:  [0, 4, 8],
            4:  [0, 3, 6, 9],
            5:  [0, 2, 5, 7, 10],
            6:  [0, 2, 4, 6, 8, 10],
            7:  [0, 2, 4, 5, 7, 8, 10],
            8:  [0, 1, 3, 5, 6, 7, 9, 11],
            9:  [0, 1, 3, 4, 6, 7, 8, 10, 11],
            10: [0, 1, 2, 4, 5, 6, 7, 8, 10, 11],
            11: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
            12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        };
        return layouts[count] || layouts[12];
    }

    function formatTime(date = new Date()) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    // ═══════════════════════════════════════════════
    // SECTION 5: GAME ENGINE & HOST STATE
    // ═══════════════════════════════════════════════

    function initGameState() {
        gameState = {
            phase: 'lobby',
            deck: [],
            players: [],
            communityCards: [],
            dealerIndex: 0,
            currentPlayerIndex: -1,
            highestBet: 0,
            minRaise: BIG_BLIND * 2,
            lastRaiseTo: 0,
            handNumber: 0,
            results: null
        };
    }

    function addPlayer(id, name, isBot = false) {
        gameState.players.push({
            id,
            name,
            isBot,
            chips: STARTING_CHIPS,
            cards: [],
            currentBet: 0,
            totalBet: 0,
            folded: false,
            allIn: false,
            eliminated: false,
            actedThisRound: false
        });
    }

    function removePlayer(id) {
        const idx = gameState.players.findIndex(p => p.id === id);
        if (idx === -1) return;

        const player = gameState.players[idx];
        if (gameState.phase !== 'lobby' && gameState.phase !== 'gameOver') {
            player.folded = true;
            player.eliminated = true;
            player.cards = [];
            const active = gameState.players.filter(p => !p.folded && !p.eliminated);
            if (active.length <= 1 && active.length > 0) {
                const winner = active[0];
                winner.chips += calcTotalPot();
                gameState.results = {
                    winners: [{ id: winner.id, name: winner.name, amount: calcTotalPot(), hand: null }],
                    message: `${winner.name} wins (others left table)`
                };
                gameState.phase = 'handEnd';
                gameState.players.forEach(p => { p.currentBet = 0; p.totalBet = 0; });
                scheduleNextHand();
            }
        } else {
            gameState.players.splice(idx, 1);
            if (gameState.dealerIndex >= gameState.players.length) {
                gameState.dealerIndex = 0;
            }
        }
    }

    function getActivePlayers()  { return gameState.players.filter(p => !p.eliminated); }
    function getActiveInHand()   { return gameState.players.filter(p => !p.folded && !p.eliminated); }
    function getActiveCanAct()   { return gameState.players.filter(p => !p.folded && !p.eliminated && !p.allIn); }
    function calcTotalPot()      { return gameState.players.reduce((s, p) => s + p.totalBet, 0); }

    function getNextIdx(from, skipFolded, skipAllIn) {
        let idx = (from + 1) % gameState.players.length;
        let tries = 0;
        while (tries < gameState.players.length) {
            const p = gameState.players[idx];
            const skip = p.eliminated || (skipFolded && p.folded) || (skipAllIn && p.allIn);
            if (!skip) return idx;
            idx = (idx + 1) % gameState.players.length;
            tries++;
        }
        return -1;
    }

    function getBlindPositions() {
        const active = getActivePlayers();
        if (active.length === 2) {
            return {
                sbIdx: gameState.dealerIndex,
                bbIdx: getNextIdx(gameState.dealerIndex, true, false)
            };
        }
        const sbIdx = getNextIdx(gameState.dealerIndex, true, false);
        return {
            sbIdx,
            bbIdx: getNextIdx(sbIdx, true, false)
        };
    }

    function addBotPlayer() {
        if (!isHost) return;
        if (gameState.players.length >= MAX_PLAYERS) {
            showToast('Table is full (max 12 players)', 'error');
            return;
        }
        const availableNames = BOT_NAMES.filter(n => !gameState.players.some(p => p.name === n));
        const botName = availableNames[0] || `Bot ${gameState.players.length + 1}`;
        const botId = 'bot-' + Math.random().toString(36).substring(2, 8);
        addPlayer(botId, botName, true);
        showToast(`${botName} joined the table!`, 'success');
        broadcastState();
        sendGameChatMessage('♠ Dealer', `${botName} joined the table!`, true);
    }

    function startGame() {
        if (!isHost) return;
        if (gameState.players.length === 1) {
            addBotPlayer();
        }
        gameState.dealerIndex = Math.floor(Math.random() * gameState.players.length);
        startHand();
    }

    function startHand() {
        if (nextHandTimer) { clearTimeout(nextHandTimer); nextHandTimer = null; }

        gameState.handNumber++;
        gameState.results = null;

        gameState.players.forEach(p => {
            p.cards = [];
            p.currentBet = 0;
            p.totalBet = 0;
            p.folded = p.eliminated;
            p.allIn = false;
            p.actedThisRound = false;
        });

        // Fresh shuffled deck
        gameState.deck = shuffleDeck(createDeck());
        gameState.communityCards = [];
        gameState.highestBet = 0;
        gameState.minRaise = BIG_BLIND * 2;
        gameState.lastRaiseTo = 0;

        // Blinds
        const { sbIdx, bbIdx } = getBlindPositions();
        const sb = gameState.players[sbIdx];
        const bb = gameState.players[bbIdx];

        const sbAmt = Math.min(SMALL_BLIND, sb.chips);
        sb.chips -= sbAmt; sb.currentBet = sbAmt; sb.totalBet = sbAmt;
        if (sb.chips === 0) sb.allIn = true;

        const bbAmt = Math.min(BIG_BLIND, bb.chips);
        bb.chips -= bbAmt; bb.currentBet = bbAmt; bb.totalBet = bbAmt;
        if (bb.chips === 0) bb.allIn = true;

        gameState.highestBet = BIG_BLIND;
        gameState.lastRaiseTo = BIG_BLIND;
        gameState.minRaise = BIG_BLIND * 2;

        // Deal 2 cards to each active player clockwise from dealer
        for (let round = 0; round < 2; round++) {
            let idx = getNextIdx(gameState.dealerIndex, true, false);
            let dealt = 0;
            const activeCount = getActivePlayers().length;
            while (dealt < activeCount) {
                const p = gameState.players[idx];
                if (!p.eliminated) {
                    p.cards.push(dealCard(gameState));
                    dealt++;
                }
                idx = (idx + 1) % gameState.players.length;
            }
        }

        gameState.phase = 'preflop';

        const active = getActivePlayers();
        if (active.length === 2) {
            gameState.currentPlayerIndex = gameState.dealerIndex;
        } else {
            gameState.currentPlayerIndex = getNextIdx(bbIdx, true, true);
        }

        broadcastState();
        sendGameChatMessage('♠ Dealer', `Hand #${gameState.handNumber} dealt! Blinds: $${SMALL_BLIND}/$${BIG_BLIND}`, true);

        if (getActiveCanAct().length <= 1) {
            setTimeout(() => dealRemainingAndShowdown(), 1200);
        } else {
            checkBotTurn();
        }
    }

    function handlePlayerAction(playerId, action, amount) {
        if (!isHost) return;
        const pIdx = gameState.players.findIndex(p => p.id === playerId);
        if (pIdx === -1 || pIdx !== gameState.currentPlayerIndex) return;

        const player = gameState.players[pIdx];
        if (player.folded || player.eliminated || player.allIn) return;

        switch (action) {
            case 'fold':
                player.folded = true;
                player.actedThisRound = true;
                sendGameChatMessage('♠ Dealer', `${player.name} folded.`, true);
                break;

            case 'check':
                if (player.currentBet < gameState.highestBet) return;
                player.actedThisRound = true;
                sendGameChatMessage('♠ Dealer', `${player.name} checked.`, true);
                break;

            case 'call': {
                const needed = Math.min(gameState.highestBet - player.currentBet, player.chips);
                player.chips -= needed;
                player.currentBet += needed;
                player.totalBet += needed;
                if (player.chips === 0) player.allIn = true;
                player.actedThisRound = true;
                sendGameChatMessage('♠ Dealer', `${player.name} called $${needed}.`, true);
                break;
            }

            case 'raise': {
                const target = amount;
                const additional = target - player.currentBet;
                if (additional <= 0 || additional > player.chips) return;
                if (target < gameState.minRaise && additional !== player.chips) return;

                player.chips -= additional;
                player.currentBet = target;
                player.totalBet += additional;
                if (player.chips === 0) player.allIn = true;

                gameState.minRaise = target + (target - gameState.lastRaiseTo);
                gameState.lastRaiseTo = target;
                gameState.highestBet = target;

                gameState.players.forEach((p, i) => {
                    if (i !== pIdx && !p.folded && !p.eliminated && !p.allIn) {
                        p.actedThisRound = false;
                    }
                });
                player.actedThisRound = true;
                sendGameChatMessage('♠ Dealer', `${player.name} raised to $${target}!`, true);
                break;
            }

            case 'allin': {
                const allAmt = player.chips;
                const newBet = player.currentBet + allAmt;

                if (newBet > gameState.highestBet) {
                    const raiseBy = newBet - gameState.highestBet;
                    const minRaiseSize = gameState.highestBet - gameState.lastRaiseTo;
                    if (raiseBy >= (minRaiseSize || BIG_BLIND)) {
                        gameState.minRaise = newBet + raiseBy;
                        gameState.lastRaiseTo = newBet;
                        gameState.players.forEach((p, i) => {
                            if (i !== pIdx && !p.folded && !p.eliminated && !p.allIn) {
                                p.actedThisRound = false;
                            }
                        });
                    }
                    gameState.highestBet = newBet;
                }

                player.chips -= allAmt;
                player.currentBet = newBet;
                player.totalBet += allAmt;
                player.allIn = true;
                player.actedThisRound = true;
                sendGameChatMessage('♠ Dealer', `🔥 ${player.name} is ALL IN for $${allAmt}!`, true);
                break;
            }

            default: return;
        }

        const inHand = getActiveInHand();
        if (inHand.length === 1) {
            winByFold(inHand[0]);
            return;
        }

        if (isRoundComplete()) {
            advancePhase();
        } else {
            const next = getNextIdx(pIdx, true, true);
            if (next === -1 || getActiveCanAct().length === 0) {
                dealRemainingAndShowdown();
                return;
            }
            gameState.currentPlayerIndex = next;
        }

        broadcastState();
        checkBotTurn();
    }

    function winByFold(winner) {
        const pot = calcTotalPot();
        winner.chips += pot;
        gameState.results = {
            winners: [{ id: winner.id, name: winner.name, amount: pot, hand: null }],
            message: `${winner.name} wins $${pot} (All opponents folded)`
        };
        gameState.phase = 'handEnd';
        gameState.players.forEach(p => { p.currentBet = 0; p.totalBet = 0; });
        broadcastState();
        sendGameChatMessage('♠ Dealer', `🎉 ${winner.name} wins $${pot} as all players folded.`, true);
        scheduleNextHand();
    }

    function isRoundComplete() {
        const canAct = getActiveCanAct();
        if (canAct.length === 0) return true;
        return canAct.every(p => p.actedThisRound && p.currentBet >= gameState.highestBet);
    }

    function advancePhase() {
        gameState.players.forEach(p => {
            p.actedThisRound = false;
            p.currentBet = 0;
        });
        gameState.highestBet = 0;
        gameState.minRaise = BIG_BLIND;
        gameState.lastRaiseTo = 0;

        switch (gameState.phase) {
            case 'preflop':
                gameState.deck.pop(); // burn
                for (let i = 0; i < 3; i++) gameState.communityCards.push(dealCard(gameState));
                gameState.phase = 'flop';
                sendGameChatMessage('♠ Dealer', 'Flop dealt.', true);
                break;
            case 'flop':
                gameState.deck.pop(); // burn
                gameState.communityCards.push(dealCard(gameState));
                gameState.phase = 'turn';
                sendGameChatMessage('♠ Dealer', 'Turn card dealt.', true);
                break;
            case 'turn':
                gameState.deck.pop(); // burn
                gameState.communityCards.push(dealCard(gameState));
                gameState.phase = 'river';
                sendGameChatMessage('♠ Dealer', 'River card dealt.', true);
                break;
            case 'river':
                doShowdown();
                return;
        }

        const firstActor = getNextIdx(gameState.dealerIndex, true, true);
        if (firstActor === -1 || getActiveCanAct().length <= 1) {
            dealRemainingAndShowdown();
            return;
        }
        gameState.currentPlayerIndex = firstActor;
        broadcastState();
        checkBotTurn();
    }

    function dealRemainingAndShowdown() {
        while (gameState.communityCards.length < 5) {
            if (gameState.communityCards.length === 0 || gameState.communityCards.length === 3 || gameState.communityCards.length === 4) {
                gameState.deck.pop(); // burn
            }
            gameState.communityCards.push(dealCard(gameState));
        }
        doShowdown();
    }

    function doShowdown() {
        gameState.phase = 'showdown';
        gameState.currentPlayerIndex = -1;

        const pots = calcSidePots();
        const results = { winners: [], message: '' };

        for (const pot of pots) {
            const hands = pot.eligible.map(id => {
                const p = gameState.players.find(x => x.id === id);
                const hand = evaluateBestHand(p.cards, gameState.communityCards);
                return { id, name: p.name, hand };
            });
            hands.sort((a, b) => compareHands(b.hand, a.hand));

            const bestHand = hands[0].hand;
            const potWinners = hands.filter(h => compareHands(h.hand, bestHand) === 0);
            const share = Math.floor(pot.amount / potWinners.length);
            const rem   = pot.amount % potWinners.length;

            potWinners.forEach((w, i) => {
                const win = share + (i === 0 ? rem : 0);
                gameState.players.find(x => x.id === w.id).chips += win;
                results.winners.push({ id: w.id, name: w.name, amount: win, hand: w.hand });
            });
        }

        const winnerMap = {};
        results.winners.forEach(w => {
            if (!winnerMap[w.id]) winnerMap[w.id] = { ...w, amount: 0 };
            winnerMap[w.id].amount += w.amount;
            winnerMap[w.id].hand = w.hand;
        });
        const uniqueWinners = Object.values(winnerMap);
        results.winners = uniqueWinners;

        if (uniqueWinners.length === 1) {
            const w = uniqueWinners[0];
            results.message = `${w.name} wins $${w.amount} with ${w.hand.name}!`;
        } else {
            results.message = uniqueWinners.map(w => w.name).join(' & ') + ' split the pot!';
        }

        gameState.results = results;
        broadcastState();
        sendGameChatMessage('♠ Dealer', `🏆 ${results.message}`, true);
        scheduleNextHand();
    }

    function calcSidePots() {
        const allBettors = gameState.players.filter(p => p.totalBet > 0);
        if (allBettors.length === 0) return [];

        const allInAmts = gameState.players
            .filter(p => p.allIn && !p.folded && !p.eliminated)
            .map(p => p.totalBet);
        const maxBet = Math.max(...allBettors.map(p => p.totalBet));
        const levels = [...new Set([...allInAmts, maxBet])].sort((a, b) => a - b);

        const pots = [];
        let covered = 0;

        for (const level of levels) {
            let potAmt = 0;
            const eligible = [];
            for (const p of gameState.players) {
                const contribution = Math.min(p.totalBet, level) - Math.min(p.totalBet, covered);
                potAmt += contribution;
                if (!p.folded && !p.eliminated && p.totalBet >= level) {
                    eligible.push(p.id);
                }
            }
            if (potAmt > 0 && eligible.length > 0) {
                pots.push({ amount: potAmt, eligible });
            }
            covered = level;
        }
        return pots;
    }

    function scheduleNextHand() {
        nextHandTimer = setTimeout(() => {
            if (!isHost) return;
            checkEliminations();
            if (canContinue()) {
                gameState.players.forEach(p => { p.currentBet = 0; p.totalBet = 0; });
                moveDealerAndStart();
            }
        }, 5500);
    }

    function checkEliminations() {
        gameState.players.forEach(p => {
            if (p.chips <= 0 && !p.eliminated) {
                p.eliminated = true;
                p.chips = 0;
            }
        });
        const remaining = getActivePlayers();
        if (remaining.length <= 1) {
            gameState.phase = 'gameOver';
            gameState.results = {
                winners: remaining.map(p => ({ id: p.id, name: p.name, amount: 0, hand: null })),
                message: remaining.length === 1 ? `🏆 ${remaining[0].name} wins the tournament!` : 'Game Over'
            };
            broadcastState();
        }
    }

    function canContinue() {
        return getActivePlayers().length >= 2 && gameState.phase !== 'gameOver';
    }

    function moveDealerAndStart() {
        let next = (gameState.dealerIndex + 1) % gameState.players.length;
        let tries = 0;
        while (gameState.players[next].eliminated && tries < gameState.players.length) {
            next = (next + 1) % gameState.players.length;
            tries++;
        }
        gameState.dealerIndex = next;
        startHand();
    }

    // ─── AI BOT DECISION ENGINE ────────────────────
    function checkBotTurn() {
        if (!isHost || !gameState || gameState.currentPlayerIndex === -1) return;
        const curPlayer = gameState.players[gameState.currentPlayerIndex];
        if (!curPlayer || !curPlayer.isBot || curPlayer.folded || curPlayer.eliminated || curPlayer.allIn) return;

        const delay = 900 + Math.random() * 800;
        setTimeout(() => {
            if (!gameState || gameState.currentPlayerIndex === -1) return;
            const p = gameState.players[gameState.currentPlayerIndex];
            if (!p || !p.isBot) return;

            const callAmt = gameState.highestBet - p.currentBet;
            const pot = calcTotalPot();
            const handEval = evaluateBestHand(p.cards, gameState.communityCards);

            if (Math.random() < 0.15) {
                const botQuotes = ['Feeling lucky! 🃏', 'Big pot incoming 💰', 'Nice cards 😎', 'All calculated 🤖', 'Let’s play! 🔥'];
                const quote = botQuotes[Math.floor(Math.random() * botQuotes.length)];
                sendGameChatMessage(p.name, quote, false, p.id);
            }

            if (callAmt === 0) {
                if (handEval.rank >= 3 && Math.random() < 0.45 && p.chips > gameState.minRaise) {
                    handlePlayerAction(p.id, 'raise', Math.min(gameState.minRaise, p.chips + p.currentBet));
                } else {
                    handlePlayerAction(p.id, 'check');
                }
            } else {
                let callChance = 0.5;
                if (handEval.rank >= 2) callChance = 0.85;
                if (handEval.rank >= 4) callChance = 0.98;

                if (callAmt > p.chips * 0.5 && handEval.rank <= 1) {
                    callChance = 0.15;
                }

                if (Math.random() < callChance) {
                    if (handEval.rank >= 4 && Math.random() < 0.35 && p.chips > gameState.minRaise) {
                        handlePlayerAction(p.id, 'raise', Math.min(gameState.minRaise, p.chips + p.currentBet));
                    } else {
                        handlePlayerAction(p.id, 'call');
                    }
                } else {
                    handlePlayerAction(p.id, 'fold');
                }
            }
        }, delay);
    }

    // ═══════════════════════════════════════════════
    // SECTION 6: LIVE CHAT (Global Lounge & Table)
    // ═══════════════════════════════════════════════

    function sendLoungeChatMessage(text) {
        if (!text || !text.trim()) return;
        const sender = myName.trim() || 'Player';
        const time = formatTime();
        appendLoungeChatMessage(sender, text.trim(), time, false, true);

        broadcastRealtime('pocketaces_global_chat_v5', {
            type: 'lounge_chat',
            name: sender,
            text: text.trim(),
            time,
            senderId: myId
        });
    }

    function appendLoungeChatMessage(name, text, time = formatTime(), isSystem = false, isMe = false) {
        const container = document.getElementById('lobby-chat-messages');
        if (!container) return;

        const row = document.createElement('div');
        if (isSystem) {
            row.className = 'chat-msg-row';
            row.innerHTML = `<div class="chat-msg-system">${escHtml(text)}</div>`;
        } else {
            row.className = 'chat-msg-row' + (isMe ? ' is-me' : '');
            const av = getAvatar(name);
            row.innerHTML = `
                <div class="chat-msg-header">
                    <span class="chat-msg-name ${isMe ? 'is-me' : ''}" style="color:${isMe ? 'var(--gold)' : av.color}">${escHtml(name)}</span>
                    <span class="chat-msg-time">${time}</span>
                </div>
                <div class="chat-msg-body">${escHtml(text)}</div>
            `;
        }
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;
    }

    function sendGameChatMessage(name, text, isSystem = false, senderId = null) {
        if (!text || !text.trim()) return;
        const sender = name || myName || 'Player';
        const time = formatTime();
        const fromId = senderId || myId;

        appendGameChatMessage(sender, text.trim(), time, isSystem, fromId === myId, fromId);

        if (!isSystem && fromId) {
            showSeatSpeechBubble(fromId, text.trim());
        }

        const payload = {
            type: 'chat',
            name: sender,
            text: text.trim(),
            time,
            isSystem,
            senderId: fromId
        };

        if (isHost) {
            broadcastRealtime(`pocketaces_room_${roomCode}_to_clients`, payload);
        } else {
            broadcastRealtime(`pocketaces_room_${roomCode}_to_host`, payload);
        }
    }

    function appendGameChatMessage(name, text, time = formatTime(), isSystem = false, isMe = false, senderId = null) {
        const container = document.getElementById('game-chat-messages');
        if (!container) return;

        const row = document.createElement('div');
        if (isSystem) {
            row.className = 'chat-msg-row';
            row.innerHTML = `<div class="chat-msg-system">${escHtml(text)}</div>`;
        } else {
            row.className = 'chat-msg-row' + (isMe ? ' is-me' : '');
            const av = getAvatar(name);
            row.innerHTML = `
                <div class="chat-msg-header">
                    <span class="chat-msg-name ${isMe ? 'is-me' : ''}" style="color:${isMe ? 'var(--gold)' : av.color}">${escHtml(name)}</span>
                    <span class="chat-msg-time">${time}</span>
                </div>
                <div class="chat-msg-body">${escHtml(text)}</div>
            `;
        }
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;

        if (!isGameChatOpen && !isMe) {
            unreadChatCount++;
            const unreadBadge = document.getElementById('game-chat-unread');
            unreadBadge.textContent = unreadChatCount > 9 ? '9+' : unreadChatCount;
            unreadBadge.style.display = 'flex';
        }
    }

    function showSeatSpeechBubble(playerId, text) {
        if (!viewState || !viewState.players) return;
        const total = viewState.players.length;
        const layout = getSeatLayout(total);
        const pIdx = viewState.players.findIndex(p => p.id === playerId);
        if (pIdx === -1) return;

        const offset = (pIdx - viewState.myIndex + total) % total;
        const seatPos = layout[offset];
        const seatEl = document.getElementById('seat-' + seatPos);
        if (!seatEl) return;

        const prev = seatEl.querySelector('.seat-speech-bubble');
        if (prev) prev.remove();

        const bubble = document.createElement('div');
        bubble.className = 'seat-speech-bubble';
        bubble.textContent = text.length > 28 ? text.substring(0, 26) + '…' : text;
        seatEl.appendChild(bubble);

        setTimeout(() => {
            bubble.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(-10px) scale(0.8)';
            setTimeout(() => bubble.remove(), 400);
        }, 3600);
    }

    // ═══════════════════════════════════════════════
    // SECTION 7: REALTIME NETWORK RELAY
    // ═══════════════════════════════════════════════

    const seenMessageIds = new Set();
    let localChannel = null;
    let wsRelay = null;
    let isWsConnected = false;

    const WS_RELAY_URLS = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.primal.net'
    ];
    let wsRelayIndex = 0;

    function initNetworking() {
        // 1. Local BroadcastChannel for instant same-browser / multi-tab synchronization
        try {
            if (typeof BroadcastChannel !== 'undefined' && !localChannel) {
                localChannel = new BroadcastChannel('pocketaces_p2p_sync_v5');
                localChannel.onmessage = e => {
                    if (e.data && e.data.msgId) {
                        onIncomingNetworkPayload(e.data);
                    }
                };
            }
        } catch (e) {}

        // 2. Cloud WebSocket for internet sync across different computers/friends
        connectCloudWebSocket();
    }

    function connectCloudWebSocket() {
        if (wsRelay && (wsRelay.readyState === WebSocket.OPEN || wsRelay.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const relayUrl = WS_RELAY_URLS[wsRelayIndex % WS_RELAY_URLS.length];
        try {
            wsRelay = new WebSocket(relayUrl);

            wsRelay.onopen = () => {
                isWsConnected = true;
                const subMsg = JSON.stringify([
                    "REQ",
                    "pa_sub_" + myId,
                    { "kinds": [1], "#t": ["pocketaces_poker_v5"] }
                ]);
                wsRelay.send(subMsg);
            };

            wsRelay.onmessage = event => {
                try {
                    const parsed = JSON.parse(event.data);
                    if (Array.isArray(parsed) && parsed[0] === 'EVENT' && parsed[2] && parsed[2].content) {
                        const payload = JSON.parse(parsed[2].content);
                        if (payload && payload.msgId) {
                            onIncomingNetworkPayload(payload);
                        }
                    }
                } catch (e) {}
            };

            wsRelay.onerror = () => {
                isWsConnected = false;
            };

            wsRelay.onclose = () => {
                isWsConnected = false;
                wsRelayIndex++;
                setTimeout(connectCloudWebSocket, 3000);
            };
        } catch (e) {
            wsRelayIndex++;
            setTimeout(connectCloudWebSocket, 3000);
        }
    }

    function broadcastRealtime(topic, data) {
        const msgId = myId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const payload = {
            msgId,
            topic,
            senderId: myId,
            timestamp: Date.now(),
            data
        };

        seenMessageIds.add(msgId);
        if (seenMessageIds.size > 1000) {
            const first = seenMessageIds.values().next().value;
            seenMessageIds.delete(first);
        }

        // 1. Broadcast locally
        if (localChannel) {
            try { localChannel.postMessage(payload); } catch (e) {}
        }

        // 2. Broadcast to Cloud WebSocket
        if (wsRelay && wsRelay.readyState === WebSocket.OPEN) {
            try {
                const now = Math.floor(Date.now() / 1000);
                const nostrEvent = {
                    id: "ev_" + msgId,
                    pubkey: "pk_" + myId.padEnd(64, '0'),
                    created_at: now,
                    kind: 1,
                    tags: [["t", "pocketaces_poker_v5"]],
                    content: JSON.stringify(payload),
                    sig: "sig_" + msgId
                };
                wsRelay.send(JSON.stringify(["EVENT", nostrEvent]));
            } catch (e) {}
        }
    }

    function onIncomingNetworkPayload(payload) {
        if (!payload || !payload.msgId) return;
        if (seenMessageIds.has(payload.msgId)) return;
        seenMessageIds.add(payload.msgId);
        if (seenMessageIds.size > 1000) {
            const first = seenMessageIds.values().next().value;
            seenMessageIds.delete(first);
        }

        handleNetworkMessage(payload.topic, payload.data, payload.senderId);
    }

    function handleNetworkMessage(topic, data, senderId) {
        // 1. Global Lounge Chat
        if (topic === 'pocketaces_global_chat_v5') {
            if (data && data.type === 'lounge_chat') {
                if (data.senderId !== myId) {
                    appendLoungeChatMessage(data.name, data.text, data.time, !!data.isSystem, false);
                }
            }
            return;
        }

        if (!roomCode) return;

        // 2. Host receiving join request from players
        if (isHost && topic === `pocketaces_room_${roomCode}_join`) {
            if (data && data.type === 'join') {
                if (data.id === myId) return;

                if (gameState.players.length >= MAX_PLAYERS) {
                    broadcastRealtime(`pocketaces_room_${roomCode}_client_${data.id}`, {
                        type: 'error',
                        message: 'Table is full (max 12 players).'
                    });
                    return;
                }
                if (gameState.phase !== 'lobby') {
                    broadcastRealtime(`pocketaces_room_${roomCode}_client_${data.id}`, {
                        type: 'error',
                        message: 'Hand in progress. Please wait for next hand.'
                    });
                    return;
                }

                const existing = gameState.players.find(p => p.id === data.id);
                if (!existing) {
                    addPlayer(data.id, data.name, false);
                    showToast(`${data.name} joined the table!`, 'success');
                    sendGameChatMessage('♠ Dealer', `${data.name} joined the table!`, true);
                }
                broadcastState();
            }
            return;
        }

        // 3. Host receiving player action, in-game chat, or leave message
        if (isHost && topic === `pocketaces_room_${roomCode}_to_host`) {
            if (data && data.type === 'action') {
                handlePlayerAction(data.playerId, data.action, data.amount);
            } else if (data && data.type === 'chat') {
                appendGameChatMessage(data.name, data.text, data.time, data.isSystem, data.senderId === myId, data.senderId);
                if (data.senderId) showSeatSpeechBubble(data.senderId, data.text);
                broadcastRealtime(`pocketaces_room_${roomCode}_to_clients`, data);
            } else if (data && data.type === 'leave') {
                showToast(`${data.name} left the table`, 'info');
                sendGameChatMessage('♠ Dealer', `${data.name} left the table.`, true);
                removePlayer(data.id);
                broadcastState();
            }
            return;
        }

        // 4. Client receiving private view state or errors from host
        if (!isHost && topic === `pocketaces_room_${roomCode}_client_${myId}`) {
            if (data && data.type === 'state') {
                handleIncomingState(data);
            } else if (data && data.type === 'error') {
                showToast(data.message, 'error');
            }
            return;
        }

        // 5. Client receiving general broadcast messages (chat or public state)
        if (!isHost && topic === `pocketaces_room_${roomCode}_to_clients`) {
            if (data && data.type === 'state') {
                handleIncomingState(data);
            } else if (data && data.type === 'chat') {
                if (data.senderId !== myId) {
                    appendGameChatMessage(data.name, data.text, data.time, data.isSystem, false, data.senderId);
                    if (data.senderId) showSeatSpeechBubble(data.senderId, data.text);
                }
            }
            return;
        }
    }

    function handleIncomingState(data) {
        const prevPhase = viewState ? viewState.phase : null;
        const prevHand  = viewState ? viewState.handNumber : null;
        viewState = data;

        if (prevHand !== viewState.handNumber && viewState.phase === 'preflop') {
            runDealPhysicsAnimation();
        }

        renderFromViewState();
    }

    function createRoom() {
        roomCode = generateRoomCode();
        isHost = true;

        initGameState();
        addPlayer(myId, myName, false);

        viewState = makeViewState(myId);
        renderFromViewState();
        showScreen('game');

        return Promise.resolve(roomCode);
    }

    function joinRoom(code) {
        roomCode = code.toUpperCase();
        isHost = false;

        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 8;
            let resolved = false;

            const sendJoinPing = () => {
                if (resolved) return;
                broadcastRealtime(`pocketaces_room_${roomCode}_join`, {
                    type: 'join',
                    name: myName,
                    id: myId
                });
            };

            const checkJoined = () => {
                if (viewState && viewState.roomCode === roomCode) {
                    resolved = true;
                    showScreen('game');
                    resolve();
                    return true;
                }
                return false;
            };

            sendJoinPing();

            const interval = setInterval(() => {
                if (checkJoined()) {
                    clearInterval(interval);
                    return;
                }
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (!resolved) {
                        roomCode = '';
                        reject(new Error('Table not found. Check the room code and try again.'));
                    }
                } else {
                    sendJoinPing();
                }
            }, 750);
        });
    }

    function broadcastState() {
        if (!isHost || !gameState) return;
        const prevPhase = viewState ? viewState.phase : null;
        const prevHand  = viewState ? viewState.handNumber : null;

        for (const player of gameState.players) {
            const view = makeViewState(player.id);
            if (player.id === myId) {
                viewState = view;
                if (prevHand !== viewState.handNumber && viewState.phase === 'preflop') {
                    runDealPhysicsAnimation();
                }
                renderFromViewState();
            } else if (!player.isBot) {
                broadcastRealtime(`pocketaces_room_${roomCode}_client_${player.id}`, view);
            }
        }
    }

    function makeViewState(forId) {
        const myIdx = gameState.players.findIndex(p => p.id === forId);
        const showCards = gameState.phase === 'showdown';

        return {
            type: 'state',
            phase: gameState.phase,
            communityCards: gameState.communityCards.map(c => ({ ...c })),
            players: gameState.players.map((p, i) => ({
                id: p.id,
                name: p.name,
                isBot: !!p.isBot,
                chips: p.chips,
                currentBet: p.currentBet,
                totalBet: p.totalBet,
                folded: p.folded,
                allIn: p.allIn,
                eliminated: p.eliminated,
                hasCards: p.cards.length > 0,
                cards: (p.id === forId || (showCards && !p.folded)) ? p.cards.map(c => ({ ...c })) : null,
                isDealer: i === gameState.dealerIndex
            })),
            myCards: gameState.players[myIdx] ? gameState.players[myIdx].cards.map(c => ({ ...c })) : [],
            myIndex: myIdx,
            dealerIndex: gameState.dealerIndex,
            currentPlayerIndex: gameState.currentPlayerIndex,
            pot: calcTotalPot(),
            highestBet: gameState.highestBet,
            minRaise: gameState.minRaise,
            handNumber: gameState.handNumber,
            smallBlind: SMALL_BLIND,
            bigBlind: BIG_BLIND,
            isHost: forId === myId && isHost,
            results: gameState.results,
            roomCode
        };
    }

    function sendAction(action, amount) {
        if (isHost) {
            handlePlayerAction(myId, action, amount || 0);
        } else {
            broadcastRealtime(`pocketaces_room_${roomCode}_to_host`, {
                type: 'action',
                playerId: myId,
                action,
                amount: amount || 0
            });
        }
    }

    function resetToLanding() {
        if (roomCode) {
            if (!isHost) {
                broadcastRealtime(`pocketaces_room_${roomCode}_to_host`, {
                    type: 'leave',
                    id: myId,
                    name: myName
                });
            }
        }
        roomCode = '';
        isHost = false;
        gameState = null;
        viewState = null;
        if (nextHandTimer) { clearTimeout(nextHandTimer); nextHandTimer = null; }
        showScreen('landing');
    }

    // ═══════════════════════════════════════════════
    // SECTION 8: DEALING PHYSICS & CARD ANIMATIONS
    // ═══════════════════════════════════════════════

    function runDealPhysicsAnimation() {
        const table = document.getElementById('poker-table');
        const dealLayer = document.getElementById('deal-layer');
        if (!table || !dealLayer || !viewState) return;

        dealLayer.innerHTML = '';
        isDealingAnimation = true;

        const totalPlayers = viewState.players.length;
        const layout = getSeatLayout(totalPlayers);

        let dealerPos = 3;
        for (let offset = 0; offset < totalPlayers; offset++) {
            const pIdx = (viewState.myIndex + offset) % totalPlayers;
            if (pIdx === viewState.dealerIndex) {
                dealerPos = layout[offset];
                break;
            }
        }

        const dealerDeck = document.getElementById('dealer-deck');
        dealerDeck.className = `dealer-deck visible seat-pos-${dealerPos}`;

        const tableRect = table.getBoundingClientRect();
        const startX = tableRect.width / 2;
        const startY = tableRect.height / 2 - 20;

        let delayIndex = 0;

        for (let round = 0; round < 2; round++) {
            for (let offset = 0; offset < totalPlayers; offset++) {
                const pIdx = (viewState.myIndex + offset) % totalPlayers;
                const p = viewState.players[pIdx];
                if (p.eliminated) continue;

                const seatPos = layout[offset];
                const seatEl = document.getElementById('seat-' + seatPos);
                if (!seatEl) continue;

                const seatRect = seatEl.getBoundingClientRect();
                const targetX = (seatRect.left + seatRect.width / 2) - tableRect.left;
                const targetY = (seatRect.top + seatRect.height / 2) - tableRect.top;

                const currentDelay = delayIndex * 450;
                delayIndex++;

                setTimeout(() => {
                    playDealSound();
                    const flyingCard = document.createElement('div');
                    flyingCard.className = 'flying-card';
                    flyingCard.style.left = `${startX - 23}px`;
                    flyingCard.style.top = `${startY - 32}px`;
                    flyingCard.style.transform = `scale(0.8) rotate(${Math.random() * 30 - 15}deg)`;

                    dealLayer.appendChild(flyingCard);

                    requestAnimationFrame(() => {
                        flyingCard.style.left = `${targetX - 23}px`;
                        flyingCard.style.top = `${targetY - 32}px`;
                        flyingCard.style.transform = `scale(1) rotate(${offset === 0 ? 0 : (Math.random() * 16 - 8)}deg)`;
                    });

                    setTimeout(() => {
                        playSnapSound();
                        flyingCard.remove();
                    }, 650);
                }, currentDelay);
            }
        }

        setTimeout(() => {
            isDealingAnimation = false;
            dealLayer.innerHTML = '';
        }, delayIndex * 450 + 750);
    }

    // ═══════════════════════════════════════════════
    // SECTION 9: UI RENDERING
    // ═══════════════════════════════════════════════

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById('screen-' + id);
        if (el) el.classList.add('active');
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showConnecting(show, text) {
        const el = document.getElementById('connection-overlay');
        document.getElementById('connection-text').textContent = text || 'Connecting…';
        el.classList.toggle('visible', !!show);
    }

    function updateLoungeProfile() {
        const av = getAvatar(myName);
        const avatarEl = document.getElementById('lounge-user-avatar');
        const nameEl = document.getElementById('lounge-user-name');
        if (avatarEl) {
            avatarEl.textContent = av.initials;
            avatarEl.style.background = av.color;
            avatarEl.style.color = '#fff';
        }
        if (nameEl) {
            nameEl.textContent = myName;
        }
    }

    function renderFromViewState() {
        if (!viewState) return;
        showScreen('game');

        document.getElementById('blind-info').textContent = `Blinds: $${viewState.smallBlind} / $${viewState.bigBlind}`;
        document.getElementById('hand-info').textContent = `Hand #${viewState.handNumber}`;
        document.getElementById('room-info').textContent = `Table: ${viewState.roomCode}`;
        document.getElementById('player-count-badge').textContent = `${viewState.players.length}/${MAX_PLAYERS} Players`;

        const table = document.getElementById('poker-table');
        const playerCountClass = `table-${Math.max(1, Math.min(12, viewState.players.length))}`;
        table.className = `poker-table ${playerCountClass}`;

        const lobbyEl = document.getElementById('table-lobby');
        const isLobby = viewState.phase === 'lobby';
        lobbyEl.classList.toggle('visible', isLobby);

        if (isLobby) {
            document.getElementById('table-room-code').textContent = viewState.roomCode;
            document.getElementById('table-waiting').textContent =
                viewState.isHost ? 'Invite friends with code or add bots, then deal cards!' : 'Waiting for host to deal cards…';

            const startBtn = document.getElementById('btn-start-game');
            startBtn.style.display = viewState.isHost ? 'inline-flex' : 'none';

            const addBotBtn = document.getElementById('btn-add-bot');
            addBotBtn.style.display = (viewState.isHost && viewState.players.length < MAX_PLAYERS) ? 'inline-flex' : 'none';
        }

        renderPot();
        renderCommunityCards();
        renderSeats();
        renderHandHelper();
        renderActionBar();
        renderResults();
    }

    function renderPot() {
        const potDisplay = document.getElementById('pot-display');
        potDisplay.textContent = `Pot: $${viewState.pot}`;

        const chipsWrap = document.getElementById('pot-chips');
        chipsWrap.innerHTML = '';
        if (viewState.pot > 0) {
            const chips = chipBreakdown(viewState.pot);
            chips.forEach(c => {
                const el = document.createElement('span');
                el.className = `chip chip-${c}`;
                chipsWrap.appendChild(el);
            });
        }
    }

    function renderCommunityCards() {
        const container = document.getElementById('community-cards');
        container.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < viewState.communityCards.length) {
                container.appendChild(makeCard(viewState.communityCards[i], false, 'community'));
            } else {
                const ph = document.createElement('div');
                ph.className = 'card card-placeholder community';
                container.appendChild(ph);
            }
        }
    }

    function renderHandHelper() {
        const indicator = document.getElementById('my-hand-indicator');
        const nameEl = document.getElementById('my-hand-name');

        if (!viewState || viewState.phase === 'lobby' || viewState.myCards.length === 0) {
            indicator.style.display = 'none';
            return;
        }

        const hand = evaluateBestHand(viewState.myCards, viewState.communityCards);
        if (hand && hand.name) {
            indicator.style.display = 'flex';
            nameEl.textContent = hand.name;
        } else {
            indicator.style.display = 'none';
        }
    }

    function renderSeats() {
        const total = viewState.players.length;
        const layout = getSeatLayout(total);

        for (let i = 0; i < MAX_PLAYERS; i++) {
            const el = document.getElementById('seat-' + i);
            el.innerHTML = '';
            el.className = 'seat';
            el.style.display = 'none';
        }

        for (let offset = 0; offset < total; offset++) {
            const pIdx = (viewState.myIndex + offset) % total;
            const p = viewState.players[pIdx];
            const seatPos = layout[offset];
            const el = document.getElementById('seat-' + seatPos);

            el.style.display = 'flex';
            el.className = 'seat seat-pos-' + seatPos;

            if (offset === 0) el.classList.add('is-me');
            if (pIdx === viewState.currentPlayerIndex) el.classList.add('active-turn');
            if (p.folded) el.classList.add('folded');
            if (p.eliminated) el.classList.add('eliminated');

            const av = getAvatar(p.name);

            let cardsHtml = '';
            if (p.cards && p.cards.length > 0) {
                cardsHtml = '<div class="seat-cards">' +
                    p.cards.map(c => makeCard(c, false, 'hole card-arrive').outerHTML).join('') +
                    '</div>';
            } else if (p.hasCards && !p.folded) {
                cardsHtml = '<div class="seat-cards">' +
                    '<div class="card card-back card-arrive"></div>' +
                    '<div class="card card-back card-arrive"></div>' +
                    '</div>';
            }

            const dealerHtml = p.isDealer ? '<div class="dealer-button" title="Dealer">D</div>' : '';

            let betHtml = '';
            if (p.currentBet > 0) {
                const chips = chipBreakdown(p.currentBet).slice(0, 3);
                const chipsHtml = chips.map(c => `<span class="chip chip-${c}"></span>`).join('');
                betHtml = `
                    <div class="seat-bet-wrap">
                        ${chipsHtml}
                        <span class="seat-bet">$${p.currentBet}</span>
                    </div>
                `;
            }

            const allInHtml = p.allIn ? '<div class="allin-badge">ALL IN</div>' : '';

            el.innerHTML = `
                ${cardsHtml}
                <div class="seat-info">
                    <div class="seat-avatar" style="background:${av.color}">${av.initials}</div>
                    <div class="seat-details">
                        <div class="seat-name">${escHtml(p.name)}${p.isBot ? ' 🤖' : ''}</div>
                        <div class="seat-chips-amount">$${p.chips}</div>
                    </div>
                    ${dealerHtml}
                </div>
                ${betHtml}
                ${allInHtml}
            `;
        }
    }

    function renderActionBar() {
        const bar = document.getElementById('action-bar');

        if (!viewState || viewState.phase === 'lobby' || viewState.phase === 'showdown' ||
            viewState.phase === 'handEnd' || viewState.phase === 'gameOver') {
            bar.style.display = 'none';
            return;
        }

        const me = viewState.players[viewState.myIndex];
        const isMyTurn = viewState.myIndex === viewState.currentPlayerIndex;

        if (!me || !isMyTurn || me.folded || me.eliminated || me.allIn) {
            bar.style.display = 'none';
            return;
        }

        bar.style.display = 'flex';

        const callAmt = viewState.highestBet - me.currentBet;
        const canCheck = callAmt <= 0;
        const checkCallBtn = document.getElementById('btn-check-call');

        if (canCheck) {
            checkCallBtn.textContent = 'Check';
            checkCallBtn.className = 'btn btn-check';
        } else {
            const actual = Math.min(callAmt, me.chips);
            checkCallBtn.textContent = `Call $${actual}`;
            checkCallBtn.className = 'btn btn-call';
        }

        const raiseSection = document.getElementById('raise-section');
        const minR = Math.max(viewState.minRaise, viewState.highestBet + BIG_BLIND);
        const maxR = me.chips + me.currentBet;

        if (minR >= maxR || me.chips <= callAmt) {
            raiseSection.style.display = 'none';
        } else {
            raiseSection.style.display = 'flex';
            const slider = document.getElementById('raise-slider');
            slider.min = minR;
            slider.max = maxR;
            if (+slider.value < minR) slider.value = minR;
            if (+slider.value > maxR) slider.value = maxR;
            slider.step = BIG_BLIND;
            document.getElementById('btn-raise').textContent = `Raise to $${slider.value}`;
        }

        document.getElementById('btn-allin').textContent = `All In ($${me.chips})`;
    }

    function renderResults() {
        const overlay = document.getElementById('results-overlay');

        const shouldShow = viewState.results &&
            (viewState.phase === 'showdown' || viewState.phase === 'handEnd' || viewState.phase === 'gameOver');

        overlay.classList.toggle('visible', !!shouldShow);
        if (!shouldShow) return;

        const trophy = document.getElementById('results-trophy');
        const title = document.getElementById('results-title');
        title.textContent = viewState.phase === 'gameOver' ? 'Tournament Winner!' : '🎉 Hand Complete';
        trophy.style.display = 'block';

        const content = document.getElementById('results-content');
        content.innerHTML = '';

        const msg = document.createElement('p');
        msg.className = 'results-message';
        msg.textContent = viewState.results.message;
        content.appendChild(msg);

        if (viewState.results.winners) {
            viewState.results.winners.forEach(w => {
                const div = document.createElement('div');
                div.className = 'result-winner';
                div.innerHTML = `
                    <span class="winner-name">${escHtml(w.name)}</span>
                    ${w.amount ? `<span class="winner-amount">+$${w.amount}</span>` : ''}
                    ${w.hand ? `<span class="winner-hand">${w.hand.name}</span>` : ''}
                `;
                content.appendChild(div);
            });
        }

        const nextBtn = document.getElementById('btn-next-hand');
        nextBtn.style.display = (viewState.isHost && viewState.phase !== 'gameOver') ? 'inline-flex' : 'none';

        const fill = document.getElementById('timer-bar-fill');
        fill.style.width = '100%';
        requestAnimationFrame(() => {
            fill.style.width = '0%';
        });
    }

    function makeCard(card, faceDown, extraClass) {
        const el = document.createElement('div');
        if (faceDown || !card) {
            el.className = 'card card-back ' + (extraClass || '');
            return el;
        }
        const color = SUIT_COLORS[card.suit];
        el.className = `card card-front card-${color} ${extraClass || ''}`;
        el.innerHTML = `
            <span class="card-value">${VALUE_NAMES[card.value]}</span>
            <span class="card-suit">${SUIT_SYMBOLS[card.suit]}</span>
        `;
        return el;
    }

    function escHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════
    // SECTION 10: EVENT HANDLERS & LISTENERS
    // ═══════════════════════════════════════════════

    function setupEvents() {
        // ─ Screen 1: Minimal Black Password Gate ─
        const authInput = document.getElementById('input-password');
        const authBtn = document.getElementById('btn-auth-submit');
        const authError = document.getElementById('auth-error');
        const authBox = document.getElementById('auth-box');

        function handleAuth() {
            const val = authInput.value.trim().toLowerCase();
            if (val === SITE_PASSWORD.toLowerCase()) {
                playWinSound();
                sessionStorage.setItem('poker_authed', 'true');
                
                // If name already set in session, go straight to landing, else go to name entry
                const storedName = sessionStorage.getItem('poker_name');
                if (storedName) {
                    myName = storedName;
                    updateLoungeProfile();
                    showScreen('landing');
                } else {
                    showScreen('name');
                    setTimeout(() => document.getElementById('input-name').focus(), 100);
                }
            } else {
                playFoldSound();
                authError.textContent = 'Incorrect password.';
                authBox.classList.remove('shake');
                void authBox.offsetWidth;
                authBox.classList.add('shake');
                setTimeout(() => authBox.classList.remove('shake'), 450);
            }
        }

        authBtn.addEventListener('click', handleAuth);
        authInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleAuth();
        });

        // ─ Screen 2: Name Entry Screen ─
        const nameInput = document.getElementById('input-name');
        const nameBtn = document.getElementById('btn-name-submit');
        const nameError = document.getElementById('name-error');

        function handleNameSubmit() {
            const val = nameInput.value.trim();
            if (!val) {
                nameError.textContent = 'Please enter your name.';
                return;
            }
            nameError.textContent = '';
            myName = val;
            sessionStorage.setItem('poker_name', myName);
            updateLoungeProfile();
            playSnapSound();
            showScreen('landing');
            showToast(`Welcome to the Lounge, ${myName}!`, 'success');
        }

        nameBtn.addEventListener('click', handleNameSubmit);
        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleNameSubmit();
        });

        document.getElementById('btn-change-name').addEventListener('click', () => {
            showScreen('name');
            nameInput.value = myName;
            nameInput.focus();
        });

        // ─ Screen 3: Global Lounge Chat ─
        const lobbyChatInput = document.getElementById('input-lobby-chat');
        const lobbyChatSendBtn = document.getElementById('btn-send-lobby-chat');

        function handleSendLobbyChat() {
            const txt = lobbyChatInput.value;
            if (txt && txt.trim()) {
                sendLoungeChatMessage(txt);
                lobbyChatInput.value = '';
            }
        }

        lobbyChatSendBtn.addEventListener('click', handleSendLobbyChat);
        lobbyChatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleSendLobbyChat();
        });

        document.querySelectorAll('.btn-emoji').forEach(btn => {
            btn.addEventListener('click', () => {
                sendLoungeChatMessage(btn.dataset.emoji);
            });
        });

        // ─ Screen 4: In-Game Live Table Chat Drawer ─
        const gameChatDrawer = document.getElementById('game-chat-drawer');
        const gameChatToggleBtn = document.getElementById('btn-toggle-game-chat');
        const gameChatCloseBtn = document.getElementById('btn-close-game-chat');
        const gameChatInput = document.getElementById('input-game-chat');
        const gameChatSendBtn = document.getElementById('btn-send-game-chat');
        const unreadBadge = document.getElementById('game-chat-unread');

        function toggleGameChat(open) {
            isGameChatOpen = typeof open === 'boolean' ? open : !isGameChatOpen;
            gameChatDrawer.classList.toggle('open', isGameChatOpen);
            if (isGameChatOpen) {
                unreadChatCount = 0;
                unreadBadge.style.display = 'none';
                gameChatInput.focus();
            }
        }

        gameChatToggleBtn.addEventListener('click', () => toggleGameChat());
        gameChatCloseBtn.addEventListener('click', () => toggleGameChat(false));

        function handleSendGameChat() {
            const txt = gameChatInput.value;
            if (txt && txt.trim()) {
                sendGameChatMessage(myName || 'Player', txt, false);
                gameChatInput.value = '';
            }
        }

        gameChatSendBtn.addEventListener('click', handleSendGameChat);
        gameChatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleSendGameChat();
        });

        document.querySelectorAll('.btn-table-emoji').forEach(btn => {
            btn.addEventListener('click', () => {
                sendGameChatMessage(myName || 'Player', btn.dataset.emoji, false);
            });
        });

        // ─ Table Creation & Joining ─
        document.getElementById('btn-create-room').addEventListener('click', async () => {
            if (!myName) {
                showScreen('name');
                return;
            }
            showConnecting(true, 'Creating poker table…');
            try {
                await createRoom();
                showConnecting(false);
                showToast(`Table created: ${roomCode}`, 'success');
                broadcastState();
                sendGameChatMessage('♠ Dealer', `Welcome to table ${roomCode}! Host has opened table.`, true);
            } catch (err) {
                showConnecting(false);
                showToast('Failed to create table: ' + err.message, 'error');
            }
        });

        document.getElementById('btn-join-room').addEventListener('click', async () => {
            if (!myName) {
                showScreen('name');
                return;
            }
            const code = document.getElementById('input-room-code').value.trim().toUpperCase();
            if (!code || code.length < 4) { showToast('Enter a valid 6-character table code', 'error'); return; }
            showConnecting(true, `Joining table ${code}…`);
            try {
                await joinRoom(code);
                showConnecting(false);
                showToast('Seated at the table!', 'success');
            } catch (err) {
                showConnecting(false);
                showToast(err.message || 'Failed to join table', 'error');
            }
        });

        document.getElementById('input-room-code').addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('btn-join-room').click();
        });

        // ─ Table In-Game Controls ─
        document.getElementById('btn-copy-code').addEventListener('click', () => {
            navigator.clipboard.writeText(roomCode).then(() => showToast('Table code copied to clipboard!', 'success'))
                .catch(() => showToast('Failed to copy code', 'error'));
        });

        document.getElementById('btn-add-bot').addEventListener('click', () => addBotPlayer());
        document.getElementById('btn-start-game').addEventListener('click', () => startGame());
        document.getElementById('btn-leave-room').addEventListener('click', () => resetToLanding());

        // ─ Sound Toggle (Disabled) ─
        const soundBtn = document.getElementById('btn-sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', e => {
                soundEnabled = !soundEnabled;
                e.target.textContent = soundEnabled ? '🔊' : '🔇';
                showToast(soundEnabled ? 'Sound effects enabled' : 'Sound effects muted', 'info');
            });
        }

        // ─ Poker Actions ─
        document.getElementById('btn-fold').addEventListener('click', () => sendAction('fold'));

        document.getElementById('btn-check-call').addEventListener('click', () => {
            if (!viewState) return;
            const me = viewState.players[viewState.myIndex];
            const callAmt = viewState.highestBet - me.currentBet;
            sendAction(callAmt <= 0 ? 'check' : 'call');
        });

        document.getElementById('btn-raise').addEventListener('click', () => {
            const amount = +document.getElementById('raise-slider').value;
            sendAction('raise', amount);
        });

        // ─ Raise Slider & Quick Bets ─
        document.getElementById('raise-slider').addEventListener('input', e => {
            document.getElementById('btn-raise').textContent = `Raise to $${e.target.value}`;
        });

        document.getElementById('btn-raise-minus').addEventListener('click', () => {
            const s = document.getElementById('raise-slider');
            s.value = Math.max(+s.min, +s.value - +s.step);
            s.dispatchEvent(new Event('input'));
        });

        document.getElementById('btn-raise-plus').addEventListener('click', () => {
            const s = document.getElementById('raise-slider');
            s.value = Math.min(+s.max, +s.value + +s.step);
            s.dispatchEvent(new Event('input'));
        });

        document.querySelectorAll('.btn-quick').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!viewState) return;
                const me = viewState.players[viewState.myIndex];
                const slider = document.getElementById('raise-slider');
                const minR = +slider.min;
                const maxR = +slider.max;
                const pot = viewState.pot;
                const type = btn.dataset.type;

                let target = minR;
                switch (type) {
                    case 'min': target = minR; break;
                    case 'half': target = Math.floor((me.currentBet + pot * 0.5) / 10) * 10; break;
                    case 'pot':  target = Math.floor((me.currentBet + pot) / 10) * 10; break;
                    case '2x':   target = Math.floor((me.currentBet + pot * 2) / 10) * 10; break;
                    case 'max':  target = maxR; break;
                }
                target = Math.max(minR, Math.min(maxR, target));
                slider.value = target;
                slider.dispatchEvent(new Event('input'));
            });
        });

        document.getElementById('btn-allin').addEventListener('click', () => sendAction('allin'));

        document.getElementById('btn-next-hand').addEventListener('click', () => {
            if (isHost && nextHandTimer) {
                clearTimeout(nextHandTimer);
                nextHandTimer = null;
            }
            if (isHost) {
                checkEliminations();
                if (canContinue()) {
                    gameState.players.forEach(p => { p.currentBet = 0; p.totalBet = 0; });
                    moveDealerAndStart();
                }
            }
        });

        // ─ Keyboard Shortcuts ─
        document.addEventListener('keydown', e => {
            if (!viewState || document.activeElement.tagName === 'INPUT') return;
            const bar = document.getElementById('action-bar');
            if (bar.style.display === 'none') return;

            switch (e.key.toLowerCase()) {
                case 'f': document.getElementById('btn-fold').click(); break;
                case 'c': document.getElementById('btn-check-call').click(); break;
                case 'r': document.getElementById('btn-raise').click(); break;
                case 'a': document.getElementById('btn-allin').click(); break;
            }
        });
    }

    // ═══════════════════════════════════════════════
    // SECTION 11: INITIALIZATION
    // ═══════════════════════════════════════════════

    function init() {
        setupEvents();
        initNetworking();
        appendLoungeChatMessage('♠ Dealer Bot', 'Welcome to Pocket Aces Lounge! Global chat and tables are live.', formatTime(), true);

        const isAuth = sessionStorage.getItem('poker_authed') === 'true';
        const savedName = sessionStorage.getItem('poker_name');

        if (!isAuth) {
            showScreen('auth');
            setTimeout(() => document.getElementById('input-password').focus(), 100);
        } else if (!savedName) {
            showScreen('name');
            setTimeout(() => document.getElementById('input-name').focus(), 100);
        } else {
            myName = savedName;
            updateLoungeProfile();
            showScreen('landing');
        }
        showConnecting(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
