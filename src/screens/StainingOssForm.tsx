import { useState } from 'react'
import {
  eyeStainingTotal,
  isStainingComplete,
  nextStainingZone,
  stainingCopy,
  STAINING_GRADES,
  type EyeSide,
  type EyeStaining,
  type StainingGrade,
  type StainingResult,
  type StainingZone,
} from '../i18n/parpadeoStaining'
import type { Lang } from '../i18n/preferences'
import './StainingOssForm.css'

type StainingOssFormProps = {
  lang: Lang
  value: StainingResult
  onChange: (next: StainingResult) => void
  onSave: () => void
}

function EyeGlyph({
  eye,
  target,
  leftLabel,
  rightLabel,
  corneaLabel,
  onSelectZone,
}: {
  eye: EyeStaining
  target: StainingZone
  leftLabel: string
  rightLabel: string
  corneaLabel: string
  onSelectZone: (zone: StainingZone) => void
}) {
  return (
    <div className="oss-eye">
      <svg viewBox="0 0 280 130" className="oss-eye__svg" aria-hidden="true">
        <ellipse
          cx="140"
          cy="68"
          rx="118"
          ry="48"
          fill="#f7fbfa"
          stroke="#8aa0a8"
          strokeWidth="2.2"
        />
        <ellipse
          cx="140"
          cy="68"
          rx="38"
          ry="38"
          fill="#f4e7c5"
          stroke="#d4a24a"
          strokeWidth="2"
        />
        <circle cx="140" cy="68" r="14" fill="#2c4a56" />
        <circle cx="145" cy="62" r="4" fill="#eef6f5" />
        <path
          d="M28 52 C70 18, 210 18, 252 52"
          fill="none"
          stroke="#8aa0a8"
          strokeWidth="2"
        />
        <path
          d="M32 86 C78 112, 202 112, 248 86"
          fill="none"
          stroke="#8aa0a8"
          strokeWidth="2"
        />
      </svg>

      <button
        type="button"
        className={`oss-eye__box oss-eye__box--left${
          target === 'left' ? ' is-target' : ''
        }${eye.conjunctivaLeft !== null ? ' is-filled' : ''}`}
        onClick={() => onSelectZone('left')}
        aria-label={leftLabel}
      >
        {eye.conjunctivaLeft ?? ''}
      </button>
      <button
        type="button"
        className={`oss-eye__box oss-eye__box--center${
          target === 'cornea' ? ' is-target' : ''
        }${eye.cornea !== null ? ' is-filled is-cornea' : ''}`}
        onClick={() => onSelectZone('cornea')}
        aria-label={corneaLabel}
      >
        {eye.cornea ?? ''}
      </button>
      <button
        type="button"
        className={`oss-eye__box oss-eye__box--right${
          target === 'right' ? ' is-target' : ''
        }${eye.conjunctivaRight !== null ? ' is-filled' : ''}`}
        onClick={() => onSelectZone('right')}
        aria-label={rightLabel}
      >
        {eye.conjunctivaRight ?? ''}
      </button>

      <span className="oss-eye__cap oss-eye__cap--left">{leftLabel}</span>
      <span className="oss-eye__cap oss-eye__cap--center">{corneaLabel}</span>
      <span className="oss-eye__cap oss-eye__cap--right">{rightLabel}</span>
    </div>
  )
}

function EyePanel({
  lang,
  side,
  eye,
  onChange,
}: {
  lang: Lang
  side: EyeSide
  eye: EyeStaining
  onChange: (next: EyeStaining) => void
}) {
  const t = stainingCopy[lang]
  const autoTarget = nextStainingZone(eye)
  const [manualTarget, setManualTarget] = useState<StainingZone | null>(null)
  const target = manualTarget ?? autoTarget
  const total = eyeStainingTotal(eye)
  const leftLabel = side === 'od' ? t.leftConjOd : t.leftConjOs
  const rightLabel = side === 'od' ? t.rightConjOd : t.rightConjOs

  const selectedGreen =
    target === 'right' ? eye.conjunctivaRight : eye.conjunctivaLeft

  function applyGreen(grade: StainingGrade) {
    if (target === 'right') {
      onChange({ ...eye, conjunctivaRight: grade })
      return
    }
    onChange({ ...eye, conjunctivaLeft: grade })
    setManualTarget(null)
  }

  function applyOrange(grade: StainingGrade) {
    if (eye.conjunctivaLeft === null) return
    onChange({ ...eye, cornea: grade })
    setManualTarget(null)
  }

  function selectZone(zone: StainingZone) {
    if (zone === 'left') {
      setManualTarget('left')
      return
    }
    if (zone === 'cornea' && eye.conjunctivaLeft !== null) {
      setManualTarget('cornea')
      return
    }
    if (zone === 'right' && eye.cornea !== null) {
      setManualTarget('right')
    }
  }

  return (
    <section className="oss-panel">
      <header className="oss-panel__head">
        <h4>{side === 'od' ? t.od : t.os}</h4>
        <p>{t.flowHint}</p>
      </header>

      <div className="oss-cols">
        <div className="oss-col oss-col--green">
          <p className="oss-col__title">{t.greenTitle}</p>
          {STAINING_GRADES.map((grade) => (
            <button
              key={`g-${grade}`}
              type="button"
              className={`oss-grade oss-grade--green${
                selectedGreen === grade ? ' is-selected' : ''
              }`}
              onClick={() => applyGreen(grade)}
            >
              <strong>
                {t.grade} {grade}
              </strong>
              <span>{t.greenRows[grade]}</span>
            </button>
          ))}
        </div>

        <div className="oss-col oss-col--orange">
          <p className="oss-col__title">{t.orangeTitle}</p>
          {STAINING_GRADES.map((grade) => (
            <button
              key={`o-${grade}`}
              type="button"
              className={`oss-grade oss-grade--orange${
                eye.cornea === grade ? ' is-selected' : ''
              }${target === 'cornea' ? ' is-target' : ''}`}
              disabled={eye.conjunctivaLeft === null}
              onClick={() => applyOrange(grade)}
            >
              <strong>
                {t.grade} {grade}
              </strong>
              <span>{t.orangeRows[grade]}</span>
            </button>
          ))}
        </div>
      </div>

      <EyeGlyph
        eye={eye}
        target={target}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        corneaLabel={t.cornea}
        onSelectZone={selectZone}
      />

      <div className="oss-extra">
        <p className="oss-extra__title">{t.extraTitle}</p>
        <button
          type="button"
          className={`oss-check${eye.confluentPatches ? ' is-on' : ''}`}
          onClick={() =>
            onChange({ ...eye, confluentPatches: !eye.confluentPatches })
          }
        >
          <span aria-hidden="true">{eye.confluentPatches ? '✓' : ''}</span>
          {t.extraConfluent}
        </button>
        <button
          type="button"
          className={`oss-check${eye.pupillaryArea ? ' is-on' : ''}`}
          onClick={() =>
            onChange({ ...eye, pupillaryArea: !eye.pupillaryArea })
          }
        >
          <span aria-hidden="true">{eye.pupillaryArea ? '✓' : ''}</span>
          {t.extraPupil}
        </button>
        <button
          type="button"
          className={`oss-check${eye.filaments ? ' is-on' : ''}`}
          onClick={() => onChange({ ...eye, filaments: !eye.filaments })}
        >
          <span aria-hidden="true">{eye.filaments ? '✓' : ''}</span>
          {t.extraFilaments}
        </button>
      </div>

      <div className="oss-total">
        <span>{t.total}</span>
        <strong>{total}</strong>
      </div>
      <p className="oss-note">{t.note}</p>
    </section>
  )
}

export function StainingOssForm({
  lang,
  value,
  onChange,
  onSave,
}: StainingOssFormProps) {
  const t = stainingCopy[lang]
  const ready = isStainingComplete(value)

  return (
    <div className="oss">
      <header className="oss__intro">
        <h3>{t.title}</h3>
        <p>{t.subtitle}</p>
      </header>

      <EyePanel
        lang={lang}
        side="od"
        eye={value.od}
        onChange={(od) => onChange({ ...value, od })}
      />
      <EyePanel
        lang={lang}
        side="os"
        eye={value.os}
        onChange={(os) => onChange({ ...value, os })}
      />

      {!ready && <p className="oss__warn">{t.incomplete}</p>}
      <button
        type="button"
        className="oss__save"
        disabled={!ready}
        onClick={onSave}
      >
        ✓ {t.save}
      </button>
    </div>
  )
}
