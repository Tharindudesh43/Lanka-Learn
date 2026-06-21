"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type SessionUser = {
  name: string;
  email: string;
  picture: string;
};

type SessionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  login: (user: SessionUser) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Dummy user you can swap for real auth data later ───────────────────────
export const DUMMY_USER: SessionUser = {
  name: "Jane Doe",
  email: "jane@example.com",
  picture: "https://i.pravatar.cc/150?img=47",
};

type SessionProviderProps = {
  children: ReactNode;
  /** Seed with a real user from your auth provider (e.g. Auth0, NextAuth).
   *  Pass `null` (default) to start logged-out, or `DUMMY_USER` for dev. */
  initialUser?: SessionUser | null;
};

export function SessionProvider({
  children,
  initialUser = null,
}: SessionProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(false);

  const login = (newUser: SessionUser) => {
    setLoading(true);
    // Simulate async auth round-trip (replace with real auth call)
    setTimeout(() => {
      setUser(newUser);
      setLoading(false);
    }, 600);
  };

  const logout = () => {
    setLoading(true);
    setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 400);
  };

  return (
    <SessionContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

/** Call this hook anywhere inside <SessionProvider> to read/mutate the session. */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return ctx;
}