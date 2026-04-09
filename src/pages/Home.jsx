import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getListings, getCategories, clearCache } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

const HERO_WORDS = ['Furniture', 'Electronics', 'Clothing', 'Books', 'Vehicles', 'Collectibles', 'Crops']

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '4/3' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '55%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 1, marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
          <div className="skeleton" style={{ height: 12, width: '25%' }} />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [listings, setListings] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [wordIndex, setWordIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12
  
  // Real stats and location
  const [stats, setStats] = useState({ listings: null, sellers: null })
  const [userPos, setUserPos] = useState(null)
  const [locStatus, setLocStatus] = useState('idle')

  const navigate = useNavigate()
  const searchRef = useRef()

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0)
  }, [search, activeCategory, sortBy, userPos])

  // Haversine distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity
    const p = 0.017453292519943295
    const c = Math.cos
    const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2
    return 12742 * Math.asin(Math.sqrt(a))
  }

  // Rotating hero word
  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % HERO_WORDS.length)
        setWordVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  // Fetch categories & real stats
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
    
    getListings({ limit: 1000 }).then(data => {
      if (data) {
        const sellerIds = new Set(data.map(d => d.seller?.id).filter(Boolean))
        setStats({ listings: data.length, sellers: sellerIds.size })
      }
    }).catch(console.error)
  }, [])

  // Fetch listings
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      const opts = { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
      if (activeCategory) opts.categoryId = activeCategory
      if (search.trim()) opts.search = search.trim()
      getListings(opts)
        .then(data => {
          let sorted = [...(data || [])]
          if (sortBy === 'price_asc')  sorted.sort((a,b) => a.price - b.price)
          if (sortBy === 'price_desc') sorted.sort((a,b) => b.price - a.price)
          if (sortBy === 'nearest' && userPos) {
            sorted.sort((a, b) => getDistance(userPos[0], userPos[1], a.lat, a.lng) - getDistance(userPos[0], userPos[1], b.lat, b.lng))
          }
          setListings(sorted)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search, activeCategory, sortBy, userPos, page])

  // ── Realtime Sync ──
  useEffect(() => {
    const channel = supabase
      .channel('public:listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        clearCache()
        // Silently re-fetch current orientation if page is visible
        if (document.visibilityState === 'visible') {
          const opts = { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
          if (activeCategory) opts.categoryId = activeCategory
          if (search.trim()) opts.search = search.trim()
          getListings(opts).then(data => {
            if (data) setListings(data)
          })
        }
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [search, activeCategory, page])

  const handleSortChange = (e) => {
    const val = e.target.value
    if (val === 'nearest') {
      if (locStatus !== 'granted') {
        setLocStatus('asking')
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserPos([pos.coords.latitude, pos.coords.longitude])
            setLocStatus('granted')
            setSortBy('nearest')
          },
          () => {
            setLocStatus('denied')
            alert("We couldn't get your location. Please ensure location access is allowed in your browser to sort by distance.")
            setSortBy('newest')
          }
        )
        return
      }
    }
    setSortBy(val)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    searchRef.current?.blur()
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={{
        background: 'var(--bg)',
        padding: '72px 24px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,98,42,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,106,79,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-bg)', borderRadius: 20,
            padding: '6px 16px', marginBottom: 24,
            animation: 'fadeUp 0.5s ease both',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s ease infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              Local marketplace — buy &amp; sell near you
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 62px)',
            lineHeight: 1.1, marginBottom: 16, letterSpacing: '-1px',
            animation: 'fadeUp 0.5s ease 0.1s both',
          }}>
            Find amazing
            <span style={{
              display: 'block',
              color: 'var(--accent)',
              opacity: wordVisible ? 1 : 0,
              transform: wordVisible ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'all 0.3s ease',
              minHeight: '1.15em',
            }}>
              {HERO_WORDS[wordIndex]}
            </span>
            near you
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--ink2)', lineHeight: 1.6,
            maxWidth: 520, margin: '0 auto 36px',
            animation: 'fadeUp 0.5s ease 0.2s both',
          }}>
            Thousands of local sellers. Real items. Real prices.
            List your stuff in under 2 minutes.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', gap: 0, maxWidth: 560, margin: '0 auto',
            background: 'var(--card)',
            borderRadius: 14,
            border: `2px solid ${searchFocused ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: searchFocused ? '0 0 0 4px rgba(212,98,42,0.12)' : 'var(--shadow)',
            overflow: 'hidden',
            animation: 'fadeUp 0.5s ease 0.3s both',
          }}>
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', color: 'var(--ink3)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search for anything…"
              style={{
                flex: 1, padding: '16px 0', fontSize: 16,
                border: 'none', background: 'transparent', color: 'var(--ink)',
              }}
            />
            <button type="submit" style={{
              padding: '12px 24px', margin: 6, borderRadius: 10,
              background: 'var(--accent)', color: 'white',
              border: 'none', fontSize: 15, fontWeight: 600,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#C0561F'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >Search</button>
          </form>

          {/* Quick stats (Real data) */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 32, marginTop: 28,
            animation: 'fadeUp 0.5s ease 0.4s both',
          }}>
            {[
              { num: stats.listings !== null ? stats.listings : '-', label: 'Active listings' },
              { num: stats.sellers !== null ? stats.sellers : '-', label: 'Local sellers' },
              { num: 'Free', label: 'To list & browse' },
            ].map(({ num, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display', color: 'var(--ink)' }}>{num}</div>
                <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Filter Chips ── */}
      <section style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 8,
          overflowX: 'auto', padding: '14px 0',
          scrollbarWidth: 'none',
        }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              border: `1.5px solid ${!activeCategory ? 'var(--accent)' : 'var(--border)'}`,
              background: !activeCategory ? 'var(--accent)' : 'var(--card)',
              color: !activeCategory ? 'white' : 'var(--ink2)',
              whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
            }}
          >All items</button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${activeCategory === cat.id ? 'var(--accent)' : 'var(--border)'}`,
                background: activeCategory === cat.id ? 'var(--accent)' : 'var(--card)',
                color: activeCategory === cat.id ? 'white' : 'var(--ink2)',
                whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0, cursor: 'pointer',
              }}
              onMouseEnter={e => { if (activeCategory !== cat.id) { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.color = 'var(--accent)' } }}
              onMouseLeave={e => { if (activeCategory !== cat.id) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink2)' } }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── Listings Grid ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 72px' }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <h2 style={{ fontSize: 24, fontFamily: 'Playfair Display', fontWeight: 700 }}>
              {search ? `Results for "${search}"` : activeCategory ? categories.find(c => c.id === activeCategory)?.name ?? 'Listings' : 'Latest listings'}
            </h2>
            {!loading && (
              <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}>
                {listings.length} item{listings.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          <select
            value={sortBy}
            onChange={handleSortChange}
            disabled={locStatus === 'asking'}
            style={{
              padding: '9px 14px', borderRadius: 10, fontSize: 13,
              border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--ink)', cursor: locStatus === 'asking' ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="newest">Newest first</option>
            <option value="nearest">{locStatus === 'asking' ? 'Locating...' : 'Nearest to me'}</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            animation: 'fadeIn 0.4s ease',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--bg2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="14" cy="14" r="9" stroke="var(--ink3)" strokeWidth="2"/>
                <path d="M21 21L28 28" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 14H18M14 10V18" stroke="var(--ink3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontFamily: 'Playfair Display', marginBottom: 8 }}>Nothing here yet</h3>
            <p style={{ color: 'var(--ink3)', fontSize: 15, marginBottom: 24 }}>
              {search ? 'Try a different search term or clear filters.' : 'Be the first to list something in this category!'}
            </p>
            <button
              onClick={() => navigate('/sell')}
              style={{
                padding: '12px 28px', borderRadius: 10,
                background: 'var(--accent)', color: 'white',
                border: 'none', fontSize: 15, fontWeight: 600,
              }}
            >+ List something</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && (page > 0 || listings.length === PAGE_SIZE) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, marginTop: 40, marginBottom: 20,
            animation: 'fadeIn 0.5s ease both'
          }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1.5px solid var(--border)',
                background: page === 0 ? 'var(--bg2)' : 'var(--card)',
                color: page === 0 ? 'var(--ink3)' : 'var(--ink)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink2)', minWidth: 80, textAlign: 'center' }}>
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={listings.length < PAGE_SIZE}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1.5px solid var(--border)',
                background: listings.length < PAGE_SIZE ? 'var(--bg2)' : 'var(--card)',
                color: listings.length < PAGE_SIZE ? 'var(--ink3)' : 'var(--ink)',
                cursor: listings.length < PAGE_SIZE ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        )}

        {/* CTA banner */}
        {!loading && listings.length > 0 && (
          <div style={{
            marginTop: 64, borderRadius: 20, overflow: 'hidden',
            background: 'var(--ink)', padding: '48px 48px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 24, flexWrap: 'wrap',
            animation: 'fadeUp 0.6s ease both',
          }}>
            <div>
              <h2 style={{
                fontSize: 28, color: 'white',
                fontFamily: 'Playfair Display', marginBottom: 8,
              }}>
                Have something to sell?
              </h2>
              <p style={{ color: '#A09890', fontSize: 16, lineHeight: 1.5 }}>
                List your item for free. Reach local buyers in minutes.
              </p>
            </div>
            <button
              onClick={() => navigate('/sell')}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'var(--accent)', color: 'white',
                border: 'none', fontSize: 16, fontWeight: 600,
                flexShrink: 0, transition: 'all 0.2s',
                animation: 'pulse 3s ease infinite',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#C0561F'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              Start selling →
            </button>
          </div>
        )}
      </section>
    </div>
  )
}