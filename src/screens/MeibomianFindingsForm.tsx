import {
  MARGIN_FINDINGS,
  ORIFICE_FINDINGS,
  findingsCopy,
  type EyeChecks,
  type MeibomianFindingsResult,
  type MarginFindingId,
  type OrificeFindingId,
} from '../i18n/parpadeoFindings'
import type { Lang } from '../i18n/preferences'

type MeibomianFindingsFormProps = {
  lang: Lang
  value: MeibomianFindingsResult
  onChange: (next: MeibomianFindingsResult) => void
  onSave: () => void
}

function toggleSide(checks: EyeChecks, side: keyof EyeChecks): EyeChecks {
  return { ...checks, [side]: !checks[side] }
}

function toggleBoth(checks: EyeChecks): EyeChecks {
  const next = !(checks.od && checks.os)
  return { od: next, os: next }
}

type FindingRowProps = {
  label: string
  checks: EyeChecks
  odLabel: string
  osLabel: string
  bothLabel: string
  onToggleSide: (side: keyof EyeChecks) => void
  onToggleBoth: () => void
}

function FindingRow({
  label,
  checks,
  odLabel,
  osLabel,
  bothLabel,
  onToggleSide,
  onToggleBoth,
}: FindingRowProps) {
  return (
    <div className="findings__row">
      <span className="findings__label">{label}</span>
      <label className="findings__check">
        <input
          type="checkbox"
          checked={checks.od}
          onChange={() => onToggleSide('od')}
        />
        <span className="sr-only">
          {label} {odLabel}
        </span>
      </label>
      <label className="findings__check">
        <input
          type="checkbox"
          checked={checks.os}
          onChange={() => onToggleSide('os')}
        />
        <span className="sr-only">
          {label} {osLabel}
        </span>
      </label>
      <label className="findings__check">
        <input
          type="checkbox"
          checked={checks.od && checks.os}
          ref={(el) => {
            if (el) el.indeterminate = checks.od !== checks.os
          }}
          onChange={onToggleBoth}
        />
        <span className="sr-only">
          {label} {bothLabel}
        </span>
      </label>
    </div>
  )
}

export function MeibomianFindingsForm({
  lang,
  value,
  onChange,
  onSave,
}: MeibomianFindingsFormProps) {
  const t = findingsCopy[lang]

  function updateMargin(id: MarginFindingId, next: EyeChecks) {
    onChange({
      ...value,
      margin: { ...value.margin, [id]: next },
    })
  }

  function updateOrifice(id: OrificeFindingId, next: EyeChecks) {
    onChange({
      ...value,
      orifices: { ...value.orifices, [id]: next },
    })
  }

  return (
    <form
      className="findings"
      onSubmit={(e) => {
        e.preventDefault()
        onSave()
      }}
    >
      <p className="findings__hint">{t.hint}</p>

      <section className="findings__block">
        <h4 className="findings__title">{t.marginTitle}</h4>
        <div className="findings__head" aria-hidden="true">
          <span />
          <span className="findings__eye findings__eye--od">{t.od}</span>
          <span className="findings__eye findings__eye--os">{t.os}</span>
          <span className="findings__eye findings__eye--both">{t.both}</span>
        </div>
        {MARGIN_FINDINGS.map((id) => (
          <FindingRow
            key={id}
            label={t.margin[id]}
            checks={value.margin[id]}
            odLabel={t.od}
            osLabel={t.os}
            bothLabel={t.both}
            onToggleSide={(side) =>
              updateMargin(id, toggleSide(value.margin[id], side))
            }
            onToggleBoth={() => updateMargin(id, toggleBoth(value.margin[id]))}
          />
        ))}
      </section>

      <section className="findings__block">
        <h4 className="findings__title">{t.orificeTitle}</h4>
        <div className="findings__head" aria-hidden="true">
          <span />
          <span className="findings__eye findings__eye--od">{t.od}</span>
          <span className="findings__eye findings__eye--os">{t.os}</span>
          <span className="findings__eye findings__eye--both">{t.both}</span>
        </div>
        {ORIFICE_FINDINGS.map((id) => (
          <FindingRow
            key={id}
            label={t.orifices[id]}
            checks={value.orifices[id]}
            odLabel={t.od}
            osLabel={t.os}
            bothLabel={t.both}
            onToggleSide={(side) =>
              updateOrifice(id, toggleSide(value.orifices[id], side))
            }
            onToggleBoth={() =>
              updateOrifice(id, toggleBoth(value.orifices[id]))
            }
          />
        ))}
      </section>

      <button type="submit" className="p-exam__confirm">
        ✓ {t.save}
      </button>
    </form>
  )
}
