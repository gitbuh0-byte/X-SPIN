import { Queue, Worker, Job } from 'bullmq';
import { getRedis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { tournamentService } from '../services/tournament.js';

let connection: ReturnType<typeof getRedis> extends Promise<infer T> ? T : never;

export let payoutQueue: Queue;
export let tournamentQueue: Queue;
export let cleanupQueue: Queue;

export async function initializeQueues() {
  logger.info('Initializing BullMQ queues...');

  connection = await getRedis();

  payoutQueue = new Queue('payouts', { connection });
  tournamentQueue = new Queue('tournaments', { connection });
  cleanupQueue = new Queue('cleanup', { connection });

  // Payout worker
  new Worker(
    'payouts',
    async (job: Job) => {
      logger.info(`Processing payout job: ${job.id}`);

      const { userId, amount, method } = job.data;

      // Handle payout logic
      // This would call paymentService for actual payout
      logger.info(`Payout processed: ${userId}, ${amount}, ${method}`);

      return { success: true };
    },
    { connection }
  );

  // Tournament worker
  new Worker(
    'tournaments',
    async (job: Job) => {
      logger.info(`Processing tournament job: ${job.id}`);

      const { action, tournamentId } = job.data;

      if (action === 'advance_round') {
        await tournamentService.advanceRound(tournamentId);
      }

      return { success: true };
    },
    { connection }
  );

  // Cleanup worker
  new Worker(
    'cleanup',
    async (job: Job) => {
      logger.info(`Processing cleanup job: ${job.id}`);

      // Archive old games, transactions, etc.

      return { success: true };
    },
    { connection }
  );

  logger.info('BullMQ queues initialized');
}
