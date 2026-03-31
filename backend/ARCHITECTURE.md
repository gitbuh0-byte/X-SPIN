# X-SPIN Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                Frontend (React/Vite PWA)                    │
│  - Game UI, Tournaments, User Profiles, Wallet             │
│  - Socket.io Client, Pinia Store                           │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS/WSS
┌────────────────▼────────────────────────────────────────────┐
│              Express.js + Socket.io Server                   │
│  Running on Render/Railway/Heroku                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ REST API Layer (Express Routes)                      │   │
│  │ - Authentication (/api/auth)                         │   │
│  │ - Games (/api/games)                                 │   │
│  │ - Tournaments (/api/tournaments)                     │   │
│  │ - Payments (/api/payment)                            │   │
│  │ - Users (/api/users)                                 │   │
│  │ - Admin (/api/admin)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WebSocket Layer (Socket.io)                          │   │
│  │ - Matchmaking                                        │   │
│  │ - Game Rooms                                         │   │
│  │ - Tournament Rooms                                   │   │
│  │ - Real-time Balance Updates                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Service Layer                                        │   │
│  │ - AuthService (JWT, OAuth)                           │   │
│  │ - GameService (Create, Join, Complete)              │   │
│  │ - TournamentService (Bracket, Advancement)          │   │
│  │ - PaymentService (M-Pesa, Paystack, Airtel)        │   │
│  │ - UserService (Profile, Stats, Leaderboard)        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                     │   │
│  │ - JWT Authentication                                │   │
│  │ - Rate Limiting                                     │   │
│  │ - Error Handling                                    │   │
│  │ - Request Validation (Zod)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Background Jobs (BullMQ)                             │   │
│  │ - Payout Queue (Process Escrow Release)             │   │
│  │ - Tournament Queue (Round Scheduling)               │   │
│  │ - Cleanup Queue (Archive Old Data)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
        ┌───────┼────────┬──────────┐
        │       │        │          │
┌───────▼─┐ ┌──▼──┐ ┌───▼────┐ ┌──▼────────┐
│ Supabase│ │Redis│ │BullMQ  │ │ Payment   │
│PostgreSQL│ │Cache│ │Queues  │ │ Webhooks  │
│          │ │     │ │        │ │ Endpoints │
│- Users   │ │- Rx │ │- Async │ │           │
│- Games   │ │- RT │ │  Jobs  │ │ M-Pesa    │
│- Tournaments  │ │ │        │ │ Paystack  │
│- Transactions │ │ │ │        │ │ Airtel    │
│- Escrow  │ │ │  │ │        │ │           │
└───────┬──┘ └──┬──┘ └────┬───┘ └──────────┘
        │       │         │
        └───────┼─────────┘
                │
            External APIs
         (Safaricom, Paystack,
          Airtel, etc.)
```

## Data Flow Examples

### Game Flow

```
1. User joins game via WebSocket
   → GameService.joinGame()
   → Escrow locked in DB
   → User balance deducted
   → Room broadcast: player_joined
   
2. Game starts when all players ready
   → GameService.startGame()
   → Spin animation starts
   
3. Spin completes
   → GameService.completeGame()
   → Escrow released
   → Winner balance updated
   → Loser balance already deducted
   → Transaction records created
   → WebSocket broadcast: spin_end
```

### Tournament Flow

```
Phase 1: Registration
   1. TournamentService.createTournament()
   2. Players join via tournament:join
   3. Escrow held for each player
   4. Timer: 10 minutes or 100 players
   
Phase 2: Round Start
   1. TournamentService.startTournament()
   2. Players shuffled into 20 groups of 5
   3. Group games created
   4. Players notified via broadcast
   
Phase 3: Group Play
   1. Each group plays simultaneously
   2. Group winners recorded
   3. BullMQ job: advanceRound when all done
   
Phase 4: Round Advancement
   1. Winners shuffled into new groups
   2. Eliminated players moved to spectate mode
   3. New round bracket created
   4. Repeat until 1 winner remains
   
Phase 5: Completion
   1. Tournament winner announced
   2. Entire pot released to winner
   3. All escrows marked released
   4. Final transaction created
```

### Payment Flow

```
Deposit (M-Pesa):
1. Client: POST /api/payment/mpesa/initiate
   {phoneNumber, amount}
   
2. Server:
   - Creates PENDING transaction
   - Calls Safaricom STK Push API
   - Returns reference
   
3. User: Enters M-Pesa PIN on phone
   
4. Safaricom: POSTs callback to webhook
   
5. Server:
   - Verifies signature
   - Marks transaction COMPLETED
   - Updates user balance
   - Broadcasts balance_update via WS
   
6. Client: Updates UI with new balance

Withdrawal (similar, with deduction first)
```

## Database Schema

### Core Tables

**users**
- id (UUID)
- email, username
- password_hash
- balance, total_wagered, total_won
- verification_status, role, is_active
- created_at, updated_at

**games**
- id, type, status
- entry_fee, pot
- winner_id
- round_data (JSON)
- created_at, started_at, ended_at

**game_players** (many-to-many)
- game_id, player_id
- joined_at

**tournaments**
- id, status
- entry_fee, max_players, current_players
- total_pot, current_round
- bracket_data (JSON)
- winner_id
- created_at, started_at, ended_at

**tournament_players** (many-to-many)
- tournament_id, player_id
- position
- joined_at

**transactions**
- id, user_id
- type, amount, status
- payment_method, reference
- metadata (JSON)
- created_at, completed_at

**escrow**
- id, user_id
- entity_type, entity_id
- amount, status
- released_to, released_at

## Caching Strategy

### Redis Keys

**Games**
- `game:{id}` - Entire game object (TTL: 10 min)
- `game:{id}:players` - Sorted set of players

**Tournaments**
- `tournament:{id}` - Tournament state (TTL: indefinite)
- `tournament:{id}:bracket` - Current bracket

**Matchmaking**
- `matchmaking:blitz` - Sorted set of players waiting
- `matchmaking:duel` - Sorted set of duel challengers

**User**
- `user:{id}:balance` - Current balance (cache, TTL: 5 min)
- `user:{id}:online` - Boolean online status

**General**
- `mpesa_access_token` - M-Pesa token (TTL: 55 min)
- `paystack_access_token` - Paystack token (TTL: 55 min)
- `leaderboard` - Top 100 players (TTL: 1 hour)

## Service Dependencies

```
AuthService
  ├── database (JWT validation)
  └── redis (refresh token blacklist)

GameService
  ├── database (game state)
  ├── redis (cache)
  └── escrow operations

TournamentService
  ├── GameService (create group games)
  ├── database (bracket state)
  ├── redis (cache)
  └── BullMQ (schedule round advancement)

PaymentService
  ├── axios (external API calls)
  ├── redis (token caching)
  ├── database (transaction recording)
  └── webhook verification

UserService
  ├── database (user queries)
  └── redis (cache)
```

## Error Handling Strategy

All errors propagate as `AppError`:

```typescript
throw new AppError(
  code: string,      // Machine-readable error code
  message: string,   // User-friendly message
  status: number     // HTTP status code
)
```

Error codes:
- `AUTH_*` - Authentication failures (401)
- `VALIDATION_*` - Input validation (400)
- `NOT_FOUND` - Resource not found (404)
- `INSUFFICIENT_BALANCE` - Payment issues (400)
- `RATE_LIMIT_EXCEEDED` - Rate limiting (429)
- `INTERNAL_ERROR` - Server errors (500)

## Security Layers

### 1. Authentication
- JWT tokens with 24h expiration
- Refresh tokens for renewal
- OAuth2 support (Google, Facebook, Apple)
- Password hashing with bcryptjs

### 2. Authorization
- Role-based access control (user, admin, moderator)
- Endpoint-level authorization
- Admin routes restricted to admin role

### 3. Data Validation
- Zod schema validation
- Input sanitization
- SQL parameterized queries (no injection)
- Phone number format validation

### 4. Rate Limiting
- 100 requests/min per IP
- 5 payment operations/day per user
- Payment endpoint specific limits

### 5. Webhook Security
- Signature verification for all webhooks
- IP whitelisting (optional)
- Idempotency keys to prevent duplicates
- Timestamp validation

### 6. Encryption
- AES-256 for sensitive data
- HTTPS/TLS in transit
- Database encryption at rest (recommended)

## Scaling Considerations

### Horizontal Scaling
- Socket.io Redis adapter allows multiple server instances
- Load balancer distributes HTTP requests
- Sticky sessions for WebSocket connections

### Database Scaling
- Read replicas for analytics queries
- Connection pooling (20 connections)
- Index optimization for frequent queries
- Archival of old games/transactions

### Redis Scaling
- Cluster mode for large data
- Persistence enabled for critical data
- TTLs to prevent memory bloat
- Monitoring for memory usage

### API Optimization
- Response caching
- Pagination for large datasets
- Batch operations where possible
- Async operations for heavy tasks

## Monitoring & Observability

### Logging
- Structured logs with Pino
- Request/response logging
- Error stack traces
- Audit trail for payments

### Metrics
- Request latency
- Error rates
- Database query times
- Redis hit/miss rates
- Payment success rates
- WebSocket connection count

### Alerts
- Error rate > 1%
- Response time > 5s
- Database connection pool exhausted
- Redis memory > 80%
- Payment webhook failures

## Deployment Readiness

✅ TypeScript for type safety
✅ Environment configuration management
✅ Database migrations automated
✅ Error handling comprehensive
✅ Rate limiting implemented
✅ Security middleware in place
✅ WebSocket scaling setup
✅ Background job processing
✅ Payment provider integration
✅ Logging and monitoring ready

## Future Enhancements

1. GraphQL API layer
2. Caching layer optimization
3. Microservices architecture
4. Event sourcing for audit trail
5. Real-time leaderboards
6. Fraud detection ML models
7. Cryptocurrency support
8. Advanced analytics dashboard
