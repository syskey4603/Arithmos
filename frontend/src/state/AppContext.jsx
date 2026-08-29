import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export const ALL_TOPICS = ['Number Theory', 'Algebra', 'Combinatorics', 'Geometry', 'Probability', 'Sequences']

let toastCounter = 0

// this holds pretty much all the app state, profile, problems, whos logged in etc
// so every page can just pull from useApp() instead of passing props everywhere
export function AppProvider({ children }) {
  // session starts as undefined on purpose, that means "havent checked yet"
  // once supabase responds it becomes either null (logged out) or the actual session
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [problems, setProblems] = useState([])
  const [solvedSet, setSolvedSet] = useState(new Set())
  const [loadingData, setLoadingData] = useState(false)
  const [topicElos, setTopicElos] = useState({})
  const [toasts, setToasts] = useState([])

  function toast(msg, type) {
    const id = ++toastCounter
    setToasts(t => [...t, { id, msg, type: type || '' }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 2600)
  }

  useEffect(() => {
    supabase.auth.getSession().then(res => setSession(res.data.session))
    const sub = supabase.auth.onAuthStateChange((event, s) => {
      // supabase fires this event more than once for the same login sometimes
      // so just skip it if its literally the same user as before
      setSession(prev => {
        if (s && prev && s.user.id === prev.user.id) return prev
        return s
      })
    })
    return () => sub.data.subscription.unsubscribe()
  }, [])

  // grabs everything we need after login, profile, the problem list, and topic elos
  async function loadAll() {
    if (!session || !session.user) return
    setLoadingData(true)
    try {
      const prof = await api.profile()
      const probs = await api.problems()
      let topicRows = []
      try { topicRows = await api.topicElos() } catch (e) {}

      setProfile(prof)
      setProblems(probs.problems)
      setSolvedSet(new Set(probs.solved.map(String)))

      // fill in 1200 for any topic they havent touched yet
      const elos = {}
      for (const t of ALL_TOPICS) elos[t] = 1200
      for (const r of topicRows) elos[r.topic] = r.elo
      setTopicElos(elos)
    } catch (e) {
      toast('Could not connect to server: ' + e.message, 'error')
    }
    setLoadingData(false)
  }

  useEffect(() => {
    if (session && session.user) {
      loadAll()
    } else if (session === null) {
      // logged out, wipe everything so old data doesnt flash for the next user
      setProfile(null)
      setProblems([])
      setSolvedSet(new Set())
      setTopicElos({})
    }
  }, [session])

  async function refreshProblems() {
    const probs = await api.problems()
    setProblems(probs.problems)
    setSolvedSet(new Set(probs.solved.map(String)))
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  const value = {
    session, profile, setProfile, problems, setProblems,
    solvedSet, setSolvedSet, loadingData,
    topicElos, setTopicElos,
    refreshAll: loadAll, refreshProblems, logout, toast
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={'toast ' + t.type}>{t.msg}</div>
        ))}
      </div>
    </AppContext.Provider>
  )
}
