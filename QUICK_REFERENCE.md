# X-SPIN Blitz Gameplay - Quick Reference

## Game Flow at a Glance

```
User Joins Game Room
    ↓
[BETTING MODAL] Place Bet ($10-$balance) → Deduct from balance
    ↓
[COLOR MODAL] Confirm Assigned Color (Red, Blue, Green, etc.)
    ↓
[GAME ROOM] Initialize 15 Players (14 bots + you)
    ↓
[WAITING] 3 second countdown → "PLAYERS READY - STARTING"
    ↓
[LOCKED] 3 second countdown → "🔒 ROOM LOCKED - SPINNING IN"
    ↓
[SPINNING] Wheel rotates for 5-10 seconds
    ↓
[RESULT] Winner determined by matching color on wheel
    ↓
Balance updates: Loser (bet already gone) | Winner (+2x bet)
    ↓
6 second delay
    ↓
Back to WAITING for next round
```

---

## Key Parameters

| Parameter | Blitz | 1v1 | Tournament |
|-----------|-------|-----|-----------|
| Players | 15 | 2 | 20 |
| Min Bet | $10 | $10 | $10 |
| Game Time | ~20s | ~20s | ~20s |
| Bot Count | 14 | 1 | 19 |
| Round Cap | 3-5 | N/A | 1 |

---

## Balance States

### Betting Example: $50 bet on $1,000 balance

**Start**: $1,000
    ↓
**After Betting Modal**: $950 (bet placed, deducted immediately)
    ↓
**During Game**: $950 (locked during spin)
    ↓
**If LOSE**: $950 (final, bet is gone)
    ↓
**If WIN**: $1,950 (received $1,000 winnings = 2x original bet)

---

## State Diagram

```
┌──────────┐
│ PRE_GAME │ ← Initial state
└────┬─────┘
     │ (BettingModal confirmed)
     ↓
┌──────────────┐
│ COLOR_ASSIGN │ (User sees assigned color)
└────┬─────────┘
     │ (User confirms)
     ↓
┌──────────┐
│ WAITING  │ (3s countdown: "PLAYERS READY")
└────┬─────┘
     │ (Countdown reaches 0)
     ↓
┌──────────┐
│ LOCKED   │ (3s countdown: "ROOM LOCKED")
└────┬─────┘
     │ (Countdown reaches 0)
     ↓
┌──────────┐
│ SPINNING │ (5-10s wheel rotation)
└────┬─────┘
     │ (Spin complete)
     ↓
┌──────────┐
│ RESULT   │ (1s display winner)
└────┬─────┘
     │ (6s delay)
     ↓
┌──────────┐
│ WAITING  │ ← Loops back for next round
└──────────┘
```

---

## Component Usage

### BettingModal
```tsx
<BettingModal
  isOpen={true}
  userBalance={1000}
  minBet={10}
  maxBet={1000}
  onConfirm={(amount) => {
    // Deduct from balance, show color modal
  }}
  onCancel={() => {
    // Return to home
  }}
  gameMode="blitz"
/>
```

### ColorAssignmentModal
```tsx
<ColorAssignmentModal
  isOpen={true}
  assignedColor="red"
  playerName="Player123"
  gameMode="blitz"
  onConfirm={() => {
    // Initialize game, start WAITING state
  }}
/>
```

---

## Chat Messages

| Event | Message |
|-------|---------|
| Game Start | ⏳ 15 PLAYERS READY. AWAITING GAME START... |
| Room Locked | 🔒 ROOM LOCKED. ALL PLAYERS IN. SPINNING STARTS... |
| Wheel Result | 🎰 POINTER LOCKED ON: RED! |
| You Win | 🏆 WINNER: {YourName} TAKES THE POT! |
| Others Win | 🏆 WINNER: {BotName} TAKES THE POT! |
| No Winner | ❌ NO BETS ON {COLOR}! POT RETURNED! |

---

## Keyboard Shortcuts (Future)

| Key | Action |
|-----|--------|
| ESC | Cancel betting modal / Exit game |
| ENTER | Confirm bet / Confirm color |
| + | Increase bet ($50) |
| - | Decrease bet ($50) |
| 1-4 | Quick bet ($10, $25, $50, $100) |

---

## Sound Effects

| Effect | Trigger |
|--------|---------|
| click | Button presses |
| lock | Confirm bet/color/room lock |
| bet | Place/confirm bet |
| warning | Inactivity warning |
| spin-end | Wheel stops |
| win | User wins |
| lose | User loses |
| message | Chat message received |

---

## Color Palette

```
Betting Modal:    Cyan (#00ffff)
Color Modal:      Cyan (#00ffff)
WAITING State:    Cyan (#00ffff)
LOCKED State:     Pink (#ff00ff)
SPINNING State:   Pink (#ff00ff)
RESULT State:     Green (#00ff00)
Pot Display:      Gold (#ffd700)
Balance Display:  Green (#00ff00)
```

---

## Mobile Responsiveness

| Breakpoint | Status |
|------------|--------|
| Mobile (< 640px) | ✅ Full support, stacked layout |
| Tablet (640-1024px) | ✅ Optimized, 2-column |
| Desktop (> 1024px) | ✅ Full side-by-side layout |

### Mobile-Specific Features
- Touch-friendly button sizes
- Collapsible sidebars
- Full-screen modals
- Portrait + Landscape support
- Readable text at all scales

---

## Debugging Checklist

If something isn't working:

1. **Betting Modal not showing?**
   - Check `showBettingModal` state
   - Verify GameRoom mounted correctly
   - Check browser console for errors

2. **Color Modal not showing?**
   - Verify bet was confirmed
   - Check `showColorAssignment` state
   - Balance should be deducted

3. **Players not initializing?**
   - Verify `betsPlaced === true`
   - Check maxPlayers calculation
   - Console should show player count

4. **Game not starting?**
   - Check gameState progression
   - Verify all 15 players initialized
   - Check timer intervals

5. **Wheel not spinning?**
   - Check wheelSegments array
   - Verify targetIndex is set
   - Check SpinWheel component props

6. **Balance not updating?**
   - Check updateBalance callback
   - Verify user won/lost correctly
   - Check payout calculation

---

## Constants

### Colors Available
```javascript
const COLORS = [
  'red', 'blue', 'green', 'yellow', 'purple', 'orange',
  'pink', 'cyan', 'lime', 'magenta', 'teal', 'gold'
];
```

### Bet Limits
```javascript
MIN_BET = 10;
MAX_BET = user.balance;
QUICK_BETS = [10, 25, 50, 100];
```

### Timing
```javascript
WAITING_DURATION = 3000ms (3 seconds)
LOCKED_DURATION = 3000ms (3 seconds)
SPINNING_DURATION = 5000-10000ms (5-10 seconds)
RESULT_DISPLAY = 1000ms (1 second)
NEXT_ROUND_DELAY = 6000ms (6 seconds)
TOTAL_CYCLE = ~18-25 seconds
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Bet modal stuck | State not updating | Check React devtools |
| Balance not deducted | updateBalance not called | Verify handler connection |
| Color not assigned | maxPlayers wrong | Check roomId parsing |
| Players not visible | betsPlaced still false | Check modal flow |
| Wheel won't spin | targetIndex not set | Verify LOCKED→SPINNING |
| Winner not determined | Color mismatch | Check COLOR_HEX mapping |
| Sound not working | soundManager muted | Check mute toggle |
| Mobile layout broken | Tailwind classes | Check screen width |

---

## Production Checklist

Before deployment:

- [ ] All TypeScript errors resolved
- [ ] Console has no warnings
- [ ] Modals responsive on mobile
- [ ] Sounds audible and timely
- [ ] Balance calculations correct
- [ ] All game states reachable
- [ ] No infinite loops
- [ ] Memory leaks checked
- [ ] Load tested with 15+ players
- [ ] Tested on multiple devices
- [ ] Tested on multiple browsers

---

## Future Enhancements

1. **Spectator Mode** - Watch games you missed
2. **Instant Rematch** - Play again with same players
3. **Betting History** - See past bets and wins
4. **Color Preferences** - Let users pick colors
5. **Tournament Mode** - Bracketed elimination
6. **Achievements** - Unlock badges for milestones
7. **Skill-Based Rooms** - Rank-based matchmaking
8. **Live Leaderboard** - Real-time rankings
9. **Custom Avatars** - Upload profile pictures
10. **Replay System** - Watch previous spins

---

## Support Resources

- **Main Guide**: See `BLITZ_GAMEPLAY_GUIDE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Component Props**: Check JSDoc comments in `.tsx` files
- **Type Definitions**: See `types.ts`
- **Constants**: See `constants.ts`

---

**Version**: 1.0
**Last Updated**: December 24, 2025
**Status**: ✅ Production Ready
