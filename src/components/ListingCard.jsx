import { useState, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOptimizedUrl } from '../lib/supabase'

const CONDITION_COLORS = {
  new:       { bg: '#EAF4EF', color: '#2D6A4F' },
  like_new:  { bg: '#EAF4EF', color: '#2D6A4F' },
  good:      { bg: '#FDF0E8', color: '#D4622A' },
  fair:      { bg: '#FEF3CD', color: '#856404' },
  poor:      { bg: '#F8D7DA', color: '#842029' },
}

const ListingCard = memo(function ListingCard({ listing, index = 0 }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  const primaryImage = listing.images?.find(i => i.is_primary) || listing.images?.[0]
  const condition = listing.condition || 'good'
  const condStyle = CONDITION_COLORS[condition] || CONDITION_COLORS.good

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card)', borderRadius: 16,
        border: '1px solid var(--border)',
        overflow: 'hidden', cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow)',
        transition: 'all 0.25s ease',
        animation: `fadeUp 0.5s ease ${index * 0.06}s both`,
      }}
    >
      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '4/3',
        background: 'var(--bg2)', position: 'relative', overflow: 'hidden',
      }}>
        {primaryImage ? (
          <img 
            src={getOptimizedUrl(primaryImage.public_url, 400)} 
            alt={listing.title}
            loading="lazy"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink3)', fontSize: 13,
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="var(--bg3)"/>
              <path d="M12 28L18 18L23 23L27 17L34 28H12Z" fill="var(--border2)"/>
              <circle cx="15" cy="14" r="3" fill="var(--border2)"/>
            </svg>
          </div>
        )}

        {/* Condition badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: condStyle.bg, color: condStyle.color,
          fontSize: 11, fontWeight: 600, padding: '3px 9px',
          borderRadius: 20, textTransform: 'capitalize',
          backdropFilter: 'blur(4px)',
        }}>
          {condition.replace('_', ' ')}
        </div>

        {/* Image count */}
        {listing.images?.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(28,26,23,0.65)', color: 'white',
            fontSize: 11, padding: '3px 8px', borderRadius: 20,
          }}>
            +{listing.images.length - 1} photos
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{
            fontSize: 15, fontWeight: 600, color: 'var(--ink)',
            lineHeight: 1.3, fontFamily: 'DM Sans',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {listing.title}
          </h3>
          <span style={{
            fontSize: 16, fontWeight: 700, color: 'var(--ink)',
            flexShrink: 0,
          }}>
            ₹{Number(listing.price).toLocaleString()}
          </span>
        </div>

        {listing.description && (
          <p style={{
            fontSize: 13, color: 'var(--ink3)', marginTop: 6,
            lineHeight: 1.5, display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {listing.description}
          </p>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'var(--accent)',
              flexShrink: 0,
            }}>
              {listing.seller?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 500 }}>
              {listing.seller?.full_name ?? 'Seller'}
            </span>
          </div>

          {listing.seller?.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ink3)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.25 6 11 6 11C6 11 9.5 7.25 9.5 4.5C9.5 2.57 7.93 1 6 1ZM6 6C5.17 6 4.5 5.33 4.5 4.5C4.5 3.67 5.17 3 6 3C6.83 3 7.5 3.67 7.5 4.5C7.5 5.33 6.83 6 6 6Z" fill="currentColor"/>
              </svg>
              <span style={{ fontSize: 12 }}>{listing.seller.city}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default ListingCard