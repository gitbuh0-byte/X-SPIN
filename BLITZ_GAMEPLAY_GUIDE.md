# X-SPIN BLITZ GAMEPLAY IMPLEMENTATION

## Overview
This document outlines the complete Blitz mode gameplay flow with 15-player lobbies, mandatory bet placement, and room locking mechanics.

## Game Flow Architecture

### 1. **PRE_GAME Phase**
- User clicks on game mode (Blitz, 1v1, Tournament)
- Navigates to `/room/{roomId}`
- `GameRoom` component mounts
- **BettingModal** appears immediately
  - User must place a bet BEFORE entering the game room
  - Minimum bet: $10
  - Maximum bet: User's current balance
  - Cannot proceed without placing a valid bet
  - Cancel button returns to home

### 2. **Color Assignment Phase**
- After bet is confirmed, **ColorAssignmentModal** appears
- Shows the assigned color (deterministic based on player count)
- Color cannot be changed - it's assigned by the system
- This is the color player must bet ON in the game
- "ENTER GAME ROOM" button in modal
- Pressing it triggers the WAITING phase

### 3. **WAITING Phase** (3 seconds)
- All 15 players are now in the game room
- Game state shows "PLAYERS READY - STARTING IN 3s"
- Chat system announces: "⏳ 15 PLAYERS READY. AWAITING GAME START..."
- Timer counts down from 3
- All players see the same countdown
- Bots are already in their assigned colors with bets placed

### 4. **LOCKED Phase** (3 seconds)
- Room becomes locked - no new players can join
- Game state shows "🔒 ROOM LOCKED - SPINNING IN 3s"
- Chat announces: "🔒 ROOM LOCKED. ALL PLAYERS IN. SPINNING STARTS..."
- Sound effect plays (lock sound)
- Final countdown before wheel spin
- All players confirm they're ready

### 5. **SPINNING Phase**
- Wheel begins rotating
- Target index is pre-determined before visible spin
- Sound effects play
- Players watch as wheel spins
- ~5-10 seconds of animation

### 6. **RESULT Phase**
- Wheel stops on winning color
- Winner is determined:
  - Match assigned color to segment result
  - Only players with CONFIRMED status can win
  - Pot is split among multiple winners (if any)
- Chat announces result
- Winner alert displays
- Winnings credited to winner's balance
- Loser's balance already deducted from bet placement

---

## Component Structure

### New Components Created

#### 1. **BettingModal.tsx**
```tsx
Interface Props:
- isOpen: boolean
- userBalance: number
- minBet: number (default 10)
- maxBet: number (optional)
- onConfirm: (betAmount: number) => void
- onCancel: () => void
- gameMode: 'blitz' | '1v1' | 'tournament'

Features:
- Balance display
- Bet input with +/- buttons
- Quick select buttons ($10, $25, $50, $100)
- Validation (insufficient balance, min/max)
- Sound effects for interactions
- Error messages
```

#### 2. **ColorAssignmentModal.tsx**
```tsx
Interface Props:
- isOpen: boolean
- assignedColor: string (e.g., 'red', 'blue')
- playerName: string
- gameMode: 'blitz' | '1v1' | 'tournament'
- onConfirm: () => void

Features:
- Visual color display with glowing effect
- Hex color code display
- Game status indicator
- Enter game room button
- Animated color indicator
```

#### 3. **RoomStatus.tsx** (Optional)
```tsx
Interface Props:
- gameState: GameState
- playerCount: number
- maxPlayers: number
- currentPot: number
- timer: number

Displays:
- Current game state with timer
- Player count (X/15)
- Total pot amount
- Color coding based on state
```

---

## GameRoom State Management

### New State Variables
```tsx
// Pre-game betting flow
const [showBettingModal, setShowBettingModal] = useState(true);
const [userBetAmount, setUserBetAmount] = useState(0);
const [betsPlaced, setBetsPlaced] = useState(false);
const [showColorAssignment, setShowColorAssignment] = useState(false);
const [userAssignedColor, setUserAssignedColor] = useState('');

// Game mode detection
const gameMode = roomId.includes('pve') ? '1v1' : roomId.includes('tournament') ? 'tournament' : 'blitz';
const maxPlayers = gameMode === 'tournament' ? 20 : gameMode === '1v1' ? 2 : 15;
```

### GameState Enum (Updated)
```tsx
export enum GameState {
  PRE_GAME = 'PRE_GAME',        // Before bet placement
  BETTING = 'BETTING',          // Bet placement phase (Legacy - not used in new flow)
  COLOR_ASSIGN = 'COLOR_ASSIGN', // Color assignment phase (Legacy - not used in new flow)
  WAITING = 'WAITING',          // Waiting for players to ready up
  LOCKED = 'LOCKED',            // Game locked, all players ready
  SPINNING = 'SPINNING',        // Wheel is spinning
  RESULT = 'RESULT'             // Result phase
}
```

---

## Handler Functions

### 1. **handleBettingConfirm**
```tsx
const handleBettingConfirm = (betAmount: number) => {
  // Deduct bet from balance
  updateBalance(-betAmount);
  // Store bet amount
  setUserBetAmount(betAmount);
  // Close betting modal
  setShowBettingModal(false);
  // Show color assignment modal
  setShowColorAssignment(true);
}
```

### 2. **handleBettingCancel**
```tsx
const handleBettingCancel = () => {
  // Return to home
  navigate('/');
}
```

### 3. **handleColorAssignmentConfirm**
```tsx
const handleColorAssignmentConfirm = () => {
  // Close color modal
  setShowColorAssignment(false);
  // Mark bets as placed
  setBetsPlaced(true);
  // Initialize game and players
  // Start game state progression
  setGameState(GameState.WAITING);
}
```

---

## Player Initialization

### Before betsPlaced = true
- No players initialized
- Modals control the UI
- Balance is deducted when bet is confirmed

### After betsPlaced = true
- 14 bots + 1 user player = 15 total (Blitz mode)
- Each bot has:
  - Pre-assigned color (deterministic)
  - Pre-set bet amount ($50-$550)
  - Status: CONFIRMED
  - Varied ranks for visual variety
- User player has:
  - Assigned color (userAssignedColor from modal)
  - Bet amount (from betting modal)
  - Status: CONFIRMED
  - User's actual rank

---

## Game Progression Timeline

```
User clicks "BLITZ"
       ↓
[PRE_GAME] → BettingModal appears
       ↓
User places bet & confirms
       ↓
Balance deducted (-$50 example)
       ↓
[PRE_GAME] → ColorAssignmentModal appears
       ↓
User confirms assigned color
       ↓
setBetsPlaced(true)
       ↓
Initialize all players (bots + user)
       ↓
[WAITING] → 3 second countdown
"PLAYERS READY - STARTING IN 3s"
       ↓
[LOCKED] → 3 second countdown
"🔒 ROOM LOCKED - SPINNING IN 3s"
Sound: lock effect
       ↓
[SPINNING] → Wheel animation
       ↓
[RESULT] → Winner determined
Balance updated
Winner alert displays
```

---

## Key Features

### ✅ Bet Placement Lock
- **Cannot skip betting** - BettingModal.isOpen = true until confirmed
- **Cannot navigate away** - Cancel returns to home
- **Balance validation** - Check balance before confirming
- **Error handling** - Show insufficient funds, invalid amount errors

### ✅ Room Locking
- **All 15 players required** - Game won't start with fewer
- **Deterministic players** - Same bots every game for fairness testing
- **Synchronized state** - All players see same countdown
- **No joining mid-game** - Locked status prevents late joins

### ✅ Color Assignment
- **Deterministic** - Always same color for same player count
- **Non-negotiable** - Can't choose color
- **Displayed clearly** - Large visual indicator
- **Matched on wheel** - Only winning color matters

### ✅ Pot Management
- **Deducted immediately** - Balance goes down on bet confirmation
- **Collected at LOCKED** - Captured when room locks
- **Distributed on WIN** - Added to winner's balance on result
- **Split on ties** - Multiple winners share pot equally

---

## UI/UX Considerations

### Mobile Responsive
- Modals scale for different screen sizes
- Touch-friendly button sizes
- Readable text at all scales
- Landscape mode support

### Visual Feedback
- Sound effects for key actions (bet, lock, spin)
- Color-coded state indicators
- Animated countdowns
- Glowing effects for important elements

### Accessibility
- Clear error messages
- Keyboard navigation support
- Screen reader friendly labels
- High contrast text

---

## Testing Checklist

- [ ] Betting modal appears on room join
- [ ] Can place valid bet
- [ ] Cannot place bet > balance
- [ ] Cannot place bet < $10
- [ ] Cancel returns to home
- [ ] Color assignment shows correct color
- [ ] Entering game room initializes players
- [ ] WAITING state shows 3s countdown
- [ ] LOCKED state shows 3s countdown
- [ ] Wheel spins after locked countdown
- [ ] Winner determined correctly
- [ ] Balance updated correctly (loss + win)
- [ ] All players show in sidebar
- [ ] Chat updates appropriately
- [ ] Mobile layout works
- [ ] All sounds play correctly

---

## Future Enhancements

1. **Spectator Mode** - Watch games after bet deadline
2. **Quick Rematch** - Play again with same room players
3. **Betting Statistics** - Track win rate by color
4. **Leaderboard** - Real-time ranking
5. **Skill-based Matchmaking** - Rank-based room assignment
6. **Chat Emotes** - Quick reactions during game
7. **Replay System** - Watch previous spins
8. **Bonus Round** - Random multiplier on certain colors

---

## File References

### Modified Files
- `pages/GameRoom.tsx` - Added betting/color flow, state management
- `types.ts` - Updated GameState enum, GameSession interface
- `App.tsx` - Updated handleJoinGame to track game modes

### New Files
- `components/BettingModal.tsx` - Betting UI
- `components/ColorAssignmentModal.tsx` - Color assignment UI
- `components/RoomStatus.tsx` - Room status display (optional)

---

## Important Notes

1. **Balance Deduction Timing**: Balance is deducted when bet is confirmed in the modal, not when spinning ends
2. **Color Assignment**: Deterministic based on `(maxPlayers - 1) % COLORS.length`
3. **Bot Behavior**: Bots are initialized with confirmed status and pre-set bets
4. **No Mid-Game Joining**: Once LOCKED state is reached, room cannot accept new players
5. **Pot Capture**: Pot amount is captured at LOCKED state transition
6. **Winner Distribution**: Winners receive their portion from the captured pot

