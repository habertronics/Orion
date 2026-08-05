import { useMemo, useState } from 'react'
import {
  emptyExamState,
  examCopy,
  EXAM_STEPS,
  MEIBUM_GRADES,
  isExamComplete,
  isExamStepDone,
  type ExamStepId,
  type MeibumGrade,
  type ParpadeoExamState,
} from '../i18n/parpadeoExam'
import {
  countFindingEyes,
  emptyMeibomianFindings,
  type MeibomianFindingsResult,
} from '../i18n/parpadeoFindings'
import {
  countPlusCriteria,
  emptyPlusCriteria,
  type PlusCriteriaResult,
} from '../i18n/parpadeoPlus'
import {
  emptyStainingResult,
  eyeStainingTotal,
  type StainingResult,
} from '../i18n/parpadeoStaining'
import type { Lang } from '../i18n/preferences'
import { MeibomianFindingsForm } from './MeibomianFindingsForm'
import { PlusCriteriaForm } from './PlusCriteriaForm'
import { StainingOssForm } from './StainingOssForm'
import './ParpadeoExploracionFisicaScreen.css'

type ParpadeoExploracionFisicaScreenProps = {
  lang: Lang
  onBack: () => void
  onNext: (data: ParpadeoExamState) => void
}

function parseMeasure(raw: string, max: number): number | null {
  const n = Number(raw.replace(',', '.'))
  if (!Number.isFinite(n) || n < 0 || n > max) return null
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
  const [measureError, setMeasureError] = useState<string | null>(null)
  const [stainDraft, setStainDraft] = useState<StainingResult>(emptyStainingResult)
  const [mgdOd, setMgdOd] = useState<MeibumGrade | null>(null)
  const [mgdOs, setMgdOs] = useState<MeibumGrade | null>(null)
  const [mgdError, setMgdError] = useState<string | null>(null)
  const [findingsDraft, setFindingsDraft] = useState<MeibomianFindingsResult>(
    emptyMeibomianFindings(),
  )
  const [plusDraft, setPlusDraft] = useState<PlusCriteriaResult>(
    emptyPlusCriteria(),
  )

  const complete = useMemo(() => isExamComplete(state), [state])

  function openStep(id: ExamStepId) {
    setMeasureError(null)
    if (id === 'tbut') {
      setDraftOd(state.tbut ? String(state.tbut.odSec) : '10')
      setDraftOs(state.tbut ? String(state.tbut.osSec) : '10')
    }
    if (id === 'schirmer') {
      setDraftOd(state.schirmer ? String(state.schirmer.odMm) : '10')
      setDraftOs(state.schirmer ? String(state.schirmer.osMm) : '10')
    }
    if (id === 'staining') {
      setStainDraft(state.staining ?? emptyStainingResult())
    }
    if (id === 'meibomianFunction') {
      setMgdOd(state.meibomianFunction?.od ?? null)
      setMgdOs(state.meibomianFunction?.os ?? null)
      setMgdError(null)
    }
    if (id === 'meibomianExpressivity') {
      setMgdOd(state.meibomianExpressivity?.od ?? null)
      setMgdOs(state.meibomianExpressivity?.os ?? null)
      setMgdError(null)
    }
    if (id === 'meibomianFindings') {
      setFindingsDraft(state.meibomianFindings ?? emptyMeibomianFindings())
    }
    if (id === 'otherCriteria') {
      setPlusDraft(state.otherCriteria ?? emptyPlusCriteria())
    }
    setOpen(id)
  }

  function saveTbut() {
    const odSec = parseMeasure(draftOd, 60)
    const osSec = parseMeasure(draftOs, 60)
    if (odSec === null || osSec === null) {
      setMeasureError(t.tbutInvalid)
      return
    }
    setState((prev) => ({
      ...prev,
      tbut: { odSec, osSec },
    }))
    setMeasureError(null)
    setOpen(null)
  }

  function saveSchirmer() {
    const odMm = parseMeasure(draftOd, 40)
    const osMm = parseMeasure(draftOs, 40)
    if (odMm === null || osMm === null) {
      setMeasureError(t.schirmerInvalid)
      return
    }
    setState((prev) => ({
      ...prev,
      schirmer: { odMm, osMm },
    }))
    setMeasureError(null)
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
                {id === 'schirmer' && state.schirmer && (
                  <span className="p-exam__step-meta">
                    OD {state.schirmer.odMm} mm · OS {state.schirmer.osMm} mm
                  </span>
                )}
                {id === 'staining' && state.staining && (
                  <span className="p-exam__step-meta">
                    OD {eyeStainingTotal(state.staining.od)} · OS{' '}
                    {eyeStainingTotal(state.staining.os)}
                  </span>
                )}
                {id === 'meibomianFunction' && state.meibomianFunction && (
                  <span className="p-exam__step-meta">
                    OD {t.mgdGrades[state.meibomianFunction.od].label} · OS{' '}
                    {t.mgdGrades[state.meibomianFunction.os].label}
                  </span>
                )}
                {id === 'meibomianExpressivity' && state.meibomianExpressivity && (
                  <span className="p-exam__step-meta">
                    OD {t.expGrades[state.meibomianExpressivity.od].label} · OS{' '}
                    {t.expGrades[state.meibomianExpressivity.os].label}
                  </span>
                )}
                {id === 'meibomianFindings' && state.meibomianFindings && (
                  <span className="p-exam__step-meta">
                    OD {countFindingEyes(state.meibomianFindings).od} · OS{' '}
                    {countFindingEyes(state.meibomianFindings).os}
                  </span>
                )}
                {id === 'otherCriteria' && state.otherCriteria && (
                  <span className="p-exam__step-meta">
                    {countPlusCriteria(state.otherCriteria)}
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
          <div
            className={`p-exam__dialog${
              open === 'staining'
                ? ' p-exam__dialog--stain'
                : open === 'meibomianFunction' ||
                    open === 'meibomianExpressivity'
                  ? ' p-exam__dialog--mgd'
                  : open === 'meibomianFindings'
                    ? ' p-exam__dialog--findings'
                    : open === 'otherCriteria'
                      ? ' p-exam__dialog--plus'
                      : ''
            }`}
          >
            <button
              type="button"
              className="p-exam__dialog-close"
              onClick={() => setOpen(null)}
            >
              {t.close}
            </button>
            {open !== 'staining' && open !== 'otherCriteria' && (
              <h3>{t.steps[open]}</h3>
            )}

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
                {measureError && <p className="p-exam__error">{measureError}</p>}
                <button
                  type="button"
                  className="p-exam__confirm"
                  onClick={saveTbut}
                >
                  ✓ {t.confirm}
                </button>
              </>
            ) : open === 'staining' ? (
              <StainingOssForm
                lang={lang}
                value={stainDraft}
                onChange={setStainDraft}
                onSave={() => {
                  setState((prev) => ({ ...prev, staining: stainDraft }))
                  setOpen(null)
                }}
              />
            ) : open === 'meibomianFunction' ||
              open === 'meibomianExpressivity' ? (
              <>
                <p className="p-exam__dialog-hint">
                  {open === 'meibomianFunction' ? t.mgdHint : t.expHint}
                </p>
                {(
                  [
                    ['od', t.mgdOd, mgdOd, setMgdOd],
                    ['os', t.mgdOs, mgdOs, setMgdOs],
                  ] as const
                ).map(([side, title, selected, setSelected]) => {
                  const grades =
                    open === 'meibomianFunction' ? t.mgdGrades : t.expGrades
                  const colLabel =
                    open === 'meibomianFunction' ? t.mgdColAspect : t.expColLabel
                  return (
                    <section key={side} className="mgd-block">
                      <h4
                        className={`mgd-block__title mgd-block__title--${side}`}
                      >
                        {title}
                      </h4>
                      <div className="mgd-head" aria-hidden="true">
                        <span>{t.mgdColGrade}</span>
                        <span>{colLabel}</span>
                      </div>
                      <div className="mgd-list" role="listbox" aria-label={title}>
                        {MEIBUM_GRADES.map((grade) => (
                          <button
                            key={grade}
                            type="button"
                            role="option"
                            aria-selected={selected === grade}
                            className={`mgd-row mgd-row--${grade}${
                              selected === grade ? ' is-selected' : ''
                            }`}
                            onClick={() => {
                              setSelected(grade)
                              setMgdError(null)
                            }}
                          >
                            <span className="mgd-stage">{grades[grade].label}</span>
                            <span className="mgd-detail">
                              {grades[grade].detail}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )
                })}
                {mgdError && <p className="p-exam__error">{mgdError}</p>}
                <button
                  type="button"
                  className="p-exam__confirm"
                  onClick={() => {
                    if (mgdOd === null || mgdOs === null) {
                      setMgdError(
                        open === 'meibomianFunction' ? t.mgdInvalid : t.expInvalid,
                      )
                      return
                    }
                    setState((prev) => ({
                      ...prev,
                      [open]: { od: mgdOd, os: mgdOs },
                    }))
                    setMgdError(null)
                    setOpen(null)
                  }}
                >
                  ✓ {t.confirm}
                </button>
              </>
            ) : open === 'meibomianFindings' ? (
              <MeibomianFindingsForm
                lang={lang}
                value={findingsDraft}
                onChange={setFindingsDraft}
                onSave={() => {
                  setState((prev) => ({
                    ...prev,
                    meibomianFindings: findingsDraft,
                  }))
                  setOpen(null)
                }}
              />
            ) : open === 'schirmer' ? (
              <>
                <p className="p-exam__dialog-hint">{t.schirmerHint}</p>
                <label className="p-exam__field">
                  <span>
                    {t.schirmerOd} ({t.schirmerUnit})
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={40}
                    step={0.5}
                    value={draftOd}
                    onChange={(e) => setDraftOd(e.target.value)}
                  />
                </label>
                <label className="p-exam__field">
                  <span>
                    {t.schirmerOs} ({t.schirmerUnit})
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={40}
                    step={0.5}
                    value={draftOs}
                    onChange={(e) => setDraftOs(e.target.value)}
                  />
                </label>
                {measureError && <p className="p-exam__error">{measureError}</p>}
                <button
                  type="button"
                  className="p-exam__confirm"
                  onClick={saveSchirmer}
                >
                  ✓ {t.confirm}
                </button>
              </>
            ) : (
              <PlusCriteriaForm
                lang={lang}
                value={plusDraft}
                onChange={setPlusDraft}
                onSave={() => {
                  setState((prev) => ({
                    ...prev,
                    otherCriteria: plusDraft,
                  }))
                  setOpen(null)
                }}
              />
            )}
          </div>
        </div>
      )}
    </main>
  )
}
