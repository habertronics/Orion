import { getApiUrl } from '../config'
import { getToken } from '../auth/researcherAuth'
import { isExamComplete, type ParpadeoExamState } from '../i18n/parpadeoExam'
import type { ParpadeoInterrogatorioState } from '../i18n/parpadeoInterrogatorio'
import { isMeterComplete, type MeterResult } from './parpadeoMeter'

export type ProtocolUploadResult =
  | { ok: true; id: string }
  | {
      ok: false
      reason: 'guest' | 'offline' | 'network' | 'auth' | 'server' | 'incomplete'
    }

export async function saveParpadeoComplete(data: {
  interrogatorio: ParpadeoInterrogatorioState
  exam: ParpadeoExamState | null
  meter: MeterResult | null
}): Promise<ProtocolUploadResult> {
  const token = getToken()
  if (!token) return { ok: false, reason: 'guest' }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, reason: 'offline' }
  }
  if (!data.exam || !isExamComplete(data.exam) || !isMeterComplete(data.meter)) {
    return { ok: false, reason: 'incomplete' }
  }

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
    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: 'auth' }
    }
    if (response.status === 400) {
      return { ok: false, reason: 'incomplete' }
    }
    if (!response.ok) return { ok: false, reason: 'server' }
    const json = (await response.json()) as { id?: string }
    if (!json.id) return { ok: false, reason: 'server' }
    return { ok: true, id: json.id }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
