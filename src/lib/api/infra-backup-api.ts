import { ApiResponse } from '@/lib/error-handler'

export type BackupSnapshotSource = 'mock' | 'database'

export interface BackupSnapshotMeta {
  id: string
  generatedAt: string
  source: BackupSnapshotSource
  counts: Record<string, number>
  note?: string
}

export interface BackupSnapshot {
  meta: BackupSnapshotMeta
  payload: Record<string, unknown>
}

export interface BackupHistoryResponse {
  history: BackupSnapshotMeta[]
}

const baseUrl = '/api/infra/backup'

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data: ApiResponse<T> = await response.json().catch(() => {
    throw new Error('Resposta inválida do servidor')
  })

  if (!response.ok || !data.success) {
    throw new Error(data.success ? 'Erro ao processar solicitação' : data.error)
  }

  return data.data
}

class InfraBackupApi {
  async listHistory(): Promise<BackupHistoryResponse> {
    const response = await fetch(baseUrl, { method: 'GET', cache: 'no-store' })
    return handleResponse<BackupHistoryResponse>(response)
  }

  async createSnapshot(note?: string): Promise<BackupSnapshot> {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    })
    return handleResponse<BackupSnapshot>(response)
  }

  async getSnapshot(id: string): Promise<BackupSnapshot> {
    const response = await fetch(`${baseUrl}?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      cache: 'no-store'
    })
    return handleResponse<BackupSnapshot>(response)
  }

  async restoreSnapshot(payload: { snapshotId?: string; snapshot?: BackupSnapshot; note?: string }): Promise<{
    restoredFrom: BackupSnapshotMeta
    current: BackupSnapshotMeta
  }> {
    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse<{
      restoredFrom: BackupSnapshotMeta
      current: BackupSnapshotMeta
    }>(response)
  }
}

export const infraBackupApi = new InfraBackupApi()

