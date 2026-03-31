# X-SPIN Backend

Complete backend implementation for the X-SPIN gambling platform with real-time game engine, tournament system, and payment integration.

## Stack
- **Runtime**: Node.js + Express.js
- **Real-time**: Socket.io with Redis adapter
- **Database**: PostgreSQL (Supabase)
- **Cache/Queues**: Redis (Upstash)
- **Background Jobs**: BullMQ
- **Authentication**: JWT  
- **Payments**: M-Pesa, Paystack, Airtel Money

## Quick Start

### Installation
```bash
cd backend
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Fill in your environment variables
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Main server entry point
│   ├── config.ts              # Environment configuration
│   ├── database/              # Database setup & migrations
│   │   ├── db.ts
│   │   ├── migrations.ts
│   │   └── supabase.ts
│   ├── services/              # Business logic
│   │   ├── auth.ts            # Authentication
│   │   ├── payment.ts         # Payment processing
│   │   ├── game.ts            # Game logic
│   │   └── tournament.ts      # Tournament orchestration
│   ├── websocket/             # Real-time communication
│   │   └── index.ts
│   ├── queues/                # Background jobs
│   │   └── index.ts
│   ├── routes/                # API endpoints
│   │   ├── auth.ts
│   │   ├── games.ts
│   │   ├── tournaments.ts
│   │   ├── payments.ts
│   │   └── users.ts
│   ├── middleware/            # Express middleware
│   │   └── auth.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   └── utils/                 # Utilities
│       ├── logger.ts
│       └── redis.ts
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/oauth` - OAuth login

### Games
- `POST /api/games/create` - Create new game
- `POST /api/games/join` - Join game
- `GET /api/games/:gameId` - Get game details

### Tournaments
- `POST /api/tournaments/create` - Create tournament
- `POST /api/tournaments/join` - Join tournament
- `POST /api/tournaments/:tournamentId/start` - Start tournament
- `GET /api/tournaments/:tournamentId` - Get tournament details

### Payments
- `POST /api/payment/mpesa/initiate` - Initiate M-Pesa deposit
- `POST /api/payment/mpesa/callback` - M-Pesa webhook
- `POST /api/payment/paystack/initiate` - Initiate Paystack deposit
- `POST /api/payment/paystack/verify/:reference` - Verify Paystack payment
- `POST /api/payment/withdraw` - Withdraw funds

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/balance` - Get user balance
- `GET /api/users/transactions` - Get transaction history
- `GET /api/users/game-history` - Get game history

## WebSocket Events

### Client → Server
- `join_matchmaking` - Join matchmaking queue
- `cancel_matchmaking` - Leave matchmaking queue
- `ready_for_spin` - Signal ready to play
- `spin_complete` - Report spin completion
- `tournament:join` - Join tournament
- `ping` - Keep-alive signal

### Server → Client
- `match_found` - Match found in queue
- `game_locked` - All players ready
- `spin_start` - Spin animation start
- `spin_end` - Spin animation end
- `tournament:joined` - Joined tournament
- `tournament:player_joined` - Another player joined
- `balance_update` - Balance changed
- `error` - Error occurred

## Database Schema

### Users
- id, email, username, password_hash
- balance, total_wagered, total_won
- auth_provider, verification_status, role

### Games
- id, type, status, entry_fee, pot
- players, winner_id, round_data

### Tournaments
- id, status, entry_fee, max_players
- current_players, total_pot, bracket_data

### Transactions
- id, user_id, type, amount, status
- payment_method, reference, metadata

### Escrow
- id, user_id, entity_type, entity_id
- amount, status, released_at

## Security

- JWT token authentication with refresh rotation
- Escrow protection with database transactions
- Rate limiting (100 req/min per IP)
- Request validation with Zod
- WebSocket authentication on handshake
- Payment webhook signature verification
- Idempotency keys for payment callbacks

## Deployment

### Render
```bash
# Create Render service
# Connect GitHub repo
# Set environment variables
# Deploy
```

### Railway
```bash
# Similar to Render
```

### Environment Variables Required
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- REDIS_URL (Upstash)
- JWT_SECRET (min 32 chars)
- Payment provider API keys (M-Pesa, Paystack, Airtel)
- MPESA_CALLBACK_URL (public webhook endpoint)

## Scaling Considerations

- Socket.io Redis adapter for horizontal scaling
- Connection pooling for PostgreSQL
- CDN for static assets
- Offload payment processing to queues
- Archive old games/transactions regularly
- Monitor Redis memory usage

## Development Notes

- Use `npm run dev` for watch mode with tsx
- Database migrations run automatically on startup
- BullMQ queues initialized on server start
- SQL queries use parameterized statements to prevent injection
- All errors wrapped in AppError for consistency
- Logging with Pino for structured logs

## Next Steps

1. Complete Airtel Money integration
2. Add email verification flow
3. Implement 2FA for withdrawals
4. Add leaderboard/ranking system
5. Create admin dashboard
6. Setup monitoring (Sentry, DataDog)
7. Performance optimization (caching strategies)
8. Load testing and stress testing
