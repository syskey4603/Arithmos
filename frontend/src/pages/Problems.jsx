

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../state/AppContext';
import { solveRate } from '../lib/api';
import { DiffBadge, TopicTag } from '../components/ui';

const SECTIONS = ['all', 'General', 'Competition Math', 'IB AA HL'];
const TOPICS = ['all', 'Number Theory', 'Algebra', 'Combinatorics', 'Geometry', 'Probability', 'Sequences'];
const DIFFS = ['all', 'Easy', 'Medium', 'Hard'];

export default function Problems() {
  const { problems, solvedSet } = useApp();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ section: 'all', topic: 'all', diff: 'all' });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return problems.filter(p => {
      if (filters.section !== 'all' && (p.section || 'General') !== filters.section) return false;
      if (filters.topic !== 'all' && p.topic !== filters.topic) return false;
      if (filters.diff !== 'all' && p.difficulty !== filters.diff) return false;
      if (q && !p.title.toLowerCase().includes(q) && !(p.topic || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [problems, filters, search]);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="page-title">Problem <em>Bank</em></h1>
        <p className="page-sub">{problems.length} problems · AMC, UKMT, Fermat and IB AA HL past papers</p>
      </motion.div>

      {}
      <div className="filter-bar" style={{ marginTop: 26 }}>
        {SECTIONS.map(s => (
          <button key={s} className={`chip${filters.section === s ? ' active' : ''}`}
            onClick={() => set('section', s)}>
            {s === 'all' ? 'All Sections' : s === 'Competition Math' ? '🏆 Competition' : s === 'IB AA HL' ? '📚 IB AA HL' : s}
          </button>
        ))}
      </div>

      {}
      <div className="filter-bar" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <div className="filter-bar">
          {TOPICS.map(t => (
            <button key={t} className={`chip${filters.topic === t ? ' active' : ''}`}
              onClick={() => set('topic', t)}>{t === 'all' ? 'All Topics' : t}</button>
          ))}
        </div>
      </div>
      <div className="filter-bar" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <div className="filter-bar">
          {DIFFS.map(d => (
            <button key={d} className={`chip${filters.diff === d ? ' active' : ''}`}
              onClick={() => set('diff', d)}>{d === 'all' ? 'All Difficulties' : d}</button>
          ))}
        </div>
        <input className="search-input" placeholder="Search problems…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <motion.div className="card ptable" style={{ marginTop: 20 }}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
        <div className="ptable-head">
          <div>#</div><div>Problem</div><div>Topic</div><div>Difficulty</div>
          <div>Solve rate</div><div>Pts</div><div></div>
        </div>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">∅</div>
              No problems match your filters. Clear a filter to see more.
            </div>
          ) : filtered.map((p, i) => (
            <motion.div key={p.id} className="ptable-row" layout
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.3 }}
              onClick={() => navigate(`/solve/${p.id}`)}>
              <div className="row-num">{i + 1}</div>
              <div>
                <div className="row-title">{p.title}</div>
                <div className="row-sub">{p.attempts || 0} attempts</div>
              </div>
              <div><TopicTag t={p.topic} /></div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <DiffBadge d={p.difficulty} />
                {p.question_type === 'mcq' && <span className="mcq-tag">MCQ</span>}
              </div>
              <div className="rate-wrap">
                <div className="rate-bar"><div className="rate-fill" style={{ width: `${solveRate(p)}%` }} /></div>
                <span className="rate-text">{solveRate(p)}%</span>
              </div>
              <div className="row-pts">{p.points}</div>
              <div>
                {solvedSet.has(String(p.id))
                  ? <span className="solved-check">✓</span>
                  : <span className="unsolved-mark">○</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
