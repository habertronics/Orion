import type { Lang } from './preferences'

export type PlusCriterionId =
  | 'irreversibleDamage'
  | 'schirmerZero'
  | 'lagophthalmos'
  | 'symblepharon'
  | 'cornealAnesthesia'
  | 'keratinization'

export type PlusCriteriaResult = Record<PlusCriterionId, boolean>

export const PLUS_CRITERIA: PlusCriterionId[] = [
  'irreversibleDamage',
  'schirmerZero',
  'lagophthalmos',
  'symblepharon',
  'cornealAnesthesia',
  'keratinization',
]

export function emptyPlusCriteria(): PlusCriteriaResult {
  return {
    irreversibleDamage: false,
    schirmerZero: false,
    lagophthalmos: false,
    symblepharon: false,
    cornealAnesthesia: false,
    keratinization: false,
  }
}

export function countPlusCriteria(result: PlusCriteriaResult): number {
  return PLUS_CRITERIA.reduce((n, id) => n + Number(result[id]), 0)
}

export const plusCopy: Record<
  Lang,
  {
    title: string
    intro: string
    hint: string
    save: string
    schirmerAuto: string
    items: Record<PlusCriterionId, string>
  }
> = {
  es: {
    title: 'LUBOS-IV Plus',
    intro: 'LUBOS-III, más cualquiera de estos criterios:',
    hint: 'Marca solo los criterios presentes. Si no aplica ninguno, guarda vacío.',
    save: 'Guardar criterios',
    schirmerAuto: 'Marcado automáticamente porque el Schirmer fue 0 mm en al menos un ojo.',
    items: {
      irreversibleDamage: 'Daño irreversible de la superficie ocular.',
      schirmerZero: 'Test de Schirmer: I = 0 mm/5 minutos en al menos un ojo.',
      lagophthalmos:
        'Lagoftalmos con erosión epitelial o defecto epitelial.',
      symblepharon:
        'Formación de simbléfaron que afecta más de la mitad de la superficie corneal.',
      cornealAnesthesia: 'Anestesia corneal.',
      keratinization: 'Queratinización de la superficie corneal >50%.',
    },
  },
  en: {
    title: 'LUBOS-IV Plus',
    intro: 'LUBOS-III, plus any of these criteria:',
    hint: 'Check only present criteria. If none apply, save empty.',
    save: 'Save criteria',
    schirmerAuto:
      'Checked automatically because Schirmer was 0 mm in at least one eye.',
    items: {
      irreversibleDamage: 'Irreversible ocular surface damage.',
      schirmerZero: 'Schirmer test: I = 0 mm/5 minutes in at least one eye.',
      lagophthalmos: 'Lagophthalmos with epithelial erosion or epithelial defect.',
      symblepharon:
        'Symblepharon formation affecting more than half of the corneal surface.',
      cornealAnesthesia: 'Corneal anesthesia.',
      keratinization: 'Keratinization of the corneal surface >50%.',
    },
  },
  pt: {
    title: 'LUBOS-IV Plus',
    intro: 'LUBOS-III, mais qualquer um destes critérios:',
    hint: 'Marque apenas os critérios presentes. Se nenhum se aplicar, salve vazio.',
    save: 'Salvar critérios',
    schirmerAuto:
      'Marcado automaticamente porque o Schirmer foi 0 mm em pelo menos um olho.',
    items: {
      irreversibleDamage: 'Dano irreversível da superfície ocular.',
      schirmerZero: 'Teste de Schirmer: I = 0 mm/5 minutos em pelo menos um olho.',
      lagophthalmos: 'Lagoftalmo com erosão epitelial ou defeito epitelial.',
      symblepharon:
        'Formação de simbléfaro que afeta mais da metade da superfície corneana.',
      cornealAnesthesia: 'Anestesia corneana.',
      keratinization: 'Ceratinização da superfície corneana >50%.',
    },
  },
}
