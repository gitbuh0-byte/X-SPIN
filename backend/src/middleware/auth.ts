import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.js';
import { AppError, JWTPayload } from '../types/index.js';
import { logger } from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction) {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('MISSING_TOKEN', 'Missing authorization token', 401);
    }

    const token = authHeader.substring(7);
    const payload = await authService.verifyToken(token);

    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.status).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }

    res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Authentication failed' },
    });
  }
}

export function rateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  const store = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(key, record);
    } else {
      record.count++;

      if (record.count > maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          },
        });
      }
    }

    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', (maxRequests - record.count).toString());

    next();
  };
}
