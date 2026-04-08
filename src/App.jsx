import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import './index.css'

// Lazy Load Pages
const Home          = lazy(() => import('./pages/Home'))
const Login         = lazy(() => import('./pages/Login'))
const Signup        = lazy(() => import('./pages/Signup'))
const Sell          = lazy(() => import('./pages/Sell'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const MapPage       = lazy(() => import('./pages/Map'))
const Inbox         = lazy(() => import('./pages/Inbox'))
const Listing       = lazy(() => import('./pages/Listing'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

// Loading placeholder
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
    <div className="loader" style={{ width: 40, height: 40, border: '3px solid var(--bg2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
)

function AppContent() {
  const location = useLocation()
  
  // Hide footer on full-screen apps like Inbox and Map
  const hideFooter = ['/inbox', '/map'].includes(location.pathname)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/signup"    element={<Signup />} />
            <Route path="/sell"      element={<Sell />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map"        element={<MapPage />} />
            <Route path="/inbox"      element={<Inbox />} />
            <Route path="/listing/:id" element={<Listing />} />
            <Route path="/privacy"    element={<PrivacyPolicy />} />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}