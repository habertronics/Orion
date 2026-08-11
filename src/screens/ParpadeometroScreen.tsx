import { useEffect, useState } from 'react'
import { parpadeometroCopy } from '../i18n/parpadeometro'
import type { Lang } from '../i18n/preferences'
import { isMeterComplete, type MeterResult } from '../lib/parpadeoMeter'
import './ParpadeometroScreen.css'

type ParpadeometroScreenProps = {
  lang: Lang
  onBack: () => void
  onNext: (meter: MeterResult) => void
  /** Abre el Parpadeómetro IA al entrar (modo sin registro). */
  autoStart?: boolean
  /** En protocolo clínico: no se puede avanzar sin medición terminada. */
  requireMeter?: boolean
}

export function ParpadeometroScreen({
  lang,
  onBack,
  onNext,
  autoStart = false,
  requireMeter = false,
}: ParpadeometroScreenProps) {
  const t = parpadeometroCopy[lang]
  const [running, setRunning] = useState(autoStart)
  const [meter, setMeter] = useState<MeterResult | null>(null)
  const ready = isMeterComplete(meter)

  function launchMeter() {
    // No priming getUserMedia aquí: abrir+cerrar el stream en el padre
    // y luego otra vez en el iframe provoca cuelgues/crashes en móvil.
    setRunning(true)
  }

  useEffect(() => {
    if (!autoStart) return
    launchMeter()
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
        incompleteBlinkCount?: number
        bpm?: number
        meanIntervalSec?: number | null
        medianIntervalSec?: number | null
        modeIntervalSec?: number | null
        arrhythmiaCvPct?: number | null
        apertureThreshold?: number
      }
      if (data?.source !== 'habertronic-parpadeometro') return
      if (data.type !== 'test-finished') return
      setMeter({
        blinkCount: Number(data.blinkCount) || 0,
        durationMs: Number(data.durationMs) || 0,
        finishedAt: data.finishedAt || new Date().toISOString(),
        incompleteBlinkCount: Number(data.incompleteBlinkCount) || 0,
        bpm: Number(data.bpm) || undefined,
        meanIntervalSec:
          data.meanIntervalSec == null ? null : Number(data.meanIntervalSec),
        medianIntervalSec:
          data.medianIntervalSec == null
            ? null
            : Number(data.medianIntervalSec),
        modeIntervalSec:
          data.modeIntervalSec == null ? null : Number(data.modeIntervalSec),
        arrhythmiaCvPct:
          data.arrhythmiaCvPct == null ? null : Number(data.arrhythmiaCvPct),
        apertureThreshold:
          data.apertureThreshold == null
            ? undefined
            : Number(data.apertureThreshold),
      })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function goNext() {
    if (!meter || !isMeterComplete(meter)) return
    onNext(meter)
  }

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
          <div className="p-meter-run__footer">
            {requireMeter && !ready && (
              <p className="p-meter-run__need">{t.needMeter}</p>
            )}
            {ready && <p className="p-meter-run__ready">{t.meterReady}</p>}
            <button
              type="button"
              className="p-meter-run__next"
              disabled={requireMeter && !ready}
              onClick={goNext}
            >
              {t.next}
            </button>
          </div>
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
        {requireMeter && (
          <p className="p-meter__required">{t.requiredNote}</p>
        )}
        <button
          type="button"
          className="p-meter__launch"
          onClick={() => launchMeter()}
        >
          <span className="p-meter__launch-kicker">IA · MediaPipe · v3.1</span>
          <span className="p-meter__launch-title">{t.button}</span>
        </button>
      </section>

      <footer className="p-meter__footer">
        {ready ? (
          <button type="button" className="p-meter__next" onClick={goNext}>
            {t.next}
          </button>
        ) : (
          <p className="p-meter__need-footer">{t.needMeter}</p>
        )}
      </footer>
    </main>
  )
}
