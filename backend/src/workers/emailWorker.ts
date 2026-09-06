import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { transporter } from '../services/mailService';
import { indexEmail } from '../services/elasticService';
import { notifySlackRateLimitHit } from '../controllers/slackController';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const connection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

// Configure minimum delay between sends
// Here we use BullMQ's rate limiter:
// e.g., max 1 job per 2000 milliseconds (2 seconds)
export const emailWorker = new Worker(
  'emailQueue',
  async (job: Job) => {
    const { emailJobId } = job.data;
    
    // Fetch job from DB
    const emailJob = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
    });

    if (!emailJob) {
      throw new Error(`EmailJob ${emailJobId} not found in DB`);
    }

    // Step 1: Check rate limits (Emails Per Hour Per Sender)
    const sender = emailJob.senderEmail;
    const currentHour = new Date().toISOString().slice(0, 13); // e.g., "2023-10-25T14"
    const redisKey = `rate_limit:${sender}:${currentHour}`;
    
    // Get sender config
    const senderConfig = await prisma.senderConfig.findUnique({
      where: { senderEmail: sender }
    });
    
    const limit = senderConfig?.hourlyLimit || 200;
    const currentCountStr = await connection.get(redisKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    if (currentCount >= limit) {
      // Re-schedule for next hour by rejecting this job and scheduling a new one,
      // or delay this job
      console.log(`[Rate Limit Hit] Sender ${sender} hit limit of ${limit} per hour.`);
      
      // Calculate milliseconds until next hour
      const now = new Date();
      const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
      const delayMs = nextHour.getTime() - now.getTime();

      // Trigger Slack notification here
      await notifySlackRateLimitHit(sender, limit);

      const updatedJob = await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'DELAYED_RATE_LIMIT' }
      });
      await indexEmail(updatedJob);
      
      // Delay job (moveToDelayed throws a special error which bullmq handles, or we just throw and configure backoff)
      // The cleaner way in BullMQ is to use job.moveToDelayed. 
      await job.moveToDelayed(now.getTime() + delayMs, job.token || '');
      throw new Error(`Rate limit exceeded for ${sender}. Job delayed by ${delayMs}ms.`);
    }

    // Increment rate limit counter
    await connection.incr(redisKey);
    // Expire key after 1 hour (3600 secs)
    if (currentCount === 0) {
      await connection.expire(redisKey, 3600);
    }

    // Step 2: Send email via Ethereal
    console.log(`Sending email to ${emailJob.recipientEmail} from ${emailJob.senderEmail}...`);
    try {
      const info = await transporter.sendMail({
        from: `"${emailJob.senderEmail}" <darlene.stark@ethereal.email>`, // Map to ethereal
        to: emailJob.recipientEmail,
        subject: emailJob.subject,
        text: emailJob.body,
        html: `<p>${emailJob.body.replace(/\n/g, '<br>')}</p>`,
      });

      console.log('Message sent: %s', info.messageId);
      
      // Update DB Status
      const sentJob = await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { 
          status: 'SENT',
          sentTime: new Date()
        }
      });
      await indexEmail(sentJob);

    } catch (err: any) {
      console.error('Failed to send email:', err);
      const failedJob = await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { 
          status: 'FAILED',
          error: err.message
        }
      });
      await indexEmail(failedJob);
      throw err; // Let BullMQ retry
    }
  },
  {
    connection,
    concurrency: 5, // Configurable worker concurrency
    limiter: {
      max: 1,
      duration: 2000, // 2 seconds minimum delay between individual email sends
    }
  }
);

emailWorker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
