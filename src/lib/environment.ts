import { getApiUrl } from '../config'
import { getToken } from '../auth/researcherAuth'
import type { EnvironmentSnapshot } from '../i18n/parpadeoInterrogatorio'

export type PlaceSuggestion = {
  id: number
  name: string
  country: string
  admin1: string
  latitude: number
  longitude: number
  label: string
}

/** País / estado / comunidad resueltos desde GPS o búsqueda. */
export type ResolvedPlace = {
  country: string | null
  state: string | null
  locality: string | null
  label: string | null
  countryCode?: string | null
}

export function placeFromSuggestion(place: PlaceSuggestion): ResolvedPlace {
  const country = place.country || null
  const state = place.admin1 || null
  const locality = place.name || null
  return {
    country,
    state,
    locality,
    label:
      place.label ||
      [locality, state, country].filter(Boolean).join(', ') ||
      null,
  }
}

export async function fetchEnvironmentSnapshot(
  lat: number,
  lng: number,
): Promise<EnvironmentSnapshot | null> {
  const token = getToken()
  if (!token) return null

  try {
    const response = await fetch(`${getApiUrl()}/api/environment/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lat, lng }),
    })
    if (!response.ok) return null
    const data = (await response.json()) as { snapshot?: EnvironmentSnapshot }
    return data.snapshot ?? null
  } catch {
    return null
  }
}

export async function reverseGeocodePlace(
  lat: number,
  lng: number,
  lang: string,
): Promise<ResolvedPlace | null> {
  try {
    const headers: HeadersInit = {}
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(
      `${getApiUrl()}/api/environment/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&lang=${encodeURIComponent(lang)}`,
      { headers },
    )
    if (!response.ok) return null
    const data = (await response.json()) as { place?: ResolvedPlace }
    return data.place ?? null
  } catch {
    return null
  }
}

export async function searchPlaces(
  q: string,
  lang: string,
): Promise<PlaceSuggestion[]> {
  if (q.trim().length < 2) return []

  try {
    const headers: HeadersInit = {}
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(
      `${getApiUrl()}/api/environment/places?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`,
      { headers },
    )
    if (!response.ok) return []
    const data = (await response.json()) as { places?: PlaceSuggestion[] }
    return data.places ?? []
  } catch {
    return []
  }
}
