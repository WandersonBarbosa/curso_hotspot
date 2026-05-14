import { Queue, Worker, type JobsOptions } from "bullmq";
import { Redis } from "ioredis";
import { logger } from "../infra/logger.js";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });

export const PAYMENT_QUEUE = "payments";
export const OVERDUE_QUEUE = "overdue";

export const paymentQueue = new Queue(PAYMENT_QUEUE, { connection });
export const overdueQueue = new Queue(OVERDUE_QUEUE, { connection });

export async function enqueuePaymentJob(name: string, data: Record<string, unknown>, opts?: JobsOptions) {
  await paymentQueue.add(name, data, opts);
}

export function createPaymentWorker(handler: (name: string, data: Record<string, unknown>) => Promise<void>) {
  return new Worker(
    PAYMENT_QUEUE,
    async (job) => {
      await handler(job.name, job.data as Record<string, unknown>);
    },
    { connection },
  );
}

export function createOverdueWorker(handler: (data: Record<string, unknown>) => Promise<void>) {
  return new Worker(OVERDUE_QUEUE, async (job) => handler(job.data as Record<string, unknown>), { connection });
}

connection.on("error", (err: Error) => logger.error("Redis erro", { err }));
