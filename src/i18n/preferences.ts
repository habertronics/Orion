export type Lang = 'es' | 'en' | 'pt'

const STORAGE_KEY = 'habertronic-orion-prefs'

type AppPreferences = {
  lang: Lang
  welcomeCompleted: boolean
}

const defaults: AppPreferences = {
  lang: 'es',
  welcomeCompleted: false,
}

function isLang(value: unknown): value is Lang {
  return value === 'es' || value === 'en' || value === 'pt'
}

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }

    const parsed = JSON.parse(raw) as Partial<AppPreferences>
    return {
      lang: isLang(parsed.lang) ? parsed.lang : defaults.lang,
      welcomeCompleted: Boolean(parsed.welcomeCompleted),
    }
  } catch {
    return { ...defaults }
  }
}

export function savePreferences(prefs: AppPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function completeWelcome(lang: Lang): AppPreferences {
  const prefs: AppPreferences = {
    lang,
    welcomeCompleted: true,
  }
  savePreferences(prefs)
  return prefs
}
