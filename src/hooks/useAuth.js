import { useState, useEffect } from 'react';
import { getToken, setToken, clearToken, api } from '../services/api';
import { ensureMyKeyPair } from '../services/crypto';
import toast from 'react-hot-toast'; // <-- IMPORTUL PENTRU NOTIFICĂRI

export function useAuth() {
  const [token, setTokenState] = useState(getToken());
  const [meName, setMeName] = useState("");
  const [mePhone, setMePhone] = useState("");
  const [myPrivateKey, setMyPrivateKey] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.sub) setMePhone(String(payload.sub));
        if (payload?.name) setMeName(payload.name);
      } catch {}
    } else {
      setMyPrivateKey(null);
    }
  }, [token]);

  // E2EE
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token || !mePhone) return;
      try {
        const { privateKey } = await ensureMyKeyPair(token, mePhone);
        if (!cancelled) setMyPrivateKey(privateKey);
      } catch (e) {
        console.warn('[E2EE] init error', e);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [token, mePhone]);

  const login = async (phone, password, remember) => {
    try {
      const res = await api("/auth/login", { method: "POST", body: { phone, password } });
      setToken(res.access_token, remember);
      setTokenState(res.access_token);
      toast.success("Te-ai autentificat cu succes!");
    } catch (e) {
      // Afișăm eroarea primită de la backend (ex: "Parolă incorectă")
      toast.error(e.message || "Eroare la autentificare");
    }
  };

  const register = async (full_name, phone, password, remember) => {
    try {
      const res = await api("/auth/register", { method: "POST", body: { full_name, phone, password } });
      setToken(res.access_token, remember);
      setTokenState(res.access_token);
      toast.success("Contul a fost creat! Bine ai venit.");
    } catch (e) {
      toast.error(e.message || "Eroare la crearea contului");
    }
  };

  const logout = async () => {
    if (token) { 
      try { 
        await api("/auth/logout", { method: "POST", token }); 
      } catch (e) {} 
    }
    clearToken();
    setTokenState(null);
    setMePhone("");
    setMeName("");
    setMyPrivateKey(null);
  };

  return { token, meName, mePhone, myPrivateKey, login, register, logout };
}