// Funcție ajutătoare pentru a ne asigura că data este citită ca UTC
function ensureUTC(dateString) {
    if (!dateString) return "";
    // Dacă data nu se termină cu 'Z' (care înseamnă UTC), adăugăm noi
    if (!dateString.endsWith("Z")) {
        return dateString + "Z";
    }
    return dateString;
}

export function formatMessageTime(dateString) {
    if (!dateString) return "";
    
    const d = new Date(ensureUTC(dateString));
    if (isNaN(d.getTime())) return "";

    // Va transforma automat ora din UTC în ora României
    return d.toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

export function formatLastSeen(dateString) {
    if (!dateString) return "";
    
    const d = new Date(ensureUTC(dateString));
    if (isNaN(d.getTime())) return "";

    const datePart = d.toLocaleDateString("ro-RO", {
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric"
    });
    
    const timePart = d.toLocaleTimeString("ro-RO", {
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false
    });

    return `${datePart} la ${timePart}`;
}

export function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// FUNCȚIA CARE LIPSEA PENTRU CALLS_AREA:
export function formatTime(dateString) {
    if (!dateString) return "";
    
    const d = new Date(ensureUTC(dateString));
    if (isNaN(d.getTime())) return "";

    return d.toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}