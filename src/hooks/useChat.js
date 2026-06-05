import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { sfx } from '../services/sfx';

export function useChat({ token, selected, mePhone, wsSend, decryptMessage, encryptMessage }) {
  const [messages, setMessages] = useState([]);
  const [typingMap, setTypingMap] = useState({});
  const bottomRef = useRef(null);
  const messagesAreaRef = useRef(null);

  useEffect(() => {
    if (selected?.user_id && token) {
      api(`/messages/${selected.user_id}`, { token }).then(async (data) => {
        const arr = data || [];
        const decrypted = await Promise.all(arr.map(m => decryptMessage(m, selected.user_id)));
        setMessages(decrypted);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 60);
      });
      wsSend({ type: "chat_read", by_user_id: selected.user_id });
    } else {
      setMessages([]);
    }
  }, [selected?.user_id, token, wsSend, decryptMessage]);

  const processChatMessage = useCallback(async (msg) => {
    if (msg.type === "chat_message") {
      if (!msg.from_user_id || String(msg.from_user_id) === "undefined") {
          msg.from_user_id = selected?.user_id; 
      }
      
      const decoded = await decryptMessage(msg, selected?.user_id);
      
      setMessages(prev => {
        // 1. Evităm duplicarea dacă mesajul cu acest ID de bază de date există deja
        if (decoded.message_id && prev.some(m => m.message_id === decoded.message_id)) return prev;

        // 2. Verificăm după client_id pentru a înlocui mesajul trimis optimist
        if (decoded.client_id) {
          const idx = prev.findIndex(m => m.client_id === decoded.client_id);
          if (idx >= 0) return prev.map((m, i) => i === idx ? { ...m, ...decoded } : m);
        }

        // 3. PLASĂ DE SIGURANȚĂ PENTRU FIȘIERE: Dacă există deja un mesaj pe ecran 
        // cu exact același URL de fișier, nu îl adăugăm din nou (previne dublarea la expeditor)
        const incomingUrl = decoded.fileUrl || decoded.file_url || decoded.url;
        if (incomingUrl) {
          const exists = prev.some(m => (m.fileUrl === incomingUrl || m.file_url === incomingUrl || m.url === incomingUrl));
          if (exists) return prev;
        }

        return [...prev, decoded];
      });
      
      if (String(msg.from_user_id) !== String(mePhone) && sfx.receive) sfx.receive();
    }
    
    if (msg.type === "chat_message_saved") {
      setMessages(prev => prev.map(m => m.client_id === msg.client_id ? { ...m, message_id: msg.message_id, created_at: msg.created_at, pending: false } : m));
    }
    if (msg.type === "message_deleted") setMessages(prev => prev.filter(m => m.message_id !== msg.message_id));
    if (msg.type === "reaction_update") setMessages(prev => prev.map(m => m.message_id === msg.message_id ? { ...m, reactions: msg.reactions } : m));
    if (msg.type === "typing") {
      const typingUser = msg.from_user_id || selected?.user_id;
      setTypingMap(prev => ({ ...prev, [typingUser]: true }));
      setTimeout(() => setTypingMap(prev => ({ ...prev, [typingUser]: false })), 3000);
    }
  }, [selected?.user_id, mePhone, decryptMessage]);

  return {
    messages, setMessages, typingMap, bottomRef, messagesAreaRef,
    sendMessage: async (text) => {
      if (!selected || !text.trim()) return;
      const clientId = 'c-' + Date.now();
      setMessages(prev => [...prev, { client_id: clientId, message_id: clientId, from_user_id: mePhone, to_user_id: selected.user_id, text, created_at: new Date().toISOString(), pending: true, reactions: [] }]);
      if (sfx.send) sfx.send();
      const payloadText = await encryptMessage(text, selected.user_id);
      wsSend({ type: 'chat_message', to_user_id: selected.user_id, text: payloadText, client_id: clientId });
    },
    reactToMessage: (messageId, emoji) => wsSend({ type: 'reaction_toggle', message_id: messageId, emoji }),
    deleteMessage: async (messageId) => { try { await api(`/messages/${messageId}`, { method: 'DELETE', token }); } catch (e) {} },
    sendTyping: () => selected?.user_id && wsSend({ type: "typing", to_user_id: selected.user_id }),
    
    // De-duplicare și la adăugarea manuală din componente externe
    appendMessage: (msg) => setMessages(prev => {
      const urlCheck = msg.fileUrl || msg.file_url || msg.url;
      if (urlCheck && prev.some(m => (m.fileUrl === urlCheck || m.file_url === urlCheck || m.url === urlCheck))) return prev;
      if (msg.client_id && prev.some(m => m.client_id === msg.client_id)) return prev;
      return [...prev, msg];
    }),
    processChatMessage
  };
}