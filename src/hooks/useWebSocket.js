import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useE2EE } from './useE2EE';
import { useChat } from './useChat';
import { useWebRTC } from './useWebRTC';

export function useWebSocket({ token, selected, mePhone, myPrivateKey, loadCalls }) {
  const [onlineMap, setOnlineMap] = useState({});
  const wsRef = useRef(null);

  const wsUrl = useMemo(() => {
    if (!token) return null;
    const baseUrl = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000/ws";
    return `${baseUrl}?token=${encodeURIComponent(token)}`;
  }, [token]);

  const wsSend = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (payload.to_user_id) payload.to_user_id = String(payload.to_user_id);
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const e2ee = useE2EE({ token, myPrivateKey });
  
  const chat = useChat({ 
    token, selected, mePhone, wsSend, 
    decryptMessage: e2ee.decryptMessage, 
    encryptMessage: e2ee.encryptMessage 
  });

  const webrtc = useWebRTC({ wsSend, loadCalls });

  // 🔥 SOLUȚIA PENTRU STABILITATE: Salvăm metodele într-un ref ca WebSocket-ul să le citească mereu la zi, fără să picăm socket-ul.
  const handlersRef = useRef({ processChat: chat.processChatMessage, processWebRTC: webrtc.processWebRTCMessage });
  
  useEffect(() => {
    handlersRef.current = { processChat: chat.processChatMessage, processWebRTC: webrtc.processWebRTCMessage };
  }, [chat.processChatMessage, webrtc.processWebRTCMessage]);

  useEffect(() => {
    if (!wsUrl) return;
    
    // Nu permite crearea unui nou socket dacă unul e deja activ
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
    }

    let socket; let reconnectTimeout; let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => { if (isMounted) console.log("WebSocket Conectat ✅"); };

      socket.onmessage = (ev) => {
        if (!isMounted) return;
        const msg = JSON.parse(ev.data);

        if (msg.type === "user_status") {
          setOnlineMap(prev => ({ ...prev, [msg.user_id]: msg.online }));
          return;
        }

        // Apelăm funcțiile direct din referință, astfel avem starea 100% curentă
        if (['chat_message', 'chat_message_saved', 'message_deleted', 'reaction_update', 'typing'].includes(msg.type)) {
          handlersRef.current.processChat(msg);
        } else {
          handlersRef.current.processWebRTC(msg);
        }
      };

      socket.onclose = () => {
        wsRef.current = null;
        if (isMounted) reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (socket) { 
        socket.onclose = null; // Prevenim reconectarea la unmount
        socket.close(); 
        wsRef.current = null; 
      }
    };
  }, [wsUrl]); // Acum SINGURA dependență este URL-ul. 

  return {
    ...chat,
    ...webrtc,
    onlineMap,
    startCall: () => webrtc.startCall(selected)
  };
}