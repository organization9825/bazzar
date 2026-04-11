import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const Input = ({ label, type = 'text', value, onChange, placeholder, required, hint, error, icon, trailingIcon }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8 }}>
        {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1.5px solid ${error ? '#da3f3f' : focused ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12, background: 'var(--card)',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 3px rgba(212,98,42,0.1)' : 'none',
        position: 'relative'
      }}>
        {icon && <span style={{ padding: '0 12px', color: 'var(--ink3)' }}>{icon}</span>}
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, padding: trailingIcon ? '14px 44px 14px 16px' : '14px 16px',
            border: 'none', background: 'transparent',
            fontSize: 15, color: 'var(--ink)', outline: 'none',
          }}
        />
        {trailingIcon && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            {trailingIcon}
          </div>
        )}
      </div>
      {hint && !error && <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 6 }}>{hint}</p>}
      {error && <p style={{ fontSize: 12, color: '#da3f3f', marginTop: 6 }}>{error}</p>}
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const message = location.state?.message

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        @media (max-width: 850px) { .side-panel { display: none !important; } .form-panel { flex: 1 !important; padding: 32px 24px !important; } }
      `}</style>

      {/* Side Panel - Consistent with Signup */}
      <div className="side-panel" style={{ flex: '0 0 440px', background: 'var(--bg2)', padding: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="Bazaar" style={{ width: 48, height: 48, marginBottom: 24 }} />
          <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>Welcome back.</h1>
          <p style={{ fontSize: 17, color: 'var(--ink3)', lineHeight: 1.6 }}>Your local community is waiting. Sign in to continue your journey.</p>
        </div>
        <div style={{
          marginTop: '64px', background: 'var(--card)', padding: '24px', borderRadius: 16, border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <p style={{ color: 'var(--ink2)', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>
            "Found exactly what I needed at a fraction of the store price. Fast and easy."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>A</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Amit S.</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="animate-in" style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 32, marginBottom: 8 }}>Sign in</h2>
          <p style={{ color: 'var(--ink3)', marginBottom: 32 }}>Access your account to continue.</p>

          {message && <div style={{ padding: '12px 16px', background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 10, fontSize: 14, marginBottom: 24, fontWeight: 500 }}>{message}</div>}
          {error && <div style={{ padding: '12px 16px', background: '#FDF2F2', border: '1px solid #F8D7DA', color: '#da3f3f', borderRadius: 10, fontSize: 13, marginBottom: 24 }}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ashish@gmail.com" required />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              trailingIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink3)' }}>
                  {showPassword ? '🐵' : '🙈'}
                </button>
              }
            />

            <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 24 }}>
              <Link to="/reset-password" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Forgot password?</Link>
            </div>

            <button
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'var(--accent)', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 14, color: 'var(--ink3)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign up for free</Link>
          </div>
        </div>
      </div>
    </div>
  )
}