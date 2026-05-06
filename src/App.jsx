import React, { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import ChatPage from "./pages/ChatPage";

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
html, body, #root { height: 100%; color: white; margin: 0; background: #0b101e; overflow: hidden; }
body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

/* Efecte Premium - Animații și Interacțiuni */
@keyframes slideUpFade {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.msg-animate {
  animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.hover-scale {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.hover-scale:hover {
  transform: scale(1.08);
  filter: brightness(1.2);
}
.hover-scale:active {
  transform: scale(0.95);
}

/* Animația pentru Indicatorul "Tastare..." */
@keyframes bounceDots {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
}
.typing-dots span {
  display: inline-block;
  width: 4px;
  height: 4px;
  background-color: #34d399;
  border-radius: 50%;
  margin: 0 1px;
  animation: bounceDots 1.4s infinite ease-in-out both;
}
.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
`;

export default function App() {
  const auth = useAuth();

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = globalCss;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!auth.token) {
    return <Login auth={auth} />;
  }

  return <ChatPage auth={auth} />;
}