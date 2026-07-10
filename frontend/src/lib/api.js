import { supabase } from './supabase';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated.');
  return session.access_token;
}

async function apiFetch(method, path, body) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  profile:        ()                  => apiFetch('GET',   '/profile'),
  updateUsername: (username)          => apiFetch('PATCH', '/profile/username', { username }),
  rank:           ()                  => apiFetch('GET',   '/rank'),
  topicElos:      ()                  => apiFetch('GET',   '/profile/topic-elos'),

  problems:       ()                  => apiFetch('GET',   '/problems'),
  createProblem:  (body)              => apiFetch('POST',  '/problems', body),
  viewSolution:   (id)                => apiFetch('POST',  `/problems/${id}/solution`),
  adaptive:       (topic)             => apiFetch('GET',   `/adaptive${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`),

  mySubmissions:  ()                  => apiFetch('GET',   '/me/submissions'),
  submit:         (body)              => apiFetch('POST',  '/submit', body),

  leaderboard:    ()                  => apiFetch('GET',   '/leaderboard'),

  openUploads:    ()                  => apiFetch('GET',   '/settings/open_uploads'),

  adminUsers:     ()                  => apiFetch('GET',   '/admin/users'),
  setOpenUploads: (value)             => apiFetch('POST',  '/admin/open_uploads', { value }),
  setPermission:  (uid, field, value) => apiFetch('POST',  `/admin/users/${uid}/permission`, { field, value })
};

export function solveRate(p) {
  if (!p?.attempts) return 0;
  return Math.round(((p.correct_count || 0) / p.attempts) * 100);
}

export function formatTime(secs) {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
