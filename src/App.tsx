import { useEffect, useState } from 'react'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { HomeScreen, type UserMode } from './screens/HomeScreen'
import { ResearcherAuthScreen } from './screens/ResearcherAuthScreen'
import {
  clearRememberedCredentials,
  clearSession,
  getSession,
} from './auth/researcherAuth'
import {
  completeWelcome,
  loadPreferences,
  type Lang,
} from './i18n/preferences'
import './App.css'

type AppView =
  | 'welcome'
  | 'home'
  | 'guest-app'
  | 'researcher-auth'
  | 'researcher-area'

function App() {
  const initial = loadPreferences()
  const existingSession = getSession()
  const [lang, setLang] = useState<Lang>(initial.lang)
  const [view, setView] = useState<AppView>(
    initial.welcomeCompleted ? 'home' : 'welcome',
  )
  const [researcherEmail, setResearcherEmail] = useState(
    existingSession?.email ?? null,
  )

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  if (view === 'welcome') {
    return (
      <WelcomeScreen
        onContinue={(selectedLang) => {
          completeWelcome(selectedLang)
          setLang(selectedLang)
          setView('home')
        }}
      />
    )
  }

  if (view === 'home') {
    return (
      <HomeScreen
        lang={lang}
        onSelectMode={(mode: UserMode) => {
          if (mode === 'guest') {
            setView('guest-app')
            return
          }
          if (researcherEmail) {
            setView('researcher-area')
            return
          }
          setView('researcher-auth')
        }}
      />
    )
  }

  if (view === 'guest-app') {
    return (
      <main className="placeholder">
        <p>Modo invitado</p>
        <p>Aquí irá la app de MediaPipe cuando la integremos.</p>
        <button type="button" onClick={() => setView('home')}>
          Volver al inicio
        </button>
      </main>
    )
  }

  if (view === 'researcher-auth') {
    return (
      <ResearcherAuthScreen
        lang={lang}
        onBack={() => setView('home')}
        onAuthenticated={(email) => {
          setResearcherEmail(email)
          setView('researcher-area')
        }}
      />
    )
  }

  return (
    <main className="placeholder">
      <p>Área de investigador</p>
      <p>{researcherEmail}</p>
      <button type="button" onClick={() => setView('home')}>
        Volver al inicio
      </button>
      <button
        type="button"
        onClick={() => {
          clearSession()
          clearRememberedCredentials()
          setResearcherEmail(null)
          setView('researcher-auth')
        }}
      >
        Cerrar sesión
      </button>
    </main>
  )
}

export default App
