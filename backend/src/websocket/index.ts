import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from 'socket.io-redis';
import { getRedis } from '../utils/redis.js';
import { authService } from '../services/auth.js';
import { gameService } from '../services/game.js';
import { tournamentService } from '../services/tournament.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/index.js';

export async function setupWebSocket(io: SocketIOServer) {
  // Redis adapter for horizontal scaling
  const redisClient = await getRedis();
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient as any, subClient as any));

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new AppError('MISSING_TOKEN', 'Missing authentication token', 401));
      }

      const payload = await authService.verifyToken(token);
      socket.data.user = payload;

      next();
    } catch (err) {
      logger.error('Socket authentication failed:', err);
      next(new AppError('AUTH_FAILED', 'Authentication failed', 401));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.user_id;
    logger.info(`User connected: ${userId}`);

    // Matchmaking events
    socket.on('join_matchmaking', async (payload) => {
      try {
        const { gameType, entryFee } = payload;

        // Create or join existing game
        const game = await gameService.createGame(gameType, entryFee);
        await gameService.joinGame(game.id, userId);

        // Add to matchmaking room
        socket.join(`matchmaking:${gameType}`);
        socket.emit('matchmaking_joined', { gameId: game.id });

        // Broadcast to others in matchmaking queue
        socket.to(`matchmaking:${gameType}`).emit('player_joined_matchmaking', {
          roomCode: game.id,
        });
      } catch (err) {
        logger.error('Matchmaking join error:', err);
        socket.emit('error', {
          code: 'MATCHMAKING_ERROR',
          message: 'Failed to join matchmaking',
        });
      }
    });

    socket.on('cancel_matchmaking', async (payload) => {
      try {
        const { gameType } = payload;
        socket.leave(`matchmaking:${gameType}`);
      } catch (err) {
        logger.error('Cancel matchmaking error:', err);
      }
    });

    // Game events
    socket.on('ready_for_spin', async (payload) => {
      try {
        const { gameId } = payload;

        // Join game room
        socket.join(`game:${gameId}`);

        // Notify other players
        socket.to(`game:${gameId}`).emit('player_ready', { playerId: userId });

        // Check if all players ready
        const game = await gameService.getGame(gameId);

        if (game && game.players.length > 0) {
          // Could check if all ready and start spin
          io.to(`game:${gameId}`).emit('game_locked', {
            gameId,
            playersReady: game.players.length,
          });
        }
      } catch (err) {
        logger.error('Ready for spin error:', err);
        socket.emit('error', {
          code: 'GAME_ERROR',
          message: 'Failed to ready for spin',
        });
      }
    });

    socket.on('spin_complete', async (payload) => {
      try {
        const { gameId, winnings } = payload;

        // This would be handled by backend spin logic
        io.to(`game:${gameId}`).emit('spin_end', {
          gameId,
          winner: userId,
          winnings,
        });
      } catch (err) {
        logger.error('Spin complete error:', err);
      }
    });

    // Tournament events
    socket.on('tournament:join', async (payload) => {
      try {
        const { tournamentId } = payload;

        const tournament = await tournamentService.joinTournament(tournamentId, userId);

        socket.join(`tournament:${tournamentId}`);

        socket.emit('tournament:joined', {
          tournamentId,
          currentPlayers: tournament.current_players,
          maxPlayers: tournament.max_players,
        });

        // Broadcast to all in tournament
        socket.to(`tournament:${tournamentId}`).emit('tournament:player_joined', {
          currentPlayers: tournament.current_players,
          maxPlayers: tournament.max_players,
        });
      } catch (err) {
        logger.error('Tournament join error:', err);
        socket.emit('error', {
          code: 'TOURNAMENT_ERROR',
          message: 'Failed to join tournament',
        });
      }
    });

    // Keep-alive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });
}
