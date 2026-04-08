import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing, getOrCreateChat } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Listing() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [listing,     setListing]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getListing(id)
        setListing(data)
        const primary = data.images?.find(img => img.is_primary) || data.images?.[0]
        setActiveImage(primary?.public_url)
      } catch (err) {
        console.error(err)
        setError('Listing not found or has been removed.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--ink3)' }}>Loading details...</div>
    </div>
  }

  if (error || !listing) {
    return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ color: 'var(--ink3)' }}>{error || 'Listing not found.'}</div>
      <button onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>Back to Home</button>
    </div>
  }

  const CONDITION_LABELS = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--ink3)', fontSize: '15px', fontWeight: '500', cursor: 'pointer', marginBottom: '24px' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        {/* Two Column Layout container */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'wrap',
          gap: '40px',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '24px',
          boxShadow: 'var(--shadow)'
        }}>
          
          {/* Left Column: Images */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              width: '100%', aspectRatio: '4/3', borderRadius: '12px', background: 'var(--bg2)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {activeImage ? (
                <img src={activeImage} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: 'var(--ink3)' }}>No image available</span>
              )}
            </div>

            {/* Thumbnail gallery */}
            {listing.images?.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                {listing.images.map((img) => (
                  <button 
                    key={img.id}
                    onClick={() => setActiveImage(img.public_url)}
                    style={{ 
                      width: '80px', height: '80px', flexShrink: 0, padding: 0,
                      borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                      border: activeImage === img.public_url ? '2px solid var(--accent)' : '2px solid transparent',
                      background: 'var(--bg2)'
                    }}
                  >
                    <img src={img.public_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {listing.is_sold && (
                <span style={{ background: 'var(--ink)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>SOLD</span>
              )}
              {listing.category && (
                <span style={{ background: 'var(--bg2)', color: 'var(--ink2)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', border: '1px solid var(--border)' }}>
                  {listing.category.name}
                </span>
              )}
              <span style={{ background: '#EAF4EF', color: '#2D6A4F', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                {CONDITION_LABELS[listing.condition] || listing.condition}
              </span>
            </div>

            <h1 style={{ fontSize: '32px', fontFamily: 'Playfair Display', color: 'var(--ink)', marginBottom: '8px', lineHeight: 1.2 }}>
              {listing.title}
            </h1>
            
            <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'Playfair Display', marginBottom: '24px' }}>
              ₹{Number(listing.price).toLocaleString()}
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink2)', marginBottom: '8px' }}>Description</h3>
              <p style={{ color: 'var(--ink)', fontSize: '16px', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '32px' }}>
                {listing.description || <span style={{ color: 'var(--ink3)', fontStyle: 'italic' }}>No description provided.</span>}
              </p>
            </div>

            {/* Seller Info Container */}
            <div style={{ marginTop: 'auto', background: 'var(--bg2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {listing.seller?.avatar_url ? (
                  <img src={listing.seller.avatar_url} alt={listing.seller.full_name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                    {listing.seller?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--ink3)', fontWeight: '500', marginBottom: '2px' }}>Listed by</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)' }}>{listing.seller?.full_name || 'Anonymous User'}</div>
                  {listing.seller?.city && (
                    <div style={{ fontSize: '14px', color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.25 6 11 6 11C6 11 9.5 7.25 9.5 4.5C9.5 2.57 7.93 1 6 1ZM6 6C5.17 6 4.5 5.33 4.5 4.5C4.5 3.67 5.17 3 6 3C6.83 3 7.5 3.67 7.5 4.5C7.5 5.33 6.83 6 6 6Z" fill="currentColor"/>
                      </svg>
                      {listing.seller.city}
                    </div>
                  )}
                </div>
              </div>

              <button
                style={{ 
                  width: '100%', padding: '14px 24px', borderRadius: '10px', 
                  background: listing.is_sold ? 'var(--ink3)' : 'var(--accent)', 
                  color: 'white', border: 'none', fontSize: '16px', fontWeight: '600',
                  cursor: listing.is_sold || chatLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                disabled={listing.is_sold || chatLoading}
                onMouseEnter={e => { if (!listing.is_sold) e.currentTarget.style.background = '#C0561F' }}
                onMouseLeave={e => { if (!listing.is_sold) e.currentTarget.style.background = 'var(--accent)' }}
                onClick={async () => {
                  if (!user) { navigate('/login'); return }
                  if (user.id === listing.seller?.id) return
                  setChatLoading(true)
                  try {
                    const chat = await getOrCreateChat(user.id, listing.seller.id, listing.id)
                    navigate(`/inbox?chat=${chat.id}`)
                  } catch (err) {
                    console.error('Chat error', err)
                  } finally {
                    setChatLoading(false)
                  }
                }}
              >
                {listing.is_sold ? 'Item is Sold'
                  : chatLoading ? 'Opening chat…'
                  : !user ? 'Sign in to Message Seller'
                  : user.id === listing.seller?.id ? 'This is your listing'
                  : 'Message Seller'}
              </button>

              {listing.lat && listing.lng && (
                <button
                  style={{
                    width: '100%', padding: '12px 24px', borderRadius: '10px', marginTop: '10px',
                    background: 'transparent', color: 'var(--ink2)', border: '1px solid var(--border)', 
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => navigate(`/map?lat=${listing.lat}&lng=${listing.lng}`)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--ink)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink2)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  View on Map
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
