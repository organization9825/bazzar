// ============================================================
// crypto.js  — client-side E2E encryption
// ECDH P-256 key exchange  +  AES-GCM 256 encryption
// Keys are stored PER USER in localStorage so multiple
// accounts on the same device each get their own key pair.
// ============================================================

// Keys stored as: bazaar_priv_<userId>  /  bazaar_pub_<userId>
const lsPriv = (uid) => `bazaar_priv_${uid}`
const lsPub  = (uid) => `bazaar_pub_${uid}`

// ── Safe Base64 helpers (no spread operator — handles large buffers) ──
function bufToB64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function b64ToBuf(b64) {
  const binary = atob(b64)
  const bytes  = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// ── Key export / import ──────────────────────────────────────
export async function exportPublicKey(key) {
  return bufToB64(await crypto.subtle.exportKey('spki', key))
}

async function exportPrivateKey(key) {
  return bufToB64(await crypto.subtle.exportKey('pkcs8', key))
}

export async function importPublicKey(b64) {
  return crypto.subtle.importKey(
    'spki',
    b64ToBuf(b64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )
}

async function importPrivateKey(b64) {
  return crypto.subtle.importKey(
    'pkcs8',
    b64ToBuf(b64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits']
  )
}

// ── Generate a fresh key pair ────────────────────────────────
async function generateKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  )
}

// ── Shared AES-GCM key (ECDH) ─────────────────────────────────
// Both sides derive the SAME secret:
//   Alice: ECDH(alicePriv, bobPub)
//   Bob:   ECDH(bobPriv,   alicePub)
export async function deriveSharedKey(myPrivateKey, theirPublicKey) {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ── Encrypt ───────────────────────────────────────────────────
export async function encryptMessage(sharedKey, plaintext) {
  const iv      = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ctBuf   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded)
  return {
    iv:         bufToB64(iv),
    ciphertext: bufToB64(ctBuf),
  }
}

// ── Decrypt ───────────────────────────────────────────────────
export async function decryptMessage(sharedKey, payload) {
  try {
    const { iv, ciphertext } = typeof payload === 'string' ? JSON.parse(payload) : payload
    const ivBuf    = b64ToBuf(iv)
    const ctBuf    = b64ToBuf(ciphertext)
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
      sharedKey,
      ctBuf
    )
    return new TextDecoder().decode(plainBuf)
  } catch (err) {
    console.warn('[crypto] decryptMessage failed:', err)
    return '[Unable to decrypt]'
  }
}

// ── Per-user localStorage helpers ────────────────────────────
async function saveKeys(userId, kp) {
  const pubB64  = await exportPublicKey(kp.publicKey)
  const privB64 = await exportPrivateKey(kp.privateKey)
  localStorage.setItem(lsPub(userId),  pubB64)
  localStorage.setItem(lsPriv(userId), privB64)
  return pubB64
}

async function loadKeys(userId) {
  const pubB64  = localStorage.getItem(lsPub(userId))
  const privB64 = localStorage.getItem(lsPriv(userId))
  if (!pubB64 || !privB64) return null
  try {
    const publicKey  = await importPublicKey(pubB64)
    const privateKey = await importPrivateKey(privB64)
    return { publicKey, privateKey, pubB64 }
  } catch (e) {
    console.warn('[crypto] loadKeys failed, regenerating', e)
    return null
  }
}

// ── Main entry point ─────────────────────────────────────────
// Call this once on page load with the logged-in userId.
// Returns { publicKey, privateKey, pubB64 }
export async function initCryptoKeys(userId) {
  const existing = await loadKeys(userId)
  if (existing) return existing

  const kp     = await generateKeyPair()
  const pubB64 = await saveKeys(userId, kp)
  return { publicKey: kp.publicKey, privateKey: kp.privateKey, pubB64 }
}
