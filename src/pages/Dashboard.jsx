import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getProfile, getMyListings, updateProfile, markAsSold, markAsActive, deleteListing, updateListing } from '../lib/supabase'
import ListingCard from '../components/ListingCard'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editData, setEditData] = useState({ full_name: '', bio: '', city: '' })
  
  const [editingItem, setEditingItem] = useState(null)
  const [itemEditData, setItemEditData] = useState({ title: '', description: '', price: '' })
  
  const navigate = useNavigate()
  const location = useLocation()
  const [message, setMessage] = useState(location.state?.message || null)

  useEffect(() => {
    // Clear message after 5 seconds
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
        // clean up state smoothly so message doesn't return on refresh
        window.history.replaceState({}, document.title)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    async function loadDashboard() {
      if (!user) {
        navigate('/login')
        return
      }
      try {
        const [profData, myItems] = await Promise.all([
          getProfile(user.id),
          getMyListings(user.id)
        ])
        
        setProfile(profData)
        setEditData({ 
          full_name: profData.full_name || '', 
          bio: profData.bio || '', 
          city: profData.city || '' 
        })
        setListings(myItems)
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [navigate])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const updated = await updateProfile(user.id, editData)
      setProfile(updated)
      setEditingProfile(false)
      setMessage('Profile updated successfully!')
    } catch (err) {
      console.error(err)
      setMessage('Failed to update profile.')
    }
  }

  const handleUpdateListing = async (e) => {
    e.preventDefault()
    try {
      const updated = await updateListing(editingItem.id, {
        title: itemEditData.title,
        description: itemEditData.description,
        price: parseFloat(itemEditData.price)
      })
      setListings(listings.map(l => l.id === editingItem.id ? { ...l, ...updated } : l))
      setEditingItem(null)
      setMessage('Listing updated successfully!')
    } catch (err) {
      console.error(err)
      setMessage('Failed to update listing.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListing(id)
        setListings(listings.filter(l => l.id !== id))
        setMessage('Listing deleted successfully!')
      } catch (err) {
        console.error(err)
        setMessage('Failed to delete listing.')
      }
    }
  }

  const handleToggleSold = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await markAsActive(id)
        setListings(listings.map(l => l.id === id ? { ...l, is_sold: false } : l))
        setMessage('Listing marked as active!')
      } else {
        await markAsSold(id)
        setListings(listings.map(l => l.id === id ? { ...l, is_sold: true } : l))
        setMessage('Listing marked as sold!')
      }
    } catch (err) {
      console.error('Toggle Sold Error:', err)
      setMessage(`Update failed: ${err.message || 'Check your permissions.'}`)
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--ink3)' }}>Loading dashboard...</div>
  if (!profile) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {message && (
          <div style={{ 
            background: 'var(--accent-bg)', 
            color: 'var(--accent)', 
            padding: '16px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '1px solid rgba(212,98,42,0.2)' 
          }}>
            {message}
          </div>
        )}

        {/* Profile Card */}
        <div style={{ 
          background: 'var(--card)', 
          padding: '32px', 
          borderRadius: '16px', 
          border: '1px solid var(--border)', 
          boxShadow: 'var(--shadow)',
          marginBottom: '32px',
          transition: 'all 0.3s ease',
          animation: 'fadeUp 0.4s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Avatar Clickable Upload */}
              <label style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }} title="Click to update picture">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" style={{
                    width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)',
                    transition: 'opacity 0.2s'
                  }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'} />
                ) : (
                  <div style={{ 
                    width: '80px', height: '80px', borderRadius: '50%', 
                    background: 'var(--accent)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '32px', fontWeight: 'bold',
                    transition: 'opacity 0.2s'
                  }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    {profile.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                )}
                
                <input 
                  type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0]
                      const compressImage = (f) => new Promise((resolve) => {
                        const reader = new FileReader(); reader.readAsDataURL(f);
                        reader.onload = (ev) => {
                          const img = new Image(); img.src = ev.target.result;
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let { width, height } = img;
                            const MAX_DIM = 800;
                            if (width > height && width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
                            else if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
                            canvas.width = width; canvas.height = height;
                            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                            let quality = 0.9;
                            const compress = () => {
                              canvas.toBlob((blob) => {
                                if (blob.size > 150 * 1024 && quality > 0.1) { quality -= 0.1; compress(); }
                                else { resolve(new File([blob], f.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() })); }
                              }, 'image/jpeg', quality);
                            }; compress();
                          };
                        };
                      });
                      try {
                        setMessage('Uploading profile picture...')
                        const compressed = await compressImage(file)
                        const { uploadAvatar } = await import('../lib/supabase')
                        const url = await uploadAvatar(user.id, compressed)
                        
                        // Immediately save to profile database
                        await updateProfile(user.id, { avatar_url: url })
                        
                        setProfile({ ...profile, avatar_url: url })
                        setEditData({ ...editData, avatar_url: url })
                        setMessage('Profile picture updated successfully!')
                      } catch (err) {
                        console.error('Avatar upload failed', err)
                        setMessage('Failed to upload picture.')
                      }
                    }
                  }}
                />
              </label>

              <div>
                <h1 style={{ fontSize: '24px', fontFamily: 'Playfair Display', color: 'var(--ink)', marginBottom: '4px' }}>
                  {profile.full_name || 'Anonymous User'}
                </h1>
                <div style={{ color: 'var(--ink2)', fontSize: '15px', marginBottom: '8px' }}>
                  {user.email} <span style={{ color: 'var(--ink3)', margin: '0 8px' }}>•</span> {profile.city || 'No city set'}
                </div>
                <p style={{ color: 'var(--ink3)', fontSize: '14px', maxWidth: '400px' }}>
                  {profile.bio || 'This user has not written a bio yet.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setEditingProfile(!editingProfile)}
              style={{
                padding: '8px 16px', borderRadius: '8px', 
                border: '1px solid var(--border)', background: 'var(--bg)', 
                color: 'var(--ink)', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
            >
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editingProfile && (
            <form onSubmit={handleUpdateProfile} style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s' }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--ink2)' }}>Full Name</label>
                  <input 
                    type="text" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--ink2)' }}>City / Location</label>
                  <input 
                    type="text" value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--ink)' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--ink2)' }}>Bio</label>
                <textarea 
                  rows={3} value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--ink)' }}
                />
              </div>
              <button 
                type="submit"
                style={{
                  padding: '10px 24px', borderRadius: '8px', 
                  background: 'var(--accent)', color: 'white', 
                  border: 'none', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#C0561F'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
              >
                Save Changes
              </button>
            </form>
          )}
        </div>

        {/* Listings Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display', color: 'var(--ink)' }}>My Listings ({listings.length})</h2>
            <button 
              onClick={() => navigate('/sell')}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-bg)', color: 'var(--accent)', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              + New Listing
            </button>
          </div>

          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg2)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--ink3)', marginBottom: '16px' }}>You haven't posted any items yet.</p>
              <button 
                onClick={() => navigate('/sell')}
                style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Start Selling
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {listings.map((listing, i) => (
                <div key={listing.id} style={{ position: 'relative' }}>
                  <ListingCard listing={{...listing, seller: profile}} index={i} />
                  
                  {/* Action Overlay / Tags */}
                  {listing.is_sold && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(28,26,23,0.85)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', zIndex: 2 }}>
                      SOLD
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', padding: '0 4px', position: 'relative', zIndex: 10 }}>
                    {!listing.is_sold ? (
                      <>
                        <button 
                          onClick={() => {
                            setEditingItem(listing)
                            setItemEditData({ title: listing.title, description: listing.description || '', price: listing.price })
                          }}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--ink)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleToggleSold(listing.id, listing.is_sold)}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--ink)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
                        >
                          Mark Sold
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleToggleSold(listing.id, listing.is_sold)}
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#EAF4EF', border: '1px solid #b7dfca', color: '#2D6A4F', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#d4ebe0' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#EAF4EF' }}
                      >
                        Unmark Sold
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(listing.id)}
                      style={{ flex: listing.is_sold ? 1 : 0.8, padding: '8px', borderRadius: '8px', background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item Edit Modal */}
        {editingItem && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
            <div style={{ background: 'var(--card)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '500px', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontFamily: 'Playfair Display' }}>Edit Listing</h2>
                <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--ink3)' }}>&times;</button>
              </div>
              <form onSubmit={handleUpdateListing}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--ink2)' }}>Title</label>
                  <input required type="text" value={itemEditData.title} onChange={e => setItemEditData({...itemEditData, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--ink)' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--ink2)' }}>Price</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--ink3)' }}>$</span>
                    <input required type="number" step="0.01" value={itemEditData.price} onChange={e => setItemEditData({...itemEditData, price: e.target.value})} style={{ width: '100%', padding: '10px 10px 10px 28px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--ink)' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--ink2)' }}>Description</label>
                  <textarea rows={4} value={itemEditData.description} onChange={e => setItemEditData({...itemEditData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--ink)' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Save Changes</button>
                  <button type="button" onClick={() => setEditingItem(null)} style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--ink)', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
