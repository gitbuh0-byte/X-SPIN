import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db.js';
import { getRedis, setCache, getCache, deleteCache } from '../utils/redis.js';
import {
  Tournament,
  TournamentStatus,
  BracketData,
  BracketGroup,
  AppError,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { gameService } from './game.js';

export class TournamentService {
  async createTournament(entryFee: number, maxPlayers: number = 100): Promise<Tournament> {
    try {
      const tournamentId = uuidv4();

      const result = await query(
        `INSERT INTO tournaments (id, status, entry_fee, max_players, current_players, bracket_data)
         VALUES ($1, 'registration', $2, $3, 0, $4)
         RETURNING *`,
        [
          tournamentId,
          entryFee,
          maxPlayers,
          JSON.stringify({
            round: 0,
            groups: [],
            completed_rounds: [],
          }),
        ]
      );

      const tournament = result.rows[0] as Tournament;

      // Cache in Redis
      await setCache(`tournament:${tournamentId}`, tournament);

      logger.info(`Tournament created: ${tournamentId}`);

      return tournament;
    } catch (err) {
      logger.error('Failed to create tournament:', err);
      throw new AppError('TOURNAMENT_CREATION_FAILED', 'Failed to create tournament');
    }
  }

  async joinTournament(tournamentId: string, userId: string): Promise<Tournament> {
    try {
      // Get tournament
      let tournament = await getCache<Tournament>(`tournament:${tournamentId}`);

      if (!tournament) {
        const result = await query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
        if (result.rows.length === 0) {
          throw new AppError('TOURNAMENT_NOT_FOUND', 'Tournament not found', 404);
        }
        tournament = result.rows[0] as Tournament;
      }

      // Check if still in registration
      if (tournament.status !== 'registration') {
        throw new AppError(
          'TOURNAMENT_NOT_REGISTERING',
          'Tournament registration is closed',
          400
        );
      }

      // Check capacity
      if (tournament.current_players >= tournament.max_players) {
        throw new AppError('TOURNAMENT_FULL', 'Tournament is full', 400);
      }

      // Check user balance
      const userRes = await query('SELECT balance FROM users WHERE id = $1', [userId]);

      if (userRes.rows.length === 0) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      }

      if (userRes.rows[0].balance < tournament.entry_fee) {
        throw new AppError('INSUFFICIENT_BALANCE', 'Insufficient balance', 400);
      }

      // Register player
      await query(
        `INSERT INTO tournament_players (tournament_id, player_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [tournamentId, userId]
      );

      // Hold escrow
      await query(
        `INSERT INTO escrow (user_id, entity_type, entity_id, amount, status)
         VALUES ($1, 'tournament', $2, $3, 'locked')`,
        [userId, tournamentId, tournament.entry_fee]
      );

      // Deduct balance
      await query(`UPDATE users SET balance = balance - $1 WHERE id = $2`, [
        tournament.entry_fee,
        userId,
      ]);

      // Update tournament
      const newCurrentPlayers = tournament.current_players + 1;
      const newTotalPot = tournament.total_pot + tournament.entry_fee;

      await query(
        `UPDATE tournaments SET current_players = $1, total_pot = $2 WHERE id = $3`,
        [newCurrentPlayers, newTotalPot, tournamentId]
      );

      const updatedTournament: Tournament = {
        ...tournament,
        current_players: newCurrentPlayers,
        total_pot: newTotalPot,
      };

      await setCache(`tournament:${tournamentId}`, updatedTournament);

      logger.info(`Player ${userId} joined tournament ${tournamentId}`);

      return updatedTournament;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to join tournament:', err);
      throw new AppError('JOIN_TOURNAMENT_FAILED', 'Failed to join tournament');
    }
  }

  async startTournament(tournamentId: string): Promise<Tournament> {
    try {
      // Get all registered players
      const playersRes = await query(
        `SELECT player_id FROM tournament_players WHERE tournament_id = $1 ORDER BY joined_at`,
        [tournamentId]
      );

      const players = playersRes.rows.map((r: Record<string, unknown>) => r.player_id as string);

      if (players.length < 4) {
        throw new AppError(
          'INSUFFICIENT_PLAYERS',
          'Minimum 4 players required to start tournament',
          400
        );
      }

      // Create Round 1 groups (20 groups of 5)
      const bracket = this.generateBracket(players);

      // Update tournament
      const result = await query(
        `UPDATE tournaments SET status = 'in_progress', current_round = 1, bracket_data = $1, started_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(bracket), tournamentId]
      );

      const tournament = result.rows[0] as Tournament;

      await setCache(`tournament:${tournamentId}`, tournament);

      // Create games for Round 1 groups
      for (const group of bracket.groups) {
        const game = await gameService.createGame('tournament', 0, group.players.length);

        group.game_id = game.id;

        for (const playerId of group.players) {
          await query(
            `INSERT INTO game_players (game_id, player_id) VALUES ($1, $2)`,
            [game.id, playerId]
          );
        }
      }

      // Update tournament with game IDs
      await query(
        `UPDATE tournaments SET bracket_data = $1 WHERE id = $2`,
        [JSON.stringify(bracket), tournamentId]
      );

      logger.info(`Tournament started: ${tournamentId} with ${players.length} players`);

      return tournament;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to start tournament:', err);
      throw new AppError('TOURNAMENT_START_FAILED', 'Failed to start tournament');
    }
  }

  async advanceRound(tournamentId: string): Promise<Tournament> {
    try {
      // Get tournament
      let tournament = await getCache<Tournament>(`tournament:${tournamentId}`);

      if (!tournament) {
        const result = await query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
        if (result.rows.length === 0) {
          throw new AppError('TOURNAMENT_NOT_FOUND', 'Tournament not found', 404);
        }
        tournament = result.rows[0] as Tournament;
      }

      const bracket = tournament.bracket_data;

      // Find winners from current round
      const winners: string[] = [];

      for (const group of bracket.groups) {
        if (group.winner_id) {
          winners.push(group.winner_id);
        }
      }

      if (winners.length === 0) {
        throw new AppError('NO_WINNERS', 'No winners recorded for current round', 400);
      }

      // Check if tournament is complete (only 1 winner)
      if (winners.length === 1) {
        await this.completeTournament(tournamentId, winners[0]);
        
        // Fetch and return the completed tournament
        const result = await query(
          `SELECT * FROM tournaments WHERE id = $1`,
          [tournamentId]
        );
        
        if (!result.rows[0]) {
          throw new AppError('TOURNAMENT_NOT_FOUND', 'Tournament not found', 404);
        }
        
        return result.rows[0] as Tournament;
      }

      // Create new bracket for next round
      const newBracket: BracketData = {
        round: bracket.round + 1,
        groups: this.generateBracketGroups(winners),
        completed_rounds: [
          ...bracket.completed_rounds,
          {
            round: bracket.round,
            winners,
            timestamp: new Date(),
          },
        ],
      };

      // Create games for new round
      for (const group of newBracket.groups) {
        const game = await gameService.createGame('tournament', 0, group.players.length);
        group.game_id = game.id;

        for (const playerId of group.players) {
          await query(
            `INSERT INTO game_players (game_id, player_id) VALUES ($1, $2)`,
            [game.id, playerId]
          );
        }
      }

      // Update tournament
      const result = await query(
        `UPDATE tournaments SET current_round = $1, bracket_data = $2 WHERE id = $3
         RETURNING *`,
        [bracket.round + 1, JSON.stringify(newBracket), tournamentId]
      );

      const updatedTournament = result.rows[0] as Tournament;

      await setCache(`tournament:${tournamentId}`, updatedTournament);

      logger.info(
        `Tournament round advanced: ${tournamentId}, new round: ${bracket.round + 1}, winners: ${winners.length}`
      );

      return updatedTournament;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to advance round:', err);
      throw new AppError('ROUND_ADVANCE_FAILED', 'Failed to advance round');
    }
  }

  async completeTournament(tournamentId: string, winnerId: string): Promise<void> {
    try {
      // Get tournament
      const tournamentRes = await query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);

      if (tournamentRes.rows.length === 0) {
        throw new AppError('TOURNAMENT_NOT_FOUND', 'Tournament not found', 404);
      }

      const tournament = tournamentRes.rows[0] as Tournament;

      // Award winner with entire pot
      await query(`UPDATE users SET balance = balance + $1, total_won = total_won + $2 WHERE id = $3`, [
        tournament.total_pot,
        tournament.total_pot,
        winnerId,
      ]);

      // Create payout transaction
      await query(
        `INSERT INTO transactions (user_id, type, amount, status, payment_method, reference)
         VALUES ($1, 'tournament_payout', $2, 'completed', 'wallet', $3)`,
        [winnerId, tournament.total_pot, uuidv4()]
      );

      // Release all escrows as released (not refunded)
      await query(
        `UPDATE escrow SET status = 'released', released_at = NOW()
         WHERE entity_id = $1 AND entity_type = 'tournament'`,
        [tournamentId]
      );

      // Mark tournament as completed
      await query(
        `UPDATE tournaments SET status = 'completed', winner_id = $1, ended_at = NOW() WHERE id = $2`,
        [winnerId, tournamentId]
      );

      await deleteCache(`tournament:${tournamentId}`);

      logger.info(`Tournament completed: ${tournamentId}, winner: ${winnerId}, pot: ${tournament.total_pot}`);
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Failed to complete tournament:', err);
      throw new AppError('TOURNAMENT_COMPLETION_FAILED', 'Failed to complete tournament');
    }
  }

  private generateBracket(players: string[]): BracketData {
    // Shuffle players
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Create groups of 5 (or remaining)
    const groups: BracketGroup[] = [];
    const groupSize = 5;

    for (let i = 0; i < shuffled.length; i += groupSize) {
      groups.push({
        id: uuidv4(),
        players: shuffled.slice(i, i + groupSize),
      });
    }

    return {
      round: 1,
      groups,
      completed_rounds: [],
    };
  }

  private generateBracketGroups(players: string[]): BracketGroup[] {
    // Shuffle for fairness
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    const groups: BracketGroup[] = [];
    const groupSize = Math.ceil(shuffled.length / 4); // Divide into 4 groups

    for (let i = 0; i < shuffled.length; i += groupSize) {
      groups.push({
        id: uuidv4(),
        players: shuffled.slice(i, i + groupSize),
      });
    }

    return groups;
  }

  async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      let tournament = await getCache<Tournament>(`tournament:${tournamentId}`);

      if (!tournament) {
        const result = await query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
        if (result.rows.length > 0) {
          tournament = result.rows[0] as Tournament;
        }
      }

      return tournament || null;
    } catch (err) {
      logger.error('Failed to get tournament:', err);
      return null;
    }
  }
}

export const tournamentService = new TournamentService();
