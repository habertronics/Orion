import type { Lang } from './preferences'

export type StainingGrade = 0 | 1 | 2 | 3
export type StainingZone = 'left' | 'cornea' | 'right'
export type EyeSide = 'od' | 'os'

export type EyeStaining = {
  conjunctivaLeft: StainingGrade | null
  cornea: StainingGrade | null
  conjunctivaRight: StainingGrade | null
  confluentPatches: boolean
  pupillaryArea: boolean
  filaments: boolean
}

export type StainingResult = {
  od: EyeStaining
  os: EyeStaining
}

export const STAINING_GRADES: StainingGrade[] = [0, 1, 2, 3]

export const emptyEyeStaining = (): EyeStaining => ({
  conjunctivaLeft: null,
  cornea: null,
  conjunctivaRight: null,
  confluentPatches: false,
  pupillaryArea: false,
  filaments: false,
})

export const emptyStainingResult = (): StainingResult => ({
  od: emptyEyeStaining(),
  os: emptyEyeStaining(),
})

export function eyeStainingTotal(eye: EyeStaining): number {
  const extras =
    Number(eye.confluentPatches) +
    Number(eye.pupillaryArea) +
    Number(eye.filaments)
  return (
    (eye.conjunctivaLeft ?? 0) +
    (eye.cornea ?? 0) +
    (eye.conjunctivaRight ?? 0) +
    extras
  )
}

export function isEyeStainingComplete(eye: EyeStaining): boolean {
  return (
    eye.conjunctivaLeft !== null &&
    eye.cornea !== null &&
    eye.conjunctivaRight !== null
  )
}

export function isStainingComplete(result: StainingResult): boolean {
  return isEyeStainingComplete(result.od) && isEyeStainingComplete(result.os)
}

export function nextStainingZone(eye: EyeStaining): StainingZone {
  if (eye.conjunctivaLeft === null) return 'left'
  if (eye.cornea === null) return 'cornea'
  return 'right'
}

export const stainingCopy: Record<
  Lang,
  {
    title: string
    subtitle: string
    pattern: string
    od: string
    os: string
    greenTitle: string
    orangeTitle: string
    grade: string
    greenRows: [string, string, string, string]
    orangeRows: [string, string, string, string]
    leftConjOd: string
    rightConjOd: string
    leftConjOs: string
    rightConjOs: string
    cornea: string
    flowHint: string
    extraTitle: string
    extraConfluent: string
    extraPupil: string
    extraFilaments: string
    total: string
    note: string
    save: string
    incomplete: string
  }
> = {
  es: {
    title: 'Tinción de la superficie ocular OSS (SICCA)',
    subtitle: 'Puntuación del patrón de tinción',
    pattern: 'Selecciona grado 0–3',
    od: 'Ojo derecho',
    os: 'Ojo izquierdo',
    greenTitle: 'Verde lisamina (solo conjuntiva)',
    orangeTitle: 'Fluoresceína (solo córnea)',
    grade: 'Grado',
    greenRows: ['0–9 puntos', '10–32 puntos', '33–100 puntos', '>100 puntos'],
    orangeRows: ['0 puntos', '1–5 puntos', '6–30 puntos', '>30 puntos'],
    leftConjOd: 'Temporal',
    rightConjOd: 'Nasal',
    leftConjOs: 'Nasal',
    rightConjOs: 'Temporal',
    cornea: 'Córnea',
    flowHint:
      'Orden: conjuntiva izquierda del dibujo → córnea → conjuntiva derecha.',
    extraTitle: 'Puntos adicionales con la tinción de fluoresceína',
    extraConfluent: '+1 Tinción con parches confluentes',
    extraPupil: '+1 Tinción en área pupilar',
    extraFilaments: '+1 Uno o más filamentos',
    total: 'Puntuación total de tinción ocular',
    note: 'Puntuaciones totales de 3 a 12 por ojo evalúan el rango de gravedad de la queratoconjuntivitis.',
    save: 'Guardar tinción',
    incomplete: 'Completa grado izquierdo, córnea y derecho en ambos ojos.',
  },
  en: {
    title: 'Ocular surface staining OSS (SICCA)',
    subtitle: 'Staining pattern score',
    pattern: 'Select grade 0–3',
    od: 'Right eye',
    os: 'Left eye',
    greenTitle: 'Lissamine green (conjunctiva only)',
    orangeTitle: 'Fluorescein (cornea only)',
    grade: 'Grade',
    greenRows: ['0–9 dots', '10–32 dots', '33–100 dots', '>100 dots'],
    orangeRows: ['0 dots', '1–5 dots', '6–30 dots', '>30 dots'],
    leftConjOd: 'Temporal',
    rightConjOd: 'Nasal',
    leftConjOs: 'Nasal',
    rightConjOs: 'Temporal',
    cornea: 'Cornea',
    flowHint:
      'Order: left conjunctiva on the drawing → cornea → right conjunctiva.',
    extraTitle: 'Additional points with fluorescein staining',
    extraConfluent: '+1 Confluent patch staining',
    extraPupil: '+1 Staining in pupillary area',
    extraFilaments: '+1 One or more filaments',
    total: 'Total ocular staining score',
    note: 'Total staining scores of 3 to 12 per eye evaluate the severity range of keratoconjunctivitis.',
    save: 'Save staining',
    incomplete: 'Complete left, cornea and right grades in both eyes.',
  },
  pt: {
    title: 'Coloração da superfície ocular OSS (SICCA)',
    subtitle: 'Pontuação do padrão de coloração',
    pattern: 'Selecione grau 0–3',
    od: 'Olho direito',
    os: 'Olho esquerdo',
    greenTitle: 'Verde de lisamina (somente conjuntiva)',
    orangeTitle: 'Fluoresceína (somente córnea)',
    grade: 'Grau',
    greenRows: ['0–9 pontos', '10–32 pontos', '33–100 pontos', '>100 pontos'],
    orangeRows: ['0 pontos', '1–5 pontos', '6–30 pontos', '>30 pontos'],
    leftConjOd: 'Temporal',
    rightConjOd: 'Nasal',
    leftConjOs: 'Nasal',
    rightConjOs: 'Temporal',
    cornea: 'Córnea',
    flowHint:
      'Ordem: conjuntiva esquerda do desenho → córnea → conjuntiva direita.',
    extraTitle: 'Pontos adicionais com a coloração de fluoresceína',
    extraConfluent: '+1 Coloração em manchas confluentes',
    extraPupil: '+1 Coloração na área pupilar',
    extraFilaments: '+1 Um ou mais filamentos',
    total: 'Pontuação total de coloração ocular',
    note: 'Pontuações totais de 3 a 12 por olho avaliam a gravidade da ceratoconjuntivite.',
    save: 'Salvar coloração',
    incomplete: 'Complete grau esquerdo, córnea e direito em ambos os olhos.',
  },
}
