import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../types/index.js';

const paymentRouter = Router();

// Deposit endpoints
paymentRouter.post(
  '/mpesa/initiate',
  authenticate,
  async (req: Request, res: Response, next) => {
    try {
      const { phoneNumber, amount } = req.body;
      const userId = req.user!.user_id;

      const reference = await paymentService.initiateMpesaDeposit(phoneNumber, amount, userId);

      res.json({
        success: true,
        data: { reference },
      });
    } catch (err) {
      next(err);
    }
  }
);

paymentRouter.post('/mpesa/callback', async (req: Request, res: Response, next) => {
  try {
    await paymentService.handleMpesaCallback(req.body);

    res.json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
});

paymentRouter.post(
  '/paystack/initiate',
  authenticate,
  async (req: Request, res: Response, next) => {
    try {
      const { amount } = req.body;
      const userId = req.user!.user_id;
      const email = req.user!.email;

      const authorizationUrl = await paymentService.initiatePaystackDeposit(amount, email, userId);

      res.json({
        success: true,
        data: { authorizationUrl },
      });
    } catch (err) {
      next(err);
    }
  }
);

paymentRouter.post('/paystack/verify/:reference', async (req: Request, res: Response, next) => {
  try {
    const { reference } = req.params;

    await paymentService.verifyPaystackPayment(reference);

    res.json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
});

// Withdrawal endpoint
paymentRouter.post(
  '/withdraw',
  authenticate,
  async (req: Request, res: Response, next) => {
    try {
      const { amount, method, destination } = req.body;
      const userId = req.user!.user_id;

      const reference = await paymentService.initiateWithdrawal(userId, amount, method, destination);

      res.json({
        success: true,
        data: { reference },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default paymentRouter;
