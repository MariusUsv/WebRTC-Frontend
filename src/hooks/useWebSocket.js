import { useEffect, useRef, useState, useMemo } from 'react';
import { api } from '../services/api';

function messageKey(m) {
  if (m?.message_id != null) return String(m.message_id);
  return `${m.from_user_id ?? ""}|${m.to_user_id ?? ""}|${m.created_at ?? ""}|${m.text ?? ""}`;
}

function mergeUnique(prev, incoming) {
  const map = new Map();
  (prev || []).forEach((m) => map.set(messageKey(m), m));
  (incoming || []).forEach((m) => map.set(messageKey(m), m));
  const out = Array.from(map.values());
  out.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  return out;
}

function isNearBottom(el) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
}

export function useWebSocket({ token, selected, meName, contacts, loadCalls }) {
  const [messages, setMessages] = useState([]);
  const [onlineMap, setOnlineMap] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  
  const [typingMap, setTypingMap] = useState({});

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const reconnectRef = useRef({ tries: 0, timer: null });
  const iceQueueRef = useRef([]);
  const lastPongRef = useRef(new Map());
  
  const typingTimeoutRef = useRef(new Map());
  const lastTypingSentRef = useRef(0);
  
  const callStateRef = useRef("idle");
  const selectedIdRef = useRef(null);
  const contactsRef = useRef(contacts);
  
  useEffect(() => { selectedIdRef.current = selected?.user_id ?? null; }, [selected?.user_id]);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  const wsUrl = useMemo(() => token ? `ws://127.0.0.1:8000/ws?token=${encodeURIComponent(token)}` : null, [token]);

  function wsSend(payload) {
    if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify(payload));
  }

  function sendTyping() {
    if (!selectedIdRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
        wsSend({ type: "typing", to_user_id: selectedIdRef.current });
        lastTypingSentRef.current = now;
    }
  }

  async function setupWebRTC(targetId, isCaller) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:127.0.0.1:3479" }] });
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.ontrack = (event) => { if (remoteVideoRef.current && event.streams[0]) remoteVideoRef.current.srcObject = event.streams[0]; };
      pc.onicecandidate = (event) => { if (event.candidate) wsSend({ type: "webrtc_ice", to_user_id: targetId, candidate: event.candidate }); };
      if (isCaller) {
        const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
        wsSend({ type: "webrtc_offer", to_user_id: targetId, sdp: pc.localDescription });
      }
    } catch (err) { endCall(); }
  }

  function endCall() {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    setActiveCall(null); 
    setIncomingCall(null); 
    iceQueueRef.current = [];
    callStateRef.current = "idle";
    if(loadCalls) loadCalls();
  }

  function startCall() {
    if (!selected || callStateRef.current !== "idle") return;
    callStateRef.current = "calling";
    setActiveCall({ ...selected, status: "calling" });
    wsSend({ type: "call_invite", to_user_id: selected.user_id, caller_name: meName });
  }

  async function acceptCall() {
    if (!incomingCall) return;
    callStateRef.current = "connected";
    const callerId = incomingCall.from_user_id;
    setActiveCall({ user_id: callerId, full_name: incomingCall.caller_name, status: "connected" });
    setIncomingCall(null);
    await setupWebRTC(callerId, false);
    wsSend({ type: "call_accept", to_user_id: callerId });
  }

  function rejectCall() { 
      if (incomingCall) { wsSend({ type: "call_reject", to_user_id: incomingCall.from_user_id }); }
      endCall(); 
  }
  
  function handleHangup() { 
      if (activeCall) wsSend({ type: "call_hangup", to_user_id: activeCall.user_id }); 
      endCall(); 
  }

  function connectWs() {
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl); 
    wsRef.current = ws;
    
    ws.onopen = () => { reconnectRef.current.tries = 0; pingPresence(); };

    ws.onmessage = async (ev) => {
      let msg = null; try { msg = JSON.parse(ev.data); } catch { return; }
      
      if (msg.type === "presence_pong") {
        if (typeof msg.from_user_id === "number") { 
            lastPongRef.current.set(msg.from_user_id, Date.now()); 
            setOnlineMap((prev) => ({ ...prev, [msg.from_user_id]: true })); 
        } 
        return;
      }
      
      if (msg.type === "typing") {
        setTypingMap((prev) => ({ ...prev, [msg.from_user_id]: true }));
        if (typingTimeoutRef.current.has(msg.from_user_id)) {
            clearTimeout(typingTimeoutRef.current.get(msg.from_user_id));
        }
        const timer = setTimeout(() => {
            setTypingMap((prev) => ({ ...prev, [msg.from_user_id]: false }));
        }, 3000);
        typingTimeoutRef.current.set(msg.from_user_id, timer);
        return;
      }
      
      if (msg.type === "call_invite") { 
          if (callStateRef.current !== "idle") {
              wsSend({ type: "call_reject", to_user_id: msg.from_user_id }); 
              return;
          }
          callStateRef.current = "incoming";
          setIncomingCall({ from_user_id: msg.from_user_id, caller_name: msg.caller_name || "Apelant necunoscut" }); 
          return; 
      }

      if (msg.type === "call_accept") { 
          callStateRef.current = "connected"; 
          setActiveCall(prev => prev ? { ...prev, status: "connected" } : prev); 
          await setupWebRTC(msg.from_user_id, true); 
          return; 
      }
      
      if (msg.type === "call_reject" || msg.type === "call_hangup") { endCall(); return; }
      
      if (msg.type === "webrtc_offer") {
        if (!pcRef.current) await setupWebRTC(msg.from_user_id, false);
        if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pcRef.current.createAnswer(); await pcRef.current.setLocalDescription(answer);
            wsSend({ type: "webrtc_answer", to_user_id: msg.from_user_id, sdp: pcRef.current.localDescription });
            iceQueueRef.current.forEach(async (c) => { try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch(e){} }); iceQueueRef.current = [];
        } return;
      }
      if (msg.type === "webrtc_answer" && pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        iceQueueRef.current.forEach(async (c) => { try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch(e){} }); iceQueueRef.current = []; return;
      }
      if (msg.type === "webrtc_ice" && msg.candidate) {
        if (pcRef.current && pcRef.current.remoteDescription) { try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch(e){} } 
        else { iceQueueRef.current.push(msg.candidate); } return;
      }

      if (msg.type === "chat_message") {
        const selId = selectedIdRef.current;
        const newItem = { message_id: msg.message_id, from_user_id: Number(msg.from_user_id), to_user_id: Number(msg.to_user_id), text: msg.text ?? "", file_url: msg.file_url, is_file: msg.is_file, is_read: msg.is_read || false, created_at: msg.created_at ?? new Date().toISOString() };
        
        setTypingMap((prev) => ({ ...prev, [msg.from_user_id]: false }));

        if (selId && (newItem.from_user_id === selId || newItem.to_user_id === selId)) {
          setMessages((prev) => mergeUnique(prev, [newItem]));
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          if (newItem.from_user_id === selId) wsSend({ type: "chat_read", by_user_id: selId });
        } return;
      }
      if (msg.type === "chat_delete") { setMessages((prev) => (prev || []).filter((m) => String(m.message_id) !== String(msg.message_id))); }
    };

    ws.onclose = () => { 
       const st = reconnectRef.current; 
       st.tries += 1; 
       st.timer = setTimeout(() => { st.timer = null; connectWs(); }, Math.min(8000, 500 * st.tries)); 
    };
  }

 useEffect(() => { 
      let isMounted = true;
      let initTimer = null;

      if (wsUrl) {
          // Punem o întârziere de o fracțiune de secundă pentru a "fenta" React Strict Mode
          initTimer = setTimeout(() => {
              if (isMounted) connectWs();
          }, 50);
      }

      return () => { 
          isMounted = false;
          if (initTimer) clearTimeout(initTimer);

          if (wsRef.current) {
              wsRef.current.onclose = null; 
              // Dacă e încă în stadiul de conectare (0), browserul va da eroarea aia, 
              // așa că îl lăsăm să moară liniștit. Îl închidem activ doar dacă era deja deschis (1).
              if (wsRef.current.readyState === 1 || wsRef.current.readyState === 0) {
                  wsRef.current.close();
              }
          }
          clearTimeout(reconnectRef.current.timer); 
      }; 
  }, [wsUrl]);

  function pingPresence() { if (wsRef.current?.readyState === 1) { (contactsRef.current || []).forEach((c) => { wsRef.current.send(JSON.stringify({ type: "presence_ping", to_user_id: c.user_id })); }); } }
  
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      pingPresence(); const now = Date.now(); const next = {};
      (contactsRef.current || []).forEach((c) => { next[c.user_id] = (now - (lastPongRef.current.get(c.user_id) || 0)) < 12000 || c.is_online; });
      setOnlineMap(next);
    }, 5000);
    return () => clearInterval(timer);
  }, [token]);

  useEffect(() => {
    if (selected?.user_id) {
      api(`/messages/${selected.user_id}`, { token }).then(data => {
        setMessages((prev) => mergeUnique(prev, data || []));
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
      });
      wsSend({ type: "chat_read", by_user_id: selected.user_id });
    } else { setMessages([]); }
  }, [selected?.user_id]);

  useEffect(() => {
    if (!token || !selected?.user_id) return;
    const timer = setInterval(async () => {
      try {
        const data = await api(`/messages/${selected.user_id}`, { token });
        const shouldStick = isNearBottom(messagesAreaRef.current);
        setMessages((prev) => mergeUnique(prev, data || []));
        if (shouldStick) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch {}
    }, 1800);
    return () => clearInterval(timer);
  }, [token, selected?.user_id]);

  async function deleteMessage(messageId) {
    if (!selected?.user_id) return;
    setMessages((prev) => (prev || []).filter((m) => String(m.message_id) !== String(messageId)));
    try { await api(`/messages/${messageId}`, { method: "DELETE", token }); } catch (e) {}
    wsSend({ type: "chat_delete", to_user_id: selected.user_id, message_id: messageId });
  }

  function appendMessage(msg) {
    setMessages((prev) => mergeUnique(prev, [msg]));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function sendMessage(text) {
    if (!selected?.user_id || !text.trim()) return;
    try { 
      const msgData = await api(`/chat/send`, { method: "POST", token, body: { to_user_id: selected.user_id, text: text } }); 
      appendMessage(msgData);
    } catch {}
  }

  return { messages, onlineMap, incomingCall, activeCall, localVideoRef, remoteVideoRef, bottomRef, messagesAreaRef, startCall, acceptCall, rejectCall, handleHangup, deleteMessage, sendMessage, appendMessage, typingMap, sendTyping };
}