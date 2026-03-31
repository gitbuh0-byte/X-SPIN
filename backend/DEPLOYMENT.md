# Backend Deployment Guide

## Pre-deployment Checklist

- [ ] Environment variables configured in .env
- [ ] Database migrations tested locally
- [ ] Payment provider credentials verified
- [ ] WebSocket configuration for production domain
- [ ] Redis connection tested
- [ ] All dependencies installed
- [ ] Code built without errors

## Render Deployment

1. Connect GitHub repository to Render
2. Create new Web Service
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

## Railway Deployment

1. Install Railway CLI: `npm i -g railway`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL plugin
5. Add Redis plugin
6. Set environment variables
7. Deploy: `railway up`

## Vercel Edge Functions (Alternative)

For serverless deployment with WebSocket support via external service:
- Use external Redis service
- Offload WebSocket to separate Socket.io server
- Deploy REST API to Vercel Functions

## Environment Variables

Required for production:

```
NODE_ENV=production
PORT=3000

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# JWT
JWT_SECRET=your-64-char-secret-key-here
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# M-Pesa
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_SHORTCODE=xxx
MPESA_CALLBACK_URL=https://yourdomain.com/api/payment/mpesa/callback

# Paystack
PAYSTACK_SECRET_KEY=xxx
PAYSTACK_PUBLIC_KEY=xxx

# Airtel Money
AIRTEL_CLIENT_ID=xxx
AIRTEL_CLIENT_SECRET=xxx

# Logging
LOG_LEVEL=info
```

## Post-deployment

1. Run migrations on production database
2. Verify health endpoint: `GET /health`
3. Test authentication endpoint
4. Monitor logs
5. Set up monitoring and alerts

## Rollback Procedure

If deployment fails:

1. Render: Revert to previous deployment
2. Railway: Use `railway down` and redeploy previous version
3. Monitor error logs for issues
4. Fix issues locally
5. Redeploy

## Monitoring

- Sentry for error tracking
- DataDog for performance monitoring
- CloudFlare for DDoS protection
- New Relic for APM
