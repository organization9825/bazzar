# 🛒 Modern Community Marketplace

[![React](https://img.shields.io/badge/React-19.2-blue.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![React Router](https://img.shields.io/badge/React_Router-7.1-CA4245.svg?style=for-the-badge&logo=react-router)](https://reactrouter.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900.svg?style=for-the-badge&logo=leaflet)](https://leafletjs.com/)

A modern, highly performant, and location-aware marketplace web application. Designed for a seamless and intuitive user experience, this application empowers users to discover, buy, and sell products in their local community using real-time map integrations and persistent direct messaging.

## ✨ Key Features

- **📍 Interactive Maps**: Discover products around you with a fully integrated Leaflet map interface. Uses robust seller-based location tracking with automated fallback mechanisms to ensure products are easily discoverable.
- **🔐 Secure Authentication**: Employs robust authentication flows using Supabase. Features include Email OTP verification, seamless Google Context provider/OAuth Authentication, and secure user-initiated cascading account deletions to completely erase user footprints upon request.
- **💬 Real-Time Inbox**: A dedicated, full-screen messaging inbox directly integrated into the application, keeping buyers and sellers seamlessly connected.
- **🛍️ Complete Marketplace Flow**: End-to-end e-commerce capabilities from exploring listings, creating polished product posts (`Sell`), and managing active items through an intuitive `Dashboard`.
- **⚡ Built for Performance**: Extremely lean and fast. Leverages strict React code splitting, lazy-loading (`Suspense`), and optimized Vite Rollup bundling with resource pre-fetching for lightning-fast page transitions on devices of all capabilities.
- **📱 Responsive & Accessible UI**: A sleek front-end utilizing comprehensive CSS variables and custom Vanilla CSS. Features premium mobile layout adjustments, smooth loading animations, and mobile-responsive category filtering bars.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + React DOM
- **Build Ecosystem**: Vite 8
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS (Semantic HTML, CSS Variables, Flexbox, Keyframes)
- **Maps**: Leaflet + React-Leaflet

### Backend & Services
- **Backend as a Service**: Supabase 
- **Database**: PostgreSQL (Handling normalized user data, product records, and geographical coordinates)
- **Authentication**: Supabase Auth (OTP and Google via `AuthContext`)

## 📂 Project Structure

```text
marketplace/
├── public/                 # Static public assets
├── src/                    # Primary Source code
│   ├── assets/             # Local images, specific graphical elements
│   ├── components/         # Reusable UI components (Navbar, Footer, ListingCard)
│   ├── context/            # Global state bounds (AuthContext.jsx)
│   ├── lib/                # Config logic and Sub-services (Supabase hooks)
│   ├── pages/              # Primary App Routes (Home, Map, Inbox, Sell, etc.)
│   ├── App.jsx             # React routing architecture & initialization
│   └── index.css           # Global custom tailored themes & properties
├── .env                    # Runtime variables (Supabase connection)
├── vercel.json             # Vercel deployment route handler
├── package.json            # Node module catalog
└── vite.config.js          # Enhanced compilation rules
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A provisioned [Supabase](https://supabase.com/) project configured with PostgreSQL tables for tables like `users`/`profiles`, `listings`, and messaging structures.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/marketplace.git
   cd marketplace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and append your Supabase connection strings:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will boot and typically be available on `http://localhost:5173/`.*

## 🚢 Deployment

This application is thoroughly configured for effortless and optimized deployment to standard cloud providers like **Vercel** or **Netlify**. It comes out-of-the-box with `vercel.json` allowing fallback routing required by SPA standards.

1. Connect your GitHub repository to your Vercel Dashboard.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Add the required environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the platform's Environment Variables dashboard.

## 📜 License

This project is open-source and available under the MIT License.

---
*Developed with performance, usability, and scale in mind.*
