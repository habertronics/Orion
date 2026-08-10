import { getApiUrl } from '../config'

const SESSION_KEY = 'habertronic-orion-researcher-session'
const REMEMBER_KEY = 'habertronic-orion-researcher-remember'
const TOKEN_KEY = 'habertronic-orion-researcher-token'

export type ResearcherSession = {
  email: string
  nickname: string | null
  displayName: string
}

export type RememberedCredentials = {
  email: string
  password: string
}

export type ResearcherLocationPayload =
  | {
      source: 'device' | 'geocoded'
      lat: number
      lng: number
      accuracy: number
      capturedAt: string
      label?: string
      placeId?: number
      country?: string | null
      state?: string | null
      locality?: string | null
      countryCode?: string | null
    }

export type AuthErrorCode =
  | 'invalid_email'
  | 'email_taken'
  | 'invalid_credentials'
  | 'missing_password'
  | 'missing_nickname'
  | 'missing_full_name'
  | 'invalid_age'
  | 'missing_sex'
  | 'invalid_phone'
  | 'missing_location'
  | 'missing_ophthalmology_profile'
  | 'missing_specialty'
  | 'missing_specialty_other'
  | 'registration_blocked'
  | 'rate_limited'
  | 'server_error'
  | 'network_error'

export type AuthResult =
  | { ok: true; email: string; nickname: string | null; displayName: string }
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
      if (parsed.email && getToken()) {
        const email = String(parsed.email)
        const nickname = parsed.nickname ? String(parsed.nickname) : null
        return {
          email,
          nickname,
          displayName: String(parsed.displayName || nickname || email),
        }
      }
    }
  } catch {
    // fall through
  }

  const remembered = getRememberedCredentials()
  const token = localStorage.getItem(TOKEN_KEY)
  if (remembered && token) {
    const session = {
      email: remembered.email,
      nickname: null,
      displayName: remembered.email,
    }
    setSession(session)
    sessionStorage.setItem(TOKEN_KEY, token)
    return session
  }

  return null
}

export function setSession(session: {
  email: string
  nickname?: string | null
  displayName?: string
}): void {
  const email = normalizeEmail(session.email)
  const nickname = session.nickname ?? null
  const displayName = session.displayName || nickname || email
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ email, nickname, displayName }),
  )
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
  clearToken()
}

type AuthOk = {
  ok: true
  email: string
  nickname: string | null
  displayName: string
  token: string
}

const AUTH_ERROR_CODES: AuthErrorCode[] = [
  'invalid_email',
  'email_taken',
  'invalid_credentials',
  'missing_password',
  'missing_nickname',
  'missing_full_name',
  'invalid_age',
  'invalid_phone',
  'missing_location',
  'missing_ophthalmology_profile',
  'missing_specialty',
  'missing_specialty_other',
  'registration_blocked',
  'rate_limited',
  'server_error',
]

function asAuthError(code: string | undefined): AuthErrorCode {
  if (code && AUTH_ERROR_CODES.includes(code as AuthErrorCode)) {
    return code as AuthErrorCode
  }
  return 'server_error'
}

async function authRequest(input: {
  path: '/api/auth/register' | '/api/auth/login'
  email: string
  password: string
  useNickname?: boolean
  nickname?: string
  fullName?: string
  age?: number
  sex?: 'male' | 'female'
  phone?: string
  locationDeclined?: boolean
  location?: ResearcherLocationPayload | null
  ophthalmologyProfile?: 'general' | 'specialty'
  specialtySlug?: string | null
  specialtyOther?: string | null
  website?: string
  formStartedAt?: number
}): Promise<AuthOk | { ok: false; error: AuthErrorCode }> {
  const normalized = normalizeEmail(input.email)

  if (input.path === '/api/auth/register') {
    if (!String(input.fullName || '').trim()) {
      return { ok: false, error: 'missing_full_name' }
    }
    if (
      input.age === undefined ||
      !Number.isInteger(input.age) ||
      input.age < 1 ||
      input.age > 120
    ) {
      return { ok: false, error: 'invalid_age' }
    }
    if (input.sex !== 'male' && input.sex !== 'female') {
      return { ok: false, error: 'missing_sex' }
    }
    const phoneDigits = String(input.phone || '').replace(/\D/g, '')
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return { ok: false, error: 'invalid_phone' }
    }
    if (
      input.ophthalmologyProfile !== 'general' &&
      input.ophthalmologyProfile !== 'specialty'
    ) {
      return { ok: false, error: 'missing_ophthalmology_profile' }
    }
    if (input.ophthalmologyProfile === 'specialty') {
      if (!input.specialtySlug) {
        return { ok: false, error: 'missing_specialty' }
      }
      if (
        input.specialtySlug === 'other' &&
        !String(input.specialtyOther || '').trim()
      ) {
        return { ok: false, error: 'missing_specialty_other' }
      }
    }
    if (!input.locationDeclined && !input.location) {
      return { ok: false, error: 'missing_location' }
    }
  }

  if (!normalized.includes('@') || normalized.length < 5) {
    return { ok: false, error: 'invalid_email' }
  }
  if (!input.password) {
    return { ok: false, error: 'missing_password' }
  }
  if (input.useNickname && !String(input.nickname || '').trim()) {
    return { ok: false, error: 'missing_nickname' }
  }

  try {
    const body: Record<string, unknown> = {
      email: normalized,
      password: input.password,
    }
    if (input.path === '/api/auth/register') {
      body.fullName = String(input.fullName || '').trim()
      body.age = input.age
      body.sex = input.sex
      body.phone = String(input.phone || '').trim()
      body.useNickname = Boolean(input.useNickname)
      body.nickname = input.useNickname
        ? String(input.nickname || '').trim()
        : null
      body.locationDeclined = Boolean(input.locationDeclined)
      body.location = input.locationDeclined ? null : input.location
      body.ophthalmologyProfile = input.ophthalmologyProfile
      body.specialtySlug =
        input.ophthalmologyProfile === 'specialty'
          ? input.specialtySlug
          : null
      body.specialtyOther =
        input.ophthalmologyProfile === 'specialty' &&
        input.specialtySlug === 'other'
          ? String(input.specialtyOther || '').trim()
          : null
      body.website = String(input.website || '')
      body.formStartedAt = input.formStartedAt ?? Date.now()
    }

    const response = await fetch(`${getApiUrl()}${input.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = (await response.json().catch(() => ({}))) as {
      error?: string
      token?: string
      user?: {
        email?: string
        nickname?: string | null
        displayName?: string
      }
    }

    if (!response.ok) {
      return { ok: false, error: asAuthError(data.error) }
    }

    if (!data.token || !data.user?.email) {
      return { ok: false, error: 'server_error' }
    }

    const nickname = data.user.nickname ?? null
    return {
      ok: true,
      email: data.user.email,
      nickname,
      displayName: data.user.displayName || nickname || data.user.email,
      token: data.token,
    }
  } catch {
    return { ok: false, error: 'network_error' }
  }
}

export async function registerResearcher(input: {
  email: string
  password: string
  remember: boolean
  useNickname: boolean
  nickname: string
  fullName: string
  age: number
  sex: 'male' | 'female'
  phone: string
  locationDeclined: boolean
  location: ResearcherLocationPayload | null
  ophthalmologyProfile: 'general' | 'specialty'
  specialtySlug: string | null
  specialtyOther: string | null
  website?: string
  formStartedAt: number
}): Promise<AuthResult> {
  const result = await authRequest({
    path: '/api/auth/register',
    email: input.email,
    password: input.password,
    useNickname: input.useNickname,
    nickname: input.nickname,
    fullName: input.fullName,
    age: input.age,
    sex: input.sex,
    phone: input.phone,
    locationDeclined: input.locationDeclined,
    location: input.location,
    ophthalmologyProfile: input.ophthalmologyProfile,
    specialtySlug: input.specialtySlug,
    specialtyOther: input.specialtyOther,
    website: input.website,
    formStartedAt: input.formStartedAt,
  })
  if (!result.ok) return result

  setToken(result.token, input.remember)
  setSession({
    email: result.email,
    nickname: result.nickname,
    displayName: result.displayName,
  })

  if (input.remember) {
    setRememberedCredentials(result.email, input.password)
  } else {
    clearRememberedCredentials()
  }

  return {
    ok: true,
    email: result.email,
    nickname: result.nickname,
    displayName: result.displayName,
  }
}

export async function loginResearcher(input: {
  email: string
  password: string
  remember: boolean
}): Promise<AuthResult> {
  const result = await authRequest({
    path: '/api/auth/login',
    email: input.email,
    password: input.password,
  })
  if (!result.ok) return result

  setToken(result.token, input.remember)
  setSession({
    email: result.email,
    nickname: result.nickname,
    displayName: result.displayName,
  })

  if (input.remember) {
    setRememberedCredentials(result.email, input.password)
  } else {
    clearRememberedCredentials()
  }

  return {
    ok: true,
    email: result.email,
    nickname: result.nickname,
    displayName: result.displayName,
  }
}

export type ProjectInfo = {
  id: string
  slug: string
  name_es: string
  name_en: string
  name_pt: string
  status: string
}

export async function fetchMyProjects(): Promise<ProjectInfo[]> {
  const token = getToken()
  if (!token) return []

  const response = await fetch(`${getApiUrl()}/api/projects/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return []
  const data = (await response.json()) as { projects?: ProjectInfo[] }
  return data.projects ?? []
}
