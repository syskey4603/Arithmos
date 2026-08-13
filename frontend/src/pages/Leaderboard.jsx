import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../lib/api'

export default function Leaderboard() {
  const { profile, toast } = useApp()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    api.leaderboard().then(setRows).catch(e => { toast(e.message, 'error'); setRows([]) })
  }, [])

  if (rows === null) {
    return <div className="loading-row"><span className="spinner"></span> Loading leaderboard...</div>
  }

  const podium = rows.length >= 3 ? [rows[1], rows[0], rows[2]] : null
  const podiumRank = [2, 1, 3]
  const podiumCls = ['', 'first', '']

  return (
    <div>
      <h1 className="page-title">Leaderboard</h1>
      <p className="page-sub">Top mathematicians ranked by ELO rating</p>

      {podium && (
        <div className="podium">
          {podium.map((u, i) => (
            <div key={u ? u.id : i} className={'card podium-box ' + podiumCls[i]}>
              <div className="podium-rank">#{podiumRank[i]}</div>
              <div className="podium-name">{u ? u.username : '-'}</div>
              <div className="podium-elo">{u ? u.elo : 0} ELO</div>
              <div className="podium-solved">{u ? u.solved_count : 0} solved</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <div className="empty-state">No users yet. Be the first.</div>
        ) : rows.map((u, i) => {
          const isYou = u.id === (profile ? profile.id : null)
          return (
            <div key={u.id} className={'lb-row' + (isYou ? ' you' : '')}>
              <div className="lb-rank">{i + 1}</div>
              <div className="lb-user">
                <div className="lb-avatar">{(u.username || '?')[0].toUpperCase()}</div>
                <div>
                  <div className="lb-name">{u.username || 'Anonymous'}{isYou && <span className="you-tag">you</span>}</div>
                  <div className="lb-sub">{u.solved_count || 0} problems solved</div>
                </div>
              </div>
              <div className="lb-num elo">{u.elo || 1200}</div>
              <div className="lb-num">{u.solved_count || 0}</div>
              <div className="lb-num">{(u.streak || 0) > 0 ? u.streak + 'd streak' : '-'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
