import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export const slackAuth = (req: Request, res: Response) => {
  const { senderEmail } = req.query; // Who is connecting slack
  if (!senderEmail) {
    return res.status(400).send('Missing senderEmail parameter');
  }
  
  const slackClientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=incoming-webhook,chat:write&redirect_uri=${redirectUri}&state=${senderEmail}`;
  
  res.redirect(authUrl);
};

export const slackCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state: senderEmail, error } = req.query;

  if (error) {
    res.status(400).send(`Slack OAuth Error: ${error}`);
    return;
  }

  if (!code || !senderEmail) {
    res.status(400).send('Missing code or state parameter');
    return;
  }

  try {
    const slackClientId = process.env.SLACK_CLIENT_ID;
    const slackClientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_REDIRECT_URI;

    // Exchange code for token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: slackClientId || '',
        client_secret: slackClientSecret || '',
        code: code as string,
        redirect_uri: redirectUri || '',
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      res.status(400).send(`Slack API Error: ${data.error}`);
      return;
    }

    const accessToken = data.access_token;
    const webhookUrl = data.incoming_webhook?.url;

    // Save to SenderConfig in DB
    await prisma.senderConfig.upsert({
      where: { senderEmail: senderEmail as string },
      update: {
        slackAccessToken: accessToken,
        slackWebhookUrl: webhookUrl || null,
      },
      create: {
        senderEmail: senderEmail as string,
        slackAccessToken: accessToken,
        slackWebhookUrl: webhookUrl || null,
        hourlyLimit: 200, // default
      }
    });

    res.send('Slack Connected Successfully! You can close this window and return to the dashboard.');
  } catch (err) {
    console.error('Error during Slack callback:', err);
    res.status(500).send('Internal Server Error during Slack OAuth');
  }
};

export const notifySlackRateLimitHit = async (senderEmail: string, limit: number) => {
  try {
    const config = await prisma.senderConfig.findUnique({
      where: { senderEmail }
    });
    
    if (config?.slackWebhookUrl) {
      await fetch(config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Rate Limit Alert*\nThe sender \`${senderEmail}\` has hit their hourly limit of ${limit} emails per hour. Future emails in this hour window will be delayed.`
        })
      });
    } else if (config?.slackAccessToken) {
        // Fallback if no webhook, just an example (requires channel ID usually)
    }
  } catch (err) {
    console.error(`Failed to send slack notification for ${senderEmail}:`, err);
  }
};

export const updateLimit = async (req: Request, res: Response) => {
  const { senderEmail, hourlyLimit } = req.body;
  
  if (!senderEmail || !hourlyLimit) {
    return res.status(400).send('Missing parameters');
  }

  try {
    await prisma.senderConfig.upsert({
      where: { senderEmail },
      update: { hourlyLimit: parseInt(hourlyLimit) },
      create: {
        senderEmail,
        hourlyLimit: parseInt(hourlyLimit)
      }
    });
    res.send({ success: true });
  } catch (err) {
    console.error('Error updating limit:', err);
    res.status(500).send('Internal Server Error');
  }
};

