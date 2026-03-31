import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { query } from '../database/db.js';
import { Transaction, TransactionStatus, PaymentMethod, AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { setCache, getCache } from '../utils/redis.js';

export class PaymentService {
  // M-Pesa STK Push
  async initiateMpesaDeposit(phoneNumber: string, amount: number, userId: string): Promise<string> {
    try {
      // Get M-Pesa access token
      const accessToken = await this.getMpesaAccessToken();

      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${config.MPESA_SHORTCODE}${config.MPESA_CONSUMER_SECRET}${timestamp}`
      ).toString('base64');

      const reference = uuidv4();

      // Create pending transaction
      await query(
        `INSERT INTO transactions (user_id, type, amount, status, payment_method, reference)
         VALUES ($1, 'deposit', $2, 'pending', 'mpesa', $3)`,
        [userId, amount, reference]
      );

      const response = await axios.post(
        'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: config.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.floor(amount),
          PartyA: phoneNumber,
          PartyB: config.MPESA_SHORTCODE,
          PhoneNumber: phoneNumber,
          CallBackURL: config.MPESA_CALLBACK_URL,
          AccountReference: `USER-${userId}`,
          TransactionDesc: 'X-SPIN Deposit',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info(`M-Pesa STK push initiated for user ${userId}, reference: ${reference}`);

      return reference;
    } catch (err) {
      logger.error('M-Pesa initiation error:', err);
      throw new AppError('MPESA_INITIATION_FAILED', 'Failed to initiate M-Pesa payment');
    }
  }

  // M-Pesa Callback Webhook Handler
  async handleMpesaCallback(callbackData: Record<string, unknown>): Promise<void> {
    try {
      const body = callbackData.Body as Record<string, unknown> | undefined;
      const stk = body?.stkCallback as Record<string, unknown> | undefined;

      if (!stk) {
        throw new Error('Invalid M-Pesa callback');
      }

      const resultCode = stk.ResultCode as number;

      if (resultCode !== 0) {
        logger.warn(`M-Pesa payment failed: ${stk.ResultDesc}`);
        return;
      }

      // Extract metadata
      const metadata_obj = stk.CallbackMetadata as Record<string, unknown> | undefined;
      const callbackMetadata = metadata_obj?.callbackMetadata as Array<{
        Name: string;
        Value: unknown;
      }> | undefined;
      const metadata: Record<string, unknown> = {};

      if (callbackMetadata) {
        for (const item of callbackMetadata) {
          metadata[item.Name] = item.Value;
        }
      }

      // Update transaction
      const receiptNumber = metadata.MpesaReceiptNumber;

      await query(
        `UPDATE transactions SET status = 'completed', metadata = $1, completed_at = NOW()
         WHERE payment_method = 'mpesa' AND status = 'pending'
         AND reference = $2`,
        [JSON.stringify(metadata), receiptNumber]
      );

      // Add funds to user
      const txRes = await query(
        `SELECT user_id, amount FROM transactions WHERE reference = $1`,
        [receiptNumber]
      );

      if (txRes.rows.length > 0) {
        const { user_id, amount } = txRes.rows[0];

        await query(
          `UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
          [amount, user_id]
        );

        logger.info(`M-Pesa deposit completed for user ${user_id}, amount: ${amount}`);
      }
    } catch (err) {
      logger.error('M-Pesa callback error:', err);
    }
  }

  // Paystack Deposit
  async initiatePaystackDeposit(amount: number, email: string, userId: string): Promise<string> {
    try {
      const reference = uuidv4();

      // Create pending transaction
      await query(
        `INSERT INTO transactions (user_id, type, amount, status, payment_method, reference)
         VALUES ($1, 'deposit', $2, 'pending', 'paystack', $3)`,
        [userId, amount, reference]
      );

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: Math.floor(amount * 100), // Paystack uses kobo
          reference,
          callback_url: `${config.SUPABASE_URL}/api/payment/paystack/verify`,
        },
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      logger.info(`Paystack payment initiated for user ${userId}, reference: ${reference}`);

      return response.data.data.authorization_url;
    } catch (err) {
      logger.error('Paystack initiation error:', err);
      throw new AppError('PAYSTACK_INITIATION_FAILED', 'Failed to initiate Paystack payment');
    }
  }

  // Paystack Verification
  async verifyPaystackPayment(reference: string): Promise<void> {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (response.data.data.status === 'success') {
        // Update transaction
        await query(
          `UPDATE transactions SET status = 'completed', completed_at = NOW()
           WHERE reference = $1`,
          [reference]
        );

        // Add funds to user
        const txRes = await query(
          `SELECT user_id, amount FROM transactions WHERE reference = $1`,
          [reference]
        );

        if (txRes.rows.length > 0) {
          const { user_id, amount } = txRes.rows[0];

          await query(
            `UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
            [amount / 100, user_id] // Convert from kobo
          );

          logger.info(`Paystack deposit completed for user ${user_id}, amount: ${amount / 100}`);
        }
      }
    } catch (err) {
      logger.error('Paystack verification error:', err);
      throw new AppError('PAYSTACK_VERIFICATION_FAILED', 'Failed to verify payment');
    }
  }

  // Withdrawal
  async initiateWithdrawal(
    userId: string,
    amount: number,
    method: PaymentMethod,
    destination: string
  ): Promise<string> {
    try {
      // Check user balance
      const userRes = await query('SELECT balance FROM users WHERE id = $1', [userId]);

      if (userRes.rows.length === 0) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      const { balance } = userRes.rows[0];

      if (balance < amount) {
        throw new AppError('INSUFFICIENT_BALANCE', 'Insufficient balance', 400);
      }

      const reference = uuidv4();

      // Create withdrawal transaction
      await query(
        `INSERT INTO transactions (user_id, type, amount, status, payment_method, reference)
         VALUES ($1, 'withdrawal', $2, 'pending', $3, $4)`,
        [userId, amount, method, reference]
      );

      // Deduct balance immediately
      await query(
        `UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2`,
        [amount, userId]
      );

      // Process based on method
      if (method === 'mpesa') {
        await this.sendMpesaWithdrawal(destination, amount, reference);
      } else if (method === 'paystack') {
        await this.sendPaystackWithdrawal(destination, amount, reference);
      }

      logger.info(`Withdrawal initiated for user ${userId}, reference: ${reference}`);

      return reference;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Withdrawal error:', err);
      throw new AppError('WITHDRAWAL_FAILED', 'Failed to process withdrawal');
    }
  }

  private async getMpesaAccessToken(): Promise<string> {
    try {
      const cached = await getCache<{ token: string }>('mpesa_access_token');
      if (cached) {
        return cached.token;
      }

      const auth = Buffer.from(
        `${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`
      ).toString('base64');

      const response = await axios.get(
        'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      const token = response.data.access_token;

      // Cache for 55 minutes (expires in 60)
      await setCache('mpesa_access_token', { token }, 3300);

      return token;
    } catch (err) {
      logger.error('M-Pesa token error:', err);
      throw new AppError('MPESA_TOKEN_ERROR', 'Failed to get M-Pesa access token');
    }
  }

  private async sendMpesaWithdrawal(phoneNumber: string, amount: number, reference: string): Promise<void> {
    try {
      const accessToken = await this.getMpesaAccessToken();

      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${config.MPESA_SHORTCODE}${config.MPESA_CONSUMER_SECRET}${timestamp}`
      ).toString('base64');

      await axios.post(
        'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
        {
          OriginatorConversationID: reference,
          InitiatorName: 'X-SPIN',
          SecurityCredential: password,
          CommandID: 'BusinessPayment',
          Amount: Math.floor(amount),
          PartyA: config.MPESA_SHORTCODE,
          PartyB: phoneNumber,
          Remarks: 'X-SPIN Withdrawal',
          QueueTimeOutURL: `${config.MPESA_CALLBACK_URL}/timeout`,
          ResultURL: `${config.MPESA_CALLBACK_URL}/result`,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      logger.info(`M-Pesa withdrawal sent: ${reference}`);
    } catch (err) {
      logger.error('M-Pesa withdrawal error:', err);
    }
  }

  private async sendPaystackWithdrawal(
    accountNumber: string,
    amount: number,
    reference: string
  ): Promise<void> {
    try {
      // This would require to be implemented with bank details
      logger.info(`Paystack withdrawal initiated: ${reference}`);
    } catch (err) {
      logger.error('Paystack withdrawal error:', err);
    }
  }
}

export const paymentService = new PaymentService();
