import { parpadeoIntroCopy } from '../i18n/parpadeoIntro'
import type { Lang } from '../i18n/preferences'
import './ProtocolIntroScreen.css'

type ProtocolIntroScreenProps = {
  lang: Lang
  onNext: () => void
  onBack: () => void
}

export function ProtocolIntroScreen({
  lang,
  onNext,
  onBack,
}: ProtocolIntroScreenProps) {
  const t = parpadeoIntroCopy[lang]

  return (
    <main className="p-intro" aria-labelledby="p-intro-brand">
      <div className="p-intro__atmosphere" aria-hidden="true" />

      <header className="p-intro__header">
        <button type="button" className="p-intro__back" onClick={onBack}>
          {t.back}
        </button>
        <h1 id="p-intro-brand" className="p-intro__brand">
          {t.brand}
        </h1>
        <p className="p-intro__subtitle">{t.subtitle}</p>
        <p className="p-intro__protocol">{t.protocolName}</p>
      </header>

      <section className="p-intro__body" aria-labelledby="p-intro-label">
        <h2 id="p-intro-label" className="p-intro__label">
          {t.introLabel}
        </h2>
        {t.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="p-intro__text">
            {paragraph}
          </p>
        ))}
      </section>

      <footer className="p-intro__footer">
        <button type="button" className="p-intro__next" onClick={onNext}>
          {t.next}
        </button>
      </footer>
    </main>
  )
}
