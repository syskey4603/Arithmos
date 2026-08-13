import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../lib/api'
import { DiffBadge, TopicTag } from '../components/ui'

const TOPICS = ['Number Theory', 'Algebra', 'Combinatorics', 'Geometry', 'Probability', 'Sequences']
const DIFFS = ['Easy', 'Medium', 'Hard']
const SECTIONS = ['General', 'Competition Math', 'IB AA HL']
const OPTS = ['A', 'B', 'C', 'D', 'E']

const BLANK = { title: '', body: '', topic: 'Algebra', difficulty: 'Medium', answer: '', explanation: '', hint: '', points: 100, section: 'General', question_type: 'open', options: { A: '', B: '', C: '', D: '', E: '' } }

export default function Upload() {
  const { canUpload, toast, refreshProblems } = useApp()
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  if (!canUpload) {
    return <div className="empty-state">Upload permission required. Ask an admin.</div>
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setOpt(l, v) { setForm(f => ({ ...f, options: { ...f.options, [l]: v } })) }

  async function handleSubmit() {
    if (!form.title.trim()) return toast('Title is required.', 'error')
    if (!form.body.trim()) return toast('Problem statement is required.', 'error')
    if (!form.answer.trim()) return toast('Answer is required.', 'error')
    if (!form.explanation.trim()) return toast('Explanation is required.', 'error')
    setBusy(true)
    try {
      const payload = { ...form }
      if (form.question_type !== 'mcq') payload.options = null
      await api.createProblem(payload)
      await refreshProblems()
      toast('Problem uploaded.', 'success')
      setForm(BLANK)
    } catch (e) {
      toast(e.message, 'error')
    }
    setBusy(false)
  }

  return (
    <div>
      <h1 className="page-title">Upload Problem</h1>
      <p className="page-sub">Add a new problem to the shared bank</p>
      <div className="upload-grid">
        <div className="card">
          <div className="field"><label>Title</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="AMC 2019 Problem 12" /></div>
          <div className="field"><label>Problem Statement</label><textarea value={form.body} onChange={e => set('body', e.target.value)} style={{ minHeight: 100 }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label>Topic</label><select value={form.topic} onChange={e => set('topic', e.target.value)}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label>Difficulty</label><select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>{DIFFS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div className="field"><label>Section</label><select value={form.section} onChange={e => set('section', e.target.value)}>{SECTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Points</label><input type="number" value={form.points} onChange={e => set('points', Number(e.target.value))} /></div>
          </div>
          <div className="field">
            <label>Question Type</label>
            <div className="filter-bar">
              <button className={'chip' + (form.question_type === 'open' ? ' active' : '')} onClick={() => set('question_type', 'open')}>Open Answer</button>
              <button className={'chip' + (form.question_type === 'mcq' ? ' active' : '')} onClick={() => set('question_type', 'mcq')}>Multiple Choice</button>
            </div>
          </div>
          {form.question_type === 'mcq' && OPTS.map(l => (
            <div key={l} className="field"><label>Option {l}</label><input value={form.options[l] || ''} onChange={e => setOpt(l, e.target.value)} /></div>
          ))}
          <div className="field"><label>Answer</label><input value={form.answer} onChange={e => set('answer', e.target.value)} /></div>
          <div className="field"><label>Explanation</label><textarea value={form.explanation} onChange={e => set('explanation', e.target.value)} style={{ minHeight: 80 }} /></div>
          <div className="field"><label>Hint (optional)</label><input value={form.hint} onChange={e => set('hint', e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={busy}>{busy ? 'Uploading...' : 'Upload Problem'}</button>
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Preview</div>
          {form.title || form.body ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <TopicTag t={form.topic} /><DiffBadge d={form.difficulty} /><span className="tag tag-pts">{form.points} pts</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{form.title}</div>
              <div style={{ fontSize: 14, color: '#555' }}>{form.body}</div>
            </>
          ) : <div className="preview-empty">Fill in the form to preview</div>}
        </div>
      </div>
    </div>
  )
}
