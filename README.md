# PaperStack

A paper trading platform where you can practice stock trading with $100K in virtual cash using real-time market data. No real money involved — just learn and experiment.

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Zustand, Recharts
- **Backend:** Go, Gin, PostgreSQL, JWT auth
- **Real-time:** WebSocket for live price updates
- **Market Data:** Finnhub API

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Go](https://go.dev/) (v1.24+)
- PostgreSQL database (we used [Neon](https://neon.tech/) but any Postgres works)
- [Finnhub](https://finnhub.io/) API key (free tier works fine)

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/PaperStack.git
cd PaperStack
```

### 2. Backend

```bash
cd backend
```

Create a `.env` file:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=some_secret_key
STOCK_API_KEY=your_finnhub_api_key
PORT=8080
```

Run the database migrations against your Postgres instance — the SQL files are in `backend/db/migrations/` (run them in order: `001_initial_schema.sql`, then `002_watchlist_badges.sql`).

Install dependencies and start the server:

```bash
go mod download
go run main.go
```

Backend runs on `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Features

- Register/login with JWT authentication
- Search stocks and view real-time quotes
- Buy and sell stocks with your virtual portfolio
- Track portfolio value over time with charts
- Watchlist to keep an eye on stocks
- Compare stocks side by side
- Leaderboard to see how you rank
- Badges and achievements
- Portfolio diversification score
- Full transaction history

## Project Structure

```
PaperStack/
├── frontend/          # Next.js app
│   └── src/
│       ├── app/       # Pages (dashboard, trade, compare, etc.)
│       ├── components/
│       ├── stores/    # Zustand state management
│       ├── hooks/
│       ├── lib/       # API client
│       └── types/
├── backend/           # Go API server
│   ├── handlers/      # Route handlers
│   ├── services/      # Business logic
│   ├── models/        # Data models
│   ├── middleware/     # JWT auth middleware
│   ├── db/
│   │   ├── migrations/
│   │   ├── queries/   # SQL queries (sqlc)
│   │   └── sqlc/      # Generated code
│   └── config/
└── .github/
```
