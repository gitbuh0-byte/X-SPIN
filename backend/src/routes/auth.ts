import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../types/index.js';

const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { email, password, username } = req.body;

    const user = await authService.register(email, password, username);

    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    const { user, token, refreshToken } = await authService.login(email, password);

    res.json({
      success: true,
      data: { user, token, refreshToken },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('MISSING_REFRESH_TOKEN', 'Refresh token required', 400);
    }

    const token = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: { token },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/oauth', async (req: Request, res: Response, next) => {
  try {
    const { email, username, authProvider, profile } = req.body;

    const { user, token, refreshToken } = await authService.loginOAuth(
      email,
      username,
      authProvider,
      profile
    );

    res.json({
      success: true,
      data: { user, token, refreshToken },
    });
  } catch (err) {
    next(err);
  }
});

export default authRouter;
