import { supabase } from './supabase'

// in dev this is empty so vite proxies /api to the flask server on 5001
// in prod VITE_API_URL points straight at the render backend
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'

async function getToken() {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('Not authenticated.')
  return data.session.access_token
}

// every request needs to carry the supabase token so the backend can check who we are
async function call(method, path, body) {
  const token = await getToken()
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: body !== undefined ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    let msg = 'Error ' + res.status
    try {
      const j = await res.json()
      if (j.error) msg = j.error
    } catch (e) {}
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  profile: () => call('GET', '/profile'),
  updateUsername: (username) => call('PATCH', '/profile/username', { username }),
  rank: () => call('GET', '/rank'),
  topicElos: () => call('GET', '/profile/topic-elos'),
  problems: () => call('GET', '/problems'),
  adaptive: (topic) => call('GET', '/adaptive' + (topic ? '?topic=' + encodeURIComponent(topic) : '')),
  mySubmissions: () => call('GET', '/me/submissions'),
  submit: (body) => call('POST', '/submit', body)
}

export function solveRate(p) {
  if (!p.attempts) return 0
  return Math.round((p.correct_count || 0) / p.attempts * 100)
}

export function formatTime(secs) {
  const s = Math.max(0, Math.floor(secs))
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return m + ':' + sec
}
