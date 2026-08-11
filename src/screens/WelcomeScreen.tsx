import { useRef, useState, type CSSProperties } from 'react'
import { APP_VERSION } from '../config'
import { BrandSpotlight } from '../components/BrandSpotlight'
import { useBrandSpotlight } from '../hooks/useBrandSpotlight'
import { welcomeCopy } from '../i18n/welcome'
import type { Lang } from '../i18n/preferences'
import './WelcomeScreen.css'

type WelcomeScreenProps = {
  onContinue?: (lang: Lang) => void
}

const INTERACTIVE =
  'button, a, input, label, .welcome__lang-btn, .welcome__consent, .welcome__continue'

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [lang, setLang] = useState<Lang>('es')
  const [accepted, setAccepted] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  useBrandSpotlight(rootRef, INTERACTIVE)
  const t = welcomeCopy[lang]

  return (
    <main
      ref={rootRef}
      className="welcome"
      aria-labelledby="welcome-brand"
      style={
        {
          '--sx': '50%',
          '--sy': '40%',
          '--sstrength': '0',
        } as CSSProperties
      }
    >
      <div className="welcome__atmosphere" aria-hidden="true" />
      <BrandSpotlight />

      <section className="welcome__hero">
        <p className="welcome__ver">{APP_VERSION}</p>
        <p className="welcome__greeting">{t.welcome}</p>
        <h1 id="welcome-brand" className="welcome__brand">
          {t.brand}
        </h1>
        <p className="welcome__subtitle">{t.subtitle}</p>
      </section>

      <section className="welcome__lang" aria-labelledby="lang-label">
        <h2 id="lang-label" className="welcome__lang-label">
          {t.languageLabel}
        </h2>
        <div className="welcome__lang-options" role="group" aria-label={t.languageLabel}>
          {t.languages.map((option) => (
            <button
              key={option.code}
              type="button"
              className={`welcome__lang-btn welcome__lang-btn--${option.code}${
                lang === option.code ? ' is-active' : ''
              }`}
              aria-pressed={lang === option.code}
              onClick={() => setLang(option.code)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="welcome__footer">
        <label className="welcome__consent">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>{t.consent}</span>
        </label>

        <button
          type="button"
          className="welcome__continue"
          disabled={!accepted}
          onClick={() => onContinue?.(lang)}
        >
          {t.continue}
        </button>
      </section>
    </main>
  )
}
