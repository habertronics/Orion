import { useMemo, useState, type FormEvent } from 'react'
import {
  getRememberedCredentials,
  loginResearcher,
  registerResearcher,
  suggestPassword,
} from '../auth/researcherAuth'
import { researcherCopy } from '../i18n/researcher'
import type { Lang } from '../i18n/preferences'
import './ResearcherAuthScreen.css'

type AuthView = 'choose' | 'register' | 'login'

type ResearcherAuthScreenProps = {
  lang: Lang
  onAuthenticated: (user: {
    email: string
    nickname: string | null
    displayName: string
  }) => void
  onBack: () => void
}

export function ResearcherAuthScreen({
  lang,
  onAuthenticated,
  onBack,
}: ResearcherAuthScreenProps) {
  const t = researcherCopy[lang]
  const remembered = useMemo(() => getRememberedCredentials(), [])
  const [view, setView] = useState<AuthView>('choose')
  const [email, setEmail] = useState(remembered?.email ?? '')
  const [suggested, setSuggested] = useState(() => suggestPassword())
  const [useOwnPassword, setUseOwnPassword] = useState(false)
  const [ownPassword, setOwnPassword] = useState('')
  const [useNickname, setUseNickname] = useState(false)
  const [nickname, setNickname] = useState('')
  const [loginPassword, setLoginPassword] = useState(remembered?.password ?? '')
  const [remember, setRemember] = useState(Boolean(remembered))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function resetMessages() {
    setError(null)
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault()
    const password = useOwnPassword ? ownPassword : suggested
    setBusy(true)
    setError(null)
    const result = await registerResearcher({
      email,
      password,
      remember,
      useNickname,
      nickname,
    })
    setBusy(false)
    if (!result.ok) {
      setError(t.errors[result.error])
      return
    }
    onAuthenticated({
      email: result.email,
      nickname: result.nickname,
      displayName: result.displayName,
    })
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = await loginResearcher({
      email,
      password: loginPassword,
      remember,
    })
    setBusy(false)
    if (!result.ok) {
      setError(t.errors[result.error])
      return
    }
    onAuthenticated({
      email: result.email,
      nickname: result.nickname,
      displayName: result.displayName,
    })
  }

  return (
    <main className="r-auth" aria-labelledby="r-auth-brand">
      <div className="r-auth__atmosphere" aria-hidden="true" />

      <header className="r-auth__header">
        <button type="button" className="r-auth__back" onClick={onBack}>
          {t.back}
        </button>
        <h1 id="r-auth-brand" className="r-auth__brand">
          {t.brand}
        </h1>
        <p className="r-auth__subtitle">{t.subtitle}</p>
      </header>

      {view === 'choose' && (
        <section className="r-auth__actions">
          <button
            type="button"
            className="r-auth__choice r-auth__choice--login"
            onClick={() => {
              resetMessages()
              setView('login')
            }}
          >
            {t.login}
          </button>
          <button
            type="button"
            className="r-auth__choice r-auth__choice--register"
            onClick={() => {
              resetMessages()
              setSuggested(suggestPassword())
              setView('register')
            }}
          >
            {t.register}
          </button>
        </section>
      )}

      {view === 'register' && (
        <form className="r-auth__form" onSubmit={handleRegister}>
          <label className="r-auth__field">
            <span>{t.email}</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="r-auth__check">
            <input
              type="checkbox"
              checked={useNickname}
              onChange={(e) => setUseNickname(e.target.checked)}
            />
            <span>{t.useNickname}</span>
          </label>

          {useNickname && (
            <label className="r-auth__field">
              <span>{t.nickname}</span>
              <input
                type="text"
                autoComplete="nickname"
                placeholder={t.nicknamePlaceholder}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </label>
          )}

          {!useOwnPassword && (
            <div className="r-auth__suggested">
              <span className="r-auth__label">{t.suggestedPassword}</span>
              <strong className="r-auth__code">{suggested}</strong>
              <button
                type="button"
                className="r-auth__refresh"
                onClick={() => setSuggested(suggestPassword())}
              >
                {lang === 'en' ? 'New' : lang === 'pt' ? 'Nova' : 'Otra'}
              </button>
            </div>
          )}

          <label className="r-auth__check">
            <input
              type="checkbox"
              checked={useOwnPassword}
              onChange={(e) => setUseOwnPassword(e.target.checked)}
            />
            <span>{t.useOwnPassword}</span>
          </label>

          {useOwnPassword && (
            <label className="r-auth__field">
              <span>{t.ownPassword}</span>
              <input
                type="text"
                autoComplete="new-password"
                placeholder={t.ownPasswordPlaceholder}
                value={ownPassword}
                onChange={(e) => setOwnPassword(e.target.value)}
                required
              />
            </label>
          )}

          <label className="r-auth__check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>{t.remember}</span>
          </label>

          {error && <p className="r-auth__error">{error}</p>}

          <button type="submit" className="r-auth__submit" disabled={busy}>
            {t.submitRegister}
          </button>

          <button
            type="button"
            className="r-auth__link"
            onClick={() => {
              resetMessages()
              setView('choose')
            }}
          >
            {t.back}
          </button>
        </form>
      )}

      {view === 'login' && (
        <form className="r-auth__form" onSubmit={handleLogin}>
          <label className="r-auth__field">
            <span>{t.email}</span>
            <input
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="r-auth__field">
            <span>{t.password}</span>
            <input
              type="text"
              autoComplete="current-password"
              placeholder={t.passwordPlaceholder}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </label>

          <label className="r-auth__check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>{t.remember}</span>
          </label>

          {error && <p className="r-auth__error">{error}</p>}

          <button type="submit" className="r-auth__submit" disabled={busy}>
            {t.submitLogin}
          </button>

          <button
            type="button"
            className="r-auth__link"
            onClick={() => {
              resetMessages()
              setView('choose')
            }}
          >
            {t.back}
          </button>
        </form>
      )}
    </main>
  )
}
