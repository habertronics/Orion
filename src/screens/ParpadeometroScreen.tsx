import { useEffect, useState } from 'react'
import { parpadeometroCopy } from '../i18n/parpadeometro'
import type { Lang } from '../i18n/preferences'
import type { MeterResult } from '../lib/parpadeoMeter'
import './ParpadeometroScreen.css'

type ParpadeometroScreenProps = {
  lang: Lang
  onBack: () => void
  onNext: (meter: MeterResult | null) => void
  /** Abre el Parpadeómetro IA al entrar (modo sin registro). */
  autoStart?: boolean
}

export function ParpadeometroScreen({
  lang,
  onBack,
  onNext,
  autoStart = false,
}: ParpadeometroScreenProps) {
  const t = parpadeometroCopy[lang]
  const [running, setRunning] = useState(autoStart)
  const [meter, setMeter] = useState<MeterResult | null>(null)

  async function launchMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      // iPhone puede pedir permiso otra vez dentro del iframe.
    }
    setRunning(true)
  }

  useEffect(() => {
    if (!autoStart) return
    void launchMeter()
  }, [autoStart])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const data = event.data as {
        source?: string
        type?: string
        blinkCount?: number
        durationMs?: number
        finishedAt?: string
      }
      if (data?.source !== 'habertronic-parpadeometro') return
      if (data.type !== 'test-finished') return
      setMeter({
        blinkCount: Number(data.blinkCount) || 0,
        durationMs: Number(data.durationMs) || 0,
        finishedAt: data.finishedAt || new Date().toISOString(),
      })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (running) {
    return (
      <div className="p-meter-run">
        <button
          type="button"
          className="p-meter-run__exit"
          onClick={() => {
            if (autoStart) {
              onBack()
              return
            }
            setRunning(false)
          }}
        >
          {autoStart ? t.back : t.exitMeter}
        </button>
        <iframe
          className="p-meter-run__frame"
          title={t.button}
          src="/parpadeometro/index.html"
          allow="camera *; microphone *; fullscreen *; autoplay; clipboard-write"
          allowFullScreen
        />
        {!autoStart && (
          <button
            type="button"
            className="p-meter-run__next"
            onClick={() => onNext(meter)}
          >
            {t.next}
          </button>
        )}
      </div>
    )
  }

  return (
    <main className="p-meter" aria-labelledby="p-meter-brand">
      <div className="p-meter__atmosphere" aria-hidden="true" />

      <header className="p-meter__header">
        <button type="button" className="p-meter__back" onClick={onBack}>
          {t.back}
        </button>
        <h1 id="p-meter-brand" className="p-meter__brand">
          {t.brand}
        </h1>
        <p className="p-meter__subtitle">{t.subtitle}</p>
        <p className="p-meter__protocol">{t.protocolName}</p>
        <h2 className="p-meter__section">{t.sectionTitle}</h2>
      </header>

      <section className="p-meter__body">
        <p className="p-meter__hint">{t.hint}</p>
        <button
          type="button"
          className="p-meter__launch"
          onClick={() => void launchMeter()}
        >
          <span className="p-meter__launch-kicker">IA · MediaPipe · v2.2</span>
          <span className="p-meter__launch-title">{t.button}</span>
        </button>
      </section>

      <footer className="p-meter__footer">
        <button
          type="button"
          className="p-meter__next"
          onClick={() => onNext(meter)}
        >
          {t.next}
        </button>
      </footer>
    </main>
  )
}
