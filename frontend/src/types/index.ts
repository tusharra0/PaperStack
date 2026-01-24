export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  cash_balance: number;
}

export interface Holding {
  id: string;
  symbol: string;
  shares: number;
  average_cost: number;
  current_price?: number;
  market_value?: number;
  gain_loss?: number;
}

export interface HoldingWithPrice extends Holding {
  current_price: number;
  market_value: number;
  gain_loss: number;
  gain_loss_percent: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  shares: number;
  price_per_share: number;
  total_amount: number;
  created_at: string;
}

export interface TradeRequest {
  symbol: string;
  type: "BUY" | "SELL";
  shares: number;
}

export interface TradeResponse {
  transaction: Transaction;
  portfolio: PortfolioResponse;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  volume: number;
  updated_at: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryResponse {
  symbol: string;
  period: string;
  history: PricePoint[];
}
export interface PortfolioResponse {
  id: string;
  cash_balance: number;
  total_value: number;
  total_return: number;
  total_return_percent: number;
  holdings: HoldingWithPrice[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  total_return_percent: number;
  total_value: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  current_user_rank?: number;
}

export interface SnapshotPoint {
  date: string;
  total_value: number;
}

export interface PortfolioHistoryResponse {
  points: SnapshotPoint[];
}

