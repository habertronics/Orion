import type { Lang } from './preferences'

export type ExamStepId =
  | 'tbut'
  | 'schirmer'
  | 'staining'
  | 'meibomianFunction'
  | 'meibomianFindings'
  | 'otherCriteria'

export type TbutResult = {
  odSec: number
  osSec: number
}

export type ParpadeoExamState = {
  tbut: TbutResult | null
  schirmer: boolean
  staining: boolean
  meibomianFunction: boolean
  meibomianFindings: boolean
  otherCriteria: boolean
}

export const EXAM_STEPS: ExamStepId[] = [
  'tbut',
  'schirmer',
  'staining',
  'meibomianFunction',
  'meibomianFindings',
  'otherCriteria',
]

export const emptyExamState = (): ParpadeoExamState => ({
  tbut: null,
  schirmer: false,
  staining: false,
  meibomianFunction: false,
  meibomianFindings: false,
  otherCriteria: false,
})

export function isExamStepDone(
  state: ParpadeoExamState,
  id: ExamStepId,
): boolean {
  if (id === 'tbut') return state.tbut !== null
  return state[id]
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
    steps: {
      tbut: 'Tiempo de ruptura de película lagrimal',
      schirmer: 'Schirmer test',
      staining: 'Tinción de la superficie',
      meibomianFunction: 'Funcionalidad de las glándulas de Meibomio',
      meibomianFindings: 'Hallazgos clínicos de las glándulas de Meibomio',
      otherCriteria: 'Otros criterios',
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
    steps: {
      tbut: 'Tear film break-up time',
      schirmer: 'Schirmer test',
      staining: 'Ocular surface staining',
      meibomianFunction: 'Meibomian gland function',
      meibomianFindings: 'Meibomian gland clinical findings',
      otherCriteria: 'Other criteria',
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
    steps: {
      tbut: 'Tempo de ruptura do filme lacrimal',
      schirmer: 'Teste de Schirmer',
      staining: 'Coloração da superfície',
      meibomianFunction: 'Funcionalidade das glândulas de Meibômio',
      meibomianFindings: 'Achados clínicos das glândulas de Meibômio',
      otherCriteria: 'Outros critérios',
    },
  },
}
