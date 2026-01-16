const baseUrl = '/api/monitoramento'

class MonitoringApiService {
  async getStatus(): Promise<any> {
    const response = await fetch(baseUrl, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error('Falha ao carregar status de monitoramento')
    }
    return response.json()
  }

  async syncMetrics(): Promise<void> {
    const response = await fetch(`${baseUrl}/metricas`, { method: 'POST' })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error ?? 'Falha ao sincronizar métricas')
    }
  }
}

export const monitoringApi = new MonitoringApiService()

