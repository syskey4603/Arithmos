import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../lib/api'

export default function Admin() {
  const { profile, toast } = useApp()
  const [users, setUsers] = useState(null)
  const [openUploads, setOpenUploads] = useState(false)
  const [permBusy, setPermBusy] = useState(null)

  useEffect(() => {
    if (!profile || !profile.is_admin) return
    api.adminUsers().then(setUsers).catch(e => { toast(e.message, 'error'); setUsers([]) })
    api.openUploads().then(r => setOpenUploads(r.open_uploads)).catch(() => {})
  }, [profile ? profile.is_admin : null])

  if (!profile || !profile.is_admin) {
    return <div className="empty-state">Admin access required.</div>
  }

  async function toggleOpenUploads() {
    const next = !openUploads
    setOpenUploads(next)
    try {
      await api.setOpenUploads(next)
      toast('Open uploads ' + (next ? 'enabled' : 'disabled'), 'success')
    } catch (e) {
      setOpenUploads(!next)
      toast(e.message, 'error')
    }
  }

  async function togglePerm(userId, field, current) {
    const key = userId + '-' + field
    setPermBusy(key)
    const next = !current
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: next } : u))
    try {
      await api.setPermission(userId, field, next)
      toast('Permission updated.', 'success')
    } catch (e) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: current } : u))
      toast(e.message, 'error')
    }
    setPermBusy(null)
  }

  return (
    <div>
      <h1 className="page-title">Admin Panel</h1>
      <p className="page-sub">Manage users and platform settings</p>

      <div className="card admin-section" style={{ marginTop: 22 }}>
        <div className="admin-title">Platform Settings</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Open Uploads</div>
            <div style={{ fontSize: 12, color: '#888' }}>Let any user upload problems</div>
          </div>
          <label className="toggle"><input type="checkbox" checked={openUploads} onChange={toggleOpenUploads} /><span className="toggle-slider"></span></label>
        </div>
      </div>

      <div className="card admin-section">
        <div className="admin-title">User Management</div>
        <div className="admin-sub">Toggle per-user permissions</div>
        <div className="admin-row admin-head"><div>User</div><div>Can Upload</div><div>Is Admin</div><div>ELO</div></div>
        {users === null ? <div className="loading-row"><span className="spinner"></span> Loading...</div> : users.map(u => (
          <div key={u.id} className="admin-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.username || 'Unknown'}{u.id === (profile ? profile.id : null) && <span className="you-tag">you</span>}</div>
              <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>{u.id.slice(0, 12)}</div>
            </div>
            <div>
              <label className="toggle"><input type="checkbox" checked={!!u.can_upload} disabled={permBusy === u.id + '-can_upload'} onChange={() => togglePerm(u.id, 'can_upload', !!u.can_upload)} /><span className="toggle-slider"></span></label>
            </div>
            <div>
              <label className="toggle"><input type="checkbox" checked={!!u.is_admin} disabled={permBusy === u.id + '-is_admin' || (u.id === profile.id && u.is_admin)} onChange={() => togglePerm(u.id, 'is_admin', !!u.is_admin)} /><span className="toggle-slider"></span></label>
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a0651e' }}>{u.elo || 1200}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
