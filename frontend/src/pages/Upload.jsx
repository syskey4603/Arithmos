import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../state/AppContext';
import { api } from '../lib/api';
import { DiffBadge, TopicTag } from '../components/ui';

const TOPICS   = ['Number Theory', 'Algebra', 'Combinatorics', 'Geometry', 'Probability', 'Sequences'];
const DIFFS    = ['Easy', 'Medium', 'Hard'];
const SECTIONS = ['General', 'Competition Math', 'IB AA HL'];
const OPTS     = ['A', 'B', 'C', 'D', 'E'];

const BLANK = { title: '', body: '', topic: 'Algebra', difficulty: 'Medium', answer: '', explanation: '', hint: '', points: 100, section: 'General', question_type: 'open', options: { A: '', B: '', C: '', D: '', E: '' } };

export default function Upload() {
  const { canUpload, toast, refreshProblems } = useApp();
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  if (!canUpload) {
    return <div className="empty-state"><div className="empty-icon">∅</div>Upload permission required. Ask an admin.</div>;
  }

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setOpt = (l, v) => setForm(f => ({ ...f, options: { ...f.options, [l]: v } }));

  async function handleSubmit() {
    if (!form.title.trim())       return toast('Title is required.', 'error');
    if (!form.body.trim())        return toast('Problem statement is required.', 'error');
    if (!form.answer.trim())      return toast('Answer is required.', 'error');
    if (!form.explanation.trim()) return toast('Explanation is required.', 'error');
    setBusy(true);
    try {
      const payload = { ...form };
      if (form.question_type !== 'mcq') payload.options = null;
      await api.createProblem(payload);
      await refreshProblems();
      toast('Problem uploaded!', 'success');
      setForm(BLANK);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="page-title">Upload <em>Problem</em></h1>
        <p className="page-sub">Add a new problem to the shared bank</p>
      </motion.div>
      <div className="upload-grid">
        <motion.div className="card upload-form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="field"><label>Title</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. AMC 2019 Problem 12" /></div>
          <div className="field"><label>Problem Statement</label><textarea value={form.body} onChange={e => set('body', e.target.value)} style={{ minHeight: 110 }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field"><label>Topic</label><select value={form.topic} onChange={e => set('topic', e.target.value)}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label>Difficulty</label><select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>{DIFFS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div className="field"><label>Section</label><select value={form.section} onChange={e => set('section', e.target.value)}>{SECTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Points</label><input type="number" min="10" max="500" value={form.points} onChange={e => set('points', Number(e.target.value))} /></div>
          </div>
          <div className="field">
            <label>Question Type</label>
            <div className="filter-bar">{[['open','Open Answer'],['mcq','Multiple Choice']].map(([v,l]) => <button key={v} className={`chip${form.question_type===v?' active':''}`} onClick={() => set('question_type', v)}>{l}</button>)}</div>
          </div>
          {form.question_type === 'mcq' && OPTS.map(l => <div key={l} className="field"><label>Option {l}</label><input value={form.options[l]||''} onChange={e => setOpt(l, e.target.value)} /></div>)}
          <div className="field"><label>Answer</label><input value={form.answer} onChange={e => set('answer', e.target.value)} /></div>
          <div className="field"><label>Explanation</label><textarea value={form.explanation} onChange={e => set('explanation', e.target.value)} style={{ minHeight: 88 }} /></div>
          <div className="field"><label>Hint (optional)</label><input value={form.hint} onChange={e => set('hint', e.target.value)} /></div>
          <button className="btn btn-gold" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit} disabled={busy}>{busy ? 'Uploading…' : 'Upload Problem →'}</button>
        </motion.div>
        <motion.div className="card preview-pane" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="section-title" style={{ marginBottom: 18 }}>Preview</div>
          {form.title || form.body ? (
            <>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 16 }}><TopicTag t={form.topic} /><DiffBadge d={form.difficulty} /><span className="points-badge">{form.points} pts</span></div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 550, marginBottom: 13 }}>{form.title}</div>
              <div style={{ fontSize: 14.5, color: 'var(--text-dim)', lineHeight: 1.85 }}>{form.body}</div>
            </>
          ) : <div className="preview-empty"><div className="preview-empty-icon">∑</div>Fill in the form to preview</div>}
        </motion.div>
      </div>
    </div>
  );
}
