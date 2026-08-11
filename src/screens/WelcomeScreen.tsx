import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { APP_VERSION } from '../config'
import { welcomeCopy } from '../i18n/welcome'
import type { Lang } from '../i18n/preferences'
import './WelcomeScreen.css'

type WelcomeScreenProps = {
  onContinue?: (lang: Lang) => void
}

const INTERACTIVE =
  'button, a, input, label, [role="group"], .welcome__lang, .welcome__footer'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [lang, setLang] = useState<Lang>('es')
  const [accepted, setAccepted] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const activePointer = useRef<number | null>(null)
  const fadeTimer = useRef<number | null>(null)
  const t = welcomeCopy[lang]

  const setSpotlight = useCallback((x: number, y: number, strength: number) => {
    const el = rootRef.current
    if (!el) return
    el.style.setProperty('--sx', `${x}px`)
    el.style.setProperty('--sy', `${y}px`)
    el.style.setProperty('--sstrength', String(strength))
  }, [])

  const fadeOut = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    if (fadeTimer.current) window.clearInterval(fadeTimer.current)
    const start = Number.parseFloat(el.style.getPropertyValue('--sstrength') || '0')
    if (start <= 0.01) {
      setSpotlight(0, 0, 0)
      return
    }
    const startedAt = performance.now()
    const duration = 480
    fadeTimer.current = window.setInterval(() => {
      const tNorm = Math.min(1, (performance.now() - startedAt) / duration)
      const next = start * (1 - tNorm)
      const sx = el.style.getPropertyValue('--sx') || '0px'
      const sy = el.style.getPropertyValue('--sy') || '0px'
      el.style.setProperty('--sstrength', String(next))
      el.style.setProperty('--sx', sx)
      el.style.setProperty('--sy', sy)
      if (tNorm >= 1) {
        if (fadeTimer.current) window.clearInterval(fadeTimer.current)
        fadeTimer.current = null
        setSpotlight(0, 0, 0)
      }
    }, 16)
  }, [setSpotlight])

  const isBlockedTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return true
    return Boolean(target.closest(INTERACTIVE))
  }

  useEffect(() => {
    const el = rootRef.current
    if (!el || prefersReducedMotion()) return

    const onDown = (event: PointerEvent) => {
      if (isBlockedTarget(event.target)) return
      if (fadeTimer.current) {
        window.clearInterval(fadeTimer.current)
        fadeTimer.current = null
      }
      activePointer.current = event.pointerId
      const rect = el.getBoundingClientRect()
      setSpotlight(event.clientX - rect.left, event.clientY - rect.top, 1)
      try {
        el.setPointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
    }

    const onMove = (event: PointerEvent) => {
      if (activePointer.current != null && activePointer.current !== event.pointerId) {
        return
      }
      if (activePointer.current == null) {
        if (event.pointerType !== 'mouse' || isBlockedTarget(event.target)) return
        const rect = el.getBoundingClientRect()
        setSpotlight(event.clientX - rect.left, event.clientY - rect.top, 0.72)
        return
      }
      const rect = el.getBoundingClientRect()
      setSpotlight(event.clientX - rect.left, event.clientY - rect.top, 1)
    }

    const onUp = (event: PointerEvent) => {
      if (activePointer.current !== event.pointerId) return
      activePointer.current = null
      try {
        el.releasePointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
      fadeOut()
    }

    const onLeave = () => {
      if (activePointer.current == null) return
      activePointer.current = null
      fadeOut()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
      if (fadeTimer.current) window.clearInterval(fadeTimer.current)
    }
  }, [fadeOut, setSpotlight])

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
      <div className="welcome__brand-veil" aria-hidden="true">
        <img
          className="welcome__brand-logo"
          src="/brand/sophia-logo.png"
          alt=""
          draggable={false}
        />
      </div>

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
