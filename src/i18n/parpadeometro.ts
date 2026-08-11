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
    needMeter: string
    meterReady: string
    requiredNote: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    protocolName: 'Protocolo Parpadeo',
    sectionTitle: 'Medición',
    hint: 'Abre el Parpadeómetro IA: cámara, duración, actividad y gráfica de apertura palpebral.',
    button: 'Parpadeómetro IA',
    exitMeter: 'Salir del parpadeómetro',
    next: 'Siguiente',
    back: 'Volver',
    needMeter:
      'Debes completar la medición del parpadeómetro para continuar y poder enviar el protocolo.',
    meterReady: 'Medición lista. Continúa al resumen para enviar.',
    requiredNote:
      'Paso obligatorio: sin parpadeómetro no se puede mandar la información a la base de datos.',
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    protocolName: 'Blink Protocol',
    sectionTitle: 'Measurement',
    hint: 'Open the AI Blinkometer: camera, duration, activity, and eyelid aperture chart.',
    button: 'AI Blinkometer',
    exitMeter: 'Exit blinkometer',
    next: 'Next',
    back: 'Back',
    needMeter:
      'You must finish the blinkometer measurement to continue and send the protocol.',
    meterReady: 'Measurement ready. Continue to the summary to send.',
    requiredNote:
      'Required step: without the blinkometer you cannot send data to the database.',
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    protocolName: 'Protocolo Piscar',
    sectionTitle: 'Medição',
    hint: 'Abra o Parpadeômetro IA: câmera, duração, atividade e gráfico de abertura palpebral.',
    button: 'Parpadeômetro IA',
    exitMeter: 'Sair do parpadeômetro',
    next: 'Seguinte',
    back: 'Voltar',
    needMeter:
      'É preciso concluir a medição do parpadeômetro para continuar e enviar o protocolo.',
    meterReady: 'Medição pronta. Continue ao resumo para enviar.',
    requiredNote:
      'Passo obrigatório: sem o parpadeômetro não é possível enviar os dados.',
  },
}
