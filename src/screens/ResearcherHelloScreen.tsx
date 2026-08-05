import { researcherCopy } from '../i18n/researcher'
import type { Lang } from '../i18n/preferences'
import './ResearcherFlow.css'

type ResearcherHelloScreenProps = {
  lang: Lang
  displayName: string
  onContinue: () => void
  onHome: () => void
  onLogout: () => void
}

export function ResearcherHelloScreen({
  lang,
  displayName,
  onContinue,
  onHome,
  onLogout,
}: ResearcherHelloScreenProps) {
  const t = researcherCopy[lang]

  return (
    <main className="r-flow" aria-labelledby="r-hello-title">
      <div className="r-flow__atmosphere" aria-hidden="true" />

      <header className="r-flow__header">
        <h1 id="r-hello-title" className="r-flow__brand">
          {t.brand}
        </h1>
        <p className="r-flow__subtitle">{t.subtitle}</p>
      </header>

      <section className="r-flow__panel">
        <p className="r-flow__hello">
          {t.helloTitle}
          <strong>{displayName}</strong>
        </p>
        <button type="button" className="r-flow__primary" onClick={onContinue}>
          {t.helloContinue}
        </button>
        <div className="r-flow__links">
          <button type="button" className="r-flow__link" onClick={onHome}>
            {t.home}
          </button>
          <button type="button" className="r-flow__link" onClick={onLogout}>
            {t.logout}
          </button>
        </div>
      </section>
    </main>
  )
}
