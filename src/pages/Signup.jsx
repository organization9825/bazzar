import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0: Form, 1: OTP
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    phone: '',
    agreedToPrivacy: false,
  })
  const { user } = useAuth()
  const location = useLocation()
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      if (user.email_confirmed_at) {
        navigate('/dashboard')
      } else {
        setForm(f => ({ ...f, email: user.email }))
        setStep(1)
      }
    } else if (location.state?.email) {
      setForm(f => ({ ...f, email: location.state.email }))
    }
  }, [user, navigate, location.state])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
  }

  const validate = () => {
    const errs = {}
    const p1 = form.password.trim()
    const p2 = form.confirmPassword.trim()

    if (!form.email) errs.email = 'Email required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.phone) errs.phone = 'Phone number required'
    else if (!/^[0-9]{10,15}$/.test(form.phone)) errs.phone = 'Invalid phone number (10-15 digits)'
    if (!p1) errs.password = 'Password required'
    else if (p1.length < 6) errs.password = 'Min. 6 characters'
    if (p1 !== p2) errs.confirmPassword = "Passwords don't match"
    if (!form.agreedToPrivacy) errs.agreedToPrivacy = 'Privacy consent required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setGlobalError('')
    try {
      // --- Signup + duplicate email detection ---
      // Supabase does NOT throw on duplicate emails; instead it returns a user
      // with an empty `identities` array. We check for that as our primary signal.
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            phone: form.phone
          }
        }
      })

      if (error) {
        // Catch Supabase's own duplicate-user signal as a string-match fallback
        const msg = error.message?.toLowerCase() ?? ''
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in instead.' }))
          return
        }
        throw error
      }

      // Primary duplicate check: empty identities = email already in use
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered. Please sign in instead.' }))
        return
      }

      setStep(1)
    } catch (err) {
      setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    setGlobalError('')
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: form.email,
        token: otp,
        type: 'signup'
      })
      if (error) throw error
      if (data.session) navigate('/setup-profile')
      else navigate('/login', { state: { message: 'Verified! Please sign in.' } })
    } catch (err) {
      setGlobalError('Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        @media (max-width: 850px) { .side-panel { display: none !important; } .form-panel { flex: 1 !important; padding: 32px 24px !important; } }
      `}</style>

      {/* Side Panel - Aesthetic & Modern */}
      <div className="side-panel" style={{ flex: '0 0 440px', background: 'var(--bg2)', padding: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="Bazaar" style={{ width: 48, height: 48, marginBottom: 24 }} />
          <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>Start your journey.</h1>
          <p style={{ fontSize: 17, color: 'var(--ink3)', lineHeight: 1.6 }}>Join the community marketplace designed for simplicity and trust.</p>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 'bold' }}>✓</div>
          <span style={{ fontSize: 14, color: 'var(--ink2)', fontWeight: 500 }}>Secure 6-digit verification</span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="animate-in" style={{ width: '100%', maxWidth: 400 }}>

          {step === 0 ? (
            <>
              <h2 style={{ fontSize: 32, marginBottom: 8 }}>Sign up</h2>
              <p style={{ color: 'var(--ink3)', marginBottom: 32 }}>Create your account to continue.</p>

              {globalError && <div style={{ padding: '12px 16px', background: '#FDF2F2', border: '1px solid #F8D7DA', color: '#da3f3f', borderRadius: 8, fontSize: 13, marginBottom: 24 }}>{globalError}</div>}

              <form onSubmit={handleSignup}>
                <Input label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="ashish@gmail.com" required error={errors.email} />
                <Input label="Phone Number" type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 9876543210" required error={errors.phone} />
                <Input
                  label="Create Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password} onChange={set('password')}
                  placeholder="Min. 6 characters" required error={errors.password}
                  trailingIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink3)' }}>
                      {showPassword ? '🐵' : '🙈'}
                    </button>
                  }
                />
                <Input
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="Repeat password" required error={errors.confirmPassword}
                />

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.agreedToPrivacy} onChange={set('agreedToPrivacy')} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                    <span style={{ fontSize: 13, color: 'var(--ink2)' }}>I agree to the <Link to="/privacy" style={{ color: 'var(--accent)', fontWeight: 600 }}>Privacy Policy</Link></span>
                  </label>
                  {errors.agreedToPrivacy && <p style={{ fontSize: 12, color: '#da3f3f', marginTop: 6 }}>{errors.agreedToPrivacy}</p>}
                </div>

                <button disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'var(--accent)', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Sending code...' : 'Create Account'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 20 }}>🛡️</div>
                <h2 style={{ fontSize: 28, marginBottom: 8 }}>Check your inbox</h2>
                <p style={{ color: 'var(--ink3)', marginBottom: 32 }}>Enter the 6-digit code sent to<br /> <b style={{ color: 'var(--ink)' }}>{form.email}</b></p>

                {globalError && <div style={{ color: '#da3f3f', fontSize: 14, marginBottom: 24 }}>{globalError}</div>}

                <form onSubmit={handleVerifyOtp}>
                  <input
                    type="text" maxLength="6" placeholder="000 000"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%', padding: '20px', fontSize: '36px', textAlign: 'center',
                      letterSpacing: '10px', borderRadius: 16, border: '2px solid var(--border)',
                      background: 'var(--bg2)', color: 'var(--ink)', fontWeight: '700',
                      marginBottom: 32, outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />

                  <button disabled={loading || otp.length < 6} style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'var(--accent)', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', transition: 'all 0.2s', opacity: (loading || otp.length < 6) ? 0.6 : 1 }}>
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>

                <button onClick={() => setStep(0)} style={{ marginTop: 24, background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                  Incorrect email? Go back
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 14, color: 'var(--ink3)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}