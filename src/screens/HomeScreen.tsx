import { homeCopy } from '../i18n/home'
import type { Lang } from '../i18n/preferences'
import './HomeScreen.css'

export type UserMode = 'guest' | 'researcher'

type HomeScreenProps = {
  lang: Lang
  onSelectMode: (mode: UserMode) => void
}

export function HomeScreen({ lang, onSelectMode }: HomeScreenProps) {
  const t = homeCopy[lang]

  return (
    <main className="home" aria-labelledby="home-brand">
      <div className="home__atmosphere" aria-hidden="true" />

      <header className="home__header">
        <h1 id="home-brand" className="home__brand">
          {t.brand}
        </h1>
        <p className="home__subtitle">{t.subtitle}</p>
      </header>

      <section className="home__actions" aria-label={t.brand}>
        <button
          type="button"
          className="home__btn home__btn--guest"
          onClick={() => onSelectMode('guest')}
        >
          <span className="home__btn-title">{t.guest}</span>
          <span className="home__btn-hint">“{t.guestHint}”</span>
        </button>

        <button
          type="button"
          className="home__btn home__btn--researcher"
          onClick={() => onSelectMode('researcher')}
        >
          <span className="home__btn-title">{t.researcher}</span>
        </button>
      </section>
    </main>
  )
}
