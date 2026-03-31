import { Router, Request, Response } from 'express';
import { query } from '../database/db.js';
import { authenticate } from '../middleware/auth.js';

const userRouter = Router();

userRouter.use(authenticate);

// Get user profile
userRouter.get('/me', async (req: Request, res: Response, next) => {
  try {
    const userId = req.user!.user_id;

    const result = await query(
      `SELECT id, email, username, balance, total_wagered, total_won, 
              verification_status, role, is_active, created_at FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' } });
    }

    res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (err) {
    next(err);
  }
});

// Get user balance
userRouter.get('/balance', async (req: Request, res: Response, next) => {
  try {
    const userId = req.user!.user_id;

    const result = await query('SELECT balance FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' } });
    }

    res.json({
      success: true,
      data: { balance: result.rows[0].balance },
    });
  } catch (err) {
    next(err);
  }
});

// Get transaction history
userRouter.get('/transactions', async (req: Request, res: Response, next) => {
  try {
    const userId = req.user!.user_id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT * FROM transactions WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: { transactions: result.rows },
    });
  } catch (err) {
    next(err);
  }
});

// Get user game history
userRouter.get('/game-history', async (req: Request, res: Response, next) => {
  try {
    const userId = req.user!.user_id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT g.* FROM games g
       JOIN game_players gp ON g.id = gp.game_id
       WHERE gp.player_id = $1
       ORDER BY g.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: { games: result.rows },
    });
  } catch (err) {
    next(err);
  }
});

export default userRouter;
