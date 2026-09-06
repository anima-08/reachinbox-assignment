import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../queues/emailQueue';
import { indexEmail, esClient } from '../services/elasticService';

const prisma = new PrismaClient();

export const scheduleEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { senderEmail, recipientEmail, subject, body, scheduledTime } = req.body;

    if (!senderEmail || !recipientEmail || !subject || !body || !scheduledTime) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const scheduledDate = new Date(scheduledTime);
    const delay = Math.max(0, scheduledDate.getTime() - Date.now());

    // 1. Save to DB
    const emailJob = await prisma.emailJob.create({
      data: {
        senderEmail,
        recipientEmail,
        subject,
        body,
        scheduledTime: scheduledDate,
        status: 'SCHEDULED'
      }
    });

    // 2. Add to BullMQ with delay
    const job = await emailQueue.add(
      'send-email',
      { emailJobId: emailJob.id },
      { delay }
    );

    // 3. Update DB with bullJobId
    const updatedJob = await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { bullJobId: job.id }
    });
    
    // 4. Index in Elasticsearch
    await indexEmail(updatedJob);

    res.status(201).json({ message: 'Email scheduled successfully', job: emailJob });
  } catch (error: any) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ error: 'Failed to schedule email' });
  }
};

export const getEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query; // 'SCHEDULED', 'SENT', etc.
    const emails = await prisma.emailJob.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

export const searchEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q) {
      res.status(400).json({ error: 'Query parameter q is required' });
      return;
    }

    const result = await esClient.search({
      index: 'emails',
      query: {
        multi_match: {
          query: q as string,
          fields: ['subject', 'body', 'recipientEmail']
        }
      }
    });

    const hits = result.hits.hits.map(hit => hit._source);
    res.status(200).json(hits);
  } catch (error: any) {
    console.error('Error searching emails:', error.message);
    res.status(500).json({ error: 'Failed to search emails' });
  }
};
