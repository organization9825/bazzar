import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STEPS = ['Account', 'Profile', 'Location']

const Input = ({ label, type = 'text', value, onChange, placeholder, required, hint, error, icon }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
        {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1.5px solid ${error ? '#DC2626' : focused ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10, background: 'var(--card)',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 3px rgba(212,98,42,0.1)' : 'none',
      }}>
        {icon && <span style={{ padding: '0 12px', color: 'var(--ink3)' }}>{icon}</span>}
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, padding: icon ? '13px 12px 13px 0' : '13px 14px',
            border: 'none', background: 'transparent',
            fontSize: 15, color: 'var(--ink)', outline: 'none',
          }}
        />
      </div>
      {hint && !error && <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 5 }}>{hint}</p>}
      {error && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>{error}</p>}
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', bio: '', phone: '',
    city: '', lat: '', lng: '',
    agreedToPrivacy: false,
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
  }

  const validateStep = () => {
    const errs = {}
    if (step === 0) {
      if (!form.email) errs.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
      if (!form.password) errs.password = 'Password is required'
      else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
      if (!form.agreedToPrivacy) errs.agreedToPrivacy = 'You must agree to the Privacy Policy'
    }
    if (step === 1) {
      if (!form.fullName) errs.fullName = 'Full name is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => { if (validateStep()) setStep(s => s + 1) }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }))
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    setLoading(true)
    setGlobalError('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (error) throw error

      // If email confirmation is ON, session will be null
      if (data.user && !data.session) {
        setStep(100) // Special value for verification message
        return
      }

      navigate('/?welcome=1')
    } catch (err) {
      setGlobalError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Verification Screen ────────────────────────────────────
  if (step === 100) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
        <div style={{ background: 'var(--card)', padding: '48px', borderRadius: '24px', border: '1px solid var(--border)', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📧</div>
          <h2 style={{ fontSize: '28px', fontFamily: 'Playfair Display', color: 'var(--ink)', marginBottom: '16px' }}>Verify your email</h2>
          <p style={{ color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '32px', fontSize: '16px' }}>
            We've sent a confirmation link to <strong style={{ color: 'var(--ink)' }}>{form.email}</strong>. 
            Please check your inbox (and spam folder) to activate your account.
          </p>
          <button 
            onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const progressPct = ((step) / STEPS.length) * 100

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--bg)',
    }}>
      {/* Left panel — decorative */}
      <div style={{
        flex: '0 0 420px', display: 'none',
        background: 'var(--ink)', position: 'relative', overflow: 'hidden',
        '@media (min-width: 900px)': { display: 'flex' },
      }}
        className="auth-panel"
      >
        <div style={{ padding: '48px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
            <img 
              src="/logo.png" 
              alt="Bazaar Logo" 
              style={{ width: 44, height: 44, objectFit: 'contain' }} 
            />
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 24, color: 'white' }}>Bazaar</span>
          </div>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 36, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
            Join thousands of local sellers
          </h2>
          <p style={{ color: '#A09890', fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
            List your items, find great deals, and connect with buyers and sellers in your neighbourhood.
          </p>
          {[
            'Free to list and browse',
            'Photo uploads included',
            'Find sellers on the map',
            'Direct contact with sellers',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(212,98,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ color: '#C8BEB6', fontSize: 15 }}>{item}</span>
            </div>
          ))}
        </div>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,98,42,0.08)' }} />
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Progress bar */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i < step ? 'var(--green)' : i === step ? 'var(--accent)' : 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    {i < step ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: i === step ? 'white' : 'var(--ink3)' }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: i === step ? 'var(--ink)' : 'var(--ink3)' }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progressPct + (100 / STEPS.length)}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Form header */}
          <div style={{ marginBottom: 32, animation: 'slideDown 0.4s ease' }}>
            <h1 style={{ fontSize: 28, fontFamily: 'Playfair Display', marginBottom: 6 }}>
              {step === 0 ? 'Create your account' : step === 1 ? 'Tell us about you' : 'Where are you?'}
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink3)' }}>
              {step === 0 ? 'Start by setting up your login credentials.'
               : step === 1 ? 'This helps buyers and sellers know who they\'re dealing with.'
               : 'Your location helps show you nearby listings and sellers.'}
            </p>
          </div>

          {globalError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ color: '#DC2626', fontSize: 14 }}>{globalError}</p>
            </div>
          )}

          <form onSubmit={step < STEPS.length - 1 ? (e) => { e.preventDefault(); nextStep() } : handleSubmit} style={{ animation: 'slideDown 0.35s ease' }} key={step}>

            {/* Step 0: Account */}
            {step === 0 && (
              <>
                <Input label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required error={errors.email}
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 5L8 9L15 5" stroke="currentColor" strokeWidth="1.4"/></svg>}
                />
                <div style={{ position: 'relative' }}>
                  <Input label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="At least 6 characters" required hint="Use a mix of letters, numbers and symbols" error={errors.password}
                    icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 14, top: 38, background: 'none', border: 'none', color: 'var(--ink3)', fontSize: 12, fontWeight: 500 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat your password" required error={errors.confirmPassword}
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
                />

                <div style={{ marginTop: 24, marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={form.agreedToPrivacy} 
                      onChange={set('agreedToPrivacy')} 
                      style={{ marginTop: 4, width: 18, height: 18, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>
                      I agree to the <Link to="/privacy" target="_blank" style={{ color: 'var(--accent)', fontWeight: 600 }}>Privacy Policy</Link> and understand that my messages are end-to-end encrypted.
                    </span>
                  </label>
                  {errors.agreedToPrivacy && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>{errors.agreedToPrivacy}</p>}
                </div>
              </>
            )}

            {/* Step 1: Profile */}
            {step === 1 && (
              <>
                <Input label="Full name" value={form.fullName} onChange={set('fullName')} placeholder="Your name as buyers will see it" required error={errors.fullName}
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
                />
                <Input label="Phone number" type="tel" value={form.phone} onChange={set('phone')} placeholder="+977 98XXXXXXXX" hint="Optional — helps buyers reach you faster"
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="1" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/></svg>}
                />
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 6 }}>
                    Bio <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    value={form.bio} onChange={set('bio')}
                    placeholder="Tell buyers a bit about yourself…"
                    rows={3}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15,
                      border: '1.5px solid var(--border)', background: 'var(--card)',
                      color: 'var(--ink)', resize: 'vertical', lineHeight: 1.5,
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 4 }}>{form.bio.length}/200</p>
                </div>
              </>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <>
                <Input label="City / Town" value={form.city} onChange={set('city')} placeholder="e.g. Kathmandu"
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C5.79 1 4 2.79 4 5C4 8.25 8 15 8 15C8 15 12 8.25 12 5C12 2.79 10.21 1 8 1ZM8 7C7.17 7 6.5 6.33 6.5 5.5C6.5 4.67 7.17 4 8 4C8.83 4 9.5 4.67 9.5 5.5C9.5 6.33 8.83 7 8 7Z" fill="currentColor"/></svg>}
                />

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink2)', marginBottom: 8 }}>
                    Precise location <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(optional — used for map)</span>
                  </label>

                  <button type="button" onClick={detectLocation} style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: '1.5px dashed var(--border)', background: 'var(--bg2)',
                    color: 'var(--ink2)', fontSize: 14, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: 'pointer', transition: 'all 0.2s', marginBottom: 12,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink2)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1V3M8 13V15M1 8H3M13 8H15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    {form.lat ? `Detected: ${form.lat}, ${form.lng}` : 'Detect my location automatically'}
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <input value={form.lat} onChange={set('lat')} placeholder="Latitude" type="number" step="any"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input value={form.lng} onChange={set('lng')} placeholder="Longitude" type="number" step="any"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--ink)' }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 6 }}>
                    You can update your location anytime from your profile.
                  </p>
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)} style={{
                  flex: '0 0 auto', padding: '14px 24px', borderRadius: 10,
                  border: '1.5px solid var(--border)', background: 'transparent',
                  color: 'var(--ink2)', fontSize: 15, fontWeight: 500,
                  transition: 'all 0.2s',
                }}>← Back</button>
              )}
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: '14px', borderRadius: 10,
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: 'white', border: 'none', fontSize: 16, fontWeight: 600,
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating…</>
                ) : step < STEPS.length - 1 ? `Continue → ${STEPS[step + 1]}` : 'Create my account'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--ink3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`.auth-panel { display: flex !important; flex-direction: column; justify-content: center; } @media (max-width: 900px) { .auth-panel { display: none !important; } }`}</style>
    </div>
  )
}