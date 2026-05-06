import { useState, useEffect } from 'react';
import { getToken, setToken, clearToken, api } from '../services/api';

export function useAuth() {
  const [token, setTokenState] = useState(getToken());
  const [meName, setMeName] = useState("");
  const [mePhone, setMePhone] = useState("");

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.sub) setMePhone(String(payload.sub));
        if (payload?.name) setMeName(payload.name);
      } catch {}
    }
  }, [token]);

  const login = async (phone, password, remember) => {
    const res = await api("/auth/login", { method: "POST", body: { phone, password } });
    setToken(res.access_token, remember);
    setTokenState(res.access_token);
  };

  const register = async (full_name, phone, password, remember) => {
    const res = await api("/auth/register", { method: "POST", body: { full_name, phone, password } });
    setToken(res.access_token, remember);
    setTokenState(res.access_token);
  };

  const logout = async () => {
    if (token) { try { await api("/auth/logout", { method: "POST", token }); } catch (e) {} }
    clearToken();
    setTokenState(null);
    setMePhone("");
    setMeName("");
  };

  return { token, meName, mePhone, login, register, logout };
}