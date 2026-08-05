import type { Lang } from './preferences'

export const parpadeometroCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    protocolName: string
    sectionTitle: string
    hint: string
    button: string
    exitMeter: string
    next: string
    back: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    protocolName: 'Protocolo Parpadeo',
    sectionTitle: 'Medición',
    hint: 'Abre el Parpadeómetro IA (v2.2): cámara, duración, actividad y gráfica de apertura palpebral.',
    button: 'Parpadeómetro IA',
    exitMeter: 'Salir del parpadeómetro',
    next: 'Siguiente',
    back: 'Volver',
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    protocolName: 'Blink Protocol',
    sectionTitle: 'Measurement',
    hint: 'Open the AI Blinkometer (v2.2): camera, duration, activity, and eyelid aperture chart.',
    button: 'AI Blinkometer',
    exitMeter: 'Exit blinkometer',
    next: 'Next',
    back: 'Back',
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    protocolName: 'Protocolo Piscar',
    sectionTitle: 'Medição',
    hint: 'Abra o Parpadeômetro IA (v2.2): câmera, duração, atividade e gráfico de abertura palpebral.',
    button: 'Parpadeômetro IA',
    exitMeter: 'Sair do parpadeômetro',
    next: 'Seguinte',
    back: 'Voltar',
  },
}
