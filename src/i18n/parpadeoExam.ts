import type { Lang } from './preferences'
import type { MeibomianFindingsResult } from './parpadeoFindings'
import type { PlusCriteriaResult } from './parpadeoPlus'
import type { StainingResult } from './parpadeoStaining'
import { isStainingComplete } from './parpadeoStaining'

export type ExamStepId =
  | 'tbut'
  | 'schirmer'
  | 'staining'
  | 'meibomianFunction'
  | 'meibomianExpressivity'
  | 'meibomianFindings'
  | 'otherCriteria'

export type TbutResult = {
  odSec: number
  osSec: number
}

export type SchirmerResult = {
  odMm: number
  osMm: number
}

export type MeibumGrade = 0 | 1 | 2 | 3

export type MeibomianGradeResult = {
  od: MeibumGrade
  os: MeibumGrade
}

export type MeibomianFunctionResult = MeibomianGradeResult
export type MeibomianExpressivityResult = MeibomianGradeResult

export const MEIBUM_GRADES: MeibumGrade[] = [0, 1, 2, 3]

export type ParpadeoExamState = {
  tbut: TbutResult | null
  schirmer: SchirmerResult | null
  staining: StainingResult | null
  meibomianFunction: MeibomianFunctionResult | null
  meibomianExpressivity: MeibomianExpressivityResult | null
  meibomianFindings: MeibomianFindingsResult | null
  otherCriteria: PlusCriteriaResult | null
}

export const EXAM_STEPS: ExamStepId[] = [
  'tbut',
  'schirmer',
  'staining',
  'meibomianFunction',
  'meibomianExpressivity',
  'meibomianFindings',
  'otherCriteria',
]

export const emptyExamState = (): ParpadeoExamState => ({
  tbut: null,
  schirmer: null,
  staining: null,
  meibomianFunction: null,
  meibomianExpressivity: null,
  meibomianFindings: null,
  otherCriteria: null,
})

export function isExamStepDone(
  state: ParpadeoExamState,
  id: ExamStepId,
): boolean {
  if (id === 'tbut') return state.tbut !== null
  if (id === 'schirmer') return state.schirmer !== null
  if (id === 'staining')
    return state.staining !== null && isStainingComplete(state.staining)
  if (id === 'meibomianFunction') return state.meibomianFunction !== null
  if (id === 'meibomianExpressivity') return state.meibomianExpressivity !== null
  if (id === 'meibomianFindings') return state.meibomianFindings !== null
  return state.otherCriteria !== null
}

export function isExamComplete(state: ParpadeoExamState): boolean {
  return EXAM_STEPS.every((id) => isExamStepDone(state, id))
}

export const examCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    protocolName: string
    sectionTitle: string
    next: string
    back: string
    close: string
    confirm: string
    confirmStub: string
    incompleteHint: string
    stubHint: string
    tbutHint: string
    tbutOd: string
    tbutOs: string
    tbutUnit: string
    tbutInvalid: string
    schirmerHint: string
    schirmerOd: string
    schirmerOs: string
    schirmerUnit: string
    schirmerInvalid: string
    mgdHint: string
    mgdOd: string
    mgdOs: string
    mgdColGrade: string
    mgdColAspect: string
    mgdGrades: Record<MeibumGrade, { label: string; detail: string }>
    mgdInvalid: string
    expHint: string
    expColLabel: string
    expGrades: Record<MeibumGrade, { label: string; detail: string }>
    expInvalid: string
    steps: Record<ExamStepId, string>
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    protocolName: 'Protocolo Parpadeo',
    sectionTitle: 'Exploración física',
    next: 'Siguiente',
    back: 'Volver',
    close: 'Cerrar',
    confirm: 'Guardar',
    confirmStub: 'Marcar como completado',
    incompleteHint: 'Completa todos los pasos (verde) para continuar.',
    stubHint:
      'Aquí se capturarán los datos de este examen. Por ahora puedes marcarlo como completado para seguir el flujo.',
    tbutHint:
      'Registra el tiempo de ruptura (TBUT) en segundos para cada ojo. Valores típicos: ≥10 s normal; <10 s sugiere inestabilidad.',
    tbutOd: 'OD (ojo derecho)',
    tbutOs: 'OS (ojo izquierdo)',
    tbutUnit: 'segundos',
    tbutInvalid: 'Introduce un valor entre 0 y 60 segundos para ambos ojos.',
    schirmerHint:
      'Registra el test de Schirmer en milímetros para cada ojo (humectación de la tira).',
    schirmerOd: 'OD (ojo derecho)',
    schirmerOs: 'OS (ojo izquierdo)',
    schirmerUnit: 'milímetros',
    schirmerInvalid: 'Introduce un valor entre 0 y 40 mm para ambos ojos.',
    mgdHint:
      'Elige la opción que mejor describe el aspecto del meibum en cada ojo.',
    mgdOd: 'Ojo derecho',
    mgdOs: 'Ojo izquierdo',
    mgdColGrade: 'Grado',
    mgdColAspect: 'Aspecto del Meibum',
    mgdGrades: {
      0: { label: '0', detail: 'Meibum claro' },
      1: { label: '1', detail: 'Meibum turbio' },
      2: { label: '2', detail: 'Meibum turbio con concreciones' },
      3: { label: '3', detail: 'Meibum dentífrico' },
    },
    mgdInvalid: 'Selecciona un aspecto para ambos ojos.',
    expHint:
      'Elige cuántas glándulas son expresables en cada ojo según la escala 0 a 3.',
    expColLabel: 'Expresividad glandular',
    expGrades: {
      0: { label: '0', detail: '5 glándulas expresables' },
      1: { label: '1', detail: '3-4 glándulas expresables' },
      2: { label: '2', detail: '1-2 glándulas expresables' },
      3: { label: '3', detail: 'Ninguna glándula expresable' },
    },
    expInvalid: 'Selecciona la expresividad para ambos ojos.',
    steps: {
      tbut: 'Tiempo de ruptura de película lagrimal',
      schirmer: 'Schirmer test',
      staining: 'Tinción de la superficie',
      meibomianFunction: 'Aspecto del Meibum',
      meibomianExpressivity: 'Expresividad de las glándulas de Meibomio',
      meibomianFindings: 'Hallazgos clínicos de las glándulas de Meibomio',
      otherCriteria: 'Otros criterios «Plus»',
    },
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    protocolName: 'Blink Protocol',
    sectionTitle: 'Physical examination',
    next: 'Next',
    back: 'Back',
    close: 'Close',
    confirm: 'Save',
    confirmStub: 'Mark as completed',
    incompleteHint: 'Complete all steps (green) to continue.',
    stubHint:
      'Data for this exam will be captured here. For now you can mark it as completed to continue the flow.',
    tbutHint:
      'Record tear break-up time (TBUT) in seconds for each eye. Typical values: ≥10 s normal; <10 s suggests instability.',
    tbutOd: 'OD (right eye)',
    tbutOs: 'OS (left eye)',
    tbutUnit: 'seconds',
    tbutInvalid: 'Enter a value between 0 and 60 seconds for both eyes.',
    schirmerHint:
      'Record the Schirmer test in millimeters for each eye (strip wetting).',
    schirmerOd: 'OD (right eye)',
    schirmerOs: 'OS (left eye)',
    schirmerUnit: 'millimeters',
    schirmerInvalid: 'Enter a value between 0 and 40 mm for both eyes.',
    mgdHint: 'Choose the option that best describes meibum appearance in each eye.',
    mgdOd: 'Right eye',
    mgdOs: 'Left eye',
    mgdColGrade: 'Grade',
    mgdColAspect: 'Meibum appearance',
    mgdGrades: {
      0: { label: '0', detail: 'Clear meibum' },
      1: { label: '1', detail: 'Cloudy meibum' },
      2: { label: '2', detail: 'Cloudy meibum with concretions' },
      3: { label: '3', detail: 'Toothpaste-like meibum' },
    },
    mgdInvalid: 'Select an appearance for both eyes.',
    expHint: 'Choose how many glands are expressible in each eye on the 0 to 3 scale.',
    expColLabel: 'Glandular expressivity',
    expGrades: {
      0: { label: '0', detail: '5 expressible glands' },
      1: { label: '1', detail: '3-4 expressible glands' },
      2: { label: '2', detail: '1-2 expressible glands' },
      3: { label: '3', detail: 'No expressible glands' },
    },
    expInvalid: 'Select expressivity for both eyes.',
    steps: {
      tbut: 'Tear film break-up time',
      schirmer: 'Schirmer test',
      staining: 'Ocular surface staining',
      meibomianFunction: 'Meibum appearance',
      meibomianExpressivity: 'Meibomian gland expressivity',
      meibomianFindings: 'Meibomian gland clinical findings',
      otherCriteria: 'Other «Plus» criteria',
    },
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    protocolName: 'Protocolo Piscar',
    sectionTitle: 'Exploração física',
    next: 'Seguinte',
    back: 'Voltar',
    close: 'Fechar',
    confirm: 'Salvar',
    confirmStub: 'Marcar como concluído',
    incompleteHint: 'Conclua todos os passos (verde) para seguir.',
    stubHint:
      'Aqui serão capturados os dados deste exame. Por enquanto você pode marcá-lo como concluído para seguir o fluxo.',
    tbutHint:
      'Registre o tempo de ruptura (TBUT) em segundos para cada olho. Valores típicos: ≥10 s normal; <10 s sugere instabilidade.',
    tbutOd: 'OD (olho direito)',
    tbutOs: 'OS (olho esquerdo)',
    tbutUnit: 'segundos',
    tbutInvalid: 'Informe um valor entre 0 e 60 segundos para ambos os olhos.',
    schirmerHint:
      'Registre o teste de Schirmer em milímetros para cada olho (umedecimento da tira).',
    schirmerOd: 'OD (olho direito)',
    schirmerOs: 'OS (olho esquerdo)',
    schirmerUnit: 'milímetros',
    schirmerInvalid: 'Informe um valor entre 0 e 40 mm para ambos os olhos.',
    mgdHint:
      'Escolha a opção que melhor descreve o aspecto do meibum em cada olho.',
    mgdOd: 'Olho direito',
    mgdOs: 'Olho esquerdo',
    mgdColGrade: 'Grau',
    mgdColAspect: 'Aspecto do Meibum',
    mgdGrades: {
      0: { label: '0', detail: 'Meibum claro' },
      1: { label: '1', detail: 'Meibum turvo' },
      2: { label: '2', detail: 'Meibum turvo com concreções' },
      3: { label: '3', detail: 'Meibum dentifrício' },
    },
    mgdInvalid: 'Selecione um aspecto para ambos os olhos.',
    expHint:
      'Escolha quantas glândulas são expressáveis em cada olho na escala de 0 a 3.',
    expColLabel: 'Expressividade glandular',
    expGrades: {
      0: { label: '0', detail: '5 glândulas expressáveis' },
      1: { label: '1', detail: '3-4 glândulas expressáveis' },
      2: { label: '2', detail: '1-2 glândulas expressáveis' },
      3: { label: '3', detail: 'Nenhuma glândula expressável' },
    },
    expInvalid: 'Selecione a expressividade para ambos os olhos.',
    steps: {
      tbut: 'Tempo de ruptura do filme lacrimal',
      schirmer: 'Teste de Schirmer',
      staining: 'Coloração da superfície',
      meibomianFunction: 'Aspecto do Meibum',
      meibomianExpressivity: 'Expressividade das glândulas de Meibômio',
      meibomianFindings: 'Achados clínicos das glândulas de Meibômio',
      otherCriteria: 'Outros critérios «Plus»',
    },
  },
}
