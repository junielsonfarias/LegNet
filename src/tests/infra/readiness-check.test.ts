import { vi } from "vitest"
import { runReadinessCheck } from '@/lib/monitoring/readiness-check'

vi.mock('@/lib/prisma', () => {
  const countMock = vi.fn().mockResolvedValue(5)
  return {
    prisma: {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
      user: { count: countMock },
      parlamentar: { count: vi.fn().mockResolvedValue(10) },
      proposicao: { count: vi.fn().mockResolvedValue(4) }
    }
  }
})

const ORIGINAL_ENV = process.env

describe('runReadinessCheck', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('reporta sucesso com banco configurado', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.NEXTAUTH_SECRET = 'secret'

    const report = await runReadinessCheck()

    expect(report.environment).toBe('database')
    expect(report.summary.failures).toBe(0)
    expect(report.checks.find(check => check.id === 'db-connection')?.status).toBe('pass')
  })

  it('reporta falha quando variáveis obrigatórias ausentes', async () => {
    delete process.env.NEXTAUTH_SECRET
    delete process.env.DATABASE_URL

    const report = await runReadinessCheck()

    const envCheck = report.checks.find(check => check.id === 'env-required')
    expect(envCheck?.status).toBe('fail')
    expect(report.summary.failures).toBeGreaterThan(0)
  })
})

