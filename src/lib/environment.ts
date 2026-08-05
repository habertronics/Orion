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

export async function searchPlaces(
  q: string,
  lang: string,
): Promise<PlaceSuggestion[]> {
  const token = getToken()
  if (!token || q.trim().length < 2) return []

  try {
    const response = await fetch(
      `${getApiUrl()}/api/environment/places?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!response.ok) return []
    const data = (await response.json()) as { places?: PlaceSuggestion[] }
    return data.places ?? []
  } catch {
    return []
  }
}
