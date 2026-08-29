import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { solveRate } from '../lib/api'
import { DiffBadge, TopicTag } from '../components/ui'

const TOPICS = ['all', 'Number Theory', 'Algebra', 'Combinatorics', 'Geometry', 'Probability', 'Sequences']
const DIFFS = ['all', 'Easy', 'Medium', 'Hard']

export default function Problems() {
  const { problems, solvedSet } = useApp()
  const navigate = useNavigate()
  const [topic, setTopic] = useState('all')
  const [diff, setDiff] = useState('all')
  const [search, setSearch] = useState('')

  // SC2, filter the problem bank by topic and difficulty
  const filtered = problems.filter(p => {
    if (topic !== 'all' && p.topic !== topic) return false
    if (diff !== 'all' && p.difficulty !== diff) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.title.toLowerCase().includes(q) && !(p.topic || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div>
      <h1 className="page-title">Problem Bank</h1>
      <p className="page-sub">{problems.length} problems - AMC, UKMT, Fermat past papers</p>

      <div className="filter-bar" style={{ marginTop: 22 }}>
        {TOPICS.map(t => (
          <button key={t} className={'chip' + (topic === t ? ' active' : '')} onClick={() => setTopic(t)}>
            {t === 'all' ? 'All Topics' : t}
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <div className="filter-bar">
          {DIFFS.map(d => (
            <button key={d} className={'chip' + (diff === d ? ' active' : '')} onClick={() => setDiff(d)}>
              {d === 'all' ? 'All Difficulties' : d}
            </button>
          ))}
        </div>
        <input className="search-box" placeholder="Search problems..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div className="ptable-head">
          <div>#</div><div>Problem</div><div>Topic</div><div>Difficulty</div><div>Solve rate</div><div>Pts</div><div></div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">No problems match your filters.</div>
        ) : filtered.map((p, i) => (
          <div key={p.id} className="ptable-row" onClick={() => navigate('/solve/' + p.id)}>
            <div className="row-num">{i + 1}</div>
            <div>
              <div className="row-title">{p.title}</div>
              <div className="row-sub">{p.attempts || 0} attempts</div>
            </div>
            <div><TopicTag t={p.topic} /></div>
            <div><DiffBadge d={p.difficulty} /></div>
            <div className="rate-wrap">
              <div className="rate-bar"><div className="rate-fill" style={{ width: solveRate(p) + '%' }}></div></div>
              <span className="rate-text">{solveRate(p)}%</span>
            </div>
            <div>{p.points}</div>
            <div>{solvedSet.has(String(p.id)) ? 'Solved' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
