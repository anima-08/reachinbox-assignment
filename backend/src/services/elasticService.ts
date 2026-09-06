import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

// Setup index if it doesn't exist
export const setupElasticsearch = async () => {
  try {
    const exists = await esClient.indices.exists({ index: 'emails' });
    if (!exists) {
      await esClient.indices.create({
        index: 'emails',
        mappings: {
          properties: {
            id: { type: 'keyword' },
            subject: { type: 'text' },
            body: { type: 'text' },
            senderEmail: { type: 'keyword' },
            recipientEmail: { type: 'keyword' },
            status: { type: 'keyword' },
          },
        },
      });
      console.log('Elasticsearch index "emails" created');
    }
  } catch (error) {
    console.error('Error setting up Elasticsearch:', error);
  }
};

export const indexEmail = async (emailJob: any) => {
  try {
    await esClient.index({
      index: 'emails',
      id: emailJob.id,
      document: {
        id: emailJob.id,
        subject: emailJob.subject,
        body: emailJob.body,
        senderEmail: emailJob.senderEmail,
        recipientEmail: emailJob.recipientEmail,
        status: emailJob.status,
      },
    });
  } catch (error) {
    console.error('Error indexing email to ES:', error);
  }
};
