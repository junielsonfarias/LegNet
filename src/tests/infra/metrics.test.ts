import { registerApiMetric } from '@/lib/monitoring/metrics'

describe('registerApiMetric', () => {
  const originalEnv = process.env
  const originalInfo = console.info
  const originalWarn = console.warn

  beforeEach(() => {
    process.env = { ...originalEnv }
    console.info = jest.fn()
    console.warn = jest.fn()
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any
  })

  afterEach(() => {
    process.env = originalEnv
    console.info = originalInfo
    console.warn = originalWarn
    global.fetch = undefined as any
  })

  it('ignora quando métricas desativadas', () => {
    delete process.env.NEXT_PUBLIC_ENABLE_METRICS
    registerApiMetric('test_metric', 10, 200)
    expect(console.info).not.toHaveBeenCalled()
  })

  it('registra métrica quando habilitado', async () => {
    process.env.NEXT_PUBLIC_ENABLE_METRICS = 'true'
    registerApiMetric('test_metric', 120.6, 201, { foo: 'bar' })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(console.info).toHaveBeenCalledTimes(1)
    const payload = JSON.parse((console.info as jest.Mock).mock.calls[0][1])
    expect(payload.metric).toBe('test_metric')
    expect(payload.durationMs).toBe(121)
    expect(payload.statusCode).toBe(201)
    expect(payload.metadata).toEqual({ foo: 'bar' })
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
    const cyclic: any = {}
    cyclic.ref = cyclic
    registerApiMetric('cyclic', 50, 200, { cyclic })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(console.warn).toHaveBeenCalled()
  })
})

