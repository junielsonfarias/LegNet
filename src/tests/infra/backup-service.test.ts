import {
  applyMockSnapshot,
  clearMockSnapshotHistory,
  getMockSnapshot,
  listMockSnapshotHistory,
  mockData
} from '@/lib/db'
import { backupService } from '@/lib/services/backup-service'

describe('backupService (mock backup)', () => {
  const baseline = getMockSnapshot()

  beforeEach(() => {
    clearMockSnapshotHistory()
    applyMockSnapshot(baseline)
  })

  it('gera snapshot e registra histórico', async () => {
    const snapshot = await backupService.exportSnapshot()

    expect(snapshot.meta.source).toBe('mock')
    expect(snapshot.meta.counts).toBeDefined()
    expect(snapshot.meta.counts.parlamentares).toBeGreaterThan(0)

    const history = listMockSnapshotHistory()
    expect(history).toHaveLength(1)
    expect(history[0].id).toBe(snapshot.meta.id)
  })

  it('restaura snapshot aplicando dados anteriores', async () => {
    const snapshot = await backupService.exportSnapshot()

    mockData.parlamentares.length = 0
    expect(mockData.parlamentares).toHaveLength(0)

    const result = await backupService.restoreSnapshot({ snapshot })

    expect(result.restoredFrom.id).toBe(snapshot.meta.id)
    expect(result.current.source).toBe('mock')
    expect(mockData.parlamentares).toHaveLength(snapshot.payload.parlamentares.length)
  })
})

