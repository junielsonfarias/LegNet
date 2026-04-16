import { vi } from "vitest"
import { registerApiMetric } from '@/lib/monitoring/metrics'

// Mock do logger para capturar chamadas
const mockInfo = vi.fn()
const mockWarn = vi.fn()
vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: (...args: unknown[]) => mockInfo(...args),
    warn: (...args: unknown[]) => mockWarn(...args),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('registerApiMetric', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    mockInfo.mockClear()
    mockWarn.mockClear()
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as any
  })

  afterEach(() => {
    process.env = originalEnv
    global.fetch = undefined as any
  })

  it('ignora quando métricas desativadas', () => {
    delete process.env.NEXT_PUBLIC_ENABLE_METRICS
    registerApiMetric('test_metric', 10, 200)
    expect(mockInfo).not.toHaveBeenCalled()
  })

  it('registra métrica quando habilitado', async () => {
    process.env.NEXT_PUBLIC_ENABLE_METRICS = 'true'
    registerApiMetric('test_metric', 120.6, 201, { foo: 'bar' })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockInfo).toHaveBeenCalledTimes(1)
    const context = mockInfo.mock.calls[0][1] as Record<string, unknown>
    expect(context.metric).toBe('test_metric')
    expect(context.durationMs).toBe(121)
    expect(context.statusCode).toBe(201)
    expect(context.metadata).toEqual({ foo: 'bar' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('exporta métrica quando webhook configurado', async () => {
    process.env.NEXT_PUBLIC_ENABLE_METRICS = 'true'
    process.env.MONITORING_WEBHOOK_URL = 'https://example.com/webhook'
    registerApiMetric('webhook_metric', 55.4, 200)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('não interrompe fluxo se serialização falhar', async () => {
    process.env.NEXT_PUBLIC_ENABLE_METRICS = 'true'
    const cyclic: Record<string, unknown> = {}
    cyclic.ref = cyclic
    registerApiMetric('cyclic', 50, 200, { cyclic })
    await new Promise(resolve => setTimeout(resolve, 0))
    // O logger estruturado lida internamente com erros de serialização
    // Verifica que não lançou exceção (função completou sem erro)
    expect(mockInfo).toHaveBeenCalled()
  })
})
