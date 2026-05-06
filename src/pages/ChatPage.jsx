import React, { useState, useEffect } from 'react';
import { api, API_BASE } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatLastSeen } from '../services/formatters';
import ContactsArea from '../components/Contacts';
import CallsArea from '../components/CallsArea';
import MessageBubble from '../components/MessageBubble';
import EmojiPicker from '../components/EmojiPicker';

export default function ChatPage({ auth }) {
  const [leftTab, setLeftTab] = useState("contacts");
  const [contacts, setContacts] = useState([]);
  const [calls, setCalls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [hoverMsg, setHoverMsg] = useState(null);

  async function loadContacts() { 
    try { 
      const data = await api("/contacts", { token: auth.token }); 
      setContacts(data || []); 
    } catch (e) {
      console.error(e);
      auth.logout(); 
    } 
  }

  async function loadCalls() { try { const data = await api("/calls", { token: auth.token }); setCalls(data || []); } catch (e) {} }

  useEffect(() => { loadContacts(); loadCalls(); }, []);

  const chatHook = useWebSocket({ token: auth.token, selected, meName: auth.meName, contacts, loadCalls });

  useEffect(() => {
    chatHook.bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHook.messages]);

  async function handleSendFile(e) {
    const file = e.target.files[0];
    if (!file || !selected) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try { 
      const response = await fetch(`${API_BASE}/chat/upload?to_user_id=${selected.user_id}`, {
        method: "POST", headers: { "Authorization": `Bearer ${auth.token}` }, body: formData
      });
      if (!response.ok) throw new Error("Eroare");
      
      const newMsg = await response.json();
      chatHook.appendMessage(newMsg);
      e.target.value = null;
    } catch (err) { 
      console.error("Eroare upload:", err); 
    }
  }

  return (
    <div style={styles.full()}>
      
      {chatHook.incomingCall && (
        <div style={styles.callOverlay}>
          <div style={styles.incomingCallCard}>
            <div style={styles.pulsingRing}></div>
            <h2 style={{ margin: "10px 0", color: "#FFD638" }}>Apel Primit</h2>
            <p style={{ opacity: 0.8, marginBottom: 25, fontSize: 18 }}><b>{chatHook.incomingCall.caller_name}</b> te sună...</p>
            <div style={{ display: "flex", gap: 15, justifyContent: "center" }}>
              <button onClick={chatHook.acceptCall} style={{ ...styles.callBtn, background: "#34d399" }}>Acceptă</button>
              <button onClick={chatHook.rejectCall} style={{ ...styles.callBtn, background: "#ef4444", color: "white" }}>Respinge</button>
            </div>
          </div>
        </div>
      )}

      {chatHook.activeCall && (
        <div style={styles.callOverlay}>
          <div style={styles.activeCallContainer}>
            <div style={styles.callHeader}>
               <span style={styles.liveDot}></span>
               {chatHook.activeCall.status === "calling" ? `Se apelează ${chatHook.activeCall.full_name || '...'}` : `Convorbire cu ${chatHook.activeCall.full_name || ''}`}
            </div>
            <video ref={chatHook.remoteVideoRef} autoPlay playsInline style={styles.remoteVideo} />
            <video ref={chatHook.localVideoRef} autoPlay playsInline muted style={styles.localVideo} />
            <button onClick={chatHook.handleHangup} style={styles.hangupBtn}>Închide Apelul</button>
          </div>
        </div>
      )}

      <div style={styles.appFrame}>
        <div style={styles.panel}>
          <div style={styles.leftHeader}>
            <div>
              <div style={{ fontWeight: 900, color: "#FFD638", fontSize: 22, letterSpacing: 1 }}>𝗟𝗜𝗡𝗞𝗢</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Salut, {auth.meName || "utilizator"}</div>
            </div>
            <button onClick={auth.logout} style={styles.logoutBtn}>Deconectare</button>
          </div>

          <div style={{ display: "flex", padding: "0 10px" }}>
            <button onClick={() => setLeftTab("contacts")} style={styles.tab(leftTab === "contacts")}>Contacte</button>
            <button onClick={() => setLeftTab("calls")} style={styles.tab(leftTab === "calls")}>Apeluri</button>
          </div>

          <div style={{ flex: 1, overflow: "hidden" }}>
            {leftTab === "contacts" ? (
               <ContactsArea contacts={contacts} onlineMap={chatHook.onlineMap} selected={selected} onSelect={setSelected} onRefresh={loadContacts} token={auth.token} />
            ) : (
               <CallsArea calls={calls} />
            )}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.chatHeader}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{selected ? (selected.contact_name || selected.phone) : "Selectează un chat"}</div>
              
              <div style={{ fontSize: 13, color: "#34d399", fontWeight: 600, marginTop: 4, height: 18 }}>
                {selected ? (
                  chatHook.typingMap[selected.user_id] ? (
                    <span className="typing-dots" style={{ display: "flex", alignItems: "center" }}>
                      scrie <span></span><span></span><span></span>
                    </span>
                  ) : chatHook.onlineMap[selected.user_id] ? "Online" : formatLastSeen(selected.last_seen_at)
                ) : "Alege un contact pentru a începe conversația"}
              </div>

            </div>
            {selected && (
              <button onClick={chatHook.startCall} className="hover-scale" style={styles.phoneBtn}>📞</button>
            )}
          </div>

          <div style={styles.messagesArea} ref={chatHook.messagesAreaRef}>
            {selected ? (
              chatHook.messages.length > 0 ? (
                chatHook.messages.map((m) => {
                  const mine = String(m.from_user_id) !== String(selected.user_id);
                  
                  return (
                    <div key={m.message_id || Math.random()} className="msg-animate" style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", padding: "2px 0", marginBottom: 10 }}>
                      <div onMouseEnter={() => setHoverMsg(m.message_id)} onMouseLeave={() => setHoverMsg(null)} style={{ position: "relative" }}>
                        <MessageBubble m={m} mine={mine} />
                        {mine && hoverMsg === m.message_id && (
                          <button onClick={() => chatHook.deleteMessage(m.message_id)} className="hover-scale" style={styles.deleteBtn}>🗑️</button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="msg-animate" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.3 }}>
                  <div style={{ fontSize: 70, marginBottom: 15, filter: "grayscale(100%)" }}>💬</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>Fără mesaje</div>
                  <div style={{ fontSize: 14, marginTop: 5 }}>Trimite un mesaj pentru a sparge gheața.</div>
                </div>
              )
            ) : (
               <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.1 }}>
                  <div style={{ fontWeight: 900, color: "#FFD638", fontSize: 60, letterSpacing: 5 }}>𝗟𝗜𝗡𝗞𝗢</div>
               </div>
            )}
            <div ref={chatHook.bottomRef} />
          </div>

          {selected && (
            <div style={styles.composer}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setEmojiOpen(!emojiOpen)} className="hover-scale" style={styles.iconBtn}>😀</button>
                {emojiOpen && <EmojiPicker onSelectEmoji={(e) => setMsgText(t => t + e)} />}
              </div>

              <label className="hover-scale" style={{ ...styles.iconBtn, cursor: "pointer" }}>
                📎<input type="file" accept="image/*" style={{ display: "none" }} onChange={handleSendFile} />
              </label>

              <input 
                value={msgText} 
                onChange={(e) => { 
                  setMsgText(e.target.value); 
                  chatHook.sendTyping(); 
                }} 
                placeholder="Scrie un mesaj..." 
                style={styles.composerInput} 
                onKeyDown={(e) => { 
                  if (e.key === "Enter" && msgText.trim()) { 
                    e.preventDefault();
                    chatHook.sendMessage(msgText); 
                    setMsgText(""); 
                    setEmojiOpen(false); 
                  } 
                }} 
              />
              <button 
                onClick={() => { chatHook.sendMessage(msgText); setMsgText(""); setEmojiOpen(false); }} 
                className="hover-scale"
                style={{...styles.sendBtn, opacity: msgText.trim() ? 1 : 0.5}} 
                disabled={!msgText.trim()}
              >
                Trimit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  full: () => ({ 
    width: "100vw", height: "100vh", 
    background: "linear-gradient(135deg, #0B101E 0%, #1A233A 100%)", 
    display: "flex", color: "white" 
  }),
  
  appFrame: { width: "100%", height: "100%", display: "grid", gridTemplateColumns: "clamp(240px, 30vw, 350px) 1fr", gap: 24, padding: "24px", boxSizing: "border-box" },
  
  panel: { display: "flex", flexDirection: "column", background: "rgba(18, 24, 38, 0.6)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px) saturate(120%)", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" },
  
  leftHeader: { padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  logoutBtn: { padding: "8px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 13, transition: "0.2s" },
  
  tab: (active) => ({ flex: 1, padding: "16px 0", background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 15, fontWeight: active ? "600" : "400", borderBottom: active ? "2px solid #FFD638" : "2px solid transparent", opacity: active ? 1 : 0.5, transition: "0.3s" }),
  
  chatHeader: { padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", minHeight: 80, background: "rgba(0,0,0,0.1)" },
  phoneBtn: { background: "rgba(255, 214, 56, 0.15)", color: "#FFD638", border: "none", width: 44, height: 44, borderRadius: "14px", cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center" },
  
  messagesArea: { flex: 1, overflowY: "auto", padding: "24px" },
  
  composer: { padding: "16px 24px", background: "rgba(10, 14, 24, 0.4)", borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", gap: 12, alignItems: "center" },
  composerInput: { flex: 1, minWidth: 0, padding: "16px 24px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", fontSize: "15px", transition: "0.2s" },
  iconBtn: { width: 44, height: 44, background: "rgba(255,255,255,0.03)", borderRadius: "50%", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 20, display: "grid", placeItems: "center", cursor: "pointer" },
  sendBtn: { flexShrink: 0, background: "transparent", color: "#FFD638", border: "none", fontWeight: "700", fontSize: 16, cursor: "pointer", padding: "0 12px" },
  
  deleteBtn: { position: "absolute", top: -10, left: -35, width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(255,0,0,0.2)", color: "white", cursor: "pointer", fontSize: 14 },
  
  callOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(5, 8, 15, 0.9)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center" },
  incomingCallCard: { padding: 40, textAlign: "center", width: 340, background: "linear-gradient(145deg, #161e30 0%, #0a0e18 100%)", border: "1px solid rgba(255,214,56,0.4)", borderRadius: "28px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" },
  callBtn: { padding: "14px 28px", borderRadius: "24px", border: "none", fontWeight: "bold", cursor: "pointer", color: "black", fontSize: 15 },
  
  activeCallContainer: { position: "relative", width: "85%", maxWidth: "900px", height: "85%", background: "#060910", borderRadius: "32px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid rgba(255, 214, 56, 0.2)", boxShadow: "0 25px 60px rgba(0,0,0,0.8)" },
  callHeader: { position: "absolute", top: 25, left: "50%", transform: "translateX(-50%)", background: "rgba(10, 15, 25, 0.7)", padding: "10px 25px", borderRadius: 30, backdropFilter: "blur(12px)", color: "#FFD638", fontWeight: "700", zIndex: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 16 },
  liveDot: { width: 10, height: 10, background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 10px #ef4444" },
  remoteVideo: { width: "100%", height: "100%", objectFit: "cover" },
  localVideo: { position: "absolute", bottom: 30, right: 30, width: 180, height: 240, objectFit: "cover", borderRadius: "24px", border: "2px solid rgba(255,255,255,0.2)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
  hangupBtn: { position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "#ef4444", color: "white", border: "none", padding: "15px 35px", borderRadius: "30px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 20px rgba(239, 68, 68, 0.4)", transition: "0.2s" }
};