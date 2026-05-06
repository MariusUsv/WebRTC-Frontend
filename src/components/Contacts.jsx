import React, { useState } from 'react';
import { api } from '../services/api';
import { formatLastSeen } from '../services/formatters';

export default function ContactsArea({ contacts, onlineMap, selected, onSelect, onRefresh, token }) {
  const [addPhone, setAddPhone] = useState("");
  const [addName, setAddName] = useState("");
  const [err, setErr] = useState("");

  async function addContact(e) {
    e.preventDefault(); setErr(""); 
    const phone = addPhone.trim(); const name = addName.trim(); 
    if (!phone || !name) return;
    try { 
        await api("/contacts", { method: "POST", token, body: { phone, contact_name: name } }); 
        setAddPhone(""); setAddName(""); await onRefresh(); 
    } catch (e2) { setErr(e2?.message || "Eroare la adăugare"); }
  }

  async function removeContact(e, id) {
    e.stopPropagation();
    try { await api(`/contacts/${id}`, { method: "DELETE", token }); await onRefresh(); if (selected?.id === id) onSelect(null); } 
    catch (e2) { setErr(e2?.message || "Eroare la ștergere"); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Formular Inline (Stilul Poza 3) */}
      <div style={{ padding: "15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <form onSubmit={addContact} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Nume.." style={styles.input} />
          <div style={{ display: "flex", gap: 10 }}>
            <input value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="Telefon.." style={{ ...styles.input, flex: 1 }} />
            <button type="submit" style={styles.addBtn}>Adaugă</button>
          </div>
        </form>
        {err && <div style={{ color: "#ff9a9a", marginTop: 8, fontSize: 12 }}>{err}</div>}
      </div>

      {/* Lista Contacte */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "10px" }}>
        {contacts.length === 0 && <div style={{ opacity: 0.5, padding: 12, textAlign: "center" }}>Nu ai contacte.</div>}
        
        {contacts.map((c) => {
          const isSel = selected?.user_id === c.user_id; 
          const isOnline = onlineMap[c.user_id] !== undefined ? onlineMap[c.user_id] : c.is_online;
          
          return (
            <div key={c.id} onClick={() => onSelect(c)} style={{ ...styles.contactCard, background: isSel ? "rgba(255, 214, 56, 0.1)" : "rgba(255, 255, 255, 0.03)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: isOnline ? "#34d399" : "rgba(255,255,255,0.2)", flex: "0 0 auto" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: isSel ? "#FFD638" : "white" }}>{c.contact_name}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{isOnline ? "Online" : formatLastSeen(c.last_seen_at)}</div>
              </div>
              <button onClick={(e) => removeContact(e, c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>🗑️</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  input: { padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "white", outline: "none", fontSize: 13 },
  addBtn: { padding: "0 16px", borderRadius: 8, border: "1px solid #FFD638", background: "transparent", color: "#FFD638", cursor: "pointer", fontWeight: "bold" },
  contactCard: { display: "flex", alignItems: "center", gap: 12, padding: "12px 15px", borderRadius: 12, marginTop: 8, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "0.2s" }
};