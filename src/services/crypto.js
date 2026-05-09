// E2EE — ECDH (P-256) + AES-GCM cu derivare HKDF
// Mesajele și reacțiile sunt criptate pe client. Serverul vede doar ciphertext.
//
// Format ciphertext în câmpul `text`: "e2ee:v1:<iv_b64>:<ct_b64>"

import { api } from './api';

const KEY_PREFIX = 'linko-e2ee-key:'; // per phone

// ---------- helpers base64 ----------
const b64encode = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const b64decode = (str) => {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

// ---------- key generation / persistence ----------
async function generateKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // exportabilă (pentru a putea salva private key local)
    ['deriveKey', 'deriveBits']
  );
}

async function exportJwk(key) {
  return JSON.stringify(await crypto.subtle.exportKey('jwk', key));
}

async function importPrivateJwk(jwkStr) {
  return crypto.subtle.importKey(
    'jwk', JSON.parse(jwkStr),
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveKey', 'deriveBits']
  );
}

async function importPublicJwk(jwkStr) {
  return crypto.subtle.importKey(
    'jwk', JSON.parse(jwkStr),
    { name: 'ECDH', namedCurve: 'P-256' },
    true, []
  );
}

// ---------- public API ----------

/**
 * Generează (sau încarcă) keypair-ul ECDH al utilizatorului curent
 * și se asigură că serverul are public key-ul actualizat.
 * Returnează { privateKey, publicKeyJwk }
 */
export async function ensureMyKeyPair(token, mePhone) {
  const storeKey = KEY_PREFIX + (mePhone || 'anon');
  let raw = localStorage.getItem(storeKey);
  let privateKey, publicKeyJwk;

  if (raw) {
    try {
      const obj = JSON.parse(raw);
      privateKey = await importPrivateJwk(obj.private);
      publicKeyJwk = obj.public;
    } catch {
      raw = null;
    }
  }

  if (!raw) {
    const kp = await generateKeyPair();
    const privJwk = await exportJwk(kp.privateKey);
    const pubJwk = await exportJwk(kp.publicKey);
    localStorage.setItem(storeKey, JSON.stringify({ private: privJwk, public: pubJwk }));
    privateKey = kp.privateKey;
    publicKeyJwk = pubJwk;
  }

  // Trimitem public key-ul la server (idempotent — server doar îl actualizează)
  try {
    await api('/users/me/public_key', { method: 'PUT', token, body: { public_key: publicKeyJwk } });
  } catch (e) {
    console.warn('[E2EE] Nu am putut publica cheia publică:', e?.message);
  }

  return { privateKey, publicKeyJwk };
}

/**
 * Derivă o cheie AES-GCM (256-bit) între cheia mea privată și publicJwk-ul peer-ului.
 * Folosim HKDF pe baza secretului ECDH pentru a obține o cheie robustă.
 */
export async function derivePeerAesKey(myPrivateKey, peerPublicKeyJwk) {
  const peerPub = await importPublicJwk(peerPublicKeyJwk);
  // 1) ECDH → 256 biți de secret comun
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPub },
    myPrivateKey,
    256
  );
  // 2) HKDF → AES-GCM key
  const hkdfKey = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16),
      info: new TextEncoder().encode('linko-e2ee-v1'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Criptează un text. Întoarce string format "e2ee:v1:iv:ct". */
export async function encryptText(aesKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, data);
  return `e2ee:v1:${b64encode(iv)}:${b64encode(ct)}`;
}

/** Decriptează "e2ee:v1:iv:ct". Întoarce plaintext sau null. */
export async function decryptText(aesKey, payload) {
  if (!payload || typeof payload !== 'string' || !payload.startsWith('e2ee:v1:')) return null;
  const parts = payload.split(':');
  if (parts.length !== 4) return null;
  try {
    const iv = b64decode(parts[2]);
    const ct = b64decode(parts[3]);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
    return new TextDecoder().decode(pt);
  } catch (e) {
    console.warn('[E2EE] Decriptare eșuată:', e?.message);
    return null;
  }
}

export function isEncrypted(text) {
  return typeof text === 'string' && text.startsWith('e2ee:v1:');
}