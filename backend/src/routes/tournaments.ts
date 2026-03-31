import { Router, Request, Response } from 'express';
import { tournamentService } from '../services/tournament.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../types/index.js';

const tournamentRouter = Router();

tournamentRouter.use(authenticate);

tournamentRouter.post('/create', async (req: Request, res: Response, next) => {
  try {
    const { entryFee, maxPlayers } = req.body;

    const tournament = await tournamentService.createTournament(entryFee, maxPlayers || 100);

    res.json({
      success: true,
      data: { tournament },
    });
  } catch (err) {
    next(err);
  }
});

tournamentRouter.post('/join', async (req: Request, res: Response, next) => {
  try {
    const { tournamentId } = req.body;
    const userId = req.user!.user_id;

    const tournament = await tournamentService.joinTournament(tournamentId, userId);

    res.json({
      success: true,
      data: { tournament },
    });
  } catch (err) {
    next(err);
  }
});

tournamentRouter.post('/:tournamentId/start', async (req: Request, res: Response, next) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await tournamentService.startTournament(tournamentId);

    res.json({
      success: true,
      data: { tournament },
    });
  } catch (err) {
    next(err);
  }
});

tournamentRouter.get('/:tournamentId', async (req: Request, res: Response, next) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await tournamentService.getTournament(tournamentId);

    if (!tournament) {
      throw new AppError('TOURNAMENT_NOT_FOUND', 'Tournament not found', 404);
    }

    res.json({
      success: true,
      data: { tournament },
    });
  } catch (err) {
    next(err);
  }
});

export default tournamentRouter;
