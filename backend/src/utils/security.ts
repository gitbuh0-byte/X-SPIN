import crypto from 'crypto';
import { config } from '../config.js';
import { logger } from './logger.js';

/**
 * Verify webhook signatures from payment providers
 */
export class WebhookVerifier {
  /**
   * Verify M-Pesa callback signature
   */
  static verifyMpesaSignature(data: string, signature: string, secret: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const computed = hmac.update(data).digest('hex');
      return computed === signature;
    } catch (err) {
      logger.error('M-Pesa signature verification error:', err);
      return false;
    }
  }

  /**
   * Verify Paystack signature
   */
  static verifyPaystackSignature(payload: string, signature: string): boolean {
    try {
      const hmac = crypto.createHmac('sha512', config.PAYSTACK_SECRET_KEY);
      const computed = hmac.update(payload).digest('hex');
      return computed === signature;
    } catch (err) {
      logger.error('Paystack signature verification error:', err);
      return false;
    }
  }
}

/**
 * Generate idempotency keys for payment operations
 */
export class IdempotencyManager {
  private store = new Map<string, unknown>();

  generateKey(userId: string, operation: string, amount: number): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}-${operation}-${amount}`)
      .digest('hex');
  }

  isIdempotent(key: string): boolean {
    return this.store.has(key);
  }

  store_operation(key: string, result: unknown): void {
    this.store.set(key, result);
  }

  getResult(key: string): unknown {
    return this.store.get(key);
  }
}

/**
 * Encryption utilities for sensitive data
 */
export class EncryptionUtils {
  static encryptAES(data: string, key: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (err) {
      logger.error('Encryption error:', err);
      throw err;
    }
  }

  static decryptAES(encrypted: string, key: string): string {
    try {
      const [iv, authTag, encrypted_text] = encrypted.split(':');

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(key),
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted_text, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err) {
      logger.error('Decryption error:', err);
      throw err;
    }
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static isValidPhoneNumber(phone: string, country: string = 'KE'): boolean {
    if (country === 'KE') {
      // Kenya phone number validation
      return /^(?:\+254|0)(?:7[0-9]|1[01])[0-9]{6}$/.test(phone);
    }
    return true;
  }

  static isValidAmount(amount: number, min: number = 1, max: number = 1000000): boolean {
    return amount >= min && amount <= max && Number.isInteger(amount * 100); // Check for 2 decimal places
  }

  static sanitizeInput(input: string, maxLength: number = 255): string {
    return input.trim().substring(0, maxLength);
  }
}

export const webhookVerifier = new WebhookVerifier();
export const idempotencyManager = new IdempotencyManager();
export const validationUtils = new ValidationUtils();
