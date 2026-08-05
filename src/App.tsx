import { useEffect, useState } from 'react'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { HomeScreen, type UserMode } from './screens/HomeScreen'
import { ResearcherAuthScreen } from './screens/ResearcherAuthScreen'
import { ResearcherHelloScreen } from './screens/ResearcherHelloScreen'
import { ResearcherProjectsScreen } from './screens/ResearcherProjectsScreen'
import { ProtocolIntroScreen } from './screens/ProtocolIntroScreen'
import { ParpadeoInterrogatorioScreen } from './screens/ParpadeoInterrogatorioScreen'
import { ParpadeoSummaryScreen } from './screens/ParpadeoSummaryScreen'
import { ParpadeoExploracionFisicaScreen } from './screens/ParpadeoExploracionFisicaScreen'
import { ParpadeometroScreen } from './screens/ParpadeometroScreen'
import { ParpadeoExamSummaryScreen } from './screens/ParpadeoExamSummaryScreen'
import {
  clearRememberedCredentials,
  clearSession,
  getSession,
} from './auth/researcherAuth'
import type { ParpadeoInterrogatorioState } from './i18n/parpadeoInterrogatorio'
import type { ParpadeoExamState } from './i18n/parpadeoExam'
import {
  saveParpadeoComplete,
  saveParpadeoInterrogatorio,
} from './lib/parpadeoApi'
import type { MeterResult } from './lib/parpadeoMeter'
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
  | 'protocol-summary'
  | 'protocol-exam'
  | 'protocol-parpadeometro'
  | 'protocol-exam-summary'
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
  const [interrogatorioSaved, setInterrogatorioSaved] = useState(false)
  const [exam, setExam] = useState<ParpadeoExamState | null>(null)
  const [meter, setMeter] = useState<MeterResult | null>(null)
  const [saving, setSaving] = useState(false)

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
    setInterrogatorioSaved(false)
    setExam(null)
    setMeter(null)
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
          setSaving(true)
          void saveParpadeoInterrogatorio(data).then((saved) => {
            setInterrogatorioSaved(Boolean(saved))
            setSaving(false)
            setView('protocol-summary')
          })
        }}
      />
    )
  }

  if (view === 'protocol-summary' && interrogatorio) {
    return (
      <ParpadeoSummaryScreen
        lang={lang}
        data={interrogatorio}
        saved={interrogatorioSaved}
        onBack={() => setView('protocol-interrogatorio')}
        onContinue={() => setView('protocol-exam')}
      />
    )
  }

  if (view === 'protocol-exam' && selectedProtocol === 'parpadeo') {
    return (
      <ParpadeoExploracionFisicaScreen
        lang={lang}
        onBack={() => setView('protocol-summary')}
        onNext={(data) => {
          setExam(data)
          setView('protocol-parpadeometro')
        }}
      />
    )
  }

  if (view === 'protocol-parpadeometro' && selectedProtocol === 'parpadeo') {
    return (
      <ParpadeometroScreen
        lang={lang}
        onBack={() => setView('protocol-exam')}
        onNext={(result) => {
          setMeter(result)
          setView('protocol-exam-summary')
        }}
      />
    )
  }

  if (view === 'protocol-exam-summary' && selectedProtocol === 'parpadeo') {
    return (
      <ParpadeoExamSummaryScreen
        lang={lang}
        exam={exam}
        meter={meter}
        canUpload={Boolean(researcherEmail && interrogatorio)}
        onBack={() => setView('protocol-parpadeometro')}
        onUpload={async () => {
          if (!interrogatorio) return false
          const saved = await saveParpadeoComplete({
            interrogatorio,
            exam,
            meter,
          })
          return Boolean(saved)
        }}
      />
    )
  }

  return (
    <main className="placeholder">
      <p>Protocolo: {selectedProtocol}</p>
      <p>
        {saving
          ? 'Guardando…'
          : exam
            ? 'Exploración física completada. Próximo: ID anónimo y medición MediaPipe.'
            : 'Próximo: ID anónimo y medición MediaPipe.'}
      </p>
      <button
        type="button"
        onClick={() =>
          setView(
            selectedProtocol === 'parpadeo'
              ? 'protocol-exam'
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
