import { getApiUrl } from '../config'

const SESSION_KEY = 'habertronic-orion-researcher-session'
const REMEMBER_KEY = 'habertronic-orion-researcher-remember'
const TOKEN_KEY = 'habertronic-orion-researcher-token'

export type ResearcherSession = {
  email: string
}

export type RememberedCredentials = {
  email: string
  password: string
}

export type AuthErrorCode =
  | 'invalid_email'
  | 'email_taken'
  | 'invalid_credentials'
  | 'missing_password'
  | 'server_error'
  | 'network_error'

export type AuthResult =
  | { ok: true; email: string }
  | { ok: false; error: AuthErrorCode }

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function suggestPassword(length = 5): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(values, (n) => alphabet[n % alphabet.length]).join('')
}

export function getRememberedCredentials(): RememberedCredentials | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RememberedCredentials>
    if (!parsed.email || !parsed.password) return null
    return {
      email: String(parsed.email),
      password: String(parsed.password),
    }
  } catch {
    return null
  }
}

export function clearRememberedCredentials(): void {
  localStorage.removeItem(REMEMBER_KEY)
}

function setRememberedCredentials(email: string, password: string): void {
  localStorage.setItem(
    REMEMBER_KEY,
    JSON.stringify({ email: normalizeEmail(email), password }),
  )
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string, remember: boolean): void {
  sessionStorage.setItem(TOKEN_KEY, token)
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function getSession(): ResearcherSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ResearcherSession>
      if (parsed.email && getToken()) return { email: String(parsed.email) }
    }
  } catch {
    // fall through
  }

  const remembered = getRememberedCredentials()
  const token = localStorage.getItem(TOKEN_KEY)
  if (remembered && token) {
    setSession(remembered.email)
    sessionStorage.setItem(TOKEN_KEY, token)
    return { email: remembered.email }
  }

  return null
}

export function setSession(email: string): void {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ email: normalizeEmail(email) }),
  )
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
  clearToken()
}

async function authRequest(
  path: '/api/auth/register' | '/api/auth/login',
  email: string,
  password: string,
): Promise<AuthResult & { token?: string }> {
  const normalized = normalizeEmail(email)

  if (!normalized.includes('@') || normalized.length < 5) {
    return { ok: false, error: 'invalid_email' }
  }
  if (!password) {
    return { ok: false, error: 'missing_password' }
  }

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized, password }),
    })

    const data = (await response.json().catch(() => ({}))) as {
      error?: string
      token?: string
      user?: { email?: string }
    }

    if (!response.ok) {
      const code = data.error
      if (
        code === 'invalid_email' ||
        code === 'email_taken' ||
        code === 'invalid_credentials' ||
        code === 'missing_password' ||
        code === 'server_error'
      ) {
        return { ok: false, error: code }
      }
      return { ok: false, error: 'server_error' }
    }

    if (!data.token || !data.user?.email) {
      return { ok: false, error: 'server_error' }
    }

    return { ok: true, email: data.user.email, token: data.token }
  } catch {
    return { ok: false, error: 'network_error' }
  }
}

export async function registerResearcher(input: {
  email: string
  password: string
  remember: boolean
}): Promise<AuthResult> {
  const result = await authRequest(
    '/api/auth/register',
    input.email,
    input.password,
  )
  if (!result.ok || !result.token) return result

  setToken(result.token, input.remember)
  setSession(result.email)

  if (input.remember) {
    setRememberedCredentials(result.email, input.password)
  } else {
    clearRememberedCredentials()
  }

  return { ok: true, email: result.email }
}

export async function loginResearcher(input: {
  email: string
  password: string
  remember: boolean
}): Promise<AuthResult> {
  const result = await authRequest('/api/auth/login', input.email, input.password)
  if (!result.ok || !result.token) return result

  setToken(result.token, input.remember)
  setSession(result.email)

  if (input.remember) {
    setRememberedCredentials(result.email, input.password)
  } else {
    clearRememberedCredentials()
  }

  return { ok: true, email: result.email }
}
