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
