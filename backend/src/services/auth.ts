import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { query } from '../database/db.js';
import { User, JWTPayload, AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  async register(
    email: string,
    password: string,
    username: string,
    authProvider: string = 'email'
  ): Promise<User> {
    try {
      // Check if user exists
      const existingRes = await query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingRes.rows.length > 0) {
        throw new AppError('USER_EXISTS', 'Email or username already in use', 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const result = await query(
        `INSERT INTO users (email, username, password_hash, auth_provider)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, username, balance, role, created_at, updated_at`,
        [email, username, passwordHash, authProvider]
      );

      logger.info(`User registered: ${email}`);
      return result.rows[0] as User;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Registration error:', err);
      throw new AppError('REGISTRATION_FAILED', 'Failed to register user');
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      const user = result.rows[0] as User;

      if (!user.password_hash) {
        throw new AppError('NO_PASSWORD', 'User registered with OAuth provider', 401);
      }

      const passwordValid = await bcrypt.compare(password, user.password_hash);

      if (!passwordValid) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      if (!user.is_active) {
        throw new AppError('USER_INACTIVE', 'User account is inactive', 403);
      }

      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info(`User logged in: ${email}`);

      return { user, token, refreshToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Login error:', err);
      throw new AppError('LOGIN_FAILED', 'Login failed');
    }
  }

  async loginOAuth(
    email: string,
    username: string,
    authProvider: string,
    profile?: Record<string, unknown>
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      // Check if user exists
      let userRes = await query('SELECT * FROM users WHERE email = $1', [email]);

      let user: User;

      if (userRes.rows.length === 0) {
        // Create new user
        const newUserRes = await query(
          `INSERT INTO users (email, username, auth_provider)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [email, username, authProvider]
        );
        user = newUserRes.rows[0] as User;
        logger.info(`New OAuth user created: ${email}`);
      } else {
        user = userRes.rows[0] as User;
      }

      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return { user, token, refreshToken };
    } catch (err) {
      logger.error('OAuth login error:', err);
      throw new AppError('OAUTH_LOGIN_FAILED', 'OAuth login failed');
    }
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    } catch (err) {
      throw new AppError('INVALID_TOKEN', 'Invalid or expired token', 401);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = jwt.verify(refreshToken, config.JWT_SECRET) as JWTPayload;

      // Verify user still exists and is active
      const result = await query('SELECT * FROM users WHERE id = $1 AND is_active = true', [
        payload.user_id,
      ]);

      if (result.rows.length === 0) {
        throw new AppError('USER_INACTIVE', 'User is not active', 403);
      }

      const user = result.rows[0] as User;
      return this.generateToken(user);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        role: user.role,
      } as Record<string, unknown>,
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_EXPIRATION } as SignOptions
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        user_id: user.id,
        email: user.email,
      } as Record<string, unknown>,
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_REFRESH_EXPIRATION } as SignOptions
    );
  }
}

export const authService = new AuthService();
