import type { Lang } from './preferences'

export type SexOption = 'female' | 'male' | 'other' | 'prefer_not'
export type YesNo = 'yes' | 'no'
export type NonLubeTreatment = 'ipl' | 'thermal' | 'other' | 'none'

export type EnvironmentSnapshot = {
  source: string
  capturedAt: string
  lat: number
  lng: number
  weather: {
    temperatureC: number | null
    humidityPct: number | null
    pressureMslHpa: number | null
    surfacePressureHpa: number | null
    uvIndex: number | null
    windSpeedKmh: number | null
  }
  air: {
    pm25: number | null
    pm10: number | null
    dust: number | null
    ozone: number | null
    nitrogenDioxide: number | null
    europeanAqi: number | null
    usAqi: number | null
  }
}

export type ParpadeoInterrogatorioState = {
  age: number | null
  sex: SexOption | null
  dryEyeDiagnosis: YesNo | null
  nonLubeTreatment: NonLubeTreatment | null
  usingLubricant: YesNo | null
  osdi6Done: boolean
  locationAccepted: boolean
  location:
    | {
        lat: number
        lng: number
        accuracy: number
        capturedAt: string
      }
    | null
  environment: EnvironmentSnapshot | null
}

export const emptyInterrogatorio = (): ParpadeoInterrogatorioState => ({
  age: null,
  sex: null,
  dryEyeDiagnosis: null,
  nonLubeTreatment: null,
  usingLubricant: null,
  osdi6Done: false,
  locationAccepted: false,
  location: null,
  environment: null,
})

export const interrogatorioCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    protocolName: string
    sectionTitle: string
    next: string
    back: string
    confirm: string
    close: string
    steps: {
      age: string
      sex: string
      diagnosis: string
      treatment: string
      lubricant: string
      osdi6: string
      location: string
    }
    ageLabel: string
    ageHint: string
    sexOptions: Record<SexOption, string>
    yes: string
    no: string
    treatmentOptions: Record<Exclude<NonLubeTreatment, 'none'>, string>
    treatmentNone: string
    osdi6Title: string
    osdi6Hint: string
    osdi6Done: string
    locationTitle: string
    locationBody: string
    locationAccept: string
    locationDenied: string
    locationError: string
    locationCapturing: string
    incompleteHint: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    protocolName: 'Protocolo Parpadeo',
    sectionTitle: 'Interrogatorio',
    next: 'Siguiente',
    back: 'Volver',
    confirm: 'Confirmar',
    close: 'Cerrar',
    steps: {
      age: 'Edad',
      sex: 'Sexo',
      diagnosis: 'Diagnóstico de ojo seco',
      treatment: 'Tratamiento (no lubricante)',
      lubricant: '¿Usa lubricante?',
      osdi6: 'OSDI-6',
      location: 'Ubicación aproximada',
    },
    ageLabel: 'Edad del paciente (años)',
    ageHint: 'Elige la edad y confirma.',
    sexOptions: {
      female: 'Mujer',
      male: 'Hombre',
      other: 'Otro',
      prefer_not: 'Prefiero no decir',
    },
    yes: 'Sí',
    no: 'No',
    treatmentOptions: {
      ipl: 'Luz pulsada (IPL)',
      thermal: 'Terapia térmica',
      other: 'Otra',
    },
    treatmentNone: 'Ninguno',
    osdi6Title: 'Cuestionario OSDI-6',
    osdi6Hint:
      'Aquí irá el cuestionario OSDI-6 completo. Por ahora puedes marcarlo como terminado para continuar el flujo.',
    osdi6Done: 'Marcar OSDI-6 como completado',
    locationTitle: 'Ubicación aproximada',
    locationBody:
      'Acepto utilizar la localización aproximada actual. La precisión típica no es mejor que ~500 m: no sabemos la dirección exacta. Se usa para estimar temperatura, humedad, presión atmosférica, UV y calidad del aire de la zona.',
    locationAccept: 'Acepto y obtener ubicación + clima',
    locationDenied: 'Permiso denegado. Actívalo en el navegador para continuar.',
    locationError: 'No se pudo obtener la ubicación. Intenta de nuevo.',
    locationCapturing: 'Obteniendo ubicación y datos ambientales…',
    incompleteHint: 'Completa todos los pasos (verde) para continuar.',
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    protocolName: 'Blink Protocol',
    sectionTitle: 'Questionnaire',
    next: 'Next',
    back: 'Back',
    confirm: 'Confirm',
    close: 'Close',
    steps: {
      age: 'Age',
      sex: 'Sex',
      diagnosis: 'Dry eye diagnosis',
      treatment: 'Treatment (non-lubricant)',
      lubricant: 'Using lubricant?',
      osdi6: 'OSDI-6',
      location: 'Approximate location',
    },
    ageLabel: 'Patient age (years)',
    ageHint: 'Choose the age and confirm.',
    sexOptions: {
      female: 'Female',
      male: 'Male',
      other: 'Other',
      prefer_not: 'Prefer not to say',
    },
    yes: 'Yes',
    no: 'No',
    treatmentOptions: {
      ipl: 'Pulsed light (IPL)',
      thermal: 'Thermal therapy',
      other: 'Other',
    },
    treatmentNone: 'None',
    osdi6Title: 'OSDI-6 questionnaire',
    osdi6Hint:
      'The full OSDI-6 questionnaire will go here. For now you can mark it as done to continue the flow.',
    osdi6Done: 'Mark OSDI-6 as completed',
    locationTitle: 'Approximate location',
    locationBody:
      'I agree to use the current approximate location. Typical accuracy is no better than ~500 m: we do not know the exact address. It is used to estimate temperature, humidity, atmospheric pressure, UV, and air quality for the area.',
    locationAccept: 'Agree and get location + weather',
    locationDenied: 'Permission denied. Enable it in the browser to continue.',
    locationError: 'Could not get location. Please try again.',
    locationCapturing: 'Getting location and environmental data…',
    incompleteHint: 'Complete all steps (green) to continue.',
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    protocolName: 'Protocolo Piscar',
    sectionTitle: 'Questionário',
    next: 'Seguinte',
    back: 'Voltar',
    confirm: 'Confirmar',
    close: 'Fechar',
    steps: {
      age: 'Idade',
      sex: 'Sexo',
      diagnosis: 'Diagnóstico de olho seco',
      treatment: 'Tratamento (não lubrificante)',
      lubricant: 'Usa lubrificante?',
      osdi6: 'OSDI-6',
      location: 'Localização aproximada',
    },
    ageLabel: 'Idade do paciente (anos)',
    ageHint: 'Escolha a idade e confirme.',
    sexOptions: {
      female: 'Mulher',
      male: 'Homem',
      other: 'Outro',
      prefer_not: 'Prefiro não dizer',
    },
    yes: 'Sim',
    no: 'Não',
    treatmentOptions: {
      ipl: 'Luz pulsada (IPL)',
      thermal: 'Terapia térmica',
      other: 'Outra',
    },
    treatmentNone: 'Nenhum',
    osdi6Title: 'Questionário OSDI-6',
    osdi6Hint:
      'Aqui ficará o OSDI-6 completo. Por enquanto você pode marcá-lo como concluído para seguir o fluxo.',
    osdi6Done: 'Marcar OSDI-6 como concluído',
    locationTitle: 'Localização aproximada',
    locationBody:
      'Aceito utilizar a localização aproximada atual. A precisão típica não é melhor que ~500 m: não sabemos o endereço exato. Serve para estimar temperatura, umidade, pressão atmosférica, UV e qualidade do ar da região.',
    locationAccept: 'Aceito e obter localização + clima',
    locationDenied: 'Permissão negada. Ative-a no navegador para continuar.',
    locationError: 'Não foi possível obter a localização. Tente de novo.',
    locationCapturing: 'Obtendo localização e dados ambientais…',
    incompleteHint: 'Conclua todos os passos (verde) para seguir.',
  },
}

export function isInterrogatorioComplete(
  state: ParpadeoInterrogatorioState,
): boolean {
  return (
    state.age !== null &&
    state.sex !== null &&
    state.dryEyeDiagnosis !== null &&
    state.nonLubeTreatment !== null &&
    state.usingLubricant !== null &&
    state.osdi6Done &&
    state.locationAccepted &&
    state.location !== null &&
    state.environment !== null
  )
}
