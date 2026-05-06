import React from 'react';
import { formatLastSeen, formatDuration } from '../services/formatters';

export default function CallsArea({ calls }) {
  if (!calls || calls.length === 0) {
    return (
      <div style={styles.emptyState} className="msg-animate">
        <div style={{ fontSize: 50, marginBottom: 15, opacity: 0.5 }}>📞</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Niciun apel recent</div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 5, textAlign: "center" }}>
          Istoricul apelurilor tale va apărea aici.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {calls.map((call, idx) => {
        // Presupunem că ai o modalitate de a ști dacă a fost ratat sau respins
        const isMissed = call.status === "missed" || call.status === "rejected";
        // Presupunem că serverul trimite 'outgoing' / 'incoming'
        const isOutgoing = call.direction === "outgoing"; 

        return (
          <div key={idx} className="hover-scale" style={styles.callCard}>
            <div style={styles.iconBox(isMissed, isOutgoing)}>
              {isMissed ? "❌" : (isOutgoing ? "↗" : "↙")}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ ...styles.name, color: isMissed ? "#ef4444" : "white" }}>
                {call.contact_name || call.phone || "Necunoscut"}
              </div>
              <div style={styles.details}>
                {isOutgoing ? "Apel efectuat" : (isMissed ? "Apel ratat" : "Apel primit")} • {formatLastSeen(call.created_at)}
              </div>
            </div>

            <div style={styles.duration}>
              {call.duration > 0 ? formatDuration(call.duration) : "00:00"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    height: "100%",
    overflowY: "auto",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "20px",
    opacity: 0.6
  },
  callCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "16px",
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "16px",
    cursor: "pointer",
    transition: "0.2s"
  },
  iconBox: (isMissed, isOutgoing) => ({
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: isMissed 
      ? "rgba(239, 68, 68, 0.15)" 
      : (isOutgoing ? "rgba(255, 214, 56, 0.15)" : "rgba(52, 211, 153, 0.15)"),
    color: isMissed 
      ? "#ef4444" 
      : (isOutgoing ? "#FFD638" : "#34d399"),
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "bold"
  }),
  name: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "4px"
  },
  details: {
    fontSize: "12px",
    opacity: 0.6
  },
  duration: {
    fontSize: "13px",
    fontWeight: "500",
    opacity: 0.8,
    background: "rgba(255,255,255,0.05)",
    padding: "4px 8px",
    borderRadius: "8px"
  }
};