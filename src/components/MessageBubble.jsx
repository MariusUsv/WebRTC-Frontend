import React, { useState } from 'react';
import { Check, X, FileText, Download } from 'lucide-react';
import { formatMessageTime } from '../services/formatters';
import { API_BASE } from '../services/api';

export default function MessageBubble({ m, mine, mePhone, onReact }) {
  const [zoom, setZoom] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${API_BASE || ''}/${url.replace(/^\/+/, '')}`;
  };
  const fileUrl = getImageUrl(m.file_url);

  // Funcție care verifică dacă fișierul este imagine sau document
  const isImage = (url) => {
    if (!url) return false;
    if (url.startsWith('blob:')) return true; // Previzualizările locale sunt imagini
    return /\.(jpeg|jpg|gif|png|webp|bmp|svg)(\?.*)?$/i.test(url);
  };

  // Extragem numele fișierului din URL dacă backend-ul nu ne dă un nume clar
  const extractFileName = (url) => {
    if (!url) return 'Document atașat';
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1].split('?')[0];
      return decodeURIComponent(lastPart) || 'Document atașat';
    } catch {
      return 'Document atașat';
    }
  };

  const isImgFile = isImage(m.file_url);

  // Agregăm reacțiile primite de la server/WS: emoji -> { count, mine }
  const reactionGroups = {};
  (m.reactions || []).forEach(r => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { count: 0, mine: false };
    }
    reactionGroups[r.emoji].count += 1;
    if (String(r.user_id) === String(mePhone)) {
      reactionGroups[r.emoji].mine = true;
    }
  });
  const hasReactions = Object.keys(reactionGroups).length > 0;

  return (
    <>
      <div style={S.bubble(mine)} className="msg-animate" data-testid="message-bubble">
        {/* --- SECȚIUNE ATAȘAMENTE --- */}
        {m.file_url && (
          <div style={{ marginBottom: m.text ? 8 : 0 }}>
            {isImgFile ? (
              /* Randare Imagine */
              <img
                src={fileUrl}
                alt="atașament"
                onClick={() => setZoom(true)}
                style={S.image}
                className="hover-scale"
              />
            ) : (
              /* Randare Document (PDF, Word, etc.) */
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download 
                style={S.documentLink}
                className="hover-lift"
              >
                <div style={S.docIconWrap}>
                  <FileText size={22} color="var(--accent)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <span style={S.docName}>{m.file_name || extractFileName(m.file_url)}</span>
                  <span style={S.docSize}>Apasă pentru a deschide</span>
                </div>
                <Download size={18} color="var(--text-dim)" />
              </a>
            )}
          </div>
        )}

        {/* --- SECȚIUNE TEXT MESAJ --- */}
        {m.text && (
          <div style={{
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            fontSize: 14,
            color: 'var(--text-hi)',
            opacity: m.pending ? 0.75 : 1,
          }}>
            {m.text}
          </div>
        )}

        {/* --- FOOTER: Ora + Status (Citit/Trimis) --- */}
        <div style={S.footer(mine)}>
          {m.pending && (
            <span style={{ fontSize: 9, marginRight: 6, opacity: 0.7 }} title="Se securizează E2EE...">
              🔒
            </span>
          )}
          <span className="linko-mono" style={{ fontSize: 10 }}>
            {formatMessageTime(m.created_at)}
          </span>
          
          {mine && (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 6, width: 18, height: 14 }}>
              {m.is_read ? (
                <div style={{ position: 'relative' }}>
                  <Check size={14} color="var(--mint)" style={{ position: 'absolute', left: -5 }} />
                  <span className="check-second"><Check size={14} color="var(--mint)" /></span>
                </div>
              ) : (
                <Check size={14} style={{ opacity: 0.4 }} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- PILULE REACȚII --- */}
      {hasReactions && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: mine ? 'flex-end' : 'flex-start', 
          marginTop: 2,
          gap: 4 
        }}>
          {Object.entries(reactionGroups).map(([emoji, info]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact && onReact(m.message_id, emoji)}
              className="reaction-pill"
              style={{
                cursor: 'pointer',
                background: info.mine ? 'var(--accent-soft)' : 'var(--bg-elev-3)',
                borderColor: info.mine ? 'var(--accent-glow)' : 'var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                border: '1px solid'
              }}
            >
              <span>{emoji}</span>
              <span style={{ fontSize: 11, color: 'var(--text-md)', fontWeight: 600 }}>
                {info.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* --- LIGHTBOX (ZOOM DOAR PENTRU IMAGINI) --- */}
      {zoom && isImgFile && (
        <div style={S.lightbox} onClick={() => setZoom(false)} className="msg-animate">
          <button style={S.lightboxClose} onClick={() => setZoom(false)}>
            <X size={18} />
          </button>
          <img 
            src={fileUrl} 
            alt="zoom" 
            style={S.lightboxImg} 
            onClick={e => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}

const S = {
  bubble: (mine) => ({
    width: 'fit-content',
    minWidth: 60,
    maxWidth: '100%',
    padding: '10px 14px',
    borderRadius: mine ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
    background: mine
      ? 'linear-gradient(180deg, var(--accent-soft) 0%, rgba(255, 214, 56, 0.05) 100%)'
      : 'var(--bg-elev-3)',
    border: `1px solid ${mine ? 'rgba(255, 214, 56, 0.2)' : 'var(--border)'}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    wordBreak: 'break-word',
    position: 'relative',
  }),
  image: {
    width: '100%',
    maxHeight: 280,
    objectFit: 'cover',
    borderRadius: 12,
    cursor: 'zoom-in',
    border: '1px solid var(--border)',
  },
  documentLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    textDecoration: 'none',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    width: '100%',
    minWidth: 200,
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(255, 214, 56, 0.1)',
    display: 'grid',
    placeItems: 'center'
  },
  docName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-hi)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 160
  },
  docSize: {
    fontSize: 11,
    color: 'var(--text-dim)',
    marginTop: 2
  },
  footer: (mine) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    color: mine ? 'var(--accent)' : 'var(--text-lo)',
    opacity: 0.8,
  }),
  lightbox: {
    position: 'fixed',
    inset: 0,
    zIndex: 999999,
    background: 'rgba(5,8,15,0.95)',
    backdropFilter: 'blur(12px)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'zoom-out',
  },
  lightboxImg: {
    maxWidth: '90vw',
    maxHeight: '90vh',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
    objectFit: 'contain',
    cursor: 'default',
  },
  lightboxClose: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
};