import { getApiUrl } from '../config'
import { getToken } from '../auth/researcherAuth'
import type { EnvironmentSnapshot } from '../i18n/parpadeoInterrogatorio'

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
