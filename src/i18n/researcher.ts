import type { Lang } from './preferences'

export const researcherCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    login: string
    register: string
    back: string
    email: string
    emailPlaceholder: string
    suggestedPassword: string
    useOwnPassword: string
    ownPassword: string
    ownPasswordPlaceholder: string
    useNickname: string
    nickname: string
    nicknamePlaceholder: string
    remember: string
    submitRegister: string
    submitLogin: string
    password: string
    passwordPlaceholder: string
    helloTitle: string
    helloContinue: string
    protocolsTitle: string
    logout: string
    home: string
    errors: {
      invalid_email: string
      email_taken: string
      invalid_credentials: string
      missing_password: string
      missing_nickname: string
      server_error: string
      network_error: string
    }
  }
> = {
  es: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligencia artificial para la cuantificación del parpadeo',
    login: 'Login',
    register: 'Darme de alta',
    back: 'Volver',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.com',
    suggestedPassword: 'Contraseña sugerida',
    useOwnPassword: 'Quiero poner mi propia contraseña',
    ownPassword: 'Tu contraseña',
    ownPasswordPlaceholder: 'Escribe la que prefieras',
    useNickname: 'Utilizar nickname',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Ej. Científico mayor',
    remember: 'Recordarme (guardar usuario y contraseña)',
    submitRegister: 'Registrarme',
    submitLogin: 'Entrar',
    password: 'Contraseña',
    passwordPlaceholder: 'Tu contraseña',
    helloTitle: 'Bienvenido',
    helloContinue: 'Continuar',
    protocolsTitle: 'Elige un protocolo',
    logout: 'Cerrar sesión',
    home: 'Volver al inicio',
    errors: {
      invalid_email: 'Revisa el correo electrónico.',
      email_taken: 'Ese correo ya está registrado. Usa Login.',
      invalid_credentials: 'Correo o contraseña incorrectos.',
      missing_password: 'Escribe una contraseña.',
      missing_nickname: 'Escribe un nickname.',
      server_error: 'No se pudo conectar con el servidor. Intenta de nuevo.',
      network_error:
        'Sin conexión con la API. ¿Está corriendo en localhost:3001?',
    },
  },
  en: {
    brand: 'Habertronic Orión',
    subtitle:
      'Automated digital artificial intelligence system for blink quantification',
    login: 'Log in',
    register: 'Sign up',
    back: 'Back',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    suggestedPassword: 'Suggested password',
    useOwnPassword: 'I want to set my own password',
    ownPassword: 'Your password',
    ownPasswordPlaceholder: 'Type the one you prefer',
    useNickname: 'Use a nickname',
    nickname: 'Nickname',
    nicknamePlaceholder: 'E.g. Lead Scientist',
    remember: 'Remember me (save username and password)',
    submitRegister: 'Sign up',
    submitLogin: 'Log in',
    password: 'Password',
    passwordPlaceholder: 'Your password',
    helloTitle: 'Welcome',
    helloContinue: 'Continue',
    protocolsTitle: 'Choose a protocol',
    logout: 'Log out',
    home: 'Back to home',
    errors: {
      invalid_email: 'Please check your email.',
      email_taken: 'That email is already registered. Use Log in.',
      invalid_credentials: 'Incorrect email or password.',
      missing_password: 'Please enter a password.',
      missing_nickname: 'Please enter a nickname.',
      server_error: 'Could not reach the server. Please try again.',
      network_error: 'No API connection. Is it running on localhost:3001?',
    },
  },
  pt: {
    brand: 'Habertronic Orión',
    subtitle:
      'Sistema digital automatizado de inteligência artificial para a quantificação do piscar',
    login: 'Login',
    register: 'Cadastrar-me',
    back: 'Voltar',
    email: 'E-mail',
    emailPlaceholder: 'seu@email.com',
    suggestedPassword: 'Senha sugerida',
    useOwnPassword: 'Quero definir minha própria senha',
    ownPassword: 'Sua senha',
    ownPasswordPlaceholder: 'Digite a que preferir',
    useNickname: 'Usar nickname',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Ex. Cientista maior',
    remember: 'Lembrar-me (salvar usuário e senha)',
    submitRegister: 'Cadastrar',
    submitLogin: 'Entrar',
    password: 'Senha',
    passwordPlaceholder: 'Sua senha',
    helloTitle: 'Bem-vindo',
    helloContinue: 'Continuar',
    protocolsTitle: 'Escolha um protocolo',
    logout: 'Sair',
    home: 'Voltar ao início',
    errors: {
      invalid_email: 'Revise o e-mail.',
      email_taken: 'Esse e-mail já está cadastrado. Use Login.',
      invalid_credentials: 'E-mail ou senha incorretos.',
      missing_password: 'Digite uma senha.',
      missing_nickname: 'Digite um nickname.',
      server_error: 'Não foi possível conectar ao servidor. Tente de novo.',
      network_error: 'Sem conexão com a API. Está em localhost:3001?',
    },
  },
}
