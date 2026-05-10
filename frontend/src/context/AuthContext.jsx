import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("access_token");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!token) return;

    // Load profile (best-effort). If backend doesn't have this route,
    // keep the minimal info from token storage.
    const load = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data?.user ?? res.data);
      } catch {
        // fallback: parse from localStorage
        try {
          const raw = localStorage.getItem("user");
          if (raw) setUser(JSON.parse(raw));
        } catch {
          // ignore
        }
      }
    };

    load();
  }, [token]);

  const login = ({ token: nextToken, username, role, user: nextUser } = {}) => {
    if (!nextToken) return;
    setToken(nextToken);

    const profile = nextUser ?? { username, role };
    setUser(profile);

    try {
      localStorage.setItem("access_token", nextToken);
      if (profile) localStorage.setItem("user", JSON.stringify(profile));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

