"use client";

import { create } from "zustand";
import { getMe } from "@/lib/api";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isInitialized: false,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    set({ user, token, isLoading: false, isInitialized: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({ user: null, token: null });
  },

  initialize: async () => {
    // Prevent multiple initializations
    if (get().isInitialized) {
      return;
    }

    const existingToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!existingToken) {
      set({ isLoading: false, isInitialized: true });
      return;
    }

    set({ token: existingToken, isLoading: true });
    try {
      const user = await getMe();
      set({ user, isLoading: false, isInitialized: true });
    } catch {
      // Clear invalid token
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      set({ user: null, token: null, isLoading: false, isInitialized: true });
    }
  },
}));

