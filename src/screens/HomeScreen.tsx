import { BrandSpotlight } from '../components/BrandSpotlight'
import { homeCopy } from '../i18n/home'
import { APP_VERSION } from '../config'
import type { Lang } from '../i18n/preferences'
import './HomeScreen.css'

export type UserMode = 'guest' | 'register' | 'login'

type HomeScreenProps = {
  lang: Lang
  onSelectMode: (mode: UserMode) => void
}

export function HomeScreen({ lang, onSelectMode }: HomeScreenProps) {
  const t = homeCopy[lang]

  return (
    <main className="home" aria-labelledby="home-brand">
      <div className="home__atmosphere" aria-hidden="true" />
      <BrandSpotlight />

      <header className="home__header">
        <p className="home__ver" id="appVer">
          {APP_VERSION}
        </p>
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
          <span className="home__btn-hint">{t.guestHint}</span>
        </button>

        <button
          type="button"
          className="home__btn home__btn--register"
          onClick={() => onSelectMode('register')}
        >
          <span className="home__btn-title">{t.register}</span>
        </button>

        <button
          type="button"
          className="home__btn home__btn--login"
          onClick={() => onSelectMode('login')}
        >
          <span className="home__btn-title">{t.login}</span>
        </button>
      </section>
    </main>
  )
}
