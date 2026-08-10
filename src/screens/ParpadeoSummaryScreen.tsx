import type { Lang } from '../i18n/preferences'
import {
  interrogatorioCopy,
  type ParpadeoInterrogatorioState,
} from '../i18n/parpadeoInterrogatorio'
import './ParpadeoSummaryScreen.css'

const copy: Record<
  Lang,
  {
    brand: string
    title: string
    saved: string
    notSaved: string
    sectionAnswers: string
    sectionOsdi: string
    sectionLocation: string
    sectionEnvironment: string
    sameLocality: string
    locationSourceDevice: string
    locationSourceGeocoded: string
    locationSourceSkipped: string
    locationSkipped: string
    locationCoords: string
    locationSource: string
    locationCountry: string
    locationState: string
    locationLocality: string
    environmentSkipped: string
    osdiAnswers: string
    osdiSubDiscomfort: string
    osdiSubFunction: string
    osdiSubEnvironment: string
    osdiPossible: string
    osdiNormal: string
    temp: string
    humidity: string
    pressure: string
    surfacePressure: string
    uv: string
    wind: string
    pm25: string
    pm10: string
    dust: string
    ozone: string
    no2: string
    aqiEu: string
    aqiUs: string
    next: string
    back: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    title: 'Datos capturados',
    saved: 'Guardado en la base de datos (Neon).',
    notSaved: 'No se pudo guardar en Neon. Revisa la API.',
    sectionAnswers: 'Interrogatorio',
    sectionOsdi: 'OSDI-6',
    sectionLocation: 'Localidad',
    sectionEnvironment: 'Ambiente',
    sameLocality: 'Misma localidad que la exploración',
    locationSourceDevice: 'GPS del dispositivo',
    locationSourceGeocoded: 'Ciudad buscada',
    locationSourceSkipped: 'Omitido',
    locationSkipped: 'Continuar sin este dato',
    locationCoords: 'Coordenadas',
    locationSource: 'Fuente',
    locationCountry: 'País',
    locationState: 'Estado',
    locationLocality: 'Comunidad',
    environmentSkipped: 'Sin dato ambiental',
    osdiAnswers: 'Respuestas (ítems 1–6)',
    osdiSubDiscomfort: 'Subescala malestar / visión',
    osdiSubFunction: 'Subescala función / tareas',
    osdiSubEnvironment: 'Subescala ambiental',
    osdiPossible: 'Posible ojo seco (suma ≥ 4)',
    osdiNormal: 'Normal (suma < 4)',
    temp: 'Temperatura',
    humidity: 'Humedad relativa',
    pressure: 'Presión (msl)',
    surfacePressure: 'Presión superficie',
    uv: 'Índice UV',
    wind: 'Viento',
    pm25: 'PM2.5',
    pm10: 'PM10',
    dust: 'Polvo',
    ozone: 'Ozono',
    no2: 'NO₂',
    aqiEu: 'AQI europeo',
    aqiUs: 'AQI EE.UU.',
    next: 'Continuar',
    back: 'Volver',
  },
  en: {
    brand: 'Habertronic Orión',
    title: 'Captured data',
    saved: 'Saved to the database (Neon).',
    notSaved: 'Could not save to Neon. Check the API.',
    sectionAnswers: 'Questionnaire',
    sectionOsdi: 'OSDI-6',
    sectionLocation: 'Locality',
    sectionEnvironment: 'Environment',
    sameLocality: 'Same locality as the examination',
    locationSourceDevice: 'Device GPS',
    locationSourceGeocoded: 'Searched city',
    locationSourceSkipped: 'Skipped',
    locationSkipped: 'Continued without this data',
    locationCoords: 'Coordinates',
    locationSource: 'Source',
    locationCountry: 'Country',
    locationState: 'State / region',
    locationLocality: 'Community',
    environmentSkipped: 'No environmental data',
    osdiAnswers: 'Answers (items 1–6)',
    osdiSubDiscomfort: 'Discomfort / vision subscale',
    osdiSubFunction: 'Function / tasks subscale',
    osdiSubEnvironment: 'Environmental subscale',
    osdiPossible: 'Possible dry eye (score ≥ 4)',
    osdiNormal: 'Normal (score < 4)',
    temp: 'Temperature',
    humidity: 'Relative humidity',
    pressure: 'Pressure (msl)',
    surfacePressure: 'Surface pressure',
    uv: 'UV index',
    wind: 'Wind',
    pm25: 'PM2.5',
    pm10: 'PM10',
    dust: 'Dust',
    ozone: 'Ozone',
    no2: 'NO₂',
    aqiEu: 'European AQI',
    aqiUs: 'US AQI',
    next: 'Continue',
    back: 'Back',
  },
  pt: {
    brand: 'Habertronic Orión',
    title: 'Dados capturados',
    saved: 'Salvo no banco de dados (Neon).',
    notSaved: 'Não foi possível salvar no Neon. Revise a API.',
    sectionAnswers: 'Questionário',
    sectionOsdi: 'OSDI-6',
    sectionLocation: 'Localidade',
    sectionEnvironment: 'Ambiente',
    sameLocality: 'Mesma localidade da exploração',
    locationSourceDevice: 'GPS do dispositivo',
    locationSourceGeocoded: 'Cidade buscada',
    locationSourceSkipped: 'Omitido',
    locationSkipped: 'Continuar sem este dado',
    locationCoords: 'Coordenadas',
    locationSource: 'Fonte',
    locationCountry: 'País',
    locationState: 'Estado',
    locationLocality: 'Comunidade',
    environmentSkipped: 'Sem dado ambiental',
    osdiAnswers: 'Respostas (itens 1–6)',
    osdiSubDiscomfort: 'Subescala desconforto / visão',
    osdiSubFunction: 'Subescala função / tarefas',
    osdiSubEnvironment: 'Subescala ambiental',
    osdiPossible: 'Possível olho seco (soma ≥ 4)',
    osdiNormal: 'Normal (soma < 4)',
    temp: 'Temperatura',
    humidity: 'Umidade relativa',
    pressure: 'Pressão (msl)',
    surfacePressure: 'Pressão de superfície',
    uv: 'Índice UV',
    wind: 'Vento',
    pm25: 'PM2.5',
    pm10: 'PM10',
    dust: 'Poeira',
    ozone: 'Ozônio',
    no2: 'NO₂',
    aqiEu: 'AQI europeu',
    aqiUs: 'AQI EUA',
    next: 'Continuar',
    back: 'Voltar',
  },
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="p-sum__row">
      <span className="p-sum__label">{label}</span>
      <span className="p-sum__value">{value}</span>
    </p>
  )
}

type ParpadeoSummaryScreenProps = {
  lang: Lang
  data: ParpadeoInterrogatorioState
  saved: boolean
  onContinue: () => void
  onBack: () => void
}

export function ParpadeoSummaryScreen({
  lang,
  data,
  saved,
  onContinue,
  onBack,
}: ParpadeoSummaryScreenProps) {
  const t = copy[lang]
  const iq = interrogatorioCopy[lang]
  const env = data.environment
  const loc = data.location
  const osdi = data.osdi6

  const yesNo = (v: 'yes' | 'no' | null) =>
    v === 'yes' ? iq.yes : v === 'no' ? iq.no : '—'

  const treatment =
    data.nonLubeTreatment === null
      ? '—'
      : data.nonLubeTreatment === 'none'
        ? iq.treatmentNone
        : iq.treatmentOptions[data.nonLubeTreatment]

  return (
    <main className="p-sum">
      <div className="p-sum__atmosphere" aria-hidden="true" />
      <header className="p-sum__header">
        <button type="button" className="p-sum__back" onClick={onBack}>
          {t.back}
        </button>
        <h1 className="p-sum__brand">{t.brand}</h1>
        <h2 className="p-sum__title">{t.title}</h2>
        <p className={saved ? 'p-sum__ok' : 'p-sum__err'}>
          {saved ? t.saved : t.notSaved}
        </p>
      </header>

      <div className="p-sum__sections">
        <section className="p-sum__card">
          <h3 className="p-sum__section">{t.sectionAnswers}</h3>
          <Row label={iq.steps.age} value={data.age != null ? String(data.age) : '—'} />
          <Row
            label={iq.steps.sex}
            value={data.sex ? iq.sexOptions[data.sex] : '—'}
          />
          <Row
            label={iq.steps.diagnosis}
            value={yesNo(data.dryEyeDiagnosis)}
          />
          <Row label={iq.steps.treatment} value={treatment} />
          <Row label={iq.steps.lubricant} value={yesNo(data.usingLubricant)} />
        </section>

        <section className="p-sum__card">
          <h3 className="p-sum__section">{t.sectionOsdi}</h3>
          {osdi ? (
            <>
              <Row
                label={t.osdiAnswers}
                value={osdi.answers.map((a, i) => `${i + 1}=${a}`).join(' · ')}
              />
              <Row
                label={t.osdiSubDiscomfort}
                value={String(osdi.subscales.discomfort)}
              />
              <Row
                label={t.osdiSubFunction}
                value={String(osdi.subscales.visualFunction)}
              />
              <Row
                label={t.osdiSubEnvironment}
                value={String(osdi.subscales.environmental)}
              />
              <Row label={iq.osdi6Total} value={`${osdi.total} / 24`} />
              <Row
                label={iq.steps.osdi6}
                value={
                  osdi.possibleDryEye ? t.osdiPossible : t.osdiNormal
                }
              />
            </>
          ) : (
            <Row label={iq.steps.osdi6} value="—" />
          )}
        </section>

        <section className="p-sum__card">
          <h3 className="p-sum__section">{t.sectionLocation}</h3>
          <Row
            label={t.sameLocality}
            value={
              loc
                ? loc.sameLocality
                  ? iq.yes
                  : iq.no
                : '—'
            }
          />
          <Row
            label={iq.steps.location}
            value={
              !loc
                ? '—'
                : loc.source === 'skipped'
                  ? t.locationSkipped
                  : loc.source === 'geocoded' && loc.label
                    ? loc.label
                    : `≈ ${loc.lat}, ${loc.lng}`
            }
          />
          {loc && loc.source !== 'skipped' && (
            <>
              <Row
                label={t.locationCountry}
                value={loc.country || '—'}
              />
              <Row label={t.locationState} value={loc.state || '—'} />
              <Row
                label={t.locationLocality}
                value={loc.locality || '—'}
              />
              <Row
                label={t.locationCoords}
                value={`≈ ${loc.lat}, ${loc.lng}`}
              />
              <Row
                label={t.locationSource}
                value={
                  loc.source === 'device'
                    ? t.locationSourceDevice
                    : t.locationSourceGeocoded
                }
              />
            </>
          )}
          {loc?.source === 'skipped' && (
            <Row label={t.locationSource} value={t.locationSourceSkipped} />
          )}
        </section>

        <section className="p-sum__card">
          <h3 className="p-sum__section">{t.sectionEnvironment}</h3>
          {env ? (
            <>
              <Row
                label={t.temp}
                value={
                  env.weather.temperatureC != null
                    ? `${env.weather.temperatureC} °C`
                    : '—'
                }
              />
              <Row
                label={t.humidity}
                value={
                  env.weather.humidityPct != null
                    ? `${env.weather.humidityPct} %`
                    : '—'
                }
              />
              <Row
                label={t.pressure}
                value={
                  env.weather.pressureMslHpa != null
                    ? `${env.weather.pressureMslHpa} hPa`
                    : '—'
                }
              />
              <Row
                label={t.surfacePressure}
                value={
                  env.weather.surfacePressureHpa != null
                    ? `${env.weather.surfacePressureHpa} hPa`
                    : '—'
                }
              />
              <Row
                label={t.uv}
                value={
                  env.weather.uvIndex != null
                    ? String(env.weather.uvIndex)
                    : '—'
                }
              />
              <Row
                label={t.wind}
                value={
                  env.weather.windSpeedKmh != null
                    ? `${env.weather.windSpeedKmh} km/h`
                    : '—'
                }
              />
              <Row
                label={t.pm25}
                value={env.air.pm25 != null ? String(env.air.pm25) : '—'}
              />
              <Row
                label={t.pm10}
                value={env.air.pm10 != null ? String(env.air.pm10) : '—'}
              />
              <Row
                label={t.dust}
                value={env.air.dust != null ? String(env.air.dust) : '—'}
              />
              <Row
                label={t.ozone}
                value={env.air.ozone != null ? String(env.air.ozone) : '—'}
              />
              <Row
                label={t.no2}
                value={
                  env.air.nitrogenDioxide != null
                    ? String(env.air.nitrogenDioxide)
                    : '—'
                }
              />
              <Row
                label={t.aqiEu}
                value={
                  env.air.europeanAqi != null
                    ? String(env.air.europeanAqi)
                    : '—'
                }
              />
              <Row
                label={t.aqiUs}
                value={env.air.usAqi != null ? String(env.air.usAqi) : '—'}
              />
            </>
          ) : (
            <Row
              label={t.sectionEnvironment}
              value={
                loc?.source === 'skipped' ? t.environmentSkipped : '—'
              }
            />
          )}
        </section>
      </div>

      <button type="button" className="p-sum__next" onClick={onContinue}>
        {t.next}
      </button>
    </main>
  )
}
