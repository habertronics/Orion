import type { Lang } from './preferences'

export const parpadeoIntroCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    protocolName: string
    introLabel: string
    paragraphs: string[]
    next: string
    back: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    protocolName: 'Protocolo Parpadeo',
    introLabel: 'Introducción',
    paragraphs: [
      'En el presente protocolo estudiaremos el comportamiento del parpadeo tanto en pacientes sanos como en pacientes con diagnóstico de ojo seco, de cualquier edad.',
      'El siguiente protocolo utiliza un sistema de visión artificial preentrenado llamado MediaPipe. Gracias a él podemos cuantificar de forma eficiente y rápida la frecuencia de parpadeo y generar una gráfica que nos ofrezca datos sobre la frecuencia, el ritmo, la intensidad, así como otros registros paramétricos que el sistema generará automáticamente.',
      'Esta aplicación está diseñada para utilizarse directamente con el paciente: durante una lectura en celular, tablet o computadora; viendo un video de YouTube precargado en la aplicación; o jugando un videojuego. La duración mínima del estudio es de 5 minutos.',
    ],
    next: 'Siguiente',
    back: 'Volver',
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    protocolName: 'Blink Protocol',
    introLabel: 'Introduction',
    paragraphs: [
      'In this protocol we will study blink behavior in both healthy patients and patients diagnosed with dry eye, of any age.',
      'This protocol uses a pretrained computer-vision system called MediaPipe. With it we can efficiently and quickly quantify blink frequency and generate a chart with data on frequency, rhythm, intensity, and other parametric records the system will produce automatically.',
      'This app is designed to be used directly with the patient: while reading on a phone, tablet, or computer; watching a YouTube video preloaded in the app; or playing a video game. The minimum study duration is 5 minutes.',
    ],
    next: 'Next',
    back: 'Back',
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    protocolName: 'Protocolo Piscar',
    introLabel: 'Introdução',
    paragraphs: [
      'Neste protocolo estudaremos o comportamento do piscar tanto em pacientes saudáveis quanto em pacientes com diagnóstico de olho seco, de qualquer idade.',
      'O protocolo utiliza um sistema de visão artificial pré-treinado chamado MediaPipe. Com ele podemos quantificar de forma eficiente e rápida a frequência do piscar e gerar um gráfico com dados sobre frequência, ritmo, intensidade e outros registros paramétricos que o sistema gerará automaticamente.',
      'Este aplicativo foi projetado para uso direto com o paciente: durante a leitura no celular, tablet ou computador; assistindo a um vídeo do YouTube pré-carregado no aplicativo; ou jogando um videogame. A duração mínima do estudo é de 5 minutos.',
    ],
    next: 'Seguinte',
    back: 'Voltar',
  },
}
