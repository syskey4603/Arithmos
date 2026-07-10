

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../state/AppContext';
import { api } from '../lib/api';
import { AnimatedNumber } from '../components/ui';

export default function Leaderboard() {
  const { profile, toast } = useApp();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.leaderboard().then(setRows).catch(e => { toast(e.message, 'error'); setRows([]); });
  }, []);

  if (rows === null) {
    return <div className="loading-row"><span className="spinner" /> Loading leaderboard…</div>;
  }

  const podium = rows.length >= 3 ? [rows[1], rows[0], rows[2]] : null;
  const medals = ['🥈', '🥇', '🥉'];
  const cls = ['second', 'first', 'third'];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="page-title">Leader<em>board</em></h1>
        <p className="page-sub">Top mathematicians ranked by ELO rating</p>
      </motion.div>

      {podium && (
        <div className="podium">
          {podium.map((u, i) => (
            <motion.div key={u?.id || i} className={`card podium-card ${cls[i]}`}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 200, damping: 20 }}>
              {cls[i] === 'first' && <div className="podium-crown">👑</div>}
              <div className="podium-medal">{medals[i]}</div>
              <div className="podium-avatar">{(u?.username || '?')[0].toUpperCase()}</div>
              <div className="podium-name">{u?.username || '—'}</div>
              <div className="podium-elo"><AnimatedNumber value={u?.elo || 0} /> ELO</div>
              <div className="podium-solved">{u?.solved_count || 0} solved</div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div className="card" style={{ overflow: 'hidden' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            No users yet. Be the first!
          </div>
        ) : rows.map((u, i) => {
          const isYou = u.id === profile?.id;
          return (
            <motion.div key={u.id} className={`lb-row${isYou ? ' you' : ''}`}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + Math.min(i * 0.04, 0.5) }}>
              <div className="lb-rank">{i + 1}</div>
              <div className="lb-user">
                <div className={`lb-avatar${isYou ? ' gold' : ''}`}>
                  {(u.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="lb-name">
                    {u.username || 'Anonymous'}
                    {isYou && <span className="you-tag">you</span>}
                  </div>
                  <div className="lb-sub">{u.solved_count || 0} problems solved</div>
                </div>
              </div>
              <div className="lb-num elo">{u.elo || 1200}</div>
              <div className="lb-num">{u.solved_count || 0}</div>
              <div className="lb-num">{(u.streak || 0) > 0 ? `🔥 ${u.streak}` : '—'}</div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
