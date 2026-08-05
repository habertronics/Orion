import type { Lang } from './preferences'

export type MarginFindingId =
  | 'thickenedMargin'
  | 'irregularMargin'
  | 'telangiectasia'
  | 'distichiasis'
  | 'madarosis'
  | 'malposition'
  | 'mucocutaneousJunction'

export type OrificeFindingId =
  | 'pouting'
  | 'capping'
  | 'lossOfDefinition'
  | 'vascularInvasion'
  | 'orificeNarrowing'
  | 'posteriorToMarx'

export type EyeChecks = {
  od: boolean
  os: boolean
}

export type MeibomianFindingsResult = {
  margin: Record<MarginFindingId, EyeChecks>
  orifices: Record<OrificeFindingId, EyeChecks>
}

export const MARGIN_FINDINGS: MarginFindingId[] = [
  'thickenedMargin',
  'irregularMargin',
  'telangiectasia',
  'distichiasis',
  'madarosis',
  'malposition',
  'mucocutaneousJunction',
]

export const ORIFICE_FINDINGS: OrificeFindingId[] = [
  'pouting',
  'capping',
  'lossOfDefinition',
  'vascularInvasion',
  'orificeNarrowing',
  'posteriorToMarx',
]

const emptyChecks = (): EyeChecks => ({ od: false, os: false })

export function emptyMeibomianFindings(): MeibomianFindingsResult {
  return {
    margin: Object.fromEntries(
      MARGIN_FINDINGS.map((id) => [id, emptyChecks()]),
    ) as Record<MarginFindingId, EyeChecks>,
    orifices: Object.fromEntries(
      ORIFICE_FINDINGS.map((id) => [id, emptyChecks()]),
    ) as Record<OrificeFindingId, EyeChecks>,
  }
}

export function countFindingEyes(result: MeibomianFindingsResult): {
  od: number
  os: number
} {
  let od = 0
  let os = 0
  for (const checks of [
    ...Object.values(result.margin),
    ...Object.values(result.orifices),
  ]) {
    if (checks.od) od += 1
    if (checks.os) os += 1
  }
  return { od, os }
}

export const findingsCopy: Record<
  Lang,
  {
    hint: string
    od: string
    os: string
    both: string
    marginTitle: string
    orificeTitle: string
    save: string
    margin: Record<MarginFindingId, string>
    orifices: Record<OrificeFindingId, string>
  }
> = {
  es: {
    hint: 'Marca el ojo afectado. Si el hallazgo es bilateral, usa ambos ojos. Si no hay hallazgos, guarda vacío.',
    od: 'Ojo derecho',
    os: 'Ojo izquierdo',
    both: 'Ambos ojos',
    marginTitle: 'Margen palpebral',
    orificeTitle: 'Orificios glandulares',
    save: 'Guardar hallazgos',
    margin: {
      thickenedMargin: 'Borde palpebral engrosado',
      irregularMargin: 'Irregularidad del margen palpebral',
      telangiectasia: 'Telangiectasias',
      distichiasis: 'Distiquiasis',
      madarosis: 'Madarosis',
      malposition: 'Malposición',
      mucocutaneousJunction: 'Alteración de unión mucocutánea',
    },
    orifices: {
      pouting: 'Pouting: sobreelevación del orificio',
      capping: 'Capping: cúpula grasa queratinizada',
      lossOfDefinition: 'Pérdida de definición de bordes',
      vascularInvasion: 'Invasión vascular',
      orificeNarrowing: 'Estrechamiento del orificio',
      posteriorToMarx: 'Posicionamiento posterior a la línea de Marx',
    },
  },
  en: {
    hint: 'Check the affected eye. If the finding is bilateral, use both eyes. If there are none, save empty.',
    od: 'Right eye',
    os: 'Left eye',
    both: 'Both eyes',
    marginTitle: 'Eyelid margin',
    orificeTitle: 'Gland orifices',
    save: 'Save findings',
    margin: {
      thickenedMargin: 'Thickened eyelid margin',
      irregularMargin: 'Eyelid margin irregularity',
      telangiectasia: 'Telangiectasia',
      distichiasis: 'Distichiasis',
      madarosis: 'Madarosis',
      malposition: 'Malposition',
      mucocutaneousJunction: 'Mucocutaneous junction alteration',
    },
    orifices: {
      pouting: 'Pouting: orifice elevation',
      capping: 'Capping: keratinized oily dome',
      lossOfDefinition: 'Loss of border definition',
      vascularInvasion: 'Vascular invasion',
      orificeNarrowing: 'Orifice narrowing',
      posteriorToMarx: 'Posterior positioning to Marx’s line',
    },
  },
  pt: {
    hint: 'Marque o olho afetado. Se o achado for bilateral, use ambos os olhos. Se não houver, salve vazio.',
    od: 'Olho direito',
    os: 'Olho esquerdo',
    both: 'Ambos os olhos',
    marginTitle: 'Margem palpebral',
    orificeTitle: 'Orifícios glandulares',
    save: 'Salvar achados',
    margin: {
      thickenedMargin: 'Borda palpebral espessada',
      irregularMargin: 'Irregularidade da margem palpebral',
      telangiectasia: 'Telangiectasias',
      distichiasis: 'Distiquíase',
      madarosis: 'Madarose',
      malposition: 'Má posição',
      mucocutaneousJunction: 'Alteração da junção mucocutânea',
    },
    orifices: {
      pouting: 'Pouting: sobreelevação do orifício',
      capping: 'Capping: cúpula gordurosa queratinizada',
      lossOfDefinition: 'Perda de definição das bordas',
      vascularInvasion: 'Invasão vascular',
      orificeNarrowing: 'Estreitamento do orifício',
      posteriorToMarx: 'Posicionamento posterior à linha de Marx',
    },
  },
}
