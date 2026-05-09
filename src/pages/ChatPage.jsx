import React, { useState, useEffect, useRef } from 'react';
import { Phone, LogOut, Search, Send, Mic, MicOff, Video, VideoOff, PhoneOff, Paperclip, Smile, X, Moon, Sun, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast'; // <-- IMPORTUL PENTRU NOTIFICĂRI
import { api, API_BASE } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatLastSeen } from '../services/formatters';
import ContactsArea from '../components/Contacts';
import CallsArea from '../components/CallsArea';
import MessageBubble from '../components/MessageBubble';
import EmojiPicker from '../components/EmojiPicker';
import Logo from '../components/Logo';
import Avatar from '../components/Avatar';
import { sfx } from '../services/sfx';

export default function ChatPage({ auth, theme, setTheme }) {
  const [leftTab, setLeftTab] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [calls, setCalls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [hoverMsg, setHoverMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);

  const chatHook = useWebSocket({ 
    token: auth.token, 
    selected, 
    meName: auth.meName, 
    mePhone: auth.mePhone,
    myPrivateKey: auth.myPrivateKey,
    contacts, 
    loadCalls 
  });

  async function loadContacts() {
    try { 
      const data = await api('/contacts', { token: auth.token });
      setContacts(data || []); 
    } catch { 
      auth.logout(); 
    } finally {
      setLoading(false);
    }
  }
  
  async function loadCalls() {
    try { 
      const data = await api('/calls', { token: auth.token });
      setCalls(data || []); 
    } catch {}
  }

  useEffect(() => { loadContacts(); loadCalls(); }, []);

  useEffect(() => {
    chatHook.bottomRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHook.messages, chatHook.typingMap]);

  const handleSendFile = async (file) => {
    if (!file || !selected) return;
    
    const tempId = 'temp-file-' + Date.now();
    const tempMsg = {
      message_id: tempId,
      from_user_id: auth.mePhone || 'me',
      text: "Se trimite imaginea...",
      file_url: URL.createObjectURL(file), 
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    chatHook.appendMessage(tempMsg);
    if(sfx.send) sfx.send();

    const formData = new FormData();
    formData.append('file', file);
    try {
      const r = await fetch(`${API_BASE}/chat/upload?to_user_id=${selected.user_id}`, {
        method: 'POST', 
        headers: { Authorization: `Bearer ${auth.token}` }, 
        body: formData,
      });
      if (!r.ok) throw new Error('Eroare la server');
      const newMsg = await r.json();
      chatHook.setMessages(prev => prev.map(m => m.message_id === tempId ? newMsg : m));
    } catch (err) { 
      chatHook.setMessages(prev => prev.filter(m => m.message_id !== tempId));
      // 🔥 Notificăm utilizatorul în caz de eroare la upload
      toast.error("Eroare la trimiterea imaginii. Te rugăm să încerci din nou.");
    }
  };

  const onFileInput = (e) => {
    handleSendFile(e.target.files[0]);
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (selected) setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!selected) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleSendFile(file);
    } else {
        toast.error("Format de fișier nesuportat. Te rugăm să alegi o imagine.");
    }
  };

  const handleSendMessage = () => {
    if (msgText.trim()) {
      chatHook.sendMessage(msgText);
      setMsgText('');
      setEmojiOpen(false);
    }
  };

  const cycleTheme = () => {
    const themes = ['dark', 'light', 'cosmic'];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const filteredContacts = contacts.filter(c =>
    !search || (c.contact_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = filteredContacts.filter(c =>
    chatHook.onlineMap?.[c.user_id] !== undefined ? chatHook.onlineMap[c.user_id] : c.is_online
  ).length;

  return (
    <div style={S.app} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragging && (
        <div className="drag-overlay">
          <div style={{ background: 'var(--bg-elev-2)', padding: '20px 40px', borderRadius: 20, textAlign: 'center', border: '1px solid var(--accent)' }}>
            <Paperclip size={40} color="var(--accent)" style={{ marginBottom: 10 }} />
            <h3 style={{ margin: 0, color: 'var(--accent)' }}>Lasă imaginea aici</h3>
            <p style={{ margin: '5px 0 0', color: 'var(--text-lo)', fontSize: 14 }}>pentru a o trimite lui {selected?.contact_name}</p>
          </div>
        </div>
      )}

      {chatHook.incomingCall && (
        <CallOverlay>
          <div className="linko-panel scale-in" style={S.incomingCard}>
            <div className="pulse-yellow" style={S.callerAvatar}>
              <Avatar name={chatHook.incomingCall.caller_name} seed={chatHook.incomingCall.from_user_id} size={88} />
            </div>
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--accent)', letterSpacing: '0.12em', fontWeight: 600 }}>APEL VIDEO PRIMIT</div>
            <h2 style={{ fontFamily: "'Geist', sans-serif", fontSize: 26, margin: '8px 0 6px', letterSpacing: '-0.02em' }}>
              {chatHook.incomingCall.caller_name}
            </h2>
            <p style={{ color: 'var(--text-lo)', fontSize: 13, margin: 0, marginBottom: 28 }}>te sună acum...</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={chatHook.acceptCall} style={S.acceptBtn} className="hover-lift" data-testid="accept-call-btn">
                <Phone size={16} /> Acceptă
              </button>
              <button onClick={chatHook.rejectCall} style={S.rejectBtn} className="hover-lift" data-testid="reject-call-btn">
                <PhoneOff size={16} /> Respinge
              </button>
            </div>
          </div>
        </CallOverlay>
      )}

      {chatHook.activeCall && (
        <CallOverlay>
          <div style={S.activeCallContainer}>
            <div style={S.callTopBar}>
              <span style={S.liveDot} />
              <span style={{ fontWeight: 600 }}>
                {chatHook.activeCall.status === 'calling'
                  ? `Se apelează ${chatHook.activeCall.contact_name || chatHook.activeCall.full_name || 'Contact'}`
                  : `În convorbire — ${chatHook.activeCall.contact_name || chatHook.activeCall.full_name || 'Contact'}`}
              </span>
              <span className="linko-mono" style={S.callTimer}>LIVE</span>
            </div>
            <video ref={chatHook.remoteVideoRef} autoPlay playsInline style={S.remoteVideo} />
            {chatHook.activeCall.status === 'calling' && (
              <div style={S.callingHint}>
                <Avatar name={chatHook.activeCall.contact_name || chatHook.activeCall.full_name} seed={chatHook.activeCall.user_id} size={120} />
                <div style={{ marginTop: 20, fontSize: 14, color: 'var(--text-md)' }}>Se stabilește conexiunea...</div>
              </div>
            )}
            <video ref={chatHook.localVideoRef} autoPlay playsInline muted style={S.localVideo} />
            <div style={S.callControls}>
              <button onClick={chatHook.toggleMic} style={S.callCtrlBtn} className="hover-scale" title="Mute">
                {chatHook.isMicOn ? <Mic size={20} /> : <MicOff size={20} color="var(--red)" />}
              </button>
              <button onClick={chatHook.toggleCamera} style={S.callCtrlBtn} className="hover-scale" title="Camera off">
                {chatHook.isCamOn ? <Video size={20} /> : <VideoOff size={20} color="var(--red)" />}
              </button>
              <button onClick={chatHook.handleHangup} style={S.hangupBtn} className="hover-scale" data-testid="hangup-btn">
                <PhoneOff size={22} />
              </button>
            </div>
          </div>
        </CallOverlay>
      )}

      <div style={S.frame}>
        <aside className="linko-panel" style={S.sidebar}>
          <div style={S.sideHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Logo size={24} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={cycleTheme} style={S.iconBtnSmall} className="hover-lift" title="Schimbă tema">
                {theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Sparkles size={15} />}
              </button>
              <button onClick={auth.logout} style={S.logoutBtn} className="hover-lift" data-testid="logout-btn" title="Deconectare">
                <LogOut size={15} />
              </button>
            </div>
          </div>

          <div style={S.userRow}>
            <Avatar name={auth.meName || 'Eu'} seed={auth.mePhone || 'me'} size={42} online={true} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-hi)' }}>{auth.meName || 'utilizator'}</div>
              <div style={{ fontSize: 12, color: 'var(--mint)', fontWeight: 500 }}>● Online</div>
            </div>
          </div>

          <div style={S.searchWrap}>
            <Search size={14} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-dim)' }} />
            <input
              className="linko-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Caută..."
              style={{ paddingLeft: 38, paddingTop: 11, paddingBottom: 11, fontSize: 13 }}
              data-testid="search-input"
            />
          </div>

          <div style={S.tabsRow}>
            <button onClick={() => setLeftTab('contacts')} style={S.sideTab(leftTab === 'contacts')} data-testid="tab-contacts">
              Contacte
              <span style={S.tabBadge}>{onlineCount}</span>
            </button>
            <button onClick={() => setLeftTab('calls')} style={S.sideTab(leftTab === 'calls')} data-testid="tab-calls">
              Apeluri
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '4px 12px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 4 }}>
                    <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                      <div className="skeleton" style={{ width: '40%', height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : leftTab === 'contacts' ? (
              <ContactsArea
                contacts={filteredContacts}
                onlineMap={chatHook.onlineMap}
                selected={selected}
                onSelect={setSelected}
                onRefresh={loadContacts}
                token={auth.token}
              />
            ) : (
              <CallsArea calls={calls} />
            )}
          </div>
        </aside>

        <main className="linko-panel" style={S.main}>
          {selected ? (
            <>
              <header style={S.chatHead}>
                <Avatar
                  name={selected.contact_name || selected.phone}
                  seed={selected.user_id}
                  size={44}
                  online={chatHook.onlineMap?.[selected.user_id] ?? selected.is_online}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    {selected.contact_name || selected.phone}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 2, height: 16 }}>
                    {chatHook.onlineMap?.[selected.user_id] ?? selected.is_online
                      ? <span style={{ color: 'var(--mint)' }}>● Online</span>
                      : <span>Văzut {formatLastSeen(selected.last_seen_at)}</span>}
                  </div>
                </div>
                <button
                  onClick={chatHook.startCall}
                  className="hover-lift"
                  style={S.callBtn}
                  data-testid="start-call-btn"
                  title="Apel video"
                >
                  <Phone size={18} />
                </button>
              </header>

              <div style={S.messages} ref={chatHook.messagesAreaRef}>
                
                {/* BANNER E2EE STIL WHATSAPP */}
                <div style={S.e2eeBanner} className="scale-in">
                  🔒 Mesajele și apelurile sunt criptate end-to-end. Nimeni din afara acestui chat nu le poate citi sau asculta.
                </div>

                {chatHook.messages.length > 0 ? (
                  chatHook.messages.map(m => {
                    const mine = String(m.from_user_id) !== String(selected.user_id);
                    
                    return (
                      <div key={m.message_id || Math.random()}
                           className="msg-animate"
                           style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', padding: '2px 0', marginBottom: 6 }}>
                        <div onMouseEnter={() => setHoverMsg(m.message_id)}
                             onMouseLeave={() => setHoverMsg(null)}
                             style={{ position: 'relative', display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: '70%' }}>
                          {!mine && (
                            <Avatar name={selected.contact_name} seed={selected.user_id} size={26} />
                          )}
                          
                          <div style={{ position: 'relative' }}>
                             {hoverMsg === m.message_id && typeof m.message_id === 'number' && (
                                <div className="reaction-toolbar" style={{ [mine ? 'right' : 'left']: 0 }}>
                                    {['❤️', '😂', '👍', '🔥', '😮', '😢'].map(emoji => (
                                        <button
                                          key={emoji}
                                          onClick={() => chatHook.reactToMessage(m.message_id, emoji)}
                                          title="Reacționează"
                                          data-testid={`react-${emoji}-${m.message_id}`}
                                        >
                                          {emoji}
                                        </button>
                                    ))}
                                    {mine && (
                                      <button onClick={() => chatHook.deleteMessage(m.message_id)} title="Șterge">
                                          <X size={14} color="var(--red)" />
                                      </button>
                                    )}
                                </div>
                             )}
                             <MessageBubble m={m} mine={mine} mePhone={auth.mePhone} onReact={chatHook.reactToMessage} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={S.emptyChat} className="msg-animate">
                    <div style={{ marginBottom: 16 }}>
                      <Avatar name={selected.contact_name} seed={selected.user_id} size={64} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-md)' }}>
                      Spune-i ceva lui {(selected.contact_name || '').split(' ')[0]}
                    </div>
                  </div>
                )}
                
                {chatHook.typingMap?.[selected.user_id] && (
                  <div className="msg-animate" style={{ display: 'flex', justifyContent: 'flex-start', padding: '2px 0', marginBottom: 6, marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <Avatar name={selected.contact_name} seed={selected.user_id} size={26} />
                        <div className="typing-bubble">
                            <span/><span/><span/>
                        </div>
                      </div>
                  </div>
                )}
                <div ref={chatHook.bottomRef} />
              </div>

              <div style={S.composer}>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setEmojiOpen(!emojiOpen)} style={S.iconBtn} className="hover-scale" title="Emoji">
                    <Smile size={18} />
                  </button>
                  {emojiOpen && (
                    <EmojiPicker 
                      onSelectEmoji={(emoji) => {
                        setMsgText(prev => prev + emoji);
                        chatHook.sendTyping();
                        inputRef.current?.focus(); 
                      }} 
                    />
                  )}
                </div>
                <label style={{ ...S.iconBtn, cursor: 'pointer' }} className="hover-scale" title="Atașează imagine">
                  <Paperclip size={18} />
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileInput} />
                </label>
                <input
                  ref={inputRef}
                  value={msgText}
                  onChange={e => { setMsgText(e.target.value); chatHook.sendTyping(); }}
                  placeholder="Scrie un mesaj..."
                  style={S.composerInput}
                  className="linko-input"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="message-input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!msgText.trim()}
                  style={{ ...S.sendBtn, opacity: msgText.trim() ? 1 : 0.4 }}
                  className="hover-lift"
                  data-testid="send-btn"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={S.welcome}>
              <Logo size={56} />
              <p style={{ marginTop: 24, color: 'var(--text-lo)', fontSize: 14, maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
                Selectează un contact din partea stângă pentru a începe conversația.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CallOverlay({ children }) {
  return <div style={S.callOverlay}>{children}</div>;
}

const S = {
  app: { width: '100vw', height: '100vh', position: 'relative', zIndex: 2, color: 'var(--text-hi)' },
  frame: {
    width: '100%', height: '100%',
    display: 'grid', gridTemplateColumns: 'clamp(280px, 26vw, 380px) 1fr',
    gap: 18, padding: 18, boxSizing: 'border-box',
  },
  sidebar: { display: 'flex', flexDirection: 'column', minHeight: 0 },
  sideHead: {
    padding: '20px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logoutBtn: {
    width: 34, height: 34, borderRadius: 10,
    background: 'rgba(255,77,94,0.08)', border: '1px solid rgba(255,77,94,0.18)',
    color: '#ff8a96', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  },
  iconBtnSmall: {
    width: 34, height: 34, borderRadius: 10,
    background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
    color: 'var(--text-md)', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  },
  userRow: {
    margin: '0 16px 16px', padding: 12,
    background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
    borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center',
  },
  searchWrap: { position: 'relative', padding: '0 16px', marginBottom: 14 },
  tabsRow: {
    display: 'flex', gap: 8, padding: '0 16px 12px',
    borderBottom: '1px solid var(--border)',
  },
  sideTab: (active) => ({
    flex: 1, padding: '10px 12px', borderRadius: 10,
    background: active ? 'var(--accent-soft)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-lo)',
    border: active ? '1px solid rgba(255,214,56,0.25)' : '1px solid transparent',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.18s ease',
  }),
  tabBadge: {
    fontSize: 10, padding: '2px 8px', borderRadius: 999,
    background: 'rgba(45,212,160,0.15)', color: 'var(--mint)',
    fontWeight: 700, letterSpacing: 0.4,
  },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0 },
  chatHead: {
    padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14,
    borderBottom: '1px solid var(--border)',
    background: 'linear-gradient(180deg, var(--bg-elev-2) 0%, transparent 100%)',
  },
  callBtn: {
    width: 42, height: 42, borderRadius: 12,
    background: 'rgba(45,212,160,0.12)', border: '1px solid rgba(45,212,160,0.3)',
    color: 'var(--mint)', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  },
  messages: { flex: 1, overflowY: 'auto', padding: '24px 22px' },
  e2eeBanner: {
    background: 'rgba(255, 214, 56, 0.1)',
    color: 'var(--accent)',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 12,
    textAlign: 'center',
    border: '1px solid rgba(255, 214, 56, 0.2)',
    maxWidth: '80%',
    margin: '0 auto 24px auto',
    lineHeight: 1.5
  },
  emptyChat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%',
  },
  welcome: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  composer: {
    padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-elev-1)',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
    color: 'var(--text-md)', display: 'grid', placeItems: 'center',
    cursor: 'pointer', flexShrink: 0,
  },
  composerInput: {
    flex: 1, minWidth: 0, padding: '12px 18px', fontSize: 14,
    background: 'var(--bg-elev-2)',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 12,
    background: 'linear-gradient(180deg, #FFE26B 0%, #FFD638 100%)',
    border: '1px solid rgba(255,214,56,0.6)',
    color: '#0a0d14', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 6px 18px rgba(255,214,56,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  callOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(5,8,15,0.85)', backdropFilter: 'blur(14px)',
    zIndex: 9999, display: 'grid', placeItems: 'center',
  },
  incomingCard: {
    width: 360, padding: 36, textAlign: 'center',
    border: '1px solid rgba(255,214,56,0.3)',
  },
  callerAvatar: {
    margin: '0 auto', width: 88, height: 88, borderRadius: '50%',
    display: 'grid', placeItems: 'center',
  },
  acceptBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 18px', borderRadius: 12,
    background: 'var(--mint)', color: '#06170f', fontWeight: 700,
    border: 'none', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(45,212,160,0.35)',
  },
  rejectBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 18px', borderRadius: 12,
    background: 'var(--red)', color: '#fff', fontWeight: 700,
    border: 'none', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(255,77,94,0.35)',
  },
  activeCallContainer: {
    position: 'relative', width: '88%', maxWidth: 980, height: '85%',
    background: 'radial-gradient(circle at 50% 30%, #1a1f2e 0%, #07080c 80%)',
    borderRadius: 24, overflow: 'hidden',
    border: '1px solid rgba(255,214,56,0.18)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  callTopBar: {
    position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(15,18,24,0.7)', backdropFilter: 'blur(16px)',
    padding: '8px 18px', borderRadius: 999,
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, color: 'var(--text-md)',
    border: '1px solid var(--border)', zIndex: 10,
  },
  liveDot: {
    width: 8, height: 8, background: 'var(--red)',
    borderRadius: '50%', boxShadow: '0 0 10px var(--red)',
    animation: 'pulseRing 1.6s infinite',
  },
  callTimer: { color: 'var(--accent)', fontWeight: 600 },
  remoteVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  callingHint: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  localVideo: {
    position: 'absolute', bottom: 100, right: 24,
    width: 160, height: 220, objectFit: 'cover',
    borderRadius: 16, border: '2px solid rgba(255,255,255,0.15)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
    background: '#0a0d14',
  },
  callControls: {
    position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 14, alignItems: 'center',
  },
  callCtrlBtn: {
    width: 52, height: 52, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  },
  hangupBtn: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'var(--red)', color: 'white', border: 'none', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 12px 30px rgba(255,77,94,0.5)',
  },
};