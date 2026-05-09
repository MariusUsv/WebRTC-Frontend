import React, { useState } from 'react';

const EMOJI_CATS = {
  '🙂': ['😀','😁','😂','🤣','😊','😍','😘','😉','😎','🤗','🤔','😴','😅','😇','🤩','🙃','😜','😋','😡','😭','🥶','🥵','🤯'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦄','🐝','🦋','🐢','🐬'],
  '🍔': ['🍏','🍌','🍓','🍒','🍍','🥑','🥕','🌶️','🍕','🍔','🍟','🌭','🥪','🍗','🍣','🍩','🍪','🍫','🍿','☕','🧋'],
  '⚽': ['⚽','🏀','🏈','⚾','🎾','🏐','🏓','🥊','🎮','🎧','🎸','🎹','🎬','📸','✈️','🏖️','🏆','🎉','✨','🔥'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💖','💘','💝','💯','🙏','👏','👍','👎'],
};

export default function EmojiPicker({ onSelectEmoji }) {
  const [cat, setCat] = useState('🙂');

  return (
    <div style={S.popover} className="scale-in">
      <div style={S.tabs}>
        {Object.keys(EMOJI_CATS).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setCat(k)}
            style={{ ...S.tab, ...(cat === k ? S.tabActive : null) }}
          >
            {k}
          </button>
        ))}
      </div>
      <div style={S.grid}>
        {EMOJI_CATS[cat].map(e => (
          <button 
            key={e} 
            type="button" 
            style={S.item} 
            className="emoji-item-hover"
            onClick={() => onSelectEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

const S = {
  popover: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    width: 320,
    maxWidth: '78vw',
    padding: 12,
    borderRadius: 16,
    background: 'rgba(15, 18, 24, 0.95)',
    backdropFilter: 'blur(24px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
  },
  tabs: { 
    display: 'flex', 
    gap: 4, 
    marginBottom: 10 
  },
  tab: {
    flex: 1,
    padding: '8px 6px',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'white',
    cursor: 'pointer',
    fontSize: 16,
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: 'rgba(255, 214, 56, 0.12)',
    border: '1px solid rgba(255, 214, 56, 0.35)',
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(8, 1fr)', 
    gap: 4, 
    maxHeight: 220, 
    overflowY: 'auto' 
  },
  item: {
    width: '100%',
    aspectRatio: '1 / 1',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 18,
    display: 'grid',
    placeItems: 'center',
    transition: 'background 0.15s ease',
  },
};