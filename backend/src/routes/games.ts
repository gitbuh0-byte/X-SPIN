import { Router, Request, Response } from 'express';
import { gameService } from '../services/game.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../types/index.js';

const gameRouter = Router();

gameRouter.use(authenticate);

gameRouter.post('/create', async (req: Request, res: Response, next) => {
  try {
    const { type, entryFee, maxPlayers } = req.body;

    const game = await gameService.createGame(type, entryFee, maxPlayers || 5);

    res.json({
      success: true,
      data: { game },
    });
  } catch (err) {
    next(err);
  }
});

gameRouter.post('/join', async (req: Request, res: Response, next) => {
  try {
    const { gameId } = req.body;
    const userId = req.user!.user_id;

    const game = await gameService.joinGame(gameId, userId);

    res.json({
      success: true,
      data: { game },
    });
  } catch (err) {
    next(err);
  }
});

gameRouter.get('/:gameId', async (req: Request, res: Response, next) => {
  try {
    const { gameId } = req.params;

    const game = await gameService.getGame(gameId);

    if (!game) {
      throw new AppError('GAME_NOT_FOUND', 'Game not found', 404);
    }

    res.json({
      success: true,
      data: { game },
    });
  } catch (err) {
    next(err);
  }
});

export default gameRouter;
