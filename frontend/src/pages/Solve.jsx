import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { api, formatTime } from '../lib/api'
import { DiffBadge, TopicTag } from '../components/ui'

const MCQ_LETTERS = ['A', 'B', 'C', 'D', 'E']
const TIME_LIMIT = 300 // 5 minutes, SC4

export default function Solve() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { problems, setProblems, profile, setProfile, solvedSet, setSolvedSet, toast } = useApp()

  const problem = problems.find(p => String(p.id) === String(id))
  const alreadySolved = solvedSet.has(String(id))

  const [seconds, setSeconds] = useState(alreadySolved ? 0 : TIME_LIMIT)
  const [running, setRunning] = useState(!alreadySolved)
  const [answer, setAnswer] = useState(alreadySolved ? (problem ? problem.answer : '') : '')
  const [inputState, setInputState] = useState(alreadySolved ? 'correct' : '')
  const [result, setResult] = useState(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [wrongLetter, setWrongLetter] = useState(null)
  const [correctLetter, setCorrectLetter] = useState(alreadySolved && problem ? problem.answer.toUpperCase() : null)

  const timerRef = useRef(null)

  // counts down every second while the problem is open. this is a single
  // continuous countdown for the whole problem, it does not reset just
  // because a wrong answer was submitted, only stops on correct or timeout
  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running])

  useEffect(() => {
    if (seconds === 0 && running && !timedOut && !alreadySolved) {
      setRunning(false)
      setTimedOut(true)
      handleTimeout()
    }
  }, [seconds])

  // resets everything when they navigate to a different problem
  useEffect(() => {
    const solved = solvedSet.has(String(id))
    clearInterval(timerRef.current)
    setSeconds(solved ? 0 : TIME_LIMIT)
    setRunning(!solved)
    setAnswer(solved && problem ? problem.answer : '')
    setInputState(solved ? 'correct' : '')
    setResult(null)
    setHintOpen(false)
    setTimedOut(false)
    setCorrectLetter(solved && problem ? problem.answer.toUpperCase() : null)
  }, [id])

  if (!problem) {
    return (
      <div className="empty-state">
        Problem not found.{' '}
        <button className="section-link" onClick={() => navigate('/problems')}>Back to problems</button>
      </div>
    )
  }

  const isMCQ = problem.question_type === 'mcq' && problem.options
  const options = isMCQ ? (typeof problem.options === 'string' ? JSON.parse(problem.options) : problem.options) : null
  const locked = alreadySolved || (result && result.correct) || timedOut

  async function handleTimeout() {
    try {
      const res = await api.submit({
        problem_id: String(problem.id),
        answer: '',
        time_taken: TIME_LIMIT,
        timed_out: true
      })
      setProfile(p => ({ ...p, elo: res.new_elo }))
      setProblems(list => list.map(p => String(p.id) === String(problem.id) ? { ...p, attempts: (p.attempts || 0) + 1 } : p))
      toast("Time's up! Recorded as incorrect.", 'error')
    } catch (e) {
      toast("Time's up!", 'error')
    }
  }

  async function submit(givenAnswer) {
    const userAnswer = (givenAnswer !== undefined ? givenAnswer : answer).trim()

    // SC8, check before even hitting the server
    if (!userAnswer) {
      toast('Enter an answer before submitting.', 'error')
      return
    }
    if (/[<>{}|\\]/.test(userAnswer)) {
      toast('Answer contains invalid characters.', 'error')
      return
    }

    if (busy || locked) return
    setBusy(true)
    const timeTaken = TIME_LIMIT - seconds

    try {
      const res = await api.submit({
        problem_id: String(problem.id),
        answer: userAnswer,
        time_taken: timeTaken
      })

      if (res.correct) {
        setRunning(false)
        setResult({ ...res, time_taken: timeTaken })
        setInputState('correct')
        setAnswer(res.answer || userAnswer)
        if (isMCQ) setCorrectLetter((res.answer || '').toUpperCase())

        setSolvedSet(prev => new Set(prev).add(String(problem.id)))
        if (!res.already_solved) {
          setProfile(p => ({ ...p, elo: res.new_elo, solved_count: (p.solved_count || 0) + 1 }))
          setProblems(list => list.map(p =>
            String(p.id) === String(problem.id)
              ? { ...p, attempts: (p.attempts || 0) + 1, correct_count: (p.correct_count || 0) + 1, answer: res.answer, explanation: res.explanation }
              : p
          ))
        }
        toast('Correct. ' + (res.elo_delta > 0 ? '+' : '') + res.elo_delta + ' ELO', 'success')
      } else {
        // wrong answer, timer just keeps running, they can try again
        // until either they get it right or time runs out
        setResult(res)
        setInputState('wrong')
        setProfile(p => ({ ...p, elo: res.new_elo }))
        toast('Incorrect. ' + res.elo_delta + ' ELO', 'error')
        if (isMCQ) {
          setWrongLetter(userAnswer.toUpperCase())
          setTimeout(() => setWrongLetter(null), 1000)
          setAnswer('')
        }
        setProblems(list => list.map(p => String(p.id) === String(problem.id) ? { ...p, attempts: (p.attempts || 0) + 1 } : p))
        setInputState('')
      }
    } catch (e) {
      toast(e.message, 'error')
    }
    setBusy(false)
  }

  const timerColour = timedOut || seconds <= 60 ? '#c62828' : seconds <= 120 ? '#a0651e' : '#666'

  return (
    <div>
      <div className="solve-header">
        <button className="back-link" onClick={() => navigate('/problems')}>Back</button>
        <div style={{ flex: 1 }}>
          <div className="solve-title">{problem.title}</div>
          <div className="solve-meta">
            <TopicTag t={problem.topic} />
            <DiffBadge d={problem.difficulty} />
            <span className="tag tag-pts">{problem.points} pts</span>
            <span className="timer-box" style={{ color: timerColour }}>
              {timedOut ? "Time's up" : alreadySolved ? 'Solved' : formatTime(seconds)}
            </span>
          </div>
        </div>
      </div>

      <div className="card statement">
        <div className="statement-label">Problem</div>
        <div className="statement-text">{problem.body}</div>
        {problem.hint && (
          <>
            <button className="hint-toggle" onClick={() => setHintOpen(!hintOpen)}>{hintOpen ? 'Hide hint' : 'Show hint'}</button>
            {hintOpen && <div className="hint-box">{problem.hint}</div>}
          </>
        )}
      </div>

      <div className="card answer-section">
        <div className="answer-label">Your Answer</div>

        {isMCQ ? (
          <div className="mcq-options">
            {MCQ_LETTERS.filter(l => options[l]).map(l => {
              let cls = 'mcq-option'
              if (correctLetter === l) cls += ' mcq-correct'
              else if (wrongLetter === l) cls += ' mcq-wrong'
              return (
                <button key={l} className={cls} disabled={locked || busy} onClick={() => submit(l)}>
                  <span className="mcq-letter">{l}</span>
                  <span>{options[l]}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="answer-row">
            <input
              className={'answer-input ' + inputState}
              placeholder="Enter your answer"
              value={answer}
              readOnly={locked}
              onChange={e => { setAnswer(e.target.value); setInputState('') }}
              onKeyDown={e => { if (e.key === 'Enter' && !locked) submit() }}
            />
            <button className="btn btn-primary" disabled={locked || busy} onClick={() => submit()}>
              {locked ? 'Solved' : busy ? 'Checking...' : 'Submit'}
            </button>
          </div>
        )}

        {timedOut && (
          <div className="result-box wrong">
            <div className="result-title bad">Time's Up</div>
            <div className="result-body">You ran out of time. This attempt was recorded as incorrect and your ELO was adjusted.</div>
          </div>
        )}

        {result && result.correct && (
          <div className="result-box correct">
            <div className="result-title ok">Correct <span className="elo-tag up">+{result.elo_delta} ELO</span></div>
            <div className="result-body">Solved in {formatTime(result.time_taken || 0)}.</div>
            <div className="solution-block">
              <div className="solution-label">Solution</div>
              <div className="solution-text">{result.explanation}</div>
            </div>
          </div>
        )}

        {result && !result.correct && !timedOut && (
          <div className="result-box wrong">
            <div className="result-title bad">Incorrect <span className="elo-tag down">{result.elo_delta} ELO</span></div>
            <div className="result-body">Not quite. Check your working or reveal the hint above, you can still try again before time runs out.</div>
          </div>
        )}
      </div>

      {alreadySolved && !result && (
        <div className="result-box correct" style={{ marginTop: 16 }}>
          <div className="result-title ok">Already Solved</div>
          <div className="solution-block">
            <div className="solution-label">Solution</div>
            <div className="solution-text">{problem.explanation}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', marginTop: 16 }}>
        <button className="btn btn-plain" style={{ marginLeft: 'auto' }} onClick={() => navigate('/problems')}>Back to Problems</button>
      </div>
    </div>
  )
}
