import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useApp } from '../state/AppContext';
import { api, formatTime } from '../lib/api';
import { DiffBadge, TopicTag } from '../components/ui';

const MCQ_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const TIME_LIMIT = 300;

export default function Solve() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { problems, setProblems, profile, setProfile, solvedSet, setSolvedSet, toast, markSolutionViewed, wasSolutionViewed } = useApp();

  const problem = problems.find(p => String(p.id) === String(id));
  const alreadySolved = solvedSet.has(String(id));

  const [seconds,     setSeconds]     = useState(alreadySolved ? 0 : TIME_LIMIT);
  const [running,     setRunning]     = useState(!alreadySolved);
  const [answer,      setAnswer]      = useState(alreadySolved ? (problem?.answer || '') : '');
  const [inputState,  setInputState]  = useState(alreadySolved ? 'correct' : '');
  const [result,      setResult]      = useState(null);
  const [solution,    setSolution]    = useState(null);
  const [hintOpen,    setHintOpen]    = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [timedOut,    setTimedOut]    = useState(false);
  const [wrongLetter, setWrongLetter] = useState(null);
  const [correctLetter, setCorrectLetter] = useState(alreadySolved ? (problem?.answer || '').toUpperCase() : null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    if (seconds === 0 && running && !timedOut && !alreadySolved) {
      setRunning(false);
      setTimedOut(true);
      handleTimeout();
    }
  }, [seconds]);

  useEffect(() => {
    const solved = solvedSet.has(String(id));
    clearInterval(timerRef.current);
    setSeconds(solved ? 0 : TIME_LIMIT);
    setRunning(!solved);
    setAnswer(solved ? (problem?.answer || '') : '');
    setInputState(solved ? 'correct' : '');
    setResult(null);
    setSolution(null);
    setHintOpen(false);
    setTimedOut(false);
    setCorrectLetter(solved ? (problem?.answer || '').toUpperCase() : null);
  }, [id]);

  if (!problem) {
    return (
      <div className="empty-state">
        <div className="empty-icon">∅</div>
        Problem not found.{' '}
        <button className="section-link" onClick={() => navigate('/problems')}>Back to problems</button>
      </div>
    );
  }

  const isMCQ = problem.question_type === 'mcq' && problem.options;
  const options = isMCQ ? (typeof problem.options === 'string' ? JSON.parse(problem.options) : problem.options) : null;
  const locked = alreadySolved || result?.correct || !!solution || timedOut;

  async function handleTimeout() {
    try {
      const res = await api.submit({
        problem_id: String(problem.id),
        answer: '',
        time_taken: TIME_LIMIT,
        solution_viewed: wasSolutionViewed(problem.id),
        timed_out: true
      });
      setProfile(p => ({ ...p, elo: res.new_elo }));
      setProblems(list => list.map(p =>
        String(p.id) === String(problem.id) ? { ...p, attempts: (p.attempts || 0) + 1 } : p
      ));
      const dropStr = res.elo_delta ? ` (${res.elo_delta} ELO)` : '';
      toast(`Time's up! Recorded as incorrect.${dropStr}`, 'error');
    } catch {
      toast("Time's up!", 'error');
    }
  }

  async function submit(givenAnswer) {
    const userAnswer = (givenAnswer ?? answer).trim();

    if (!userAnswer) {
      toast('Enter an answer before submitting.', 'error');
      setInputState('wrong');
      setTimeout(() => setInputState(''), 600);
      return;
    }
    if (/[<>{}|\\]/.test(userAnswer)) {
      toast('Answer contains invalid characters.', 'error');
      setInputState('wrong');
      setTimeout(() => setInputState(''), 600);
      return;
    }

    if (busy || locked) return;
    setBusy(true);
    setRunning(false);
    const timeTaken = TIME_LIMIT - seconds;

    try {
      const res = await api.submit({
        problem_id: String(problem.id),
        answer: userAnswer,
        time_taken: timeTaken,
        solution_viewed: wasSolutionViewed(problem.id)
      });

      if (res.correct) {
        setResult({ ...res, time_taken: timeTaken });
        setInputState('correct');
        setAnswer(res.answer || userAnswer);
        if (isMCQ) setCorrectLetter((res.answer || '').toUpperCase());

        confetti({ particleCount: 110, spread: 75, origin: { y: 0.7 }, colors: ['#D9852E', '#F2A93E', '#16A382', '#2B2013'] });

        setSolvedSet(prev => new Set(prev).add(String(problem.id)));
        if (!res.already_solved) {
          setProfile(p => ({ ...p, elo: res.new_elo, solved_count: (p.solved_count || 0) + 1 }));
          setProblems(list => list.map(p =>
            String(p.id) === String(problem.id)
              ? { ...p, attempts: (p.attempts || 0) + 1, correct_count: (p.correct_count || 0) + 1, answer: res.answer, explanation: res.explanation }
              : p
          ));
        }
        const eloStr = res.elo_blocked ? '+0 (solution viewed)' : res.already_solved ? 'already solved' : `${res.elo_delta > 0 ? '+' : ''}${res.elo_delta} ELO`;
        toast(`✓ Correct! ${eloStr}`, 'success');
      } else {
        setResult(res);
        setInputState('wrong');
        setProfile(p => ({ ...p, elo: res.new_elo }));
        const dropStr = res.elo_delta ? ` ${res.elo_delta} ELO` : '';
        toast(`✗ Incorrect.${dropStr}`, 'error');
        if (isMCQ) {
          setWrongLetter(userAnswer.toUpperCase());
          setTimeout(() => setWrongLetter(null), 1200);
          setAnswer('');
        }
        setProblems(list => list.map(p =>
          String(p.id) === String(problem.id) ? { ...p, attempts: (p.attempts || 0) + 1 } : p
        ));
        setSeconds(TIME_LIMIT);
        setRunning(true);
        setInputState('');
      }
    } catch (e) {
      toast(e.message, 'error');
      setRunning(true);
    } finally {
      setBusy(false);
    }
  }

  async function viewSolution() {
    try {
      const sol = await api.viewSolution(problem.id);
      markSolutionViewed(problem.id);
      setSolution(sol);
      setRunning(false);
      if (isMCQ) setCorrectLetter((sol.answer || '').toUpperCase());
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const eloStr = result?.correct
    ? result.elo_blocked ? '+0 ELO (solution viewed)' : result.already_solved ? 'already solved' : `${result.elo_delta > 0 ? '+' : ''}${result.elo_delta} ELO`
    : result && !result.correct
    ? `${result.elo_delta || 0} ELO`
    : '';

  const timerColour = timedOut ? 'var(--red)' : seconds <= 60 ? 'var(--red)' : seconds <= 120 ? 'var(--orange)' : 'var(--text-dim)';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="solve-header">
        <button className="back-btn" onClick={() => navigate('/problems')}>← Back</button>
        <div style={{ flex: 1 }}>
          <div className="solve-title">{problem.title}</div>
          <div className="solve-meta">
            <TopicTag t={problem.topic} />
            <DiffBadge d={problem.difficulty} />
            <span className="points-badge">{problem.points} pts</span>
            <span className="timer-badge" style={{ color: timerColour }}>
              <span className="timer-dot" style={{
                background: running ? 'var(--teal)' : timedOut ? 'var(--red)' : 'var(--text-muted)',
                animation: running && seconds > 0 ? undefined : 'none'
              }} />
              {timedOut ? "Time's up" : alreadySolved ? '✓ Solved' : formatTime(seconds)}
            </span>
          </div>
        </div>
      </div>

      {!alreadySolved && !timedOut && (
        <div className="timer-track">
          <motion.div
            className="timer-fill"
            style={{
              background: seconds > 120 ? 'linear-gradient(90deg, var(--teal), #4fc9a8)' : seconds > 60 ? 'linear-gradient(90deg, var(--orange), var(--gold))' : 'linear-gradient(90deg, var(--red), #ef8080)'
            }}
            animate={{ width: `${(seconds / TIME_LIMIT) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      )}

      <div className="card statement">
        <div className="statement-label">Problem</div>
        <div className="statement-text">{problem.body}</div>
        {problem.hint && (
          <>
            <button className="hint-toggle" onClick={() => setHintOpen(h => !h)}>
              <motion.span animate={{ rotate: hintOpen ? 90 : 0 }} style={{ display: 'inline-block' }}>▸</motion.span>
              {hintOpen ? 'Hide hint' : 'Show hint'}
            </button>
            <AnimatePresence>
              {hintOpen && (
                <motion.div className="hint-box"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 11 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}>
                  <span className="hint-icon">💡</span>
                  <span>{problem.hint}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <div className="card answer-section">
        <div className="answer-label">Your Answer</div>

        {isMCQ ? (
          <div className="mcq-options">
            {MCQ_LETTERS.filter(l => options[l]).map(l => {
              let cls = 'mcq-option';
              if (correctLetter === l) cls += ' mcq-correct';
              else if (wrongLetter === l) cls += ' mcq-wrong';
              return (
                <motion.button key={l} className={cls} disabled={locked || busy} onClick={() => submit(l)} whileTap={{ scale: 0.985 }}>
                  <span className="mcq-letter">{l}</span>
                  <span>{options[l]}</span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="answer-row">
            <input
              className={`answer-input ${inputState}`}
              placeholder="Enter your answer…"
              value={answer}
              readOnly={locked}
              onChange={e => { setAnswer(e.target.value); setInputState(''); }}
              onKeyDown={e => e.key === 'Enter' && !locked && submit()}
            />
            <button className="btn btn-gold" disabled={locked || busy} onClick={() => submit()}>
              {locked && (alreadySolved || result?.correct) ? '✓ Solved' : busy ? 'Checking…' : 'Submit →'}
            </button>
            <button className="btn btn-outline" onClick={() => { if (!locked) { setAnswer(''); setInputState(''); setResult(null); } }}>
              Clear
            </button>
          </div>
        )}

        <AnimatePresence>
          {timedOut && !result?.correct && (
            <motion.div className="result-panel result-wrong" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="result-head">
                <div className="result-icon">⏱</div>
                <div className="result-title bad">Time's Up</div>
              </div>
              <div className="result-body">You ran out of time. This attempt has been recorded as incorrect and your ELO has been adjusted.</div>
              <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={viewSolution}>👁 View Solution</button>
            </motion.div>
          )}

          {result?.correct && (
            <motion.div className="result-panel result-correct"
              initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}>
              <div className="result-head">
                <div className="result-icon">✓</div>
                <div className="result-title ok">Correct! <span className="elo-delta elo-up">{eloStr}</span></div>
              </div>
              <div className="result-body">
                Solved in {formatTime(result.time_taken || 0)}.
              </div>
              <div className="solution-block">
                <div className="solution-label">Solution</div>
                <div className="solution-text">{result.explanation}</div>
              </div>
            </motion.div>
          )}

          {result && !result.correct && !solution && !timedOut && (
            <motion.div className="result-panel result-wrong" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="result-head">
                <div className="result-icon">✗</div>
                <div className="result-title bad">Incorrect <span className="elo-delta elo-down">{eloStr}</span></div>
              </div>
              <div className="result-body">Not quite. Check your working or reveal the hint above.</div>
              <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={viewSolution}>
                👁 View Solution <span className="elo-block-note">(blocks ELO gain)</span>
              </button>
            </motion.div>
          )}

          {solution && (
            <motion.div className="result-panel result-solution" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div className="result-head">
                <div className="result-icon">📖</div>
                <div className="result-title">Solution</div>
                <span className="elo-blocked-tag">ELO BLOCKED</span>
              </div>
              <div className="solution-block">
                <div className="solution-text">{solution.explanation || 'No solution available.'}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {alreadySolved && !result && (
        <motion.div className="result-panel result-correct" style={{ marginTop: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="result-head">
            <div className="result-icon">✓</div>
            <div className="result-title ok">Already Solved</div>
          </div>
          <div className="solution-block">
            <div className="solution-label">Solution</div>
            <div className="solution-text">{problem.explanation}</div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'flex', marginTop: 18 }}>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => navigate('/problems')}>
          Back to Problems
        </button>
      </div>
    </motion.div>
  );
}
