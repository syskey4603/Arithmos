import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../state/AppContext'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/problems', label: 'Problems' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/profile', label: 'Profile' }
]

export function Sidebar() {
  const { profile, canUpload, logout } = useApp()

  return (
    <aside className="sidebar">
      <div className="brand">Arithmos</div>

      <div className="nav-group-label">Menu</div>
      {NAV.map(n => (
        <NavLink key={n.to} to={n.to} end={n.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          {n.label}
        </NavLink>
      ))}
      {canUpload && (
        <NavLink to="/upload" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          Upload Problem
        </NavLink>
      )}
      {profile && profile.is_admin && (
        <NavLink to="/admin" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          Admin
        </NavLink>
      )}

      <div className="user-box">
        <div className="uname">{profile ? profile.username : 'User'}</div>
        <div className="uelo">ELO {profile ? profile.elo : 1200} - {profile ? profile.solved_count : 0} solved</div>
        <button className="logout-link" onClick={logout}>Sign out</button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const navigate = useNavigate()
  const loc = useLocation()
  const { canUpload, profile } = useApp()
  const items = [['/', 'Home'], ['/problems', 'Problems'], ['/leaderboard', 'Rank'], ['/profile', 'You']]
  if (canUpload) items.push(['/upload', 'Upload'])
  if (profile && profile.is_admin) items.push(['/admin', 'Admin'])

  return (
    <nav className="mobile-nav">
      {items.map(([to, label]) => (
        <button key={to} className={loc.pathname === to ? 'active' : ''} onClick={() => navigate(to)}>{label}</button>
      ))}
    </nav>
  )
}
