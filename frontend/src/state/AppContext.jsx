import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const ALL_TOPICS = [
  'Number Theory', 'Algebra', 'Combinatorics',
  'Geometry', 'Probability', 'Sequences'
];

let nextToastId = 0;

export function AppProvider({ children }) {
  const [session,     setSession]     = useState(undefined);
  const [profile,     setProfile]     = useState(null);
  const [problems,    setProblems]    = useState([]);
  const [solvedSet,   setSolvedSet]   = useState(new Set());
  const [canUpload,   setCanUpload]   = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [topicElos,   setTopicElos]   = useState({});
  const [toasts,      setToasts]      = useState([]);

  const solutionViewed = useRef(new Set());

  function showToast(msg, type = '') {
    const id = ++nextToastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(prev => {
        if (s?.user?.id === prev?.user?.id) return prev;
        return s;
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadAll() {
    if (!session?.user) return;
    setLoadingData(true);
    try {
      const [prof, probs, topicRows] = await Promise.all([
        api.profile(),
        api.problems(),
        api.topicElos().catch(() => [])
      ]);

      setProfile(prof);
      setProblems(probs.problems);
      setSolvedSet(new Set(probs.solved.map(String)));

      const stored = {};
      for (const r of topicRows) stored[r.topic] = r.elo;
      const allElos = {};
      for (const t of ALL_TOPICS) allElos[t] = stored[t] ?? 1200;
      setTopicElos(allElos);

      let upload = !!(prof.can_upload || prof.is_admin);
      if (!upload) {
        try { upload = (await api.openUploads()).open_uploads; } catch {}
      }
      setCanUpload(upload);
    } catch (e) {
      showToast('Could not connect to server: ' + e.message, 'error');
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadAll();
    } else if (session === null) {
      setProfile(null);
      setProblems([]);
      setSolvedSet(new Set());
      setTopicElos({});
      solutionViewed.current = new Set();
    }
  }, [session]);

  async function refreshProblems() {
    const probs = await api.problems();
    setProblems(probs.problems);
    setSolvedSet(new Set(probs.solved.map(String)));
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  function markSolutionViewed(id) {
    solutionViewed.current.add(String(id));
  }

  function wasSolutionViewed(id) {
    return solutionViewed.current.has(String(id));
  }

  const value = {
    session, profile, setProfile, problems, setProblems,
    solvedSet, setSolvedSet, canUpload, loadingData,
    topicElos, setTopicElos,
    refreshAll: loadAll, refreshProblems, logout,
    toast: showToast,
    markSolutionViewed, wasSolutionViewed
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              className={`toast ${t.type}`}
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
}
