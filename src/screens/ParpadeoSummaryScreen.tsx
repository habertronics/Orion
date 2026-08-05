import type { Lang } from '../i18n/preferences'
import type { ParpadeoInterrogatorioState } from '../i18n/parpadeoInterrogatorio'
import './ParpadeoSummaryScreen.css'

const copy: Record<
  Lang,
  {
    brand: string
    title: string
    saved: string
    notSaved: string
    age: string
    sex: string
    osdi6: string
    osdi6Possible: string
    location: string
    weather: string
    air: string
    next: string
    back: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    title: 'Datos capturados',
    saved: 'Guardado en la base de datos (Neon).',
    notSaved: 'No se pudo guardar en Neon. Revisa la API.',
    age: 'Edad',
    sex: 'Sexo',
    osdi6: 'OSDI-6',
    osdi6Possible: 'posible ojo seco',
    location: 'Ubicación aprox.',
    weather: 'Clima',
    air: 'Aire',
    next: 'Continuar',
    back: 'Volver',
  },
  en: {
    brand: 'Habertronic Orión',
    title: 'Captured data',
    saved: 'Saved to the database (Neon).',
    notSaved: 'Could not save to Neon. Check the API.',
    age: 'Age',
    sex: 'Sex',
    osdi6: 'OSDI-6',
    osdi6Possible: 'possible dry eye',
    location: 'Approx. location',
    weather: 'Weather',
    air: 'Air',
    next: 'Continue',
    back: 'Back',
  },
  pt: {
    brand: 'Habertronic Orión',
    title: 'Dados capturados',
    saved: 'Salvo no banco de dados (Neon).',
    notSaved: 'Não foi possível salvar no Neon. Revise a API.',
    age: 'Idade',
    sex: 'Sexo',
    osdi6: 'OSDI-6',
    osdi6Possible: 'possível olho seco',
    location: 'Localização aprox.',
    weather: 'Clima',
    air: 'Ar',
    next: 'Continuar',
    back: 'Voltar',
  },
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
  const env = data.environment

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

      <section className="p-sum__card">
        <p>
          <strong>{t.age}:</strong> {data.age ?? '—'}
        </p>
        <p>
          <strong>{t.sex}:</strong> {data.sex ?? '—'}
        </p>
        <p>
          <strong>{t.osdi6}:</strong>{' '}
          {data.osdi6
            ? `${data.osdi6.total}/24${
                data.osdi6.possibleDryEye ? ` · ${t.osdi6Possible}` : ''
              } · M ${data.osdi6.subscales.discomfort} · F ${data.osdi6.subscales.visualFunction} · A ${data.osdi6.subscales.environmental}`
            : '—'}
        </p>
        <p>
          <strong>{t.location}:</strong>{' '}
          {data.location
            ? data.location.label
              ? `${data.location.label} (≈ ${data.location.lat}, ${data.location.lng})`
              : `≈ ${data.location.lat}, ${data.location.lng}`
            : '—'}
        </p>
        <p>
          <strong>{t.weather}:</strong>{' '}
          {env
            ? `${env.weather.temperatureC ?? '—'}°C · ${env.weather.humidityPct ?? '—'}% HR · ${env.weather.pressureMslHpa ?? '—'} hPa · UV ${env.weather.uvIndex ?? '—'}`
            : '—'}
        </p>
        <p>
          <strong>{t.air}:</strong>{' '}
          {env
            ? `PM2.5 ${env.air.pm25 ?? '—'} · PM10 ${env.air.pm10 ?? '—'} · AQI ${env.air.usAqi ?? env.air.europeanAqi ?? '—'}`
            : '—'}
        </p>
      </section>

      <button type="button" className="p-sum__next" onClick={onContinue}>
        {t.next}
      </button>
    </main>
  )
}
