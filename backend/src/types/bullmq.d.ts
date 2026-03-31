// Type declarations for bullmq
declare module 'bullmq' {
  import { RedisClient } from 'redis';

  export interface Job {
    id?: string;
    data: any;
  }

  export class Queue {
    constructor(name: string, options: any);
  }

  export class Worker {
    constructor(name: string, processor: (job: Job) => Promise<any>, options: any);
  }
}
