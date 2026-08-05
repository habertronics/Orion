import { useEffect, useState } from 'react'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { HomeScreen, type UserMode } from './screens/HomeScreen'
import { ResearcherAuthScreen } from './screens/ResearcherAuthScreen'
import { ResearcherHelloScreen } from './screens/ResearcherHelloScreen'
import { ResearcherProjectsScreen } from './screens/ResearcherProjectsScreen'
import { ProtocolIntroScreen } from './screens/ProtocolIntroScreen'
import { ParpadeoInterrogatorioScreen } from './screens/ParpadeoInterrogatorioScreen'
import {
  clearRememberedCredentials,
  clearSession,
  getSession,
} from './auth/researcherAuth'
import type { ParpadeoInterrogatorioState } from './i18n/parpadeoInterrogatorio'
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
  | 'researcher-hello'
  | 'researcher-projects'
  | 'protocol-intro'
  | 'protocol-interrogatorio'
  | 'protocol-next'

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
  const [displayName, setDisplayName] = useState(
    existingSession?.displayName ?? '',
  )
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  const [interrogatorio, setInterrogatorio] =
    useState<ParpadeoInterrogatorioState | null>(null)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function logout() {
    clearSession()
    clearRememberedCredentials()
    setResearcherEmail(null)
    setDisplayName('')
    setSelectedProtocol(null)
    setInterrogatorio(null)
    setView('researcher-auth')
  }

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
            setView('researcher-hello')
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
        onAuthenticated={(user) => {
          setResearcherEmail(user.email)
          setDisplayName(user.displayName)
          setView('researcher-hello')
        }}
      />
    )
  }

  if (view === 'researcher-hello') {
    return (
      <ResearcherHelloScreen
        lang={lang}
        displayName={displayName || researcherEmail || ''}
        onContinue={() => setView('researcher-projects')}
        onHome={() => setView('home')}
        onLogout={logout}
      />
    )
  }

  if (view === 'researcher-projects') {
    return (
      <ResearcherProjectsScreen
        lang={lang}
        onSelectProject={(slug) => {
          setSelectedProtocol(slug)
          if (slug === 'parpadeo') {
            setView('protocol-intro')
            return
          }
          setView('protocol-next')
        }}
        onBack={() => setView('researcher-hello')}
        onLogout={logout}
      />
    )
  }

  if (view === 'protocol-intro' && selectedProtocol === 'parpadeo') {
    return (
      <ProtocolIntroScreen
        lang={lang}
        onBack={() => setView('researcher-projects')}
        onNext={() => setView('protocol-interrogatorio')}
      />
    )
  }

  if (view === 'protocol-interrogatorio' && selectedProtocol === 'parpadeo') {
    return (
      <ParpadeoInterrogatorioScreen
        lang={lang}
        onBack={() => setView('protocol-intro')}
        onNext={(data) => {
          setInterrogatorio(data)
          setView('protocol-next')
        }}
      />
    )
  }

  return (
    <main className="placeholder">
      <p>Protocolo: {selectedProtocol}</p>
      <p>
        Interrogatorio listo
        {interrogatorio?.age != null ? ` · edad ${interrogatorio.age}` : ''}.
      </p>
      <p>Próximo: ID anónimo del paciente y medición MediaPipe.</p>
      <button
        type="button"
        onClick={() =>
          setView(
            selectedProtocol === 'parpadeo'
              ? 'protocol-interrogatorio'
              : 'researcher-projects',
          )
        }
      >
        Volver
      </button>
      <button type="button" onClick={logout}>
        Cerrar sesión
      </button>
    </main>
  )
}

export default App
