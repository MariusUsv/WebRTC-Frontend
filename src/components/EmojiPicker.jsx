import React, { useState } from 'react';

const EMOJI_CATS = {
  "🙂": ["😀","😁","😂","🤣","😊","😍","😘","😉","😎","🤗","🤔","😴","😅","😇","🤩","🙃","😜","😋","😡","😭","🥶","🥵","🤯"],
  "🐶": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦄","🐝","🦋","🐢","🐬"],
  "🍔": ["🍏","🍌","🍓","🍒","🍍","🥑","🥕","🌶️","🍕","🍔","🍟","🌭","🥪","🍗","🍣","🍩","🍪","🍫","🍿","☕","🧋"],
  "⚽": ["⚽","🏀","🏈","⚾","🎾","🏐","🏓","🥊","🎮","🎧","🎸","🎹","🎬","📸","✈️","🏖️","🏆","🎉","✨","🔥"],
  "❤️": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💖","💘","💝","💯","🙏","👏","👍","👎"],
};

export default function EmojiPicker({ onSelectEmoji }) {
  const [emojiCat, setEmojiCat] = useState("🙂");

  return (
    <div id="emoji-popover" style={styles.emojiPopover}>
      <div style={styles.emojiTabs}>
        {Object.keys(EMOJI_CATS).map((k) => ( 
          <button key={k} type="button" onClick={() => setEmojiCat(k)} style={{ ...styles.emojiTab, ...(emojiCat === k ? styles.emojiTabActive : null) }}>{k}</button> 
        ))}
      </div>
      <div style={styles.emojiGrid}>
        {(EMOJI_CATS[emojiCat] || []).map((e) => ( 
          <button key={e} type="button" style={styles.emojiItem} onClick={() => onSelectEmoji(e)}>{e}</button> 
        ))}
      </div>
    </div>
  );
}

const styles = {
  emojiPopover: { position: "absolute", bottom: 52, left: 0, width: 320, maxWidth: "78vw", padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(20,22,24,0.95)", backdropFilter: "blur(10px)", zIndex: 9999 },
  emojiTabs: { display: "flex", gap: 6, marginBottom: 8 },
  emojiTab: { padding: "6px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(40,42,45,0.55)", color: "white", cursor: "pointer", fontSize: 14 },
  emojiTabActive: { background: "rgba(255, 214, 56, 0.18)", border: "1px solid rgba(255, 214, 56, 0.25)" },
  emojiGrid: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 },
  emojiItem: { width: "100%", aspectRatio: "1 / 1", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(40,42,45,0.65)", color: "white", cursor: "pointer", fontSize: 18, display: "grid", placeItems: "center" },
};