import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import emailRoutes from './routes/emailRoutes';
import slackRoutes from './routes/slackRoutes';
import { emailQueue } from './queues/emailQueue';
import { setupElasticsearch } from './services/elasticService';

// Set up Bull Board for Queue Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

import './workers/emailWorker'; // Initialize worker

setupElasticsearch();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`BullMQ Dashboard available at http://localhost:${port}/admin/queues`);
});
