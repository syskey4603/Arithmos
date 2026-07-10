import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './state/AppContext';
import { Sidebar, MobileNav } from './components/Sidebar';
import { BackgroundFX } from './components/ui';
import AuthPage    from './pages/AuthPage';
import Dashboard   from './pages/Dashboard';
import Problems    from './pages/Problems';
import Solve       from './pages/Solve';
import Profile     from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Upload      from './pages/Upload';
import Admin       from './pages/Admin';

function Shell() {
  const { session, loadingData } = useApp();

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="loading-row">
          <span className="spinner" /> Loading Arithmos…
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <div className="shell">
      <BackgroundFX />
      <Sidebar />
      <main className="main">
        <AnimatePresence mode="wait">
          {loadingData ? (
            <div className="loading-row" style={{ height: '40vh' }}>
              <span className="spinner" /> Loading your data…
            </div>
          ) : (
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/problems"    element={<Problems />} />
              <Route path="/solve/:id"   element={<Solve />} />
              <Route path="/profile"     element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/upload"      element={<Upload />} />
              <Route path="/admin"       element={<Admin />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </AnimatePresence>
      </main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}
