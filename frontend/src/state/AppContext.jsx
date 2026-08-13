import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export const ALL_TOPICS = ['Number Theory', 'Algebra', 'Combinatorics', 'Geometry', 'Probability', 'Sequences']

let toastCounter = 0

export function AppProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [problems, setProblems] = useState([])
  const [solvedSet, setSolvedSet] = useState(new Set())
  const [canUpload, setCanUpload] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [topicElos, setTopicElos] = useState({})
  const [toasts, setToasts] = useState([])

  const solutionViewed = useRef(new Set())

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
      setSession(prev => {
        if (s && prev && s.user.id === prev.user.id) return prev
        return s
      })
    })
    return () => sub.data.subscription.unsubscribe()
  }, [])

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

      const elos = {}
      for (const t of ALL_TOPICS) elos[t] = 1200
      for (const r of topicRows) elos[r.topic] = r.elo
      setTopicElos(elos)

      let upload = !!(prof.can_upload || prof.is_admin)
      if (!upload) {
        try {
          const s = await api.openUploads()
          upload = s.open_uploads
        } catch (e) {}
      }
      setCanUpload(upload)
    } catch (e) {
      toast('Could not connect to server: ' + e.message, 'error')
    }
    setLoadingData(false)
  }

  useEffect(() => {
    if (session && session.user) {
      loadAll()
    } else if (session === null) {
      setProfile(null)
      setProblems([])
      setSolvedSet(new Set())
      setTopicElos({})
      solutionViewed.current = new Set()
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
    solvedSet, setSolvedSet, canUpload, loadingData,
    topicElos, setTopicElos,
    refreshAll: loadAll, refreshProblems, logout, toast,
    markSolutionViewed: (id) => solutionViewed.current.add(String(id)),
    wasSolutionViewed: (id) => solutionViewed.current.has(String(id))
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
