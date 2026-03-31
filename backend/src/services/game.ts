import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db.js';
import { getRedis, setCache, getCache, deleteCache } from '../utils/redis.js';
import { Game, GameType, GameStatus, SpinRecord, AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class GameService {
  async createGame(type: GameType, entryFee: number, maxPlayers: number = 5): Promise<Game> {
    try {
      const gameId = uuidv4();

      const result = await query(
        `INSERT INTO games (id, type, status, entry_fee, max_players)
         VALUES ($1, $2, 'waiting', $3, $4)
         RETURNING *`,
        [gameId, type, entryFee, maxPlayers]
      );

      const game = result.rows[0] as Game;

      // Cache game state in Redis
      await setCache(`game:${gameId}`, {
        ...game,
        players: [],
        status: 'waiting',
      });

      logger.info(`Game created: ${gameId}, type: ${type}`);

      return game;
    } catch (err) {
      logger.error('Failed to create game:', err);
      throw new AppError('GAME_CREATION_FAILED', 'Failed to create game');
    }
  }

  async joinGame(gameId: string, userId: string): Promise<Game> {
    try {
      // Get game from cache or DB
      let game = await getCache<Game>(`game:${gameId}`);

      if (!game) {
        const result = await query('SELECT * FROM games WHERE id = $1', [gameId]);
        if (result.rows.length === 0) {
          throw new AppError('GAME_NOT_FOUND', 'Game not found', 404);
        }
        game = result.rows[0] as Game;
      }

      // Check if game is still in waiting state
      if (game.status !== 'waiting') {
        throw new AppError('GAME_NOT_WAITING', 'Game is no longer accepting players', 400);
      }

      // Check max players
      const playerCountResult = await query(
        'SELECT COUNT(*) as count FROM game_players WHERE game_id = $1',
        [gameId]
      );

      const currentCount = parseInt(playerCountResult.rows[0].count);

      if (currentCount >= game.max_players) {
        throw new AppError('GAME_FULL', 'Game is full', 400);
      }

      // Add player to game
      await query(
        `INSERT INTO game_players (game_id, player_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [gameId, userId]
      );

      // Hold escrow
      const userRes = await query('SELECT balance FROM users WHERE id = $1', [userId]);

      if (userRes.rows.length === 0) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      if (userRes.rows[0].balance < game.entry_fee) {
        throw new AppError('INSUFFICIENT_BALANCE', 'Insufficient balance to join game', 400);
      }

      // Create escrow hold
      await query(
        `INSERT INTO escrow (user_id, entity_type, entity_id, amount, status)
         VALUES ($1, 'game', $2, $3, 'locked')`,
        [userId, gameId, game.entry_fee]
      );

      // Deduct from balance
      await query(`UPDATE users SET balance = balance - $1 WHERE id = $2`, [game.entry_fee, userId]);

      // Update pot
      const newPot = game.pot + game.entry_fee;

      await query(`UPDATE games SET pot = $1 WHERE id = $2`, [newPot, gameId]);

      // Update cache
      const playersResult = await query('SELECT player_id FROM game_players WHERE game_id = $1', [gameId]);
      const players = playersResult.rows.map((r: Record<string, unknown>) => r.player_id as string);

      const updatedGame: Game = {
        ...game,
        pot: newPot,
        players,
      };

      await setCache(`game:${gameId}`, updatedGame);

      logger.info(`Player ${userId} joined game ${gameId}`);

      return updatedGame;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to join game:', err);
      throw new AppError('JOIN_GAME_FAILED', 'Failed to join game');
    }
  }

  async startGame(gameId: string): Promise<Game> {
    try {
      const result = await query(
        `UPDATE games SET status = 'spinning', started_at = NOW() WHERE id = $1
         RETURNING *`,
        [gameId]
      );

      if (result.rows.length === 0) {
        throw new AppError('GAME_NOT_FOUND', 'Game not found', 404);
      }

      const game = result.rows[0] as Game;

      await setCache(`game:${gameId}`, game);

      logger.info(`Game started: ${gameId}`);

      return game;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to start game:', err);
      throw new AppError('GAME_START_FAILED', 'Failed to start game');
    }
  }

  async completeGame(
    gameId: string,
    winnerId: string,
    winnings: number,
    roundData: Record<string, unknown>
  ): Promise<Game> {
    try {
      // Update game
      const result = await query(
        `UPDATE games SET status = 'completed', winner_id = $1, ended_at = NOW(), round_data = $2
         WHERE id = $3
         RETURNING *`,
        [winnerId, JSON.stringify(roundData), gameId]
      );

      if (result.rows.length === 0) {
        throw new AppError('GAME_NOT_FOUND', 'Game not found', 404);
      }

      const game = result.rows[0] as Game;

      // Release escrow and award winnings
      // Get all players who were in this game
      const playersResult = await query(
        `SELECT player_id FROM game_players WHERE game_id = $1`,
        [gameId]
      );

      for (const row of playersResult.rows) {
        const playerId = (row as Record<string, unknown>).player_id as string;

        if (playerId === winnerId) {
          // Winner: release escrow and add winnings
          await query(
            `UPDATE users SET balance = balance + $1, total_won = total_won + $2 WHERE id = $3`,
            [winnings, winnings, winnerId]
          );

          // Create win transaction
          await query(
            `INSERT INTO transactions (user_id, type, amount, status, payment_method, reference)
             VALUES ($1, 'game_win', $2, 'completed', 'wallet', $3)`,
            [winnerId, winnings, uuidv4()]
          );
        } else {
          // Loser: just release escrow (already deducted)
        }

        // Release escrow
        await query(
          `UPDATE escrow SET status = 'released', released_at = NOW()
           WHERE user_id = $1 AND entity_id = $2 AND status = 'locked'`,
          [playerId, gameId]
        );
      }

      // Update user stats
      await query(
        `UPDATE users SET total_wagered = total_wagered + $1 WHERE id = $2`,
        [game.pot, winnerId]
      );

      await deleteCache(`game:${gameId}`);

      logger.info(`Game completed: ${gameId}, winner: ${winnerId}, winnings: ${winnings}`);

      return game;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to complete game:', err);
      throw new AppError('GAME_COMPLETION_FAILED', 'Failed to complete game');
    }
  }

  async getGame(gameId: string): Promise<Game | null> {
    try {
      // Try cache first
      let game = await getCache<Game>(`game:${gameId}`);

      if (!game) {
        const result = await query('SELECT * FROM games WHERE id = $1', [gameId]);
        if (result.rows.length > 0) {
          game = result.rows[0] as Game;
        }
      }

      return game || null;
    } catch (err) {
      logger.error('Failed to get game:', err);
      return null;
    }
  }

  async cancelGame(gameId: string): Promise<void> {
    try {
      // Refund all players
      const playersResult = await query(
        `SELECT player_id FROM game_players WHERE game_id = $1`,
        [gameId]
      );

      const gameRes = await query(
        `SELECT entry_fee FROM games WHERE id = $1`,
        [gameId]
      );

      const entryFee = gameRes.rows[0].entry_fee;

      for (const row of playersResult.rows) {
        const playerId = (row as Record<string, unknown>).player_id as string;

        // Refund balance
        await query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [entryFee, playerId]);

        // Refund escrow
        await query(
          `UPDATE escrow SET status = 'refunded', released_at = NOW()
           WHERE user_id = $1 AND entity_id = $2 AND status = 'locked'`,
          [playerId, gameId]
        );
      }

      // Mark game as cancelled
      await query(
        `UPDATE games SET status = 'cancelled', ended_at = NOW() WHERE id = $1`,
        [gameId]
      );

      await deleteCache(`game:${gameId}`);

      logger.info(`Game cancelled: ${gameId}`);
    } catch (err) {
      logger.error('Failed to cancel game:', err);
      throw new AppError('GAME_CANCELLATION_FAILED', 'Failed to cancel game');
    }
  }
}

export const gameService = new GameService();
