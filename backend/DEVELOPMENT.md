## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Setup

1. **Clone repository**
```bash
git clone <repo>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup PostgreSQL** (if running locally)
```bash
createdb xspin_db
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with local database URL and Redis
```

5. **Run migrations**
```bash
npm run migrate
```

6. **Start development server**
```bash
npm run dev
```

Server runs on http://localhost:3000

## Testing Endpoints

### Using cURL

**Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get User Profile** (replace TOKEN with actual JWT)
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

**Create Game**
```bash
curl -X POST http://localhost:3000/api/games/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"blitz","entryFee":100,"maxPlayers":5}'
```

**Join Tournament**
```bash
curl -X POST http://localhost:3000/api/tournaments/join \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tournamentId":"<tournament-id>"}'
```

## WebSocket Testing

Use Socket.io test client or:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.emit('join_matchmaking', {
  gameType: 'blitz',
  entryFee: 100
});

socket.on('match_found', (data) => {
  console.log('Match found:', data);
});
```

## Debug Mode

Set debug environment for more verbose logging:

```bash
DEBUG=xspin:* npm run dev
```

## Database Inspection

Connect to PostgreSQL:
```bash
psql xspin_db
```

Common queries:
```sql
-- List all users
SELECT id, email, balance, total_wagered, total_won FROM users;

-- List active games
SELECT * FROM games WHERE status != 'completed';

-- Check escrow
SELECT * FROM escrow WHERE status = 'locked';

-- Transaction history
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting

### Redis connection refused
- Ensure Redis is running: `redis-cli ping`
- Check REDIS_URL in .env

### Database connection error
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Run migrations: `npm run migrate`

### WebSocket connection fails
- Check auth token is valid
- Verify CORS settings for production
- Check Socket.io port availability

### Payment webhook not working
- Ensure callback URL is publicly accessible
- Check payment provider credentials
- Verify webhook signature validation

## Performance Optimization

1. **Database**
   - Add indexes for frequent queries
   - Use connection pooling (already configured)
   - Archive old games periodically

2. **Redis**
   - Monitor memory usage
   - Set TTLs on cache keys
   - Use appropriate expiration times

3. **WebSocket**
   - Use rooms for game/tournament broadcasts
   - Limit event frequency
   - Implement backpressure handling

4. **API**
   - Cache responses where appropriate
   - Implement pagination
   - Use request validation

## Production Checklist

- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring alerts set up
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] CORS settings restricted
- [ ] Security headers added
- [ ] Payment webhooks IP whitelisted
