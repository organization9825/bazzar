import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [mode, setMode]             = useState('login')   // 'login' | 'forgot'
  const [resetSent, setResetSent]   = useState(false)
  const [emailFocused, setEmailFocused]   = useState(false)
  const [passFocused, setPassFocused]     = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) throw err
      setResetSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg)',
    }}>
      {/* Left decorative panel */}
      <div className="auth-panel" style={{ flex: '0 0 420px', background: 'var(--ink)', position: 'relative', overflow: 'hidden', flexDirection: 'column', justifyContent: 'center', padding: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <img 
            src="/logo.png" 
            alt="Bazaar Logo" 
            style={{ width: 44, height: 44, objectFit: 'contain' }} 
          />
          <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 24, color: 'white' }}>Bazaar</span>
        </div>

        <h2 style={{ fontFamily: 'Playfair Display', fontSize: 34, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
          Welcome back
        </h2>
        <p style={{ color: '#A09890', fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
          Sign in to browse listings, manage your items, and connect with local buyers and sellers.
        </p>

        {/* Testimonial card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px',
        }}>
          <p style={{ color: '#D4C4B8', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>
            "Sold my old laptop in two days. The map feature made it so easy to meet up locally."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>R</div>
            <div>
              <p style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>Ravi K.</p>
              <p style={{ color: '#A09890', fontSize: 12 }}>Seller from Lalitpur</p>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,98,42,0.07)' }} />
      </div>

      {/* Right — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Reset sent confirmation */}
          {resetSent ? (
            <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M6 16L13 23L26 9" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, marginBottom: 10 }}>Check your email</h2>
              <p style={{ color: 'var(--ink3)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
                We sent a password reset link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>.
              </p>
              <button onClick={() => { setMode('login'); setResetSent(false) }} style={{
                padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', color: 'white', border: 'none', fontSize: 15, fontWeight: 600,
              }}>Back to sign in</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 32, animation: 'slideDown 0.4s ease' }}>
                <h1 style={{ fontSize: 30, fontFamily: 'Playfair Display', marginBottom: 6 }}>
                  {mode === 'login' ? 'Sign in' : 'Reset password'}
                </h1>
                <p style={{ fontSize: 15, color: 'var(--ink3)' }}>
                  {mode === 'login' ? 'Enter your email and password to continue.' : 'Enter your email and we\'ll send a reset link.'}
                </p>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, animation: 'slideDown 0.3s ease' }}>
                  <p style={{ color: '#DC2626', fontSize: 14 }}>{error}</p>
                </div>
              )}

              <form onSubmit={mode === 'login' ? handleLogin : handleReset} style={{ animation: 'slideDown 0.35s ease' }} key={mode}>

                {/* Email */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>Email address</label>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: `1.5px solid ${emailFocused ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, background: 'var(--card)',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(212,98,42,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ padding: '0 14px', color: 'var(--ink3)' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 5L8 9L15 5" stroke="currentColor" strokeWidth="1.4"/></svg>
                    </span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                      onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                      style={{ flex: 1, padding: '14px 14px 14px 0', border: 'none', background: 'transparent', fontSize: 15, color: 'var(--ink)', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Password */}
                {mode === 'login' && (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>Password</label>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      border: `1.5px solid ${passFocused ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 10, background: 'var(--card)',
                      boxShadow: passFocused ? '0 0 0 3px rgba(212,98,42,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ padding: '0 14px', color: 'var(--ink3)' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      </span>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required
                        onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                        style={{ flex: 1, padding: '14px 0', border: 'none', background: 'transparent', fontSize: 15, color: 'var(--ink)', outline: 'none' }}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        style={{ padding: '0 14px', background: 'none', border: 'none', color: 'var(--ink3)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        Forgot password?
                      </button>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '15px', borderRadius: 10, marginTop: 12,
                  background: loading ? 'var(--border)' : 'var(--accent)', color: 'white',
                  border: 'none', fontSize: 16, fontWeight: 600,
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading ? (
                    <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {mode === 'login' ? 'Signing in…' : 'Sending…'}</>
                  ) : mode === 'login' ? 'Sign in →' : 'Send reset link →'}
                </button>

                {mode === 'forgot' && (
                  <button type="button" onClick={() => { setMode('login'); setError('') }} style={{
                    width: '100%', padding: '12px', marginTop: 10, borderRadius: 10,
                    border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--ink2)',
                    fontSize: 15, fontWeight: 500, cursor: 'pointer',
                  }}>← Back to sign in</button>
                )}
              </form>

              {/* Divider */}
              {mode === 'login' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 13, color: 'var(--ink3)' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>

                  <Link to="/signup" style={{ display: 'block' }}>
                    <div style={{
                      width: '100%', padding: '14px', borderRadius: 10, textAlign: 'center',
                      border: '1.5px solid var(--border)', background: 'var(--card)',
                      color: 'var(--ink)', fontSize: 15, fontWeight: 500, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      Create a new account
                    </div>
                  </Link>
                </>
              )}

              <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--ink3)', lineHeight: 1.5 }}>
                By signing in, you agree to our <Link to="/privacy" style={{ color: 'var(--accent)', fontWeight: 500 }}>Privacy Policy</Link>.<br/>
                Your messages are end-to-end encrypted.
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`.auth-panel { display: flex !important; } @media (max-width: 900px) { .auth-panel { display: none !important; } }`}</style>
    </div>
  )
}