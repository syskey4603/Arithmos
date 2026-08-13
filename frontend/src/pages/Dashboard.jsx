import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, ALL_TOPICS } from '../state/AppContext'
import { api, solveRate } from '../lib/api'
import { DiffBadge, TopicTag } from '../components/ui'

export default function Dashboard() {
  const { profile, problems, topicElos } = useApp()
  const navigate = useNavigate()
  const [accuracy, setAccuracy] = useState(null)
  const [rank, setRank] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.mySubmissions().then(subs => {
      if (subs.length > 0) {
        const correct = subs.filter(s => s.correct).length
        setAccuracy(Math.round(correct / subs.length * 100))
      }
    }).catch(() => {})
    api.rank().then(r => setRank(r.rank)).catch(() => {})
  }, [profile ? profile.elo : null])

  let daily = null
  if (problems.length > 0) {
    const dayIndex = Math.floor(Date.now() / 86400000)
    daily = problems[dayIndex % problems.length]
  }

  let focus = []
  if (Object.keys(topicElos).length > 0) {
    focus = ALL_TOPICS.map(t => ({ topic: t, elo: topicElos[t] || 1200 }))
    focus.sort((a, b) => a.elo - b.elo)
    focus = focus.slice(0, 2)
  }

  const recent = problems.slice(-3).reverse()

  async function practiceTopic(topic) {
    setBusy(true)
    try {
      const p = await api.adaptive(topic)
      navigate('/solve/' + p.id)
    } catch (e) {
      setBusy(false)
    }
  }

  const stats = [
    { label: 'Problems solved', value: profile ? profile.solved_count : 0 },
    { label: 'ELO rating', value: profile ? profile.elo : 1200 },
    { label: 'Accuracy', value: accuracy == null ? '-' : accuracy + '%' },
    { label: 'Global rank', value: rank == null ? '-' : '#' + rank }
  ]

  return (
    <div>
      <h1 className="page-title">Welcome back, {profile ? profile.username : 'Mathematician'}</h1>
      <p className="page-sub">Rating {profile ? profile.elo : 1200} ELO, {profile ? profile.solved_count : 0} problems solved</p>

      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.label} className="card stat-box">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <div className="section-title">Daily Challenge</div>
      </div>
      {daily && (
        <div className="daily-box" onClick={() => navigate('/solve/' + daily.id)}>
          <div className="daily-title">{daily.title}</div>
          <div className="daily-body">{daily.body}</div>
          <div className="daily-row">
            <button className="btn btn-primary" onClick={e => { e.stopPropagation(); navigate('/solve/' + daily.id) }}>Solve Now</button>
            <DiffBadge d={daily.difficulty} />
            <TopicTag t={daily.topic} />
            <span className="daily-rate">{solveRate(daily)}% solve rate</span>
          </div>
        </div>
      )}

      {focus.length > 0 && (
        <>
          <div className="section-head">
            <div className="section-title">Focus Areas</div>
            <span style={{ fontSize: 12, color: '#888' }}>your two lowest-rated topics</span>
          </div>
          <div className="problem-cards" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {focus.map(f => {
              const pct = Math.min(100, Math.max(0, (f.elo - 800) / 1600 * 100))
              return (
                <div key={f.topic} className="card">
                  <div className="problem-box-top">
                    <div className="problem-box-title">{f.topic}</div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{f.elo} ELO</span>
                  </div>
                  <div className="rate-wrap" style={{ marginBottom: 10 }}>
                    <div className="rate-bar"><div className="rate-fill" style={{ width: pct + '%' }}></div></div>
                  </div>
                  <button className="btn btn-outline" style={{ width: '100%' }} disabled={busy} onClick={() => practiceTopic(f.topic)}>
                    {busy ? 'Finding problem...' : 'Practice this topic'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="section-head">
        <div className="section-title">Recent Problems</div>
        <button className="section-link" onClick={() => navigate('/problems')}>All problems</button>
      </div>
      <div className="problem-cards">
        {recent.map(p => (
          <div key={p.id} className="card problem-box" onClick={() => navigate('/solve/' + p.id)}>
            <div className="problem-box-top">
              <div className="problem-box-title">{p.title}</div>
              <DiffBadge d={p.difficulty} />
            </div>
            <div className="problem-box-meta">
              <TopicTag t={p.topic} />
              <span>{solveRate(p)}% solved</span>
              <span className="tag tag-pts">{p.points} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
