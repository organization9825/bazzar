import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing, uploadListingImage, getCategories } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Sell() {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState('new')
  const [categoryId, setCategoryId] = useState('')
  const [photo, setPhoto] = useState(null)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    // Check authentication
    if (!user) {
      navigate('/login', { state: { message: 'You must be logged in to sell an item.' } })
      return
    }
    if (!user.email_confirmed_at) {
      navigate('/signup', { state: { email: user.email } })
      return
    }

    // Load categories
    getCategories().then(setCategories).catch(err => {
      console.error(err)
      setError('Failed to load categories.')
    })
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (!user) throw new Error('You must be logged in')
      
      if (!title || !price || !categoryId || !photo) {
        throw new Error('Please fill out all required fields, including a photo.')
      }

      // Create listing
      const listingData = {
        title,
        description,
        price: parseFloat(price),
        condition,
        category_id: categoryId,
        is_active: true,
        is_sold: false
      }
      
      const newListing = await createListing(user.id, listingData)
      
      // Upload photo
      await uploadListingImage(user.id, newListing.id, photo, true)
      
      navigate('/dashboard', { state: { message: 'Listing created successfully!' } })
    } catch (err) {
      setError(err.message || 'An error occurred during submission.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Compress function
      const compressImage = (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = (event) => {
            const img = new Image()
            img.src = event.target.result
            img.onload = () => {
              const canvas = document.createElement('canvas')
              let { width, height } = img
              
              // Max dimension 1200px
              const MAX_DIM = 1200
              if (width > height && width > MAX_DIM) {
                height *= MAX_DIM / width
                width = MAX_DIM
              } else if (height > MAX_DIM) {
                width *= MAX_DIM / height
                height = MAX_DIM
              }

              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, width, height)
              
              let quality = 0.9
              const compress = () => {
                canvas.toBlob((blob) => {
                  if (blob.size > 150 * 1024 && quality > 0.1) {
                    quality -= 0.1
                    compress()
                  } else {
                    resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    }))
                  }
                }, 'image/jpeg', quality)
              }
              compress()
            }
          }
        })
      }

      const compressedFile = await compressImage(file)
      setPhoto(compressedFile)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow)', width: '100%', maxWidth: '600px', border: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'Playfair Display', marginBottom: '8px', color: 'var(--ink)' }}>List an Item</h1>
        <p style={{ color: 'var(--ink3)', marginBottom: '32px' }}>Fill out the details below to reach local buyers in minutes.</p>
        
        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--ink2)' }}>Title *</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="What are you selling?"
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: '16px', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--ink2)' }}>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Describe your item..."
              rows={4}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: '16px', resize: 'vertical', color: 'var(--ink)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 min-content' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--ink2)' }}>Price *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--ink3)' }}>₹</span>
                <input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  style={{ width: '100%', padding: '12px 16px 12px 32px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: '16px', color: 'var(--ink)' }}
                />
              </div>
            </div>
            
            <div style={{ flex: '1 1 min-content' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--ink2)' }}>Condition *</label>
              <select 
                value={condition} 
                onChange={e => setCondition(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: '16px', color: 'var(--ink)', cursor: 'pointer' }}
              >
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--ink2)' }}>Category *</label>
            <select 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: '16px', color: 'var(--ink)', cursor: 'pointer' }}
            >
              <option value="" disabled>Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--ink2)' }}>Photo *</label>
            <div style={{ 
              border: '2px dashed var(--border)', 
              borderRadius: '10px', 
              padding: '24px', 
              textAlign: 'center',
              background: 'var(--bg2)',
              cursor: 'pointer',
              position: 'relative'
            }}>
              {photo ? (
                <div>
                  <p style={{ color: 'var(--accent)', fontWeight: '600', marginBottom: '8px' }}>{photo.name}</p>
                  <p style={{ fontSize: '13px', color: 'var(--ink3)' }}>Click to change</p>
                </div>
              ) : (
                <div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p style={{ color: 'var(--ink2)', fontWeight: '500' }}>Upload a photo</p>
                  <p style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '4px' }}>PNG, JPG, up to 5MB</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange}
                required={!photo}
                style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, width: '100%', height: '100%', 
                  opacity: 0, cursor: 'pointer' 
                }}
              />
            </div>
            {photo && (
                <div style={{marginTop: '16px', display: 'flex', justifyContent: 'center'}}>
                    <img src={URL.createObjectURL(photo)} alt="Preview" style={{maxHeight: '200px', borderRadius: '8px', boxShadow: 'var(--shadow)'}}/>
                </div>
            )}
          </div>


          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '16px',
              padding: '16px', 
              borderRadius: '10px', 
              background: loading ? 'var(--ink3)' : 'var(--accent)', 
              color: 'white', 
              border: 'none', 
              fontSize: '16px', 
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#C0561F' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)' }}
          >
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}
