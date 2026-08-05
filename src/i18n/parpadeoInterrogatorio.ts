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
    osdi6Hint:
      'Aquí irá el cuestionario OSDI-6 completo. Por ahora puedes marcarlo como terminado para continuar el flujo.',
    osdi6Done: 'Marcar OSDI-6 como completado',
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
    osdi6Hint:
      'The full OSDI-6 questionnaire will go here. For now you can mark it as done to continue the flow.',
    osdi6Done: 'Mark OSDI-6 as completed',
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
    osdi6Hint:
      'Aqui ficará o OSDI-6 completo. Por enquanto você pode marcá-lo como concluído para seguir o fluxo.',
    osdi6Done: 'Marcar OSDI-6 como concluído',
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
    state.locationAccepted &&
    state.location !== null &&
    state.environment !== null
  )
}
