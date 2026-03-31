import axios from 'axios';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/index.js';
import { setCache, getCache } from '../utils/redis.js';

export class AirtelMoneyService {
  private readonly baseURL = 'https://openapi.airtel.africa/merchant/v1/payments/';

  async getAccessToken(): Promise<string> {
    try {
      const cached = await getCache<{ token: string }>('airtel_access_token');
      if (cached) {
        return cached.token;
      }

      const response = await axios.post(
        `${this.baseURL}oauth2/token`,
        {
          client_id: config.AIRTEL_CLIENT_ID,
          client_secret: config.AIRTEL_CLIENT_SECRET,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const token = response.data.access_token;
      // Cache for 55 minutes
      await setCache('airtel_access_token', { token }, 3300);

      return token;
    } catch (err) {
      logger.error('Airtel access token error:', err);
      throw new AppError('AIRTEL_TOKEN_ERROR', 'Failed to get Airtel access token');
    }
  }

  async initiateDeposit(phoneNumber: string, amount: number, reference: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      const payload = {
        reference,
        subscriber: {
          country_code: 'KE',
          msisdn: phoneNumber,
        },
        transaction: {
          amount,
          currency: 'KES',
          id: reference,
        },
      };

      await axios.post(`${this.baseURL}disburse`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Country': 'KE',
          'X-Signed': 'false',
        },
      });

      logger.info(`Airtel Money deposit initiated: ${reference}`);
    } catch (err) {
      logger.error('Airtel deposit initiation error:', err);
      throw new AppError('AIRTEL_DEPOSIT_FAILED', 'Failed to initiate Airtel deposit');
    }
  }

  async handleCallback(callbackData: Record<string, unknown>): Promise<void> {
    try {
      const { id, status, amount } = callbackData;

      if (status === 'TS') {
        // Transaction successful
        logger.info(`Airtel deposit successful: ${id}, amount: ${amount}`);
        // Update transaction status
      }
    } catch (err) {
      logger.error('Airtel callback error:', err);
    }
  }
}

export const airtelMoneyService = new AirtelMoneyService();
