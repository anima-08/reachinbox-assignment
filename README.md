# ReachInbox - Email Job Scheduler & Dashboard

This repository contains a full-stack email job scheduler, built to fulfill the ReachInbox Hiring Assignment. It reliably schedules, rate-limits, and dispatches mock emails via Ethereal, with a persistent architecture that survives server restarts.

## 🚀 Tech Stack
- **Backend:** Node.js, Express, TypeScript, BullMQ, Redis, PostgreSQL (Prisma), Elasticsearch
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, NextAuth (Google Login)

---

## 🏗 Architecture Overview

### 1. How Scheduling Works
Scheduling does **not** rely on CRON jobs. When a user uploads a CSV of leads in the frontend, they specify a **Start Time** and a **Delay Between Emails**. The frontend dynamically calculates the precise execution time for each individual email (e.g., `StartTime + (index * Delay)`). 

The backend receives these timestamps and schedules them into **BullMQ as Delayed Jobs**. Redis natively tracks these delays. When the time arrives, BullMQ automatically moves the job from the `delayed` state to the `active` queue.

### 2. How Persistence on Restart is Handled
If the Node.js backend crashes or is restarted, **no jobs are lost or restarted from Day 1**. 
- **Queue State:** BullMQ stores the entire queue (including `delayed`, `waiting`, and `active` jobs) natively in a persistent **Redis** container.
- **Relational Data:** The canonical record of all `EmailJob`s and their statuses is stored in **PostgreSQL**.
When the Node.js server reboots, BullMQ automatically re-connects to Redis and resumes evaluating the delayed jobs right where it left off.

### 3. Rate Limiting & Concurrency
- **Concurrency:** The BullMQ Worker is instantiated with a configuration of `{ concurrency: 5 }`, meaning up to 5 emails can be dispatched exactly in parallel.
- **Delay Between Emails:** The global BullMQ `limiter` is also implemented `(max: 1, duration: 2000)`, enforcing a minimum 2-second global delay between dispatches across the worker to simulate SMTP throttling constraints, alongside the custom delay provided in the frontend UI.
- **Hourly Limits:** When the worker processes an email, it checks a Redis key (`rate_limit:{senderEmail}:{hour_timestamp}`). 
  - If the limit (e.g., 200/hr) is exceeded, the worker executes `job.moveToDelayed()` to securely push the job back into the queue delayed until the top of the *next* hour.
  - The job status in Postgres is updated to `DELAYED_RATE_LIMIT`.
  - A real-time notification is fired to the user's connected **Slack** workspace.

---

## ✨ Features Implemented

### Backend
- **Scheduler & Persistence:** BullMQ Delayed jobs, no cron, survives server reboots.
- **Rate Limiting & Concurrency:** Concurrency set to 5. Hourly limits backed by Redis atomic counters. Reschedules jobs securely when limits are hit.
- **Ethereal Mail:** Integrates with Nodemailer to send real (mocked) emails.
- **Elasticsearch:** All scheduled, sent, and failed emails are synchronized to an Elasticsearch index on the fly, exposing a fast `/search` endpoint.
- **Slack OAuth Integration:** Stores Slack Incoming Webhooks via a real OAuth flow and notifies users instantly when their hourly limit is breached.
- **Bull Board:** A beautiful UI for the Redis queues exposed at `/admin/queues`.

### Frontend
- **Google OAuth Login:** Secured with NextAuth.
- **Dashboard Layout:** Beautiful, modern sidebar and tables strictly matching clean Figma aesthetics.
- **Compose Modal:** Accepts a CSV upload, automatically extracts emails from the rows, and accepts custom parameters for **Delay between emails** and **Hourly limits**.
- **Real-time Tables:** Tracks "Scheduled" and "Sent" emails with respective loading and empty states.

---

## 🛠 Local Setup & Running

### 1. Prerequisites
Ensure you have **Docker** and **Docker Desktop** installed and running on your machine. 

### 2. Environment Variables
Create a `.env` in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://reachinbox_user:reachinbox_password@localhost:5433/reachinbox_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
ELASTICSEARCH_NODE=http://localhost:9200
ETHEREAL_USER=your_ethereal_user@ethereal.email
ETHEREAL_PASS=your_ethereal_pass
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/callback
```

Create a `.env.local` in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

*Note: You can generate an Ethereal Mail account for free at [Ethereal.email](https://ethereal.email/)*.

### 3. Start Infrastructure (Docker)
In the root directory of the project, run:
```bash
docker-compose up -d
```
This spins up PostgreSQL (Port 5433), Redis (Port 6379), and Elasticsearch (Port 9200).

### 4. Run the Backend
Open a terminal in the `backend/` folder:
```bash
npm install
npx prisma db push
npm run dev
```
The API is now running on `http://localhost:5000`. You can view the queue dashboard at `http://localhost:5000/admin/queues`.

### 5. Run the Frontend
Open a terminal in the `frontend/` folder:
```bash
npm install
npm run dev
```
The Dashboard is now running on `http://localhost:3000`. Log in with Google and start scheduling!

---

## 📝 Trade-offs & Assumptions
1. **Frontend CSV Parsing:** Assumed the uploaded CSV is simple. The frontend loops through the CSV cells to extract any string containing an `@` symbol.
2. **Slack Authentication Flow:** For simplicity in this assignment, the Slack OAuth redirect simply updates the sender config and shows a basic success string rather than redirecting back to the Next.js frontend with complex session states.
