import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp, ALL_TOPICS } from '../state/AppContext';
import { api, solveRate } from '../lib/api';
import { AnimatedNumber, DiffBadge, TopicTag } from '../components/ui';

const TOPIC_COLOUR = {
  'Algebra':       '#D9852E',
  'Number Theory': '#16A382',
  'Combinatorics': '#7C5CFA',
  'Geometry':      '#E8703A',
  'Probability':   '#E5484D',
  'Sequences':     '#2F9BB5'
};

const stagger = {
  hidden: { opacity: 0, y: 16 },
  show: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] } })
};

export default function Dashboard() {
  const { profile, problems, topicElos } = useApp();
  const navigate = useNavigate();
  const [accuracy,  setAccuracy]  = useState(null);
  const [rank,      setRank]      = useState(null);
  const [adaptive,  setAdaptive]  = useState({ loading: false });

  useEffect(() => {
    api.mySubmissions().then(subs => {
      if (subs.length) setAccuracy(Math.round((subs.filter(s => s.correct).length / subs.length) * 100));
    }).catch(() => {});
    api.rank().then(r => setRank(r.rank)).catch(() => {});
  }, [profile?.elo]);

  function getDaily() {
    if (!problems.length) return null;
    const dayIndex = Math.floor(Date.now() / 86400000);
    return problems[dayIndex % problems.length];
  }
  const daily = getDaily();

  function getFocusAreas() {
    if (!Object.keys(topicElos).length) return [];
    return ALL_TOPICS
      .map(t => ({ topic: t, elo: topicElos[t] ?? 1200 }))
      .sort((a, b) => a.elo - b.elo)
      .slice(0, 2);
  }
  const focus = getFocusAreas();
  const recent = [...problems].slice(-3).reverse();

  const stats = [
    { label: 'Problems solved', value: profile?.solved_count || 0,  accent: 'var(--teal)',        foot: 'all time' },
    { label: 'ELO rating',      value: profile?.elo || 1200,         accent: 'var(--gold-bright)', foot: 'global ranking' },
    { label: 'Accuracy',        value: accuracy,                      accent: 'var(--violet)',      foot: 'recent submissions', suffix: '%' },
    { label: 'Global rank',     value: rank,                          accent: 'var(--text)',        foot: 'by ELO', prefix: '#' }
  ];

  async function goAdaptive(topic) {
    setAdaptive({ loading: true });
    try {
      const p = await api.adaptive(topic);
      navigate(`/solve/${p.id}`);
    } catch {
      setAdaptive({ loading: false });
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <h1 className="page-title">Welcome back, <em>{profile?.username || 'Mathematician'}</em></h1>
        <p className="page-sub">Rating {profile?.elo || 1200} ELO · {profile?.solved_count || 0} problems solved</p>
      </motion.div>

      <div className="stat-grid">
        {stats.map((s, i) => (
          <motion.div key={s.label} className="card stat-card" style={{ '--accent': s.accent }}
            custom={i} variants={stagger} initial="hidden" animate="show">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">
              {s.value == null ? '—' : <>{s.prefix}<AnimatedNumber value={s.value} />{s.suffix}</>}
            </div>
            <div className="stat-foot">{s.foot}</div>
          </motion.div>
        ))}
      </div>

      <div className="section-head">
        <div className="section-title">Daily Challenge</div>
      </div>
      {daily && (
        <motion.div className="daily" onClick={() => navigate(`/solve/${daily.id}`)}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }} whileHover={{ scale: 1.008 }}>
          <div className="daily-inner">
            <div className="daily-label"><span className="daily-dot" /> Daily Challenge</div>
            <div className="daily-title">{daily.title}</div>
            <div className="daily-body">{daily.body}</div>
            <div className="daily-row">
              <button className="btn btn-gold" onClick={e => { e.stopPropagation(); navigate(`/solve/${daily.id}`); }}>
                Solve Now →
              </button>
              <DiffBadge d={daily.difficulty} />
              <TopicTag t={daily.topic} />
              <span className="daily-rate">{solveRate(daily)}% solve rate</span>
            </div>
          </div>
        </motion.div>
      )}

      {}
      {focus.length > 0 && (
        <>
          <div className="section-head">
            <div className="section-title">Focus Areas</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>your two lowest-rated topics</span>
          </div>
          <div className="problem-cards" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {focus.map((f, i) => {
              const colour = TOPIC_COLOUR[f.topic] || 'var(--gold)';
              const pct = Math.min(100, Math.max(0, ((f.elo - 800) / 1600) * 100));
              return (
                <motion.div key={f.topic} className="card problem-card"
                  custom={i} variants={stagger} initial="hidden" animate="show"
                  style={{ cursor: 'default' }}>
                  <div className="problem-card-top">
                    <div className="problem-card-title">{f.topic}</div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: colour }}>
                      {f.elo} ELO
                    </span>
                  </div>
                  <div className="rate-wrap" style={{ marginBottom: 12 }}>
                    <div className="rate-bar">
                      <div className="rate-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colour}88, ${colour})` }} />
                    </div>
                    <span className="rate-text" style={{ color: colour }}>{pct.toFixed(0)}%</span>
                  </div>
                  {}
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', fontSize: 12, borderColor: `${colour}55`, color: colour }}
                    disabled={adaptive.loading}
                    onClick={() => goAdaptive(f.topic)}
                  >
                    {adaptive.loading ? 'Finding problem…' : `Adaptive Practice — ${f.topic} →`}
                  </button>
                  <div className="problem-card-meta" style={{ marginTop: 9 }}>
                    Picks a problem within ±200 ELO of your rating
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <div className="section-head">
        <div className="section-title">Recent Problems</div>
        <button className="section-link" onClick={() => navigate('/problems')}>All problems →</button>
      </div>
      <div className="problem-cards">
        {recent.map((p, i) => (
          <motion.div key={p.id} className="card problem-card"
            custom={i} variants={stagger} initial="hidden" animate="show"
            onClick={() => navigate(`/solve/${p.id}`)}>
            <div className="problem-card-top">
              <div className="problem-card-title">{p.title}</div>
              <DiffBadge d={p.difficulty} />
            </div>
            <div className="problem-card-meta">
              <TopicTag t={p.topic} />
              <span>{solveRate(p)}% solved</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>{p.points} pts</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
