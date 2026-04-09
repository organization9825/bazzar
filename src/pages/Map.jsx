import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getMapSellers } from '../lib/supabase'

// ── Fix Leaflet's missing default icon in Vite/Webpack bundles ──
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Custom seller marker icon ─────────────────────────────────
const createSellerIcon = (count = 1) => new L.DivIcon({
  className: '',
  html: `
    <div style="
      position:relative;width:40px;height:40px;border-radius:50%;
      background:#D4622A;border:3px solid #fff;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(212,98,42,0.45);
      cursor:pointer;transition:transform 0.2s;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      ${count > 1 ? `
        <div style="
          position:absolute;top:-6px;right:-6px;
          background:#1C1A17;color:white;
          width:20px;height:20px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:700;border:2px solid #fff;
        ">${count}</div>
      ` : ''}
    </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
})

// ── User location icon ────────────────────────────────────────
const userIcon = new L.DivIcon({
  className: '',
  html: `
    <div style="
      width:18px;height:18px;border-radius:50%;
      background:#4285F4;border:3px solid #fff;
      box-shadow:0 0 0 4px rgba(66,133,244,0.25);
    "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// ── Helper: fly to a position when it changes ─────────────────
function MapFlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, zoom, map])
  return null
}

// ── Seller popup card showing multiple listings ────────────────
function SellerPopupCard({ seller, listings, navigate, targetId }) {
  return (
    <div style={{ width: 220, fontFamily: 'DM Sans, sans-serif', padding: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        {seller.avatar_url ? (
          <img src={seller.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: '700' }}>
            {seller.full_name?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{seller.full_name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{seller.city}</div>
        </div>
      </div>

      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {listings.map(l => (
          <div
            key={l.id}
            onClick={() => navigate(`/listing/${l.id}`)}
            style={{
              display: 'flex', gap: 10, cursor: 'pointer', padding: '6px', borderRadius: 8,
              background: l.id === targetId ? 'var(--accent-bg)' : 'transparent',
              transition: 'background 0.2s',
              border: l.id === targetId ? '1px solid var(--accent)' : '1px solid transparent'
            }}
          >
            <img src={l.images?.find(i => i.is_primary)?.public_url || l.images?.[0]?.public_url} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {seller.city && <span style={{ color: 'var(--accent)', marginRight: 4 }}>{seller.city}:</span>}
                {l.title}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>₹{Number(l.price).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${seller.lat},${seller.lng}`, '_blank')}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, marginTop: 12,
          background: 'var(--bg2)', color: 'var(--ink2)',
          border: '1px solid var(--border)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        Get Directions
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MapPage Component
// ─────────────────────────────────────────────────────────────
export default function MapPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initLat = parseFloat(searchParams.get('lat'))
  const initLng = parseFloat(searchParams.get('lng'))
  const targetListingId = searchParams.get('listing')
  const hasInitCoords = !isNaN(initLat) && !isNaN(initLng)

  const [sellers, setSellers] = useState([])
  const [userPos, setUserPos] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [mapCenter, setMapCenter] = useState(hasInitCoords ? [initLat, initLng] : [27.7, 85.3])
  const [mapZoom, setMapZoom] = useState(hasInitCoords ? 15 : 12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filteredSellers, setFilteredSellers] = useState([])

  // ── Load all sellers who have at least one product ────────
  useEffect(() => {
    getMapSellers()
      .then(data => {
        setSellers(data || [])
        setFilteredSellers(data || [])
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load sellers.')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Filter on search ──────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) {
      setFilteredSellers(sellers)
      return
    }
    setFilteredSellers(
      sellers.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.listings?.some(l => l.title.toLowerCase().includes(q))
      )
    )
  }, [search, sellers])

  // Computed: total listing count for badge
  const totalListings = useMemo(() => 
    filteredSellers.reduce((sum, s) => sum + (s.listings?.length || 0), 0)
  , [filteredSellers])

  // ── Auto-open target popup ────────────────────────────────
  const markerRefs = useRef({})
  useEffect(() => {
    if (targetListingId && !loading) {
      const seller = filteredSellers.find(s => s.listings.some(l => l.id === targetListingId))
      if (seller && markerRefs.current[seller.id]) {
        setTimeout(() => {
          markerRefs.current[seller.id].openPopup()
        }, 500)
      }
    }
  }, [targetListingId, loading, filteredSellers])

  // ── Request location ──────────────────────────────────────
  const requestLocation = () => {
    setLocationStatus('asking')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(coords)
        setMapCenter(coords)
        setMapZoom(14)
        setLocationStatus('granted')
      },
      () => {
        setLocationStatus('denied')
      },
      { enableHighAccuracy: true }
    )
  }

  // ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .leaflet-popup-content { margin: 8px !important; width: auto !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; padding: 0 !important; overflow: hidden; }
      `}</style>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

        {/* ── Top bar ───────────────────────────────────────── */}
        <div style={{
          padding: '12px 20px', background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          boxShadow: 'var(--shadow)', zIndex: 10,
        }}>
          <h1 style={{ fontSize: 20, fontFamily: 'Playfair Display', fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>
            🗺 Seller Map
          </h1>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink3)' }} width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or city…"
              style={{
                width: '100%', padding: '9px 12px 9px 36px',
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg2)', fontSize: 14, color: 'var(--ink)', outline: 'none',
              }}
            />
          </div>

          {/* Listing count badge */}
          <span style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 20, fontSize: 13, color: 'var(--ink2)', flexShrink: 0 }}>
            {totalListings} listing{totalListings !== 1 ? 's' : ''} on map
          </span>

          {/* Location button */}
          {locationStatus !== 'granted' && (
            <button
              onClick={requestLocation}
              disabled={locationStatus === 'asking'}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 10,
                background: locationStatus === 'denied' ? '#ffebee' : 'var(--accent)',
                color: locationStatus === 'denied' ? '#c62828' : 'white',
                border: 'none', fontWeight: 600, fontSize: 13,
                cursor: locationStatus === 'asking' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {locationStatus === 'asking' ? 'Locating…'
                : locationStatus === 'denied' ? 'Location denied'
                  : 'Use my location'}
            </button>
          )}

          {locationStatus === 'granted' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'var(--green-bg)', color: 'var(--green)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Location active
            </div>
          )}
        </div>

        {/* ── Map ───────────────────────────────────────────── */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)' }}>
            Loading map…
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c62828' }}>
            {error}
          </div>
        ) : (
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              {/* Layer */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Fly-to animation when location changes */}
              <MapFlyTo center={mapCenter} zoom={mapZoom} />

              {/* User location dot + accuracy ring */}
              {userPos && (
                <>
                  <Marker position={userPos} icon={userIcon}>
                    <Popup>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600 }}>
                        📍 You are here
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={userPos}
                    radius={300}
                    pathOptions={{ color: '#4285F4', fillColor: '#4285F4', fillOpacity: 0.08, weight: 1 }}
                  />
                </>
              )}

              {/* Seller markers */}
              {filteredSellers.map(seller => (
                <Marker
                  key={seller.id}
                  ref={el => markerRefs.current[seller.id] = el}
                  position={[seller.lat, seller.lng]}
                  icon={createSellerIcon(seller.listings.length)}
                >
                  <Popup minWidth={220} maxWidth={280}>
                    <SellerPopupCard
                      seller={seller}
                      listings={seller.listings}
                      navigate={navigate}
                      targetId={targetListingId}
                    />
                  </Popup>
                  <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                    <div style={{ padding: '2px 4px', fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{seller.city}</span>
                      <span style={{ margin: '0 4px', color: 'var(--ink3)' }}>•</span>
                      <span>{seller.listings[0]?.title}</span>
                      {seller.listings.length > 1 && (
                        <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>
                          (+{seller.listings.length - 1} more)
                        </span>
                      )}
                    </div>
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>

            {/* ── Legend ─────────────────────────────────────── */}
            <div style={{
              position: 'absolute', bottom: 28, left: 12, zIndex: 999,
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
              borderRadius: 12, padding: '12px 16px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink2)' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#D4622A', boxShadow: '0 0 0 2px #fff, 0 0 0 3px #D4622A44' }} />
                Seller listing
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink2)' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4285F4', boxShadow: '0 0 0 2px #fff, 0 0 0 3px #4285F444' }} />
                Your location
              </div>
            </div>

            {/* No sellers message */}
            {filteredSellers.length === 0 && !loading && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 999, background: 'var(--card)', padding: '20px 28px',
                borderRadius: 14, boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <p style={{ color: 'var(--ink2)', fontWeight: 600 }}>No sellers found</p>
                <p style={{ color: 'var(--ink3)', fontSize: 13, marginTop: 4 }}>
                  Either no sellers have location set, or they have no active products.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

