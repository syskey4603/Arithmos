import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './state/AppContext'
import { Sidebar, MobileNav } from './components/Sidebar'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Problems from './pages/Problems'
import Solve from './pages/Solve'
import Profile from './pages/Profile'

function Shell() {
  const { session, loadingData } = useApp()

  // undefined means supabase hasnt responded yet, null means logged out
  if (session === undefined) {
    return <div className="loading-row" style={{ minHeight: '100vh' }}>Loading Arithmos...</div>
  }

  if (!session) return <AuthPage />

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        {loadingData ? (
          <div className="loading-row"><span className="spinner"></span> Loading your data...</div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/solve/:id" element={<Solve />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <MobileNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  )
}
