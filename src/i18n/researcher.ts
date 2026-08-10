import type { Lang } from './preferences'

export const researcherCopy: Record<
  Lang,
  {
    brand: string
    subtitle: string
    login: string
    register: string
    back: string
    fullName: string
    fullNamePlaceholder: string
    age: string
    agePlaceholder: string
    phone: string
    phonePlaceholder: string
    email: string
    emailPlaceholder: string
    suggestedPassword: string
    useOwnPassword: string
    ownPassword: string
    ownPasswordPlaceholder: string
    useNickname: string
    nickname: string
    nicknamePlaceholder: string
    citySection: string
    cityHint: string
    cityGpsButton: string
    cityGpsCapturing: string
    cityLabel: string
    cityPlaceholder: string
    cityEmpty: string
    citySearching: string
    citySelected: string
    cityGpsSelected: string
    declineLocation: string
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
      missing_full_name: string
      invalid_age: string
      invalid_phone: string
      missing_location: string
      location_denied: string
      location_error: string
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
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'Nombre y apellidos',
    age: 'Edad',
    agePlaceholder: 'Años',
    phone: 'Teléfono',
    phonePlaceholder: 'Con lada, si aplica',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@correo.com',
    suggestedPassword: 'Contraseña sugerida',
    useOwnPassword: 'Quiero poner mi propia contraseña',
    ownPassword: 'Tu contraseña',
    ownPasswordPlaceholder: 'Escribe la que prefieras',
    useNickname: 'Utilizar nickname',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Ej. Científico mayor',
    citySection: 'Ciudad',
    cityHint:
      'Puedes obtener la ubicación automáticamente por GPS (exactitud aproximada, normalmente no mejor que ~500 m) o escribir tu ciudad y elegirla de la lista.',
    cityGpsButton: 'Obtener ubicación por GPS',
    cityGpsCapturing: 'Obteniendo ubicación…',
    cityLabel: 'Escribe tu ciudad',
    cityPlaceholder: 'Ej. San Luis Potosí',
    cityEmpty: 'Escribe al menos 2 letras para ver opciones.',
    citySearching: 'Buscando ciudades…',
    citySelected: 'Ciudad seleccionada',
    cityGpsSelected: 'Ubicación GPS registrada',
    declineLocation: 'No quiero dar localización',
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
      missing_full_name: 'Escribe tu nombre completo.',
      invalid_age: 'Indica una edad válida.',
      invalid_phone: 'Indica un teléfono válido.',
      missing_location:
        'Elige GPS, una ciudad, o marca «No quiero dar localización».',
      location_denied: 'Permiso de ubicación denegado.',
      location_error: 'No se pudo obtener la ubicación. Prueba con la ciudad.',
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
    fullName: 'Full name',
    fullNamePlaceholder: 'First and last name',
    age: 'Age',
    agePlaceholder: 'Years',
    phone: 'Phone',
    phonePlaceholder: 'Include area code if needed',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    suggestedPassword: 'Suggested password',
    useOwnPassword: 'I want to set my own password',
    ownPassword: 'Your password',
    ownPasswordPlaceholder: 'Type the one you prefer',
    useNickname: 'Use a nickname',
    nickname: 'Nickname',
    nicknamePlaceholder: 'E.g. Lead Scientist',
    citySection: 'City',
    cityHint:
      'You can get location automatically via GPS (approximate accuracy, usually no better than ~500 m) or type your city and pick it from the list.',
    cityGpsButton: 'Get location via GPS',
    cityGpsCapturing: 'Getting location…',
    cityLabel: 'Type your city',
    cityPlaceholder: 'E.g. San Luis Potosi',
    cityEmpty: 'Type at least 2 letters to see options.',
    citySearching: 'Searching cities…',
    citySelected: 'City selected',
    cityGpsSelected: 'GPS location recorded',
    declineLocation: 'I do not want to share my location',
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
      missing_full_name: 'Please enter your full name.',
      invalid_age: 'Please enter a valid age.',
      invalid_phone: 'Please enter a valid phone number.',
      missing_location:
        'Choose GPS, a city, or check “I do not want to share my location”.',
      location_denied: 'Location permission denied.',
      location_error: 'Could not get location. Try typing the city.',
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
    fullName: 'Nome completo',
    fullNamePlaceholder: 'Nome e sobrenome',
    age: 'Idade',
    agePlaceholder: 'Anos',
    phone: 'Telefone',
    phonePlaceholder: 'Com DDD, se aplicável',
    email: 'E-mail',
    emailPlaceholder: 'seu@email.com',
    suggestedPassword: 'Senha sugerida',
    useOwnPassword: 'Quero definir minha própria senha',
    ownPassword: 'Sua senha',
    ownPasswordPlaceholder: 'Digite a que preferir',
    useNickname: 'Usar nickname',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Ex. Cientista maior',
    citySection: 'Cidade',
    cityHint:
      'Você pode obter a localização automaticamente por GPS (exatidão aproximada, normalmente não melhor que ~500 m) ou digitar sua cidade e escolhê-la na lista.',
    cityGpsButton: 'Obter localização por GPS',
    cityGpsCapturing: 'Obtendo localização…',
    cityLabel: 'Digite sua cidade',
    cityPlaceholder: 'Ex. San Luis Potosí',
    cityEmpty: 'Digite pelo menos 2 letras para ver opções.',
    citySearching: 'Buscando cidades…',
    citySelected: 'Cidade selecionada',
    cityGpsSelected: 'Localização GPS registrada',
    declineLocation: 'Não quero informar localização',
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
      missing_full_name: 'Digite seu nome completo.',
      invalid_age: 'Informe uma idade válida.',
      invalid_phone: 'Informe um telefone válido.',
      missing_location:
        'Escolha GPS, uma cidade, ou marque «Não quero informar localização».',
      location_denied: 'Permissão de localização negada.',
      location_error: 'Não foi possível obter a localização. Tente a cidade.',
      server_error: 'Não foi possível conectar ao servidor. Tente de novo.',
      network_error: 'Sem conexão com a API. Está em localhost:3001?',
    },
  },
}
