import { supabase } from './supabase'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'

async function getToken() {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('Not authenticated.')
  return data.session.access_token
}

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
  createProblem: (body) => call('POST', '/problems', body),
  viewSolution: (id) => call('POST', '/problems/' + id + '/solution'),
  adaptive: (topic) => call('GET', '/adaptive' + (topic ? '?topic=' + encodeURIComponent(topic) : '')),
  mySubmissions: () => call('GET', '/me/submissions'),
  submit: (body) => call('POST', '/submit', body),
  leaderboard: () => call('GET', '/leaderboard'),
  openUploads: () => call('GET', '/settings/open_uploads'),
  adminUsers: () => call('GET', '/admin/users'),
  setOpenUploads: (value) => call('POST', '/admin/open_uploads', { value }),
  setPermission: (uid, field, value) => call('POST', '/admin/users/' + uid + '/permission', { field, value })
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
