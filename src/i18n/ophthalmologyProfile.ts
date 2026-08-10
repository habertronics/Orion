import type { Lang } from './preferences'

export const SPECIALTY_IDS = [
  'cornea',
  'refractive',
  'cataract',
  'glaucoma',
  'retina',
  'uvea',
  'pediatric',
  'oculoplastics',
  'neuro',
  'oncology',
  'lowVision',
  'pathology',
  'other',
] as const

export type SpecialtyId = (typeof SPECIALTY_IDS)[number]

export type OphthalmologyProfile = 'general' | 'specialty'

export function isSpecialtyId(value: string): value is SpecialtyId {
  return (SPECIALTY_IDS as readonly string[]).includes(value)
}

export const specialtyCopy: Record<
  Lang,
  {
    sectionTitle: string
    general: string
    specialty: string
    chooseSpecialty: string
    otherPlaceholder: string
    items: Record<SpecialtyId, string>
  }
> = {
  es: {
    sectionTitle: 'Perfil oftalmológico',
    general: 'Soy oftalmólogo general',
    specialty: 'Cuento con una alta especialidad',
    chooseSpecialty: 'Elige tu alta especialidad',
    otherPlaceholder: 'Especifica tu especialidad',
    items: {
      cornea: 'Córnea y enfermedades externas',
      refractive: 'Cirugía refractiva',
      cataract: 'Catarata y segmento anterior',
      glaucoma: 'Glaucoma',
      retina: 'Retina y vítreo',
      uvea: 'Úvea e inflamación ocular',
      pediatric: 'Oftalmología pediátrica y estrabismo',
      oculoplastics: 'Órbita, párpados y vías lagrimales —oculoplástica—',
      neuro: 'Neurooftalmología',
      oncology: 'Oncología ocular',
      lowVision: 'Baja visión y rehabilitación visual',
      pathology: 'Patología y genética oftálmica',
      other: 'Otra',
    },
  },
  en: {
    sectionTitle: 'Ophthalmology profile',
    general: 'I am a general ophthalmologist',
    specialty: 'I have a subspecialty',
    chooseSpecialty: 'Choose your subspecialty',
    otherPlaceholder: 'Specify your specialty',
    items: {
      cornea: 'Cornea and external disease',
      refractive: 'Refractive surgery',
      cataract: 'Cataract and anterior segment',
      glaucoma: 'Glaucoma',
      retina: 'Retina and vitreous',
      uvea: 'Uvea and ocular inflammation',
      pediatric: 'Pediatric ophthalmology and strabismus',
      oculoplastics: 'Orbit, eyelids and lacrimal pathways —oculoplastics—',
      neuro: 'Neuro-ophthalmology',
      oncology: 'Ocular oncology',
      lowVision: 'Low vision and visual rehabilitation',
      pathology: 'Ophthalmic pathology and genetics',
      other: 'Other',
    },
  },
  pt: {
    sectionTitle: 'Perfil oftalmológico',
    general: 'Sou oftalmologista geral',
    specialty: 'Tenho uma alta especialidade',
    chooseSpecialty: 'Escolha sua alta especialidade',
    otherPlaceholder: 'Especifique sua especialidade',
    items: {
      cornea: 'Córnea e doenças externas',
      refractive: 'Cirurgia refrativa',
      cataract: 'Catarata e segmento anterior',
      glaucoma: 'Glaucoma',
      retina: 'Retina e vítreo',
      uvea: 'Úvea e inflamação ocular',
      pediatric: 'Oftalmologia pediátrica e estrabismo',
      oculoplastics: 'Órbita, pálpebras e vias lacrimais —oculoplástica—',
      neuro: 'Neuroftalmologia',
      oncology: 'Oncologia ocular',
      lowVision: 'Baixa visão e reabilitação visual',
      pathology: 'Patologia e genética oftálmica',
      other: 'Outra',
    },
  },
}
