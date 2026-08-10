import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  getRememberedCredentials,
  loginResearcher,
  registerResearcher,
  suggestPassword,
  type ResearcherLocationPayload,
} from '../auth/researcherAuth'
import { researcherCopy } from '../i18n/researcher'
import {
  SPECIALTY_IDS,
  specialtyCopy,
  type OphthalmologyProfile,
  type SpecialtyId,
} from '../i18n/ophthalmologyProfile'
import type { Lang } from '../i18n/preferences'
import {
  placeFromSuggestion,
  reverseGeocodePlace,
  searchPlaces,
  type PlaceSuggestion,
} from '../lib/environment'
import { captureApproximateLocation } from '../lib/location'
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  buildInternationalPhone,
  filterPhoneCountries,
  findPhoneCountry,
} from '../lib/phoneCountries'
import './ResearcherAuthScreen.css'

type AuthView = 'register' | 'login'

type ResearcherAuthScreenProps = {
  lang: Lang
  initialView: AuthView
  onAuthenticated: (user: {
    email: string
    nickname: string | null
    displayName: string
  }) => void
  onBack: () => void
}

export function ResearcherAuthScreen({
  lang,
  initialView,
  onAuthenticated,
  onBack,
}: ResearcherAuthScreenProps) {
  const t = researcherCopy[lang]
  const ophthT = specialtyCopy[lang]
  const remembered = useMemo(() => getRememberedCredentials(), [])
  const view = initialView
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | null>(null)
  const [phoneCountryIso, setPhoneCountryIso] = useState(DEFAULT_PHONE_COUNTRY_ISO)
  const [phoneLocal, setPhoneLocal] = useState('')
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false)
  const [phoneCountryQuery, setPhoneCountryQuery] = useState('')
  const phoneCountryRef = useRef<HTMLDivElement | null>(null)
  const [email, setEmail] = useState(remembered?.email ?? '')
  const [ophthalmologyProfile, setOphthalmologyProfile] =
    useState<OphthalmologyProfile | null>(null)
  const [specialtySlug, setSpecialtySlug] = useState<SpecialtyId | null>(null)
  const [specialtyOther, setSpecialtyOther] = useState('')
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
  const [honeypot, setHoneypot] = useState('')
  const formStartedAt = useMemo(() => Date.now(), [])

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

  useEffect(() => {
    if (!phoneCountryOpen) return
    function onPointerDown(event: MouseEvent) {
      if (!phoneCountryRef.current?.contains(event.target as Node)) {
        setPhoneCountryOpen(false)
        setPhoneCountryQuery('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [phoneCountryOpen])

  const phoneCountry = findPhoneCountry(phoneCountryIso)
  const phoneCountryOptions = useMemo(
    () => filterPhoneCountries(phoneCountryQuery, lang),
    [phoneCountryQuery, lang],
  )

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

    if (!result.ok) {
      setLocationBusy(false)
      setLocation(null)
      setLocationMessage(
        result.error === 'denied'
          ? t.errors.location_denied
          : t.errors.location_error,
      )
      return
    }

    const place = await reverseGeocodePlace(
      result.location.lat,
      result.location.lng,
      lang,
    )
    setLocationBusy(false)

    setLocation({
      source: 'device',
      lat: result.location.lat,
      lng: result.location.lng,
      accuracy: result.location.accuracy,
      capturedAt: result.location.capturedAt,
      country: place?.country ?? null,
      state: place?.state ?? null,
      locality: place?.locality ?? null,
      countryCode: place?.countryCode ?? null,
      label: place?.label ?? undefined,
    })
    setCityQuery('')
    setPlaces([])
    setLocationMessage(null)
  }

  function selectPlace(place: PlaceSuggestion) {
    setLocationDeclined(false)
    setCityQuery(place.label)
    setPlaces([])
    const resolved = placeFromSuggestion(place)
    setLocation({
      source: 'geocoded',
      lat: Number(place.latitude.toFixed(3)),
      lng: Number(place.longitude.toFixed(3)),
      accuracy: 5000,
      capturedAt: new Date().toISOString(),
      label: resolved.label ?? place.label,
      placeId: place.id,
      country: resolved.country,
      state: resolved.state,
      locality: resolved.locality,
    })
    setLocationMessage(null)
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault()
    const password = useOwnPassword ? ownPassword : suggested
    const ageNumber = Number(age)
    const phone = buildInternationalPhone(phoneCountry.dial, phoneLocal)

    if (!ophthalmologyProfile) {
      setError(t.errors.missing_ophthalmology_profile)
      return
    }
    if (!sex) {
      setError(t.errors.missing_sex)
      return
    }
    if (!phone) {
      setError(t.errors.invalid_phone)
      return
    }
    if (ophthalmologyProfile === 'specialty' && !specialtySlug) {
      setError(t.errors.missing_specialty)
      return
    }
    if (
      ophthalmologyProfile === 'specialty' &&
      specialtySlug === 'other' &&
      !specialtyOther.trim()
    ) {
      setError(t.errors.missing_specialty_other)
      return
    }
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
      sex,
      phone,
      locationDeclined,
      location: locationDeclined ? null : location,
      ophthalmologyProfile,
      specialtySlug:
        ophthalmologyProfile === 'specialty' ? specialtySlug : null,
      specialtyOther:
        ophthalmologyProfile === 'specialty' && specialtySlug === 'other'
          ? specialtyOther.trim()
          : null,
      website: honeypot,
      formStartedAt,
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
  const specialtyReady =
    ophthalmologyProfile === 'general' ||
    (ophthalmologyProfile === 'specialty' &&
      Boolean(specialtySlug) &&
      (specialtySlug !== 'other' || Boolean(specialtyOther.trim())))
  const canSubmitRegister =
    !busy && !locationBusy && locationReady && specialtyReady && Boolean(sex)

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

      {view === 'register' && (
        <form className="r-auth__form" onSubmit={(e) => void handleRegister(e)}>
          <label className="r-auth__hp" aria-hidden="true">
            <span>Website</span>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>

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
            <fieldset className="r-auth__field r-auth__sex">
              <legend>{t.sex}</legend>
              <div className="r-auth__sex-options" role="radiogroup" aria-label={t.sex}>
                <label className="r-auth__check">
                  <input
                    type="radio"
                    name="researcher-sex"
                    checked={sex === 'male'}
                    onChange={() => setSex('male')}
                    required
                  />
                  <span>{t.sexMale}</span>
                </label>
                <label className="r-auth__check">
                  <input
                    type="radio"
                    name="researcher-sex"
                    checked={sex === 'female'}
                    onChange={() => setSex('female')}
                  />
                  <span>{t.sexFemale}</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div className="r-auth__field">
            <span>{t.phone}</span>
            <div className="r-auth__phone">
              <div className="r-auth__phone-country" ref={phoneCountryRef}>
                <button
                  type="button"
                  className="r-auth__phone-code"
                  aria-label={t.phoneCountry}
                  aria-expanded={phoneCountryOpen}
                  onClick={() => {
                    setPhoneCountryOpen((open) => !open)
                    setPhoneCountryQuery('')
                  }}
                >
                  <span className="r-auth__phone-flag">{phoneCountry.flag}</span>
                  <span>+{phoneCountry.dial}</span>
                  <span className="r-auth__phone-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>
                {phoneCountryOpen && (
                  <div className="r-auth__phone-menu" role="listbox">
                    <input
                      type="search"
                      className="r-auth__phone-search"
                      autoComplete="off"
                      placeholder={t.phoneCountrySearch}
                      value={phoneCountryQuery}
                      onChange={(e) => setPhoneCountryQuery(e.target.value)}
                      autoFocus
                    />
                    <ul className="r-auth__phone-list">
                      {phoneCountryOptions.map((country) => (
                        <li key={`${country.iso}-${country.dial}`}>
                          <button
                            type="button"
                            className={
                              country.iso === phoneCountryIso
                                ? 'r-auth__phone-option is-selected'
                                : 'r-auth__phone-option'
                            }
                            role="option"
                            aria-selected={country.iso === phoneCountryIso}
                            onClick={() => {
                              setPhoneCountryIso(country.iso)
                              setPhoneCountryOpen(false)
                              setPhoneCountryQuery('')
                            }}
                          >
                            <span>{country.flag}</span>
                            <span className="r-auth__phone-option-name">
                              {country.names[lang]}
                            </span>
                            <span className="r-auth__phone-option-dial">
                              +{country.dial}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <input
                type="tel"
                className="r-auth__phone-local"
                autoComplete="tel-national"
                inputMode="tel"
                placeholder={t.phoneLocalPlaceholder}
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value)}
                required
              />
            </div>
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

          <section
            className="r-auth__ophth"
            aria-labelledby="r-auth-ophth-title"
          >
            <h2 id="r-auth-ophth-title" className="r-auth__city-title">
              {ophthT.sectionTitle}
            </h2>

            <label className="r-auth__check">
              <input
                type="radio"
                name="ophthalmology-profile"
                checked={ophthalmologyProfile === 'general'}
                onChange={() => {
                  setOphthalmologyProfile('general')
                  setSpecialtySlug(null)
                  setSpecialtyOther('')
                }}
              />
              <span>{ophthT.general}</span>
            </label>

            <label className="r-auth__check">
              <input
                type="radio"
                name="ophthalmology-profile"
                checked={ophthalmologyProfile === 'specialty'}
                onChange={() => setOphthalmologyProfile('specialty')}
              />
              <span>{ophthT.specialty}</span>
            </label>

            {ophthalmologyProfile === 'specialty' && (
              <div className="r-auth__specialty">
                <p className="r-auth__city-hint">{ophthT.chooseSpecialty}</p>
                <div
                  className="r-auth__specialty-grid"
                  role="radiogroup"
                  aria-label={ophthT.chooseSpecialty}
                >
                  {SPECIALTY_IDS.map((id) => (
                    <label
                      key={id}
                      className={
                        specialtySlug === id
                          ? 'r-auth__specialty-option r-auth__specialty-option--on'
                          : 'r-auth__specialty-option'
                      }
                    >
                      <input
                        type="radio"
                        name="specialty-slug"
                        checked={specialtySlug === id}
                        onChange={() => {
                          setSpecialtySlug(id)
                          if (id !== 'other') setSpecialtyOther('')
                        }}
                      />
                      <span>{ophthT.items[id]}</span>
                    </label>
                  ))}
                </div>
                {specialtySlug === 'other' && (
                  <label className="r-auth__field">
                    <span>{ophthT.items.other}</span>
                    <input
                      type="text"
                      placeholder={ophthT.otherPlaceholder}
                      value={specialtyOther}
                      onChange={(e) => setSpecialtyOther(e.target.value)}
                      required
                    />
                  </label>
                )}
              </div>
            )}
          </section>

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
              <div className="r-auth__place-grid">
                <p className="r-auth__city-ok">{t.cityGpsSelected}</p>
                <p className="r-auth__place-row">
                  <span>{t.placeCountry}</span>
                  <strong>{location.country || '—'}</strong>
                </p>
                <p className="r-auth__place-row">
                  <span>{t.placeState}</span>
                  <strong>{location.state || '—'}</strong>
                </p>
                <p className="r-auth__place-row">
                  <span>{t.placeLocality}</span>
                  <strong>{location.locality || '—'}</strong>
                </p>
                <p className="r-auth__city-hint">
                  ≈ {location.lat}, {location.lng}
                  {location.accuracy ? ` · ±${location.accuracy} m` : ''}
                </p>
              </div>
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
              <div className="r-auth__place-grid">
                <p className="r-auth__city-ok">
                  {t.citySelected}: {location.label}
                </p>
                <p className="r-auth__place-row">
                  <span>{t.placeCountry}</span>
                  <strong>{location.country || '—'}</strong>
                </p>
                <p className="r-auth__place-row">
                  <span>{t.placeState}</span>
                  <strong>{location.state || '—'}</strong>
                </p>
                <p className="r-auth__place-row">
                  <span>{t.placeLocality}</span>
                  <strong>{location.locality || '—'}</strong>
                </p>
              </div>
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
              onBack()
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
              onBack()
            }}
          >
            {t.back}
          </button>
        </form>
      )}
    </main>
  )
}
