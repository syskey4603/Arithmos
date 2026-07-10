

import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { AnimatedNumber } from './ui';

const NAV = [
  { to: '/',            icon: '◈', label: 'Dashboard',   end: true },
  { to: '/problems',    icon: '∑', label: 'Problems',    badge: true },
  { to: '/leaderboard', icon: '♛', label: 'Leaderboard' },
];
const NAV_YOU = [
  { to: '/profile', icon: '◉', label: 'Profile' },
];

export function Sidebar() {
  const { profile, problems, canUpload, logout } = useApp();
  const elo = profile?.elo || 1200;

  const pct = Math.min(100, Math.max(0, ((elo - 800) / 1600) * 100));
  const R = 21, C = 2 * Math.PI * R;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-sigma">∑</div>
        <div>
          <div className="brand-name">Arithmos</div>
          <div className="brand-tag">Adaptive Training</div>
        </div>
      </div>

      <div className="nav-label">Menu</div>
      {NAV.map(n => (
        <NavLink key={n.to} to={n.to} end={n.end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">{n.icon}</span>
          {n.label}
          {n.badge && <span className="nav-badge">{problems.length}</span>}
        </NavLink>
      ))}

      <div className="nav-label">You</div>
      {NAV_YOU.map(n => (
        <NavLink key={n.to} to={n.to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">{n.icon}</span>
          {n.label}
        </NavLink>
      ))}
      {canUpload && (
        <NavLink to="/upload" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">＋</span> Upload Problem
        </NavLink>
      )}
      {profile?.is_admin && (
        <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">⚙</span> Admin Panel
        </NavLink>
      )}

      <div className="user-card">
        <div className="user-card-top">
          <div className="elo-ring">
            <svg width="46" height="46" viewBox="0 0 46 46">
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F5D478" />
                  <stop offset="100%" stopColor="#C9982F" />
                </linearGradient>
              </defs>
              <circle className="elo-ring-track" cx="23" cy="23" r={R} fill="none" strokeWidth="3.5" />
              <circle className="elo-ring-fill" cx="23" cy="23" r={R} fill="none" strokeWidth="3.5"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
            </svg>
            <div className="elo-ring-avatar">{(profile?.username || '?')[0].toUpperCase()}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.username || 'User'}
            </div>
            <div className="user-elo-label">{profile?.solved_count || 0} solved</div>
          </div>
        </div>
        <div className="user-elo-num">
          <AnimatedNumber value={elo} /><span>ELO</span>
        </div>
        <button className="logout-btn" onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { canUpload, profile } = useApp();
  const items = [
    ['/', '◈'], ['/problems', '∑'], ['/leaderboard', '♛'], ['/profile', '◉'],
    ...(canUpload ? [['/upload', '＋']] : []),
    ...(profile?.is_admin ? [['/admin', '⚙']] : []),
  ];
  return (
    <nav className="mobile-nav">
      {items.map(([to, icon]) => (
        <button key={to} className={pathname === to ? 'active' : ''}
          onClick={() => navigate(to)} aria-label={to}>{icon}</button>
      ))}
    </nav>
  );
}
