import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase, getMyChats, getMapSellers, getProfile } from '../lib/supabase'
import {
  requestNotificationPermission,
  showBrowserNotification,
  getLastRead,
  markChatRead,
} from '../lib/notifications'

// ── In-app toast notification ────────────────────────────────
function MessageToast({ toast, onClose, onGoTo }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [toast.id])

  return (
    <div
      onClick={() => { onGoTo(toast.chatId); onClose() }}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '14px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', maxWidth: 320,
        animation: 'slideUp 0.25s ease',
      }}
    >
      {/* Avatar */}
      {toast.avatarUrl
        ? <img src={toast.avatarUrl} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {toast.senderName?.[0]?.toUpperCase() || '?'}
          </div>
      }
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
          {toast.senderName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          New message • tap to open
        </div>
      </div>
      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: 18, padding: 2, flexShrink: 0 }}
      >×</button>
    </div>
  )
}

import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [scrolled,   setScrolled]   = useState(false)
  const [unread,     setUnread]     = useState(0)    
  const [toast,      setToast]      = useState(null) 
  const [menuOpen,   setMenuOpen]   = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const chatsRef = useRef([])      
  const subsRef  = useRef([])      

  const isInbox  = location.pathname === '/inbox'
  const isActive = (path) => location.pathname === path

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // ── Scroll handler ────────────────────────────────────────
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // ── Clear unread when visiting inbox ─────────────────────
  useEffect(() => {
    if (isInbox) setUnread(0)
  }, [isInbox])

  // ── Global realtime subscription for new messages ─────────
  useEffect(() => {
    if (!user) return
    const cleanup = () => {
      subsRef.current.forEach(s => s.unsubscribe())
      subsRef.current = []
    }

    async function setup() {
      cleanup()
      requestNotificationPermission()
      const chats = await getMyChats(user.id).catch(() => [])
      chatsRef.current = chats

      const sub = supabase
        .channel('global-messages-notify')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new
          if (msg.sender_id === user.id) return
          const chat = chatsRef.current.find(c => c.id === msg.chat_id)
          if (!chat) return
          const other = chat.buyer.id === user.id ? chat.seller : chat.buyer

          if (!isInbox) {
            setUnread(prev => prev + 1)
            showBrowserNotification(
              `New message from ${other.full_name || 'Someone'}`,
              'Tap to open your inbox',
              () => navigate(`/inbox?chat=${chat.id}`)
            )
            setToast({
              id: Date.now(),
              chatId: chat.id,
              senderName: other.full_name || 'Someone',
              avatarUrl: other.avatar_url || null,
            })
          }
        })
        .subscribe()
      subsRef.current = [sub]
    }
    setup()
    return cleanup
  }, [user, isInbox, navigate])

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .nav-link {
          padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500;
          transition: all 0.2s; text-decoration: none;
        }
        .nav-link:hover { background: var(--bg2); }
        .nav-link.active { background: var(--accent-bg) !important; color: var(--accent) !important; }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-btn { display: none !important; }
        }
      `}</style>

      {toast && (
        <MessageToast
          toast={toast}
          onClose={() => setToast(null)}
          onGoTo={(chatId) => navigate(`/inbox?chat=${chatId}`)}
        />
      )}

      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: scrolled ? 'rgba(250,248,245,0.95)' : 'rgba(250,248,245,0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        transition: 'all 0.3s ease',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1100, textDecoration: 'none' }}>
            <img 
              src="/logo.png" 
              alt="Bazaar Logo" 
              style={{ width: 40, height: 40, objectFit: 'contain' }} 
            />
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 22, color: 'var(--ink)' }}>Bazaar</span>
          </Link>

          {/* ── Desktop Nav ───────────────────────────────── */}
          <div className="nav-desktop" style={{ display: 'none', alignItems: 'center', gap: 6 }}>
            {[
              { label: 'Browse', path: '/', onHover: () => {} },
              { label: 'Map',    path: '/map', onHover: () => getMapSellers().catch(() => {}) },
            ].map(({ label, path, onHover }) => (
              <Link 
                key={path} 
                to={path} 
                onMouseEnter={onHover}
                className={`nav-link ${isActive(path) ? 'active' : ''}`} 
                style={{ color: 'var(--ink2)' }}
              >
                {label}
              </Link>
            ))}

            {user ? (
              <>
                <Link to="/inbox" className={`nav-link ${isActive('/inbox') ? 'active' : ''}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink2)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Inbox
                  {unread > 0 && <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, background: '#E53935', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', animation: 'pulse 1.5s ease infinite' }}>{unread}</span>}
                </Link>
                <Link to="/sell" style={{ padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: 'white', marginLeft: 4, textDecoration: 'none' }}>+ Sell</Link>
                <Link 
                  to="/dashboard" 
                  onMouseEnter={() => getProfile(user.id).catch(() => {})}
                  style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-bg)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginLeft: 8, textDecoration: 'none' }}
                >
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </Link>
                <button onClick={handleSignOut} style={{ marginLeft: 12, fontSize: 13, background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer' }}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ padding: '8px 18px', fontSize: 14, color: 'var(--ink2)', textDecoration: 'none' }}>Sign in</Link>
                <Link to="/signup" style={{ padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: 'white', textDecoration: 'none' }}>Get started</Link>
              </>
            )}
          </div>

          {/* ── Mobile Burger Button ───────────────────────── */}
          <div className="nav-mobile-btn" style={{ display: 'none', alignItems: 'center', gap: 12 }}>
            {user && unread > 0 && (
               <Link to="/inbox" style={{ position: 'relative', color: 'var(--ink2)' }}>
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                 <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, background: '#E53935', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>
               </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: 4, zIndex: 1100 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen 
                  ? <path d="M18 6L6 18M6 6l12 12" /> 
                  : <path d="M3 12h18M3 6h18M3 18h18" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile Sidebar Drawer ────────────────────────── */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(28,26,23,0.3)', backdropFilter: 'blur(4px)', zIndex: 1050, animation: 'fadeIn 0.2s ease' }} />
            <div style={{ position: 'fixed', top: 0, right: 0, width: '280px', height: '100vh', background: 'var(--card)', zIndex: 1060, padding: '80px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '-8px 0 32px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out' }}>
              {[
                { label: 'Browse', path: '/', icon: '🔍' },
                { label: 'Map',    path: '/map', icon: '📍' },
              ].map(({ label, path, icon }) => (
                <Link key={path} to={path} style={{ padding: '12px 16px', borderRadius: 12, fontSize: 16, fontWeight: 600, color: isActive(path) ? 'var(--accent)' : 'var(--ink)', background: isActive(path) ? 'var(--accent-bg)' : 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                  <span style={{ opacity: 0.7 }}>{icon}</span> {label}
                </Link>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              {user ? (
                <>
                  <Link to="/inbox" style={{ padding: '12px 16px', borderRadius: 12, fontSize: 16, fontWeight: 600, color: 'var(--ink)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>📫 Inbox</div>
                    {unread > 0 && <span style={{ background: '#E53935', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{unread} NEW</span>}
                  </Link>
                  <Link to="/sell" style={{ padding: '14px 16px', borderRadius: 12, fontSize: 16, fontWeight: 700, background: 'var(--accent)', color: 'white', textAlign: 'center', marginTop: 8, textDecoration: 'none' }}>+ Sell an Item</Link>
                  <Link to="/dashboard" style={{ padding: '12px 16px', borderRadius: 12, fontSize: 16, fontWeight: 600, color: 'var(--ink)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto', textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{user.email?.[0]?.toUpperCase() ?? 'U'}</div>
                    Account Dashboard
                  </Link>
                  <button onClick={handleSignOut} style={{ padding: '12px 16px', borderRadius: 12, fontSize: 15, color: '#C62828', background: '#FEEBEE', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" style={{ padding: '14px 16px', borderRadius: 12, fontSize: 16, fontWeight: 600, color: 'var(--ink)', background: 'var(--bg2)', textAlign: 'center', textDecoration: 'none' }}>Sign in</Link>
                  <Link to="/signup" style={{ padding: '14px 16px', borderRadius: 12, fontSize: 16, fontWeight: 700, background: 'var(--accent)', color: 'white', textAlign: 'center', textDecoration: 'none' }}>Get started</Link>
                </>
              )}
            </div>
          </>
        )}
      </nav>
    </>
  )
}