/**
 * Script para limpar todos os dados da Câmara Municipal
 *
 * Este script remove TODOS os dados do banco, mantendo apenas:
 * - Estrutura das tabelas (schema)
 * - Configurações do sistema (enums, tipos)
 * - Usuário admin padrão (opcional)
 *
 * USO:
 *   npx ts-node scripts/limpar-dados-camara.ts
 *
 * COM CONFIRMAÇÃO AUTOMÁTICA:
 *   npx ts-node scripts/limpar-dados-camara.ts --confirm
 *
 * MANTER USUÁRIO ADMIN:
 *   npx ts-node scripts/limpar-dados-camara.ts --keep-admin
 */

import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Cores para output
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
}

async function confirmarLimpeza(): Promise<boolean> {
  const args = process.argv.slice(2)

  if (args.includes('--confirm')) {
    return true
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    console.log('')
    console.log(colors.red('╔══════════════════════════════════════════════════════════════╗'))
    console.log(colors.red('║                    ⚠️  ATENÇÃO - PERIGO  ⚠️                    ║'))
    console.log(colors.red('╠══════════════════════════════════════════════════════════════╣'))
    console.log(colors.red('║  Este script irá APAGAR PERMANENTEMENTE todos os dados:      ║'))
    console.log(colors.red('║                                                              ║'))
    console.log(colors.red('║  • Parlamentares e mandatos                                  ║'))
    console.log(colors.red('║  • Sessões e pautas                                          ║'))
    console.log(colors.red('║  • Proposições e tramitações                                 ║'))
    console.log(colors.red('║  • Comissões e reuniões                                      ║'))
    console.log(colors.red('║  • Votações e pareceres                                      ║'))
    console.log(colors.red('║  • Publicações e notícias                                    ║'))
    console.log(colors.red('║  • Contratos, licitações, convênios                          ║'))
    console.log(colors.red('║  • Todos os demais dados da câmara                           ║'))
    console.log(colors.red('║                                                              ║'))
    console.log(colors.red('║  Esta ação NÃO PODE ser desfeita!                            ║'))
    console.log(colors.red('╚══════════════════════════════════════════════════════════════╝'))
    console.log('')

    rl.question(colors.yellow('Digite "LIMPAR TUDO" para confirmar: '), (answer) => {
      rl.close()
      resolve(answer === 'LIMPAR TUDO')
    })
  })
}

async function contarRegistros(): Promise<Record<string, number>> {
  console.log(colors.cyan('\n📊 Contando registros atuais...\n'))

  const contagens: Record<string, number> = {}

  // Principais entidades
  contagens['Parlamentares'] = await prisma.parlamentar.count()
  contagens['Mandatos'] = await prisma.mandato.count()
  contagens['Filiações'] = await prisma.filiacao.count()
  contagens['Sessões'] = await prisma.sessao.count()
  contagens['Pautas de Sessão'] = await prisma.pautaSessao.count()
  contagens['Itens de Pauta'] = await prisma.pautaItem.count()
  contagens['Presenças'] = await prisma.presencaSessao.count()
  contagens['Proposições'] = await prisma.proposicao.count()
  contagens['Emendas'] = await prisma.emenda.count()
  contagens['Votações'] = await prisma.votacao.count()
  contagens['Votações Agrupadas'] = await prisma.votacaoAgrupada.count()
  contagens['Comissões'] = await prisma.comissao.count()
  contagens['Membros de Comissão'] = await prisma.membroComissao.count()
  contagens['Reuniões de Comissão'] = await prisma.reuniaoComissao.count()
  contagens['Pareceres'] = await prisma.parecer.count()
  contagens['Tramitações'] = await prisma.tramitacao.count()
  contagens['Legislaturas'] = await prisma.legislatura.count()
  contagens['Períodos Legislativos'] = await prisma.periodoLegislatura.count()
  contagens['Mesa Diretora'] = await prisma.mesaDiretora.count()
  contagens['Publicações'] = await prisma.publicacao.count()
  contagens['Notícias'] = await prisma.noticia.count()
  contagens['Licitações'] = await prisma.licitacao.count()
  contagens['Contratos'] = await prisma.contrato.count()
  contagens['Convênios'] = await prisma.convenio.count()
  contagens['Receitas'] = await prisma.receita.count()
  contagens['Despesas'] = await prisma.despesa.count()
  contagens['Servidores'] = await prisma.servidor.count()
  contagens['Normas Jurídicas'] = await prisma.normaJuridica.count()
  contagens['Usuários'] = await prisma.user.count()
  contagens['Configurações'] = await prisma.configuracao.count()
  contagens['Logs de Auditoria'] = await prisma.auditLog.count()

  // Exibir contagens
  let total = 0
  for (const [entidade, count] of Object.entries(contagens)) {
    if (count > 0) {
      console.log(`  ${colors.yellow(entidade.padEnd(25))} ${colors.bold(count.toString())}`)
      total += count
    }
  }
  console.log('')
  console.log(colors.bold(`  ${'TOTAL DE REGISTROS'.padEnd(25)} ${total}`))

  return contagens
}

async function limparDados(manterAdmin: boolean = false) {
  console.log(colors.cyan('\n🗑️  Iniciando limpeza do banco de dados...\n'))

  // A ordem é CRÍTICA - deletar primeiro as tabelas que referenciam outras
  // (folhas da árvore de dependências primeiro)

  const operacoes = [
    // === NÍVEL 1: Tabelas mais dependentes (folhas) ===
    { nome: 'Respostas de Consulta', fn: () => prisma.respostaConsulta.deleteMany() },
    { nome: 'Participações em Consulta', fn: () => prisma.participacaoConsulta.deleteMany() },
    { nome: 'Perguntas de Consulta', fn: () => prisma.perguntaConsulta.deleteMany() },
    { nome: 'Apoios a Sugestões', fn: () => prisma.apoioSugestao.deleteMany() },
    { nome: 'Sugestões Legislativas', fn: () => prisma.sugestaoLegislativa.deleteMany() },
    { nome: 'Consultas Públicas', fn: () => prisma.consultaPublica.deleteMany() },

    { nome: 'Execuções de Relatório', fn: () => prisma.execucaoRelatorio.deleteMany() },
    { nome: 'Relatórios Agendados', fn: () => prisma.relatorioAgendado.deleteMany() },
    { nome: 'Dashboards Personalizados', fn: () => prisma.dashboardPersonalizado.deleteMany() },

    { nome: 'Favoritos', fn: () => prisma.favorito.deleteMany() },

    // Normas Jurídicas (hierarquia)
    { nome: 'Alterações de Norma', fn: () => prisma.alteracaoNorma.deleteMany() },
    { nome: 'Versões de Norma', fn: () => prisma.versaoNorma.deleteMany() },
    { nome: 'Parágrafos de Norma', fn: () => prisma.paragrafoNorma.deleteMany() },
    { nome: 'Artigos de Norma', fn: () => prisma.artigoNorma.deleteMany() },
    { nome: 'Normas Jurídicas', fn: () => prisma.normaJuridica.deleteMany() },

    // Protocolo
    { nome: 'Tramitações de Protocolo', fn: () => prisma.protocoloTramitacao.deleteMany() },
    { nome: 'Anexos de Protocolo', fn: () => prisma.protocoloAnexo.deleteMany() },
    { nome: 'Protocolos', fn: () => prisma.protocolo.deleteMany() },

    // === NÍVEL 2: Votações e Pareceres ===
    { nome: 'Votos em Parecer', fn: () => prisma.votoParecerComissao.deleteMany() },
    { nome: 'Pareceres', fn: () => prisma.parecer.deleteMany() },
    { nome: 'Votos em Emenda', fn: () => prisma.votoEmenda.deleteMany() },
    { nome: 'Votações Individuais', fn: () => prisma.votacao.deleteMany() },
    { nome: 'Votações Agrupadas', fn: () => prisma.votacaoAgrupada.deleteMany() },

    // === NÍVEL 3: Comissões e Reuniões ===
    { nome: 'Histórico de Participação', fn: () => prisma.historicoParticipacao.deleteMany() },
    { nome: 'Presenças em Reunião', fn: () => prisma.presencaReuniaoComissao.deleteMany() },
    { nome: 'Pautas de Reunião', fn: () => prisma.pautaReuniaoComissao.deleteMany() },
    { nome: 'Reuniões de Comissão', fn: () => prisma.reuniaoComissao.deleteMany() },
    { nome: 'Membros de Comissão', fn: () => prisma.membroComissao.deleteMany() },
    { nome: 'Comissões', fn: () => prisma.comissao.deleteMany() },

    // === NÍVEL 4: Tramitações ===
    { nome: 'Notificações de Tramitação', fn: () => prisma.tramitacaoNotificacao.deleteMany() },
    { nome: 'Histórico de Tramitação', fn: () => prisma.tramitacaoHistorico.deleteMany() },
    { nome: 'Tramitações', fn: () => prisma.tramitacao.deleteMany() },
    { nome: 'Etapas de Regra de Tramitação', fn: () => prisma.regraTramitacaoEtapa.deleteMany() },
    { nome: 'Regras de Tramitação', fn: () => prisma.regraTramitacao.deleteMany() },
    { nome: 'Etapas de Fluxo', fn: () => prisma.fluxoTramitacaoEtapa.deleteMany() },
    { nome: 'Fluxos de Tramitação', fn: () => prisma.fluxoTramitacao.deleteMany() },
    { nome: 'Tipos de Tramitação', fn: () => prisma.tramitacaoTipo.deleteMany() },
    { nome: 'Unidades de Tramitação', fn: () => prisma.tramitacaoUnidade.deleteMany() },
    { nome: 'Tramitação por Tipo Proposição', fn: () => prisma.tramitacaoTipoProposicao.deleteMany() },
    { nome: 'Configuração de Tramitação', fn: () => prisma.configuracaoTramitacao.deleteMany() },

    // === NÍVEL 5: Emendas e Proposições ===
    { nome: 'Emendas', fn: () => prisma.emenda.deleteMany() },
    { nome: 'Proposições', fn: () => prisma.proposicao.deleteMany() },

    // === NÍVEL 6: Sessões e Pautas ===
    { nome: 'Destaques de Pauta', fn: () => prisma.destaquePautaItem.deleteMany() },
    { nome: 'Itens de Pauta', fn: () => prisma.pautaItem.deleteMany() },
    { nome: 'Pautas de Sessão', fn: () => prisma.pautaSessao.deleteMany() },
    { nome: 'Presenças em Sessão', fn: () => prisma.presencaSessao.deleteMany() },
    { nome: 'Templates de Item', fn: () => prisma.templateItem.deleteMany() },
    { nome: 'Templates de Sessão', fn: () => prisma.sessaoTemplate.deleteMany() },
    { nome: 'Sessões', fn: () => prisma.sessao.deleteMany() },

    // === NÍVEL 7: Parlamentares e Estrutura ===
    { nome: 'Membros da Mesa Diretora', fn: () => prisma.membroMesaDiretora.deleteMany() },
    { nome: 'Mesa Diretora', fn: () => prisma.mesaDiretora.deleteMany() },
    { nome: 'Cargos da Mesa Diretora', fn: () => prisma.cargoMesaDiretora.deleteMany() },
    { nome: 'Filiações', fn: () => prisma.filiacao.deleteMany() },
    { nome: 'Mandatos', fn: () => prisma.mandato.deleteMany() },
    { nome: 'Períodos Legislativos', fn: () => prisma.periodoLegislatura.deleteMany() },
    { nome: 'Legislaturas', fn: () => prisma.legislatura.deleteMany() },
    { nome: 'Parlamentares', fn: () => prisma.parlamentar.deleteMany() },

    // === NÍVEL 8: Transparência e Finanças ===
    { nome: 'Documentos de Licitação', fn: () => prisma.licitacaoDocumento.deleteMany() },
    { nome: 'Licitações', fn: () => prisma.licitacao.deleteMany() },
    { nome: 'Contratos', fn: () => prisma.contrato.deleteMany() },
    { nome: 'Convênios', fn: () => prisma.convenio.deleteMany() },
    { nome: 'Receitas', fn: () => prisma.receita.deleteMany() },
    { nome: 'Despesas', fn: () => prisma.despesa.deleteMany() },
    { nome: 'Folhas de Pagamento', fn: () => prisma.folhaPagamento.deleteMany() },
    { nome: 'Servidores', fn: () => prisma.servidor.deleteMany() },
    { nome: 'Bens Patrimoniais', fn: () => prisma.bemPatrimonial.deleteMany() },

    // === NÍVEL 9: Conteúdo ===
    { nome: 'Publicações', fn: () => prisma.publicacao.deleteMany() },
    { nome: 'Categorias de Publicação', fn: () => prisma.categoriaPublicacao.deleteMany() },
    { nome: 'Notícias', fn: () => prisma.noticia.deleteMany() },

    // === NÍVEL 10: Sistema ===
    { nome: 'Notificações Multicanal', fn: () => prisma.notificacaoMulticanal.deleteMany() },
    { nome: 'API Tokens', fn: () => prisma.apiToken.deleteMany() },
    // RN-003: audit_logs tem trigger BEFORE DELETE bloqueando exclusao.
    // Para limpar em DEV/test, dropar triggers temporariamente:
    //   psql -c "DROP TRIGGER audit_logs_block_delete ON audit_logs;"
    // E recriar depois:
    //   psql -f prisma/migrations/20260504_audit_log_immutable/migration.sql
    { nome: 'Logs de Auditoria', fn: () => prisma.auditLog.deleteMany() },
    { nome: 'Configurações de Quórum', fn: () => prisma.configuracaoQuorum.deleteMany() },
    { nome: 'Configurações', fn: () => prisma.configuracao.deleteMany() },
    { nome: 'Configuração Institucional', fn: () => prisma.configuracaoInstitucional.deleteMany() },

    // === NÍVEL 11: Autenticação ===
    { nome: 'Tokens de Verificação', fn: () => prisma.verificationToken.deleteMany() },
    { nome: 'Sessões de Usuário', fn: () => prisma.session.deleteMany() },
    { nome: 'Contas OAuth', fn: () => prisma.account.deleteMany() },
  ]

  // Usuários - condicional
  if (!manterAdmin) {
    operacoes.push({ nome: 'Usuários', fn: () => prisma.user.deleteMany() })
  } else {
    operacoes.push({
      nome: 'Usuários (exceto admin)',
      fn: () => prisma.user.deleteMany({
        where: {
          NOT: { role: 'ADMIN' }
        }
      })
    })
  }

  // Tenant - por último
  operacoes.push({ nome: 'Tenants', fn: () => prisma.tenant.deleteMany() })

  // Executar cada operação
  let sucesso = 0
  let falhas = 0

  for (const op of operacoes) {
    try {
      const result = await op.fn()
      const count = (result as any).count || 0
      if (count > 0) {
        console.log(`  ${colors.green('✓')} ${op.nome.padEnd(35)} ${colors.yellow(`${count} removidos`)}`)
      } else {
        console.log(`  ${colors.blue('○')} ${op.nome.padEnd(35)} ${colors.blue('vazio')}`)
      }
      sucesso++
    } catch (error: any) {
      console.log(`  ${colors.red('✗')} ${op.nome.padEnd(35)} ${colors.red(`ERRO: ${error.message}`)}`)
      falhas++
    }
  }

  console.log('')
  console.log(colors.bold(`Resultado: ${colors.green(`${sucesso} operações bem-sucedidas`)}, ${falhas > 0 ? colors.red(`${falhas} falhas`) : colors.green('0 falhas')}`))

  return { sucesso, falhas }
}

async function verificarLimpeza() {
  console.log(colors.cyan('\n🔍 Verificando limpeza...\n'))

  const verificacoes = [
    { nome: 'Parlamentares', fn: () => prisma.parlamentar.count() },
    { nome: 'Sessões', fn: () => prisma.sessao.count() },
    { nome: 'Proposições', fn: () => prisma.proposicao.count() },
    { nome: 'Comissões', fn: () => prisma.comissao.count() },
    { nome: 'Legislaturas', fn: () => prisma.legislatura.count() },
    { nome: 'Publicações', fn: () => prisma.publicacao.count() },
    { nome: 'Normas Jurídicas', fn: () => prisma.normaJuridica.count() },
    { nome: 'Licitações', fn: () => prisma.licitacao.count() },
    { nome: 'Usuários', fn: () => prisma.user.count() },
  ]

  let totalRestante = 0
  for (const v of verificacoes) {
    const count = await v.fn()
    totalRestante += count
    const status = count === 0 ? colors.green('✓ Limpo') : colors.yellow(`${count} restantes`)
    console.log(`  ${v.nome.padEnd(25)} ${status}`)
  }

  return totalRestante
}

async function main() {
  const args = process.argv.slice(2)
  const manterAdmin = args.includes('--keep-admin')

  console.log(colors.bold('\n╔════════════════════════════════════════════════════════════╗'))
  console.log(colors.bold('║       SCRIPT DE LIMPEZA DO BANCO DE DADOS                  ║'))
  console.log(colors.bold('║       Sistema de Gestão de Câmara Municipal                ║'))
  console.log(colors.bold('╚════════════════════════════════════════════════════════════╝'))

  if (manterAdmin) {
    console.log(colors.yellow('\n⚠️  Modo: Manter usuários ADMIN'))
  }

  try {
    // Contar registros atuais
    await contarRegistros()

    // Confirmar operação
    const confirmado = await confirmarLimpeza()

    if (!confirmado) {
      console.log(colors.yellow('\n❌ Operação cancelada pelo usuário.\n'))
      process.exit(0)
    }

    console.log(colors.green('\n✓ Confirmação recebida. Iniciando limpeza...\n'))

    // Executar limpeza
    const { sucesso, falhas } = await limparDados(manterAdmin)

    // Verificar resultado
    const restante = await verificarLimpeza()

    // Resumo final
    console.log('')
    console.log(colors.bold('═══════════════════════════════════════════════════════════════'))
    if (restante === 0 || (manterAdmin && restante <= await prisma.user.count({ where: { role: 'ADMIN' } }))) {
      console.log(colors.green('✅ LIMPEZA CONCLUÍDA COM SUCESSO!'))
      console.log('')
      console.log(colors.cyan('Próximos passos:'))
      console.log(colors.cyan('  1. Execute o script de seed com os novos dados'))
      console.log(colors.cyan('  2. npx prisma db seed'))
      console.log(colors.cyan('  3. Ou importe os dados da nova câmara'))
    } else {
      console.log(colors.yellow('⚠️  LIMPEZA PARCIAL - Alguns registros permanecem'))
      console.log(colors.yellow('   Verifique as mensagens de erro acima'))
    }
    console.log(colors.bold('═══════════════════════════════════════════════════════════════'))
    console.log('')

  } catch (error: any) {
    console.error(colors.red(`\n❌ Erro fatal: ${error.message}`))
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
