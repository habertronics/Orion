import type { Lang } from './preferences'

export type { Lang }

export const welcomeCopy: Record<
  Lang,
  {
    welcome: string
    brand: string
    subtitle: string
    languageLabel: string
    languages: { code: Lang; label: string }[]
    consent: string
    continue: string
  }
> = {
  es: {
    welcome: 'Bienvenido a',
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    languageLabel: 'Idioma',
    languages: [
      { code: 'es', label: 'Español' },
      { code: 'en', label: 'Inglés' },
      { code: 'pt', label: 'Portugués' },
    ],
    consent:
      'He revisado la información de uso y estoy de acuerdo en continuar',
    continue: 'Seguir',
  },
  en: {
    welcome: 'Welcome to',
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    languageLabel: 'Language',
    languages: [
      { code: 'es', label: 'Spanish' },
      { code: 'en', label: 'English' },
      { code: 'pt', label: 'Portuguese' },
    ],
    consent: "I've reviewed the usage information and agree to continue",
    continue: 'Continue',
  },
  pt: {
    welcome: 'Bem-vindo ao',
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    languageLabel: 'Idioma',
    languages: [
      { code: 'es', label: 'Espanhol' },
      { code: 'en', label: 'Inglês' },
      { code: 'pt', label: 'Português' },
    ],
    consent: 'Revisei as informações de uso e concordo em continuar',
    continue: 'Seguir',
  },
}
