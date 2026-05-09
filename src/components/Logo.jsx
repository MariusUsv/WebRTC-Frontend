import React from 'react';

/**
 * LINKO logo — lowercase wordmark cu punct galben pulsatoriu pe litera "i".
 */
export default function Logo({ size = 28, withDot = true, color = '#F5F2EA', accent = '#FFD638' }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 1,
        fontFamily: "'Geist', 'Inter', sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color,
        userSelect: 'none',
      }}
    >
      <span>l</span>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        i
        {withDot && (
          <span
            className="linko-dot"
            style={{
              position: 'absolute',
              top: -size * 0.04,
              left: '50%',
              transform: 'translateX(-50%)',
              width: size * 0.22,
              height: size * 0.22,
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 ${size * 0.5}px ${accent}`,
            }}
          />
        )}
      </span>
      <span>nko</span>
      <span style={{ color: accent, marginLeft: 1 }}>.</span>
    </div>
  );
}