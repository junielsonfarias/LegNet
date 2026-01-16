import { exportMetric } from '@/lib/monitoring/exporter'

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
    console.info('[metric]', JSON.stringify(payload))
  } catch (error) {
    console.warn('Não foi possível serializar métrica', error)
  }
}

