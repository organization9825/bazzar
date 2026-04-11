// ============================================================
// crypto.js — simplified messaging (plaintext)
// The previous ECDH E2E approach was broken in production:
// private keys lived only in localStorage and were lost on
// new devices, browsers, or cleared storage.
// Messages are now stored as plaintext JSON in the DB.
// ============================================================

// Kept for compatibility — Inbox still calls initCryptoKeys
export async function initCryptoKeys(userId) {
  // No-op: return a dummy object so Inbox code doesn't break
  return { pubB64: null, publicKey: null, privateKey: null }
}

// Kept for compatibility — Inbox passes this to deriveSharedKey
export async function importPublicKey(b64) { return null }

// Kept for compatibility — always returns a sentinel "key"
export async function deriveSharedKey(myPriv, theirPub) {
  return 'plaintext'
}

// "Encrypt" = wrap plaintext in a JSON envelope
export async function encryptMessage(sharedKey, plaintext) {
  return { plaintext }
}

// "Decrypt" = read plaintext from the envelope
// Also handles old ECDH-encrypted messages gracefully
export async function decryptMessage(sharedKey, payload) {
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload

    // New format: { plaintext: "..." }
    if (parsed && typeof parsed.plaintext === 'string') {
      return parsed.plaintext
    }

    // Old format: { iv: "...", ciphertext: "..." } — cannot decrypt without the original key
    if (parsed && parsed.iv && parsed.ciphertext) {
      return '🔒 (old encrypted message — no longer readable)'
    }

    // Fallback: treat whole string as plaintext
    if (typeof parsed === 'string') return parsed

    return '[unknown message format]'
  } catch {
    return '[message error]'
  }
}

// Stubs kept so existing import statements don't break
export async function exportPublicKey(key) { return null }
