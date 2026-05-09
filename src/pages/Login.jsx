import React, { useState } from 'react';
import { Phone, ArrowRight, Sparkles, ShieldCheck, Moon, Sun } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login({ auth, theme, setTheme }) {
  const [authMode, setAuthMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(true);
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!phone || !pass) return;
    setAuthError('');
    setBusy(true);
    try {
      if (authMode === 'login') await auth.login(phone, pass, remember);
      else await auth.register(fullName, phone, pass, remember);
    } catch (e) {
      setAuthError(e?.message || 'Eroare la autentificare');
    } finally {
      setBusy(false);
    }
  }

  const cycleTheme = () => {
    const themes = ['dark', 'light', 'cosmic'];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  return (
    <div style={S.wrap}>
      {/* LEFT — brand panel */}
      <div style={S.brandPane}>
        <div style={S.brandTop}>
          <Logo size={36} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
             <button onClick={cycleTheme} style={S.themeBtn} className="hover-lift">
                {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Sparkles size={16} />}
             </button>
             <span className="linko-tag">v1.0 · BETA</span>
          </div>
        </div>

        <div style={S.brandHero}>
          <div style={S.eyebrow}>
            <Sparkles size={12} /> APELURI & MESAJE END-TO-END
          </div>
          <h1 style={S.heroTitle}>
            Vorbește cu lumea ta.<br />
            <span style={{ color: 'var(--accent)' }}>În liniște.</span>
          </h1>
          <p style={S.heroLead}>
            Mesagerie criptată, apeluri video peer-to-peer, fără reclame, fără urmăritori.
            Doar tu, prietenii tăi și o conexiune curată.
          </p>

          <div style={S.featGrid}>
            <Feature icon={<Phone size={16} />} title="Apeluri video P2P" desc="WebRTC direct, fără server intermediar." />
            <Feature icon={<ShieldCheck size={16} />} title="Mesaje sigure" desc="Token JWT, sesiuni izolate per tab." />
            <Feature icon={<Sparkles size={16} />} title="Status în timp real" desc='"Online", "scrie...", citit — totul live.' />
          </div>
        </div>

        <div style={S.brandFooter}>
          <span>© 2026 LINKO</span>
          <span>·</span>
          <span>built in Suceava</span>
        </div>
      </div>

      {/* RIGHT — auth panel */}
      <div style={S.authPane}>
        <div className="linko-panel scale-in" style={S.card}>
          <div style={S.cardHead}>
            <div style={S.tabs}>
              <button
                onClick={() => { setAuthError(''); setAuthMode('login'); }}
                style={S.tab(authMode === 'login')}
                data-testid="tab-login"
              >Autentificare</button>
              <button
                onClick={() => { setAuthError(''); setAuthMode('register'); }}
                style={S.tab(authMode === 'register')}
                data-testid="tab-register"
              >Cont nou</button>
            </div>
            <h2 style={S.cardTitle}>
              {authMode === 'login' ? 'Bine ai revenit' : 'Hai să facem cunoștință'}
            </h2>
            <p style={S.cardSub}>
              {authMode === 'login'
                ? 'Conectează-te ca să-ți reiei conversațiile.'
                : 'Creează-ți contul în 30 de secunde.'}
            </p>
          </div>

          <div style={S.form}>
            {authMode === 'register' && (
              <Field label="Nume complet">
                <input
                  className="linko-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Marius Pop"
                  data-testid="login-fullname-input"
                />
              </Field>
            )}
            <Field label="Număr de telefon">
              <input
                className="linko-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                data-testid="login-phone-input"
              />
            </Field>
            <Field label="Parolă">
              <input
                className="linko-input"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                data-testid="login-password-input"
              />
            </Field>

            <label style={S.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              <span>Ține-mă conectat pe acest dispozitiv</span>
            </label>

            {authError && (
              <div style={S.error} className="msg-animate" data-testid="login-error">
                {authError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={busy}
              style={S.primaryBtn}
              className="hover-lift"
              data-testid="login-submit-button"
            >
              <span>{busy ? 'Se procesează...' : (authMode === 'login' ? 'Intră în cont' : 'Creează cont')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-lo)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'var(--accent-soft)',
        border: '1px solid var(--border-strong)',
        color: 'var(--accent)',
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    width: '100vw', height: '100vh', display: 'grid',
    gridTemplateColumns: '1fr 1fr', position: 'relative', zIndex: 2,
    color: 'var(--text-hi)',
  },
  brandPane: {
    padding: '48px 56px', display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', position: 'relative',
    borderRight: '1px solid var(--border)',
  },
  brandTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  themeBtn: {
    width: 36, height: 36, borderRadius: 10,
    background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
    color: 'var(--text-hi)', display: 'grid', placeItems: 'center',
    cursor: 'pointer'
  },
  brandHero: { maxWidth: 480 },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
    color: 'var(--text-lo)', marginBottom: 24,
  },
  heroTitle: {
    fontFamily: "'Geist', 'Inter', sans-serif",
    fontSize: 'clamp(40px, 5vw, 64px)',
    fontWeight: 700, letterSpacing: '-0.04em',
    lineHeight: 1.04, margin: 0, marginBottom: 24,
  },
  heroLead: {
    fontSize: 15, lineHeight: 1.6, color: 'var(--text-md)',
    margin: 0, marginBottom: 40, maxWidth: 420,
  },
  featGrid: { display: 'grid', gap: 20 },
  brandFooter: {
    display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-dim)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  authPane: {
    display: 'grid', placeItems: 'center', padding: 48,
  },
  card: {
    width: '100%', maxWidth: 440, padding: 36,
  },
  cardHead: { marginBottom: 24 },
  tabs: {
    display: 'flex', gap: 4, padding: 4,
    background: 'var(--bg-elev-0)',
    borderRadius: 12, marginBottom: 28,
    border: '1px solid var(--border)',
  },
  tab: (active) => ({
    flex: 1, padding: '10px 12px', borderRadius: 9,
    background: active ? 'var(--bg-elev-3)' : 'transparent',
    color: active ? 'var(--text-hi)' : 'var(--text-lo)',
    border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, transition: 'all 0.18s ease',
  }),
  cardTitle: {
    fontFamily: "'Geist', 'Inter', sans-serif",
    fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
    margin: 0, marginBottom: 6, color: 'var(--text-hi)',
  },
  cardSub: { fontSize: 13, color: 'var(--text-lo)', margin: 0, lineHeight: 1.5 },
  form: { display: 'grid', gap: 16 },
  remember: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 12, color: 'var(--text-md)', cursor: 'pointer',
  },
  error: {
    fontSize: 13, color: 'var(--red)', padding: '10px 14px',
    background: 'var(--red-soft)', border: '1px solid var(--border-strong)',
    borderRadius: 10,
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '14px 18px', borderRadius: 14,
    background: 'linear-gradient(180deg, #FFE26B 0%, #FFD638 100%)',
    border: '1px solid rgba(255,214,56,0.6)',
    color: '#0a0d14', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', marginTop: 4,
    boxShadow: '0 8px 24px rgba(255,214,56,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
};