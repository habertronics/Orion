import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  getRememberedCredentials,
  loginResearcher,
  registerResearcher,
  suggestPassword,
  type ResearcherLocationPayload,
} from '../auth/researcherAuth'
import { researcherCopy } from '../i18n/researcher'
import type { Lang } from '../i18n/preferences'
import {
  searchPlaces,
  type PlaceSuggestion,
} from '../lib/environment'
import { captureApproximateLocation } from '../lib/location'
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
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(remembered?.email ?? '')
  const [suggested, setSuggested] = useState(() => suggestPassword())
  const [useOwnPassword, setUseOwnPassword] = useState(false)
  const [ownPassword, setOwnPassword] = useState('')
  const [useNickname, setUseNickname] = useState(false)
  const [nickname, setNickname] = useState('')
  const [loginPassword, setLoginPassword] = useState(remembered?.password ?? '')
  const [remember, setRemember] = useState(Boolean(remembered))
  const [locationDeclined, setLocationDeclined] = useState(false)
  const [location, setLocation] = useState<ResearcherLocationPayload | null>(
    null,
  )
  const [cityQuery, setCityQuery] = useState('')
  const [places, setPlaces] = useState<PlaceSuggestion[]>([])
  const [searchBusy, setSearchBusy] = useState(false)
  const [locationBusy, setLocationBusy] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function resetMessages() {
    setError(null)
    setLocationMessage(null)
  }

  useEffect(() => {
    if (view !== 'register' || locationDeclined) {
      setPlaces([])
      setSearchBusy(false)
      return
    }

    const q = cityQuery.trim()
    if (q.length < 2) {
      setPlaces([])
      setSearchBusy(false)
      return
    }

    let cancelled = false
    setSearchBusy(true)
    const timer = window.setTimeout(() => {
      void searchPlaces(q, lang).then((results) => {
        if (cancelled) return
        setPlaces(results)
        setSearchBusy(false)
      })
    }, 280)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [cityQuery, lang, locationDeclined, view])

  function declineLocation(checked: boolean) {
    setLocationDeclined(checked)
    setLocationMessage(null)
    if (checked) {
      setLocation(null)
      setCityQuery('')
      setPlaces([])
    }
  }

  async function captureGps() {
    setLocationDeclined(false)
    setLocationBusy(true)
    setLocationMessage(t.cityGpsCapturing)
    const result = await captureApproximateLocation()
    setLocationBusy(false)

    if (!result.ok) {
      setLocation(null)
      setLocationMessage(
        result.error === 'denied'
          ? t.errors.location_denied
          : t.errors.location_error,
      )
      return
    }

    setLocation({
      source: 'device',
      lat: result.location.lat,
      lng: result.location.lng,
      accuracy: result.location.accuracy,
      capturedAt: result.location.capturedAt,
    })
    setCityQuery('')
    setPlaces([])
    setLocationMessage(null)
  }

  function selectPlace(place: PlaceSuggestion) {
    setLocationDeclined(false)
    setCityQuery(place.label)
    setPlaces([])
    setLocation({
      source: 'geocoded',
      lat: Number(place.latitude.toFixed(3)),
      lng: Number(place.longitude.toFixed(3)),
      accuracy: 5000,
      capturedAt: new Date().toISOString(),
      label: place.label,
      placeId: place.id,
    })
    setLocationMessage(null)
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault()
    const password = useOwnPassword ? ownPassword : suggested
    const ageNumber = Number(age)

    if (!locationDeclined && !location) {
      setError(t.errors.missing_location)
      return
    }

    setBusy(true)
    setError(null)
    const result = await registerResearcher({
      email,
      password,
      remember,
      useNickname,
      nickname,
      fullName,
      age: ageNumber,
      phone,
      locationDeclined,
      location: locationDeclined ? null : location,
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

  const locationReady = locationDeclined || Boolean(location)
  const canSubmitRegister = !busy && !locationBusy && locationReady

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
        <form className="r-auth__form" onSubmit={(e) => void handleRegister(e)}>
          <label className="r-auth__field">
            <span>{t.fullName}</span>
            <input
              type="text"
              autoComplete="name"
              placeholder={t.fullNamePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

          <div className="r-auth__row">
            <label className="r-auth__field">
              <span>{t.age}</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                placeholder={t.agePlaceholder}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </label>
            <label className="r-auth__field">
              <span>{t.phone}</span>
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
          </div>

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

          <section className="r-auth__city" aria-labelledby="r-auth-city-title">
            <h2 id="r-auth-city-title" className="r-auth__city-title">
              {t.citySection}
            </h2>
            <p className="r-auth__city-hint">{t.cityHint}</p>

            <button
              type="button"
              className="r-auth__gps"
              disabled={locationDeclined || locationBusy}
              onClick={() => void captureGps()}
            >
              {locationBusy ? t.cityGpsCapturing : t.cityGpsButton}
            </button>

            {location?.source === 'device' && (
              <p className="r-auth__city-ok">
                {t.cityGpsSelected}: ≈ {location.lat}, {location.lng}
                {location.accuracy ? ` · ±${location.accuracy} m` : ''}
              </p>
            )}

            <label className="r-auth__field">
              <span>{t.cityLabel}</span>
              <input
                type="search"
                autoComplete="off"
                placeholder={t.cityPlaceholder}
                value={cityQuery}
                disabled={locationDeclined || locationBusy}
                onChange={(e) => {
                  setLocationDeclined(false)
                  setCityQuery(e.target.value)
                  if (location?.source === 'geocoded') setLocation(null)
                }}
              />
            </label>

            {cityQuery.trim().length > 0 && cityQuery.trim().length < 2 && (
              <p className="r-auth__city-hint">{t.cityEmpty}</p>
            )}
            {searchBusy && (
              <p className="r-auth__city-hint">{t.citySearching}</p>
            )}

            {places.length > 0 && !locationDeclined && (
              <ul className="r-auth__suggestions" role="listbox">
                {places.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      className="r-auth__suggestion"
                      disabled={locationBusy}
                      onClick={() => selectPlace(place)}
                    >
                      {place.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {location?.source === 'geocoded' && location.label && (
              <p className="r-auth__city-ok">
                {t.citySelected}: {location.label}
              </p>
            )}

            {locationMessage && (
              <p className="r-auth__error">{locationMessage}</p>
            )}

            <label className="r-auth__check">
              <input
                type="checkbox"
                checked={locationDeclined}
                onChange={(e) => declineLocation(e.target.checked)}
              />
              <span>{t.declineLocation}</span>
            </label>
          </section>

          <label className="r-auth__check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>{t.remember}</span>
          </label>

          {error && <p className="r-auth__error">{error}</p>}

          <button
            type="submit"
            className="r-auth__submit"
            disabled={!canSubmitRegister}
          >
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
        <form className="r-auth__form" onSubmit={(e) => void handleLogin(e)}>
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
