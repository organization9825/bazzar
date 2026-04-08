// ============================================================
// notifications.js  —  unread tracking + browser push
// Uses localStorage timestamps (no DB changes needed)
// ============================================================

// ── Browser notification permission ─────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted')  return true
  if (Notification.permission === 'denied')   return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showBrowserNotification(title, body, onClick) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'bazaar-chat',       // replaces previous notification of same tag
      renotify: true,
    })
    n.onclick = () => { window.focus(); n.close(); onClick?.() }
    setTimeout(() => n.close(), 6000)
  } catch { /* Safari may block */ }
}

// ── Per-chat "last read" in localStorage ─────────────────────
// Stores the timestamp (ms) at which user last opened a given chat.
const lsKey = (chatId) => `bazaar_lastread_${chatId}`

export function markChatRead(chatId) {
  localStorage.setItem(lsKey(chatId), Date.now().toString())
}

export function getLastRead(chatId) {
  return parseInt(localStorage.getItem(lsKey(chatId)) || '0', 10)
}

// Count messages newer than lastRead that were NOT sent by currentUserId
export function countUnread(messages, chatId, currentUserId) {
  const last = getLastRead(chatId)
  return messages.filter(
    m => new Date(m.created_at).getTime() > last && m.sender_id !== currentUserId
  ).length
}
