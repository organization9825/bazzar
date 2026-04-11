import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Input({ label, type = 'text', value, onChange, placeholder, required, trailingIcon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8 }}>
        {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12, background: 'var(--card)', transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 3px rgba(212,98,42,0.1)' : 'none', position: 'relative'
      }}>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, padding: trailingIcon ? '14px 44px 14px 16px' : '14px 16px', border: 'none', background: 'transparent', fontSize: 15, color: 'var(--ink)', outline: 'none' }}
        />
        {trailingIcon && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            {trailingIcon}
          </div>
        )}
      </div>
    </div>
  )
}

// step 0 = enter email, step 1 = enter OTP, step 2 = enter new password
export default function ResetPassword() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(0)
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // ── Step 0: send OTP ────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      // redirectTo not needed for OTP flow — Supabase sends a 6-digit code
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setStep(1)
  }

  // ── Step 1: verify OTP ──────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    })
    setLoading(false)
    if (err) { setError('Invalid or expired code. Please try again.'); return }
    setStep(2)
  }

  // ── Step 2: set new password ────────────────────────────────
  const handleSetPassword = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError("Passwords don't match."); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/login', { state: { message: '✅ Password updated! Please sign in.' } })
  }

  const Btn = ({ children, disabled }) => (
    <button disabled={disabled} style={{
      width: '100%', padding: '16px', borderRadius: 14,
      background: 'var(--accent)', color: 'white', fontSize: 16,
      fontWeight: 700, border: 'none', transition: 'all 0.2s',
      opacity: disabled ? 0.7 : 1, marginTop: 4, cursor: disabled ? 'not-allowed' : 'pointer'
    }}>{children}</button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-in { animation: fadeUp 0.5s cubic-bezier(0.4,0,0.2,1); }
        @media (max-width:850px) { .side-panel { display:none !important; } .form-panel { flex:1 !important; padding:32px 24px !important; } }
      `}</style>

      {/* Side Panel */}
      <div className="side-panel" style={{ flex: '0 0 440px', background: 'var(--bg2)', padding: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)' }}>
        <img src="/logo.png" alt="Bazaar" style={{ width: 48, height: 48, marginBottom: 24 }} />
        <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>
          {step === 0 ? 'Forgot password?' : step === 1 ? 'Check your inbox.' : 'New password.'}
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink3)', lineHeight: 1.6 }}>
          {step === 0 && "Enter your email and we'll send a 6-digit code."}
          {step === 1 && `We've sent a 6-digit code to ${email}.`}
          {step === 2 && "Choose a strong password you haven't used before."}
        </p>
      </div>

      {/* Form Panel */}
      <div className="form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="animate-in" style={{ width: '100%', maxWidth: 400 }}>

          {error && (
            <div style={{ padding: '12px 16px', background: '#FDF2F2', border: '1px solid #F8D7DA', color: '#da3f3f', borderRadius: 10, fontSize: 13, marginBottom: 24 }}>
              {error}
            </div>
          )}

          {/* ── Step 0: Email ── */}
          {step === 0 && (
            <>
              <div style={{ fontSize: 48, marginBottom: 20 }}>📧</div>
              <h2 style={{ fontSize: 32, marginBottom: 8 }}>Reset password</h2>
              <p style={{ color: 'var(--ink3)', marginBottom: 32 }}>Enter your email to receive a verification code.</p>
              <form onSubmit={handleSendOtp}>
                <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                <Btn disabled={loading}>{loading ? 'Sending code…' : 'Send code'}</Btn>
              </form>
            </>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🛡️</div>
                <h2 style={{ fontSize: 28, marginBottom: 8 }}>Enter the code</h2>
                <p style={{ color: 'var(--ink3)' }}>
                  6-digit code sent to <b style={{ color: 'var(--ink)' }}>{email}</b>
                </p>
              </div>
              <form onSubmit={handleVerifyOtp}>
                <input
                  type="text" maxLength="6"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000 000"
                  style={{
                    width: '100%', padding: '20px', fontSize: '36px', textAlign: 'center',
                    letterSpacing: '10px', borderRadius: 16, border: '2px solid var(--border)',
                    background: 'var(--bg2)', color: 'var(--ink)', fontWeight: '700',
                    marginBottom: 24, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <Btn disabled={loading || otp.length < 6}>{loading ? 'Verifying…' : 'Verify Code'}</Btn>
              </form>
              <button onClick={() => { setStep(0); setOtp(''); setError('') }} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                Wrong email? Go back
              </button>
            </>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 2 && (
            <>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🔑</div>
              <h2 style={{ fontSize: 32, marginBottom: 8 }}>Set new password</h2>
              <p style={{ color: 'var(--ink3)', marginBottom: 32 }}>Almost done — choose a secure password.</p>
              <form onSubmit={handleSetPassword}>
                <Input
                  label="New password" type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required
                  trailingIcon={
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink3)' }}>
                      {showPw ? '🐵' : '🙈'}
                    </button>
                  }
                />
                <Input
                  label="Confirm password" type={showPw ? 'text' : 'password'}
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" required
                />
                <Btn disabled={loading}>{loading ? 'Updating…' : 'Update password'}</Btn>
              </form>
            </>
          )}

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: 'var(--ink3)' }}>
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
