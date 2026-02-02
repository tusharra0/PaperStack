import axios from "axios";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PortfolioResponse,
  StockHistoryResponse,
  StockQuote,
  SearchResult,
  TradeRequest,
  TradeResponse,
  TransactionListResponse,
  User,
  LeaderboardResponse,
  PortfolioHistoryResponse,
  WatchlistResponse,
  WatchlistItemWithPrice,
  BadgesResponse,
  CheckBadgesResponse,
  TradeStats,
} from "@/types";

export type ApiError = {
  message: string;
  code?: string;
  status?: number;
  details?: any;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  timeout: 15000,
});

// Attach JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Normalize errors into a typed shape.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const apiError: ApiError = {
      message: data?.error?.message || error.message || "Network error",
      code: data?.error?.code,
      status,
      details: data?.error?.details,
    };
    return Promise.reject(apiError);
  }
);

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/api/auth/register", data);
  return res.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/api/auth/login", data);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get<User>("/api/auth/me");
  return res.data;
};

export const getPortfolio = async (): Promise<PortfolioResponse> => {
  const res = await api.get<PortfolioResponse>("/api/portfolio");
  return res.data;
};

export const getPortfolioHistory = async (
  period: string
): Promise<PortfolioHistoryResponse> => {
  const res = await api.get<PortfolioHistoryResponse>("/api/portfolio/history", {
    params: { period },
  });
  return res.data;
};

export const getLeaderboard = async (
  limit = 50
): Promise<LeaderboardResponse> => {
  const res = await api.get<LeaderboardResponse>("/api/leaderboard", {
    params: { limit },
  });
  return res.data;
};

export const searchStocks = async (query: string): Promise<SearchResult[]> => {
  const res = await api.get<SearchResult[]>("/api/stocks/search", {
    params: { q: query },
  });
  return res.data;
};

export const getStockQuote = async (symbol: string): Promise<StockQuote> => {
  const res = await api.get<StockQuote>(`/api/stocks/${symbol}`);
  return res.data;
};

export const getStockHistory = async (
  symbol: string,
  period: string
): Promise<StockHistoryResponse> => {
  const res = await api.get<StockHistoryResponse>(
    `/api/stocks/${symbol}/history`,
    { params: { period } }
  );
  return res.data;
};

export const executeTrade = async (
  data: TradeRequest
): Promise<TradeResponse> => {
  const res = await api.post<TradeResponse>("/api/trades", data);
  return res.data;
};

export const getTransactions = async (params?: {
  limit?: number;
  offset?: number;
  symbol?: string;
}): Promise<TransactionListResponse> => {
  const res = await api.get<TransactionListResponse>("/api/trades", {
    params,
  });
  return res.data;
};

// Watchlist
export const getWatchlist = async (): Promise<WatchlistResponse> => {
  const res = await api.get<WatchlistResponse>("/api/watchlist");
  return res.data;
};

export const addToWatchlist = async (
  symbol: string
): Promise<WatchlistItemWithPrice> => {
  const res = await api.post<WatchlistItemWithPrice>("/api/watchlist", {
    symbol,
  });
  return res.data;
};

export const removeFromWatchlist = async (symbol: string): Promise<void> => {
  await api.delete(`/api/watchlist/${symbol}`);
};

export const isWatched = async (
  symbol: string
): Promise<{ watched: boolean }> => {
  const res = await api.get<{ watched: boolean }>(`/api/watchlist/${symbol}`);
  return res.data;
};

// Badges
export const getBadges = async (): Promise<BadgesResponse> => {
  const res = await api.get<BadgesResponse>("/api/badges");
  return res.data;
};

export const checkBadges = async (): Promise<CheckBadgesResponse> => {
  const res = await api.post<CheckBadgesResponse>("/api/badges/check");
  return res.data;
};

// Trade Stats
export const getTradeStats = async (): Promise<TradeStats> => {
  const res = await api.get<TradeStats>("/api/stats");
  return res.data;
};

export default api;

