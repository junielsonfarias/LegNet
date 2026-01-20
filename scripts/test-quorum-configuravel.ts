/**
 * Teste do Sistema de Quórum Configurável
 * Executa: npx tsx scripts/test-quorum-configuravel.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simula os tipos do serviço de quórum
type TipoQuorum = 'MAIORIA_SIMPLES' | 'MAIORIA_ABSOLUTA' | 'DOIS_TERCOS' | 'TRES_QUINTOS' | 'UNANIMIDADE'

interface ConfiguracaoQuorum {
  id: string
  nome: string
  descricao: string | null
  aplicacao: string
  tipoQuorum: string
  baseCalculo: string
  permitirAbstencao: boolean
  abstencaoContaContra: boolean
  requererVotacaoNominal: boolean
  mensagemAprovacao: string | null
  mensagemRejeicao: string | null
}

interface ResultadoVotacao {
  aprovado: boolean
  mensagem: string
  detalhes: string
  votos: { sim: number; nao: number; abstencao: number }
  votosNecessarios: number
  baseCalculo: number
}

function calcularVotosNecessarios(tipo: TipoQuorum, base: number): number {
  switch (tipo) {
    case 'MAIORIA_SIMPLES':
      return Math.floor(base / 2) + 1
    case 'MAIORIA_ABSOLUTA':
      return Math.floor(base / 2) + 1
    case 'DOIS_TERCOS':
      return Math.ceil((base * 2) / 3)
    case 'TRES_QUINTOS':
      return Math.ceil((base * 3) / 5)
    case 'UNANIMIDADE':
      return base
    default:
      return Math.floor(base / 2) + 1
  }
}

function calcularResultado(
  config: ConfiguracaoQuorum,
  votos: { sim: number; nao: number; abstencao: number },
  totalMembros: number,
  totalPresentes: number
): ResultadoVotacao {
  const tipoQuorum = config.tipoQuorum as TipoQuorum
  const baseCalculo = config.baseCalculo
  const abstencaoContaContra = config.abstencaoContaContra

  // Determinar base de cálculo
  let base = totalPresentes
  if (baseCalculo === 'TOTAL_MEMBROS' || baseCalculo === 'TOTAL_MANDATOS') {
    base = totalMembros
  }

  // Considerar abstenções como contra se configurado
  const votosContra = abstencaoContaContra ? votos.nao + votos.abstencao : votos.nao

  const votosNecessarios = calcularVotosNecessarios(tipoQuorum, base)
  let aprovado = false
  let detalhes = ''

  switch (tipoQuorum) {
    case 'MAIORIA_SIMPLES':
      aprovado = votos.sim > votosContra
      detalhes = `${votos.sim} SIM vs ${votosContra} NAO (maioria simples: SIM > NAO)`
      break
    case 'MAIORIA_ABSOLUTA':
      aprovado = votos.sim >= votosNecessarios
      detalhes = `${votos.sim} SIM (necessario: ${votosNecessarios} de ${base} membros)`
      break
    case 'DOIS_TERCOS':
      aprovado = votos.sim >= votosNecessarios
      detalhes = `${votos.sim} SIM (necessario: ${votosNecessarios} de ${base} = 2/3)`
      break
    case 'TRES_QUINTOS':
      aprovado = votos.sim >= votosNecessarios
      detalhes = `${votos.sim} SIM (necessario: ${votosNecessarios} de ${base} = 3/5)`
      break
    case 'UNANIMIDADE':
      aprovado = votos.sim === totalPresentes && votos.nao === 0 && votos.abstencao === 0
      detalhes = `${votos.sim} SIM de ${totalPresentes} presentes (unanimidade)`
      break
  }

  return {
    aprovado,
    mensagem: aprovado ? (config.mensagemAprovacao || 'APROVADO') : (config.mensagemRejeicao || 'REJEITADO'),
    detalhes,
    votos,
    votosNecessarios,
    baseCalculo: base
  }
}

async function testarCenario(
  config: ConfiguracaoQuorum,
  cenario: string,
  votos: { sim: number; nao: number; abstencao: number },
  totalMembros: number,
  totalPresentes: number,
  esperado: boolean
): Promise<boolean> {
  const resultado = calcularResultado(config, votos, totalMembros, totalPresentes)
  const passou = resultado.aprovado === esperado

  console.log(`\n  Cenario: ${cenario}`)
  console.log(`     Votos: ${votos.sim} SIM | ${votos.nao} NAO | ${votos.abstencao} ABSTENCAO`)
  console.log(`     Membros: ${totalMembros} total | ${totalPresentes} presentes`)
  console.log(`     Base de calculo: ${config.baseCalculo} (${resultado.baseCalculo} parlamentares)`)
  console.log(`     Votos necessarios: ${resultado.votosNecessarios}`)
  console.log(`     ${resultado.detalhes}`)
  console.log(`     Resultado: ${resultado.mensagem}`)
  console.log(`     ${passou ? 'PASSOU' : 'FALHOU'} (esperado: ${esperado ? 'APROVADO' : 'REJEITADO'})`)

  return passou
}

async function main() {
  console.log('======================================================')
  console.log('   TESTE DO SISTEMA DE QUORUM CONFIGURAVEL')
  console.log('======================================================')

  // Buscar configurações do banco
  const configs = await prisma.configuracaoQuorum.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' }
  })

  if (configs.length === 0) {
    console.log('\n Nenhuma configuracao de quorum encontrada!')
    console.log('   Execute: npx tsx prisma/seed-quorum.ts')
    return
  }

  console.log(`\n${configs.length} configuracoes encontradas no banco\n`)

  let totalTestes = 0
  let testesPassados = 0

  // Cenário: Câmara com 9 vereadores
  const TOTAL_MEMBROS = 9

  // ============================================
  // TESTE 1: VOTAÇÃO SIMPLES
  // ============================================
  const configSimples = configs.find(c => c.aplicacao === 'VOTACAO_SIMPLES')
  if (configSimples) {
    console.log('\n------------------------------------------------------')
    console.log(`TESTE: ${configSimples.nome}`)
    console.log(`   Tipo: ${configSimples.tipoQuorum} | Base: ${configSimples.baseCalculo}`)
    console.log(`   Nominal obrigatoria: ${configSimples.requererVotacaoNominal ? 'SIM' : 'NAO'}`)

    // Cenário 1.1: Aprovado (5 sim, 3 não, 1 abstenção)
    totalTestes++
    if (await testarCenario(configSimples, 'Maioria simples - aprovado', { sim: 5, nao: 3, abstencao: 1 }, TOTAL_MEMBROS, 9, true)) testesPassados++

    // Cenário 1.2: Rejeitado (3 sim, 5 não, 1 abstenção)
    totalTestes++
    if (await testarCenario(configSimples, 'Maioria simples - rejeitado', { sim: 3, nao: 5, abstencao: 1 }, TOTAL_MEMBROS, 9, false)) testesPassados++

    // Cenário 1.3: Empate (4 sim, 4 não, 1 abstenção) - rejeitado
    totalTestes++
    if (await testarCenario(configSimples, 'Maioria simples - empate', { sim: 4, nao: 4, abstencao: 1 }, TOTAL_MEMBROS, 9, false)) testesPassados++
  }

  // ============================================
  // TESTE 2: VOTAÇÃO ABSOLUTA
  // ============================================
  const configAbsoluta = configs.find(c => c.aplicacao === 'VOTACAO_ABSOLUTA')
  if (configAbsoluta) {
    console.log('\n------------------------------------------------------')
    console.log(`TESTE: ${configAbsoluta.nome}`)
    console.log(`   Tipo: ${configAbsoluta.tipoQuorum} | Base: ${configAbsoluta.baseCalculo}`)
    console.log(`   Nominal obrigatoria: ${configAbsoluta.requererVotacaoNominal ? 'SIM' : 'NAO'}`)

    // Cenário 2.1: Aprovado (5 sim = maioria de 9)
    totalTestes++
    if (await testarCenario(configAbsoluta, 'Maioria absoluta - aprovado (5/9)', { sim: 5, nao: 2, abstencao: 2 }, TOTAL_MEMBROS, 9, true)) testesPassados++

    // Cenário 2.2: Rejeitado (4 sim < maioria de 9)
    totalTestes++
    if (await testarCenario(configAbsoluta, 'Maioria absoluta - rejeitado (4/9)', { sim: 4, nao: 3, abstencao: 2 }, TOTAL_MEMBROS, 9, false)) testesPassados++

    // Cenário 2.3: Com ausentes (7 presentes, 5 sim ainda aprova pois base é TOTAL_MEMBROS)
    totalTestes++
    if (await testarCenario(configAbsoluta, 'Maioria absoluta - com ausentes', { sim: 5, nao: 2, abstencao: 0 }, TOTAL_MEMBROS, 7, true)) testesPassados++
  }

  // ============================================
  // TESTE 3: VOTAÇÃO QUALIFICADA (2/3)
  // ============================================
  const configQualificada = configs.find(c => c.aplicacao === 'VOTACAO_QUALIFICADA')
  if (configQualificada) {
    console.log('\n------------------------------------------------------')
    console.log(`TESTE: ${configQualificada.nome}`)
    console.log(`   Tipo: ${configQualificada.tipoQuorum} | Base: ${configQualificada.baseCalculo}`)
    console.log(`   Nominal obrigatoria: ${configQualificada.requererVotacaoNominal ? 'SIM' : 'NAO'}`)

    // 2/3 de 9 = 6
    // Cenário 3.1: Aprovado (6 sim = 2/3 de 9)
    totalTestes++
    if (await testarCenario(configQualificada, 'Dois tercos - aprovado (6/9)', { sim: 6, nao: 2, abstencao: 1 }, TOTAL_MEMBROS, 9, true)) testesPassados++

    // Cenário 3.2: Rejeitado (5 sim < 2/3 de 9)
    totalTestes++
    if (await testarCenario(configQualificada, 'Dois tercos - rejeitado (5/9)', { sim: 5, nao: 3, abstencao: 1 }, TOTAL_MEMBROS, 9, false)) testesPassados++
  }

  // ============================================
  // TESTE 4: DERRUBADA DE VETO
  // ============================================
  const configVeto = configs.find(c => c.aplicacao === 'DERRUBADA_VETO')
  if (configVeto) {
    console.log('\n------------------------------------------------------')
    console.log(`TESTE: ${configVeto.nome}`)
    console.log(`   Tipo: ${configVeto.tipoQuorum} | Base: ${configVeto.baseCalculo}`)
    console.log(`   Nominal obrigatoria: ${configVeto.requererVotacaoNominal ? 'SIM' : 'NAO'}`)

    // Cenário 4.1: Veto derrubado (5 sim = maioria absoluta)
    totalTestes++
    if (await testarCenario(configVeto, 'Veto derrubado (5/9)', { sim: 5, nao: 4, abstencao: 0 }, TOTAL_MEMBROS, 9, true)) testesPassados++

    // Cenário 4.2: Veto mantido (4 sim < maioria absoluta)
    totalTestes++
    if (await testarCenario(configVeto, 'Veto mantido (4/9)', { sim: 4, nao: 5, abstencao: 0 }, TOTAL_MEMBROS, 9, false)) testesPassados++
  }

  // ============================================
  // TESTE 5: INSTALAÇÃO DE SESSÃO
  // ============================================
  const configInstalacao = configs.find(c => c.aplicacao === 'INSTALACAO_SESSAO')
  if (configInstalacao) {
    console.log('\n------------------------------------------------------')
    console.log(`TESTE: ${configInstalacao.nome}`)
    console.log(`   Tipo: ${configInstalacao.tipoQuorum} | Base: ${configInstalacao.baseCalculo}`)

    // Para instalação, sim = presentes
    // Cenário 5.1: Sessão instalada (5 presentes = maioria de 9)
    totalTestes++
    if (await testarCenario(configInstalacao, 'Sessao instalada (5 presentes)', { sim: 5, nao: 0, abstencao: 0 }, TOTAL_MEMBROS, 5, true)) testesPassados++

    // Cenário 5.2: Sessão não instalada (4 presentes < maioria de 9)
    totalTestes++
    if (await testarCenario(configInstalacao, 'Sessao nao instalada (4 presentes)', { sim: 4, nao: 0, abstencao: 0 }, TOTAL_MEMBROS, 4, false)) testesPassados++
  }

  // ============================================
  // RESUMO
  // ============================================
  console.log('\n======================================================')
  console.log('   RESUMO DOS TESTES')
  console.log('======================================================')
  console.log(`   Total de testes: ${totalTestes}`)
  console.log(`   Passados: ${testesPassados}`)
  console.log(`   Falhados: ${totalTestes - testesPassados}`)
  console.log(`   Taxa de sucesso: ${((testesPassados / totalTestes) * 100).toFixed(1)}%`)

  if (testesPassados === totalTestes) {
    console.log('\n   TODOS OS TESTES PASSARAM!')
  } else {
    console.log('\n   Alguns testes falharam. Verifique as configuracoes.')
  }
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
