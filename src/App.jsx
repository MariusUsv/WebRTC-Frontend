import React, { useEffect, useMemo, useRef, useState } from "react";

function getToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}
function setToken(t, remember = false) {
  if (remember) localStorage.setItem("token", t);
  sessionStorage.setItem("token", t);
}
function clearToken() {
  sessionStorage.removeItem("token");
  localStorage.removeItem("token");
}

const API_BASE = "http://127.0.0.1:8000";
async function api(path, { method = "GET", body, token } = {}) {
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
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = txt;
  }
  if (!res.ok) {
    const msg = data?.detail || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const BG_LOGIN = "/Linko.jpg";
const BG_APP = "/Linko (1).jpg";

function GlassCard({ style, children }) {
  return (
    <div
      style={{
        background: "rgba(20, 22, 24, 0.72)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const EMOJI_CATS = {
  "🙂": ["😀","😁","😂","🤣","😊","😍","😘","😉","😎","🤗","🤔","😴","😅","😇","🤩","🙃","😜","😋","😡","😭","🥶","🥵","🤯"],
  "🐶": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦄","🐝","🦋","🐢","🐬"],
  "🍔": ["🍏","🍌","🍓","🍒","🍍","🥑","🥕","🌶️","🍕","🍔","🍟","🌭","🥪","🍗","🍣","🍩","🍪","🍫","🍿","☕","🧋"],
  "⚽": ["⚽","🏀","🏈","⚾","🎾","🏐","🏓","🥊","🎮","🎧","🎸","🎹","🎬","📸","✈️","🏖️","🏆","🎉","✨","🔥"],
  "❤️": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💖","💘","💝","💯","🙏","👏","👍","👎"],
};

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
  const threshold = 120;
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

export default function App() {
  const [token, setTokenState] = useState(getToken());
  const [authMode, setAuthMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [authError, setAuthError] = useState("");

  const [mePhone, setMePhone] = useState("");
  const [meName, setMeName] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const [hoverMsg, setHoverMsg] = useState(null);

  const tokenRef = useRef(token);
  const selectedIdRef = useRef(null);
  const contactsRef = useRef(contacts);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { selectedIdRef.current = selected?.user_id ?? null; }, [selected?.user_id]);
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  const [onlineMap, setOnlineMap] = useState({});
  const lastPongRef = useRef(new Map());
  const presenceTimerRef = useRef(null);

  const wsRef = useRef(null);
  const wsReadyRef = useRef(false);
  const reconnectRef = useRef({ tries: 0, timer: null });

  const [incomingCall, setIncomingCall] = useState(null); 
  const [activeCall, setActiveCall] = useState(null); 
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const iceQueueRef = useRef([]); // AICI se vor stoca pachetele ICE ajunse prea devreme

  const bottomRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCat, setEmojiCat] = useState("🙂");
  const emojiBtnRef = useRef(null);

  useEffect(() => {
    const prev = {
      margin: document.body.style.margin,
      minHeight: document.body.style.minHeight,
      bg: document.body.style.background,
      overflow: document.body.style.overflow,
    };
    document.body.style.margin = "0";
    document.body.style.minHeight = "100vh";
    document.body.style.background = "#0f1113";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.margin = prev.margin;
      document.body.style.minHeight = prev.minHeight;
      document.body.style.background = prev.bg;
      document.body.style.overflow = prev.overflow;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!emojiOpen) return;
      if (emojiBtnRef.current?.contains(e.target)) return;
      if (document.getElementById("emoji-popover")?.contains(e.target)) return;
      setEmojiOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [emojiOpen]);

  async function doAuth() {
    setAuthError("");
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const body = authMode === "login" 
        ? { phone, password: pass } 
        : { full_name: fullName, phone, password: pass };

      const res = await api(path, { method: "POST", body });
      setToken(res.access_token, remember);
      setTokenState(res.access_token);
    } catch (e) {
      setAuthError(e?.message || "Auth error");
    }
  }

  async function logout() {
    if (tokenRef.current) {
      try { await api("/auth/logout", { method: "POST", token: tokenRef.current }); } catch (e) {}
    }
    clearToken();
    setTokenState(null);
    setMePhone("");
    setMeName("");
    setContacts([]);
    setSelected(null);
    setMessages([]);
    setOnlineMap({});
    endCall();
  }

  async function loadContacts() {
    const t = tokenRef.current;
    if (!t) return;
    const data = await api("/contacts", { token: t });
    setContacts(data || []);
  }

  async function loadMessages(otherUserId) {
    const t = tokenRef.current;
    if (!t || !otherUserId) return;
    const data = await api(`/messages/${otherUserId}`, { token: t });
    setMessages((prev) => mergeUnique(prev, data || []));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 0);
  }

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await loadContacts();
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.sub) setMePhone(String(payload.sub));
          if (payload?.name) setMeName(payload.name);
        } catch {}
      } catch (e) {
        if (e?.status === 401) {
          clearToken();
          setTokenState(null);
        }
      }
    })();
  }, [token]);

  useEffect(() => {
    if (selected?.user_id) loadMessages(selected.user_id);
    else setMessages([]);
    setEmojiOpen(false);
  }, [selected?.user_id]);

  useEffect(() => {
    if (!token || !selected?.user_id) return;
    const otherId = selected.user_id;
    const timer = setInterval(async () => {
      try {
        const data = await api(`/messages/${otherId}`, { token: tokenRef.current });
        const shouldStick = isNearBottom(messagesAreaRef.current);
        setMessages((prev) => mergeUnique(prev, data || []));
        if (shouldStick) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      } catch {}
    }, 1800);
    return () => clearInterval(timer);
  }, [token, selected?.user_id]);

  const wsUrl = useMemo(() => token ? `ws://127.0.0.1:8000/ws?token=${encodeURIComponent(token)}` : null, [token]);

  function wsSend(payload) {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  async function setupWebRTC(targetId, isCaller) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsSend({ type: "webrtc_ice", to_user_id: targetId, candidate: event.candidate });
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsSend({ type: "webrtc_offer", to_user_id: targetId, sdp: pc.localDescription });
      }

    } catch (err) {
      endCall();
    }
  }

  function endCall() {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setActiveCall(null);
    setIncomingCall(null);
    iceQueueRef.current = []; // Resetăm coada
  }

  function startCall() {
    if (!selected) return;
    setActiveCall({ ...selected, status: "calling" });
    wsSend({ type: "call_invite", to_user_id: selected.user_id, caller_name: meName });
  }

  async function acceptCall() {
    if (!incomingCall) return;
    const callerId = incomingCall.from_user_id;
    setActiveCall({ user_id: callerId, full_name: incomingCall.caller_name, status: "connected" });
    setIncomingCall(null);
    
    // Așteptăm pornirea camerei înainte de a confirma acceptul
    await setupWebRTC(callerId, false);
    wsSend({ type: "call_accept", to_user_id: callerId });
  }

  function rejectCall() {
    if (incomingCall) {
      wsSend({ type: "call_reject", to_user_id: incomingCall.from_user_id });
      setIncomingCall(null);
    }
  }

  function handleHangup() {
    if (activeCall) {
      wsSend({ type: "call_hangup", to_user_id: activeCall.user_id });
    }
    endCall();
  }

  function connectWs() {
    if (!wsUrl) return;
    try { wsRef.current?.close(); } catch {}
    wsReadyRef.current = false;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      wsReadyRef.current = true;
      reconnectRef.current.tries = 0;
      pingPresence();
    };

    ws.onmessage = async (ev) => {
      let msg = null;
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.type === "presence_pong") {
        const fromId = msg.from_user_id;
        if (typeof fromId === "number") {
          lastPongRef.current.set(fromId, Date.now());
          setOnlineMap((prev) => ({ ...prev, [fromId]: true }));
        }
        return;
      }

      if (msg.type === "call_invite") {
        setIncomingCall({ from_user_id: msg.from_user_id, caller_name: msg.caller_name || "Unknown" });
        return;
      }
      if (msg.type === "call_accept") {
        setActiveCall(prev => prev ? { ...prev, status: "connected" } : prev);
        await setupWebRTC(msg.from_user_id, true);
        return;
      }
      if (msg.type === "call_reject" || msg.type === "call_hangup") {
        endCall();
        return;
      }
      if (msg.type === "webrtc_offer") {
        if (!pcRef.current) await setupWebRTC(msg.from_user_id, false);
        if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            wsSend({ type: "webrtc_answer", to_user_id: msg.from_user_id, sdp: pcRef.current.localDescription });
            
            // Procesăm pachetele de date puse în coadă
            iceQueueRef.current.forEach(async (c) => {
                try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch(e){}
            });
            iceQueueRef.current = [];
        }
        return;
      }
      if (msg.type === "webrtc_answer" && pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        // Procesăm pachetele de date puse în coadă
        iceQueueRef.current.forEach(async (c) => {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch(e){}
        });
        iceQueueRef.current = [];
        return;
      }
      if (msg.type === "webrtc_ice" && msg.candidate) {
        if (pcRef.current && pcRef.current.remoteDescription) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch(e){}
        } else {
            // Dacă conexiunea nu e complet gata, adăugăm pachetul în coadă
            iceQueueRef.current.push(msg.candidate);
        }
        return;
      }

      const looksLikeChat = (typeof msg.text === "string") && (msg.from_user_id != null && msg.to_user_id != null);
      if (looksLikeChat || msg.type === "chat_message") {
        const selId = selectedIdRef.current;
        const newItem = {
          message_id: msg.message_id ?? `ws-${Date.now()}-${Math.random()}`,
          from_user_id: Number(msg.from_user_id),
          to_user_id: Number(msg.to_user_id),
          text: msg.text ?? "",
          created_at: msg.created_at ?? new Date().toISOString(),
        };

        if (selId && (newItem.from_user_id === selId || newItem.to_user_id === selId)) {
          const shouldStick = isNearBottom(messagesAreaRef.current);
          setMessages((prev) => mergeUnique(prev, [newItem]));
          if (shouldStick) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }
        return;
      }

      if (msg.type === "chat_delete") {
        setMessages((prev) => (prev || []).filter((m) => String(m.message_id) !== String(msg.message_id)));
      }
    };

    ws.onclose = () => {
      wsReadyRef.current = false;
      const st = reconnectRef.current;
      st.tries += 1;
      st.timer = setTimeout(() => { st.timer = null; connectWs(); }, Math.min(8000, 500 * st.tries));
    };
  }

  useEffect(() => {
    if (wsUrl) connectWs();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectRef.current.timer);
    };
  }, [wsUrl]);

  function pingPresence() {
    if (wsRef.current?.readyState === 1) {
      (contactsRef.current || []).forEach((c) => {
        wsRef.current.send(JSON.stringify({ type: "presence_ping", to_user_id: c.user_id }));
      });
    }
  }

  useEffect(() => {
    if (!token) return;
    if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
    presenceTimerRef.current = setInterval(() => {
      pingPresence();
      const now = Date.now();
      const next = {};
      (contactsRef.current || []).forEach((c) => {
        const isOnlineViaWS = (now - (lastPongRef.current.get(c.user_id) || 0)) < 12000;
        next[c.user_id] = isOnlineViaWS || c.is_online;
      });
      setOnlineMap(next);
    }, 5000);
    return () => clearInterval(presenceTimerRef.current);
  }, [token]);

  async function deleteMessage(messageId) {
    if (!selected?.user_id) return;
    setMessages((prev) => (prev || []).filter((m) => String(m.message_id) !== String(messageId)));
    try { await api(`/messages/${messageId}`, { method: "DELETE", token: tokenRef.current }); } catch (e) {}
    wsSend({ type: "chat_delete", to_user_id: selected.user_id, message_id: messageId });
  }

  async function sendMessage() {
    if (!selected?.user_id || !msgText.trim()) return;
    const txt = msgText.trim();
    setMsgText("");
    setEmojiOpen(false);

    if (wsRef.current?.readyState === 1) {
      wsSend({ type: "chat_send", to_user_id: selected.user_id, text: txt });
      return;
    }
    try { await api(`/chat/send`, { method: "POST", token: tokenRef.current, body: { to_user_id: selected.user_id, text: txt } }); } catch {}
    await loadMessages(selected.user_id);
  }

  if (!token) {
    return (
      <div style={styles.full(BG_LOGIN)}>
        <style>{globalCss}</style>
        <div style={styles.loginWrap}>
          <GlassCard style={{ width: "min(420px, 92vw)", padding: 22, marginTop: "10vh" }}>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>𝗟𝗜𝗡𝗞𝗢</div>
              <div style={{ opacity: 0.75, marginTop: 6 }}>
                {authMode === "login" ? "Welcome back" : "Create your account"}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {authMode === "register" && (
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" style={styles.input} />
              )}
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={styles.input} />
              <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" type="password" style={styles.input} />

              <label style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.9 }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>

              {authError && <div style={{ color: "#ff9a9a", fontSize: 14 }}>{authError}</div>}

              <button onClick={doAuth} style={styles.primaryBtn}>{authMode === "login" ? "Login" : "Register"}</button>
              <button onClick={() => { setAuthError(""); setAuthMode(authMode === "login" ? "register" : "login"); }} style={styles.secondaryBtn}>
                {authMode === "login" ? "I need an account" : "I already have an account"}
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.full(BG_APP)}>
      <style>{globalCss}</style>

      {incomingCall && (
        <div style={styles.callOverlay}>
          <GlassCard style={{ padding: 30, textAlign: "center", width: 320 }}>
            <h3 style={{ margin: "0 0 10px" }}>Incoming Call</h3>
            <p style={{ opacity: 0.8, marginBottom: 20 }}>{incomingCall.caller_name} is calling you...</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={acceptCall} style={{ ...styles.primaryBtn, background: "#34d399", color: "#000" }}>Accept</button>
              <button onClick={rejectCall} style={{ ...styles.primaryBtn, background: "#f87171", color: "#000" }}>Reject</button>
            </div>
          </GlassCard>
        </div>
      )}

      {activeCall && (
        <div style={styles.callOverlay}>
          <div style={{ position: "relative", width: "80%", height: "80%", background: "#000", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <video ref={localVideoRef} autoPlay playsInline muted style={{ position: "absolute", bottom: 20, right: 20, width: 160, borderRadius: 12, border: "2px solid rgba(255,255,255,0.2)" }} />
            <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(0,0,0,0.5)", padding: "8px 16px", borderRadius: 20 }}>
               {activeCall.status === "calling" ? `Calling ${activeCall.contact_name || activeCall.phone}...` : `In Call with ${activeCall.contact_name || activeCall.phone}`}
            </div>
            <button onClick={handleHangup} style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#f87171", color: "#000", border: "none", padding: "12px 24px", borderRadius: 24, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              End Call
            </button>
          </div>
        </div>
      )}

      <div style={styles.appFrame}>
        <GlassCard style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ fontWeight: 800, letterSpacing: 1, whiteSpace: "nowrap" }}>𝗟𝗜𝗡𝗞𝗢</div>
              <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {meName ? `Salut, ${meName}` : (mePhone ? `+${mePhone}` : "Online")}
              </div>
            </div>
            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          </div>

          <ContactsArea
            contacts={contacts}
            onlineMap={onlineMap}
            selected={selected}
            onSelect={(c) => setSelected(c)}
            onRefresh={loadContacts}
            token={token}
          />
        </GlassCard>

        <GlassCard style={styles.rightPanel}>
          <div style={styles.chatHeader}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selected ? (selected.contact_name || selected.phone) : "Select a contact"}
              </div>
              {selected ? (
                <div style={{ fontSize: 12, opacity: 0.75 }}>{onlineMap[selected.user_id] ? "online" : "offline"}</div>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.65 }}>Choose someone from the left to start chatting</div>
              )}
            </div>

            {selected && onlineMap[selected.user_id] && (
              <button onClick={startCall} style={{ ...styles.smallBtn, padding: "8px 12px", fontSize: 16 }} title="Video Call">
                📞
              </button>
            )}
          </div>

          <div style={styles.messagesArea} ref={messagesAreaRef}>
            {selected ? (
              messages.map((m) => {
                const mine = m.from_user_id !== selected.user_id;
                return (
                  <div key={messageKey(m)} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", padding: "2px 0" }}>
                    <div onMouseEnter={() => setHoverMsg(messageKey(m))} onMouseLeave={() => setHoverMsg(null)} style={{ position: "relative", display: "inline-block" }}>
                      <div style={{ ...styles.bubble, ...(mine ? styles.bubbleMine : styles.bubbleTheirs) }}>
                        {m.text}
                      </div>
                      {mine && hoverMsg === messageKey(m) && m.message_id && (
                        <button type="button" title="Delete" onClick={() => deleteMessage(m.message_id)} style={styles.deleteBtn}>🗑️</button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ opacity: 0.75, padding: 18 }}>Pick a contact to open the chat.</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={styles.composer}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <button ref={emojiBtnRef} type="button" style={styles.emojiBtn} onClick={() => setEmojiOpen(!emojiOpen)} disabled={!selected}>🙂</button>
              {emojiOpen && selected && (
                <div id="emoji-popover" style={styles.emojiPopover}>
                  <div style={styles.emojiTabs}>
                    {Object.keys(EMOJI_CATS).map((k) => (
                      <button key={k} type="button" onClick={() => setEmojiCat(k)} style={{ ...styles.emojiTab, ...(emojiCat === k ? styles.emojiTabActive : null) }}>{k}</button>
                    ))}
                  </div>
                  <div style={styles.emojiGrid}>
                    {(EMOJI_CATS[emojiCat] || []).map((e) => (
                      <button key={e} type="button" style={styles.emojiItem} onClick={() => setMsgText((t) => t + e)}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder={selected ? "Write a message..." : "Select a contact first"}
              style={styles.composerInput}
              disabled={!selected}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button onClick={sendMessage} style={styles.sendBtn} disabled={!selected || !msgText.trim()}>Send</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ContactsArea({ contacts, onlineMap, selected, onSelect, onRefresh, token }) {
  const [addPhone, setAddPhone] = useState("");
  const [addName, setAddName] = useState("");
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  async function addContact(e) {
    e.preventDefault();
    setErr("");
    const phone = addPhone.trim();
    const name = addName.trim();
    if (!phone || !name) return;
    try {
      await api("/contacts", { method: "POST", token, body: { phone, contact_name: name } });
      setAddPhone("");
      setAddName("");
      await onRefresh();
    } catch (e2) {
      setErr(e2?.message || "Failed to add");
    }
  }

  async function updateContact(e, id) {
    e.preventDefault();
    const name = editName.trim();
    if (!name) return;
    try {
      await api(`/contacts/${id}`, { method: "PUT", token, body: { contact_name: name } });
      setEditingId(null);
      setEditName("");
      await onRefresh();
    } catch (e2) {
      setErr(e2?.message || "Failed to update");
    }
  }

  async function removeContact(e, id) {
    e.stopPropagation();
    try {
      await api(`/contacts/${id}`, { method: "DELETE", token });
      await onRefresh();
      if (selected && selected.id === id) {
        onSelect(null);
      }
    } catch (e2) {
      setErr(e2?.message || "Failed to delete");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "12px 12px 10px" }}>
        <div style={{ fontWeight: 700, marginBottom: 8, opacity: 0.9 }}>Contacts</div>
        <form onSubmit={addContact} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Name..."
            style={styles.inputSmall}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              placeholder="Phone..."
              style={{ ...styles.inputSmall, flex: 1 }}
            />
            <button type="submit" style={styles.smallBtn}>Add</button>
          </div>
        </form>
        {err && <div style={{ color: "#ff9a9a", marginTop: 8, fontSize: 13 }}>{err}</div>}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 6px 12px" }}>
        {contacts.length === 0 && <div style={{ opacity: 0.75, padding: 12 }}>No contacts yet.</div>}
        {contacts.map((c) => {
          const isSel = selected?.user_id === c.user_id;
          const isOnline = onlineMap[c.user_id] !== undefined ? onlineMap[c.user_id] : c.is_online;
          
          if (editingId === c.id) {
            return (
              <form key={c.id} onSubmit={(e) => updateContact(e, c.id)} style={{ padding: "10px 12px", background: "rgba(30, 32, 35, 0.8)", borderRadius: 14, marginTop: 8, display: "flex", gap: 8 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...styles.inputSmall, flex: 1 }} autoFocus />
                <button type="submit" style={styles.smallBtn}>Save</button>
                <button type="button" onClick={() => setEditingId(null)} style={{ ...styles.smallBtn, background: "rgba(255,255,255,0.1)" }}>X</button>
              </form>
            );
          }

          return (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)", background: isSel ? "rgba(255, 214, 56, 0.16)" : "rgba(30, 32, 35, 0.55)",
                color: "white", marginTop: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 999, background: isOnline ? "#34d399" : "rgba(255,255,255,0.22)", boxShadow: isOnline ? "0 0 12px rgba(52,211,153,0.6)" : "none", flex: "0 0 auto" }} />
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.contact_name}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{isOnline ? "online" : "offline"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={(e) => { e.stopPropagation(); setEditName(c.contact_name); setEditingId(c.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>✏️</button>
                <button onClick={(e) => removeContact(e, c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
* { box-sizing: border-box; }
html, body, #root { height: 100%; color: white; }
body { font-family: Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
`;

const styles = {
  full: (bgUrl) => ({
    width: "100vw", height: "100vh", backgroundImage: `url('${bgUrl}')`,
    backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", display: "flex", color: "white"
  }),
  callOverlay: {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 99999,
    display: "flex", justifyContent: "center", alignItems: "center"
  },
  loginWrap: { flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "18px" },
  appFrame: { width: "100%", height: "100%", display: "grid", gridTemplateColumns: "minmax(300px, 360px) 1fr", gap: 18, padding: "18px 22px" },
  leftPanel: { height: "100%", display: "flex", flexDirection: "column", minHeight: 0, padding: 0, marginLeft: "1.0vw", width: "min(360px, 32vw)" },
  rightPanel: { height: "100%", display: "flex", flexDirection: "column", minHeight: 0, padding: 0, marginRight: "1.2vw" },
  leftHeader: { padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 },
  logoutBtn: { padding: "9px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(40,42,45,0.75)", color: "white", cursor: "pointer", fontWeight: 800, whiteSpace: "nowrap" },
  chatHeader: { padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.10)", display: "flex", alignItems: "center", gap: 12 },
  messagesArea: { flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px" },
  composer: { borderTop: "1px solid rgba(255,255,255,0.10)", padding: 12, display: "flex", gap: 10, alignItems: "center", background: "rgba(20, 22, 24, 0.72)", flex: "0 0 auto" },
  composerInput: { flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(40, 42, 45, 0.82)", color: "white", outline: "none" },
  emojiBtn: { width: 42, height: 42, padding: 0, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(40, 42, 45, 0.82)", color: "white", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "1" },
  emojiPopover: { position: "absolute", bottom: 52, left: 0, width: 320, maxWidth: "78vw", padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(20,22,24,0.95)", backdropFilter: "blur(10px)", zIndex: 9999 },
  emojiTabs: { display: "flex", gap: 6, marginBottom: 8 },
  emojiTab: { padding: "6px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(40,42,45,0.55)", color: "white", cursor: "pointer", fontSize: 14 },
  emojiTabActive: { background: "rgba(255, 214, 56, 0.18)", border: "1px solid rgba(255, 214, 56, 0.25)" },
  emojiGrid: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 },
  emojiItem: { width: "100%", aspectRatio: "1 / 1", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(40,42,45,0.65)", color: "white", cursor: "pointer", fontSize: 18, display: "grid", placeItems: "center" },
  sendBtn: { padding: "11px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255, 214, 56, 0.22)", color: "white", cursor: "pointer", fontWeight: 800, letterSpacing: 0.4, whiteSpace: "nowrap" },
  input: { width: "100%", padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(40, 42, 45, 0.8)", color: "white", outline: "none", fontSize: 15 },
  inputSmall: { width: "100%", padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(40, 42, 45, 0.8)", color: "white", outline: "none", fontSize: 13 },
  primaryBtn: { width: "100%", padding: "12px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255, 214, 56, 0.24)", color: "white", cursor: "pointer", fontWeight: 800, letterSpacing: 0.4 },
  secondaryBtn: { width: "100%", padding: "11px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(40, 42, 45, 0.7)", color: "white", cursor: "pointer", fontWeight: 700 },
  smallBtn: { padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255, 214, 56, 0.22)", color: "white", cursor: "pointer", fontWeight: 800, fontSize: 13 },
  bubble: { maxWidth: "72%", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(40,42,45,0.72)", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#ffffff" },
  bubbleMine: { background: "rgba(255, 214, 56, 0.18)" },
  bubbleTheirs: { background: "rgba(40,42,45,0.72)" },
  deleteBtn: { position: "absolute", top: -8, right: -10, width: 30, height: 30, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(20,22,24,0.95)", color: "white", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 14 },
};