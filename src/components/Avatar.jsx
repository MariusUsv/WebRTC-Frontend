import React from 'react';

// Generează un hash numeric dintr-un string pentru a asigura consistența culorilor
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

const PALETTES = [
  ['#FFD638', '#FF6B35'],
  ['#7C5CFF', '#FF4D9D'],
  ['#2DD4A0', '#4FB8FF'],
  ['#FF4D5E', '#FFB347'],
  ['#4FB8FF', '#7C5CFF'],
  ['#FFB347', '#FF4D9D'],
  ['#34D399', '#FFD638'],
  ['#A78BFA', '#34D399'],
];

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, seed, size = 40, online = null, ring = false }) {
  const idSeed = String(seed || name || '');
  const palette = PALETTES[hashCode(idSeed) % PALETTES.length];
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.4);

  return (
    <div style={{ position: 'relative', flex: '0 0 auto', width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
          display: 'grid',
          placeItems: 'center',
          color: '#0a0d14',
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.02em',
          fontFamily: "'Geist', 'Inter', sans-serif",
          boxShadow: ring
            ? `0 0 0 2px rgba(255,214,56,0.6), 0 6px 16px rgba(0,0,0,0.35)`
            : `0 6px 16px rgba(0,0,0,0.35)`,
        }}
      >
        {initials}
      </div>
      {/* Indicator status Online/Offline */}
      {online !== null && (
        <span
          className={online ? 'pulse-online' : ''}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: '50%',
            background: online ? '#2DD4A0' : '#5A5F6A',
            border: '2px solid #0F1218',
          }}
        />
      )}
    </div>
  );
}