import {
  saveParpadeoComplete,
  type ProtocolUploadResult,
} from './parpadeoApi'
import type { ParpadeoExamState } from '../i18n/parpadeoExam'
import type { ParpadeoInterrogatorioState } from '../i18n/parpadeoInterrogatorio'
import { isMeterComplete, type MeterResult } from './parpadeoMeter'

const STORAGE_KEY = 'habertronic-orion-pending-protocol-uploads'
export const UPLOAD_FLUSHED_EVENT = 'orion-pending-upload-flushed'

export type PendingParpadeoUpload = {
  id: string
  protocol: 'parpadeo'
  createdAt: string
  payload: {
    interrogatorio: ParpadeoInterrogatorioState
    exam: ParpadeoExamState | null
    meter: MeterResult | null
  }
}

type PendingUpload = PendingParpadeoUpload

function readQueue(): PendingUpload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PendingUpload[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(items: PendingUpload[]) {
  if (!items.length) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function notifyFlushed(detail: {
  protocol: string
  ok: boolean
  id?: string
}) {
  window.dispatchEvent(
    new CustomEvent(UPLOAD_FLUSHED_EVENT, { detail }),
  )
}

export function enqueueParpadeoComplete(payload: PendingParpadeoUpload['payload']) {
  if (!payload.exam || !isMeterComplete(payload.meter)) return null
  const rest = readQueue().filter((item) => item.protocol !== 'parpadeo')
  const entry: PendingParpadeoUpload = {
    id: crypto.randomUUID(),
    protocol: 'parpadeo',
    createdAt: new Date().toISOString(),
    payload,
  }
  writeQueue([...rest, entry])
  return entry.id
}

export function hasPendingParpadeoUpload(): boolean {
  return readQueue().some((item) => item.protocol === 'parpadeo')
}

/** Intenta enviar todo lo pendiente. Seguro llamar en `online` o al arrancar. */
export async function flushPendingUploads(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  const queue = readQueue()
  if (!queue.length) return

  const remaining: PendingUpload[] = []

  for (const item of queue) {
    if (item.protocol === 'parpadeo') {
      if (!item.payload.exam || !isMeterComplete(item.payload.meter)) {
        // Borradores incompletos en cola: se descartan (no hay registro parcial).
        continue
      }
      const result = await saveParpadeoComplete(item.payload)
      if (result.ok) {
        notifyFlushed({ protocol: 'parpadeo', ok: true, id: result.id })
        continue
      }
      if (result.reason === 'offline' || result.reason === 'network') {
        remaining.push(item)
        notifyFlushed({ protocol: 'parpadeo', ok: false })
        break
      }
      // auth/server: no reintentar en bucle; se queda fuera de cola
      notifyFlushed({ protocol: 'parpadeo', ok: false })
      continue
    }
    remaining.push(item)
  }

  writeQueue(remaining)
}

export function isNetworkUploadFailure(
  result: ProtocolUploadResult,
): boolean {
  return (
    !result.ok &&
    (result.reason === 'offline' || result.reason === 'network')
  )
}
