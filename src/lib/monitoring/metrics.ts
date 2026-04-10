import { exportMetric } from '@/lib/monitoring/exporter'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('metrics')

type MetricPayload = {
  timestamp: string
  metric: string
  durationMs: number
  statusCode: number
  metadata?: Record<string, unknown>
}

const isMetricsEnabled = () => process.env.NEXT_PUBLIC_ENABLE_METRICS === 'true'

export const registerApiMetric = (
  metric: string,
  durationMs: number,
  statusCode: number,
  metadata?: Record<string, unknown>
) => {
  if (!isMetricsEnabled()) {
    return
  }

  const payload: MetricPayload = {
    timestamp: new Date().toISOString(),
    metric,
    durationMs: Math.max(0, Math.round(durationMs)),
    statusCode,
    ...(metadata ? { metadata } : {})
  }

  Promise.resolve(exportMetric(payload)).catch(() => undefined)

  try {
    log.info('Metrica registrada', payload as Record<string, unknown>)
  } catch (error) {
    log.warn('Nao foi possivel serializar metrica', { errorDetails: String(error) })
  }
}

