import {
  PLUS_CRITERIA,
  plusCopy,
  type PlusCriteriaResult,
  type PlusCriterionId,
} from '../i18n/parpadeoPlus'
import type { Lang } from '../i18n/preferences'

type PlusCriteriaFormProps = {
  lang: Lang
  value: PlusCriteriaResult
  schirmerLocked: boolean
  onChange: (next: PlusCriteriaResult) => void
  onSave: () => void
}

export function PlusCriteriaForm({
  lang,
  value,
  schirmerLocked,
  onChange,
  onSave,
}: PlusCriteriaFormProps) {
  const t = plusCopy[lang]

  function toggle(id: PlusCriterionId) {
    if (id === 'schirmerZero' && schirmerLocked) return
    onChange({ ...value, [id]: !value[id] })
  }

  return (
    <form
      className="plus"
      onSubmit={(e) => {
        e.preventDefault()
        onSave()
      }}
    >
      <p className="plus__hint">{t.hint}</p>
      <div className="plus__card">
        <h3 className="plus__title">{t.title}</h3>
        <div className="plus__body">
          <p className="plus__intro">{t.intro}</p>
          <ul className="plus__list">
            {PLUS_CRITERIA.map((id) => {
              const locked = id === 'schirmerZero' && schirmerLocked
              return (
                <li key={id}>
                  <label className={`plus__item${locked ? ' is-locked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={value[id]}
                      disabled={locked}
                      onChange={() => toggle(id)}
                    />
                    <span>
                      {t.items[id]}
                      {locked && (
                        <small className="plus__auto">{t.schirmerAuto}</small>
                      )}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <button type="submit" className="p-exam__confirm">
        ✓ {t.save}
      </button>
    </form>
  )
}
