"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiUnauthorizedError, getCurrentUser, loginUser } from "@/lib/api";
import {
  clearStoredToken,
  clearStoredUserEmail,
  getStoredToken,
  getStoredUserEmail,
  storeAuthNotice,
  storeToken,
  storeUserEmail,
} from "@/features/auth/tokenStorage";

type AuthStatus = "loading" | "authenticated" | "anonymous" | "expired";

type LoginParams = {
  email: string;
  password: string;
};

type AuthContextValue = {
  token: string | null;
  userEmail: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: (reason?: "expired") => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    getStoredUserEmail()
  );
  const [status, setStatus] = useState<AuthStatus>(() =>
    getStoredToken() ? "loading" : "anonymous"
  );

  const logout = useCallback((reason?: "expired") => {
    clearStoredToken();
    clearStoredUserEmail();
    if (reason === "expired") {
      storeAuthNotice("Session expired. Please sign in again.");
    }
    setToken(null);
    setUserEmail(null);
    setStatus(reason === "expired" ? "expired" : "anonymous");
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;

    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();

        if (!isActive) {
          return;
        }

        storeUserEmail(user.email);
        setUserEmail(user.email);
        setStatus("authenticated");
      } catch (err) {
        if (err instanceof ApiUnauthorizedError) {
          logout("expired");
          return;
        }

        if (isActive) {
          setStatus("anonymous");
        }
      }
    };

    void loadCurrentUser();

    return () => {
      isActive = false;
    };
  }, [logout, token]);

  const login = useCallback(async ({ email, password }: LoginParams) => {
    const response = await loginUser({ email, password });
    storeToken(response.access_token);
    storeUserEmail(email);
    setToken(response.access_token);
    setUserEmail(email);
    setStatus("authenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userEmail,
      status,
      isAuthenticated: status === "authenticated",
      isReady: status !== "loading",
      login,
      logout,
    }),
    [login, logout, status, token, userEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
