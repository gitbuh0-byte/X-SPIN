# Payment System Documentation

## Overview

The X-SPIN payment system integrates three major payment providers to enable deposits and withdrawals for African markets:

- **M-Pesa**: For Kenya, Tanzania, and East Africa
- **Paystack**: For card and bank transfers across Africa
- **Airtel Money**: For Airtel subscribers in Africa

## Architecture

### Payment Flow

```
Client Request
    ↓
Backend API
    ↓
Payment Service (Route to provider)
    ↓
Payment Provider
    ↓
Callback/Webhook (Async)
    ↓
Verify & Update Database
    ↓
Update User Balance
    ↓
WebSocket Notification to Client
```

## Deposit Flows

### M-Pesa Deposit

1. **Initiate STK Push**
   - Endpoint: `POST /api/payment/mpesa/initiate`
   - Request: `{ phoneNumber: "254712345678", amount: 1000 }`
   - Response: Unique reference for tracking

2. **User completes payment on phone**

3. **Safaricom sends callback**
   - Endpoint: `POST /api/payment/mpesa/callback`
   - Backend verifies signature and updates balance

4. **User receives balance update via WebSocket**

### Paystack Deposit

1. **Initialize Transaction**
   - Endpoint: `POST /api/payment/paystack/initiate`
   - Returns authorization URL
   - User redirects to Paystack checkout

2. **User completes payment on Paystack**

3. **Verify Payment**
   - Endpoint: `POST /api/payment/paystack/verify/:reference`
   - Backend queries Paystack API
   - Updates user balance if successful

### Airtel Money Deposit

1. **Initiate Disburse**
   - Similar to M-Pesa STK push
   - Endpoint: `POST /api/payment/airtel/initiate`
   - Airtel pings phone user

2. **User completes payment**

3. **Airtel sends callback**
   - Backend processes and updates balance

## Withdrawal Flows

### Process

1. User requests withdrawal: `POST /api/payment/withdraw`
2. Backend validates:
   - User has sufficient balance
   - Amount within limits
   - Valid phone/account number

3. Backend deducts balance immediately
4. Calls payment provider API
5. On success: Mark transaction complete
6. On failure: Restore balance (retry logic)

### Provider-Specific Notes

**M-Pesa**
- Uses B2C (Business to Customer) endpoint
- Requires paybill number
- Result callback confirms delivery

**Paystack**
- Bank transfers use Nigerian bank details
- Transfer settlement: 2-24 hours
- Returns transfer reference code

**Airtel Money**
- Direct to Airtel wallet
- Settlement: Immediate
- Requires active Airtel account

## Security Implementation

### Webhook Verification

All webhooks are verified before processing:

```typescript
// M-Pesa
const isValid = WebhookVerifier.verifyMpesaSignature(
  data,
  signature,
  config.MPESA_CONSUMER_SECRET
);

// Paystack
const isValid = WebhookVerifier.verifyPaystackSignature(
  payload,
  signature
);
```

### Idempotency

Payment operations use idempotency keys to prevent duplicate processing:

```typescript
const key = IdempotencyManager.generateKey(userId, operation, amount);
if (IdempotencyManager.isIdempotent(key)) {
  return IdempotencyManager.getResult(key);
}
```

### Input Validation

All inputs are validated using Zod/joi:

```typescript
ValidationUtils.isValidPhoneNumber(phone, 'KE')
ValidationUtils.isValidAmount(amount, 1, 1000000)
ValidationUtils.isValidEmail(email)
```

## Rate Limiting

Payment endpoints have strict rate limiting:

- Deposit initiation: 5 per day per user
- Withdrawal: 5 per day per user
- Payment verification: 10 per minute per IP
- Global: 100 requests per minute per IP

## Transaction States

```
PENDING    → User initiated, awaiting payment provider
COMPLETED  → Payment successful, balance updated
FAILED     → Payment failed, balance restored (if deducted)
CANCELLED  → User cancelled or system cancelled
```

## Escrow Integration

For games and tournaments:

1. When user joins → Funds locked in `escrow` table
2. During game → Funds remain locked
3. On completion → Escrow released (winner takes pot)
4. On cancellation → Escrow refunded

```sql
SELECT * FROM escrow WHERE status = 'locked';
```

## Error Handling

All payment errors return structured responses:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "User has insufficient balance"
  }
}
```

Common error codes:
- `INSUFFICIENT_BALANCE` - User doesn't have enough to withdraw
- `INVALID_DESTINATION` - Phone number or account invalid
- `PROVIDER_ERROR` - Payment provider API error
- `WEBHOOK_VERIFICATION_FAILED` - Webhook signature invalid
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Monitoring & Alerts

Key metrics to monitor:

- Transaction success rate (target: >95%)
- Average payment processing time
- Failed webhooks (should be 0)
- Stuck transactions (pending > 1 hour)
- Provider API response times

## Testing

### Local Testing

1. Use Postman or curl to test endpoints
2. Mock payment provider callbacks
3. Verify database state after each operation

### Staging

- Use provider sandbox environments
- Test all provider integrations
- Verify webhook endpoints are accessible
- Load test to 1000 concurrent transactions

### Production Safeguards

- All payment operations logged
- Regular database backups
- Monitoring and alerting
- Incident response playbook
- 24/7 provider support contacts

## Provider Credentials

### M-Pesa
- Get from: https://developer.safaricom.co.ke
- Required: Consumer Key, Consumer Secret, Shortcode

### Paystack
- Get from: https://dashboard.paystack.com/settings/developer
- Required: Secret Key, Public Key

### Airtel Money
- Get from: https://openapi.airtel.africa
- Required: Client ID, Client Secret

## Troubleshooting

### Payment stuck in PENDING

1. Check if webhook URL is accessible
2. Verify provider credentials
3. Check database escrow table
4. Contact payment provider support

### Webhook not received

1. Verify callback URL in provider dashboard
2. Check firewall/VPN blocking
3. Verify SSL certificate is valid
4. Check server logs for errors

### Balance not updated

1. Verify transaction record exists
2. Check escrow table
3. Manually trigger verification endpoint
4. Review application logs

## Future Enhancements

- [ ] Cryptocurrency support (USDC, USDT)
- [ ] Bank transfer API integration
- [ ] Recurring payment setup
- [ ] Payment plan/installments
- [ ] Settlement consolidation
- [ ] Real-time FX updates
- [ ] Enhanced fraud detection
