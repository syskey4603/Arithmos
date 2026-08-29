import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  // SC1, descriptive error for missing fields before even hitting supabase
  async function handleLogin(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setMsg({ text: 'Please fill in all fields.' })
      return
    }
    setMsg(null)
    setBusy(true)
    const res = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (res.error) setMsg({ text: res.error.message })
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (!email.trim() || !username.trim() || !password) {
      setMsg({ text: 'Please fill in all fields.' })
      return
    }
    if (password.length < 8) {
      setMsg({ text: 'Password must be at least 8 characters.' })
      return
    }
    setMsg(null)
    setBusy(true)
    const res = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } }
    })
    setBusy(false)
    if (res.error) {
      setMsg({ text: res.error.message })
      return
    }
    setMsg({ text: 'Account created. Check your email to confirm, then sign in.', success: true })
  }

  async function handleGoogle() {
    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (res.error) setMsg({ text: res.error.message })
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-brand">
          <div className="auth-brand-name">Arithmos</div>
          <div className="auth-brand-sub">Adaptive competition mathematics training</div>
        </div>

        <div className="auth-tabs">
          <button className={'auth-tab' + (tab === 'login' ? ' active' : '')} onClick={() => { setTab('login'); setMsg(null) }}>Sign In</button>
          <button className={'auth-tab' + (tab === 'signup' ? ' active' : '')} onClick={() => { setTab('signup'); setMsg(null) }}>Create Account</button>
        </div>

        {msg && <div className={'auth-msg' + (msg.success ? ' success' : '')}>{msg.text}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in...' : 'Sign In'}</button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="euler_fan" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password (min 8 characters)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Creating account...' : 'Create Account'}</button>
          </form>
        )}

        <div className="auth-divider">or</div>
        <button className="btn-google btn" onClick={handleGoogle}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.45 1.8 14.97.75 12 .75 7.7.75 3.99 3.22 2.18 6.82l3.66 2.84C6.71 7.05 9.14 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#FBBC05" d="M5.84 14.09A7.2 7.2 0 0 1 5.46 12c0-.73.13-1.43.37-2.09L2.18 7.07A11.21 11.21 0 0 0 .75 12c0 1.81.43 3.52 1.43 4.93l3.66-2.84z"/><path fill="#34A853" d="M12 23.25c3.04 0 5.59-1 7.45-2.72l-3.86-3c-1.03.69-2.34 1.1-3.59 1.1-2.86 0-5.29-2.01-6.16-4.7l-3.66 2.84c1.81 3.6 5.52 6.48 9.82 6.48z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}
