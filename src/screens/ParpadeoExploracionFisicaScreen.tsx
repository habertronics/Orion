import { useMemo, useState } from 'react'
import {
  emptyExamState,
  examCopy,
  EXAM_STEPS,
  isExamComplete,
  isExamStepDone,
  type ExamStepId,
  type ParpadeoExamState,
} from '../i18n/parpadeoExam'
import type { Lang } from '../i18n/preferences'
import './ParpadeoExploracionFisicaScreen.css'

type ParpadeoExploracionFisicaScreenProps = {
  lang: Lang
  onBack: () => void
  onNext: (data: ParpadeoExamState) => void
}

function parseSec(raw: string): number | null {
  const n = Number(raw.replace(',', '.'))
  if (!Number.isFinite(n) || n < 0 || n > 60) return null
  return Math.round(n * 10) / 10
}

export function ParpadeoExploracionFisicaScreen({
  lang,
  onBack,
  onNext,
}: ParpadeoExploracionFisicaScreenProps) {
  const t = examCopy[lang]
  const [state, setState] = useState<ParpadeoExamState>(emptyExamState)
  const [open, setOpen] = useState<ExamStepId | null>(null)
  const [draftOd, setDraftOd] = useState('10')
  const [draftOs, setDraftOs] = useState('10')
  const [tbutError, setTbutError] = useState<string | null>(null)

  const complete = useMemo(() => isExamComplete(state), [state])

  function openStep(id: ExamStepId) {
    setTbutError(null)
    if (id === 'tbut') {
      setDraftOd(state.tbut ? String(state.tbut.odSec) : '10')
      setDraftOs(state.tbut ? String(state.tbut.osSec) : '10')
    }
    setOpen(id)
  }

  function saveTbut() {
    const odSec = parseSec(draftOd)
    const osSec = parseSec(draftOs)
    if (odSec === null || osSec === null) {
      setTbutError(t.tbutInvalid)
      return
    }
    setState((prev) => ({
      ...prev,
      tbut: { odSec, osSec },
    }))
    setTbutError(null)
    setOpen(null)
  }

  return (
    <main className="p-exam" aria-labelledby="p-exam-brand">
      <div className="p-exam__atmosphere" aria-hidden="true" />

      <header className="p-exam__header">
        <button type="button" className="p-exam__back" onClick={onBack}>
          {t.back}
        </button>
        <h1 id="p-exam-brand" className="p-exam__brand">
          {t.brand}
        </h1>
        <p className="p-exam__subtitle">{t.subtitle}</p>
        <p className="p-exam__protocol">{t.protocolName}</p>
        <h2 className="p-exam__section">{t.sectionTitle}</h2>
      </header>

      <section className="p-exam__steps" aria-label={t.sectionTitle}>
        {EXAM_STEPS.map((id) => {
          const done = isExamStepDone(state, id)
          return (
            <button
              key={id}
              type="button"
              className={`p-exam__step${done ? ' is-done' : ' is-pending'}`}
              onClick={() => openStep(id)}
            >
              <span className="p-exam__step-label">
                <span>{t.steps[id]}</span>
                {id === 'tbut' && state.tbut && (
                  <span className="p-exam__step-meta">
                    OD {state.tbut.odSec}s · OS {state.tbut.osSec}s
                  </span>
                )}
              </span>
              <span className="p-exam__mark" aria-hidden="true">
                {done ? '✓' : '!'}
              </span>
            </button>
          )
        })}
      </section>

      <footer className="p-exam__footer">
        {!complete && <p className="p-exam__hint">{t.incompleteHint}</p>}
        <button
          type="button"
          className="p-exam__next"
          disabled={!complete}
          onClick={() => onNext(state)}
        >
          {t.next}
        </button>
      </footer>

      {open && (
        <div className="p-exam__modal" role="dialog" aria-modal="true">
          <div className="p-exam__dialog">
            <button
              type="button"
              className="p-exam__dialog-close"
              onClick={() => setOpen(null)}
            >
              {t.close}
            </button>
            <h3>{t.steps[open]}</h3>

            {open === 'tbut' ? (
              <>
                <p className="p-exam__dialog-hint">{t.tbutHint}</p>
                <label className="p-exam__field">
                  <span>
                    {t.tbutOd} ({t.tbutUnit})
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={60}
                    step={0.1}
                    value={draftOd}
                    onChange={(e) => setDraftOd(e.target.value)}
                  />
                </label>
                <label className="p-exam__field">
                  <span>
                    {t.tbutOs} ({t.tbutUnit})
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={60}
                    step={0.1}
                    value={draftOs}
                    onChange={(e) => setDraftOs(e.target.value)}
                  />
                </label>
                {tbutError && <p className="p-exam__error">{tbutError}</p>}
                <button
                  type="button"
                  className="p-exam__confirm"
                  onClick={saveTbut}
                >
                  ✓ {t.confirm}
                </button>
              </>
            ) : (
              <>
                <p className="p-exam__dialog-hint">{t.stubHint}</p>
                <button
                  type="button"
                  className="p-exam__confirm"
                  onClick={() => {
                    setState((prev) => ({ ...prev, [open]: true }))
                    setOpen(null)
                  }}
                >
                  ✓ {t.confirmStub}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
