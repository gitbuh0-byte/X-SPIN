import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db.js';
import { logger } from '../utils/logger.js';
import { AppError, User } from '../types/index.js';

export class UserService {
  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
      return result.rows.length > 0 ? (result.rows[0] as User) : null;
    } catch (err) {
      logger.error('Failed to get user:', err);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows.length > 0 ? (result.rows[0] as User) : null;
    } catch (err) {
      logger.error('Failed to get user by email:', err);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows.length > 0 ? (result.rows[0] as User) : null;
    } catch (err) {
      logger.error('Failed to get user by username:', err);
      return null;
    }
  }

  async updateUserBalance(userId: string, amount: number): Promise<User> {
    try {
      const result = await query(
        `UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2
         RETURNING *`,
        [amount, userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      return result.rows[0] as User;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to update balance:', err);
      throw new AppError('UPDATE_BALANCE_FAILED', 'Failed to update balance');
    }
  }

  async updateUserStats(
    userId: string,
    wagered: number,
    won: number
  ): Promise<void> {
    try {
      await query(
        `UPDATE users SET 
         total_wagered = total_wagered + $1,
         total_won = total_won + $2,
         updated_at = NOW()
         WHERE id = $3`,
        [wagered, won, userId]
      );

      logger.info(`User stats updated: ${userId}, wagered: ${wagered}, won: ${won}`);
    } catch (err) {
      logger.error('Failed to update user stats:', err);
    }
  }

  async verifyUser(userId: string): Promise<void> {
    try {
      await query(
        `UPDATE users SET verification_status = 'verified', updated_at = NOW() WHERE id = $1`,
        [userId]
      );

      logger.info(`User verified: ${userId}`);
    } catch (err) {
      logger.error('Failed to verify user:', err);
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      await query(
        `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [userId]
      );

      logger.info(`User deactivated: ${userId}`);
    } catch (err) {
      logger.error('Failed to deactivate user:', err);
    }
  }

  async getLeaderboard(limit: number = 100): Promise<User[]> {
    try {
      const result = await query(
        `SELECT id, username, total_won, total_wagered, created_at 
         FROM users 
         ORDER BY total_won DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows as User[];
    } catch (err) {
      logger.error('Failed to get leaderboard:', err);
      return [];
    }
  }

  async searchUsers(query_text: string, limit: number = 10): Promise<User[]> {
    try {
      const result = await query(
        `SELECT id, username, email, balance
         FROM users 
         WHERE username ILIKE $1 OR email ILIKE $1
         LIMIT $2`,
        [`%${query_text}%`, limit]
      );

      return result.rows as User[];
    } catch (err) {
      logger.error('Failed to search users:', err);
      return [];
    }
  }
}

export const userService = new UserService();
