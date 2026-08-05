import { getApiUrl } from '../config'
import { getToken } from '../auth/researcherAuth'
import type { ParpadeoExamState } from '../i18n/parpadeoExam'
import type { ParpadeoInterrogatorioState } from '../i18n/parpadeoInterrogatorio'
import type { MeterResult } from './parpadeoMeter'

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
    osdi6: data.osdi6,
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

export async function saveParpadeoComplete(data: {
  interrogatorio: ParpadeoInterrogatorioState
  exam: ParpadeoExamState | null
  meter: MeterResult | null
}): Promise<{ id: string } | null> {
  const token = getToken()
  if (!token) return null

  const answers = {
    age: data.interrogatorio.age,
    sex: data.interrogatorio.sex,
    dryEyeDiagnosis: data.interrogatorio.dryEyeDiagnosis,
    nonLubeTreatment: data.interrogatorio.nonLubeTreatment,
    usingLubricant: data.interrogatorio.usingLubricant,
    osdi6Done: data.interrogatorio.osdi6Done,
    osdi6: data.interrogatorio.osdi6,
  }

  try {
    const response = await fetch(`${getApiUrl()}/api/parpadeo/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        answers,
        location: data.interrogatorio.location,
        environment: data.interrogatorio.environment,
        exam: data.exam,
        meter: data.meter,
      }),
    })
    if (!response.ok) return null
    const json = (await response.json()) as { id?: string }
    return json.id ? { id: json.id } : null
  } catch {
    return null
  }
}
