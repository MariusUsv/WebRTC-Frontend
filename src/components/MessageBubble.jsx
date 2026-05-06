import React, { useState } from 'react';
import { formatMessageTime } from '../services/formatters';
import { API_BASE } from '../services/api'; // NOU: Avem nevoie de adresa serverului pentru poze

export default function MessageBubble({ m, mine }) {
  const [isZoomed, setIsZoomed] = useState(false);

  // Bifele de citire
  const readReceipt = m.is_read ? (
    <span style={{ color: "#34d399", fontWeight: "900", marginLeft: 5, fontSize: "12px", textShadow: "0 0 5px rgba(52,211,153,0.3)" }}>
      ✓✓
    </span>
  ) : (
    <span style={{ opacity: 0.5, marginLeft: 5, fontSize: "12px" }}>
      ✓
    </span>
  );

  // REPARAT: Construim URL-ul complet pentru imagine ca să se încarce de pe server
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url; 
    // Dacă e URL relativ (ex: uploads/...), îi lipim API_BASE în față
    const base = API_BASE || "http://127.0.0.1:8000";
    return `${base}/${url.replace(/^\/+/, '')}`;
  };

  const imageUrl = getImageUrl(m.file_url);

  return (
    <>
      <div style={styles.bubble(mine)}>
        {m.file_url && (
          <img 
            src={imageUrl} 
            alt="attachment" 
            onClick={() => setIsZoomed(true)}
            className="hover-scale"
            style={styles.image(mine)}
          />
        )}
        
        {m.text && (
          <div style={{ marginTop: m.file_url ? 10 : 0, lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
            {m.text}
          </div>
        )}
        
        <div style={styles.footer(mine)}>
          {formatMessageTime(m.created_at)}
          {mine && readReceipt}
        </div>
      </div>

      {isZoomed && m.file_url && (
        <div 
          style={styles.lightboxOverlay} 
          onClick={() => setIsZoomed(false)}
          className="msg-animate"
        >
          <button 
            style={styles.closeBtn} 
            onClick={() => setIsZoomed(false)}
            className="hover-scale"
          >
            ✕
          </button>
          
          <img 
            src={imageUrl} 
            alt="zoomed" 
            style={styles.lightboxImg} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}

const styles = {
  bubble: (mine) => ({
    // REPARAT: Aici era problema cu "a s A". Am pus fit-content și max-width raportat la ecran (65vw).
    width: "fit-content",
    minWidth: "60px",
    maxWidth: "65vw",
    padding: "12px 16px",
    borderRadius: mine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
    background: mine ? "linear-gradient(135deg, #FFD638 0%, #F5A623 100%)" : "rgba(30, 36, 50, 0.8)",
    color: mine ? "black" : "white",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    position: "relative",
    border: mine ? "none" : "1px solid rgba(255,255,255,0.05)",
    wordBreak: "break-word"
  }),
  image: (mine) => ({
    width: "100%",
    maxHeight: "250px",
    objectFit: "cover",
    borderRadius: "12px",
    cursor: "pointer",
    border: mine ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)"
  }),
  footer: (mine) => ({
    fontSize: "11px",
    marginTop: "6px",
    textAlign: "right",
    opacity: mine ? 0.7 : 0.5,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center"
  }),
  lightboxOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(5, 8, 15, 0.95)",
    backdropFilter: "blur(12px)",
    zIndex: 999999, 
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "zoom-out"
  },
  lightboxImg: {
    maxWidth: "90%",
    maxHeight: "90%",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
    objectFit: "contain",
    cursor: "default"
  },
  closeBtn: {
    position: "absolute",
    top: "30px",
    right: "30px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "white",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000000
  }
};