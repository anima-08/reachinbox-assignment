# ReachInbox — Email Job Scheduler & Dashboard

> A full-stack email scheduling platform built for the ReachInbox Hiring Assignment. Reliably schedules, rate-limits, and dispatches emails with a persistent, production-grade architecture.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-outbox--chi.vercel.app-black?style=for-the-badge&logo=vercel)](https://outbox-chi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌐 Live Demo

**[https://outbox-chi.vercel.app](https://outbox-chi.vercel.app)**

> Sign in with any Google account to access the dashboard. The frontend is fully deployed on Vercel. The backend runs locally (see setup below for running the full stack).

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, NextAuth (Google OAuth) |
| **Backend** | Node.js, Express, TypeScript, BullMQ |
| **Database** | PostgreSQL (via Prisma ORM) |
| **Queue / Cache** | Redis |
| **Search** | Elasticsearch |
| **Email** | Nodemailer + Ethereal Mail (mock SMTP) |
| **Notifications** | Slack OAuth Webhooks |
| **Deployment** | Vercel (Frontend) |

---

## ✨ Features

### Backend
- **Smart Scheduling:** BullMQ Delayed Jobs — no cron jobs. Jobs survive server reboots because state lives in Redis & PostgreSQL.
- **Rate Limiting:** Hourly email limits enforced via atomic Redis counters. Jobs that hit the limit are safely re-queued for the next hour.
- **Concurrency Control:** BullMQ Worker runs with `concurrency: 5` and a global `limiter` (1 email / 2s) to simulate real SMTP throttling.
- **Elasticsearch Sync:** Every email event (scheduled, sent, failed) is indexed in Elasticsearch, powering a fast `/search` endpoint.
- **Slack Integration:** Real OAuth flow stores Incoming Webhooks and fires instant notifications when hourly limits are breached.
- **Bull Board UI:** Live queue monitoring dashboard at `/admin/queues`.

### Frontend
- **Google OAuth Login:** Secured with NextAuth.js — one-click sign in.
- **Compose Modal:** Upload a CSV of leads, set a Start Time, Delay between emails, and Hourly limit. Email addresses are auto-extracted from any column containing `@`.
- **Live Dashboard Tables:** Separate tabs for Scheduled and Sent emails, with loading states and empty states.
- **Modern UI:** Clean sidebar layout inspired by Figma designs, with a dark theme.

---

## 🏗 Architecture Overview

### How Scheduling Works
When a user uploads a CSV, they specify a **Start Time** and a **Delay Between Emails**. The frontend calculates the precise dispatch time for each email:
```
dispatchTime = StartTime + (index × Delay)
```
These timestamps are sent to the backend, which schedules them as **BullMQ Delayed Jobs**. Redis natively tracks the delays and fires each job at exactly the right moment — no polling, no cron.

### How Persistence Works
If the backend restarts, **no jobs are lost:**
- **Queue state** (delayed, waiting, active jobs) lives in a persistent **Redis** container.
- **Canonical records** are stored in **PostgreSQL**.

On reboot, BullMQ reconnects to Redis and resumes exactly where it left off.

### Rate Limiting Flow
```
Worker picks up job
  → Check Redis key: rate_limit:{sender}:{hour}
  → Under limit?  → Send email ✅
  → Over limit?   → job.moveToDelayed(nextHour) + Slack notification 🔔
```

---

## 🛠 Local Setup

### Prerequisites
- **Docker Desktop** (for PostgreSQL, Redis, Elasticsearch)
- **Node.js 18+**

### 1. Clone the repo
```bash
git clone https://github.com/anima24/outbox.git
cd outbox
```

### 2. Backend Environment Variables
Create `backend/.env`:
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

> Get a free Ethereal mail account at [ethereal.email](https://ethereal.email/)

### 3. Frontend Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

### 4. Start Infrastructure
```bash
docker-compose up -d
```
Spins up PostgreSQL (port 5433), Redis (port 6379), and Elasticsearch (port 9200).

### 5. Start Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
API available at `http://localhost:5000`  
Bull Board queue UI at `http://localhost:5000/admin/queues`

### 6. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Dashboard available at `http://localhost:3000`

---

## 📝 Trade-offs & Assumptions

1. **Frontend-only CSV parsing:** The app assumes a simple CSV format. Email addresses are extracted by scanning each cell for strings containing `@`.
2. **Slack OAuth:** The Slack redirect updates the sender config and returns a plain success response, rather than redirecting back to the Next.js frontend with complex session state — acceptable for this assignment scope.
3. **Mock SMTP:** Ethereal Mail is used so no real emails are sent during evaluation. All sent emails are viewable at [ethereal.email](https://ethereal.email/).
