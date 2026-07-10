import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useApp, ALL_TOPICS } from '../state/AppContext';
import { api, formatTime } from '../lib/api';
import { AnimatedNumber, DiffBadge } from '../components/ui';

const TOPIC_COLOUR = {
  'Algebra':       '#D9852E',
  'Number Theory': '#16A382',
  'Combinatorics': '#7C5CFA',
  'Geometry':      '#E8703A',
  'Probability':   '#E5484D',
  'Sequences':     '#2F9BB5'
};

export default function Profile() {
  const { profile, setProfile, problems, topicElos, toast } = useApp();
  const [username, setUsername] = useState(profile?.username || '');
  const [rank,     setRank]     = useState(null);
  const [subs,     setSubs]     = useState(null);

  useEffect(() => { setUsername(profile?.username || ''); }, [profile?.username]);

  useEffect(() => {
    api.rank().then(r => setRank(r.rank)).catch(() => {});
    api.mySubmissions().then(setSubs).catch(() => setSubs([]));
  }, []);

  async function saveUsername() {
    if (!username.trim()) return toast('Username cannot be empty.', 'error');
    try {
      await api.updateUsername(username.trim());
      setProfile(p => ({ ...p, username: username.trim() }));
      toast('Username updated!', 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function getTimeData() {
    if (!subs) return [];
    return [...subs].slice(0, 20).reverse().map((s, i) => ({
      n: i + 1,
      secs: s.time_taken || 0,
      correct: s.correct
    }));
  }

  function getAccuracy() {
    if (!subs?.length) return null;
    return Math.round((subs.filter(s => s.correct).length / subs.length) * 100);
  }

  function getTopicHistory() {
    if (!subs) return { data: [], topics: [] };
    const byTopic = {};
    for (const s of [...subs].reverse()) {
      if (!s.topic || s.topic_elo_after == null) continue;
      if (!byTopic[s.topic]) byTopic[s.topic] = [];
      byTopic[s.topic].push(s.topic_elo_after);
    }
    const activTopics = Object.keys(byTopic).filter(t => byTopic[t].length > 0);
    if (!activTopics.length) return { data: [], topics: [] };

    const maxLen = Math.max(...activTopics.map(t => byTopic[t].length));
    const chartData = [];
    for (let i = 0; i < maxLen; i++) {
      const point = { n: i + 1 };
      for (const t of activTopics) {
        if (byTopic[t][i] != null) point[t] = byTopic[t][i];
      }
      chartData.push(point);
    }
    return { data: chartData, topics: activTopics };
  }

  const timeData = getTimeData();
  const accuracy = getAccuracy();
  const topicHistory = getTopicHistory();

  const topicSummary = ALL_TOPICS.map(t => ({ topic: t, elo: topicElos[t] ?? 1200 })).sort((a, b) => b.elo - a.elo);

  const stats = [
    { label: 'ELO rating',  value: profile?.elo || 1200,  accent: 'var(--gold)' },
    { label: 'Solved',      value: profile?.solved_count || 0, accent: 'var(--teal)' },
    { label: 'Streak',      value: profile?.streak || 0,   accent: 'var(--orange)', suffix: 'd' },
    { label: 'Global rank', value: rank,                    accent: 'var(--violet)', prefix: '#' }
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="page-title">Your <em>Profile</em></h1>
        <p className="page-sub">Stats, analytics and submission history</p>
      </motion.div>

      <motion.div className="card prof-hero" style={{ marginTop: 26 }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}>
        <div className="prof-avatar">{(profile?.username || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 570 }}>{profile?.username}</div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 15 }}>ELO {profile?.elo || 1200} · {profile?.solved_count || 0} solved</div>
          <div style={{ display: 'flex', gap: 10, maxWidth: 420 }}>
            <input className="answer-input" style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, padding: '11px 15px' }}
              value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
            <button className="btn btn-gold" onClick={saveUsername}>Save</button>
          </div>
        </div>
      </motion.div>

      <div className="prof-stats">
        {stats.map((s, i) => (
          <motion.div key={s.label} className="card stat-card" style={{ '--accent': s.accent }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 + i * 0.06, duration: 0.45 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value == null ? '—' : <>{s.prefix}<AnimatedNumber value={s.value} />{s.suffix}</>}</div>
          </motion.div>
        ))}
      </div>

      <motion.div className="card chart-card" style={{ marginTop: 20 }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.5 }}>
        <div className="chart-title">Topic ELO Ratings</div>
        <div className="chart-sub">
          overall accuracy {accuracy != null ? <strong style={{ color: 'var(--gold)' }}>{accuracy}%</strong> : '—'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
          {topicSummary.map(({ topic, elo }) => {
            const colour = TOPIC_COLOUR[topic] || 'var(--gold)';
            const pct = Math.min(100, Math.max(0, ((elo - 800) / 1600) * 100));
            return (
              <div key={topic} style={{ display: 'grid', gridTemplateColumns: '145px 1fr 70px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13.5, color: 'var(--text-dim)', fontWeight: 550 }}>{topic}</span>
                <div className="rate-bar" style={{ height: 8 }}>
                  <motion.div className="rate-fill"
                    style={{ background: `linear-gradient(90deg, ${colour}99, ${colour})`, height: '100%', borderRadius: 4 }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 700, color: colour, textAlign: 'right' }}>{elo}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {topicHistory.data.length > 1 && (
        <motion.div className="card chart-card" style={{ marginTop: 20 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}>
          <div className="chart-title">ELO History by Topic</div>
          <div className="chart-sub">per-topic ELO rating over your attempts</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={topicHistory.data} margin={{ top: 6, right: 16, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="rgba(120,88,45,0.11)" vertical={false} />
              <XAxis dataKey="n" tick={{ fill: '#93826A', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#93826A', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#FFFDF8', border: '1px solid rgba(120,88,45,0.2)', borderRadius: 11, fontSize: 13 }} labelFormatter={n => `Attempt ${n}`} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={v => <span style={{ color: TOPIC_COLOUR[v] || 'var(--text-dim)' }}>{v}</span>} />
              {topicHistory.topics.map(topic => (
                <Line key={topic} type="monotone" dataKey={topic} stroke={TOPIC_COLOUR[topic] || '#93826A'}
                  strokeWidth={2.5} dot={{ r: 3.5, fill: TOPIC_COLOUR[topic] || '#93826A', strokeWidth: 0 }}
                  activeDot={{ r: 5.5 }} connectNulls={false} animationDuration={900} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {timeData.length > 1 && (
        <motion.div className="card chart-card" style={{ marginTop: 20 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}>
          <div className="chart-title">Time per problem</div>
          <div className="chart-sub">last {timeData.length} attempts</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeData} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9852E" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D9852E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(120,88,45,0.11)" vertical={false} />
              <XAxis dataKey="n" tick={{ fill: '#93826A', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#93826A', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}s`} />
              <Tooltip contentStyle={{ background: '#FFFDF8', border: '1px solid rgba(120,88,45,0.2)', borderRadius: 11, fontSize: 13 }}
                formatter={(v, _, item) => [`${formatTime(v)} · ${item.payload.correct ? 'correct' : 'wrong'}`, 'Time']}
                labelFormatter={n => `Attempt ${n}`} />
              <Area type="monotone" dataKey="secs" stroke="#D9852E" strokeWidth={2.5} fill="url(#timeGrad)"
                dot={{ r: 3.5, fill: '#D9852E', strokeWidth: 0 }} activeDot={{ r: 5.5 }} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="section-head">
        <div className="section-title">Submission History</div>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>showing your submitted answers</span>
      </div>
      <motion.div className="card" style={{ overflow: 'hidden' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.5 }}>
        {subs === null ? (
          <div className="loading-row"><span className="spinner" /> Loading…</div>
        ) : subs.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">○</div>No submissions yet. Solve some problems!</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 70px', gap: 14, padding: '12px 22px', borderBottom: '1px solid var(--border)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-card-2)', fontWeight: 600 }}>
              <div>Problem</div><div>Topic</div><div>Result</div><div>Time</div>
            </div>
            {subs.slice(0, 15).map((s, i) => {
              const prob = problems.find(x => String(x.id) === String(s.problem_id));
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 70px', gap: 14, alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--border-soft)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14.5 }}>{prob?.title || 'Unknown Problem'}</div>
                    {s.submitted_answer && (
                      <div style={{ marginTop: 3, fontSize: 12, fontFamily: 'var(--font-mono)', color: s.correct ? 'var(--teal)' : 'var(--red)', opacity: 0.9 }}>
                        Submitted: <em>{s.submitted_answer}</em>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: TOPIC_COLOUR[s.topic] || 'var(--text-muted)', fontWeight: 550 }}>{s.topic || prob?.topic || '—'}</div>
                  <div>
                    {s.correct ? (
                      <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>✓ correct</span>
                    ) : (
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>✗ wrong</span>
                        {prob?.answer && <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>Answer: {prob.answer}</div>}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-muted)' }}>{formatTime(s.time_taken || 0)}</div>
                </div>
              );
            })}
          </>
        )}
      </motion.div>
    </div>
  );
}
