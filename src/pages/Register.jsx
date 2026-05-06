import React, { useState } from 'react';
import { api } from '../services/api';

export default function Register({ onRegisterSuccess, switchToLogin }) {
    const [phone, setPhone] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await api("/auth/register", {
                method: "POST",
                body: { phone, full_name: fullName, password }
            });
            alert("Cont creat! Acum te poți conecta.");
            switchToLogin();
        } catch (err) {
            alert("Eroare la înregistrare: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.full("/Linko (1).jpg")}>
            <div style={styles.card}>
                <h2 style={{ textAlign: "center", marginBottom: 10, letterSpacing: 2 }}>LINKO</h2>
                <div style={{ textAlign: "center", color: "#FFD638", fontSize: 12, marginBottom: 20 }}>CONT NOU</div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input 
                        type="text" 
                        placeholder="Nume (ex: User1)" 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                        style={styles.input}
                        required 
                    />
                    <input 
                        type="text" 
                        placeholder="Număr de telefon" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        style={styles.input}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Parolă" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        style={styles.input}
                        required 
                    />
                    <button type="submit" disabled={loading} style={styles.primaryBtn}>
                        {loading ? "Se creează..." : "Înregistrare"}
                    </button>
                    <button type="button" onClick={switchToLogin} style={styles.secondaryBtn}>
                        Am deja cont
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    full: (url) => ({ width: "100vw", height: "100vh", backgroundImage: `url('${url}')`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", justifyContent: "center", alignItems: "center", color: "white", margin: 0 }),
    card: { background: "rgba(20,22,24,0.85)", padding: "40px 30px", borderRadius: "16px", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
    form: { display: "flex", flexDirection: "column", gap: "15px" },
    input: { padding: "14px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.05)", color: "white", outline: "none", fontSize: "14px" },
    primaryBtn: { background: "#FFD638", color: "black", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s", marginTop: "10px" },
    secondaryBtn: { background: "rgba(255,255,255,0.05)", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", transition: "0.2s" }
};