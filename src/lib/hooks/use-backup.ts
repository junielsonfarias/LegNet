'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  infraBackupApi,
  BackupSnapshot,
  BackupSnapshotMeta,
  BackupHistoryResponse
} from '@/lib/api/infra-backup-api'
import { withRetry } from '@/lib/utils/retry'

interface UseBackupManagerState {
  history: BackupSnapshotMeta[]
  loading: boolean
  creating: boolean
  restoring: boolean
  error: string | null
}

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Falha ao ler arquivo selecionado'))
    reader.readAsText(file)
  })

const downloadSnapshotToFile = (snapshot: BackupSnapshot) => {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `backup-${snapshot.meta.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function useBackupManager() {
  const [state, setState] = useState<UseBackupManagerState>({
    history: [],
    loading: true,
    creating: false,
    restoring: false,
    error: null
  })

  const setPartialState = useCallback((partial: Partial<UseBackupManagerState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      setPartialState({ loading: true, error: null })
      const response = await withRetry(
        () => infraBackupApi.listHistory(),
        3,
        800
      )
      const history = (response as BackupHistoryResponse).history ?? []
      setPartialState({ history, loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar histórico de backups'
      setPartialState({ error: message, loading: false })
      toast.error(message)
    }
  }, [setPartialState])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const createBackup = useCallback(
    async (note?: string): Promise<BackupSnapshot | null> => {
      try {
        setPartialState({ creating: true, error: null })
        const snapshot = await infraBackupApi.createSnapshot(note)
        toast.success('Backup gerado com sucesso.')
        await fetchHistory()
        return snapshot
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao gerar backup'
        setPartialState({ error: message })
        toast.error(message)
        return null
      } finally {
        setPartialState({ creating: false })
      }
    },
    [fetchHistory, setPartialState]
  )

  const downloadBackup = useCallback(async (id: string) => {
    try {
      setPartialState({ error: null })
      const snapshot = await infraBackupApi.getSnapshot(id)
      downloadSnapshotToFile(snapshot)
      toast.success('Backup exportado com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao baixar backup'
      setPartialState({ error: message })
      toast.error(message)
    }
  }, [setPartialState])

  const restoreFromId = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setPartialState({ restoring: true, error: null })
        await infraBackupApi.restoreSnapshot({ snapshotId: id })
        toast.success('Backup restaurado com sucesso.')
        await fetchHistory()
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao restaurar backup'
        setPartialState({ error: message })
        toast.error(message)
        return false
      } finally {
        setPartialState({ restoring: false })
      }
    },
    [fetchHistory, setPartialState]
  )

  const restoreFromFile = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        setPartialState({ restoring: true, error: null })
        const text = await readFileAsText(file)
        const parsed = JSON.parse(text) as BackupSnapshot
        if (!parsed?.meta || !parsed?.payload) {
          throw new Error('Arquivo de backup inválido.')
        }
        await infraBackupApi.restoreSnapshot({ snapshot: parsed })
        toast.success('Backup importado e aplicado com sucesso.')
        await fetchHistory()
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao importar backup'
        setPartialState({ error: message })
        toast.error(message)
        return false
      } finally {
        setPartialState({ restoring: false })
      }
    },
    [fetchHistory, setPartialState]
  )

  return {
    history: state.history,
    loading: state.loading,
    creating: state.creating,
    restoring: state.restoring,
    error: state.error,
    refresh: fetchHistory,
    createBackup,
    downloadBackup,
    restoreFromId,
    restoreFromFile
  }
}

