import React from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Phone } from 'lucide-react';
import { formatLastSeen, formatDuration } from '../services/formatters';
import Avatar from './Avatar';

export default function CallsArea({ calls }) {
  if (!calls || calls.length === 0) {
    return (
      <div style={S.empty}>
        <div style={S.emptyIcon}><Phone size={22} /></div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-md)', marginTop: 14 }}>
          Niciun apel recent
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>
          Istoricul apelurilor tale va apărea aici.
        </div>
      </div>
    );
  }

  return (
    <div style={S.list}>
      {calls.map((c, i) => {
        const missed = c.status === 'missed' || c.status === 'rejected';
        const outgoing = c.direction === 'outgoing';
        const Icon = missed ? PhoneMissed : outgoing ? PhoneOutgoing : PhoneIncoming;
        
        const tone = missed ? 'var(--red)' : outgoing ? 'var(--accent)' : 'var(--mint)';
        const toneSoft = missed ? 'var(--red-soft)' : outgoing ? 'var(--accent-soft)' : 'var(--mint-soft)';

        return (
          <div key={i} style={S.item} className="hover-lift">
            <Avatar name={c.contact_name} seed={c.phone || c.contact_name} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, 
                fontWeight: 600,
                color: missed ? '#ff8a96' : 'var(--text-hi)',
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
              }}>
                {c.contact_name || c.phone || 'Necunoscut'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-lo)', marginTop: 3 }}>
                <span style={{ color: tone, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon size={11} />
                  {missed ? 'Ratat' : outgoing ? 'Efectuat' : 'Primit'}
                </span>
                <span>·</span>
                <span>{formatLastSeen(c.created_at)}</span>
              </div>
            </div>
            <div className="linko-mono" style={{
              fontSize: 11, 
              fontWeight: 500,
              color: tone, 
              padding: '4px 8px',
              background: toneSoft, 
              borderRadius: 8,
            }}>
              {c.duration > 0 ? formatDuration(c.duration) : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  list: { 
    height: '100%', 
    overflowY: 'auto', 
    padding: '8px 12px 12px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 4 
  },
  empty: {
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    height: '100%', 
    padding: 24, 
    textAlign: 'center',
  },
  emptyIcon: {
    width: 56, 
    height: 56, 
    borderRadius: 16,
    background: 'var(--accent-soft)',
    border: '1px solid rgba(255,214,56,0.2)',
    color: 'var(--accent)',
    display: 'grid', 
    placeItems: 'center',
  },
  item: {
    display: 'flex', 
    alignItems: 'center', 
    gap: 12,
    padding: '10px 12px', 
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};