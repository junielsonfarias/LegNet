#!/usr/bin/env tsx
import { runReadinessCheck } from '../src/lib/monitoring/readiness-check'
import { logInfo, logError } from '../src/lib/logging/structured-logger'

const formatStatus = (status: string) => {
  if (status === 'pass') return '✅ PASS'
  if (status === 'warn') return '⚠️ WARN'
  return '❌ FAIL'
}

const logSection = (title: string) => {
  console.log('\n' + title)
  console.log('-'.repeat(title.length))
}

async function main() {
  const report = await runReadinessCheck()

  console.log('Readiness Check')
  console.log(`Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`)
  console.log(`Ambiente: ${report.environment === 'database' ? 'Banco de dados' : 'Mock'}`)

  logSection('Resultados')
  report.checks.forEach(check => {
    console.log(`${formatStatus(check.status)} ${check.label}`)
    console.log(`   ${check.message}`)
    if (check.details) {
      console.log(`   Detalhes: ${JSON.stringify(check.details)}`)
    }
  })

  logSection('Resumo')
  console.log(`Passes   : ${report.summary.passed}`)
  console.log(`Avisos   : ${report.summary.warnings}`)
  console.log(`Falhas   : ${report.summary.failures}`)

  if (report.recommendations.length) {
    logSection('Recomendações')
    report.recommendations.forEach(item => console.log(`- ${item}`))
  }

  logInfo({
    message: 'Readiness check concluído',
    context: {
      environment: report.environment,
      passed: report.summary.passed,
      warnings: report.summary.warnings,
      failures: report.summary.failures
    }
  })

  if (report.summary.failures > 0) {
    process.exitCode = 1
  }
}

main().catch(error => {
  logError({
    message: 'Erro ao executar readiness-check',
    error
  })
  process.exitCode = 1
})

