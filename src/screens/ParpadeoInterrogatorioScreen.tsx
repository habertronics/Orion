import { useMemo, useState } from 'react'
import {
  emptyInterrogatorio,
  interrogatorioCopy,
  isInterrogatorioComplete,
  type NonLubeTreatment,
  type ParpadeoInterrogatorioState,
  type SexOption,
  type YesNo,
} from '../i18n/parpadeoInterrogatorio'
import type { Lang } from '../i18n/preferences'
import { captureApproximateLocation } from '../lib/location'
import { fetchEnvironmentSnapshot } from '../lib/environment'
import './ParpadeoInterrogatorioScreen.css'

type StepId =
  | 'age'
  | 'sex'
  | 'diagnosis'
  | 'treatment'
  | 'lubricant'
  | 'osdi6'
  | 'location'

type ParpadeoInterrogatorioScreenProps = {
  lang: Lang
  onBack: () => void
  onNext: (data: ParpadeoInterrogatorioState) => void
}

function stepDone(state: ParpadeoInterrogatorioState, id: StepId): boolean {
  switch (id) {
    case 'age':
      return state.age !== null
    case 'sex':
      return state.sex !== null
    case 'diagnosis':
      return state.dryEyeDiagnosis !== null
    case 'treatment':
      return state.nonLubeTreatment !== null
    case 'lubricant':
      return state.usingLubricant !== null
    case 'osdi6':
      return state.osdi6Done
    case 'location':
      return (
        state.locationAccepted &&
        state.location !== null &&
        state.environment !== null
      )
  }
}

export function ParpadeoInterrogatorioScreen({
  lang,
  onBack,
  onNext,
}: ParpadeoInterrogatorioScreenProps) {
  const t = interrogatorioCopy[lang]
  const [state, setState] = useState<ParpadeoInterrogatorioState>(emptyInterrogatorio)
  const [open, setOpen] = useState<StepId | null>(null)
  const [draftAge, setDraftAge] = useState(45)
  const [locationBusy, setLocationBusy] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  const complete = useMemo(() => isInterrogatorioComplete(state), [state])

  const steps: { id: StepId; label: string }[] = [
    { id: 'age', label: t.steps.age },
    { id: 'sex', label: t.steps.sex },
    { id: 'diagnosis', label: t.steps.diagnosis },
    { id: 'treatment', label: t.steps.treatment },
    { id: 'lubricant', label: t.steps.lubricant },
    { id: 'osdi6', label: t.steps.osdi6 },
    { id: 'location', label: t.steps.location },
  ]

  function openStep(id: StepId) {
    setLocationMessage(null)
    if (id === 'age' && state.age !== null) setDraftAge(state.age)
    setOpen(id)
  }

  async function acceptLocation() {
    setLocationBusy(true)
    setLocationMessage(t.locationCapturing)
    const result = await captureApproximateLocation()

    if (!result.ok) {
      setLocationBusy(false)
      setLocationMessage(
        result.error === 'denied' ? t.locationDenied : t.locationError,
      )
      return
    }

    const environment = await fetchEnvironmentSnapshot(
      result.location.lat,
      result.location.lng,
    )

    setLocationBusy(false)

    if (!environment) {
      setLocationMessage(t.locationWeatherError)
      return
    }

    setState((prev) => ({
      ...prev,
      locationAccepted: true,
      location: result.location,
      environment,
    }))
    setLocationMessage(null)
    setOpen(null)
  }

  return (
    <main className="p-int" aria-labelledby="p-int-brand">
      <div className="p-int__atmosphere" aria-hidden="true" />

      <header className="p-int__header">
        <button type="button" className="p-int__back" onClick={onBack}>
          {t.back}
        </button>
        <h1 id="p-int-brand" className="p-int__brand">
          {t.brand}
        </h1>
        <p className="p-int__subtitle">{t.subtitle}</p>
        <p className="p-int__protocol">{t.protocolName}</p>
        <h2 className="p-int__section">{t.sectionTitle}</h2>
      </header>

      <section className="p-int__steps" aria-label={t.sectionTitle}>
        {steps.map((step) => {
          const done = stepDone(state, step.id)
          return (
            <button
              key={step.id}
              type="button"
              className={`p-int__step${done ? ' is-done' : ' is-pending'}`}
              onClick={() => openStep(step.id)}
            >
              <span>{step.label}</span>
              <span className="p-int__mark" aria-hidden="true">
                {done ? '✓' : '!'}
              </span>
            </button>
          )
        })}
      </section>

      <footer className="p-int__footer">
        {!complete && <p className="p-int__hint">{t.incompleteHint}</p>}
        <button
          type="button"
          className="p-int__next"
          disabled={!complete}
          onClick={() => onNext(state)}
        >
          {t.next}
        </button>
      </footer>

      {open && (
        <div className="p-int__modal" role="dialog" aria-modal="true">
          <div className="p-int__dialog">
            <button
              type="button"
              className="p-int__dialog-close"
              onClick={() => setOpen(null)}
            >
              {t.close}
            </button>

            {open === 'age' && (
              <>
                <h3>{t.steps.age}</h3>
                <p className="p-int__dialog-hint">{t.ageHint}</p>
                <label className="p-int__field">
                  <span>{t.ageLabel}</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={draftAge}
                    onChange={(e) => setDraftAge(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="p-int__confirm"
                  onClick={() => {
                    if (draftAge < 1 || draftAge > 120) return
                    setState((prev) => ({ ...prev, age: draftAge }))
                    setOpen(null)
                  }}
                >
                  ✓ {t.confirm}
                </button>
              </>
            )}

            {open === 'sex' && (
              <>
                <h3>{t.steps.sex}</h3>
                <div className="p-int__options">
                  {(Object.keys(t.sexOptions) as SexOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`p-int__option${
                        state.sex === option ? ' is-selected' : ''
                      }`}
                      onClick={() => {
                        setState((prev) => ({ ...prev, sex: option }))
                        setOpen(null)
                      }}
                    >
                      {t.sexOptions[option]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {open === 'diagnosis' && (
              <>
                <h3>{t.steps.diagnosis}</h3>
                <div className="p-int__options">
                  {(['yes', 'no'] as YesNo[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`p-int__option${
                        state.dryEyeDiagnosis === option ? ' is-selected' : ''
                      }`}
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          dryEyeDiagnosis: option,
                        }))
                        setOpen(null)
                      }}
                    >
                      {option === 'yes' ? t.yes : t.no}
                    </button>
                  ))}
                </div>
              </>
            )}

            {open === 'treatment' && (
              <>
                <h3>{t.steps.treatment}</h3>
                <div className="p-int__options">
                  {(
                    [
                      'ipl',
                      'thermal',
                      'other',
                      'none',
                    ] as NonLubeTreatment[]
                  ).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`p-int__option${
                        state.nonLubeTreatment === option ? ' is-selected' : ''
                      }`}
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          nonLubeTreatment: option,
                        }))
                        setOpen(null)
                      }}
                    >
                      {option === 'none'
                        ? t.treatmentNone
                        : t.treatmentOptions[option]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {open === 'lubricant' && (
              <>
                <h3>{t.steps.lubricant}</h3>
                <div className="p-int__options">
                  {(['yes', 'no'] as YesNo[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`p-int__option${
                        state.usingLubricant === option ? ' is-selected' : ''
                      }`}
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          usingLubricant: option,
                        }))
                        setOpen(null)
                      }}
                    >
                      {option === 'yes' ? t.yes : t.no}
                    </button>
                  ))}
                </div>
              </>
            )}

            {open === 'osdi6' && (
              <>
                <h3>{t.osdi6Title}</h3>
                <p className="p-int__dialog-hint">{t.osdi6Hint}</p>
                <button
                  type="button"
                  className="p-int__confirm"
                  onClick={() => {
                    setState((prev) => ({ ...prev, osdi6Done: true }))
                    setOpen(null)
                  }}
                >
                  ✓ {t.osdi6Done}
                </button>
              </>
            )}

            {open === 'location' && (
              <>
                <h3>{t.locationTitle}</h3>
                <p className="p-int__dialog-hint">{t.locationBody}</p>
                {state.location && state.environment && (
                  <p className="p-int__coords">
                    ≈ {state.location.lat}, {state.location.lng} ·{' '}
                    {state.environment.weather.temperatureC ?? '—'}°C ·{' '}
                    {state.environment.weather.humidityPct ?? '—'}% HR · UV{' '}
                    {state.environment.weather.uvIndex ?? '—'}
                  </p>
                )}
                {locationMessage && (
                  <p className="p-int__msg">{locationMessage}</p>
                )}
                <button
                  type="button"
                  className="p-int__confirm"
                  disabled={locationBusy}
                  onClick={() => void acceptLocation()}
                >
                  ✓ {t.locationAccept}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
