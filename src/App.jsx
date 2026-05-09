import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage';

export default function App() {
  const auth = useAuth();
  
  // Inițializăm tema din localStorage (dacă există) sau default 'dark'
  const [theme, setTheme] = useState(() => localStorage.getItem('linko-theme') || 'dark');

  // Aplicăm tema pe document și o salvăm în localStorage de fiecare dată când se schimbă
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('linko-theme', theme);
  }, [theme]);

  return (
    <>
      {/* Efectele vizuale globale (Aurora Noir) */}
      <div className="linko-ambient" />
      <div className="linko-grain" />
      
      {/* Rutarea principală bazată pe starea de autentificare */}
      {!auth.token ? (
        <Login auth={auth} theme={theme} setTheme={setTheme} />
      ) : (
        <ChatPage auth={auth} theme={theme} setTheme={setTheme} />
      )}
    </>
  );
}