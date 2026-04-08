import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getMyChats, getChatMessages,
  sendEncryptedMessage, subscribeToMessages,
  savePublicKey, getUnreadCounts,
} from '../lib/supabase'
import { initCryptoKeys, importPublicKey, deriveSharedKey, encryptMessage, decryptMessage } from '../lib/crypto'
import { markChatRead, getLastRead, requestNotificationPermission, showBrowserNotification } from '../lib/notifications'

// ─── Utilities ────────────────────────────────────────────────
function fmtTime(ts) {
  const d = new Date(ts), now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const diff = now - d
  if (diff < 7 * 86400000)
    return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Styles ───────────────────────────────────────────────────
const styles = `
  .inbox-wrap { display:flex; height:calc(100vh - 64px); overflow:hidden; background:var(--bg); }

  /* Sidebar */
  .inbox-sidebar {
    width:340px; flex-shrink:0; display:flex; flex-direction:column;
    background:var(--card); border-right:1px solid var(--border);
    transition:transform 0.25s ease;
  }
  .sidebar-header {
    padding:20px 20px 16px; background:var(--card);
    border-bottom:1px solid var(--border); flex-shrink:0;
  }
  .sidebar-title { font-size:22px; font-family:'Playfair Display',serif; font-weight:700; color:var(--ink); }
  .sidebar-sub   { font-size:13px; color:var(--ink3); margin-top:3px; }
  .chat-list     { flex:1; overflow-y:auto; }

  /* Chat row */
  .chat-row {
    display:flex; align-items:center; gap:12px;
    padding:14px 18px; border:none; border-bottom:1px solid var(--border);
    width:100%; background:transparent; cursor:pointer; text-align:left;
    transition:background 0.15s;
  }
  .chat-row:hover   { background:var(--bg2); }
  .chat-row.active  { background:var(--accent-bg); }
  .chat-row.unread  { background:#fffaf7; }
  .chat-row.active.unread { background:var(--accent-bg); }

  .avatar-wrap { position:relative; flex-shrink:0; }
  .avatar-img  { width:46px; height:46px; border-radius:50%; object-fit:cover; }
  .avatar-ini  {
    width:46px; height:46px; border-radius:50%; background:var(--accent);
    color:#fff; display:flex; align-items:center; justify-content:center;
    font-weight:700; font-size:18px;
  }
  .unread-dot {
    position:absolute; bottom:1px; right:1px;
    width:13px; height:13px; border-radius:50%;
    background:#25D366; border:2.5px solid var(--card);
  }
  .row-info { flex:1; min-width:0; }
  .row-name { font-size:14px; font-weight:600; color:var(--ink); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .row-name.bold { font-weight:700; }
  .row-sub  { font-size:12px; color:var(--ink3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .row-sub.bold { color:var(--ink2); font-weight:500; }
  .row-right { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
  .row-time  { font-size:11px; color:var(--ink3); }
  .row-time.bold { color:#25D366; font-weight:600; }
  .unread-badge {
    min-width:20px; height:20px; border-radius:10px;
    background:#25D366; color:#fff;
    font-size:11px; font-weight:700;
    display:flex; align-items:center; justify-content:center; padding:0 5px;
  }

  /* Chat window */
  .chat-window { flex:1; display:flex; flex-direction:column; min-width:0; }
  .chat-header {
    padding:14px 20px; background:var(--card);
    border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:12px; flex-shrink:0;
    box-shadow:0 1px 4px rgba(0,0,0,0.04);
  }
  .back-btn { background:none; border:none; cursor:pointer; color:var(--ink3); padding:4px; display:flex; }
  .header-name { font-weight:600; font-size:15px; color:var(--ink); }
  .header-sub  { font-size:12px; color:var(--ink3); }
  .e2e-badge {
    margin-left:auto; display:flex; align-items:center; gap:5px;
    background:#EAF4EF; border-radius:20px; padding:4px 10px; flex-shrink:0;
  }

  /* Messages */
  .messages-area {
    flex:1; overflow-y:auto; padding:20px 20px 8px;
    background:var(--bg); display:flex; flex-direction:column;
  }
  .bubble-wrap { display:flex; flex-direction:column; margin-bottom:8px; }
  .bubble-wrap.mine  { align-items:flex-end; }
  .bubble-wrap.theirs{ align-items:flex-start; }
  .bubble {
    max-width:68%; padding:10px 14px; font-size:14px; line-height:1.55;
    word-break:break-word; box-shadow:0 1px 3px rgba(0,0,0,0.07);
    animation:bubbleIn 0.15s ease;
  }
  .bubble.mine   { background:var(--accent); color:#fff; border-radius:18px 18px 4px 18px; }
  .bubble.theirs { background:var(--bg2);   color:var(--ink); border-radius:18px 18px 18px 4px; }
  .bubble-time   { font-size:11px; color:var(--ink3); margin-top:3px; padding:0 4px; }

  /* Input */
  .input-bar { padding:12px 16px; border-top:1px solid var(--border); background:var(--card); flex-shrink:0; }
  .input-form { display:flex; gap:10px; align-items:flex-end; }
  .input-ta {
    flex:1; padding:10px 14px; border-radius:22px;
    border:1.5px solid var(--border); background:var(--bg2);
    color:var(--ink); font-size:14px; resize:none; outline:none;
    font-family:inherit; line-height:1.5; transition:border-color 0.2s;
  }
  .input-ta:focus { border-color:var(--accent); }
  .send-btn {
    width:42px; height:42px; border-radius:50%; flex-shrink:0;
    border:none; display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:background 0.2s;
  }
  .send-btn.active { background:var(--accent); }
  .send-btn.inactive { background:var(--bg2); cursor:not-allowed; }

  /* Empty state */
  .empty-chat {
    flex:1; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:12px;
    color:var(--ink3); padding:32px;
  }

  @keyframes bubbleIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  /* Mobile */
  @media(max-width:640px) {
    .inbox-sidebar.hidden { display:none; }
    .inbox-sidebar { width:100%; }
    .chat-window.hidden { display:none; }
  }
  @media(min-width:641px) {
    .inbox-sidebar { display:flex !important; }
    .chat-window { display:flex !important; }
  }
`

// ─── Avatar helper ────────────────────────────────────────────
function Avatar({ user, size = 46 }) {
  if (user?.avatar_url)
    return <img src={user.avatar_url} className="avatar-img" style={{ width: size, height: size }} alt="" />
  return (
    <div className="avatar-ini" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {user?.full_name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ─── Chat Row ─────────────────────────────────────────────────
function ChatRow({ chat, me, isActive, unread, latestAt, onClick }) {
  const other    = chat.buyer.id === me.id ? chat.seller : chat.buyer
  const hasUnread = unread > 0
  const cls = ['chat-row', isActive && 'active', hasUnread && !isActive && 'unread'].filter(Boolean).join(' ')

  return (
    <button className={cls} onClick={onClick}>
      <div className="avatar-wrap">
        <Avatar user={other} />
        {hasUnread && <span className="unread-dot" />}
      </div>

      <div className="row-info">
        <div className={`row-name${hasUnread ? ' bold' : ''}`}>{other.full_name || 'User'}</div>
        <div className={`row-sub${hasUnread ? ' bold' : ''}`}>
          {hasUnread ? `${unread} new message${unread > 1 ? 's' : ''}` : `Product: ${chat.listing?.title || 'Listing'}`}
        </div>
      </div>

      <div className="row-right">
        {latestAt && <span className={`row-time${hasUnread ? ' bold' : ''}`}>{fmtTime(latestAt)}</span>}
        {hasUnread && (
          <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </div>
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────
function Bubble({ text, isMine, time }) {
  return (
    <div className={`bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
      <div className={`bubble ${isMine ? 'mine' : 'theirs'}`}>{text}</div>
      <span className="bubble-time">{fmtTime(time)}</span>
    </div>
  )
}

// ─── Chat Window ──────────────────────────────────────────────
function ChatWindow({ chat, me, myKeys, onBack, onMarkRead }) {
  const navigate    = useNavigate()
  const [messages,  setMessages]  = useState([])
  const [sharedKey, setSharedKey] = useState(null)
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sending,   setSending]   = useState(false)
  const [keyError,  setKeyError]  = useState(false)
  const bottomRef = useRef(null)
  const subRef    = useRef(null)

  const other = chat.buyer.id === me.id ? chat.seller : chat.buyer

  // helper: decrypt one raw message
  const dec = useCallback(async (raw, sk) => {
    if (!sk) return '[No encryption key]'
    try { return await decryptMessage(sk, JSON.parse(raw.encrypted_content)) }
    catch { return '[Unable to decrypt]' }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setMessages([]); setKeyError(false); setSharedKey(null)
      onMarkRead(chat.id)                        // mark as read immediately
      if (subRef.current) { subRef.current.unsubscribe(); subRef.current = null }

      // Derive shared key
      let sk = null
      if (other.public_key && myKeys?.privateKey) {
        try {
          const theirPub = await importPublicKey(other.public_key)
          sk = await deriveSharedKey(myKeys.privateKey, theirPub)
          if (!cancelled) setSharedKey(sk)
        } catch (e) {
          console.error('Key derivation error', e)
          if (!cancelled) setKeyError(true)
        }
      } else {
        if (!cancelled) setKeyError(!other.public_key)
      }

      // Load history
      const raw = await getChatMessages(chat.id)
      if (cancelled) return
      const decoded = await Promise.all(raw.map(async m => ({ ...m, text: await dec(m, sk) })))
      if (!cancelled) { setMessages(decoded); setLoading(false) }

      // Real-time subscription
      subRef.current = subscribeToMessages(chat.id, async (newMsg) => {
        const text = await dec(newMsg, sk)
        setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, { ...newMsg, text }])
      })
    }
    load()
    return () => { cancelled = true; subRef.current?.unsubscribe() }
  }, [chat.id, myKeys])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || !sharedKey || sending) return
    setSending(true); setInput('')
    try {
      const payload = await encryptMessage(sharedKey, text)
      const saved   = await sendEncryptedMessage(chat.id, me.id, payload)
      setMessages(prev => prev.find(m => m.id === saved.id) ? prev : [...prev, { ...saved, text }])
    } catch (err) { console.error('Send error', err); setInput(text) }
    finally { setSending(false) }
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const canSend = input.trim().length > 0 && !!sharedKey && !sending

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <Avatar user={other} size={38} />
        <div>
          <div className="header-name">{other.full_name || 'User'}</div>
          <div className="header-sub" style={{ cursor: 'pointer' }} onClick={() => navigate(`/listing/${chat.listing_id}`)}>
            Re: {chat.listing?.title || 'Listing'} ↗
          </div>
        </div>
        <div className="e2e-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#2D6A4F' }}>E2E Encrypted</span>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--ink3)', paddingTop: 48, fontSize: 14 }}>Loading messages…</div>
        ) : keyError ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 320, margin: '0 auto' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Encryption key not found</p>
            <p style={{ fontSize: 13, color: 'var(--ink3)' }}>
              The other user needs to open their Inbox once to generate their encryption key, then messages can be exchanged.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink3)', paddingTop: 64, fontSize: 14 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👋</div>
            <p>No messages yet — say hello!</p>
          </div>
        ) : (
          messages.map(m => <Bubble key={m.id} text={m.text} isMine={m.sender_id === me.id} time={m.created_at} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-bar">
        {!sharedKey && !keyError && !loading ? (
          <div style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 13, padding: '4px 0' }}>Setting up encryption…</div>
        ) : keyError ? null : (
          <form className="input-form" onSubmit={send}>
            <textarea
              className="input-ta"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Message… (Enter to send)"
              rows={1}
            />
            <button type="submit" className={`send-btn ${canSend ? 'active' : 'inactive'}`} disabled={!canSend}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={canSend ? '#fff' : 'var(--ink3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22 11 13 2 9l20-7z" stroke={canSend ? '#fff' : 'var(--ink3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── No-chat placeholder ──────────────────────────────────────
function EmptyState() {
  return (
    <div className="empty-chat">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p style={{ fontSize: 16, fontWeight: 600 }}>Select a conversation</p>
      <p style={{ fontSize: 14 }}>Or start one from a listing page.</p>
    </div>
  )
}

import { useAuth } from '../context/AuthContext'

// ─── Main Inbox Page ──────────────────────────────────────────
export default function Inbox() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [params]   = useSearchParams()
  const openChatId = params.get('chat')

  const [me,           setMe]          = useState(null)
  const [myKeys,       setMyKeys]      = useState(null)
  const [chats,        setChats]       = useState([])
  const [activeChat,   setActiveChat]  = useState(null)
  const [loadingChats, setLoading]     = useState(true)
  const [unreadMap,    setUnreadMap]   = useState({})   // { chatId: count }
  const [latestAt,     setLatestAt]    = useState({})   // { chatId: isoString }
  const [panel,        setPanel]       = useState('list')

  const activeChatRef = useRef(null)
  const globalSubRef  = useRef(null)

  useEffect(() => { activeChatRef.current = activeChat }, [activeChat])

  // ── Init ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      // Only navigate if we're technically not loading anymore
      navigate('/login')
      return 
    }
    
    async function init() {
      const uid = user
      setMe(uid)
      requestNotificationPermission()

      // Crypto keys per-user
      const keys = await initCryptoKeys(uid.id)
      setMyKeys(keys)
      await savePublicKey(uid.id, keys.pubB64).catch(console.error)

      // Load chats
      const data = await getMyChats(uid.id).catch(() => [])
      setChats(data)
      setLoading(false)

      // Build lastReadMap from localStorage
      const lastReadMap = {}
      data.forEach(c => { lastReadMap[c.id] = getLastRead(c.id) })

      // Fetch real unread counts from DB (one query)
      const counts = await getUnreadCounts(uid.id, lastReadMap).catch(() => ({}))
      setUnreadMap(prev => ({ ...prev, ...counts }))

      // Global real-time subscription for incoming messages
      if (globalSubRef.current) globalSubRef.current.unsubscribe()
      const { supabase } = await import('../lib/supabase')
      globalSubRef.current = supabase
        .channel('inbox-global')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new
            if (msg.sender_id === uid.id) return

            // Update latest timestamp
            setLatestAt(prev => ({ ...prev, [msg.chat_id]: msg.created_at }))

            // Only count unread if it's NOT the active chat
            if (activeChatRef.current?.id !== msg.chat_id) {
              setUnreadMap(prev => ({ ...prev, [msg.chat_id]: (prev[msg.chat_id] || 0) + 1 }))

              // Show notifications
              const chat = data.find(c => c.id === msg.chat_id)
              if (chat) {
                const other = chat.buyer.id === uid.id ? chat.seller : chat.buyer
                showBrowserNotification(
                  `New message from ${other.full_name || 'Someone'}`,
                  `Re: ${chat.listing?.title || 'a listing'}`,
                  () => navigate(`/inbox?chat=${msg.chat_id}`)
                )
              }
            }
          }
        )
        .subscribe()

      // Auto-open from URL param
      if (openChatId) {
        const found = data.find(c => c.id === openChatId)
        if (found) {
          setActiveChat(found)
          activeChatRef.current = found
          setPanel('chat')
          markChatRead(found.id)
          setUnreadMap(prev => ({ ...prev, [found.id]: 0 }))
        }
      }
    }

    init()
    return () => globalSubRef.current?.unsubscribe()
  }, [navigate, openChatId])

  const openChat = useCallback((chat) => {
    setActiveChat(chat)
    activeChatRef.current = chat
    setPanel('chat')
    markChatRead(chat.id)
    setUnreadMap(prev => ({ ...prev, [chat.id]: 0 }))
  }, [])

  const closeChat = useCallback(() => {
    setActiveChat(null)
    activeChatRef.current = null
    setPanel('list')
  }, [])

  const handleMarkRead = useCallback((chatId) => {
    markChatRead(chatId)
    setUnreadMap(prev => ({ ...prev, [chatId]: 0 }))
  }, [])

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640

  return (
    <>
      <style>{styles}</style>
      <div className="inbox-wrap">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className={`inbox-sidebar${panel === 'chat' ? ' hidden' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-title">Messages</div>
            <div className="sidebar-sub">
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              {Object.values(unreadMap).some(n => n > 0) && (
                <span style={{ marginLeft: 8, background: '#25D366', color:'#fff', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                  {Object.values(unreadMap).reduce((s, n) => s + n, 0)} unread
                </span>
              )}
            </div>
          </div>

          <div className="chat-list">
            {loadingChats ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>Loading…
              </div>
            ) : chats.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
                <p style={{ color: 'var(--ink2)', fontWeight: 600, marginBottom: 6 }}>No conversations yet</p>
                <p style={{ color: 'var(--ink3)', fontSize: 13 }}>Visit a listing and click "Message Seller" to start a chat.</p>
              </div>
            ) : (
              chats.map(chat => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  me={me}
                  isActive={activeChat?.id === chat.id}
                  unread={unreadMap[chat.id] || 0}
                  latestAt={latestAt[chat.id] || chat.created_at}
                  onClick={() => openChat(chat)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat panel ──────────────────────────────────── */}
        <div className={`chat-window${panel === 'list' ? ' hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
          {activeChat && me && myKeys ? (
            <ChatWindow
              key={activeChat.id}
              chat={activeChat}
              me={me}
              myKeys={myKeys}
              onBack={closeChat}
              onMarkRead={handleMarkRead}
            />
          ) : (
            <EmptyState />
          )}
        </div>

      </div>
    </>
  )
}
