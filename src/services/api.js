export const API_BASE = "http://127.0.0.1:8000";

export function getToken() {
  // Returnează jetonul DOAR din memoria temporară a tab-ului curent
  return sessionStorage.getItem("token");
}

export function setToken(t, remember = false) {
  // Indiferent de setări, ținem jetonul doar temporar pentru sesiunea curentă
  sessionStorage.setItem("token", t);
}

export function clearToken() {
  // Ștergem tot la deconectare
  sessionStorage.removeItem("token");
  localStorage.removeItem("token"); // Am lăsat asta aici ca să omoare "fantomele" vechi
}

export async function api(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  
  if (!res.ok) {
    const err = new Error(data?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}