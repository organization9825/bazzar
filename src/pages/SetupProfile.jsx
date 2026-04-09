import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getProfile, updateProfile } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function SetupProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ fullName: '', bio: '', city: '', lat: '', lng: '', phone: '' })

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (!user.email_confirmed_at) {
      navigate('/signup', { state: { email: user.email } })
      return
    }
    if (user?.user_metadata?.phone && !form.phone) {
      setForm(f => ({ ...f, phone: user.user_metadata.phone }))
    }
    getProfile(user.id).then(p => {
      if (p?.full_name) navigate('/dashboard')
    })
  }, [user, navigate])

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const detectLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }))
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim()) return
    if (!form.phone || !/^[0-9]{10,15}$/.test(form.phone)) {
      alert('Please enter a valid phone number (10-15 digits).')
      return
    }
    setLoading(true)
    try {
      await updateProfile(user.id, {
        full_name: form.fullName.trim(),
        bio: form.bio || null,
        city: form.city || null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        phone: form.phone
      })
      navigate('/dashboard')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--ink)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes slideFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .setup-card { animation: slideFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .form-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 4px rgba(212,98,42,0.1); }
        
        @media (max-width: 600px) {
          .setup-card { 
            padding: 32px 16px !important; 
            border-radius: 0 !important; 
            border: none !important; 
            box-shadow: none !important; 
            background: transparent !important; 
            max-width: 100% !important;
          }
          .setup-header h2 { font-size: 26px !important; }
          .location-details-box { padding: 16px !important; border-radius: 16px !important; }
          .detect-btn { height: 48px !important; font-size: 15px !important; }
        }
      `}</style>

      <div className="setup-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div className="setup-card" style={{ background: 'var(--card)', padding: '48px', borderRadius: '32px', border: '1px solid var(--border)', maxWidth: '540px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>

          <div className="setup-header" style={{ marginBottom: 40 }}>
            <div style={{ width: 64, height: 64, background: 'var(--accent-bg)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 28 }}>👤</div>
            <h2 style={{ fontSize: '34px', fontFamily: 'Playfair Display', fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>Complete your profile</h2>
            <p style={{ color: 'var(--ink3)', fontSize: '16px', lineHeight: 1.6 }}>You're almost there! Tell us a bit about yourself to join the Bazaar community.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink2)' }}>Full Name *</label>
              <input
                required value={form.fullName} onChange={set('fullName')}
                placeholder="e.g. John Doe"
                className="form-input"
                style={{ width: '100%', padding: '16px 18px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', fontSize: '16px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink2)' }}>Phone Number *</label>
              <input
                required type="tel" value={form.phone} onChange={set('phone')}
                placeholder="e.g. 9876543210"
                className="form-input"
                style={{ width: '100%', padding: '16px 18px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', fontSize: '16px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink2)' }}>Bio (Optional)</label>
              <textarea
                value={form.bio} onChange={set('bio')}
                placeholder="Ex: Passionate about sustainable fashion..."
                rows={3}
                className="form-input"
                style={{ width: '100%', padding: '16px 18px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', fontSize: '15px', resize: 'vertical', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
              />
            </div>

            <div className="location-details-box" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--ink2)', marginBottom: 16 }}>Your Home Base</label>
              <input
                value={form.city} onChange={set('city')}
                placeholder="City Name"
                className="form-input"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', marginBottom: '16px', fontSize: '15px', transition: 'all 0.2s', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Latitude</label>
                    <input value={form.lat} readOnly placeholder="Lat" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg3)', fontSize: '13px', color: 'var(--ink)', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Longitude</label>
                    <input value={form.lng} readOnly placeholder="Lng" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg3)', fontSize: '13px', color: 'var(--ink)', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <button type="button" onClick={detectLocation} className="detect-btn" style={{ width: '100%', height: 44, borderRadius: '12px', background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                  📍 Detect Location
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              style={{
                padding: '18px',
                borderRadius: '18px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                fontWeight: '700',
                fontSize: '17px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 12px 30px rgba(212,98,42,0.25)',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Finalizing Setup...' : 'Enter Marketplace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
