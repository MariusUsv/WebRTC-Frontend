import { useRef, useCallback } from 'react';
import { api } from '../services/api';
import { derivePeerAesKey, encryptText, decryptText, isEncrypted } from '../services/crypto';

export function useE2EE({ token, myPrivateKey }) {
  const peerKeyCache = useRef({});
  const fetchingCache = useRef({}); // Aici oprim spam-ul de request-uri infinite

  const getPeerKey = useCallback(async (peerUserId) => {
    if (!peerUserId || !myPrivateKey) return null;
    
    if (peerKeyCache.current[peerUserId]) return peerKeyCache.current[peerUserId];
    if (fetchingCache.current[peerUserId]) return fetchingCache.current[peerUserId];

    const fetchPromise = (async () => {
      try {
        const res = await api(`/users/${peerUserId}/public_key`, { token });
        if (!res?.public_key) return null;
        const aes = await derivePeerAesKey(myPrivateKey, res.public_key);
        peerKeyCache.current[peerUserId] = aes;
        return aes;
      } catch (e) {
        return null;
      } finally {
        delete fetchingCache.current[peerUserId];
      }
    })();

    fetchingCache.current[peerUserId] = fetchPromise;
    return fetchPromise;
  }, [token, myPrivateKey]);

  const decryptMessage = useCallback(async (m, peerId) => {
    if (!m || m.is_file || !isEncrypted(m.text)) return m;
    if (!peerId) return m;

    const aes = await getPeerKey(peerId);
    if (!aes) return { ...m, text: '🔒 [Așteptare cheie...]' };
    
    const pt = await decryptText(aes, m.text);
    return { ...m, text: pt ?? '🔒 [Eroare E2EE]' };
  }, [getPeerKey]);

  const encryptMessage = useCallback(async (text, peerId) => {
     const aes = await getPeerKey(peerId);
     return aes ? await encryptText(aes, text) : text;
  }, [getPeerKey]);

  return { getPeerKey, decryptMessage, encryptMessage };
}