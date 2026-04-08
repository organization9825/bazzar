import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      padding: '60px 24px 40px',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40,
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <img 
              src="/logo.png" 
              alt="Bazaar Logo" 
              style={{ width: 36, height: 36, objectFit: 'contain' }} 
            />
            <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>Bazaar</span>
          </div>
          <p style={{ color: 'var(--ink3)', fontSize: 14, lineHeight: 1.6, maxWidth: 240 }}>
            The community marketplace for local buyers and sellers. Trusted by thousands in your neighborhood.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 20 }}>Marketplace</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><Link to="/" style={{ color: 'var(--ink2)', fontSize: 14, textDecoration: 'none' }}>Browse Items</Link></li>
            <li><Link to="/map" style={{ color: 'var(--ink2)', fontSize: 14, textDecoration: 'none' }}>Seller Map</Link></li>
            <li><Link to="/sell" style={{ color: 'var(--ink2)', fontSize: 14, textDecoration: 'none' }}>Start Selling</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 20 }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li><Link to="/inbox" style={{ color: 'var(--ink2)', fontSize: 14, textDecoration: 'none' }}>Messenging</Link></li>
            <li><Link to="/privacy" style={{ color: 'var(--ink2)', fontSize: 14, textDecoration: 'none' }}>Privacy Policy</Link></li>
            <li><Link to="/signup" style={{ color: 'var(--ink2)', fontSize: 14, textDecoration: 'none' }}>Security Info</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 20 }}>The Developer</h4>
          <p style={{ color: 'var(--ink2)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Built with passion by <strong>Ashish Chaudhary</strong>. Exploring the intersection of local commerce and secure communication.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://github.com/ashish9825" target="_blank" rel="noopener noreferrer" style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--bg3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', transition: 'all 0.2s', textDecoration: 'none'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--ink)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
            <a href="https://instagram.com/_ich_bin_ashish_" target="_blank" rel="noopener noreferrer" style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--bg3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', transition: 'all 0.2s', textDecoration: 'none'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E1306C'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--ink)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1200, margin: '40px auto 0',
        paddingTop: 24, borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <p style={{ color: 'var(--ink3)', fontSize: 13 }}>&copy; 2026 Bazaar Marketplace. All rights reserved.</p>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Made with ❤️ locally</span>
        </div>
      </div>
    </footer>
  )
}
