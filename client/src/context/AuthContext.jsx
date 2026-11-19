import { createContext, useContext, useEffect, useState } from "react";
import { api, tokenStorage } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (tokenStorage.get())
      api
        .get("/auth/me", { signal: controller.signal })
        .then((r) => {
          if (active) setUser(r.data.user);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    else setLoading(false);
    const clear = () => setUser(null);
    window.addEventListener("td:logout", clear);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("td:logout", clear);
    };
  }, []);
  async function login(email, password, remember) {
    const { data } = await api.post("/auth/login", { email, password });
    tokenStorage.set(data.token, remember);
    setUser(data.user);
    return data.user;
  }
  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
