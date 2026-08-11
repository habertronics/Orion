import { useEffect, useState } from 'react'
import { examCopy } from '../i18n/parpadeoExam'
import {
  findingsCopy,
  MARGIN_FINDINGS,
  ORIFICE_FINDINGS,
} from '../i18n/parpadeoFindings'
import { plusCopy, PLUS_CRITERIA } from '../i18n/parpadeoPlus'
import { eyeStainingTotal } from '../i18n/parpadeoStaining'
import type { ParpadeoExamState } from '../i18n/parpadeoExam'
import type { Lang } from '../i18n/preferences'
import type { MeterResult } from '../lib/parpadeoMeter'
import type { ProtocolUploadResult } from '../lib/parpadeoApi'
import {
  hasPendingParpadeoUpload,
  UPLOAD_FLUSHED_EVENT,
} from '../lib/protocolUploadQueue'
import './ParpadeoSummaryScreen.css'

const copy: Record<
  Lang,
  {
    title: string
    meterTitle: string
    blinks: string
    duration: string
    noMeter: string
    needMeter: string
    upload: string
    uploading: string
    uploadSuccess: string
    uploaded: string
    pendingAnnounce: string
    pendingButton: string
    uploadError: string
    incompleteHint: string
    guestHint: string
    back: string
  }
> = {
  es: {
    title: 'Resumen de la exploración',
    meterTitle: 'Parpadeómetro IA',
    blinks: 'Parpadeos',
    duration: 'Duración',
    noMeter: 'Sin prueba de parpadeómetro registrada',
    needMeter:
      'Completa el parpadeómetro para poder mandar toda la información.',
    upload: 'Mandar toda la información a base de datos remota',
    uploading: 'Enviando…',
    uploadSuccess: 'Transferencia exitosa de datos',
    uploaded: 'Información guardada en la base de datos.',
    pendingAnnounce:
      'En cuanto se restablezca la red se mandarán los datos.',
    pendingButton: 'Esperando red…',
    uploadError: 'No se pudo guardar. Revisa la API o inicia sesión de nuevo.',
    incompleteHint:
      'Falta la medición del parpadeómetro. Sin ella no se registra nada en la base remota.',
    guestHint: 'Para guardar en la nube debes entrar como investigador.',
    back: 'Volver',
  },
  en: {
    title: 'Examination summary',
    meterTitle: 'AI Blinkometer',
    blinks: 'Blinks',
    duration: 'Duration',
    noMeter: 'No blinkometer test recorded',
    needMeter: 'Finish the blinkometer to send all information.',
    upload: 'Send all information to the remote database',
    uploading: 'Sending…',
    uploadSuccess: 'Successful data transfer',
    uploaded: 'Information saved to the database.',
    pendingAnnounce:
      'As soon as the network is restored, the data will be sent.',
    pendingButton: 'Waiting for network…',
    uploadError: 'Could not save. Check the API or sign in again.',
    incompleteHint:
      'Blinkometer measurement is missing. Nothing is stored remotely without it.',
    guestHint: 'Sign in as a researcher to save to the cloud.',
    back: 'Back',
  },
  pt: {
    title: 'Resumo da exploração',
    meterTitle: 'Parpadeômetro IA',
    blinks: 'Piscadas',
    duration: 'Duração',
    noMeter: 'Sem teste de parpadeômetro registrado',
    needMeter: 'Conclua o parpadeômetro para enviar toda a informação.',
    upload: 'Enviar toda a informação para a base de dados remota',
    uploading: 'Enviando…',
    uploadSuccess: 'Transferência de dados bem-sucedida',
    uploaded: 'Informação salva na base de dados.',
    pendingAnnounce:
      'Assim que a rede for restabelecida, os dados serão enviados.',
    pendingButton: 'Aguardando rede…',
    uploadError: 'Não foi possível salvar. Revise a API ou entre de novo.',
    incompleteHint:
      'Falta a medição do parpadeômetro. Sem ela nada é registrado na base remota.',
    guestHint: 'Entre como pesquisador para salvar na nuvem.',
    back: 'Voltar',
  },
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="p-sum__row">
      <span className="p-sum__label">{label}</span>
      <span className="p-sum__value">{value}</span>
    </p>
  )
}

function formatDuration(ms: number, lang: Lang): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const min = Math.floor(total / 60)
  const sec = total % 60
  if (lang === 'en') return `${min}m ${sec}s`
  return `${min} min ${sec} s`
}

function eyeLabel(od: boolean, os: boolean): string {
  if (od && os) return 'OD+OS'
  if (od) return 'OD'
  if (os) return 'OS'
  return '—'
}

type UploadStatus = 'idle' | 'busy' | 'ok' | 'pending' | 'err'

type ParpadeoExamSummaryScreenProps = {
  lang: Lang
  exam: ParpadeoExamState | null
  meter: MeterResult | null
  canUpload: boolean
  onBack: () => void
  onUpload: () => Promise<ProtocolUploadResult>
}

export function ParpadeoExamSummaryScreen({
  lang,
  exam,
  meter,
  canUpload,
  onBack,
  onUpload,
}: ParpadeoExamSummaryScreenProps) {
  const t = copy[lang]
  const examT = examCopy[lang]
  const findT = findingsCopy[lang]
  const plusT = plusCopy[lang]
  const [status, setStatus] = useState<UploadStatus>(() =>
    hasPendingParpadeoUpload() ? 'pending' : 'idle',
  )

  useEffect(() => {
    function onFlushed(event: Event) {
      const detail = (event as CustomEvent<{ protocol?: string; ok?: boolean }>)
        .detail
      if (detail?.protocol !== 'parpadeo') return
      if (detail.ok) setStatus('ok')
      else if (hasPendingParpadeoUpload()) setStatus('pending')
    }
    window.addEventListener(UPLOAD_FLUSHED_EVENT, onFlushed)
    return () => window.removeEventListener(UPLOAD_FLUSHED_EVENT, onFlushed)
  }, [])

  async function upload() {
    setStatus('busy')
    const result = await onUpload()
    if (result.ok) {
      setStatus('ok')
      return
    }
    if (result.reason === 'offline' || result.reason === 'network') {
      setStatus('pending')
      return
    }
    setStatus('err')
  }

  const buttonLabel =
    status === 'busy'
      ? t.uploading
      : status === 'ok'
        ? t.uploadSuccess
        : status === 'pending'
          ? t.pendingButton
          : t.upload

  return (
    <main className="p-sum">
      <div className="p-sum__atmosphere" aria-hidden="true" />
      <header className="p-sum__header">
        <button type="button" className="p-sum__back" onClick={onBack}>
          {t.back}
        </button>
        <h1 className="p-sum__brand">{examT.brand}</h1>
        <h2 className="p-sum__title">{t.title}</h2>
        {status === 'ok' && <p className="p-sum__ok">{t.uploaded}</p>}
        {status === 'pending' && (
          <p className="p-sum__pending" role="status">
            {t.pendingAnnounce}
          </p>
        )}
        {status === 'err' && <p className="p-sum__err">{t.uploadError}</p>}
        {!canUpload && (
          <p className="p-sum__err">
            {!meter || !exam ? t.incompleteHint : t.guestHint}
          </p>
        )}
      </header>

      <div className="p-sum__sections">
        <section className="p-sum__card">
          <h3 className="p-sum__section">{examT.sectionTitle}</h3>
          <Row
            label={examT.steps.tbut}
            value={
              exam?.tbut
                ? `OD ${exam.tbut.odSec}s · OS ${exam.tbut.osSec}s`
                : '—'
            }
          />
          <Row
            label={examT.steps.schirmer}
            value={
              exam?.schirmer
                ? `OD ${exam.schirmer.odMm} mm · OS ${exam.schirmer.osMm} mm`
                : '—'
            }
          />
          <Row
            label={examT.steps.staining}
            value={
              exam?.staining
                ? `OD ${eyeStainingTotal(exam.staining.od)} · OS ${eyeStainingTotal(exam.staining.os)}`
                : '—'
            }
          />
          <Row
            label={examT.steps.meibomianFunction}
            value={
              exam?.meibomianFunction
                ? `OD ${exam.meibomianFunction.od} · OS ${exam.meibomianFunction.os}`
                : '—'
            }
          />
          <Row
            label={examT.steps.meibomianExpressivity}
            value={
              exam?.meibomianExpressivity
                ? `OD ${exam.meibomianExpressivity.od} · OS ${exam.meibomianExpressivity.os}`
                : '—'
            }
          />
        </section>

        {exam?.meibomianFindings && (
          <section className="p-sum__card">
            <h3 className="p-sum__section">{examT.steps.meibomianFindings}</h3>
            {MARGIN_FINDINGS.map((id) => {
              const checks = exam.meibomianFindings?.margin[id]
              if (!checks || (!checks.od && !checks.os)) return null
              return (
                <Row
                  key={id}
                  label={findT.margin[id]}
                  value={eyeLabel(checks.od, checks.os)}
                />
              )
            })}
            {ORIFICE_FINDINGS.map((id) => {
              const checks = exam.meibomianFindings?.orifices[id]
              if (!checks || (!checks.od && !checks.os)) return null
              return (
                <Row
                  key={id}
                  label={findT.orifices[id]}
                  value={eyeLabel(checks.od, checks.os)}
                />
              )
            })}
          </section>
        )}

        {exam?.otherCriteria && (
          <section className="p-sum__card">
            <h3 className="p-sum__section">{examT.steps.otherCriteria}</h3>
            {PLUS_CRITERIA.filter((id) => exam.otherCriteria?.[id]).map((id) => (
              <Row key={id} label={plusT.items[id]} value="+" />
            ))}
          </section>
        )}

        <section className="p-sum__card">
          <h3 className="p-sum__section">{t.meterTitle}</h3>
          {meter ? (
            <>
              <Row label={t.blinks} value={String(meter.blinkCount)} />
              <Row
                label={t.duration}
                value={formatDuration(meter.durationMs, lang)}
              />
              {meter.bpm != null && (
                <Row label="Parpadeos/min" value={String(meter.bpm)} />
              )}
              {meter.arrhythmiaCvPct != null && (
                <Row
                  label="Arritmia CV"
                  value={`${meter.arrhythmiaCvPct.toFixed(1)} %`}
                />
              )}
              {meter.incompleteBlinkCount != null &&
                meter.incompleteBlinkCount > 0 && (
                  <Row
                    label="Incompletos"
                    value={String(meter.incompleteBlinkCount)}
                  />
                )}
            </>
          ) : (
            <Row label={t.meterTitle} value={t.noMeter} />
          )}
        </section>
      </div>

      <button
        type="button"
        className={
          status === 'ok'
            ? 'p-sum__next p-sum__next--ok'
            : status === 'pending'
              ? 'p-sum__next p-sum__next--pending'
              : 'p-sum__next'
        }
        disabled={
          !canUpload ||
          status === 'busy' ||
          status === 'ok' ||
          status === 'pending'
        }
        onClick={() => void upload()}
      >
        {buttonLabel}
      </button>
    </main>
  )
}
