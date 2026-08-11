export type MeterResult = {
  blinkCount: number
  durationMs: number
  finishedAt: string
  incompleteBlinkCount?: number
  bpm?: number
  meanIntervalSec?: number | null
  medianIntervalSec?: number | null
  modeIntervalSec?: number | null
  arrhythmiaCvPct?: number | null
  apertureThreshold?: number
}

/** Prueba de parpadeómetro terminada (requisito para enviar el protocolo). */
export function isMeterComplete(meter: MeterResult | null | undefined): boolean {
  if (!meter) return false
  return (
    Number(meter.durationMs) > 0 &&
    typeof meter.finishedAt === 'string' &&
    meter.finishedAt.length > 0
  )
}
