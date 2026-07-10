

import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { BackgroundFX } from '../components/ui';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin(e) {
    e?.preventDefault();
    if (!form.email.trim() || !form.password) return setMsg({ text: 'Please fill in all fields.' });
    setMsg(null); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(), password: form.password,
    });
    setBusy(false);
    if (error) setMsg({ text: error.message });

  }

  async function handleSignup(e) {
    e?.preventDefault();
    if (!form.email.trim() || !form.username.trim() || !form.password)
      return setMsg({ text: 'Please fill in all fields.' });
    if (form.password.length < 8)
      return setMsg({ text: 'Password must be at least 8 characters.' });
    setMsg(null); setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { data: { username: form.username.trim() } },
    });
    setBusy(false);
    if (error) return setMsg({ text: error.message });
    setMsg({ text: '✓ Account created! Check your email to confirm, then sign in.', success: true });
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setMsg({ text: error.message });
  }

  return (
    <div className="auth-overlay">
      <BackgroundFX />
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-brand">
          <motion.div className="auth-sigma"
            initial={{ rotate: -12, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
          >∑</motion.div>
          <div className="auth-title">Arithmos</div>
          <div className="auth-sub">Adaptive competition mathematics training</div>
        </div>

        <div className="auth-tabs">
          <motion.div className="auth-tab-pill"
            animate={{ left: tab === 'login' ? 4 : 'calc(50% + 2px)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); setMsg(null); }}>Sign In</button>
          <button className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => { setTab('signup'); setMsg(null); }}>Create Account</button>
        </div>

        {msg && (
          <motion.div className={`auth-error${msg.success ? ' success' : ''}`}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            {msg.text}
          </motion.div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="login-pass">Password</label>
              <input id="login-pass" type="password" autoComplete="current-password" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <button className="btn btn-gold" style={{ width: '100%', marginTop: 6 }} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="field">
              <label htmlFor="su-user">Username</label>
              <input id="su-user" placeholder="euler_fan"
                value={form.username} onChange={e => set('username', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="su-email">Email</label>
              <input id="su-email" type="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="su-pass">Password <span style={{ textTransform: 'none', letterSpacing: 0 }}>(min 8 characters)</span></label>
              <input id="su-pass" type="password" autoComplete="new-password" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <button className="btn btn-gold" style={{ width: '100%', marginTop: 6 }} disabled={busy}>
              {busy ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        )}

        <div className="auth-divider">or</div>
        <button className="btn btn-google" onClick={handleGoogle}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.45 1.8 14.97.75 12 .75 7.7.75 3.99 3.22 2.18 6.82l3.66 2.84C6.71 7.05 9.14 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#FBBC05" d="M5.84 14.09A7.2 7.2 0 0 1 5.46 12c0-.73.13-1.43.37-2.09L2.18 7.07A11.21 11.21 0 0 0 .75 12c0 1.81.43 3.52 1.43 4.93l3.66-2.84z"/><path fill="#34A853" d="M12 23.25c3.04 0 5.59-1 7.45-2.72l-3.86-3c-1.03.69-2.34 1.1-3.59 1.1-2.86 0-5.29-2.01-6.16-4.7l-3.66 2.84c1.81 3.6 5.52 6.48 9.82 6.48z"/></svg>
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
