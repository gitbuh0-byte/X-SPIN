import { Router, Request, Response } from 'express';
import { query } from '../database/db.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../types/index.js';

const adminRouter = Router();

// Middleware: Check if user is admin
adminRouter.use(authenticate);
adminRouter.use(async (req: Request, res: Response, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }
  next();
});

// Get dashboard stats
adminRouter.get('/stats', async (req: Request, res: Response, next) => {
  try {
    const userCountRes = await query('SELECT COUNT(*) as count FROM users');
    const activeGamesRes = await query(
      "SELECT COUNT(*) as count FROM games WHERE status != 'completed'"
    );
    const totalPotsRes = await query(
      "SELECT SUM(pot) as total FROM games WHERE status = 'completed'"
    );
    const transactionsRes = await query(
      "SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type IN ('deposit', 'withdrawal')"
    );

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(userCountRes.rows[0].count),
        activeGames: parseInt(activeGamesRes.rows[0].count),
        totalPot: totalPotsRes.rows[0].total || 0,
        transactionCount: parseInt(transactionsRes.rows[0].count),
        transactionTotal: transactionsRes.rows[0].total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get all users
adminRouter.get('/users', async (req: Request, res: Response, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT id, email, username, balance, total_wagered, total_won, 
              verification_status, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: { users: result.rows },
    });
  } catch (err) {
    next(err);
  }
});

// Deactivate user
adminRouter.post('/users/:userId/deactivate', async (req: Request, res: Response, next) => {
  try {
    const { userId } = req.params;

    await query('UPDATE users SET is_active = false WHERE id = $1', [userId]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Verify user
adminRouter.post('/users/:userId/verify', async (req: Request, res: Response, next) => {
  try {
    const { userId } = req.params;

    await query(
      "UPDATE users SET verification_status = 'verified' WHERE id = $1",
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Manual balance adjustment (for disputes)
adminRouter.post('/users/:userId/balance-adjust', async (req: Request, res: Response, next) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      throw new AppError('MISSING_FIELDS', 'Amount and reason required', 400);
    }

    await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);

    // Log the adjustment
    await query(
      `INSERT INTO transactions (user_id, type, amount, status, payment_method, reference)
       VALUES ($1, 'admin_adjustment', $2, 'completed', 'manual', $3)`,
      [userId, amount, reason]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get all transactions
adminRouter.get('/transactions', async (req: Request, res: Response, next) => {
  try {
    const { limit = 50, offset = 0, status, type } = req.query;

    let whereClause = '';
    const params: unknown[] = [];

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (type) {
      whereClause += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT * FROM transactions 
       WHERE 1=1 ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: { transactions: result.rows },
    });
  } catch (err) {
    next(err);
  }
});

// Get all escrow
adminRouter.get('/escrow', async (req: Request, res: Response, next) => {
  try {
    const result = await query(
      `SELECT * FROM escrow 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: { escrow: result.rows },
    });
  } catch (err) {
    next(err);
  }
});

// Cancel game and refund
adminRouter.post('/games/:gameId/cancel', async (req: Request, res: Response, next) => {
  try {
    const { gameId } = req.params;

    // Refund all players
    const playersRes = await query(
      `SELECT player_id FROM game_players WHERE game_id = $1`,
      [gameId]
    );

    const gameRes = await query(`SELECT entry_fee FROM games WHERE id = $1`, [gameId]);

    if (gameRes.rows.length === 0) {
      throw new AppError('GAME_NOT_FOUND', 'Game not found', 404);
    }

    const entryFee = gameRes.rows[0].entry_fee;

    for (const row of playersRes.rows) {
      const playerId = (row as Record<string, unknown>).player_id;

      await query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [entryFee, playerId]);
    }

    await query(`UPDATE games SET status = 'cancelled' WHERE id = $1`, [gameId]);

    res.json({ success: true, refunded: playersRes.rows.length });
  } catch (err) {
    next(err);
  }
});

export default adminRouter;
