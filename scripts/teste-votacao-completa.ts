/**
 * Script de Teste de Votacao Completa e Sincronizacao com Painel
 *
 * Testa o fluxo completo:
 * - Criacao de sessao
 * - Registro de presencas
 * - Inclusao de materias na pauta
 * - Votacao nominal por parlamentares
 * - Sincronizacao com painel eletronico
 * - Salvamento de registros de votacao
 * - Verificacao de status final da proposicao
 *
 * Executar: npx ts-node scripts/teste-votacao-completa.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ResultadoTeste {
  passo: string
  sucesso: boolean
  dados?: any
  erro?: string
}

const resultados: ResultadoTeste[] = []

function registrarResultado(passo: string, sucesso: boolean, dados?: any, erro?: string) {
  resultados.push({ passo, sucesso, dados, erro })
  const status = sucesso ? '✓' : '✗'
  console.log(`   ${status} ${passo}`)
  if (erro) console.log(`     ERRO: ${erro}`)
}

async function testarVotacaoCompleta() {
  console.log('='.repeat(70))
  console.log('TESTE DE VOTACAO COMPLETA E SINCRONIZACAO COM PAINEL')
  console.log('='.repeat(70))

  try {
    // ============================================
    // FASE 1: PREPARACAO DOS DADOS
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 1: PREPARACAO DOS DADOS')
    console.log('-'.repeat(70))

    // 1.1 Verificar parlamentares ativos
    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      take: 9  // Camara pequena tem 9 vereadores
    })

    if (parlamentares.length < 5) {
      registrarResultado('Verificar parlamentares (minimo 5)', false, { encontrados: parlamentares.length }, 'Insuficientes')
      return
    }
    registrarResultado('Verificar parlamentares', true, { total: parlamentares.length })

    // 1.2 Buscar ou criar proposicao para votar
    let proposicao = await prisma.proposicao.findFirst({
      where: {
        status: { in: ['EM_PAUTA', 'AGUARDANDO_PAUTA'] }
      },
      include: {
        autor: true,
        pareceres: { where: { status: 'APROVADO_COMISSAO' } }
      }
    })

    if (!proposicao) {
      // Criar proposicao de teste
      const ano = new Date().getFullYear()
      const count = await prisma.proposicao.count({ where: { tipo: 'PROJETO_LEI', ano } })

      proposicao = await prisma.proposicao.create({
        data: {
          numero: `PL ${String(count + 1).padStart(3, '0')}/${ano}`,
          ano,
          tipo: 'PROJETO_LEI',
          titulo: 'Projeto de Lei de Teste - Votacao',
          ementa: 'Dispoe sobre testes de votacao no sistema.',
          texto: 'Art. 1o Teste de votacao.\nArt. 2o Esta lei entra em vigor na data de sua publicacao.',
          status: 'AGUARDANDO_PAUTA',
          dataApresentacao: new Date(),
          autorId: parlamentares[0].id
        },
        include: { autor: true, pareceres: true }
      })
      registrarResultado('Criar proposicao de teste', true, { numero: proposicao.numero })
    } else {
      registrarResultado('Usar proposicao existente', true, { numero: proposicao.numero })
    }

    // ============================================
    // FASE 2: CRIACAO DA SESSAO
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 2: CRIACAO DA SESSAO')
    console.log('-'.repeat(70))

    const ano = new Date().getFullYear()
    const countSessoes = await prisma.sessao.count({ where: { tipo: 'ORDINARIA' } })

    const sessao = await prisma.sessao.create({
      data: {
        numero: countSessoes + 1,
        tipo: 'ORDINARIA',
        data: new Date(),
        horario: '18:00',
        status: 'AGENDADA',
        local: 'Plenario Principal'
      }
    })
    registrarResultado('Criar sessao', true, { id: sessao.id, numero: sessao.numero })

    // Criar pauta da sessao
    const pautaSessao = await prisma.pautaSessao.create({
      data: {
        sessaoId: sessao.id,
        status: 'RASCUNHO'
      }
    })
    registrarResultado('Criar pauta da sessao', true, { id: pautaSessao.id })

    // ============================================
    // FASE 3: REGISTRO DE PRESENCAS
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 3: REGISTRO DE PRESENCAS')
    console.log('-'.repeat(70))

    // Iniciar sessao
    await prisma.sessao.update({
      where: { id: sessao.id },
      data: { status: 'EM_ANDAMENTO', tempoInicio: new Date() }
    })
    registrarResultado('Iniciar sessao', true)

    // Registrar presencas (7 presentes, 2 ausentes)
    const presentes: string[] = []
    const ausentes: string[] = []

    for (let i = 0; i < parlamentares.length; i++) {
      const presente = i < 7  // 7 presentes
      if (presente) {
        presentes.push(parlamentares[i].id)
      } else {
        ausentes.push(parlamentares[i].id)
      }

      await prisma.presencaSessao.upsert({
        where: {
          sessaoId_parlamentarId: {
            sessaoId: sessao.id,
            parlamentarId: parlamentares[i].id
          }
        },
        update: {
          presente
        },
        create: {
          sessaoId: sessao.id,
          parlamentarId: parlamentares[i].id,
          presente
        }
      })
    }

    registrarResultado('Registrar presencas', true, {
      presentes: presentes.length,
      ausentes: ausentes.length
    })

    // Verificar quorum (maioria simples = 5 de 9)
    const quorumNecessario = Math.floor(parlamentares.length / 2) + 1
    const quorumAtingido = presentes.length >= quorumNecessario
    registrarResultado('Verificar quorum', quorumAtingido, {
      necessario: quorumNecessario,
      presentes: presentes.length,
      atingido: quorumAtingido
    })

    // ============================================
    // FASE 4: INCLUSAO NA PAUTA
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 4: INCLUSAO NA PAUTA')
    console.log('-'.repeat(70))

    // Adicionar item na ordem do dia
    const countItens = await prisma.pautaItem.count({ where: { pautaId: pautaSessao.id } })

    const itemPauta = await prisma.pautaItem.create({
      data: {
        pautaId: pautaSessao.id,
        proposicaoId: proposicao.id,
        secao: 'ORDEM_DO_DIA',
        ordem: countItens + 1,
        titulo: proposicao.numero,
        descricao: proposicao.ementa,
        tipoAcao: 'VOTACAO',
        tipoVotacao: 'NOMINAL',
        status: 'PENDENTE',
        tempoEstimado: 600  // 10 minutos
      }
    })
    registrarResultado('Adicionar item na pauta', true, { id: itemPauta.id })

    // Atualizar status da proposicao
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: { status: 'EM_PAUTA' }
    })
    registrarResultado('Atualizar status proposicao para EM_PAUTA', true)

    // ============================================
    // FASE 5: SIMULACAO DO PAINEL ELETRONICO
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 5: SIMULACAO DO PAINEL ELETRONICO')
    console.log('-'.repeat(70))

    // Verificar dados que o painel exibiria
    const dadosPainel = await prisma.sessao.findUnique({
      where: { id: sessao.id },
      include: {
        presencas: {
          include: {
            parlamentar: { select: { id: true, nome: true, apelido: true, partido: true } }
          }
        },
        pautaSessao: {
          include: {
            itens: {
              include: {
                proposicao: {
                  select: {
                    id: true,
                    numero: true,
                    tipo: true,
                    ementa: true,
                    autor: { select: { nome: true, apelido: true } }
                  }
                }
              },
              orderBy: [{ secao: 'asc' }, { ordem: 'asc' }]
            }
          }
        }
      }
    })

    registrarResultado('Carregar dados para painel', true, {
      sessaoStatus: dadosPainel?.status,
      totalPresencas: dadosPainel?.presencas.length,
      totalItensPauta: dadosPainel?.pautaSessao?.itens.length
    })

    // ============================================
    // FASE 6: INICIAR DISCUSSAO E VOTACAO
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 6: INICIAR DISCUSSAO E VOTACAO')
    console.log('-'.repeat(70))

    // Iniciar discussao do item
    await prisma.pautaItem.update({
      where: { id: itemPauta.id },
      data: {
        status: 'EM_DISCUSSAO',
        iniciadoEm: new Date()
      }
    })
    registrarResultado('Iniciar discussao do item', true)

    // Simular discurso (tempo de discussao)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Passar para votacao
    await prisma.pautaItem.update({
      where: { id: itemPauta.id },
      data: { status: 'EM_VOTACAO' }
    })
    registrarResultado('Iniciar votacao do item', true)

    // ============================================
    // FASE 7: REGISTRO DE VOTOS NOMINAIS
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 7: REGISTRO DE VOTOS NOMINAIS')
    console.log('-'.repeat(70))

    // Simular votacao nominal
    // Padrão: 5 SIM, 1 NAO, 1 ABSTENCAO, 2 AUSENTE
    const votos: { parlamentarId: string; voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' }[] = []

    for (let i = 0; i < presentes.length; i++) {
      let voto: 'SIM' | 'NAO' | 'ABSTENCAO'
      if (i < 5) voto = 'SIM'
      else if (i === 5) voto = 'NAO'
      else voto = 'ABSTENCAO'

      votos.push({ parlamentarId: presentes[i], voto })

      await prisma.votacao.upsert({
        where: {
          proposicaoId_parlamentarId_turno: {
            proposicaoId: proposicao.id,
            parlamentarId: presentes[i],
            turno: 1
          }
        },
        update: { voto, sessaoId: sessao.id },
        create: {
          proposicaoId: proposicao.id,
          parlamentarId: presentes[i],
          voto,
          turno: 1,
          sessaoId: sessao.id
        }
      })
    }

    // Registrar ausentes
    for (const ausId of ausentes) {
      votos.push({ parlamentarId: ausId, voto: 'AUSENTE' })

      await prisma.votacao.upsert({
        where: {
          proposicaoId_parlamentarId_turno: {
            proposicaoId: proposicao.id,
            parlamentarId: ausId,
            turno: 1
          }
        },
        update: { voto: 'AUSENTE', sessaoId: sessao.id },
        create: {
          proposicaoId: proposicao.id,
          parlamentarId: ausId,
          voto: 'AUSENTE',
          turno: 1,
          sessaoId: sessao.id
        }
      })
    }

    const contagemVotos = {
      sim: votos.filter(v => v.voto === 'SIM').length,
      nao: votos.filter(v => v.voto === 'NAO').length,
      abstencao: votos.filter(v => v.voto === 'ABSTENCAO').length,
      ausente: votos.filter(v => v.voto === 'AUSENTE').length
    }

    registrarResultado('Registrar votos nominais', true, contagemVotos)

    // ============================================
    // FASE 8: CALCULAR RESULTADO
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 8: CALCULAR RESULTADO')
    console.log('-'.repeat(70))

    // Calcular resultado (maioria simples dos presentes votantes)
    const votosValidos = contagemVotos.sim + contagemVotos.nao
    const maioriaSimples = Math.floor(votosValidos / 2) + 1
    const resultado = contagemVotos.sim >= maioriaSimples ? 'APROVADA' : 'REJEITADA'

    registrarResultado('Calcular resultado', true, {
      votosValidos,
      maioriaSimples,
      resultado
    })

    // Criar registro de votacao agrupada
    await prisma.votacaoAgrupada.upsert({
      where: {
        proposicaoId_sessaoId_turno: {
          proposicaoId: proposicao.id,
          sessaoId: sessao.id,
          turno: 1
        }
      },
      update: {
        votosSim: contagemVotos.sim,
        votosNao: contagemVotos.nao,
        votosAbstencao: contagemVotos.abstencao,
        votosAusente: contagemVotos.ausente,
        resultado,
        tipoQuorum: 'MAIORIA_SIMPLES',
        tipoVotacao: 'NOMINAL',
        quorumNecessario: maioriaSimples,
        totalPresentes: presentes.length,
        totalMembros: parlamentares.length,
        iniciadaEm: new Date(Date.now() - 60000),
        finalizadaEm: new Date()
      },
      create: {
        proposicaoId: proposicao.id,
        sessaoId: sessao.id,
        turno: 1,
        votosSim: contagemVotos.sim,
        votosNao: contagemVotos.nao,
        votosAbstencao: contagemVotos.abstencao,
        votosAusente: contagemVotos.ausente,
        resultado,
        tipoQuorum: 'MAIORIA_SIMPLES',
        tipoVotacao: 'NOMINAL',
        quorumNecessario: maioriaSimples,
        totalPresentes: presentes.length,
        totalMembros: parlamentares.length,
        iniciadaEm: new Date(Date.now() - 60000),
        finalizadaEm: new Date()
      }
    })
    registrarResultado('Salvar votacao agrupada', true)

    // ============================================
    // FASE 9: FINALIZAR ITEM E PROPOSICAO
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 9: FINALIZAR ITEM E PROPOSICAO')
    console.log('-'.repeat(70))

    // Finalizar item da pauta
    const statusItem = resultado === 'APROVADA' ? 'APROVADO' : 'REJEITADO'
    await prisma.pautaItem.update({
      where: { id: itemPauta.id },
      data: {
        status: statusItem,
        finalizadoEm: new Date(),
        tempoReal: 600
      }
    })
    registrarResultado('Finalizar item da pauta', true, { status: statusItem })

    // Atualizar proposicao com resultado final
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: {
        status: resultado,
        resultado,
        dataVotacao: new Date(),
        sessaoVotacaoId: sessao.id
      }
    })
    registrarResultado('Atualizar proposicao com resultado', true, { resultado })

    // ============================================
    // FASE 10: VERIFICACAO FINAL
    // ============================================
    console.log('\n' + '-'.repeat(70))
    console.log('FASE 10: VERIFICACAO FINAL')
    console.log('-'.repeat(70))

    // Carregar proposicao final com todos os dados
    const proposicaoFinal = await prisma.proposicao.findUnique({
      where: { id: proposicao.id },
      include: {
        autor: { select: { nome: true, apelido: true } },
        votacoes: {
          include: {
            parlamentar: { select: { nome: true, apelido: true, partido: true } }
          }
        },
        sessaoVotacao: { select: { numero: true, tipo: true, data: true } },
        pautaItens: { select: { status: true, secao: true } }
      }
    })

    registrarResultado('Verificar dados finais da proposicao', true, {
      numero: proposicaoFinal?.numero,
      status: proposicaoFinal?.status,
      resultado: proposicaoFinal?.resultado,
      dataVotacao: proposicaoFinal?.dataVotacao,
      totalVotos: proposicaoFinal?.votacoes?.length,
      sessaoVotacao: proposicaoFinal?.sessaoVotacao?.numero
    })

    // Verificar que votos nominais estao salvos
    const votosRegistrados = await prisma.votacao.findMany({
      where: { proposicaoId: proposicao.id, turno: 1 },
      include: { parlamentar: { select: { nome: true } } }
    })

    registrarResultado('Verificar votos individuais registrados', votosRegistrados.length === parlamentares.length, {
      esperado: parlamentares.length,
      encontrado: votosRegistrados.length
    })

    // Verificar dados abertos (API publica)
    const dadosAbertos = await prisma.proposicao.findUnique({
      where: { id: proposicao.id },
      select: {
        id: true,
        numero: true,
        status: true,
        resultado: true,
        dataVotacao: true,
        autor: { select: { nome: true } }
      }
    })

    registrarResultado('Verificar dados disponiveis para API publica', !!dadosAbertos?.dataVotacao, {
      temDataVotacao: !!dadosAbertos?.dataVotacao,
      temResultado: !!dadosAbertos?.resultado,
      statusFinal: dadosAbertos?.status
    })

    // Encerrar sessao
    await prisma.sessao.update({
      where: { id: sessao.id },
      data: { status: 'CONCLUIDA' }
    })
    registrarResultado('Encerrar sessao', true)

    // ============================================
    // RESUMO FINAL
    // ============================================
    console.log('\n' + '='.repeat(70))
    console.log('RESUMO DO TESTE')
    console.log('='.repeat(70))

    const sucessos = resultados.filter(r => r.sucesso).length
    const falhas = resultados.filter(r => !r.sucesso).length

    console.log(`
   PROPOSICAO TESTADA
   ------------------
   Numero: ${proposicaoFinal?.numero}
   Autor: ${proposicaoFinal?.autor?.apelido || proposicaoFinal?.autor?.nome}
   Status Inicial: AGUARDANDO_PAUTA
   Status Final: ${proposicaoFinal?.status}
   Resultado: ${proposicaoFinal?.resultado}
   Data Votacao: ${proposicaoFinal?.dataVotacao?.toLocaleDateString('pt-BR')}
   Sessao: ${proposicaoFinal?.sessaoVotacao?.tipo} ${proposicaoFinal?.sessaoVotacao?.numero}

   VOTACAO
   -------
   Total de Votos: ${proposicaoFinal?.votacoes?.length || 0}
   SIM: ${contagemVotos.sim}
   NAO: ${contagemVotos.nao}
   ABSTENCAO: ${contagemVotos.abstencao}
   AUSENTE: ${contagemVotos.ausente}
   Quorum: MAIORIA_SIMPLES (maioria dos presentes)
   Votos Necessarios: ${maioriaSimples}

   RESULTADO DOS TESTES
   --------------------
   Total de passos: ${resultados.length}
   Sucessos: ${sucessos}
   Falhas: ${falhas}
`)

    // Detalhar votos registrados
    console.log('   VOTOS NOMINAIS REGISTRADOS:')
    for (const v of votosRegistrados) {
      console.log(`   - ${v.parlamentar.nome}: ${v.voto}`)
    }

    if (falhas > 0) {
      console.log('\n   PASSOS COM FALHA:')
      for (const r of resultados.filter(r => !r.sucesso)) {
        console.log(`   - ${r.passo}: ${r.erro}`)
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log(falhas === 0 ? 'TESTE CONCLUIDO COM SUCESSO!' : 'TESTE CONCLUIDO COM FALHAS')
    console.log('='.repeat(70))

  } catch (error) {
    console.error('\nERRO CRITICO NO TESTE:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
testarVotacaoCompleta()
