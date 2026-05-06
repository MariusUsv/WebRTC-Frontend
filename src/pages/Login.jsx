import React, { useState } from 'react';

export default function Login({ auth }) {
  const [authMode, setAuthMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [authError, setAuthError] = useState("");

  async function handleSubmit() {
    setAuthError("");
    try {
      if (authMode === "login") await auth.login(phone, pass, remember);
      else await auth.register(fullName, phone, pass, remember);
    } catch (e) { setAuthError(e?.message || "Eroare la autentificare"); }
  }

  return (
    <div style={styles.full}>
      <div className="msg-animate" style={styles.card}>
        
        <h2 style={styles.title}>𝗟𝗜𝗡𝗞𝗢</h2>
        <div style={styles.subtitle}>
          {authMode === "login" ? "Conectează-te la contul tău" : "Creează un cont premium"}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {authMode === "register" && (
            <input 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Nume complet" 
              style={styles.input} 
            />
          )}
          
          <input 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="Număr de telefon" 
            style={styles.input} 
          />
          
          <input 
            value={pass} 
            onChange={(e) => setPass(e.target.value)} 
            placeholder="Parolă" 
            type="password" 
            style={styles.input} 
          />
          
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, opacity: 0.8, cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={remember} 
              onChange={(e) => setRemember(e.target.checked)} 
              style={{ accentColor: "#FFD638", width: 16, height: 16 }}
            /> 
            Ține-mă minte
          </label>
          
          {authError && (
            <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: 10, borderRadius: 10 }}>
              {authError}
            </div>
          )}
          
          <button onClick={handleSubmit} className="hover-scale" style={styles.primaryBtn}>
            {authMode === "login" ? "Autentificare" : "Înregistrare"}
          </button>
          
          <button onClick={() => { setAuthError(""); setAuthMode(authMode === "login" ? "register" : "login"); }} className="hover-scale" style={styles.secondaryBtn}>
            {authMode === "login" ? "Nu ai cont? Creează unul" : "Am deja cont. Autentificare"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Același fundal Midnight Navy ca pe ChatPage
  full: { 
    width: "100vw", height: "100vh", 
    background: "linear-gradient(135deg, #0B101E 0%, #1A233A 100%)", 
    display: "flex", justifyContent: "center", alignItems: "center", 
    color: "white", boxSizing: "border-box", padding: 20
  },
  
  // Panoul de sticlă cu colțuri mai moi și umbră profundă
  card: { 
    width: "100%", maxWidth: "420px", padding: "40px", 
    background: "rgba(18, 24, 38, 0.6)", borderRadius: "32px", 
    backdropFilter: "blur(24px) saturate(120%)", 
    border: "1px solid rgba(255,255,255,0.06)", 
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    boxSizing: "border-box"
  },
  
  title: { textAlign: "center", marginBottom: 5, fontSize: 36, fontWeight: 900, color: "#FFD638", letterSpacing: 2 },
  subtitle: { textAlign: "center", marginBottom: 30, fontSize: 15, opacity: 0.5 },
  
  // Input-uri elegante și aerisite
  input: { 
    width: "100%", padding: "16px 20px", borderRadius: "16px", 
    background: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255, 255, 255, 0.08)", 
    color: "white", outline: "none", fontSize: 15, boxSizing: "border-box",
    transition: "0.2s"
  },
  
  // Butonul principal cu text auriu și fundal translucid
  primaryBtn: { 
    width: "100%", padding: "16px", borderRadius: "16px", 
    background: "rgba(255, 214, 56, 0.15)", color: "#FFD638", 
    fontWeight: 700, fontSize: 16, cursor: "pointer", border: "none",
    marginTop: 10
  },
  
  // Butonul secundar, mai discret
  secondaryBtn: { 
    width: "100%", padding: "16px", borderRadius: "16px", 
    background: "rgba(255, 255, 255, 0.03)", color: "white", 
    fontWeight: 500, fontSize: 14, cursor: "pointer", border: "none", opacity: 0.8
  }
};