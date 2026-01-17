/**
 * Readiness Check Endpoint
 * Verifica se aplicacao esta pronta para receber trafego
 * Inclui verificacao de banco de dados e servicos
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkProductionReadiness } from '@/lib/config/production'

interface ReadinessCheck {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  latency?: number
}

export async function GET() {
  const checks: ReadinessCheck[] = []
  const startTime = Date.now()

  // 1. Verificar conexao com banco de dados
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    checks.push({
      name: 'database',
      status: dbLatency < 1000 ? 'ok' : 'warning',
      message: dbLatency < 1000 ? 'Conexao estabelecida' : 'Conexao lenta',
      latency: dbLatency
    })
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'error',
      message: `Erro de conexao: ${error instanceof Error ? error.message : 'Desconhecido'}`
    })
  }

  // 2. Verificar configuracoes de producao
  try {
    const prodReadiness = await checkProductionReadiness()

    for (const check of prodReadiness.checks) {
      checks.push({
        name: check.name.toLowerCase().replace(/\s+/g, '_'),
        status: check.status,
        message: check.message
      })
    }
  } catch (error) {
    checks.push({
      name: 'config',
      status: 'warning',
      message: 'Nao foi possivel verificar configuracoes'
    })
  }

  // 3. Verificar memoria
  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  const heapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

  checks.push({
    name: 'memory',
    status: heapPercent < 85 ? 'ok' : heapPercent < 95 ? 'warning' : 'error',
    message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent}%)`
  })

  // Determinar status geral
  const hasErrors = checks.some(c => c.status === 'error')
  const hasWarnings = checks.some(c => c.status === 'warning')

  const overallStatus = hasErrors ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy'
  const totalLatency = Date.now() - startTime

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    summary: {
      total: checks.length,
      ok: checks.filter(c => c.status === 'ok').length,
      warnings: checks.filter(c => c.status === 'warning').length,
      errors: checks.filter(c => c.status === 'error').length
    },
    latency: totalLatency
  }

  // Retornar 503 se nao estiver saudavel
  const httpStatus = hasErrors ? 503 : 200

  return NextResponse.json(response, { status: httpStatus })
}
