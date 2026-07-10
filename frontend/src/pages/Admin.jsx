import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../state/AppContext';
import { api } from '../lib/api';
import { AnimatedNumber } from '../components/ui';

export default function Admin() {
  const { profile, toast } = useApp();
  const [users, setUsers] = useState(null);
  const [openUploads, setOpenUploads] = useState(false);
  const [permBusy, setPermBusy] = useState(null);

  useEffect(() => {
    if (!profile?.is_admin) return;
    api.adminUsers().then(setUsers).catch(e => { toast(e.message, 'error'); setUsers([]); });
    api.openUploads().then(r => setOpenUploads(r.open_uploads)).catch(() => {});
  }, [profile?.is_admin]);

  if (!profile?.is_admin) {
    return <div className="empty-state"><div className="empty-icon">∅</div>Admin access required.</div>;
  }

  async function toggleOpenUploads() {
    const next = !openUploads;
    setOpenUploads(next);
    try { await api.setOpenUploads(next); toast(`Open uploads ${next ? 'enabled' : 'disabled'}.`, 'success'); }
    catch (e) { setOpenUploads(!next); toast(e.message, 'error'); }
  }

  async function togglePerm(userId, field, current) {
    const key = `${userId}-${field}`;
    setPermBusy(key);
    const next = !current;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: next } : u));
    try { await api.setPermission(userId, field, next); toast('Permission updated.', 'success'); }
    catch (e) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: current } : u)); toast(e.message, 'error'); }
    finally { setPermBusy(null); }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="page-title">Admin <em>Panel</em></h1>
        <p className="page-sub">Manage users and platform settings</p>
      </motion.div>

      <motion.div className="card admin-section" style={{ marginTop: 26 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="admin-title">Platform Settings</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Open Uploads</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Let any user upload problems</div>
          </div>
          <label className="toggle"><input type="checkbox" checked={openUploads} onChange={toggleOpenUploads} /><span className="toggle-slider" /></label>
        </div>
      </motion.div>

      <motion.div className="card admin-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="admin-title">User Management</div>
        <div className="admin-sub">Toggle per-user permissions</div>
        <div className="admin-row admin-head"><div>User</div><div style={{ textAlign: 'center' }}>Can Upload</div><div style={{ textAlign: 'center' }}>Is Admin</div><div>ELO</div></div>
        {users === null ? <div className="loading-row"><span className="spinner" /> Loading…</div>
          : users.map(u => (
          <div key={u.id} className="admin-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.username || 'Unknown'}{u.id === profile?.id && <span style={{ fontSize: 9, color: 'var(--gold)', background: 'var(--gold-dim)', padding: '1px 7px', borderRadius: 10, marginLeft: 7 }}>YOU</span>}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.id.slice(0, 12)}…</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <label className="toggle"><input type="checkbox" checked={!!u.can_upload} disabled={permBusy === `${u.id}-can_upload`} onChange={() => togglePerm(u.id, 'can_upload', !!u.can_upload)} /><span className="toggle-slider" /></label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <label className="toggle"><input type="checkbox" checked={!!u.is_admin} disabled={permBusy === `${u.id}-is_admin` || (u.id === profile?.id && !!u.is_admin)} onChange={() => togglePerm(u.id, 'is_admin', !!u.is_admin)} /><span className="toggle-slider" /></label>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold-bright)', fontSize: 15 }}><AnimatedNumber value={u.elo || 1200} /></div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
