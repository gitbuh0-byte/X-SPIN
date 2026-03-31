# Frontend-Backend Integration Guide

## Overview

This guide explains how to integrate the X-SPIN frontend (React/Vite) with the backend (Node.js/Express).

## Architecture

```
Frontend (http://localhost:5173)
    ↓ API Calls + WebSocket
Backend (http://localhost:3000)
    ↓
Supabase PostgreSQL + Redis
```

## Environment Setup

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:3000
VITE_BACKEND_WS_URL=ws://localhost:3000
```

### Backend (.env)
```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

## API Integration Points

### 1. Authentication Flow

**Frontend**
```typescript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token, refreshToken } = await response.json();
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);
```

**Backend**
- Validates credentials
- Returns JWT token
- Token expires in 24h
- Use refresh token to get new token

### 2. Game Joining

**Frontend (via WebSocket)**
```typescript
socket.emit('join_matchmaking', {
  gameType: 'blitz',
  entryFee: 100
});

socket.on('match_found', (data) => {
  const { gameId, roomCode, players, pot } = data;
  // Redirect to game screen
  navigate(`/game/${gameId}`);
});
```

**Backend**
- Creates game or finds existing
- Holds escrow
- Broadcasts to relevant players

### 3. Balance Updates

**Frontend**
```typescript
// Listen for balance updates via WebSocket
socket.on('balance_update', ({ newBalance, delta }) => {
  store.updateBalance(newBalance);
  showNotification(`Balance: +${delta}`);
});
```

**Backend**
- After game completion
- After deposit/withdrawal
- Broadcasts to user

### 4. Tournament Registration

**Frontend**
```typescript
const response = await fetch('http://localhost:3000/api/tournaments/join', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ tournamentId })
});
```

**Backend**
- Validates entry fee
- Holds escrow
- Updates tournament state

### 5. Payments

**Frontend**
```typescript
// Initiate M-Pesa deposit
const response = await fetch('http://localhost:3000/api/payment/mpesa/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ phoneNumber: '254712345678', amount: 1000 })
});

const { reference } = await response.json();
// Show "Please enter M-Pesa PIN" message
// Backend will callback when payment completes
```

**Backend**
- Calls M-Pesa API
- Creates PENDING transaction
- Receives async callback
- Updates balance
- Notifies frontend via WebSocket

## WebSocket Events Reference

### Client sends to Server

```typescript
// Matchmaking
socket.emit('join_matchmaking', {
  gameType: 'blitz' | 'duel' | 'tournament',
  entryFee: number
});

socket.emit('cancel_matchmaking', {
  gameType: 'blitz' | 'duel'
});

// Game
socket.emit('ready_for_spin', {
  gameId: string
});

socket.emit('spin_complete', {
  gameId: string,
  winnings: number
});

// Tournament
socket.emit('tournament:join', {
  tournamentId: string
});

// Keep-alive
socket.emit('ping', { timestamp: number });
```

### Server sends to Client

```typescript
// Matchmaking found
socket.on('match_found', {
  gameId: string,
  roomCode: string,
  players: string[],
  pot: number
});

// Game ready
socket.on('game_locked', {
  gameId: string,
  playersReady: number
});

// Spin events
socket.on('spin_start', {
  gameId: string,
  duration: number,
  seed: string,
  winnerSegment: number
});

socket.on('spin_end', {
  gameId: string,
  winner: string,
  winnings: number
});

// Tournament events
socket.on('tournament:joined', {
  tournamentId: string,
  currentPlayers: number,
  maxPlayers: number
});

socket.on('tournament:round_start', {
  tournamentId: string,
  round: number,
  gameId: string,
  opponents: string[]
});

socket.on('tournament:eliminated', {
  tournamentId: string,
  position: number
});

// Balance update
socket.on('balance_update', {
  newBalance: number,
  delta: number
});

// Payment callback
socket.on('payment:callback', {
  reference: string,
  status: 'success' | 'failed'
});

// Error
socket.on('error', {
  code: string,
  message: string
});
```

## Pinia Store Integration

### Example Store Structure

```typescript
// stores/gameStore.ts
import { defineStore } from 'pinia';

export const useGameStore = defineStore('game', {
  state: () => ({
    activeGame: null,
    balance: 0,
    pendingWithdrawal: null,
  }),

  actions: {
    updateBalance(amount) {
      this.balance = amount;
    },

    setActiveGame(game) {
      this.activeGame = game;
    },

    async joinGame(gameType, entryFee) {
      // Call WebSocket emit
      return new Promise((resolve) => {
        socket.emit('join_matchmaking', {
          gameType,
          entryFee
        });

        socket.once('match_found', (data) => {
          this.activeGame = data;
          resolve(data);
        });
      });
    }
  }
});
```

## Error Handling

### API Errors

```typescript
try {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data;
} catch (error) {
  // Handle error
  console.error(error.message);
  showErrorNotification(error.message);
}
```

### WebSocket Errors

```typescript
socket.on('error', ({ code, message }) => {
  console.error(`[${code}] ${message}`);

  switch (code) {
    case 'AUTH_FAILED':
      redirectToLogin();
      break;
    case 'INSUFFICIENT_BALANCE':
      showDepositPrompt();
      break;
    default:
      showErrorNotification(message);
  }
});
```

## Testing Integration

### 1. Test Authentication

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend (or .)
npm run dev

# Terminal 3: Test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","username":"testuser"}'
```

### 2. Test WebSocket

```typescript
// In browser console
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => console.log('Connected'));

socket.emit('join_matchmaking', {
  gameType: 'blitz',
  entryFee: 100
});

socket.on('match_found', (data) => console.log('Match:', data));
```

### 3. Test Payments

- Use provider sandbox environments
- M-Pesa: Use Safaricom sandbox
- Paystack: Use Paystack test keys
- Test with test phone numbers/cards

## Production Deployment

### Frontend Deployment

```bash
# Build
npm run build

# Deploy to Vercel/Netlify
vercel deploy

# Update environment variables
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_BACKEND_WS_URL=wss://api.yourdomain.com
```

### Backend Deployment

```bash
# Deploy to Render/Railway
# Set environment variables
```

### CORS Configuration

Frontend: `http://localhost:5173`
Backend (production): `https://yourdomain.com`

Update in `server.ts`:
```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
});
```

## Common Issues & Solutions

### CORS Error
- Backend: Ensure CORS is enabled
- Browser: Check Origins match
- WebSocket: Use same domain/port

### WebSocket Connection Fails
- Verify backend is running
- Check token is valid and included
- Verify port is accessible

### Balance Not Updating
- Check WebSocket connection
- Verify emit/on listeners are registered
- Check browser console for errors

### Payment Not Processing
- Verify credentials in .env
- Check callback URL is accessible
- Test with sandbox/test mode first

## Next Steps

1. Test all API endpoints
2. Verify WebSocket communication
3. Run payment provider sandboxes
4. Load testing
5. Deploy to staging
6. User acceptance testing
7. Production deployment
