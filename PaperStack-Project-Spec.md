# PaperStack — Project Specification

## A Social Paper Trading Platform for Students

**Built with:** Go (Gin) + Next.js + PostgreSQL + Redis

---

# Part 1: Understanding the Project

## What is PaperStack?

PaperStack is a **paper trading platform** — meaning users trade stocks with **fake money** in a simulated environment that mirrors real market conditions. Think of it as a flight simulator, but for investing.

### The "Paper" in Paper Trading

The term "paper trading" comes from the old practice of writing down hypothetical trades on paper to test strategies without risking real money. PaperStack digitizes this concept.

### Who is it for?

- **CS students** who want to learn about markets before investing real money
- **University students** who want to compete with friends on investment returns
- **Anyone** curious about trading but afraid to lose money

---

## Core User Journey

Here's what a typical user does on PaperStack:

```
1. Sign Up → Create account with email/university
2. Get Fake Money → Receive $100,000 in virtual cash
3. Research → Browse stocks, see prices, read basic info
4. Buy Stocks → Purchase shares with virtual money
5. Track Portfolio → Watch your holdings change in value
6. Compete → See how you rank against other users
7. Learn → Understand why your picks did well or poorly
```

---

## Why This Impresses Interviewers (Especially Wealthsimple)

| Technical Challenge | Why It's Hard | Interview Talking Point |
|---------------------|---------------|-------------------------|
| Real-time data | WebSocket connections, efficient updates | "I implemented a fan-out pattern for price updates..." |
| Financial calculations | Accurate math, handling edge cases | "I had to handle stock splits and dividends..." |
| Time-series storage | Efficient queries over historical data | "I optimized queries using time-bucketing..." |
| Caching strategy | Rate limits, data freshness | "I used Redis with TTL to avoid API rate limits..." |
| Leaderboard ranking | Efficient sorting at scale | "I used a sorted set for O(log n) ranking..." |
| Background jobs | Scheduled tasks, reliability | "I built a job queue for daily snapshots..." |

---

## Feature Overview

### Must Have (MVP)

- [ ] User authentication (sign up, login, logout)
- [ ] Virtual cash balance ($100,000 starting)
- [ ] Stock search and price lookup
- [ ] Buy and sell stocks
- [ ] Portfolio view (holdings + total value)
- [ ] Basic transaction history
- [ ] Simple leaderboard

### Should Have (V1.0)

- [ ] Real-time price updates
- [ ] Portfolio performance chart
- [ ] Individual stock price charts
- [ ] Daily portfolio snapshots
- [ ] Percentage gain/loss calculations
- [ ] Multiple time-frame leaderboards (daily, weekly, all-time)

### Nice to Have (V1.5+)

- [ ] Watchlists
- [ ] Price alerts
- [ ] Social features (follow users, share trades)
- [ ] Achievement badges
- [ ] University-specific leaderboards
- [ ] Advanced metrics (Sharpe ratio, volatility)

---

# Part 2: System Architecture

## High-Level Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js       │────▶│   Go Backend    │────▶│   PostgreSQL    │
│   Frontend      │     │   (Gin)         │     │   Database      │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │     Redis       │
                        │     Cache       │
                        │                 │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │   Stock Price   │
                        │   API           │
                        │                 │
                        └─────────────────┘
```

## Component Responsibilities

### Frontend (Next.js + TypeScript)

- User interface and interactions
- Client-side state management
- Real-time price display
- Charts and visualizations
- Form validation
- Authentication UI

### Backend (Go + Gin)

- REST API endpoints
- Business logic (trading rules, calculations)
- Authentication and authorization
- Database operations
- External API communication
- Background job scheduling
- WebSocket management

### Database (PostgreSQL)

- User accounts
- Portfolios and holdings
- Transaction history
- Historical snapshots
- Leaderboard data

### Cache (Redis)

- Current stock prices (avoid API rate limits)
- Session data
- Leaderboard rankings (sorted sets)
- Rate limiting

### External API (Stock Data Provider)

Options (free tiers available):
- **Alpha Vantage** — 25 requests/day free
- **Finnhub** — 60 requests/minute free
- **Twelve Data** — 800 requests/day free
- **Yahoo Finance** (unofficial) — No official limit

---

## Data Flow Examples

### User Buys Stock

```
1. User clicks "Buy 10 shares of AAPL"
2. Frontend sends POST /api/trades
3. Backend checks:
   - Is user authenticated?
   - Does user have enough cash?
   - Is market open? (optional rule)
4. Backend fetches current AAPL price
   - First check Redis cache
   - If miss, fetch from API and cache
5. Backend calculates total cost
6. Database transaction:
   - Deduct cash from user balance
   - Add/update holding record
   - Create transaction record
7. Return success + updated portfolio
8. Frontend updates UI
```

### Viewing Leaderboard

```
1. User opens leaderboard page
2. Frontend sends GET /api/leaderboard
3. Backend checks Redis sorted set
   - If fresh (< 5 min old), return cached
   - If stale, recalculate from DB
4. Return top 100 users with returns
5. Frontend renders leaderboard table
```

---

# Part 3: Database Design

## Entity Relationship Overview

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│  users   │───────│  portfolios  │───────│   holdings   │
└──────────┘       └──────────────┘       └──────────────┘
     │                    │
     │                    │
     ▼                    ▼
┌──────────────┐   ┌──────────────┐
│ transactions │   │  snapshots   │
└──────────────┘   └──────────────┘
```

## Tables

### users

Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, for login |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| username | VARCHAR(50) | Display name, unique |
| university | VARCHAR(100) | Optional, for filtering |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last modification time |

### portfolios

Each user has one portfolio (1:1 relationship).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| cash_balance | DECIMAL(15,2) | Available cash (starts at 100000.00) |
| created_at | TIMESTAMP | Portfolio creation time |
| updated_at | TIMESTAMP | Last modification time |

### holdings

Current stock positions (what stocks you own).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| portfolio_id | UUID | Foreign key to portfolios |
| symbol | VARCHAR(10) | Stock ticker (e.g., "AAPL") |
| shares | DECIMAL(15,6) | Number of shares owned |
| average_cost | DECIMAL(15,2) | Average price paid per share |
| created_at | TIMESTAMP | First purchase time |
| updated_at | TIMESTAMP | Last modification time |

**Note:** `shares` is DECIMAL to support fractional shares if desired.

### transactions

Record of every buy/sell action.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| portfolio_id | UUID | Foreign key to portfolios |
| symbol | VARCHAR(10) | Stock ticker |
| type | VARCHAR(4) | "BUY" or "SELL" |
| shares | DECIMAL(15,6) | Number of shares |
| price_per_share | DECIMAL(15,2) | Execution price |
| total_amount | DECIMAL(15,2) | Total transaction value |
| created_at | TIMESTAMP | Transaction time |

### portfolio_snapshots

Daily snapshots for historical tracking and charts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| portfolio_id | UUID | Foreign key to portfolios |
| total_value | DECIMAL(15,2) | Portfolio value at snapshot time |
| cash_balance | DECIMAL(15,2) | Cash at snapshot time |
| snapshot_date | DATE | Date of snapshot |
| created_at | TIMESTAMP | When snapshot was taken |

**Note:** One snapshot per portfolio per day.

### stock_cache

Optional: Store price data locally to reduce API calls.

| Column | Type | Description |
|--------|------|-------------|
| symbol | VARCHAR(10) | Primary key, stock ticker |
| price | DECIMAL(15,2) | Last known price |
| change_percent | DECIMAL(8,4) | Daily change percentage |
| updated_at | TIMESTAMP | When price was fetched |

---

## Indexes to Create

```
- users(email) — unique, for login lookup
- users(username) — unique, for profile lookup
- portfolios(user_id) — unique, 1:1 relationship
- holdings(portfolio_id) — for fetching user's stocks
- holdings(portfolio_id, symbol) — unique, one record per stock
- transactions(portfolio_id) — for transaction history
- transactions(created_at) — for time-based queries
- portfolio_snapshots(portfolio_id, snapshot_date) — unique, one per day
```

---

# Part 4: API Design

## Authentication Endpoints

### POST /api/auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "student@mail.utoronto.ca",
  "password": "securepassword123",
  "username": "tradingpro"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "student@mail.utoronto.ca",
    "username": "tradingpro"
  },
  "token": "jwt-token-here"
}
```

**Errors:**
- 400: Invalid email format, password too short
- 409: Email or username already exists

---

### POST /api/auth/login

Authenticate existing user.

**Request Body:**
```json
{
  "email": "student@mail.utoronto.ca",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "student@mail.utoronto.ca",
    "username": "tradingpro"
  },
  "token": "jwt-token-here"
}
```

**Errors:**
- 401: Invalid credentials

---

### POST /api/auth/logout

Invalidate current session (if using token blacklist).

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Portfolio Endpoints

### GET /api/portfolio

Get current user's portfolio summary.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "portfolio": {
    "id": "uuid-here",
    "cash_balance": 75432.50,
    "total_value": 124567.89,
    "total_return": 24567.89,
    "total_return_percent": 24.57,
    "holdings": [
      {
        "symbol": "AAPL",
        "shares": 50,
        "average_cost": 150.00,
        "current_price": 178.50,
        "market_value": 8925.00,
        "gain_loss": 1425.00,
        "gain_loss_percent": 19.00
      }
    ]
  }
}
```

---

### GET /api/portfolio/history

Get portfolio value over time (for charts).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: "1W", "1M", "3M", "1Y", "ALL" (default: "1M")

**Response (200 OK):**
```json
{
  "history": [
    {
      "date": "2024-01-15",
      "total_value": 102345.67
    },
    {
      "date": "2024-01-16",
      "total_value": 103456.78
    }
  ]
}
```

---

## Trading Endpoints

### POST /api/trades

Execute a buy or sell order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "symbol": "AAPL",
  "type": "BUY",
  "shares": 10
}
```

**Response (201 Created):**
```json
{
  "transaction": {
    "id": "uuid-here",
    "symbol": "AAPL",
    "type": "BUY",
    "shares": 10,
    "price_per_share": 178.50,
    "total_amount": 1785.00,
    "created_at": "2024-01-15T14:30:00Z"
  },
  "portfolio": {
    "cash_balance": 73647.50,
    "total_value": 124567.89
  }
}
```

**Errors:**
- 400: Invalid symbol, invalid shares amount
- 400: Insufficient funds (for BUY)
- 400: Insufficient shares (for SELL)

---

### GET /api/trades

Get transaction history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: Number of records (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `symbol`: Filter by stock (optional)

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "uuid-here",
      "symbol": "AAPL",
      "type": "BUY",
      "shares": 10,
      "price_per_share": 178.50,
      "total_amount": 1785.00,
      "created_at": "2024-01-15T14:30:00Z"
    }
  ],
  "total": 47,
  "limit": 50,
  "offset": 0
}
```

---

## Stock Data Endpoints

### GET /api/stocks/search

Search for stocks by symbol or name.

**Query Parameters:**
- `q`: Search query (required)

**Response (200 OK):**
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ"
    },
    {
      "symbol": "AAPD",
      "name": "Direxion Daily AAPL Bear 1X Shares",
      "exchange": "NASDAQ"
    }
  ]
}
```

---

### GET /api/stocks/:symbol

Get current price and info for a stock.

**Response (200 OK):**
```json
{
  "stock": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 178.50,
    "change": 2.35,
    "change_percent": 1.33,
    "high": 180.00,
    "low": 176.25,
    "volume": 45678900,
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

---

### GET /api/stocks/:symbol/history

Get historical prices for charts.

**Query Parameters:**
- `period`: "1D", "1W", "1M", "3M", "1Y" (default: "1M")

**Response (200 OK):**
```json
{
  "history": [
    {
      "date": "2024-01-15",
      "open": 176.00,
      "high": 180.00,
      "low": 175.50,
      "close": 178.50,
      "volume": 45678900
    }
  ]
}
```

---

## Leaderboard Endpoints

### GET /api/leaderboard

Get top performers.

**Query Parameters:**
- `period`: "daily", "weekly", "monthly", "all" (default: "all")
- `limit`: Number of results (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "tradingpro",
      "total_return_percent": 45.67,
      "total_value": 145670.00
    },
    {
      "rank": 2,
      "username": "stockmaster",
      "total_return_percent": 38.92,
      "total_value": 138920.00
    }
  ],
  "user_rank": {
    "rank": 127,
    "total_return_percent": 12.34
  }
}
```

---

## WebSocket Endpoint (Real-Time)

### WS /api/ws/prices

Subscribe to real-time price updates.

**Client sends:**
```json
{
  "action": "subscribe",
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}
```

**Server sends (on price update):**
```json
{
  "type": "price_update",
  "data": {
    "symbol": "AAPL",
    "price": 178.75,
    "change_percent": 1.47,
    "timestamp": "2024-01-15T14:30:05Z"
  }
}
```

---

# Part 5: Build Plan (Phases)

## Phase 0: Project Setup (Day 1)

### Task 0.1: Initialize Go Backend

- [ ] Create project directory structure
- [ ] Initialize Go module (`go mod init`)
- [ ] Install core dependencies:
  - `gin-gonic/gin` — HTTP framework
  - `lib/pq` — PostgreSQL driver
  - `golang-jwt/jwt` — JWT handling
  - `joho/godotenv` — Environment variables

**Folder Structure:**
```
backend/
├── main.go
├── go.mod
├── go.sum
├── .env
├── config/
│   └── config.go
├── handlers/
├── middleware/
├── models/
├── services/
├── db/
│   ├── migrations/
│   └── queries/
└── utils/
```

### Task 0.2: Initialize Next.js Frontend

- [ ] Create Next.js app with TypeScript
- [ ] Install dependencies:
  - `tailwindcss` — Styling
  - `shadcn/ui` — Component library
  - `axios` or `fetch` wrapper — API calls
  - `recharts` — Charts
  - `zustand` — State management

**Folder Structure:**
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── trade/
│   │   └── leaderboard/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── types/
├── public/
└── package.json
```

### Task 0.3: Database Setup

- [ ] Create PostgreSQL database (local or Supabase)
- [ ] Create initial migration file with all tables
- [ ] Run migration
- [ ] Set up SQLC for type-safe queries

### Task 0.4: Environment Configuration

Backend `.env`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/paperstack
JWT_SECRET=your-super-secret-key
STOCK_API_KEY=your-api-key
STOCK_API_URL=https://api.example.com
REDIS_URL=redis://localhost:6379
PORT=8080
```

Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Task 0.5: Docker Setup

- [ ] Create `Dockerfile` for backend
- [ ] Create `Dockerfile` for frontend
- [ ] Create `docker-compose.yml` with:
  - Backend service
  - Frontend service
  - PostgreSQL service
  - Redis service

---

## Phase 1: Authentication (Days 2-3)

### Task 1.1: User Model and Database

- [ ] Create `users` table migration
- [ ] Create SQLC queries:
  - `CreateUser`
  - `GetUserByEmail`
  - `GetUserByID`
  - `GetUserByUsername`

### Task 1.2: Password Hashing Utility

- [ ] Create utility function to hash password (bcrypt)
- [ ] Create utility function to verify password

### Task 1.3: JWT Utility

- [ ] Create function to generate JWT token
- [ ] Create function to validate JWT token
- [ ] Include user ID and expiration in claims

### Task 1.4: Auth Middleware

- [ ] Create middleware to extract token from header
- [ ] Validate token and add user ID to context
- [ ] Return 401 if invalid or missing

### Task 1.5: Register Handler

- [ ] Validate email format
- [ ] Validate password length (min 8 characters)
- [ ] Check if email already exists
- [ ] Hash password
- [ ] Create user in database
- [ ] Create portfolio with $100,000 balance
- [ ] Generate JWT token
- [ ] Return user + token

### Task 1.6: Login Handler

- [ ] Find user by email
- [ ] Verify password
- [ ] Generate JWT token
- [ ] Return user + token

### Task 1.7: Frontend Auth Pages

- [ ] Create login page with form
- [ ] Create register page with form
- [ ] Create auth context/store for managing logged-in state
- [ ] Create protected route wrapper
- [ ] Store token in localStorage or cookies

### Task 1.8: Frontend API Client

- [ ] Create axios/fetch wrapper
- [ ] Add interceptor to attach auth token
- [ ] Add interceptor to handle 401 responses

---

## Phase 2: Portfolio Basics (Days 4-5)

### Task 2.1: Portfolio and Holdings Tables

- [ ] Create `portfolios` table migration
- [ ] Create `holdings` table migration
- [ ] Create SQLC queries:
  - `GetPortfolioByUserID`
  - `UpdateCashBalance`
  - `GetHoldingsByPortfolioID`
  - `GetHolding` (by portfolio + symbol)
  - `CreateHolding`
  - `UpdateHolding`
  - `DeleteHolding`

### Task 2.2: Portfolio Service

- [ ] Create function to calculate total holdings value
  - Loop through holdings
  - Fetch current price for each
  - Multiply shares × price
  - Sum all values
- [ ] Create function to calculate total portfolio value
  - Holdings value + cash balance
- [ ] Create function to calculate returns
  - (Current value - Starting value) / Starting value × 100

### Task 2.3: Get Portfolio Handler

- [ ] Get user ID from context (middleware)
- [ ] Fetch portfolio from database
- [ ] Fetch all holdings
- [ ] For each holding, fetch current price
- [ ] Calculate gain/loss per holding
- [ ] Calculate total portfolio value and return
- [ ] Return formatted response

### Task 2.4: Frontend Dashboard Page

- [ ] Create dashboard layout
- [ ] Fetch portfolio data on load
- [ ] Display cash balance
- [ ] Display total portfolio value
- [ ] Display total return ($ and %)
- [ ] Display holdings table:
  - Symbol
  - Shares
  - Avg cost
  - Current price
  - Market value
  - Gain/Loss

### Task 2.5: Holdings Card Component

- [ ] Create reusable component for single holding
- [ ] Show gain/loss with color (green/red)
- [ ] Make clickable to view stock details

---

## Phase 3: Stock Data Integration (Days 6-7)

### Task 3.1: Stock API Service

- [ ] Create service to fetch stock quote
- [ ] Create service to search stocks
- [ ] Create service to fetch historical data
- [ ] Handle API errors gracefully
- [ ] Implement rate limiting awareness

### Task 3.2: Redis Caching Layer

- [ ] Create Redis client connection
- [ ] Create cache wrapper for stock quotes
  - Check cache first
  - If miss, fetch from API
  - Store in cache with TTL (e.g., 60 seconds)
- [ ] Create cache invalidation if needed

### Task 3.3: Stock Search Handler

- [ ] Accept search query
- [ ] Call stock API search
- [ ] Return formatted results

### Task 3.4: Stock Quote Handler

- [ ] Accept symbol parameter
- [ ] Fetch from cache/API
- [ ] Return price and details

### Task 3.5: Stock History Handler

- [ ] Accept symbol and period
- [ ] Fetch historical data from API
- [ ] Format for charting library

### Task 3.6: Frontend Stock Search

- [ ] Create search input component
- [ ] Debounce input (300ms)
- [ ] Show dropdown with results
- [ ] Navigate to stock detail on select

### Task 3.7: Frontend Stock Detail Page

- [ ] Display stock name and symbol
- [ ] Display current price
- [ ] Display daily change (with color)
- [ ] Display price chart
- [ ] Add "Buy" and "Sell" buttons

---

## Phase 4: Trading (Days 8-10)

### Task 4.1: Transactions Table

- [ ] Create `transactions` table migration
- [ ] Create SQLC queries:
  - `CreateTransaction`
  - `GetTransactionsByPortfolioID`
  - `GetTransactionsBySymbol`

### Task 4.2: Trading Validation Service

- [ ] Validate symbol exists
- [ ] Validate shares is positive number
- [ ] For BUY: check sufficient cash
- [ ] For SELL: check sufficient shares
- [ ] Calculate total transaction amount

### Task 4.3: Execute Trade Service

- [ ] Wrap in database transaction
- [ ] For BUY:
  - Deduct cash from portfolio
  - Create or update holding
  - Update average cost calculation
  - Create transaction record
- [ ] For SELL:
  - Add cash to portfolio
  - Reduce or delete holding
  - Create transaction record
- [ ] Return updated portfolio state

### Task 4.4: Average Cost Calculation

When buying more shares of a stock you already own:

```
New Average Cost = (Old Shares × Old Avg Cost + New Shares × New Price) / Total Shares
```

- [ ] Implement this calculation
- [ ] Handle edge case: first purchase (no existing holding)

### Task 4.5: Trade Handler

- [ ] Extract user from context
- [ ] Validate request body
- [ ] Fetch current stock price
- [ ] Call trading service
- [ ] Return transaction + updated portfolio

### Task 4.6: Transaction History Handler

- [ ] Get paginated transactions
- [ ] Support filtering by symbol
- [ ] Return with total count

### Task 4.7: Frontend Trade Modal

- [ ] Create modal component
- [ ] Radio buttons for BUY/SELL
- [ ] Input for number of shares
- [ ] Display estimated cost/proceeds
- [ ] Show available cash (for buy)
- [ ] Show available shares (for sell)
- [ ] Submit button with loading state
- [ ] Success/error feedback

### Task 4.8: Frontend Transaction History

- [ ] Create transactions page/section
- [ ] Display table with all trades
- [ ] Color code BUY (green) / SELL (red)
- [ ] Add pagination
- [ ] Add symbol filter

---

## Phase 5: Leaderboard (Days 11-12)

### Task 5.1: Leaderboard Service

- [ ] Query all portfolios
- [ ] Calculate return % for each
- [ ] Sort by return % descending
- [ ] Return top N users

### Task 5.2: Redis Sorted Set for Leaderboard

- [ ] Store rankings in sorted set
- [ ] Update rankings periodically (not per request)
- [ ] Fetch rankings efficiently

### Task 5.3: Leaderboard Handler

- [ ] Support different periods (if tracking snapshots)
- [ ] Return top users
- [ ] Include requesting user's rank

### Task 5.4: Frontend Leaderboard Page

- [ ] Create leaderboard table
- [ ] Show rank, username, return %
- [ ] Highlight current user's row
- [ ] Add medal icons for top 3
- [ ] Period selector tabs

---

## Phase 6: Historical Tracking (Days 13-14)

### Task 6.1: Portfolio Snapshots Table

- [ ] Create `portfolio_snapshots` table migration
- [ ] Create SQLC queries:
  - `CreateSnapshot`
  - `GetSnapshotsByPortfolioID`
  - `GetSnapshotByDate`

### Task 6.2: Snapshot Background Job

- [ ] Create job to run daily (end of market)
- [ ] For each portfolio:
  - Calculate current total value
  - Create snapshot record
- [ ] Use cron or simple scheduler

### Task 6.3: Portfolio History Handler

- [ ] Fetch snapshots for given period
- [ ] Return formatted for charts

### Task 6.4: Frontend Portfolio Chart

- [ ] Add chart to dashboard
- [ ] Show portfolio value over time
- [ ] Period selector (1W, 1M, 3M, etc.)
- [ ] Show gain/loss for period

---

## Phase 7: Real-Time Updates (Days 15-16)

### Task 7.1: WebSocket Setup

- [ ] Install gorilla/websocket
- [ ] Create WebSocket upgrade handler
- [ ] Manage client connections map
- [ ] Handle subscribe/unsubscribe messages

### Task 7.2: Price Update Fan-Out

- [ ] Create background goroutine
- [ ] Periodically fetch prices for subscribed symbols
- [ ] Broadcast updates to subscribed clients

### Task 7.3: Frontend WebSocket Client

- [ ] Create WebSocket connection hook
- [ ] Handle reconnection on disconnect
- [ ] Update prices in state on message
- [ ] Subscribe when viewing stock/portfolio

### Task 7.4: Live Price Display

- [ ] Update prices without page refresh
- [ ] Add subtle animation on price change
- [ ] Show "live" indicator

---

## Phase 8: Polish and Optimization (Days 17-18)

### Task 8.1: Error Handling

- [ ] Create consistent error response format
- [ ] Add error boundary to frontend
- [ ] Log errors appropriately
- [ ] User-friendly error messages

### Task 8.2: Loading States

- [ ] Add skeletons to all data-fetching components
- [ ] Add loading spinners to buttons
- [ ] Disable interactions while loading

### Task 8.3: Input Validation

- [ ] Frontend validation with feedback
- [ ] Backend validation with clear errors
- [ ] Sanitize all inputs

### Task 8.4: Performance Optimization

- [ ] Add database indexes
- [ ] Optimize N+1 queries
- [ ] Add caching where beneficial
- [ ] Lazy load heavy components

### Task 8.5: Mobile Responsiveness

- [ ] Test on mobile viewport
- [ ] Fix layout issues
- [ ] Adjust touch targets

---

## Phase 9: Testing (Days 19-20)

### Task 9.1: Backend Unit Tests

- [ ] Test trading calculations
- [ ] Test validation logic
- [ ] Test average cost calculation
- [ ] Test return calculations

### Task 9.2: Backend Integration Tests

- [ ] Test auth flow
- [ ] Test trading flow
- [ ] Test portfolio calculations
- [ ] Test with database

### Task 9.3: Frontend Component Tests

- [ ] Test form validation
- [ ] Test trade modal
- [ ] Test data display

### Task 9.4: End-to-End Tests

- [ ] Test complete user journey
- [ ] Test edge cases (no holdings, etc.)

---

## Phase 10: Deployment (Days 21-22)

### Task 10.1: Production Configuration

- [ ] Secure environment variables
- [ ] Set up production database
- [ ] Configure Redis for production
- [ ] Set up HTTPS

### Task 10.2: CI/CD Pipeline

- [ ] Set up GitHub Actions
- [ ] Run tests on PR
- [ ] Auto-deploy on merge to main

### Task 10.3: Monitoring

- [ ] Add health check endpoint
- [ ] Set up basic logging
- [ ] Monitor API response times

### Task 10.4: Documentation

- [ ] Write README with setup instructions
- [ ] Document API endpoints
- [ ] Add architecture diagram

---

# Part 6: Interview Talking Points

## Technical Challenges You Solved

### 1. Rate Limiting External APIs

"The stock API had a limit of 60 requests per minute. I implemented a Redis caching layer with a 60-second TTL for quotes. This reduced API calls by 90% during high traffic while keeping data reasonably fresh."

### 2. Accurate Financial Calculations

"I had to handle average cost basis calculations correctly. When a user buys more shares of a stock they already own, I recalculate the average using a weighted formula. I used DECIMAL types in PostgreSQL to avoid floating-point precision issues."

### 3. Real-Time Price Updates

"I implemented WebSocket connections for live price updates. The server maintains a map of symbols to connected clients and uses a fan-out pattern to broadcast updates efficiently without fetching prices for every client."

### 4. Efficient Leaderboard Ranking

"Instead of querying and sorting all portfolios on every request, I used a Redis sorted set. Rankings are updated every 5 minutes by a background job, making leaderboard queries O(log n) instead of O(n log n)."

### 5. Database Transaction Safety

"All trades are executed within database transactions. If any step fails (like updating the holding after deducting cash), everything rolls back. This prevents inconsistent states like money disappearing without shares appearing."

## Architecture Decisions

### Why Go for Backend?

"Go's simplicity, strong typing, and excellent concurrency support make it ideal for a trading backend. Goroutines let me handle real-time price updates and background jobs efficiently."

### Why PostgreSQL?

"Financial data needs ACID compliance. PostgreSQL's DECIMAL type handles money precisely, and its transaction support ensures data integrity during trades."

### Why Redis?

"Three use cases: caching stock prices to avoid API rate limits, storing session data for fast auth checks, and maintaining the leaderboard as a sorted set for efficient ranking."

## What You'd Do Differently / Next Steps

- Add more sophisticated matching (price limits, stop losses)
- Implement dividend tracking
- Add social features (following traders, sharing strategies)
- Build native mobile apps
- Add paper options trading

---

# Part 7: Glossary for Beginners

| Term | Definition |
|------|------------|
| **Paper Trading** | Trading with fake money to practice without risk |
| **Portfolio** | Collection of all your investments |
| **Holding** | A specific stock you own and how many shares |
| **Share** | A single unit of ownership in a company |
| **Ticker/Symbol** | Short code for a stock (e.g., AAPL for Apple) |
| **Market Value** | Current worth of your shares (shares × current price) |
| **Average Cost** | Average price you paid per share across all purchases |
| **Gain/Loss** | Difference between current value and what you paid |
| **Return** | Percentage gain or loss on your investment |
| **Leaderboard** | Ranking of users by performance |
| **WebSocket** | Technology for real-time, two-way communication |
| **JWT** | JSON Web Token, used for authentication |
| **TTL** | Time To Live, how long cached data stays valid |
| **SQLC** | Tool that generates type-safe Go code from SQL queries |

---

# Quick Reference: File Checklist

## Backend Files to Create

```
backend/
├── main.go                          # Entry point
├── config/
│   └── config.go                    # Load environment variables
├── db/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # All tables
│   └── queries/
│       ├── users.sql                # User queries
│       ├── portfolios.sql           # Portfolio queries
│       ├── holdings.sql             # Holding queries
│       └── transactions.sql         # Transaction queries
├── handlers/
│   ├── auth.go                      # Register, Login
│   ├── portfolio.go                 # Get portfolio, history
│   ├── trades.go                    # Execute trade, get history
│   ├── stocks.go                    # Search, quote, history
│   └── leaderboard.go               # Get rankings
├── middleware/
│   └── auth.go                      # JWT validation
├── models/
│   └── models.go                    # Struct definitions
├── services/
│   ├── auth.go                      # Password hashing, JWT
│   ├── portfolio.go                 # Value calculations
│   ├── trading.go                   # Execute trades
│   ├── stocks.go                    # API integration
│   └── leaderboard.go               # Ranking logic
└── utils/
    └── response.go                  # Standard API responses
```

## Frontend Files to Create

```
frontend/src/
├── app/
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   ├── login/page.tsx               # Login form
│   ├── register/page.tsx            # Register form
│   ├── dashboard/page.tsx           # Portfolio view
│   ├── trade/[symbol]/page.tsx      # Stock detail + trade
│   ├── history/page.tsx             # Transaction history
│   └── leaderboard/page.tsx         # Rankings
├── components/
│   ├── Navbar.tsx
│   ├── PortfolioSummary.tsx
│   ├── HoldingsTable.tsx
│   ├── HoldingCard.tsx
│   ├── StockSearch.tsx
│   ├── StockChart.tsx
│   ├── TradeModal.tsx
│   ├── TransactionList.tsx
│   ├── LeaderboardTable.tsx
│   └── PriceDisplay.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePortfolio.ts
│   └── useWebSocket.ts
├── lib/
│   ├── api.ts                       # API client
│   └── utils.ts                     # Formatters, helpers
├── stores/
│   └── authStore.ts                 # Zustand store
└── types/
    └── index.ts                     # TypeScript interfaces
```

---

**Good luck with your Wealthsimple interview! 🚀**
