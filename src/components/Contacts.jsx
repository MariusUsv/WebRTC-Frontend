import React, { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { formatLastSeen } from '../services/formatters';
import Avatar from './Avatar';

export default function ContactsArea({ contacts, onlineMap, selected, onSelect, onRefresh, token, demoMode }) {
  const [addOpen, setAddOpen] = useState(false);
  const [addPhone, setAddPhone] = useState('');
  const [addName, setAddName] = useState('');
  const [err, setErr] = useState('');

  async function addContact(e) {
    e.preventDefault();
    setErr('');
    if (demoMode) { setAddOpen(false); setAddName(''); setAddPhone(''); return; }
    const phone = addPhone.trim(); 
    const name = addName.trim();
    
    if (!phone || !name) return;
    
    try {
      await api('/contacts', { 
        method: 'POST', 
        token, 
        body: { phone, contact_name: name } 
      });
      setAddPhone(''); 
      setAddName(''); 
      setAddOpen(false);
      await onRefresh();
    } catch (e2) { 
      setErr(e2?.message || 'Eroare la adăugare'); 
    }
  }

  async function removeContact(e, id) {
    e.stopPropagation();
    if (demoMode) return;
    if (!window.confirm("Sigur vrei să ștergi acest contact?")) return;
    
    try {
      // Notă: Asigură-te că ai ruta DELETE /contacts/{id} implementată în api.py
      await api(`/contacts/${id}`, { method: 'DELETE', token });
      await onRefresh();
      if (selected?.id === id) onSelect(null);
    } catch (err) {
      console.error("Eroare la ștergere:", err);
    }
  }

  return (
    <div style={S.wrap}>
      <div style={{ padding: '12px 16px' }}>
        {!addOpen ? (
          <button onClick={() => setAddOpen(true)} style={S.addToggle} className="hover-lift" data-testid="open-add-contact">
            <UserPlus size={14} /> Contact nou
          </button>
        ) : (
          <form onSubmit={addContact} style={S.addForm} className="msg-animate">
            <input
              className="linko-input"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="Nume complet"
              style={{ fontSize: 13, padding: '11px 14px' }}
              data-testid="add-contact-name"
              autoFocus
            />
            <input
              className="linko-input"
              value={addPhone}
              onChange={e => setAddPhone(e.target.value)}
              placeholder="Număr de telefon"
              style={{ fontSize: 13, padding: '11px 14px' }}
              data-testid="add-contact-phone"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={S.saveBtn} className="hover-lift" data-testid="save-contact-btn">
                <Plus size={14} /> Salvează
              </button>
              <button type="button" onClick={() => setAddOpen(false)} style={S.cancelBtn} className="hover-lift">
                Anulează
              </button>
            </div>
            {err && <div style={{ color: '#ff8a96', fontSize: 12, marginTop: 4 }}>{err}</div>}
          </form>
        )}
      </div>

      <div style={S.list}>
        {contacts.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 13, color: 'var(--text-md)', fontWeight: 600 }}>Nu ai contacte</div>
            <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>Adaugă un contact pentru a începe chat-ul.</div>
          </div>
        ) : contacts.map(c => {
          const isSel = selected?.user_id === c.user_id;
          const isOnline = onlineMap?.[c.user_id] !== undefined ? onlineMap[c.user_id] : c.is_online;
          return (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              style={S.item(isSel)}
              className="hover-lift"
              data-testid={`contact-${c.user_id}`}
            >
              <Avatar name={c.contact_name} seed={c.user_id} size={42} online={isOnline} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: isSel ? 'var(--accent)' : 'var(--text-hi)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{c.contact_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 2 }}>
                  {isOnline ? <span style={{ color: 'var(--mint)' }}>● Online</span> : `Văzut ${formatLastSeen(c.last_seen_at)}`}
                </div>
              </div>
              <button
                onClick={(e) => removeContact(e, c.id)}
                style={S.deleteBtn}
                className="hover-scale"
                title="Șterge contact"
                data-testid={`delete-contact-${c.user_id}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 },
  addToggle: {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    background: 'rgba(255,214,56,0.08)', border: '1px dashed rgba(255,214,56,0.3)',
    color: 'var(--accent)', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addForm: { display: 'flex', flexDirection: 'column', gap: 8 },
  saveBtn: {
    flex: 1, padding: '10px 14px', borderRadius: 10,
    background: 'var(--accent)', color: '#0a0d14',
    fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  cancelBtn: {
    padding: '10px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    color: 'var(--text-md)', fontSize: 13, cursor: 'pointer',
  },
  list: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 12px 12px' },
  empty: { padding: '40px 16px', textAlign: 'center' },
  item: (sel) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', marginBottom: 4, borderRadius: 14,
    background: sel ? 'rgba(255, 214, 56, 0.1)' : 'transparent',
    border: `1px solid ${sel ? 'rgba(255, 214, 56, 0.25)' : 'transparent'}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
  deleteBtn: {
    width: 28, height: 28, borderRadius: 8,
    background: 'transparent', border: 'none',
    color: 'var(--text-dim)', cursor: 'pointer',
    display: 'grid', placeItems: 'center', flexShrink: 0,
  },
};