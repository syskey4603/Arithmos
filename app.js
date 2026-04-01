// ═══════════════════════════════════════════════════════════
//  ARITHMOS — app.js
//
//  Sections:
//    1.  Config & Supabase Init
//    2.  Seed / Fallback Data
//    3.  App State
//    4.  Auth — login, signup, Google, logout
//    5.  Auth State Listener (single source of truth for init)
//    6.  Data Loaders — profile, problems, solved set
//    7.  ELO Engine
//    8.  Navigation
//    9.  Sidebar User Card
//    10. Dashboard
//    11. Problems Table + Filters
//    12. Solve View + Answer Submission
//    13. Upload Problem (permission-gated)
//    14. Leaderboard
//    15. Profile Page
//    16. Admin Panel
//    17. Utilities (toast, formatTime, etc.)
//    18. Boot
// ═══════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────
//  1. CONFIG & SUPABASE INIT
//
//  Get these from: supabase.com → project → Settings → API
// ─────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://wyddqwmoltzmasxerbpn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5ZGRxd21vbHR6bWFzeGVyYnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjQ0MDYsImV4cCI6MjA5MDQ0MDQwNn0.iCw4oxJ7XRMlxcZczKqXU4iBMV2v6PEm4ZGxp-T6cAY';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);


// ─────────────────────────────────────────────────────────
//  2. SEED / FALLBACK DATA
//
//  Used only if the Supabase problems table is empty or
//  unreachable. ELO still saves to DB — only problem data
//  is local. These IDs start with "seed-" so upsert logic
//  doesn't try to match them against real UUID rows.
// ─────────────────────────────────────────────────────────

const SEED_PROBLEMS = [
  { id:'seed-1',  title:"Sum of Divisors",             topic:"Number Theory",  difficulty:"Easy",   answer:"1170",    points:80,  attempts:148, correct_count:107, body:"Find the sum of all positive divisors of 360, including 1 and 360 itself.", hint:"Prime factorize 360 first, then use the divisor sum formula.", explanation:"360 = 2³ × 3² × 5. σ(n) = (2⁴−1)/(2−1) × (3³−1)/(3−1) × (5²−1)/(5−1) = 15 × 13 × 6 = 1170." },
  { id:'seed-2',  title:"Two Red Balls",               topic:"Probability",    difficulty:"Easy",   answer:"5/14",    points:80,  attempts:203, correct_count:164, body:"A bag has 5 red and 3 blue balls. Two drawn without replacement — probability both are red? (e.g. 5/14)", hint:"Multiply P(red first) × P(red second | red first).", explanation:"(5/8) × (4/7) = 20/56 = 5/14." },
  { id:'seed-3',  title:"Cosine Rule Application",     topic:"Geometry",       difficulty:"Medium", answer:"6.24",    points:120, attempts:172, correct_count:101, body:"Triangle ABC: angle A = 60°, AB = 5, AC = 7. Find BC to 2 decimal places.", hint:"BC² = AB² + AC² − 2·AB·AC·cos(A)", explanation:"BC² = 25 + 49 − 35 = 39. BC = √39 ≈ 6.24." },
  { id:'seed-4',  title:"Arrangements of MATHEMATICS", topic:"Combinatorics",  difficulty:"Medium", answer:"4989600", points:150, attempts:130, correct_count:56,  body:"How many distinct arrangements of the letters in MATHEMATICS?", hint:"M×2, A×2, T×2. Total 11 letters.", explanation:"11! / (2!2!2!) = 4989600." },
  { id:'seed-5',  title:"5th Term of a Recurrence",   topic:"Sequences",      difficulty:"Easy",   answer:"122",     points:60,  attempts:95,  correct_count:82,  body:"a₁ = 2, aₙ = 3aₙ₋₁ − 1 for n ≥ 2. Find a₅.", hint:"Build up term by term.", explanation:"a₁=2, a₂=5, a₃=14, a₄=41, a₅=122." },
  { id:'seed-6',  title:"GCD: 252 and 180",            topic:"Number Theory",  difficulty:"Easy",   answer:"36",      points:70,  attempts:183, correct_count:143, body:"Find the greatest common divisor of 252 and 180.", hint:"252 = 1×180 + 72 ...", explanation:"GCD(252,180)=GCD(180,72)=GCD(72,36)=36." },
  { id:'seed-7',  title:"Circular Permutations",       topic:"Combinatorics",  difficulty:"Medium", answer:"120",     points:110, attempts:141, correct_count:92,  body:"In how many ways can 6 different people sit around a circular table? (Rotations identical.)", hint:"Fix one person, arrange the other 5.", explanation:"5! = 120." },
  { id:'seed-8',  title:"Quadratic Equal Roots",       topic:"Algebra",        difficulty:"Medium", answer:"49/12",   points:130, attempts:118, correct_count:60,  body:"3x² − 7x + k = 0 has two equal roots. Find k.", hint:"For equal roots, discriminant = 0.", explanation:"49 − 12k = 0 → k = 49/12." },
  { id:'seed-9',  title:"Primes Below 50",             topic:"Number Theory",  difficulty:"Easy",   answer:"15",      points:50,  attempts:267, correct_count:238, body:"How many prime numbers are strictly less than 50?", hint:"List them: 2, 3, 5, 7 ...", explanation:"2,3,5,7,11,13,17,19,23,29,31,37,41,43,47 — 15 primes." },
  { id:'seed-10', title:"Geometric Series to Infinity",topic:"Sequences",      difficulty:"Easy",   answer:"8",       points:90,  attempts:198, correct_count:151, body:"First term 4, common ratio 1/2. Sum to infinity?", hint:"S∞ = a/(1−r)", explanation:"4 / (1 − 1/2) = 8." },
  { id:'seed-11', title:"Handshake Problem",           topic:"Combinatorics",  difficulty:"Medium", answer:"21",      points:120, attempts:155, correct_count:88,  body:"Every person shakes hands with every other person exactly once. 210 handshakes total. How many people?", hint:"C(n,2) = n(n−1)/2 = 210", explanation:"n(n−1) = 420, n = 21." },
  { id:'seed-12', title:"Sum Divisible by 3 or 5",    topic:"Sequences",      difficulty:"Hard",   answer:"9368",    points:200, attempts:86,  correct_count:24,  body:"Find the sum of all integers from 1 to 200 that are divisible by 3 or 5.", hint:"Inclusion-exclusion: sum(div 3) + sum(div 5) − sum(div 15)", explanation:"6633 + 4100 − 1365 = 9368." },
];


// ─────────────────────────────────────────────────────────
//  3. APP STATE
//
//  Single source of truth. Never mutate directly from
//  rendering functions — use the loader/setter functions.
// ─────────────────────────────────────────────────────────

const state = {
  user:         null,     // Supabase auth user object
  profile:      null,     // Row from public.profiles
  problems:     [],       // Array of problem objects
  solvedSet:        new Set(),// Set of problem_id strings the user has solved correctly
  solutionViewedSet: new Set(),// Set of problem_ids where user viewed solution (ELO blocked)
  attemptedSet:      new Set(),// Set of problem_ids attempted at least once this session
  usingFallback:false,    // true if problems came from SEED_PROBLEMS (no DB)

  filters: { topic:'all', diff:'all', section:'all' },

  currentView:      'dashboard',
  currentProblemId: null,

  timerInterval: null,    // setInterval handle for solve timer
  timerSeconds:  0,       // elapsed seconds on current problem
};


// ─────────────────────────────────────────────────────────
//  4. AUTH — login, signup, Google OAuth, logout
// ─────────────────────────────────────────────────────────

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('auth-login-form').style.display  = tab === 'login' ? '' : 'none';
  document.getElementById('auth-signup-form').style.display = tab === 'signup' ? '' : 'none';
  hideAuthError();
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.add('visible');
  el.style.borderColor = '';
  el.style.background  = '';
}

function hideAuthError() {
  document.getElementById('auth-error').classList.remove('visible');
}

function setAuthLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled    = loading;
  btn.textContent = loading
    ? (btnId === 'btn-login' ? 'Signing in...' : 'Creating account...')
    : (btnId === 'btn-login' ? 'Sign In'       : 'Create Account');
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !pass) { showAuthError('Please fill in all fields.'); return; }
  hideAuthError();
  setAuthLoading('btn-login', true);
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  setAuthLoading('btn-login', false);
  if (error) showAuthError(error.message);
  // On success: onAuthStateChange fires → init() runs
}

async function handleSignup() {
  const email    = document.getElementById('signup-email').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const pass     = document.getElementById('signup-password').value;
  if (!email || !username || !pass) { showAuthError('Please fill in all fields.'); return; }
  if (pass.length < 8) { showAuthError('Password must be at least 8 characters.'); return; }
  hideAuthError();
  setAuthLoading('btn-signup', true);
  const { error } = await db.auth.signUp({
    email, password: pass,
    options: { data: { username } }  // stored in user_metadata, trigger copies it to profiles
  });
  setAuthLoading('btn-signup', false);
  if (error) { showAuthError(error.message); return; }

  // Show success state in error box (reusing it as a message box)
  const el = document.getElementById('auth-error');
  el.textContent      = '✓ Account created! Check your email to confirm, then sign in.';
  el.classList.add('visible');
  el.style.borderColor = 'rgba(45,212,168,0.3)';
  el.style.background  = 'rgba(45,212,168,0.06)';
  el.style.color       = 'var(--teal)';
}

async function handleGoogleLogin() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) showAuthError(error.message);
}

async function handleLogout() {
  currentUserId = null;
  await db.auth.signOut();
  // onAuthStateChange SIGNED_OUT event cleans up state and shows overlay
}


// ─────────────────────────────────────────────────────────
//  5. AUTH STATE LISTENER
//
//  This is the single entry point for app initialization.
//  Fires on: page load (INITIAL_SESSION), login (SIGNED_IN),
//  logout (SIGNED_OUT), token refresh (TOKEN_REFRESHED).
//
//  We track currentUserId so duplicate events (Supabase fires
//  both INITIAL_SESSION and SIGNED_IN on login) don't cause
//  double-init. Only reinitializes when user ID actually changes.
// ─────────────────────────────────────────────────────────

let currentUserId = null;

db.auth.onAuthStateChange(async (event, session) => {
  console.log('[Auth]', event, session?.user?.email || 'no user');

  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    currentUserId  = null;
    state.user     = null;
    state.profile  = null;
    state.problems = [];
    state.solvedSet = new Set();
    document.getElementById('auth-overlay').classList.remove('hidden');
    return;
  }

  const incomingId = session?.user?.id;
  if (!incomingId || incomingId === currentUserId) return;

  currentUserId   = incomingId;
  state.user      = session.user;
  state.solvedSet = new Set();

  // ── Step 1: Hide overlay and render immediately from auth metadata ──
  // Don't wait for DB at all — build profile from what we already have
  const username = session.user.user_metadata?.username
    || session.user.user_metadata?.full_name
    || session.user.email.split('@')[0];

  state.profile = {
    id: session.user.id,
    username,
    elo: 1200,
    solved_count: 0,
    streak: 0,
    is_admin: false,
    can_upload: false
  };

  document.getElementById('auth-overlay').classList.add('hidden');
  updateSidebarUser();
  document.getElementById('dash-name').textContent = username;
  document.getElementById('dash-sub').textContent  = 'Loading stats...';

  // ── Step 2: Load problems, then render (problems needed for dashboard content) ──
  // loadProblems has a 5s timeout — worst case falls back to seed data
  await loadProblems();

  // ── Step 3: Render dashboard now that problems are available ──
  renderDashboard();

  // ── Step 4 & 5: Run DB sync in background — UI already visible ──
  syncProfileFromDB();   // updates ELO/stats once DB responds
  loadSolvedSet();       // marks solved problems with ✓
});

// Syncs the real profile row from DB and updates UI if it succeeds
// Runs after the UI is already rendered so a slow/failed query doesn't block anything
async function syncProfileFromDB() {
  if (!state.user) return;
  try {
    // Try to get existing profile
    const { data } = await db
      .from('profiles')
      .select('*')
      .eq('id', state.user.id)
      .maybeSingle();

    if (data) {
      state.profile = data;
    } else {
      // Create profile row for new user
      const { data: created } = await db
        .from('profiles')
        .upsert({
          id:           state.user.id,
          username:     state.profile.username,
          elo:          1200,
          solved_count: 0,
          streak:       0
        }, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (created) state.profile = created;
    }

    console.log('[Profile] synced from DB:', state.profile.username, 'ELO:', state.profile.elo);
    updateSidebarUser();
    renderDashboard(); // re-render with real data
    try { await applyPermissions(); } catch(e) {}
  } catch (e) {
    console.warn('[Profile] DB sync failed (using auth metadata):', e.message);
  }
}


// ─────────────────────────────────────────────────────────
//  6. DATA LOADERS
// ─────────────────────────────────────────────────────────

// --- 6a. Profile loader
//
// Fetches the user's row from public.profiles.
// If it doesn't exist yet (e.g. trigger failed, Google OAuth),
// creates it manually. Falls back to a local object so the
// UI still renders even if the insert fails.

// loadProfile replaced by syncProfileFromDB (called after UI renders)


// --- 6b. Problems loader
//
// Fetches all problems from the DB ordered by creation date.
// Falls back to SEED_PROBLEMS if the table is empty or unreachable.
// Sets state.usingFallback so submission logic knows whether
// to persist attempt counts.

// Wraps any promise with a timeout — if DB hangs we fall back immediately
function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout after ' + ms + 'ms')), ms)
    )
  ]);
}

async function loadProblems() {
  const badge = document.getElementById('problem-count-badge');
  if (badge) badge.textContent = '…';

  try {
    // 20s timeout — Supabase free tier can take 15s+ to wake from sleep
    const { data, error } = await withTimeout(
      db.from('problems').select('*').order('created_at', { ascending: true }),
      20000
    );

    if (error) throw new Error(error.message);

    if (data && data.length > 0) {
      state.problems      = data;
      state.usingFallback = false;
      console.log('[Problems] loaded', data.length, 'from DB');
    } else {
      state.problems      = SEED_PROBLEMS;
      state.usingFallback = true;
      console.log('[Problems] DB empty, using seed data');
    }
  } catch (e) {
    console.warn('[Problems] timed out, showing seed data — retrying in 5s');
    state.problems      = SEED_PROBLEMS;
    state.usingFallback = true;

    // Retry after 5s — DB will be awake by then
    setTimeout(async () => {
      try {
        const { data: retryData } = await withTimeout(
          db.from('problems').select('*').order('created_at', { ascending: true }),
          15000
        );
        if (retryData && retryData.length > 0) {
          state.problems      = retryData;
          state.usingFallback = false;
          document.getElementById('problem-count-badge').textContent = retryData.length;
          if (state.currentView === 'dashboard')  renderDashboard();
          if (state.currentView === 'problems')   renderProblemsTable();
          console.log('[Problems] retry OK —', retryData.length, 'loaded');
          showToast('Problems loaded from database', 'success');
        }
      } catch (e2) { console.warn('[Problems] retry failed:', e2.message); }
    }, 5000);
  }

  document.getElementById('problem-count-badge').textContent = state.problems.length;
}


// --- 6c. Solved set loader
//
// Fetches all problem_ids the user has solved correctly.
// Populates state.solvedSet so the problems table can show ✓.

async function loadSolvedSet() {
  if (!state.user) return;
  try {
    const { data } = await withTimeout(
      db.from('submissions').select('problem_id').eq('user_id', state.user.id).eq('correct', true),
      5000
    );
    if (data) data.forEach(s => state.solvedSet.add(s.problem_id));
    console.log('[Solved]', state.solvedSet.size, 'problems solved');
  } catch (e) {
    console.warn('[Solved] failed:', e.message);
  }
}


// --- 6d. Global rank helper
//
// Fetches all profile IDs ordered by ELO and returns
// the current user's 1-based rank as "#N" string.

async function getUserRank() {
  const { data } = await db
    .from('profiles')
    .select('id')
    .order('elo', { ascending: false });
  if (!data) return '—';
  const rank = data.findIndex(p => p.id === state.user.id) + 1;
  return rank > 0 ? '#' + rank : '—';
}


// ─────────────────────────────────────────────────────────
//  7. ELO ENGINE
//
//  Standard Glicko-inspired formula (K-factor = 32).
//  Each problem has an implicit ELO based on difficulty.
//  If the player beats a problem above their rating,
//  they gain more. If they solve an easy problem, they
//  gain less (already expected to win).
//
//  Time bonus: solving in < 2 min gives +1 to +4 extra ELO.
//  This encourages speed as a secondary metric.
//
//  Formula:
//    expected  = 1 / (1 + 10^((problemElo - playerElo) / 400))
//    delta     = K * (score - expected) + timeBonus
//    newElo    = max(800, playerElo + delta)   ← floor at 800
// ─────────────────────────────────────────────────────────

function calcElo(playerElo, difficulty, correct, timeTakenSecs) {
  // Implicit ELO of the problem by difficulty tier
  const problemElo = { Easy: 1100, Medium: 1350, Hard: 1650 }[difficulty] || 1200;
  const K = 32;

  // Expected score (probability of winning) from player's perspective
  const expected = 1 / (1 + Math.pow(10, (problemElo - playerElo) / 400));
  const score    = correct ? 1 : 0;

  // Time bonus: max +4 for solving in under 30s, scaling down to 0 at 120s+
  const timeBonus = correct ? Math.max(0, Math.floor((120 - timeTakenSecs) / 30)) : 0;

  const delta  = Math.round(K * (score - expected)) + timeBonus;
  const newElo = Math.max(800, playerElo + delta);

  return { delta, newElo };
}


// ─────────────────────────────────────────────────────────
//  8. NAVIGATION
// ─────────────────────────────────────────────────────────

function navigate(view) {
  // Stop the solve timer when leaving the solve view
  if (state.currentView === 'solve' && view !== 'solve') {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  state.currentView = view;

  // Lazy-render each view when first navigated to
  if (view === 'problems')    renderProblemsTable();
  if (view === 'leaderboard') renderLeaderboard();
  if (view === 'dashboard')   renderDashboard();
  if (view === 'profile')     renderProfile();
  if (view === 'admin')       renderAdminPanel();
}


// ─────────────────────────────────────────────────────────
//  9. SIDEBAR USER CARD
//
//  Updates the avatar initial, username, ELO bar, and ELO number.
//  ELO bar maps 800–2400 → 0–100%.
// ─────────────────────────────────────────────────────────

function updateSidebarUser() {
  const p = state.profile;
  if (!p) return;

  const initial = (p.username || '?')[0].toUpperCase();
  document.getElementById('sb-avatar').textContent  = initial;
  document.getElementById('sb-name').textContent    = p.username || 'User';
  document.getElementById('sb-handle').textContent  = 'ELO ' + (p.elo || 1200);
  document.getElementById('sb-elo').textContent     = p.elo || 1200;

  const pct = Math.min(100, Math.max(0, ((p.elo - 800) / 1600) * 100)).toFixed(1);
  document.getElementById('sb-elo-bar').style.width = pct + '%';
}


// --- Show/hide nav items based on permissions
//
// Called after profile loads. Checks:
//   - is_admin: show admin nav item
//   - can_upload OR is_admin OR open_uploads setting: show upload nav item

async function applyPermissions() {
  const p = state.profile;
  if (!p) return;

  // Admin nav — only show if is_admin column exists and is true
  const navAdmin = document.getElementById('nav-admin');
  navAdmin.style.display = p.is_admin ? '' : 'none';

  // Upload nav — check can_upload, is_admin, or the global open_uploads setting
  // Wrapped in try/catch: settings table may not exist if admin migration hasn't been run yet
  let canUpload = p.can_upload || p.is_admin || false;
  if (!canUpload) {
    try {
      const { data } = await db
        .from('settings')
        .select('value')
        .eq('key', 'open_uploads')
        .single();
      canUpload = data?.value === 'true';
    } catch (e) {
      // settings table doesn't exist yet — that's fine, just default to false
      console.log('[Permissions] settings table not found, defaulting open_uploads=false');
    }
  }
  document.getElementById('nav-upload').style.display = canUpload ? '' : 'none';
}


// ─────────────────────────────────────────────────────────
//  10. DASHBOARD
// ─────────────────────────────────────────────────────────

async function renderDashboard() {
  const p = state.profile;
  if (!p) return;

  document.getElementById('dash-name').textContent = p.username || 'Mathematician';
  document.getElementById('dash-sub').textContent  = `Rating: ${p.elo} ELO · ${p.solved_count} problems solved`;
  document.getElementById('stat-solved').textContent = p.solved_count || 0;
  document.getElementById('stat-elo').textContent    = p.elo || 1200;

  // Accuracy: correct submissions / total submissions
  const { data: subs } = await db
    .from('submissions')
    .select('correct')
    .eq('user_id', state.user.id);

  if (subs && subs.length) {
    const acc = Math.round((subs.filter(s => s.correct).length / subs.length) * 100);
    document.getElementById('stat-accuracy').textContent = acc + '%';
  } else {
    document.getElementById('stat-accuracy').textContent = '—';
  }

  document.getElementById('stat-rank').textContent = await getUserRank();

  // Daily challenge: first problem in the list
  const daily = state.problems[0];
  if (daily) {
    const card = document.getElementById('daily-card');
    card.innerHTML = `
      <div class="featured-label"><div class="featured-dot"></div> Daily Challenge</div>
      <div class="featured-title">${daily.title}</div>
      <div class="featured-problem-text">${daily.body}</div>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn btn-gold" onclick="openProblem('${daily.id}')">Solve Now →</button>
        <span class="diff-badge diff-${(daily.difficulty || '').toLowerCase()}">${daily.difficulty}</span>
        <span class="topic-tag">${daily.topic}</span>
        <span style="margin-left:auto;font-size:11px;color:var(--text-muted)">${solveRate(daily)}% solve rate</span>
      </div>`;
    card.onclick = e => { if (!e.target.closest('button')) openProblem(daily.id); };
  }

  // Recent problems: last 3 added
  const recent = state.problems.slice(-3).reverse();
  document.getElementById('recent-problems').innerHTML = recent.map(p => `
    <div class="problem-card" onclick="openProblem('${p.id}')">
      <div class="problem-card-top">
        <div class="problem-title">${p.title}</div>
        <div class="diff-badge diff-${(p.difficulty || '').toLowerCase()}">${p.difficulty}</div>
      </div>
      <div class="problem-meta">
        <span class="topic-tag">${p.topic}</span>
        <span class="meta-stat">${solveRate(p)}% solved</span>
        <span class="meta-stat">${p.points} pts</span>
      </div>
    </div>`).join('');
}

// Helper: solve rate as integer %
function solveRate(p) {
  if (!p.attempts || p.attempts === 0) return 0;
  return Math.round(((p.correct_count || 0) / p.attempts) * 100);
}


// ─────────────────────────────────────────────────────────
//  11. PROBLEMS TABLE + FILTERS
// ─────────────────────────────────────────────────────────

function setFilter(type, val, btn) {
  state.filters[type] = val;
  // Deactivate siblings in same group, activate clicked
  btn.closest('.filter-bar, .section-tabs')
    .querySelectorAll(`[onclick*="setFilter('${type}'"]`)
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProblemsTable();
}

function renderProblemsTable() {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase();

  const filtered = state.problems.filter(p => {
    if (state.filters.section !== 'all' && (p.section || 'General') !== state.filters.section) return false;
    if (state.filters.topic   !== 'all' && p.topic !== state.filters.topic) return false;
    if (state.filters.diff    !== 'all' && p.difficulty !== state.filters.diff) return false;
    if (search && !p.title.toLowerCase().includes(search) && !p.topic.toLowerCase().includes(search)) return false;
    return true;
  });

  if (!filtered.length) {
    document.getElementById('problems-tbody').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">∅</div>
        <div class="empty-state-text">No problems match your filters.</div>
      </div>`;
    return;
  }

  document.getElementById('problems-tbody').innerHTML = filtered.map((p, i) => `
    <div class="table-row" onclick="openProblem('${p.id}')">
      <div class="row-num">${i + 1}</div>
      <div>
        <div class="row-title">${p.title}</div>
        <div class="row-title-sub">${p.attempts || 0} attempts</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="topic-tag">${p.topic}</span>
        ${p.question_type === 'mcq' ? '<span style="font-size:9px;color:var(--orange);background:rgba(240,147,78,0.1);border:1px solid rgba(240,147,78,0.25);padding:1px 6px;border-radius:10px;letter-spacing:.05em">MCQ</span>' : ''}
      </div>
      <div><span class="diff-badge diff-${(p.difficulty || '').toLowerCase()}">${p.difficulty}</span></div>
      <div class="solve-rate-wrap">
        <div class="solve-rate-bar"><div class="solve-rate-fill" style="width:${solveRate(p)}%"></div></div>
        <div class="solve-rate-text">${solveRate(p)}%</div>
      </div>
      <div class="row-pts">${p.points}</div>
      <div style="font-size:14px;color:${state.solvedSet.has(p.id) ? 'var(--teal)' : 'var(--text-muted)'}">
        ${state.solvedSet.has(p.id) ? '✓' : '○'}
      </div>
    </div>`).join('');
}


// ─────────────────────────────────────────────────────────
//  12. SOLVE VIEW + ANSWER SUBMISSION
// ─────────────────────────────────────────────────────────

function openProblem(id) {
  state.currentProblemId = id;
  navigate('solve');
  renderSolve(id);
}

// Renders A/B/C/D/E choice buttons for MCQ problems
function renderMCQOptions(p, alreadySolved) {
  const opts = typeof p.options === 'string' ? JSON.parse(p.options) : p.options;
  const letters = ['A','B','C','D','E'];
  const correctLetter = p.answer.toUpperCase();

  return `<div class="mcq-options" id="mcq-options">
    ${letters.filter(l => opts[l]).map(l => {
      let cls = 'mcq-option';
      if (alreadySolved) {
        cls += l === correctLetter ? ' mcq-correct' : ' mcq-disabled';
      }
      return `<button class="${cls}" id="mcq-${l}"
        onclick="selectMCQ('${l}', '${p.id}')"
        ${alreadySolved ? 'disabled' : ''}>
        <span class="mcq-letter">${l}</span>
        <span class="mcq-text">${opts[l]}</span>
      </button>`;
    }).join('')}
  </div>`;
}

// Handles clicking an MCQ option
function selectMCQ(letter, id) {
  // Highlight selected, deselect others
  document.querySelectorAll('.mcq-option').forEach(btn => btn.classList.remove('mcq-selected'));
  const btn = document.getElementById('mcq-' + letter);
  if (btn) btn.classList.add('mcq-selected');
  // Store selection in a hidden input for submitAnswer to read
  let hidden = document.getElementById('answer-input');
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.id = 'answer-input';
    hidden.type = 'hidden';
    document.getElementById('mcq-options').appendChild(hidden);
  }
  hidden.value = letter;
  // Auto-submit on click for MCQ
  submitAnswer(id);
}

function renderSolve(id) {
  const p = state.problems.find(x => String(x.id) === String(id));
  if (!p) return;

  // Reset and start timer
  clearInterval(state.timerInterval);
  state.timerSeconds = 0;
  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    const el = document.getElementById('timer-display');
    if (el) el.textContent = formatTime(state.timerSeconds);
  }, 1000);

  const alreadySolved = state.solvedSet.has(p.id);

  document.getElementById('solve-content').innerHTML = `
    <div class="solve-header">
      <div class="back-btn" onclick="navigate('problems')">← Back</div>
      <div style="flex:1">
        <div class="solve-title">${p.title}</div>
        <div class="solve-meta">
          <span class="topic-tag">${p.topic}</span>
          <span class="diff-badge diff-${(p.difficulty || '').toLowerCase()}">${p.difficulty}</span>
          <span class="points-badge">${p.points} pts</span>
          <span class="timer-badge">
            <div class="timer-dot"></div>
            <span id="timer-display">0:00</span>
          </span>
        </div>
      </div>
    </div>

    <div class="problem-statement">
      <div class="problem-statement-label">Problem</div>
      <div class="problem-text">${p.body}</div>
      ${p.hint ? `
        <div class="hint-toggle" onclick="toggleHint()">
          <span id="hint-arrow">▸</span> Show hint
        </div>
        <div class="hint-box" id="hint-box">${p.hint}</div>` : ''}
    </div>

    <div class="answer-section">
      <div class="answer-label">Your Answer</div>
      ${p.question_type === 'mcq' && p.options ? renderMCQOptions(p, alreadySolved) : `
      <div class="answer-input-wrap">
        <input
          class="answer-input ${alreadySolved ? 'correct' : ''}"
          id="answer-input"
          type="text"
          placeholder="Enter your answer..."
          value="${alreadySolved ? p.answer : ''}"
          ${alreadySolved ? 'readonly' : ''}
          onkeydown="if(event.key==='Enter') submitAnswer('${p.id}')">
        <button class="btn btn-gold" id="submit-btn"
          onclick="submitAnswer('${p.id}')"
          ${alreadySolved ? 'disabled style=opacity:.5' : ''}>
          ${alreadySolved ? '✓ Solved' : 'Submit →'}
        </button>
        <button class="btn btn-outline" onclick="clearAnswer()">Clear</button>
      </div>`}
      <div id="result-panel"></div>
    </div>

    ${alreadySolved ? `
    <div class="result-panel correct-panel visible">
      <div class="result-header">
        <div style="font-size:20px">✓</div>
        <div class="result-title correct-text">Already Solved</div>
      </div>
      <div class="result-explanation">${p.explanation}</div>
    </div>` : ''}

    <div style="display:flex;gap:12px;margin-top:16px">
      <button class="btn btn-ghost" style="margin-left:auto" onclick="navigate('problems')">
        Back to Problems
      </button>
    </div>`;
}

async function submitAnswer(id) {
  const p = state.problems.find(x => String(x.id) === String(id));
  if (!p) return;

  const input      = document.getElementById('answer-input');
  const userAnswer = input.value.trim();
  if (!userAnswer) { showToast('Enter an answer first.', 'error'); return; }
  if (!state.user)  { showToast('You must be logged in.', 'error'); return; }

  // Stop timer, lock in the time
  clearInterval(state.timerInterval);
  const timeTaken = state.timerSeconds;

  const correct = normAnswer(userAnswer) === normAnswer(p.answer);
  const panel   = document.getElementById('result-panel');
  input.className = 'answer-input ' + (correct ? 'correct' : 'wrong');

  // Calculate ELO change regardless of right/wrong (wrong still runs the formula)
  const { delta, newElo } = calcElo(state.profile.elo || 1200, p.difficulty, correct, timeTaken);
  const peekedBeforeCorrect = state.solutionViewedSet.has(String(p.id));
  const eloStr = peekedBeforeCorrect
    ? '+0 (solution viewed)'
    : (correct && delta > 0 ? '+' : '') + delta;

  if (correct) {
    // ── CORRECT ──────────────────────────────────────────
    // Check if user already peeked at solution — if so, no ELO awarded
    const solutionWasPeeked = state.solutionViewedSet.has(String(p.id));
    state.solvedSet.add(p.id);

    panel.innerHTML = `
      <div class="result-header">
        <div style="font-size:20px">✓</div>
        <div class="result-title correct-text">Correct! ${eloStr} ELO</div>
      </div>
      <div class="result-explanation">
        Solved in ${formatTime(timeTaken)}.<br><br>
        <strong style="color:var(--text)">Solution:</strong> ${p.explanation}
      </div>`;
    panel.className = 'result-panel correct-panel visible';
    showToast(`✓ Correct! ${eloStr} ELO`, 'success');

    // Lock input (open-answer) or MCQ buttons
    if (input) input.readOnly = true;
    const btn = document.getElementById('submit-btn');
    if (btn) { btn.disabled = true; btn.style.opacity = '.5'; btn.textContent = '✓ Solved'; }
    // Lock all MCQ buttons and highlight correct
    document.querySelectorAll('.mcq-option').forEach(b => {
      b.disabled = true;
      b.classList.remove('mcq-selected');
    });
    const correctBtn = document.getElementById('mcq-' + p.answer.toUpperCase());
    if (correctBtn) correctBtn.classList.add('mcq-correct');

    // Persist to Supabase — skip ELO update if solution was peeked
    if (!solutionWasPeeked) {
      const { error: eloErr } = await db
        .from('profiles')
        .update({
          elo:          newElo,
          solved_count: (state.profile.solved_count || 0) + 1,
          last_active:  new Date().toISOString().split('T')[0]
        })
        .eq('id', state.user.id);
      if (eloErr) console.error('[ELO save]', eloErr.message);
      else console.log('[ELO] updated to', newElo);
      state.profile.elo         = newElo;
      state.profile.solved_count = (state.profile.solved_count || 0) + 1;
    } else {
      // Still count as solved but don't award ELO
      await db.from('profiles')
        .update({ solved_count: (state.profile.solved_count || 0) + 1, last_active: new Date().toISOString().split('T')[0] })
        .eq('id', state.user.id);
      state.profile.solved_count = (state.profile.solved_count || 0) + 1;
      console.log('[ELO] skipped — solution was viewed for this problem');
    }
    updateSidebarUser();

    // Record submission (upsert to avoid duplicate if re-submitted)
    await db.from('submissions').upsert({
      user_id:    state.user.id,
      problem_id: String(p.id),
      correct:    true,
      time_taken: timeTaken
    }, { onConflict: 'user_id,problem_id' });

    // Increment problem counters (only if using real DB, not seed)
    if (!state.usingFallback) {
      await db.from('problems').update({
        attempts:      (p.attempts || 0) + 1,
        correct_count: (p.correct_count || 0) + 1
      }).eq('id', p.id);
    }

  } else {
    // ── INCORRECT ────────────────────────────────────────
    // Track that user has attempted this problem
    state.attemptedSet.add(p.id);

    const alreadyAttempted = true; // just set it above

    panel.innerHTML = `
      <div class="result-header">
        <div style="font-size:20px">✗</div>
        <div class="result-title wrong-text">Incorrect — Try Again</div>
      </div>
      <div class="result-explanation">
        Not quite. Check your working, or reveal the hint above.
      </div>
      <div style="margin-top:14px">
        <button class="btn btn-ghost" style="font-size:11px;color:var(--text-muted)"
          onclick="viewSolution('${p.id}')">
          👁 View Solution
          <span style="font-size:9px;color:var(--red);margin-left:4px">(blocks ELO gain)</span>
        </button>
      </div>`;
    panel.className = 'result-panel wrong-panel visible';
    showToast('✗ Incorrect. Keep trying.', 'error');

    // Re-enable MCQ buttons for another attempt (highlight wrong selection red)
    const wrongBtn = document.getElementById('mcq-' + userAnswer.toUpperCase());
    if (wrongBtn) {
      wrongBtn.classList.remove('mcq-selected');
      wrongBtn.classList.add('mcq-wrong');
      setTimeout(() => wrongBtn.classList.remove('mcq-wrong'), 1200);
    }
    document.querySelectorAll('.mcq-option').forEach(b => { b.disabled = false; });
    // Clear hidden input
    const hi = document.getElementById('answer-input');
    if (hi) hi.value = '';

    // Restart timer for the next attempt
    state.timerSeconds  = 0;
    state.timerInterval = setInterval(() => {
      state.timerSeconds++;
      const el = document.getElementById('timer-display');
      if (el) el.textContent = formatTime(state.timerSeconds);
    }, 1000);

    // Count the failed attempt (only on real DB, and only if not already solved)
    if (!state.usingFallback && !state.solvedSet.has(p.id)) {
      await db.from('problems')
        .update({ attempts: (p.attempts || 0) + 1 })
        .eq('id', p.id);
    }
  }
}

function toggleHint() {
  const box = document.getElementById('hint-box');
  const arr = document.getElementById('hint-arrow');
  if (!box) return;
  box.classList.toggle('visible');
  arr.textContent = box.classList.contains('visible') ? '▾' : '▸';
}

function clearAnswer() {
  const input = document.getElementById('answer-input');
  if (input && !input.readOnly) { input.value = ''; input.className = 'answer-input'; }
  const panel = document.getElementById('result-panel');
  if (panel)  { panel.className = 'result-panel'; panel.innerHTML = ''; }
}


// Shows the full solution and marks the problem as ELO-blocked
function viewSolution(id) {
  const p = state.problems.find(x => String(x.id) === String(id));
  if (!p) return;

  // Mark as peeked — ELO permanently blocked for this problem this session
  state.solutionViewedSet.add(String(id));

  // Stop timer
  clearInterval(state.timerInterval);
  state.timerInterval = null;

  // Disable all inputs
  const input = document.getElementById('answer-input');
  if (input) { input.readOnly = true; input.className = 'answer-input'; }
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '.5'; }
  document.querySelectorAll('.mcq-option').forEach(b => {
    b.disabled = true;
    b.classList.remove('mcq-selected', 'mcq-wrong');
  });
  // Highlight correct MCQ answer
  const correctMCQ = document.getElementById('mcq-' + (p.answer || '').toUpperCase());
  if (correctMCQ) correctMCQ.classList.add('mcq-correct');

  // Replace the result panel with full solution
  const panel = document.getElementById('result-panel');
  if (panel) {
    panel.innerHTML = `
      <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="font-size:16px">📖</div>
          <div style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--text)">Solution</div>
          <div style="margin-left:auto;font-size:10px;color:var(--red);background:var(--red-dim);border:1px solid rgba(240,96,96,0.2);padding:2px 8px;border-radius:10px;letter-spacing:.05em">
            ELO BLOCKED
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-dim);line-height:1.9;background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:16px">
          ${p.explanation || 'No solution available.'}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:10px">
          You can still submit the correct answer, but no ELO will be awarded since you viewed the solution.
        </div>
      </div>`;
    panel.className = 'result-panel visible';
    panel.style.border = '1px solid rgba(240,96,96,0.2)';
  }
}

// ─────────────────────────────────────────────────────────
//  13. UPLOAD PROBLEM (permission-gated)
//
//  Permission check happens server-side via RLS:
//  the INSERT policy on problems checks can_upload or is_admin.
//  We also gate the UI in applyPermissions() so unauthorized
//  users never see the upload nav item or form.
// ─────────────────────────────────────────────────────────

function updatePreview() {
  const title = document.getElementById('up-title').value;
  const body  = document.getElementById('up-body').value;
  const topic = document.getElementById('up-topic').value;
  const diff  = document.getElementById('up-difficulty').value;
  const pts   = document.getElementById('up-points').value || 100;
  const el    = document.getElementById('upload-preview');

  if (!title && !body) {
    el.innerHTML = `<div class="preview-empty"><div class="preview-empty-icon">∑</div><div>Start typing to see a preview</div></div>`;
    return;
  }

  el.innerHTML = `
    <div>
      <div class="problem-card-top" style="margin-bottom:12px">
        <div class="problem-title" style="font-family:var(--font-display);font-size:20px;font-weight:500">
          ${title || 'Untitled'}
        </div>
        ${diff ? `<span class="diff-badge diff-${diff.toLowerCase()}">${diff}</span>` : ''}
      </div>
      ${topic ? `<span class="topic-tag" style="margin-bottom:12px;display:inline-block">${topic}</span>` : ''}
      <div style="font-size:13px;line-height:1.8;color:var(--text-dim);background:var(--bg-card2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:14px">
        ${body || '<span style="color:var(--text-muted);font-style:italic">Problem will appear here...</span>'}
      </div>
      <div style="font-size:11px;color:var(--text-muted)">${pts} points · 0 attempts · — % solve rate</div>
    </div>`;
}

async function submitProblem() {
  const title = document.getElementById('up-title').value.trim();
  const body  = document.getElementById('up-body').value.trim();
  const topic = document.getElementById('up-topic').value;
  const diff  = document.getElementById('up-difficulty').value;
  const ans   = document.getElementById('up-answer').value.trim();
  const expl  = document.getElementById('up-explanation').value.trim();

  if (!title || !body || !topic || !diff || !ans || !expl) {
    showToast('Fill in all required fields.', 'error');
    return;
  }

  const newProblem = {
    title, body, topic, difficulty: diff, answer: ans, explanation: expl,
    hint:       document.getElementById('up-hint').value.trim() || null,
    points:     parseInt(document.getElementById('up-points').value) || 100,
    attempts:   0,
    correct_count: 0,
    created_by: state.user?.id || null,
  };

  if (!state.usingFallback) {
    // DB insert — RLS will reject if user lacks permission
    const { data, error } = await db.from('problems').insert(newProblem).select().single();
    if (error) { showToast('Error: ' + error.message, 'error'); return; }
    state.problems.push(data);
  } else {
    // Fallback mode: add locally only
    newProblem.id = 'local-' + Date.now();
    state.problems.push(newProblem);
  }

  document.getElementById('problem-count-badge').textContent = state.problems.length;

  // Clear form
  ['up-title','up-body','up-answer','up-hint','up-explanation'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('up-topic').value     = '';
  document.getElementById('up-difficulty').value = '';
  document.getElementById('up-points').value     = '100';
  updatePreview();

  showToast('✓ Problem added!', 'success');
  setTimeout(() => navigate('problems'), 1200);
}


// ─────────────────────────────────────────────────────────
//  14. LEADERBOARD
// ─────────────────────────────────────────────────────────

async function renderLeaderboard() {
  document.getElementById('lb-tbody').innerHTML  = '<div class="auth-loading">Loading...</div>';
  document.getElementById('podium').innerHTML    = '';

  // Fetch top 20 by ELO
  const { data: lb, error } = await db
    .from('profiles')
    .select('id,username,elo,solved_count,streak')
    .order('elo', { ascending: false })
    .limit(20);

  if (error) console.error('[Leaderboard]', error.message);
  const data = lb || [];

  // Podium (top 3 displayed in 2nd / 1st / 3rd order)
  if (data.length >= 3) {
    const podiumOrder = [data[1], data[0], data[2]];
    const medals      = ['🥈', '🥇', '🥉'];
    const podiumCls   = ['second', 'first', 'third'];

    document.getElementById('podium').innerHTML = podiumOrder.map((u, i) => `
      <div class="podium-card ${podiumCls[i]}">
        ${podiumCls[i] === 'first' ? '<div class="podium-crown">👑</div>' : ''}
        <div class="podium-rank">${medals[i]}</div>
        <div class="podium-avatar">${(u?.username || '?')[0].toUpperCase()}</div>
        <div class="podium-name">${u?.username || '—'}</div>
        <div class="podium-rating">${u?.elo || 0} ELO</div>
        <div class="podium-solved">${u?.solved_count || 0} solved</div>
      </div>`).join('');
  }

  if (!data.length) {
    document.getElementById('lb-tbody').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">◈</div>
        <div class="empty-state-text">No users yet. Be the first!</div>
      </div>`;
    return;
  }

  document.getElementById('lb-tbody').innerHTML = data.map((u, i) => {
    const isYou = u.id === state.user?.id;
    return `
    <div class="lb-row ${isYou ? 'you' : ''}">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-user">
        <div class="lb-avatar" style="${isYou ? 'background:var(--gold-dim);border-color:rgba(232,184,75,0.3);color:var(--gold)' : ''}">
          ${(u.username || '?')[0].toUpperCase()}
        </div>
        <div>
          <div class="lb-username">
            ${u.username || 'Anonymous'}
            ${isYou ? '<span style="font-size:9px;color:var(--gold);background:var(--gold-dim);padding:1px 6px;border-radius:10px;margin-left:6px">you</span>' : ''}
          </div>
          <div class="lb-sub">${u.solved_count || 0} problems solved</div>
        </div>
      </div>
      <div class="lb-rating-cell">${u.elo || 1200}</div>
      <div class="lb-solved-cell">${u.solved_count || 0}</div>
      <div class="lb-acc-cell">—</div>
      <div class="lb-streak-cell">${(u.streak || 0) > 0 ? '🔥 ' + u.streak : '—'}</div>
    </div>`;
  }).join('');
}


// ─────────────────────────────────────────────────────────
//  15. PROFILE PAGE
// ─────────────────────────────────────────────────────────

async function renderProfile() {
  const p = state.profile;
  if (!p) return;

  const initial = (p.username || '?')[0].toUpperCase();
  document.getElementById('prof-avatar').textContent        = initial;
  document.getElementById('prof-name').textContent          = p.username || 'Unknown';
  document.getElementById('prof-email').textContent         = state.user?.email || '';
  document.getElementById('prof-username-input').value      = p.username || '';
  document.getElementById('prof-elo').textContent           = p.elo || 1200;
  document.getElementById('prof-solved').textContent        = p.solved_count || 0;
  document.getElementById('prof-streak').textContent        = (p.streak || 0) + 'd';
  document.getElementById('prof-rank').textContent          = await getUserRank();

  // Fetch recent submissions (flat query, no join — match titles from state.problems)
  const { data: subs, error } = await db
    .from('submissions')
    .select('problem_id, correct, time_taken, submitted_at')
    .eq('user_id', state.user.id)
    .order('submitted_at', { ascending: false })
    .limit(10);

  if (error) console.error('[Submissions]', error.message);

  if (!subs || !subs.length) {
    document.getElementById('prof-submissions').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">○</div>
        <div class="empty-state-text">No submissions yet. Solve some problems!</div>
      </div>`;
    return;
  }

  document.getElementById('prof-submissions').innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
      ${subs.map(s => {
        const prob = state.problems.find(x => String(x.id) === String(s.problem_id));
        return `
        <div style="display:grid;grid-template-columns:1fr 100px 80px 80px;padding:14px 20px;border-bottom:1px solid var(--border);align-items:center;gap:16px">
          <div style="font-family:var(--font-display);font-size:14px">${prob?.title || 'Unknown Problem'}</div>
          <div><span class="diff-badge diff-${(prob?.difficulty || '').toLowerCase()}">${prob?.difficulty || '—'}</span></div>
          <div style="font-size:12px;color:${s.correct ? 'var(--teal)' : 'var(--red)'}">
            ${s.correct ? '✓ Correct' : '✗ Wrong'}
          </div>
          <div style="font-size:11px;color:var(--text-muted)">${formatTime(s.time_taken || 0)}</div>
        </div>`;
      }).join('')}
    </div>`;
}

async function saveUsername() {
  const val = document.getElementById('prof-username-input').value.trim();
  if (!val) { showToast('Username cannot be empty.', 'error'); return; }
  const { error } = await db.from('profiles').update({ username: val }).eq('id', state.user.id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  state.profile.username = val;
  updateSidebarUser();
  renderProfile();
  showToast('Username updated!', 'success');
}


// ─────────────────────────────────────────────────────────
//  16. ADMIN PANEL
//
//  Only reachable if profile.is_admin = true (enforced via
//  applyPermissions() which hides the nav item, and DB RLS
//  which blocks the data queries for non-admins).
//
//  Features:
//   - Global "open_uploads" toggle (anyone can upload when on)
//   - Per-user can_upload toggle
//   - Per-user is_admin toggle (admins can grant admin to others)
// ─────────────────────────────────────────────────────────

async function renderAdminPanel() {
  if (!state.profile?.is_admin) {
    navigate('dashboard');
    showToast('Access denied.', 'error');
    return;
  }

  // Load current open_uploads setting
  const { data: setting } = await db
    .from('settings')
    .select('value')
    .eq('key', 'open_uploads')
    .single();

  const openUploads = setting?.value === 'true';
  document.getElementById('toggle-open-uploads').checked = openUploads;

  // Load all users
  await refreshAdminUserList();
}

async function refreshAdminUserList() {
  const { data: users, error } = await db
    .from('profiles')
    .select('id, username, elo, can_upload, is_admin')
    .order('elo', { ascending: false });

  if (error) {
    document.getElementById('admin-user-list').innerHTML = `
      <div class="auth-loading" style="color:var(--red)">Error loading users: ${error.message}</div>`;
    return;
  }

  if (!users || !users.length) {
    document.getElementById('admin-user-list').innerHTML =
      '<div class="auth-loading">No users found.</div>';
    return;
  }

  document.getElementById('admin-user-list').innerHTML = users.map(u => `
    <div class="admin-user-row">
      <div>
        <div class="admin-username">${u.username || 'Unknown'}</div>
        ${u.id === state.user.id ? '<div style="font-size:9px;color:var(--gold)">you</div>' : ''}
      </div>
      <div class="admin-email" style="font-size:11px;color:var(--text-muted)">
        ELO: ${u.elo || 1200}
      </div>
      <div class="admin-elo">${u.elo || 1200}</div>
      <div>
        <label class="toggle">
          <input type="checkbox"
            ${u.can_upload ? 'checked' : ''}
            onchange="setUserPermission('${u.id}', 'can_upload', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div>
        <label class="toggle">
          <input type="checkbox"
            ${u.is_admin ? 'checked' : ''}
            ${u.id === state.user.id ? 'disabled title="Cannot remove your own admin"' : ''}
            onchange="setUserPermission('${u.id}', 'is_admin', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>`).join('');
}

// Toggle the global open_uploads setting
async function toggleOpenUploads(value) {
  if (!state.profile?.is_admin) return;

  const { error } = await db
    .from('settings')
    .upsert({ key: 'open_uploads', value: String(value) }, { onConflict: 'key' });

  if (error) {
    showToast('Error saving setting: ' + error.message, 'error');
    // Revert toggle
    document.getElementById('toggle-open-uploads').checked = !value;
    return;
  }

  showToast(value ? '✓ Anyone can now upload problems' : 'Upload restricted to permitted users', 'success');
  applyPermissions(); // refresh current user's nav items
}

// Grant or revoke a permission for a specific user
async function setUserPermission(userId, field, value) {
  if (!state.profile?.is_admin) return;

  // Safety: don't let admin remove their own admin
  if (field === 'is_admin' && userId === state.user.id && !value) {
    showToast('Cannot remove your own admin privileges.', 'error');
    await refreshAdminUserList(); // revert the toggle
    return;
  }

  const { error } = await db
    .from('profiles')
    .update({ [field]: value })
    .eq('id', userId);

  if (error) {
    showToast('Error: ' + error.message, 'error');
    await refreshAdminUserList();
    return;
  }

  const label = field === 'can_upload' ? 'upload access' : 'admin access';
  showToast(`${value ? '✓ Granted' : '✗ Revoked'} ${label}`, 'success');
}


// ─────────────────────────────────────────────────────────
//  17. UTILITIES
// ─────────────────────────────────────────────────────────

// Normalise an answer string for comparison:
// lowercase, strip whitespace and commas
function normAnswer(a) {
  return a.toString().toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
}

// Format seconds as M:SS
function formatTime(s) {
  return Math.floor(s / 60) + ':' + (s % 60).toString().padStart(2, '0');
}

// Toast notification (auto-dismisses after 2.8s)
let toastTimeout;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'visible' + (type ? ' toast-' + type : '');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { el.className = ''; }, 2800);
}


// ─────────────────────────────────────────────────────────
//  18. BOOT
//
//  On page load, check if there's an existing session.
//  If not, show the auth overlay.
//  If yes, onAuthStateChange fires INITIAL_SESSION event
//  which calls init() via the listener above.
// ─────────────────────────────────────────────────────────

(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    document.getElementById('auth-overlay').classList.remove('hidden');
  }
  // If session exists: onAuthStateChange(INITIAL_SESSION) → init chain runs
})();
