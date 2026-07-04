"use client";

/**
 * lib/auth.ts — Client-side auth state helper.
 *
 * Security note: tokens are stored in localStorage for time-constraint reasons.
 * In production, prefer httpOnly cookies + a Next.js middleware/session pattern
 * (e.g., next-auth or a custom edge middleware that reads a secure cookie) for
 * XSS resilience and CSRF protection. This localStorage approach is an intentional,
 * documented tradeoff, NOT an oversight.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getToken,
  setTokens,
  clearTokens,
  login as apiLogin,
  logout as apiLogout,
  getMe,
  type ApiUser,
  type ApiError,
} from "./api";

// ─── Context types ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = getToken();
    if (stored) {
      setToken(stored);
      getMe()
        .then((me) => setUser(me))
        .catch(() => {
          // Token is invalid/expired — clear it
          clearTokens();
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setTokens(data.accessToken, data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Even if the server-side logout fails, clear the local state
    }
    clearTokens();
    setToken(null);
    setUser(null);
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, token, isLoading, login, logout } },
    children
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
