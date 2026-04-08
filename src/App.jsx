import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Sell from './pages/Sell'
import Dashboard from './pages/Dashboard'
import Listing from './pages/Listing'
import MapPage from './pages/Map'
import Inbox from './pages/Inbox'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Footer from './components/Footer'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
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
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}