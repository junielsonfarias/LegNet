/**
 * Script de Verificacao de Producao
 * Verifica se aplicacao esta pronta para deploy
 */

import { checkProductionReadiness, validateEnv } from '../src/lib/config/production'

async function main() {
  console.log('='.repeat(60))
  console.log('  VERIFICACAO DE PRODUCAO')
  console.log('  Camara Municipal de Mojui dos Campos')
  console.log('='.repeat(60))
  console.log('')

  // 1. Verificar variaveis de ambiente
  console.log('1. Verificando variaveis de ambiente...')
  try {
    const env = validateEnv()
    console.log('   ✓ Variaveis de ambiente validas')
    console.log(`   - NODE_ENV: ${env.NODE_ENV}`)
    console.log(`   - DATABASE_URL: ${env.DATABASE_URL ? '***configurado***' : 'nao configurado'}`)
    console.log(`   - NEXTAUTH_URL: ${env.NEXTAUTH_URL}`)
  } catch (error) {
    console.log('   ✗ Erro nas variaveis de ambiente')
    if (error instanceof Error) {
      console.log(`   - ${error.message}`)
    }
  }
  console.log('')

  // 2. Verificar prontidao geral
  console.log('2. Verificando prontidao para producao...')
  try {
    const { ready, checks } = await checkProductionReadiness()

    for (const check of checks) {
      const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '!' : '✗'
      const color = check.status === 'ok' ? '' : check.status === 'warning' ? ' [AVISO]' : ' [ERRO]'
      console.log(`   ${icon} ${check.name}${color}`)
      console.log(`     ${check.message}`)
    }

    console.log('')
    if (ready) {
      console.log('='.repeat(60))
      console.log('  ✓ SISTEMA PRONTO PARA PRODUCAO')
      console.log('='.repeat(60))
    } else {
      console.log('='.repeat(60))
      console.log('  ✗ SISTEMA NAO ESTA PRONTO PARA PRODUCAO')
      console.log('  Corrija os erros acima antes do deploy')
      console.log('='.repeat(60))
      process.exit(1)
    }
  } catch (error) {
    console.log('   ✗ Erro ao verificar prontidao')
    if (error instanceof Error) {
      console.log(`   - ${error.message}`)
    }
    process.exit(1)
  }
}

main().catch(console.error)
