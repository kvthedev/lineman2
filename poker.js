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

    const CHARACTER_PRESETS = [
        {
            id: 'preset_maverick',
            name: 'The Maverick',
            bg: 'linear-gradient(135deg, #e67e22, #d35400)',
            skin: '#d89b6c',
            hairStyle: 'cowboy_hat',
            hairColor: '#4a2c1b',
            glasses: 'aviator',
            facialHair: 'stubble',
            outfit: 'leather'
        },
        {
            id: 'preset_highroller',
            name: 'High Roller',
            bg: 'linear-gradient(135deg, #2d3436, #1e272e)',
            skin: '#f5c29a',
            hairStyle: 'slick',
            hairColor: '#1b1b1b',
            glasses: 'shades',
            facialHair: 'none',
            outfit: 'tuxedo'
        },
        {
            id: 'preset_duchess',
            name: 'The Duchess',
            bg: 'linear-gradient(135deg, #8e44ad, #6c5ce7)',
            skin: '#ffd5b5',
            hairStyle: 'tiara',
            hairColor: '#d4ac0d',
            glasses: 'none',
            facialHair: 'none',
            outfit: 'crimson_suit'
        },
        {
            id: 'preset_cardshark',
            name: 'Card Shark',
            bg: 'linear-gradient(135deg, #0984e3, #00cec9)',
            skin: '#c68642',
            hairStyle: 'fade',
            hairColor: '#00cec9',
            glasses: 'visor',
            facialHair: 'goatee',
            outfit: 'cyber_jacket'
        },
        {
            id: 'preset_gentleman',
            name: 'The Gentleman',
            bg: 'linear-gradient(135deg, #2c3e50, #1a252f)',
            skin: '#ffd5b5',
            hairStyle: 'parted',
            hairColor: '#bdc3c7',
            glasses: 'monocle',
            facialHair: 'mustache',
            outfit: 'tuxedo'
        },
        {
            id: 'preset_vipqueen',
            name: 'VIP Queen',
            bg: 'linear-gradient(135deg, #10ac84, #1dd1a1)',
            skin: '#8d5524',
            hairStyle: 'ponytail',
            hairColor: '#1b1b1b',
            glasses: 'designer',
            facialHair: 'none',
            outfit: 'gold_suit'
        },
        {
            id: 'preset_thedon',
            name: 'The Don',
            bg: 'linear-gradient(135deg, #3d0c1e, #111111)',
            skin: '#c68642',
            hairStyle: 'fedora',
            hairColor: '#1b1b1b',
            glasses: 'shades',
            facialHair: 'stubble',
            outfit: 'crimson_suit'
        },
        {
            id: 'preset_gambler',
            name: 'The Gambler',
            bg: 'linear-gradient(135deg, #f39c12, #e67e22)',
            skin: '#d89b6c',
            hairStyle: 'pompadour',
            hairColor: '#4a2c1b',
            glasses: 'aviator',
            facialHair: 'beard',
            outfit: 'hawaiian'
        },
        {
            id: 'preset_detective',
            name: 'The Detective',
            bg: 'linear-gradient(135deg, #4b6584, #2c3e50)',
            skin: '#f5c29a',
            hairStyle: 'fedora',
            hairColor: '#4a2c1b',
            glasses: 'designer',
            facialHair: 'stubble',
            outfit: 'leather'
        },
        {
            id: 'preset_neonrebel',
            name: 'Neon Rebel',
            bg: 'linear-gradient(135deg, #e84393, #6c5ce7)',
            skin: '#4a2c11',
            hairStyle: 'beanie',
            hairColor: '#9b59b6',
            glasses: 'shades',
            facialHair: 'goatee',
            outfit: 'hoodie'
        },
        {
            id: 'preset_silverfox',
            name: 'Silver Fox',
            bg: 'linear-gradient(135deg, #f1c40f, #f39c12)',
            skin: '#c68642',
            hairStyle: 'slick',
            hairColor: '#bdc3c7',
            glasses: 'designer',
            facialHair: 'goatee',
            outfit: 'gold_suit'
        },
        {
            id: 'preset_baron',
            name: 'The Baron',
            bg: 'linear-gradient(135deg, #b71540, #0c2461)',
            skin: '#f5c29a',
            hairStyle: 'top_hat',
            hairColor: '#1b1b1b',
            glasses: 'monocle',
            facialHair: 'mustache',
            outfit: 'dealer_vest'
        }
    ];

    const SWATCHES = {
        skins: [
            { color: '#ffd5b5', name: 'Fair Porcelain' },
            { color: '#f5c29a', name: 'Warm Light' },
            { color: '#d89b6c', name: 'Tan Sand' },
            { color: '#c68642', name: 'Golden Bronze' },
            { color: '#8d5524', name: 'Warm Chestnut' },
            { color: '#4a2c11', name: 'Deep Espresso' }
        ],
        hairStyles: [
            { id: 'pompadour', name: 'Pompadour', icon: '💈' },
            { id: 'slick', name: 'Slick Back', icon: '✨' },
            { id: 'parted', name: 'Side Part', icon: '💼' },
            { id: 'fade', name: 'Fade Cut', icon: '✂️' },
            { id: 'curly', name: 'Curly Waves', icon: '🌀' },
            { id: 'long', name: 'Long Locks', icon: '🌊' },
            { id: 'ponytail', name: 'Ponytail', icon: '🎀' },
            { id: 'buzz', name: 'Buzz Cut', icon: '⚡' },
            { id: 'cowboy_hat', name: 'Cowboy Hat', icon: '🤠' },
            { id: 'fedora', name: 'Noir Fedora', icon: '🕵️' },
            { id: 'top_hat', name: 'Top Hat', icon: '🎩' },
            { id: 'beanie', name: 'Street Beanie', icon: '🧢' },
            { id: 'tiara', name: 'Royal Tiara', icon: '👑' }
        ],
        hairColors: [
            { color: '#1b1b1b', name: 'Obsidian Black' },
            { color: '#4a2c1b', name: 'Chestnut Brown' },
            { color: '#d4ac0d', name: 'Golden Blonde' },
            { color: '#962d1c', name: 'Auburn Copper' },
            { color: '#bdc3c7', name: 'Platinum Silver' },
            { color: '#00cec9', name: 'Cyber Cyan' },
            { color: '#9b59b6', name: 'Neon Purple' }
        ],
        glasses: [
            { id: 'none', name: 'None', icon: '👁️' },
            { id: 'aviator', name: 'Aviator Gold', icon: '🕶️' },
            { id: 'shades', name: 'VIP Shades', icon: '😎' },
            { id: 'designer', name: 'Round Wire', icon: '👓' },
            { id: 'monocle', name: 'Gold Monocle', icon: '🧐' },
            { id: 'visor', name: 'Cyber Visor', icon: '🥽' }
        ],
        facialHair: [
            { id: 'none', name: 'Clean Shaven', icon: '🪒' },
            { id: 'stubble', name: '5 O’Clock Stubble', icon: '🧔' },
            { id: 'beard', name: 'Full Groomed Beard', icon: '🧔‍♂️' },
            { id: 'goatee', name: 'Sculpted Goatee', icon: '⚡' },
            { id: 'mustache', name: 'Gentleman Mustache', icon: '🥸' }
        ],
        outfits: [
            { id: 'tuxedo', name: 'Black Tuxedo', icon: '🤵' },
            { id: 'crimson_suit', name: 'Crimson Velvet', icon: '🍷' },
            { id: 'gold_suit', name: 'Gold Silk Suit', icon: '🥇' },
            { id: 'leather', name: 'Biker Leather', icon: '🏍️' },
            { id: 'hoodie', name: 'Streetwear Hoodie', icon: '🧥' },
            { id: 'hawaiian', name: 'Casino Resort Shirt', icon: '🌺' },
            { id: 'dealer_vest', name: 'Dealer Vest', icon: '♠️' },
            { id: 'cyber_jacket', name: 'Cyber Jacket', icon: '⚡' }
        ]
    };

    function loadSavedAvatar() {
        try {
            const saved = localStorage.getItem('poker_avatar');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.skin || parsed.hairStyle) return parsed;
                    const found = CHARACTER_PRESETS.find(a => a.id === parsed.id);
                    if (found) return found;
                }
            }
        } catch (e) {}
        return Object.assign({}, CHARACTER_PRESETS[0]);
    }

    // ─── APPLICATION STATE ─────────────────────────
    let myId     = 'p_' + Math.random().toString(36).substring(2, 9);
    let myName   = '';
    let myAvatar = loadSavedAvatar();
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

    function shadeColor(color, percent) {
        if (!color || typeof color !== 'string' || !color.startsWith('#')) return color || '#111111';
        let num = parseInt(color.slice(1), 16);
        if (color.length === 4) {
            num = parseInt(color[1]+color[1]+color[2]+color[2]+color[3]+color[3], 16);
        }
        let r = (num >> 16) + Math.round(255 * (percent / 100));
        let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
        let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function generate2DAvatarSVG(cfg = {}, size = 64) {
        const skin = cfg.skin || '#f5c29a';
        const darkSkin = shadeColor(skin, -22);
        const hairColor = cfg.hairColor || '#1b1b1b';
        const darkHair = shadeColor(hairColor, -25);
        const highlightColor = shadeColor(hairColor, 35);
        const hairStyle = cfg.hairStyle || 'slick';
        const glasses = cfg.glasses || 'none';
        const facialHair = cfg.facialHair || 'none';
        const outfit = cfg.outfit || 'tuxedo';
        const uid = 'av_' + Math.random().toString(36).substring(2, 8);

        // Outfit SVG layer
        let outfitSvg = '';
        if (outfit === 'tuxedo') {
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#181a20"/>
                <polygon points="42,68 58,68 50,92" fill="#ffffff"/>
                <polygon points="35,68 44,68 50,88 38,88" fill="#282a32"/>
                <polygon points="65,68 56,68 50,88 62,88" fill="#282a32"/>
                <polygon points="44,70 50,73 44,76" fill="#111"/><polygon points="56,70 50,73 56,76" fill="#111"/><circle cx="50" cy="73" r="2.2" fill="#111"/>
                <circle cx="50" cy="81" r="1.3" fill="#f1c40f"/><circle cx="50" cy="87" r="1.3" fill="#f1c40f"/>
            `;
        } else if (outfit === 'crimson_suit') {
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#800f2f"/>
                <polygon points="35,68 45,68 50,90 38,90" fill="#a4133c"/>
                <polygon points="65,68 55,68 50,90 62,90" fill="#a4133c"/>
                <polygon points="43,68 57,68 50,85" fill="#1e1e24"/>
                <polygon points="48,70 52,70 50,82" fill="#d90429"/>
                <circle cx="40" cy="75" r="1.8" fill="#ffd700"/>
            `;
        } else if (outfit === 'gold_suit') {
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#c59b27"/>
                <polygon points="35,68 45,68 50,90 37,90" fill="#dfb135"/>
                <polygon points="65,68 55,68 50,90 63,90" fill="#dfb135"/>
                <path d="M 40 68 C 40 64, 60 64, 60 68 L 56 86 L 44 86 Z" fill="#151515"/>
                <path d="M 44 72 Q 50 82 56 72" stroke="#ffd700" stroke-width="1.8" fill="none"/>
            `;
        } else if (outfit === 'leather') {
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#212529"/>
                <path d="M 33 70 L 45 78 L 38 88 Z" fill="#343a40"/>
                <path d="M 67 70 L 55 78 L 62 88 Z" fill="#343a40"/>
                <path d="M 43 68 L 57 68 L 50 80 Z" fill="#495057"/>
                <line x1="48" y1="78" x2="48" y2="100" stroke="#ced4da" stroke-width="1.5" stroke-dasharray="2,1"/>
            `;
        } else if (outfit === 'hoodie') {
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#2b3a4a"/>
                <path d="M 36 66 C 36 60, 64 60, 64 66 C 64 74, 36 74, 36 66 Z" fill="#1e2733"/>
                <path d="M 45 70 Q 43 78 44 86" stroke="#ffffff" stroke-width="1.2" fill="none"/>
                <path d="M 55 70 Q 57 78 56 86" stroke="#ffffff" stroke-width="1.2" fill="none"/>
            `;
        } else if (outfit === 'hawaiian') {
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#087e8b"/>
                <polygon points="44,68 56,68 50,82" fill="${skin}"/>
                <circle cx="28" cy="84" r="3.5" fill="#ff5a5f" opacity="0.8"/>
                <circle cx="72" cy="86" r="3.5" fill="#f5a623" opacity="0.8"/>
                <circle cx="38" cy="94" r="3" fill="#ffeaa7" opacity="0.8"/>
                <circle cx="62" cy="92" r="3.5" fill="#ff5a5f" opacity="0.8"/>
            `;
        } else if (outfit === 'dealer_vest') {
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#ffffff"/>
                <path d="M 22 100 L 28 72 L 44 72 L 50 86 L 56 72 L 72 72 L 78 100 Z" fill="#2b0a16"/>
                <polygon points="44,68 50,71 44,74" fill="#111"/><polygon points="56,68 50,71 56,74" fill="#111"/><circle cx="50" cy="71" r="2" fill="#111"/>
                <path d="M 52 82 Q 62 86 64 78" stroke="#ffd700" stroke-width="1.2" fill="none"/>
            `;
        } else {
            // cyber_jacket
            outfitSvg = `
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#101820"/>
                <path d="M 34 68 L 38 60 L 62 60 L 66 68 Z" fill="#1a2634" stroke="#00cec9" stroke-width="1.2"/>
                <line x1="28" y1="80" x2="44" y2="100" stroke="#fd79a8" stroke-width="1.5"/>
                <line x1="72" y1="80" x2="56" y2="100" stroke="#00cec9" stroke-width="1.5"/>
            `;
        }

        // Facial hair layer
        let facialHairSvg = '';
        if (facialHair === 'stubble') {
            facialHairSvg = `
                <path d="M 34 52 C 34 63, 40 66, 50 66.5 C 60 66.5, 66 63, 66 52 C 63 56, 56 59, 50 59 C 44 59, 37 56, 34 52 Z" fill="#000000" opacity="0.18"/>
            `;
        } else if (facialHair === 'beard') {
            facialHairSvg = `
                <path d="M 32 48 C 32 64, 40 69, 50 69.5 C 60 69.5, 68 64, 68 48 C 65 54, 60 64, 50 64 C 40 64, 35 54, 32 48 Z" fill="${hairColor}"/>
                <path d="M 42 53 Q 50 50 58 53 Q 50 55 42 53 Z" fill="${hairColor}"/>
            `;
        } else if (facialHair === 'goatee') {
            facialHairSvg = `
                <path d="M 43 53 Q 50 51 57 53 Q 50 55 43 53 Z" fill="${hairColor}"/>
                <path d="M 45 58 C 45 66, 47 68.5, 50 68.5 C 53 68.5, 55 66, 55 58 Q 50 61 45 58 Z" fill="${hairColor}"/>
            `;
        } else if (facialHair === 'mustache') {
            facialHairSvg = `
                <path d="M 41 53 Q 45 49 50 53 Q 55 49 59 53 Q 55 56 50 54.5 Q 45 56 41 53 Z" fill="${hairColor}"/>
            `;
        }

        // Hair / Hat layer
        let hairSvg = '';
        if (hairStyle === 'pompadour') {
            hairSvg = `
                <path d="M 30 35 C 28 14, 38 6, 50 5 C 62 6, 72 14, 70 35 C 65 26, 58 24, 50 25 C 42 24, 35 26, 30 35 Z" fill="${hairColor}"/>
                <path d="M 42 10 Q 50 7 58 10" stroke="${highlightColor}" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.5"/>
            `;
        } else if (hairStyle === 'slick') {
            hairSvg = `
                <path d="M 29 36 C 29 16, 40 10, 50 10 C 60 10, 71 16, 71 36 C 68 28, 60 26, 50 26 C 40 26, 32 28, 29 36 Z" fill="${hairColor}"/>
                <path d="M 40 14 Q 50 12 60 14" stroke="${highlightColor}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/>
            `;
        } else if (hairStyle === 'parted') {
            hairSvg = `
                <path d="M 29 36 C 28 15, 42 9, 50 9 C 64 9, 71 17, 71 36 C 67 27, 56 25, 48 25 C 38 25, 32 28, 29 36 Z" fill="${hairColor}"/>
                <line x1="42" y1="12" x2="44" y2="25" stroke="${darkHair}" stroke-width="1.5"/>
            `;
        } else if (hairStyle === 'fade') {
            hairSvg = `
                <path d="M 29 36 C 29 20, 38 12, 50 12 C 62 12, 71 20, 71 36 C 68 30, 62 27, 50 27 C 38 27, 32 30, 29 36 Z" fill="${hairColor}"/>
                <rect x="29" y="32" width="4" height="14" fill="${hairColor}" opacity="0.4"/>
                <rect x="67" y="32" width="4" height="14" fill="${hairColor}" opacity="0.4"/>
            `;
        } else if (hairStyle === 'curly') {
            hairSvg = `
                <path d="M 28 36 C 26 14, 36 6, 50 6 C 64 6, 74 14, 72 36 C 68 32, 64 26, 58 28 C 52 24, 46 25, 42 28 C 36 26, 32 32, 28 36 Z" fill="${hairColor}"/>
                <circle cx="36" cy="18" r="5" fill="${hairColor}"/>
                <circle cx="48" cy="12" r="6" fill="${hairColor}"/>
                <circle cx="60" cy="16" r="5.5" fill="${hairColor}"/>
                <circle cx="68" cy="24" r="5" fill="${hairColor}"/>
                <circle cx="32" cy="25" r="5" fill="${hairColor}"/>
            `;
        } else if (hairStyle === 'long') {
            hairSvg = `
                <path d="M 28 36 C 26 14, 36 8, 50 8 C 64 8, 74 14, 72 36 C 76 50, 75 75, 73 82 C 68 82, 67 65, 68 48 C 66 32, 58 26, 50 26 C 42 26, 34 32, 32 48 C 33 65, 32 82, 27 82 C 25 75, 24 50, 28 36 Z" fill="${hairColor}"/>
            `;
        } else if (hairStyle === 'ponytail') {
            hairSvg = `
                <path d="M 29 36 C 29 16, 40 10, 50 10 C 60 10, 71 16, 71 36 C 67 28, 60 26, 50 26 C 40 26, 33 28, 29 36 Z" fill="${hairColor}"/>
                <ellipse cx="50" cy="6" rx="8" ry="7" fill="${hairColor}"/>
                <circle cx="50" cy="11" r="3" fill="#e74c3c"/>
            `;
        } else if (hairStyle === 'buzz') {
            hairSvg = `
                <path d="M 30 36 C 30 18, 38 12, 50 12 C 62 12, 70 18, 70 36 C 67 30, 60 27, 50 27 C 40 27, 33 30, 30 36 Z" fill="${hairColor}" opacity="0.85"/>
            `;
        } else if (hairStyle === 'cowboy_hat') {
            hairSvg = `
                <path d="M 30 36 C 30 25, 70 25, 70 36 Z" fill="${hairColor}"/>
                <path d="M 12 36 C 26 31, 74 31, 88 36 C 78 41, 22 41, 12 36 Z" fill="#8d5524"/>
                <path d="M 32 35 C 32 14, 43 19, 50 14 C 57 19, 68 14, 68 35 Z" fill="#6f3d17"/>
                <path d="M 31 34 C 40 32, 60 32, 69 34 L 69 36 C 60 34, 40 34, 31 36 Z" fill="#3a1e0b"/>
                <circle cx="50" cy="34" r="2" fill="#f1c40f"/>
            `;
        } else if (hairStyle === 'fedora') {
            hairSvg = `
                <path d="M 30 36 C 30 25, 70 25, 70 36 Z" fill="${hairColor}"/>
                <path d="M 15 35 C 28 30, 72 30, 85 35 C 75 40, 25 40, 15 35 Z" fill="#2c3e50"/>
                <path d="M 31 34 C 31 16, 42 20, 50 16 C 58 20, 69 16, 69 34 Z" fill="#1e272e"/>
                <rect x="31" y="30" width="38" height="4" fill="#e74c3c"/>
            `;
        } else if (hairStyle === 'top_hat') {
            hairSvg = `
                <path d="M 30 36 C 30 25, 70 25, 70 36 Z" fill="${hairColor}"/>
                <ellipse cx="50" cy="34" rx="28" ry="4.5" fill="#1e272e"/>
                <path d="M 32 34 L 33 8 L 67 8 L 68 34 Z" fill="#111111"/>
                <ellipse cx="50" cy="8" rx="17" ry="2.5" fill="#2c3e50"/>
                <rect x="32" y="27" width="36" height="5" fill="#c0392b"/>
            `;
        } else if (hairStyle === 'beanie') {
            hairSvg = `
                <path d="M 28 35 C 27 10, 73 10, 72 35 Z" fill="#e17055"/>
                <rect x="26" y="30" width="48" height="8" rx="3" fill="#d63031"/>
                <line x1="32" y1="30" x2="32" y2="38" stroke="rgba(0,0,0,0.15)" stroke-width="1.2"/>
                <line x1="41" y1="30" x2="41" y2="38" stroke="rgba(0,0,0,0.15)" stroke-width="1.2"/>
                <line x1="50" y1="30" x2="50" y2="38" stroke="rgba(0,0,0,0.15)" stroke-width="1.2"/>
                <line x1="59" y1="30" x2="59" y2="38" stroke="rgba(0,0,0,0.15)" stroke-width="1.2"/>
                <line x1="68" y1="30" x2="68" y2="38" stroke="rgba(0,0,0,0.15)" stroke-width="1.2"/>
            `;
        } else if (hairStyle === 'tiara') {
            hairSvg = `
                <path d="M 29 36 C 29 16, 40 10, 50 10 C 60 10, 71 16, 71 36 C 67 28, 60 26, 50 26 C 40 26, 33 28, 29 36 Z" fill="${hairColor}"/>
                <path d="M 35 24 L 38 18 L 44 23 L 50 13 L 56 23 L 62 18 L 65 24 Z" fill="#ffd700" stroke="#b8860b" stroke-width="0.8"/>
                <circle cx="50" cy="17" r="1.8" fill="#e74c3c"/>
                <circle cx="38" cy="20" r="1.2" fill="#00cec9"/>
                <circle cx="62" cy="20" r="1.2" fill="#00cec9"/>
            `;
        }

        // Glasses layer
        let glassesSvg = '';
        if (glasses === 'aviator') {
            glassesSvg = `
                <path d="M 34 40 C 34 38, 48 38, 48 40 L 47 47 C 46 50, 36 50, 35 47 Z" fill="rgba(30,30,30,0.75)" stroke="#ffd700" stroke-width="1.4"/>
                <path d="M 52 40 C 52 38, 66 38, 66 40 L 65 47 C 64 50, 54 50, 53 47 Z" fill="rgba(30,30,30,0.75)" stroke="#ffd700" stroke-width="1.4"/>
                <line x1="47" y1="41" x2="53" y2="41" stroke="#ffd700" stroke-width="1.5"/>
                <line x1="38" y1="37" x2="62" y2="37" stroke="#ffd700" stroke-width="1.2"/>
            `;
        } else if (glasses === 'shades') {
            glassesSvg = `
                <polygon points="32,38 48,38 46,48 34,48" fill="#111111" stroke="#333333" stroke-width="1.2"/>
                <polygon points="52,38 68,38 66,48 54,48" fill="#111111" stroke="#333333" stroke-width="1.2"/>
                <line x1="47" y1="40" x2="53" y2="40" stroke="#111111" stroke-width="2.5"/>
                <polygon points="34,40 46,40 42,46 36,46" fill="rgba(255,255,255,0.18)"/>
            `;
        } else if (glasses === 'designer') {
            glassesSvg = `
                <circle cx="41.5" cy="43" r="6" fill="rgba(255,255,255,0.15)" stroke="#c5a059" stroke-width="1.6"/>
                <circle cx="58.5" cy="43" r="6" fill="rgba(255,255,255,0.15)" stroke="#c5a059" stroke-width="1.6"/>
                <line x1="47.5" y1="43" x2="52.5" y2="43" stroke="#c5a059" stroke-width="1.5"/>
            `;
        } else if (glasses === 'monocle') {
            glassesSvg = `
                <circle cx="58.5" cy="43" r="6.5" fill="rgba(255,255,255,0.22)" stroke="#ffd700" stroke-width="1.8"/>
                <path d="M 65 43 Q 70 56 62 68" stroke="#ffd700" stroke-width="1" fill="none"/>
            `;
        } else if (glasses === 'visor') {
            glassesSvg = `
                <polygon points="28,39 72,39 69,47 31,47" fill="#00cec9" opacity="0.85" stroke="#00ffff" stroke-width="1.2"/>
                <line x1="30" y1="43" x2="70" y2="43" stroke="#ffffff" stroke-width="1" opacity="0.7"/>
            `;
        }

        return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="avatar-2d-svg">
            <defs>
                <clipPath id="${uid}_c"><circle cx="50" cy="50" r="48"/></clipPath>
            </defs>
            <g clip-path="url(#${uid}_c)">
                <!-- Soft top glow -->
                <circle cx="50" cy="30" r="48" fill="#ffffff" fill-opacity="0.1"/>

                <!-- Shoulders & Outfit -->
                <g class="layer-outfit">${outfitSvg}</g>

                <!-- Neck -->
                <path d="M 43 54 L 43 70 C 47 73, 53 73, 57 70 L 57 54 Z" fill="${darkSkin}"/>

                <!-- Ears -->
                <ellipse cx="29" cy="46" rx="4" ry="6.5" fill="${skin}"/>
                <ellipse cx="71" cy="46" rx="4" ry="6.5" fill="${skin}"/>
                <ellipse cx="29" cy="46" rx="2" ry="3.5" fill="${darkSkin}" opacity="0.6"/>
                <ellipse cx="71" cy="46" rx="2" ry="3.5" fill="${darkSkin}" opacity="0.6"/>

                <!-- Head / Face -->
                <path d="M 31 38 C 31 18, 69 18, 69 38 C 69 57, 63 67, 50 67 C 37 67, 31 57, 31 38 Z" fill="${skin}"/>

                <!-- Eyes & Eyebrows -->
                <ellipse cx="41.5" cy="43" rx="3.5" ry="2.6" fill="#ffffff"/>
                <ellipse cx="41.5" cy="43" rx="2" ry="2.3" fill="#1a252f"/>
                <circle cx="42.3" cy="42.2" r="0.8" fill="#ffffff"/>

                <ellipse cx="58.5" cy="43" rx="3.5" ry="2.6" fill="#ffffff"/>
                <ellipse cx="58.5" cy="43" rx="2" ry="2.3" fill="#1a252f"/>
                <circle cx="59.3" cy="42.2" r="0.8" fill="#ffffff"/>

                <path d="M 37 37 Q 41.5 33.5 46.5 37" stroke="${hairColor}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
                <path d="M 53.5 37 Q 58.5 33.5 63 37" stroke="${hairColor}" stroke-width="2.4" stroke-linecap="round" fill="none"/>

                <!-- Nose -->
                <path d="M 49 44 Q 50.5 49.5 52.5 49" stroke="${darkSkin}" stroke-width="1.8" stroke-linecap="round" fill="none"/>

                <!-- Mouth -->
                <path d="M 44.5 56 Q 50 59.5 55.5 56" stroke="#7a2e2e" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M 47 60 Q 50 61.5 53 60" stroke="${darkSkin}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.6"/>

                <!-- Facial Hair -->
                <g class="layer-facial-hair">${facialHairSvg}</g>

                <!-- Hair / Hat -->
                <g class="layer-hair">${hairSvg}</g>

                <!-- Glasses / Accessories -->
                <g class="layer-glasses">${glassesSvg}</g>
            </g>
        </svg>`;
    }

    function generateDealerSVG(size = 48) {
        const uid = 'dealer_' + Math.random().toString(36).substring(2, 8);
        return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="dealer-2d-svg">
            <defs>
                <clipPath id="${uid}_c"><circle cx="50" cy="50" r="48"/></clipPath>
            </defs>
            <g clip-path="url(#${uid}_c)">
                <!-- Dealer Outfit (Formal Casino Uniform) -->
                <path d="M 15 100 C 15 72, 32 68, 50 68 C 68 68, 85 72, 85 100 Z" fill="#ffffff"/>
                <path d="M 22 100 L 28 72 L 44 72 L 50 86 L 56 72 L 72 72 L 78 100 Z" fill="#3b0918"/>
                <polygon points="44,68 50,71 44,74" fill="#111"/><polygon points="56,68 50,71 56,74" fill="#111"/><circle cx="50" cy="71" r="2" fill="#111"/>
                <rect x="62" y="76" width="10" height="4" rx="1" fill="#f1c40f"/>
                <line x1="63" y1="78" x2="71" y2="78" stroke="#111" stroke-width="0.8"/>

                <!-- Neck -->
                <path d="M 43 54 L 43 70 C 47 73, 53 73, 57 70 L 57 54 Z" fill="#d99f73"/>

                <!-- Ears -->
                <ellipse cx="29" cy="46" rx="4" ry="6.5" fill="#f5c29a"/>
                <ellipse cx="71" cy="46" rx="4" ry="6.5" fill="#f5c29a"/>

                <!-- Head / Face -->
                <path d="M 31 38 C 31 18, 69 18, 69 38 C 69 57, 63 67, 50 67 C 37 67, 31 57, 31 38 Z" fill="#f5c29a"/>

                <!-- Eyes & Eyebrows -->
                <ellipse cx="41.5" cy="43" rx="3.5" ry="2.6" fill="#ffffff"/>
                <ellipse cx="41.5" cy="43" rx="2" ry="2.3" fill="#1a252f"/>
                <circle cx="42.3" cy="42.2" r="0.8" fill="#ffffff"/>

                <ellipse cx="58.5" cy="43" rx="3.5" ry="2.6" fill="#ffffff"/>
                <ellipse cx="58.5" cy="43" rx="2" ry="2.3" fill="#1a252f"/>
                <circle cx="59.3" cy="42.2" r="0.8" fill="#ffffff"/>

                <path d="M 37 36.5 Q 41.5 33 46.5 36.5" stroke="#1b1b1b" stroke-width="2.4" stroke-linecap="round" fill="none"/>
                <path d="M 53.5 36.5 Q 58.5 33 63 36.5" stroke="#1b1b1b" stroke-width="2.4" stroke-linecap="round" fill="none"/>

                <!-- Nose & Dealer Smile -->
                <path d="M 49 44 Q 50.5 49.5 52.5 49" stroke="#d99f73" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M 43.5 56 Q 50 61 56.5 56" stroke="#7a2e2e" stroke-width="2" stroke-linecap="round" fill="none"/>

                <!-- Hair (Neat Side Part) -->
                <path d="M 29 36 C 28 15, 42 9, 50 9 C 64 9, 71 17, 71 36 C 67 27, 56 25, 48 25 C 38 25, 32 28, 29 36 Z" fill="#1b1b1b"/>
            </g>
        </svg>`;
    }

    function getAvatar(playerOrName) {
        if (playerOrName && typeof playerOrName === 'object') {
            if (playerOrName.avatar && (playerOrName.avatar.skin || playerOrName.avatar.id)) return playerOrName.avatar;
            if (playerOrName.name) return getAvatar(playerOrName.name);
        }
        const name = typeof playerOrName === 'string' ? playerOrName : '';
        if (name === myName && myAvatar) return myAvatar;

        const botMap = {
            'Bot Ace': CHARACTER_PRESETS[3],
            'Bot Sophia': CHARACTER_PRESETS[2],
            'Bot Maverick': CHARACTER_PRESETS[0],
            'Bot Oliver': CHARACTER_PRESETS[1],
            'Bot Luna': CHARACTER_PRESETS[9],
            'Bot Jasper': CHARACTER_PRESETS[7],
            'Bot Hunter': CHARACTER_PRESETS[8],
            'Bot Chloe': CHARACTER_PRESETS[5],
            'Bot Duke': CHARACTER_PRESETS[6],
            'Bot Bella': CHARACTER_PRESETS[10],
            'Bot Jax': CHARACTER_PRESETS[4],
            'Bot Ruby': CHARACTER_PRESETS[11]
        };
        if (botMap[name]) return botMap[name];

        const safeName = name || 'Player';
        const hash = safeName.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
        return CHARACTER_PRESETS[hash % CHARACTER_PRESETS.length];
    }

    function getAvatarSVG(playerOrAv, size = 36) {
        const av = (playerOrAv && typeof playerOrAv === 'object' && (playerOrAv.skin || playerOrAv.hairStyle))
            ? playerOrAv
            : getAvatar(playerOrAv);
        return generate2DAvatarSVG(av, size);
    }

    function setMyAvatar(av, save = true) {
        myAvatar = Object.assign({}, myAvatar, av);
        if (save) {
            try { localStorage.setItem('poker_avatar', JSON.stringify(myAvatar)); } catch (e) {}
        }
        updateAvatarPreviews();
        updateLoungeProfile();
    }

    function updateAvatarPreviews() {
        const namePrev = document.getElementById('name-avatar-preview');
        if (namePrev) {
            namePrev.innerHTML = generate2DAvatarSVG(myAvatar, 64);
            namePrev.style.background = myAvatar.bg || 'var(--bg-card)';
            namePrev.classList.remove('pop');
            void namePrev.offsetWidth;
            namePrev.classList.add('pop');
        }
        const loungeAv = document.getElementById('lounge-user-avatar');
        if (loungeAv) {
            loungeAv.innerHTML = generate2DAvatarSVG(myAvatar, 32);
            loungeAv.style.background = myAvatar.bg || 'var(--bg-card)';
        }
        const gameAv = document.getElementById('game-user-avatar');
        if (gameAv) {
            gameAv.innerHTML = generate2DAvatarSVG(myAvatar, 32);
            gameAv.style.background = myAvatar.bg || 'var(--bg-card)';
        }
        const modalPrev = document.getElementById('modal-avatar-preview');
        const modalName = document.getElementById('modal-avatar-name');
        if (modalPrev) {
            modalPrev.innerHTML = generate2DAvatarSVG(myAvatar, 72);
            modalPrev.style.background = myAvatar.bg || 'var(--bg-card)';
        }
        if (modalName) {
            modalName.textContent = myAvatar.name || 'Custom 2D Player';
        }

        const dealerAv = document.getElementById('dealer-avatar');
        if (dealerAv && !dealerAv.querySelector('svg')) {
            dealerAv.innerHTML = generateDealerSVG(48);
        }
    }

    function populateAvatarGrid(containerId, currentSelectedId, onSelect) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        CHARACTER_PRESETS.forEach(av => {
            const opt = document.createElement('div');
            opt.className = 'avatar-option' + (av.id === currentSelectedId ? ' selected' : '');
            opt.style.background = av.bg;
            opt.innerHTML = generate2DAvatarSVG(av, 48);
            opt.title = av.name;
            opt.addEventListener('click', () => {
                container.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
                opt.classList.add('selected');
                if (onSelect) onSelect(av);
            });
            container.appendChild(opt);
        });
    }

    function initAvatarStudio() {
        // Populate Screen 2 preset grid
        populateAvatarGrid('avatar-selection-grid', myAvatar.id, (av) => {
            setMyAvatar(av, true);
            syncCustomizerSelection();
        });

        // Populate Modal preset grid
        populateAvatarGrid('modal-avatar-grid', myAvatar.id, (av) => {
            setMyAvatar(av, true);
            syncCustomizerSelection();
        });

        // Skin swatches
        const skinWrap = document.getElementById('swatches-skin');
        if (skinWrap) {
            skinWrap.innerHTML = '';
            SWATCHES.skins.forEach(s => {
                const btn = document.createElement('button');
                btn.className = 'color-swatch' + (myAvatar.skin === s.color ? ' active' : '');
                btn.style.background = s.color;
                btn.title = s.name;
                btn.addEventListener('click', () => {
                    skinWrap.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    myAvatar.skin = s.color;
                    setMyAvatar(myAvatar, true);
                });
                skinWrap.appendChild(btn);
            });
        }

        // Hair style options
        const hairWrap = document.getElementById('options-hair');
        if (hairWrap) {
            hairWrap.innerHTML = '';
            SWATCHES.hairStyles.forEach(h => {
                const btn = document.createElement('button');
                btn.className = 'style-option-btn' + (myAvatar.hairStyle === h.id ? ' active' : '');
                btn.innerHTML = `<span class="opt-icon">${h.icon}</span><span class="opt-text">${h.name}</span>`;
                btn.addEventListener('click', () => {
                    hairWrap.querySelectorAll('.style-option-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    myAvatar.hairStyle = h.id;
                    setMyAvatar(myAvatar, true);
                });
                hairWrap.appendChild(btn);
            });
        }

        // Hair color swatches
        const hairColorWrap = document.getElementById('swatches-hair-color');
        if (hairColorWrap) {
            hairColorWrap.innerHTML = '';
            SWATCHES.hairColors.forEach(c => {
                const btn = document.createElement('button');
                btn.className = 'color-swatch' + (myAvatar.hairColor === c.color ? ' active' : '');
                btn.style.background = c.color;
                btn.title = c.name;
                btn.addEventListener('click', () => {
                    hairColorWrap.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    myAvatar.hairColor = c.color;
                    setMyAvatar(myAvatar, true);
                });
                hairColorWrap.appendChild(btn);
            });
        }

        // Glasses options
        const glassesWrap = document.getElementById('options-glasses');
        if (glassesWrap) {
            glassesWrap.innerHTML = '';
            SWATCHES.glasses.forEach(g => {
                const btn = document.createElement('button');
                btn.className = 'style-option-btn' + ((myAvatar.glasses || 'none') === g.id ? ' active' : '');
                btn.innerHTML = `<span class="opt-icon">${g.icon}</span><span class="opt-text">${g.name}</span>`;
                btn.addEventListener('click', () => {
                    glassesWrap.querySelectorAll('.style-option-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    myAvatar.glasses = g.id;
                    setMyAvatar(myAvatar, true);
                });
                glassesWrap.appendChild(btn);
            });
        }

        // Facial hair options
        const facialWrap = document.getElementById('options-facial-hair');
        if (facialWrap) {
            facialWrap.innerHTML = '';
            SWATCHES.facialHair.forEach(f => {
                const btn = document.createElement('button');
                btn.className = 'style-option-btn' + ((myAvatar.facialHair || 'none') === f.id ? ' active' : '');
                btn.innerHTML = `<span class="opt-icon">${f.icon}</span><span class="opt-text">${f.name}</span>`;
                btn.addEventListener('click', () => {
                    facialWrap.querySelectorAll('.style-option-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    myAvatar.facialHair = f.id;
                    setMyAvatar(myAvatar, true);
                });
                facialWrap.appendChild(btn);
            });
        }

        // Outfit options
        const outfitWrap = document.getElementById('options-outfit');
        if (outfitWrap) {
            outfitWrap.innerHTML = '';
            SWATCHES.outfits.forEach(o => {
                const btn = document.createElement('button');
                btn.className = 'style-option-btn' + (myAvatar.outfit === o.id ? ' active' : '');
                btn.innerHTML = `<span class="opt-icon">${o.icon}</span><span class="opt-text">${o.name}</span>`;
                btn.addEventListener('click', () => {
                    outfitWrap.querySelectorAll('.style-option-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    myAvatar.outfit = o.id;
                    setMyAvatar(myAvatar, true);
                });
                outfitWrap.appendChild(btn);
            });
        }
    }

    function syncCustomizerSelection() {
        document.querySelectorAll('#swatches-skin .color-swatch').forEach(b => {
            b.classList.toggle('active', b.style.backgroundColor === myAvatar.skin || b.getAttribute('style').includes(myAvatar.skin));
        });
        document.querySelectorAll('#swatches-hair-color .color-swatch').forEach(b => {
            b.classList.toggle('active', b.style.backgroundColor === myAvatar.hairColor || b.getAttribute('style').includes(myAvatar.hairColor));
        });
        document.querySelectorAll('#options-hair .style-option-btn').forEach(b => {
            b.classList.toggle('active', b.textContent.includes(myAvatar.hairStyle));
        });
        document.querySelectorAll('#options-glasses .style-option-btn').forEach(b => {
            b.classList.toggle('active', b.textContent.includes(myAvatar.glasses || 'none'));
        });
        document.querySelectorAll('#options-facial-hair .style-option-btn').forEach(b => {
            b.classList.toggle('active', b.textContent.includes(myAvatar.facialHair || 'none'));
        });
        document.querySelectorAll('#options-outfit .style-option-btn').forEach(b => {
            b.classList.toggle('active', b.textContent.includes(myAvatar.outfit));
        });
    }

    function randomizeAvatarLook() {
        const randomSkin = SWATCHES.skins[Math.floor(Math.random() * SWATCHES.skins.length)].color;
        const randomHair = SWATCHES.hairStyles[Math.floor(Math.random() * SWATCHES.hairStyles.length)].id;
        const randomHairColor = SWATCHES.hairColors[Math.floor(Math.random() * SWATCHES.hairColors.length)].color;
        const randomGlasses = SWATCHES.glasses[Math.floor(Math.random() * SWATCHES.glasses.length)].id;
        const randomFacial = SWATCHES.facialHair[Math.floor(Math.random() * SWATCHES.facialHair.length)].id;
        const randomOutfit = SWATCHES.outfits[Math.floor(Math.random() * SWATCHES.outfits.length)].id;
        const randomBg = CHARACTER_PRESETS[Math.floor(Math.random() * CHARACTER_PRESETS.length)].bg;

        myAvatar = {
            id: 'custom_' + Date.now(),
            name: 'Custom 2D Player',
            bg: randomBg,
            skin: randomSkin,
            hairStyle: randomHair,
            hairColor: randomHairColor,
            glasses: randomGlasses,
            facialHair: randomFacial,
            outfit: randomOutfit
        };
        setMyAvatar(myAvatar, true);
        initAvatarStudio();
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

    let currentInGameChatTab = 'table';

    function setInGameChatTab(tab) {
        currentInGameChatTab = tab;
        const tableBtn = document.getElementById('tab-btn-table-chat');
        const globalBtn = document.getElementById('tab-btn-global-chat');
        const tablePane = document.getElementById('game-chat-messages');
        const globalPane = document.getElementById('game-global-chat-messages');
        const chatInput = document.getElementById('input-game-chat');
        const tableBadge = document.getElementById('table-chat-tab-badge');
        const globalBadge = document.getElementById('global-chat-tab-badge');

        if (tab === 'table') {
            if (tableBtn) tableBtn.classList.add('active');
            if (globalBtn) globalBtn.classList.remove('active');
            if (tablePane) tablePane.style.display = 'flex';
            if (globalPane) globalPane.style.display = 'none';
            if (chatInput) chatInput.placeholder = 'Say something at table…';
            if (tableBadge) tableBadge.style.display = 'none';
        } else {
            if (tableBtn) tableBtn.classList.remove('active');
            if (globalBtn) globalBtn.classList.add('active');
            if (tablePane) tablePane.style.display = 'none';
            if (globalPane) globalPane.style.display = 'flex';
            if (chatInput) chatInput.placeholder = 'Message everyone in Global Lounge…';
            if (globalBadge) globalBadge.style.display = 'none';
        }
    }

    function sendLoungeChatMessage(text) {
        if (!text || !text.trim()) return;
        const sender = myName.trim() || 'Player';
        const time = formatTime();
        appendLoungeChatMessage(sender, text.trim(), time, false, true, myAvatar);

        broadcastRealtime('pocketaces_global_chat_v6', {
            type: 'lounge_chat',
            name: sender,
            text: text.trim(),
            time,
            senderId: myId,
            avatar: myAvatar
        });
    }

    function appendLoungeChatMessage(name, text, time = formatTime(), isSystem = false, isMe = false, avatar = null) {
        const containers = [
            document.getElementById('lobby-chat-messages'),
            document.getElementById('game-global-chat-messages')
        ];

        containers.forEach(container => {
            if (!container) return;
            const row = document.createElement('div');
            if (isSystem) {
                row.className = 'chat-msg-row';
                row.innerHTML = `<div class="chat-msg-system">${escHtml(text)}</div>`;
            } else {
                row.className = 'chat-msg-row' + (isMe ? ' is-me' : '');
                const av = avatar || getAvatar(name);
                row.innerHTML = `
                    <div class="chat-msg-header">
                        <span class="chat-msg-avatar" style="background:${av.bg || 'var(--gold)'}">${getAvatarSVG(av, 20)}</span>
                        <span class="chat-msg-name ${isMe ? 'is-me' : ''}" style="color:${isMe ? 'var(--gold)' : 'var(--text-primary)'}">${escHtml(name)}</span>
                        <span class="chat-msg-time">${time}</span>
                    </div>
                    <div class="chat-msg-body">${escHtml(text)}</div>
                `;
            }
            container.appendChild(row);
            container.scrollTop = container.scrollHeight;
        });

        if (!isMe) {
            if (currentInGameChatTab !== 'global') {
                const globalBadge = document.getElementById('global-chat-tab-badge');
                if (globalBadge) globalBadge.style.display = 'inline-block';
            }
            if (!isGameChatOpen) {
                unreadChatCount++;
                const unreadBadge = document.getElementById('game-chat-unread');
                if (unreadBadge) {
                    unreadBadge.textContent = unreadChatCount > 9 ? '9+' : unreadChatCount;
                    unreadBadge.style.display = 'flex';
                }
            }
        }
    }

    function sendGameChatMessage(name, text, isSystem = false, senderId = null) {
        if (!text || !text.trim()) return;
        const sender = name || myName || 'Player';
        const time = formatTime();
        const fromId = senderId || myId;

        appendGameChatMessage(sender, text.trim(), time, isSystem, fromId === myId, fromId, myAvatar);

        if (!isSystem && fromId) {
            showSeatSpeechBubble(fromId, text.trim());
        }

        const payload = {
            type: 'chat',
            name: sender,
            text: text.trim(),
            time,
            isSystem,
            senderId: fromId,
            avatar: myAvatar
        };

        if (isHost) {
            broadcastRealtime(`pocketaces_room_${roomCode}_to_clients`, payload);
        } else {
            broadcastRealtime(`pocketaces_room_${roomCode}_to_host`, payload);
        }
    }

    function appendGameChatMessage(name, text, time = formatTime(), isSystem = false, isMe = false, senderId = null, avatar = null) {
        const container = document.getElementById('game-chat-messages');
        if (!container) return;

        const row = document.createElement('div');
        if (isSystem) {
            row.className = 'chat-msg-row';
            row.innerHTML = `<div class="chat-msg-system">${escHtml(text)}</div>`;
        } else {
            row.className = 'chat-msg-row' + (isMe ? ' is-me' : '');
            const av = avatar || getAvatar(name);
            row.innerHTML = `
                <div class="chat-msg-header">
                    <span class="chat-msg-avatar" style="background:${av.bg || 'var(--gold)'}">${getAvatarSVG(av, 20)}</span>
                    <span class="chat-msg-name ${isMe ? 'is-me' : ''}" style="color:${isMe ? 'var(--gold)' : 'var(--text-primary)'}">${escHtml(name)}</span>
                    <span class="chat-msg-time">${time}</span>
                </div>
                <div class="chat-msg-body">${escHtml(text)}</div>
            `;
        }
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;

        if (!isMe) {
            if (currentInGameChatTab !== 'table') {
                const tableBadge = document.getElementById('table-chat-tab-badge');
                if (tableBadge) tableBadge.style.display = 'inline-block';
            }
            if (!isGameChatOpen) {
                unreadChatCount++;
                const unreadBadge = document.getElementById('game-chat-unread');
                if (unreadBadge) {
                    unreadBadge.textContent = unreadChatCount > 9 ? '9+' : unreadChatCount;
                    unreadBadge.style.display = 'flex';
                }
            }
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
    // SECTION 7: REALTIME NETWORK RELAY (ScaleDrone + Local)
    // ═══════════════════════════════════════════════

    const SCALEDRONE_CHANNEL_ID = 'yjEbQRdoJMSrfBpT';
    const seenMessageIds = new Set();
    let localChannel = null;
    let drone = null;
    let loungeRoom = null;
    let gameRoom = null;

    function initNetworking() {
        // 1. Local BroadcastChannel for instant same-browser / multi-tab synchronization
        try {
            if (typeof BroadcastChannel !== 'undefined' && !localChannel) {
                localChannel = new BroadcastChannel('pocketaces_p2p_sync_v6');
                localChannel.onmessage = e => {
                    if (e.data && e.data.msgId) {
                        onIncomingNetworkPayload(e.data);
                    }
                };
            }
        } catch (e) {}

        // 2. ScaleDrone Realtime WebSockets for cross-computer worldwide sync
        try {
            if (typeof ScaleDrone !== 'undefined' && !drone) {
                drone = new ScaleDrone(SCALEDRONE_CHANNEL_ID, {
                    data: { name: myName || 'Player', id: myId }
                });

                drone.on('open', error => {
                    if (error) return console.warn('ScaleDrone open err:', error);

                    loungeRoom = drone.subscribe('observable-pocketaces-lounge-v6');
                    loungeRoom.on('data', (data, member) => {
                        if (data && data.msgId) {
                            onIncomingNetworkPayload(data);
                        }
                    });

                    if (roomCode) {
                        subscribeScaleDroneRoom(roomCode);
                    }
                });

                drone.on('error', err => console.warn('ScaleDrone err:', err));
            } else if (typeof ScaleDrone === 'undefined') {
                setTimeout(initNetworking, 400);
            }
        } catch (e) {
            console.warn('ScaleDrone init failed:', e);
        }
    }

    function subscribeScaleDroneRoom(code) {
        if (!drone) return;
        try {
            if (gameRoom) gameRoom.unsubscribe();
            gameRoom = drone.subscribe(`observable-pocketaces-room-${code}`);
            gameRoom.on('data', (data, member) => {
                if (data && data.msgId) {
                    onIncomingNetworkPayload(data);
                }
            });
        } catch (e) {}
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

        // 1. Broadcast locally (for multi-tabs on same device)
        if (localChannel) {
            try { localChannel.postMessage(payload); } catch (e) {}
        }

        // 2. Broadcast globally via ScaleDrone WebSocket
        if (drone) {
            try {
                if (topic === 'pocketaces_global_chat_v6') {
                    drone.publish({
                        room: 'observable-pocketaces-lounge-v6',
                        message: payload
                    });
                } else if (roomCode) {
                    drone.publish({
                        room: `observable-pocketaces-room-${roomCode}`,
                        message: payload
                    });
                }
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
        if (topic === 'pocketaces_global_chat_v6') {
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

        subscribeScaleDroneRoom(roomCode);

        viewState = makeViewState(myId);
        renderFromViewState();
        showScreen('game');

        return Promise.resolve(roomCode);
    }

    function joinRoom(code) {
        roomCode = code.toUpperCase();
        isHost = false;

        subscribeScaleDroneRoom(roomCode);

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
            if (gameRoom) {
                try { gameRoom.unsubscribe(); } catch (e) {}
                gameRoom = null;
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
    // SECTION 8: CASINO DEALER & DEALING PHYSICS
    // ═══════════════════════════════════════════════

    let dealerSpeechTimer = null;
    let lastRenderedPhase = null;

    function dealerSay(text, duration = 3400) {
        const bubble = document.getElementById('dealer-speech-bubble');
        if (!bubble) return;
        bubble.textContent = text;
        bubble.style.display = 'block';
        if (dealerSpeechTimer) clearTimeout(dealerSpeechTimer);
        dealerSpeechTimer = setTimeout(() => {
            bubble.style.display = 'none';
        }, duration);
    }

    function animateDealerDeal() {
        const dealerAv = document.getElementById('dealer-avatar');
        if (dealerAv) {
            dealerAv.classList.remove('dealing');
            void dealerAv.offsetWidth;
            dealerAv.classList.add('dealing');
            setTimeout(() => dealerAv.classList.remove('dealing'), 500);
        }
    }

    function runDealPhysicsAnimation() {
        const table = document.getElementById('poker-table');
        const dealLayer = document.getElementById('deal-layer');
        if (!table || !dealLayer || !viewState) return;

        dealLayer.innerHTML = '';
        isDealingAnimation = true;

        dealerSay('♠ Shuffling & dealing hole cards…', 3800);
        animateDealerDeal();

        const totalPlayers = viewState.players.length;
        const layout = getSeatLayout(totalPlayers);

        const tableRect = table.getBoundingClientRect();
        // Cards physically originate from the Casino Dealer Station at the top center
        const startX = tableRect.width / 2;
        const startY = 34;

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
                    animateDealerDeal();
                    const flyingCard = document.createElement('div');
                    flyingCard.className = 'flying-card';
                    flyingCard.style.left = `${startX - 23}px`;
                    flyingCard.style.top = `${startY - 16}px`;
                    flyingCard.style.transform = `scale(0.7) rotate(${Math.random() * 20 - 10}deg)`;

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

        if (lastRenderedPhase !== viewState.phase) {
            if (viewState.phase === 'flop') {
                dealerSay('🃏 Flop is on the felt!');
                animateDealerDeal();
            } else if (viewState.phase === 'turn') {
                dealerSay('🃏 Turn card dealt!');
                animateDealerDeal();
            } else if (viewState.phase === 'river') {
                dealerSay('🃏 River card dealt! Showdown ready.');
                animateDealerDeal();
            } else if (viewState.phase === 'showdown' || viewState.phase === 'handEnd') {
                if (viewState.results && viewState.results.message) {
                    dealerSay('🏆 ' + viewState.results.message, 4500);
                }
            } else if (viewState.phase === 'lobby') {
                dealerSay('♠ Welcome to the table! Host deals when ready.', 4000);
            }
            lastRenderedPhase = viewState.phase;
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

            const av = getAvatar(p);

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
                    <div class="seat-avatar" style="background:${av.bg || 'var(--gold)'}">${getAvatarSVG(av, 36)}</div>
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

        // ─ Screen 2: Name & 2D Avatar Studio ─
        initAvatarStudio();
        updateAvatarPreviews();

        const randomAvatarBtn = document.getElementById('btn-random-avatar');
        if (randomAvatarBtn) {
            randomAvatarBtn.addEventListener('click', randomizeAvatarLook);
        }

        const randomModalBtn = document.getElementById('btn-random-avatar-modal');
        if (randomModalBtn) {
            randomModalBtn.addEventListener('click', randomizeAvatarLook);
        }

        // 2D Character Studio Tab Switching (Presets vs Customizer)
        document.querySelectorAll('.studio-tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                document.querySelectorAll('.studio-tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.studio-tab-content').forEach(c => c.classList.remove('active'));
                tabBtn.classList.add('active');
                const targetTab = tabBtn.dataset.tab;
                const contentEl = document.getElementById('tab-' + targetTab);
                if (contentEl) contentEl.classList.add('active');
            });
        });

        function openAvatarModal(initialTab = 'presets') {
            const modal = document.getElementById('modal-avatar');
            if (!modal) return;
            initAvatarStudio();
            updateAvatarPreviews();

            // Switch to requested tab
            const tabBtn = document.querySelector(`.studio-tab[data-tab="${initialTab}"]`);
            if (tabBtn) tabBtn.click();

            modal.style.display = 'flex';
        }

        function closeAvatarModal() {
            const modal = document.getElementById('modal-avatar');
            if (modal) modal.style.display = 'none';
            if (roomCode) {
                if (isHost && gameState) {
                    const me = gameState.players.find(p => p.id === myId);
                    if (me) me.avatar = myAvatar;
                    broadcastState();
                } else {
                    broadcastRealtime(`pocketaces_room_${roomCode}_to_host`, {
                        type: 'update_avatar',
                        playerId: myId,
                        avatar: myAvatar
                    });
                }
            }
        }

        const btnOpenCustomizerName = document.getElementById('btn-open-customizer-name');
        if (btnOpenCustomizerName) {
            btnOpenCustomizerName.addEventListener('click', () => openAvatarModal('custom'));
        }

        const loungeProfileEl = document.getElementById('lounge-user-profile');
        if (loungeProfileEl) loungeProfileEl.addEventListener('click', () => openAvatarModal('presets'));

        const changeAvatarBtn = document.getElementById('btn-change-avatar');
        if (changeAvatarBtn) changeAvatarBtn.addEventListener('click', (e) => { e.stopPropagation(); openAvatarModal('presets'); });

        const gameProfileEl = document.getElementById('game-user-profile');
        if (gameProfileEl) gameProfileEl.addEventListener('click', () => openAvatarModal('presets'));

        const closeAvatarModalBtn = document.getElementById('btn-close-avatar-modal');
        if (closeAvatarModalBtn) closeAvatarModalBtn.addEventListener('click', closeAvatarModal);

        const saveAvatarModalBtn = document.getElementById('btn-save-avatar-modal');
        if (saveAvatarModalBtn) saveAvatarModalBtn.addEventListener('click', closeAvatarModal);

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
            initAvatarStudio();
            updateAvatarPreviews();
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

        // ─ Screen 4: In-Game Live Table & Global Chat Drawer ─
        const gameChatDrawer = document.getElementById('game-chat-drawer');
        const gameChatToggleBtn = document.getElementById('btn-toggle-game-chat');
        const gameChatCloseBtn = document.getElementById('btn-close-game-chat');
        const gameChatInput = document.getElementById('input-game-chat');
        const gameChatSendBtn = document.getElementById('btn-send-game-chat');
        const unreadBadge = document.getElementById('game-chat-unread');

        // Chat tab switching buttons
        const tabBtnTable = document.getElementById('tab-btn-table-chat');
        const tabBtnGlobal = document.getElementById('tab-btn-global-chat');

        if (tabBtnTable) {
            tabBtnTable.addEventListener('click', () => setInGameChatTab('table'));
        }
        if (tabBtnGlobal) {
            tabBtnGlobal.addEventListener('click', () => setInGameChatTab('global'));
        }

        // Quick share table code to Global Lounge button
        const shareCodeBtn = document.getElementById('btn-share-code-to-global');
        if (shareCodeBtn) {
            shareCodeBtn.addEventListener('click', () => {
                if (roomCode) {
                    sendLoungeChatMessage(`🃏 Join my poker table! Room Code: ${roomCode} ($1,000 Starting Stack)`);
                    showToast(`Table ${roomCode} invite sent to Global Lounge!`, 'success');
                }
            });
        }

        function toggleGameChat(open) {
            isGameChatOpen = typeof open === 'boolean' ? open : !isGameChatOpen;
            gameChatDrawer.classList.toggle('open', isGameChatOpen);
            if (isGameChatOpen) {
                unreadChatCount = 0;
                unreadBadge.style.display = 'none';
                if (currentInGameChatTab === 'table') {
                    const tableBadge = document.getElementById('table-chat-tab-badge');
                    if (tableBadge) tableBadge.style.display = 'none';
                } else {
                    const globalBadge = document.getElementById('global-chat-tab-badge');
                    if (globalBadge) globalBadge.style.display = 'none';
                }
                gameChatInput.focus();
            }
        }

        gameChatToggleBtn.addEventListener('click', () => toggleGameChat());
        gameChatCloseBtn.addEventListener('click', () => toggleGameChat(false));

        function handleSendGameChat() {
            const txt = gameChatInput.value;
            if (txt && txt.trim()) {
                if (currentInGameChatTab === 'global') {
                    sendLoungeChatMessage(txt);
                } else {
                    sendGameChatMessage(myName || 'Player', txt, false);
                }
                gameChatInput.value = '';
            }
        }

        gameChatSendBtn.addEventListener('click', handleSendGameChat);
        gameChatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleSendGameChat();
        });

        document.querySelectorAll('.btn-table-emoji').forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentInGameChatTab === 'global') {
                    sendLoungeChatMessage(btn.dataset.emoji);
                } else {
                    sendGameChatMessage(myName || 'Player', btn.dataset.emoji, false);
                }
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
        updateAvatarPreviews();
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
