import type { Lang } from './preferences'
import type { Osdi6Result } from '../lib/osdi6'

export type SexOption = 'female' | 'male' | 'other' | 'prefer_not'
export type YesNo = 'yes' | 'no'
export type NonLubeTreatment = 'ipl' | 'thermal' | 'other' | 'none'
export type Osdi6Frequency = 0 | 1 | 2 | 3 | 4

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

export type LocationChoice = {
  lat: number
  lng: number
  accuracy: number
  capturedAt: string
  source: 'device' | 'geocoded'
  sameLocality: boolean
  label?: string
  placeId?: number
}

export type ParpadeoInterrogatorioState = {
  age: number | null
  sex: SexOption | null
  dryEyeDiagnosis: YesNo | null
  nonLubeTreatment: NonLubeTreatment | null
  usingLubricant: YesNo | null
  osdi6Done: boolean
  osdi6: Osdi6Result | null
  locationAccepted: boolean
  location: LocationChoice | null
  environment: EnvironmentSnapshot | null
}

export const emptyInterrogatorio = (): ParpadeoInterrogatorioState => ({
  age: null,
  sex: null,
  dryEyeDiagnosis: null,
  nonLubeTreatment: null,
  usingLubricant: null,
  osdi6Done: false,
  osdi6: null,
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
    osdi6Credit: string
    osdi6Confirm: string
    osdi6Total: string
    osdi6PossibleDryEye: string
    osdi6UnlikelyDryEye: string
    osdi6Normal: string
    osdi6DryEye: string
    osdi6SubDiscomfort: string
    osdi6SubFunction: string
    osdi6SubEnvironment: string
    osdi6Frequency: Record<Osdi6Frequency, string>
    osdi6Sections: [string, string, string]
    osdi6Questions: [string, string, string, string, string, string]
    locationTitle: string
    locationSameQuestion: string
    locationSameHint: string
    locationGpsBody: string
    locationAccept: string
    locationCityTitle: string
    locationCityHint: string
    locationCityPlaceholder: string
    locationCityEmpty: string
    locationSearching: string
    locationDenied: string
    locationError: string
    locationWeatherError: string
    locationCapturing: string
    locationPlaceSelected: string
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
      location: 'Localidad',
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
    osdi6Credit:
      'Pult & Wolffsohn. Traducción: Benítez-del-Castillo. Posible ojo seco si la suma ≥ 4.',
    osdi6Confirm: 'Guardar OSDI-6',
    osdi6Total: 'Suma total',
    osdi6PossibleDryEye: 'Posible ojo seco (suma ≥ 4)',
    osdi6UnlikelyDryEye: 'Normal (suma < 4)',
    osdi6Normal: 'Normal',
    osdi6DryEye: 'Ojo seco',
    osdi6SubDiscomfort: 'Puntuación subescala malestar ocular y alteraciones visuales',
    osdi6SubFunction: 'Puntuación subescala función visual / tareas',
    osdi6SubEnvironment: 'Puntuación subescala ambiental',
    osdi6Frequency: {
      4: 'Constantemente',
      3: 'Con mucha frecuencia',
      2: 'A menudo',
      1: 'Alguna vez',
      0: 'Nunca',
    },
    osdi6Sections: [
      '¿Ha experimentado usted alguno de los siguientes síntomas durante un día normal del último mes?',
      '¿Los problemas oculares han limitado su actividad en alguna de estas tareas durante un día normal del último mes?',
      '¿Le han molestado los ojos en alguna de las siguientes situaciones durante un día normal del último mes?',
    ],
    osdi6Questions: [
      '¿Ojos sensibles a la luz?',
      '¿Visión borrosa entre parpadeos, con su corrección óptica?',
      '¿Conducir o ser llevado en coche por la noche?',
      '¿Ver la TV, o tarea similar?',
      '¿Situaciones de viento?',
      '¿Lugares o zonas con baja humedad?',
    ],
    locationTitle: 'Localidad del paciente',
    locationSameQuestion:
      '¿La persona es de la misma localidad donde se realiza la exploración?',
    locationSameHint:
      'Si responde Sí, usamos la ubicación aproximada del dispositivo (consultorio). Si responde No, busca la ciudad del paciente.',
    locationGpsBody:
      'Se usará la localización aproximada del dispositivo. La precisión típica no es mejor que ~500 m. Sirve para estimar temperatura, humedad, presión, UV y calidad del aire de la zona.',
    locationAccept: 'Obtener ubicación + clima',
    locationCityTitle: 'Ciudad o localidad del paciente',
    locationCityHint:
      'Escribe el nombre de la ciudad. Aparecerán opciones (p. ej. Cuzco, Perú / Bolivia).',
    locationCityPlaceholder: 'Ej. Cuzco, Chicago, Madrid…',
    locationCityEmpty: 'Escribe al menos 2 letras para buscar.',
    locationSearching: 'Buscando ciudades…',
    locationDenied: 'Permiso denegado. Actívalo en el navegador para continuar.',
    locationError: 'No se pudo obtener la ubicación. Intenta de nuevo.',
    locationWeatherError:
      'Ubicación OK, pero no se pudo obtener el clima. Revisa Open-Meteo en Render.',
    locationCapturing: 'Obteniendo datos ambientales…',
    locationPlaceSelected: 'Ciudad seleccionada',
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
      location: 'Locality',
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
    osdi6Credit:
      'Pult & Wolffsohn. Possible dry eye if total score ≥ 4.',
    osdi6Confirm: 'Save OSDI-6',
    osdi6Total: 'Total score',
    osdi6PossibleDryEye: 'Possible dry eye (score ≥ 4)',
    osdi6UnlikelyDryEye: 'Normal (score < 4)',
    osdi6Normal: 'Normal',
    osdi6DryEye: 'Dry eye',
    osdi6SubDiscomfort: 'Ocular discomfort / visual disturbance subscale score',
    osdi6SubFunction: 'Visual function / tasks subscale score',
    osdi6SubEnvironment: 'Environmental subscale score',
    osdi6Frequency: {
      4: 'All of the time',
      3: 'Most of the time',
      2: 'Often',
      1: 'Some of the time',
      0: 'None of the time',
    },
    osdi6Sections: [
      'Have you experienced any of the following symptoms during a typical day in the last month?',
      'Have eye problems limited you in performing any of these tasks during a typical day in the last month?',
      'Have your eyes been bothered by any of the following during a typical day in the last month?',
    ],
    osdi6Questions: [
      'Eyes that are sensitive to light?',
      'Blurred vision between blinks, with your optical correction?',
      'Driving or being driven at night?',
      'Watching TV or a similar task?',
      'Windy conditions?',
      'Places or areas with low humidity?',
    ],
    locationTitle: 'Patient locality',
    locationSameQuestion:
      'Is the person from the same locality where the examination is taking place?',
    locationSameHint:
      'If Yes, we use the device approximate location (clinic). If No, search for the patient’s city.',
    locationGpsBody:
      'The device approximate location will be used. Typical accuracy is no better than ~500 m. It estimates temperature, humidity, pressure, UV, and air quality for the area.',
    locationAccept: 'Get location + weather',
    locationCityTitle: 'Patient city or locality',
    locationCityHint:
      'Type the city name. Matching options will appear (e.g. Cusco, Peru / Bolivia).',
    locationCityPlaceholder: 'E.g. Cusco, Chicago, Madrid…',
    locationCityEmpty: 'Type at least 2 letters to search.',
    locationSearching: 'Searching cities…',
    locationDenied: 'Permission denied. Enable it in the browser to continue.',
    locationError: 'Could not get location. Please try again.',
    locationWeatherError:
      'Location OK, but weather could not be fetched. Check Open-Meteo on Render.',
    locationCapturing: 'Getting environmental data…',
    locationPlaceSelected: 'City selected',
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
      location: 'Localidade',
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
    osdi6Credit:
      'Pult & Wolffsohn. Possível olho seco se a soma ≥ 4.',
    osdi6Confirm: 'Salvar OSDI-6',
    osdi6Total: 'Soma total',
    osdi6PossibleDryEye: 'Possível olho seco (soma ≥ 4)',
    osdi6UnlikelyDryEye: 'Normal (soma < 4)',
    osdi6Normal: 'Normal',
    osdi6DryEye: 'Olho seco',
    osdi6SubDiscomfort: 'Pontuação subescala desconforto ocular e alterações visuais',
    osdi6SubFunction: 'Pontuação subescala função visual / tarefas',
    osdi6SubEnvironment: 'Pontuação subescala ambiental',
    osdi6Frequency: {
      4: 'Constantemente',
      3: 'Com muita frequência',
      2: 'Frequentemente',
      1: 'Às vezes',
      0: 'Nunca',
    },
    osdi6Sections: [
      'Você experimentou algum dos seguintes sintomas durante um dia normal do último mês?',
      'Os problemas oculares limitaram sua atividade em alguma destas tarefas durante um dia normal do último mês?',
      'Seus olhos incomodaram em alguma das seguintes situações durante um dia normal do último mês?',
    ],
    osdi6Questions: [
      'Olhos sensíveis à luz?',
      'Visão borrada entre piscadas, com sua correção óptica?',
      'Dirigir ou ser levado de carro à noite?',
      'Ver TV ou tarefa semelhante?',
      'Situações de vento?',
      'Lugares ou zonas com baixa umidade?',
    ],
    locationTitle: 'Localidade do paciente',
    locationSameQuestion:
      'A pessoa é da mesma localidade onde a exploração está sendo feita?',
    locationSameHint:
      'Se Sim, usamos a localização aproximada do dispositivo (consultório). Se Não, busque a cidade do paciente.',
    locationGpsBody:
      'Será usada a localização aproximada do dispositivo. A precisão típica não é melhor que ~500 m. Serve para estimar temperatura, umidade, pressão, UV e qualidade do ar da região.',
    locationAccept: 'Obter localização + clima',
    locationCityTitle: 'Cidade ou localidade do paciente',
    locationCityHint:
      'Digite o nome da cidade. Opções aparecerão (ex.: Cusco, Peru / Bolívia).',
    locationCityPlaceholder: 'Ex.: Cusco, Chicago, Madrid…',
    locationCityEmpty: 'Digite pelo menos 2 letras para buscar.',
    locationSearching: 'Buscando cidades…',
    locationDenied: 'Permissão negada. Ative-a no navegador para continuar.',
    locationError: 'Não foi possível obter a localização. Tente de novo.',
    locationWeatherError:
      'Localização OK, mas o clima falhou. Revise o Open-Meteo no Render.',
    locationCapturing: 'Obtendo dados ambientais…',
    locationPlaceSelected: 'Cidade selecionada',
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
    state.osdi6 !== null &&
    state.locationAccepted &&
    state.location !== null &&
    state.environment !== null
  )
}
