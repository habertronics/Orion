import type { Lang } from './preferences'

export const homeCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    guest: string
    guestHint: string
    register: string
    login: string
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    guest: 'Ir directo a la aplicación',
    guestHint: '(sin registro)',
    register: 'Registrarme',
    login: 'Login',
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    guest: 'Go straight to the app',
    guestHint: '(no registration)',
    register: 'Sign up',
    login: 'Login',
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    guest: 'Ir direto para o aplicativo',
    guestHint: '(sem cadastro)',
    register: 'Cadastrar-me',
    login: 'Login',
  },
}
