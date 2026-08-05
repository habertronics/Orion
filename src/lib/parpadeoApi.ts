import { getApiUrl } from '../config'
import { getToken } from '../auth/researcherAuth'
import type { ParpadeoInterrogatorioState } from '../i18n/parpadeoInterrogatorio'

export async function saveParpadeoInterrogatorio(
  data: ParpadeoInterrogatorioState,
): Promise<{ id: string } | null> {
  const token = getToken()
  if (!token) return null

  const answers = {
    age: data.age,
    sex: data.sex,
    dryEyeDiagnosis: data.dryEyeDiagnosis,
    nonLubeTreatment: data.nonLubeTreatment,
    usingLubricant: data.usingLubricant,
    osdi6Done: data.osdi6Done,
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/parpadeo/interrogatorio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        answers,
        location: data.location,
        environment: data.environment,
      }),
    })
    if (!response.ok) return null
    const json = (await response.json()) as { id?: string }
    return json.id ? { id: json.id } : null
  } catch {
    return null
  }
}
