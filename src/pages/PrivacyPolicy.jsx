import React from 'react'

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 24px', lineHeight: 1.6, color: 'var(--ink)' }}>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: 36, marginBottom: 24 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--ink2)', marginBottom: 32 }}>Last Updated: April 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>1. Introduction</h2>
        <p>Welcome to Bazaar. We are committed to protecting your privacy and providing a secure marketplace experience. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>2. Information We Collect</h2>
        <ul>
          <li><strong>Account Data:</strong> When you sign up, we collect your email address and full name.</li>
          <li><strong>Profile Data:</strong> You may choose to provide a bio, city, and avatar.</li>
          <li><strong>Listing Data:</strong> We collect details about items you post, including photos, descriptions, and approximate geographic coordinates (latitude and longitude) to display them on our map.</li>
          <li><strong>Chat Data:</strong> Our platform uses <strong>End-to-End Encryption (E2EE)</strong> for all private messages. We do not have access to the content of your messages.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>3. How We Use Information</h2>
        <p>We use your information to facilitate connections between buyers and sellers, display local listings on our map, and enable secure communication. We do not sell your personal data to third parties.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>4. End-to-End Encryption (E2EE)</h2>
        <p>Your privacy is our priority. We use industry-standard E2EE for all chat messages. This means your private keys are stored only on your device (in your browser's local storage). If you clear your browser data or use a different device without importing your keys, your past message history will be unreadable. Bazaar servers only see encrypted "blobs" of data that we cannot decrypt.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>5. Location Data</h2>
        <p>Bazaar uses geographic coordinates to show item locations on a map. You can choose whether or not to provide your location when posting a listing or using the "near me" search feature.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>6. Security</h2>
        <p>We use Supabase for secure authentication and database management. While we take reasonable steps to protect your data, no system is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>7. Changes to This Policy</h2>
        <p>We may update this policy from time to time. We will notify you of any significant changes by posting the new policy on this page.</p>
      </section>

      <div style={{ marginTop: 60, padding: '24px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 14, color: 'var(--ink3)' }}>By using Bazaar, you agree to the collection and use of information in accordance with this policy.</p>
      </div>
    </div>
  )
}
