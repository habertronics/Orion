import type { Lang } from './preferences'

export const homeCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    guest: string
    guestHint: string
    researcher: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    guest: 'Ingresar como invitado',
    guestHint: 'Ir directo a la aplicación',
    researcher: 'Ingresar como investigador',
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    guest: 'Continue as guest',
    guestHint: 'Go straight to the app',
    researcher: 'Continue as researcher',
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    guest: 'Entrar como convidado',
    guestHint: 'Ir direto para o aplicativo',
    researcher: 'Entrar como pesquisador',
  },
}
