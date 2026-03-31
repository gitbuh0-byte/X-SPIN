# Backend Setup Guide

## Current Status
The backend structure is complete with all necessary files, but npm dependencies need proper installation.

## Prerequisites
- Node.js v18+ (confirmed: v24.13.1)
- npm 7+ (confirmed: v11.10.1)
- Redis server running
- PostgreSQL/Supabase database

## Installation Steps

### Quick Start (Recommended)
```bash
cd backend

# Clean install - delete lock file and node_modules if they exist
rm package-lock.json

# Install dependencies
npm install

# Install tsx if not already installed
npm install -D tsx

# Copy .env.example to .env and update with your credentials
cp .env.example .env
```

### Run Development Server
```bash
# From backend directory
npm run dev

# Or directly with tsx
npx tsx watch src/server.ts
```

### Expected Output
If successful, you should see:
```
Server running on port 3000
Connected to database
Redis client connected
```

### Build for Production
```bash
npm run build
npm start
```

## Configuration

### Environment Variables
1. Copy `.env.example` to `.env`
2. Update with your actual credentials:
   - Database URL (Supabase or PostgreSQL)
   - Redis URL
   - JWT secrets
   - OAuth credentials
   - Payment provider keys (M-Pesa, Paystack, Airtel)

### Database Setup
```bash
# Run migrations (auto-runs on server start)
npm run migrate
```

## Troubleshooting

### "Cannot find package 'express'" Error
**Solution**: Ensure npm install completed successfully
```bash
# Verify node_modules exists
ls node_modules | head

# If missing, try:
npm cache clean --force
npm install --no-audit --no-fund
```

### npm install hangs or times out
**Solution**: Use prefer-offline flag
```bash
npm install --prefer-offline --no-audit
```

### TypeScript errors
**Solution**: Ensure tsx and TypeScript are installed
```bash
npm install -D tsx typescript
```

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/refresh` - Refresh JWT token

### Games
- **POST** `/api/games/create` - Create new game
- **GET** `/api/games/:id` - Get game details
- **POST** `/api/games/:id/join` - Join existing game

### Tournaments
- **POST** `/api/tournaments/create` - Create tournament
- **POST** `/api/tournaments/:id/join` - Join tournament
- **POST** `/api/tournaments/:id/start` - Start tournament

### Payments
- **POST** `/api/payments/mpesa/pay` - M-Pesa payment
- **POST** `/api/payments/paystack/pay` - Paystack payment
- **POST** `/api/payments/withdraw` - Withdraw earnings

## WebSocket Events

### Client to Server
- `matchmaking:start` - Start looking for opponent
- `game:move` - Make a game move
- `chat:send` - Send chat message

### Server to Client
- `matchmaking:found` - Opponent found
- `game:update` - Game state update
- `balance:update` - User balance changed

## Development Workflow

### Watch Mode
```bash
npm run dev
```
This will automatically recompile and restart the server on file changes.

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Production Deployment

### Environment Setup
```bash
NODE_ENV=production
```

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

## Database Migrations

Migrations auto-run on server startup. Manual migration:
```bash
npm run migrate
```

Tables created:
- `users` - User accounts
- `games` - Game records
- `tournaments` - Tournament records
- `transactions` - Payment transactions
- `escrow` - Locked funds during games
- `game_players` - Game participants
- `tournament_players` - Tournament participants
- `rate_limits` - Rate limit tracking

## Monitoring

Check application logs:
```bash
# View logs in real-time
tail -f logs/app.log

# Or check stdout from npm run dev
```

## Support

For issues:
1. Check `.env` file is properly configured
2. Verify database connection
3. Verify Redis is running
4. Check Node.js and npm versions match requirements
5. Review error logs in console output
