import { logError } from '@/lib/logging/structured-logger'

type ExportPayload = Record<string, unknown>

const getWebhookUrl = () => process.env.MONITORING_WEBHOOK_URL

export const exportMetric = async (payload: ExportPayload) => {
  const url = getWebhookUrl()
  if (!url) {
    return
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    logError({
      message: 'Falha ao exportar métrica',
      error,
      context: { url }
    })
  }
}

