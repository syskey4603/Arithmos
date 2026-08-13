import { useEffect, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useApp, ALL_TOPICS } from '../state/AppContext'
import { api, formatTime } from '../lib/api'

const TOPIC_COLOUR = {
  'Algebra': '#c8781f',
  'Number Theory': '#2e7d32',
  'Combinatorics': '#5a3fa0',
  'Geometry': '#b5651d',
  'Probability': '#c62828',
  'Sequences': '#2f6f8f'
}

export default function Profile() {
  const { profile, setProfile, problems, topicElos, toast } = useApp()
  const [username, setUsername] = useState(profile ? profile.username : '')
  const [rank, setRank] = useState(null)
  const [subs, setSubs] = useState(null)

  useEffect(() => { setUsername(profile ? profile.username : '') }, [profile ? profile.username : null])

  useEffect(() => {
    api.rank().then(r => setRank(r.rank)).catch(() => {})
    api.mySubmissions().then(setSubs).catch(() => setSubs([]))
  }, [])

  async function saveUsername() {
    if (!username.trim()) {
      toast('Username cannot be empty.', 'error')
      return
    }
    try {
      await api.updateUsername(username.trim())
      setProfile(p => ({ ...p, username: username.trim() }))
      toast('Username updated.', 'success')
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const timeData = subs ? [...subs].slice(0, 20).reverse().map((s, i) => ({ n: i + 1, secs: s.time_taken || 0, correct: s.correct })) : []
  const avgTime = timeData.length > 0 ? Math.round(timeData.reduce((a, b) => a + b.secs, 0) / timeData.length) : null
  const accuracy = subs && subs.length > 0 ? Math.round(subs.filter(s => s.correct).length / subs.length * 100) : null

  let topicChartData = []
  let topicList = []
  if (subs) {
    const byTopic = {}
    for (const s of [...subs].reverse()) {
      if (!s.topic || s.topic_elo_after == null) continue
      if (!byTopic[s.topic]) byTopic[s.topic] = []
      byTopic[s.topic].push(s.topic_elo_after)
    }
    topicList = Object.keys(byTopic).filter(t => byTopic[t].length > 0)
    if (topicList.length > 0) {
      const maxLen = Math.max(...topicList.map(t => byTopic[t].length))
      for (let i = 0; i < maxLen; i++) {
        const point = { n: i + 1 }
        for (const t of topicList) {
          if (byTopic[t][i] != null) point[t] = byTopic[t][i]
        }
        topicChartData.push(point)
      }
    }
  }

  const topicSummary = ALL_TOPICS.map(t => ({ topic: t, elo: topicElos[t] || 1200 })).sort((a, b) => b.elo - a.elo)

  const stats = [
    { label: 'ELO rating', value: profile ? profile.elo : 1200 },
    { label: 'Solved', value: profile ? profile.solved_count : 0 },
    { label: 'Streak', value: (profile ? profile.streak : 0) + 'd' },
    { label: 'Global rank', value: rank == null ? '-' : '#' + rank }
  ]

  return (
    <div>
      <h1 className="page-title">Your Profile</h1>
      <p className="page-sub">Stats, analytics and submission history</p>

      <div className="card prof-hero" style={{ marginTop: 22 }}>
        <div className="prof-avatar">{profile ? profile.username[0].toUpperCase() : '?'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{profile ? profile.username : ''}</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>ELO {profile ? profile.elo : 1200}, {profile ? profile.solved_count : 0} solved</div>
          <div style={{ display: 'flex', gap: 8, maxWidth: 400 }}>
            <input className="answer-input" style={{ fontFamily: 'inherit' }} value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
            <button className="btn btn-primary" onClick={saveUsername}>Save</button>
          </div>
        </div>
      </div>

      <div className="prof-stats">
        {stats.map(s => (
          <div key={s.label} className="card stat-box">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card chart-card" style={{ marginTop: 18 }}>
        <div className="chart-title">Topic ELO Ratings</div>
        <div className="chart-sub">overall accuracy {accuracy == null ? '-' : accuracy + '%'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topicSummary.map(({ topic, elo }) => {
            const colour = TOPIC_COLOUR[topic] || '#c8781f'
            const pct = Math.min(100, Math.max(0, (elo - 800) / 1600 * 100))
            return (
              <div key={topic} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13 }}>{topic}</span>
                <div className="rate-bar"><div className="rate-fill" style={{ width: pct + '%', background: colour }}></div></div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: colour, textAlign: 'right' }}>{elo}</span>
              </div>
            )
          })}
        </div>
      </div>

      {topicChartData.length > 1 && (
        <div className="card chart-card" style={{ marginTop: 18 }}>
          <div className="chart-title">ELO History by Topic</div>
          <div className="chart-sub">per-topic ELO over your attempts</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={topicChartData} margin={{ top: 6, right: 16, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#e6dcc0" vertical={false} />
              <XAxis dataKey="n" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ccc', fontSize: 12 }} labelFormatter={n => 'Attempt ' + n} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={v => <span style={{ color: TOPIC_COLOUR[v] || '#888' }}>{v}</span>} />
              {topicList.map(topic => (
                <Line key={topic} type="monotone" dataKey={topic} stroke={TOPIC_COLOUR[topic] || '#888'} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {timeData.length > 1 && (
        <div className="card chart-card" style={{ marginTop: 18 }}>
          <div className="chart-title">Time per problem</div>
          <div className="chart-sub">last {timeData.length} attempts, average {avgTime}s</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={timeData} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#e6dcc0" vertical={false} />
              <XAxis dataKey="n" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v + 's'} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ccc', fontSize: 12 }}
                formatter={(v, _, item) => [formatTime(v) + (item.payload.correct ? ' - correct' : ' - wrong'), 'Time']}
                labelFormatter={n => 'Attempt ' + n} />
              <Area type="monotone" dataKey="secs" stroke="#c8781f" fill="#c8781f33" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="section-head">
        <div className="section-title">Submission History</div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {subs === null ? (
          <div className="loading-row"><span className="spinner"></span> Loading...</div>
        ) : subs.length === 0 ? (
          <div className="empty-state">No submissions yet. Solve some problems.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 70px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #ddd0ac', fontSize: 11, textTransform: 'uppercase', color: '#888', background: '#f6efdd' }}>
              <div>Problem</div><div>Topic</div><div>Result</div><div>Time</div>
            </div>
            {subs.slice(0, 15).map((s, i) => {
              const prob = problems.find(x => String(x.id) === String(s.problem_id))
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 70px', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #ece2c9' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{prob ? prob.title : 'Unknown Problem'}</div>
                    {s.submitted_answer && (
                      <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: s.correct ? '#2e7d32' : '#c62828' }}>
                        Submitted: {s.submitted_answer}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: TOPIC_COLOUR[s.topic] || '#888' }}>{s.topic || (prob ? prob.topic : '-')}</div>
                  <div>
                    {s.correct ? (
                      <span style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>Correct</span>
                    ) : (
                      <div>
                        <span style={{ fontSize: 12, color: '#c62828', fontWeight: 600 }}>Wrong</span>
                        {prob && prob.answer && <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#888' }}>Answer: {prob.answer}</div>}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{formatTime(s.time_taken || 0)}</div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
