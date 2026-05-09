/**
 * Serviciu SFX folosind WebAudio API.
 * Generează tonuri sintetizate fără a depinde de fișiere .mp3 externe.
 */

let ctx = null;

const getCtx = () => {
    // Verificăm dacă suntem în browser și inițializăm AudioContext
    if (!ctx && typeof window !== 'undefined') {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("AudioContext nu este suportat de acest browser.");
        }
    }
    return ctx;
};

/**
 * @param {number} freq - Frecvența în Hz
 * @param {number} dur - Durata în secunde
 * @param {number} vol - Volumul (0.0 la 1.0)
 * @param {string} type - Tipul undei ('sine', 'square', 'sawtooth', 'triangle')
 */
const playTone = (freq, dur, vol, type = 'sine') => {
    const ac = getCtx();
    if (!ac) return;

    // Reluăm contextul dacă este în starea 'suspended' (politica browserelor privind auto-play)
    if (ac.state === 'suspended') ac.resume();

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    // Attack & Decay pentru a evita sunetele de tip "click" (pocnituri)
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ac.currentTime + 0.02); // Scurt fade-in
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur); // Fade-out lung

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(ac.currentTime + dur);
};

export const sfx = {
    // Sunet ascuțit și scurt pentru mesaj trimis
    send: () => playTone(880, 0.1, 0.05),
    
    // Sunet dublu, mai prietenos pentru mesaj primit
    receive: () => {
        playTone(660, 0.15, 0.05);
        setTimeout(() => playTone(830, 0.15, 0.04), 100);
    },
    
    // Sunet de apel (repetitiv)
    call: () => {
        playTone(440, 0.4, 0.05);
        setTimeout(() => playTone(554, 0.4, 0.05), 200);
    },
    
    // Sunet grav pentru închiderea apelului (Hangup)
    hangup: () => playTone(330, 0.3, 0.05, 'triangle')
};