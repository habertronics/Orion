/** OSDI-6 — Pult & Wolffsohn. Posible ojo seco si suma ≥ 4. */
export type Osdi6Score = 0 | 1 | 2 | 3 | 4

export type Osdi6Subscales = {
  /** Ítems 1–2: malestar ocular y alteraciones visuales */
  discomfort: number
  /** Ítems 3–4: función visual / tareas */
  visualFunction: number
  /** Ítems 5–6: ambiental */
  environmental: number
}

export type Osdi6Result = {
  answers: [
    Osdi6Score,
    Osdi6Score,
    Osdi6Score,
    Osdi6Score,
    Osdi6Score,
    Osdi6Score,
  ]
  total: number
  possibleDryEye: boolean
  subscales: Osdi6Subscales
}

export const OSDI6_THRESHOLD = 4
export const OSDI6_QUESTION_COUNT = 6
export const OSDI6_MAX_TOTAL = 24
export const OSDI6_SCORES: Osdi6Score[] = [4, 3, 2, 1, 0]

export function emptyOsdi6Draft(): (Osdi6Score | null)[] {
  return [null, null, null, null, null, null]
}

function sumIndices(
  answers: (Osdi6Score | null)[],
  indices: number[],
): number {
  return indices.reduce((sum, i) => sum + (answers[i] ?? 0), 0)
}

export function liveOsdi6(answers: (Osdi6Score | null)[]) {
  const subscales: Osdi6Subscales = {
    discomfort: sumIndices(answers, [0, 1]),
    visualFunction: sumIndices(answers, [2, 3]),
    environmental: sumIndices(answers, [4, 5]),
  }
  const total =
    subscales.discomfort +
    subscales.visualFunction +
    subscales.environmental
  const answered = answers.filter((a) => a !== null).length
  const complete = answered === OSDI6_QUESTION_COUNT

  return {
    subscales,
    total,
    answered,
    complete,
    possibleDryEye: complete ? total >= OSDI6_THRESHOLD : null,
    markerPct: Math.min(100, (total / OSDI6_MAX_TOTAL) * 100),
    thresholdPct: (OSDI6_THRESHOLD / OSDI6_MAX_TOTAL) * 100,
  }
}

export function scoreOsdi6(
  answers: (Osdi6Score | null)[],
): Osdi6Result | null {
  const live = liveOsdi6(answers)
  if (!live.complete) return null
  if (answers.some((a) => a === null)) return null

  const filled = answers as Osdi6Result['answers']
  return {
    answers: filled,
    total: live.total,
    possibleDryEye: live.total >= OSDI6_THRESHOLD,
    subscales: live.subscales,
  }
}
