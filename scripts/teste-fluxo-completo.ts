/**
 * Script de Teste do Fluxo Legislativo Completo
 *
 * Testa o fluxo: Proposicao -> Tramitacao -> Reuniao Comissao -> Parecer -> Pauta -> Votacao
 *
 * Executar: npx ts-node scripts/teste-fluxo-completo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testarFluxoCompleto() {
  console.log('='.repeat(60))
  console.log('TESTE DO FLUXO LEGISLATIVO COMPLETO')
  console.log('='.repeat(60))

  try {
    // 1. Verificar dados existentes
    console.log('\n1. VERIFICANDO DADOS EXISTENTES...\n')

    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      take: 5,
      select: { id: true, nome: true, apelido: true }
    })
    console.log(`   Parlamentares ativos: ${parlamentares.length}`)
    parlamentares.forEach(p => console.log(`   - ${p.apelido || p.nome} (${p.id.slice(0, 8)}...)`))

    const comissoes = await prisma.comissao.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, sigla: true }
    })
    console.log(`\n   Comissoes ativas: ${comissoes.length}`)
    comissoes.forEach(c => console.log(`   - ${c.sigla || c.nome} (${c.id.slice(0, 8)}...)`))

    const sessoes = await prisma.sessao.findMany({
      where: { status: 'AGENDADA' },
      take: 3,
      select: { id: true, numero: true, data: true, tipo: true }
    })
    console.log(`\n   Sessoes agendadas: ${sessoes.length}`)
    sessoes.forEach(s => console.log(`   - ${s.tipo} ${s.numero} em ${s.data.toLocaleDateString('pt-BR')}`))

    if (parlamentares.length === 0) {
      console.log('\n   ERRO: Nenhum parlamentar ativo encontrado. Crie parlamentares primeiro.')
      return
    }

    if (comissoes.length === 0) {
      console.log('\n   ERRO: Nenhuma comissao ativa encontrada. Crie comissoes primeiro.')
      return
    }

    // 2. Criar proposicao de teste
    console.log('\n' + '='.repeat(60))
    console.log('2. CRIANDO PROPOSICAO DE TESTE...\n')

    const autorId = parlamentares[0].id
    const ano = new Date().getFullYear()

    // Contar proposicoes existentes para gerar numero
    const countPL = await prisma.proposicao.count({
      where: { tipo: 'PROJETO_LEI', ano }
    })
    const numero = `PL ${String(countPL + 1).padStart(3, '0')}/${ano}`

    const proposicao = await prisma.proposicao.create({
      data: {
        numero,
        ano,
        tipo: 'PROJETO_LEI',
        titulo: 'Projeto de Lei de Teste - Fluxo Completo',
        ementa: 'Dispoe sobre a realizacao de testes do fluxo legislativo completo no sistema.',
        texto: 'Art. 1o Este projeto de lei tem por objetivo testar o fluxo legislativo.\n\nArt. 2o Esta lei entra em vigor na data de sua publicacao.',
        status: 'APRESENTADA',
        dataApresentacao: new Date(),
        autorId
      }
    })

    console.log(`   Proposicao criada: ${proposicao.numero}`)
    console.log(`   ID: ${proposicao.id}`)
    console.log(`   Status: ${proposicao.status}`)
    console.log(`   Autor ID: ${proposicao.autorId}`)

    // 3. Criar tramitacao para comissao
    console.log('\n' + '='.repeat(60))
    console.log('3. TRAMITANDO PARA COMISSAO...\n')

    // Encontrar CLJ ou primeira comissao
    const clj = comissoes.find(c => c.sigla === 'CLJ') || comissoes[0]
    console.log(`   Comissao destino: ${clj.sigla || clj.nome}`)

    // Verificar se existe unidade de tramitacao para a comissao
    let unidade = await prisma.tramitacaoUnidade.findFirst({
      where: { nome: { contains: clj.nome } }
    })

    if (!unidade) {
      unidade = await prisma.tramitacaoUnidade.create({
        data: {
          nome: clj.sigla ? `Comissao ${clj.sigla}` : clj.nome,
          sigla: clj.sigla || 'COM',
          tipo: 'COMISSAO',
          ativo: true
        }
      })
      console.log(`   Unidade de tramitacao criada: ${unidade.nome}`)
    }

    // Verificar se existe tipo de tramitacao
    let tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
      where: { nome: { contains: 'Distribuicao' } }
    })

    if (!tipoTramitacao) {
      tipoTramitacao = await prisma.tramitacaoTipo.create({
        data: {
          nome: 'Distribuicao para Analise',
          descricao: 'Distribuicao de proposicao para analise em comissao',
          ativo: true,
          prazoRegimental: 15
        }
      })
      console.log(`   Tipo de tramitacao criado: ${tipoTramitacao.nome}`)
    }

    const tramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId: proposicao.id,
        tipoTramitacaoId: tipoTramitacao.id,
        unidadeId: unidade.id,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO'
      }
    })

    // Atualizar status da proposicao
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: { status: 'EM_TRAMITACAO' }
    })

    console.log(`   Tramitacao criada: ${tramitacao.id.slice(0, 8)}...`)
    console.log(`   Proposicao status: EM_TRAMITACAO`)

    // 4. Criar reuniao de comissao
    console.log('\n' + '='.repeat(60))
    console.log('4. CRIANDO REUNIAO DE COMISSAO...\n')

    // Contar reunioes existentes
    const countReunioes = await prisma.reuniaoComissao.count({
      where: { comissaoId: clj.id, ano }
    })

    const reuniao = await prisma.reuniaoComissao.create({
      data: {
        comissaoId: clj.id,
        numero: countReunioes + 1,
        ano,
        tipo: 'ORDINARIA',
        status: 'AGENDADA',
        data: new Date(),
        local: 'Sala de Reunioes',
        quorumMinimo: 2
      }
    })

    console.log(`   Reuniao criada: ${reuniao.numero}a Reuniao Ordinaria/${reuniao.ano}`)
    console.log(`   ID: ${reuniao.id}`)

    // Adicionar proposicao na pauta da reuniao
    const itemPauta = await prisma.pautaReuniaoComissao.create({
      data: {
        reuniaoId: reuniao.id,
        proposicaoId: proposicao.id,
        ordem: 1,
        titulo: `Analise do ${proposicao.numero}`,
        tipo: 'ANALISE_PROPOSICAO',
        status: 'PENDENTE'
      }
    })

    console.log(`   Item de pauta criado: ${itemPauta.titulo}`)

    // 5. Criar parecer
    console.log('\n' + '='.repeat(60))
    console.log('5. CRIANDO PARECER...\n')

    // Buscar membros da comissao
    const membros = await prisma.membroComissao.findMany({
      where: { comissaoId: clj.id, ativo: true },
      include: { parlamentar: true }
    })

    if (membros.length === 0) {
      // Criar membro se nao existir
      const membroData = await prisma.membroComissao.create({
        data: {
          comissaoId: clj.id,
          parlamentarId: parlamentares[0].id,
          cargo: 'PRESIDENTE',
          dataInicio: new Date(),
          ativo: true
        }
      })
      membros.push({ ...membroData, parlamentar: parlamentares[0] } as any)
      console.log(`   Membro criado: ${parlamentares[0].nome} como PRESIDENTE`)
    }

    const relator = membros[0]
    console.log(`   Relator: ${relator.parlamentar.nome}`)

    // Contar pareceres para gerar numero
    const countPareceres = await prisma.parecer.count({ where: { ano } })

    const parecer = await prisma.parecer.create({
      data: {
        proposicaoId: proposicao.id,
        comissaoId: clj.id,
        relatorId: relator.parlamentarId,
        reuniaoId: reuniao.id,
        numero: `${String(countPareceres + 1).padStart(3, '0')}/${ano}`,
        ano,
        tipo: 'FAVORAVEL',
        status: 'AGUARDANDO_VOTACAO',
        fundamentacao: 'Apos analise detalhada da materia, verificamos que a proposicao atende aos requisitos legais e regimentais, sendo de interesse publico sua aprovacao.',
        conclusao: 'Pelo exposto, somos FAVORAVEIS a aprovacao do presente projeto de lei.',
        dataDistribuicao: new Date()
      }
    })

    console.log(`   Parecer criado: ${parecer.numero}`)
    console.log(`   Tipo: ${parecer.tipo}`)
    console.log(`   Status: ${parecer.status}`)

    // 6. Simular votacao do parecer na reuniao
    console.log('\n' + '='.repeat(60))
    console.log('6. VOTANDO PARECER NA REUNIAO...\n')

    // Registrar presenca dos membros
    for (const membro of membros) {
      await prisma.presencaReuniaoComissao.create({
        data: {
          reuniaoId: reuniao.id,
          membroComissaoId: membro.id,
          presente: true,
          horaChegada: new Date()
        }
      })
    }
    console.log(`   Presencas registradas: ${membros.length}`)

    // Iniciar reuniao
    await prisma.reuniaoComissao.update({
      where: { id: reuniao.id },
      data: { status: 'EM_ANDAMENTO', horaInicio: new Date() }
    })
    console.log(`   Reuniao iniciada`)

    // Votar parecer
    const votosAFavor = membros.length
    await prisma.parecer.update({
      where: { id: parecer.id },
      data: {
        status: 'APROVADO_COMISSAO',
        dataVotacao: new Date(),
        votosAFavor,
        votosContra: 0,
        votosAbstencao: 0
      }
    })
    console.log(`   Parecer aprovado: ${votosAFavor} votos a favor`)

    // Atualizar proposicao para AGUARDANDO_PAUTA
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: { status: 'AGUARDANDO_PAUTA' }
    })
    console.log(`   Proposicao status: AGUARDANDO_PAUTA`)

    // Encerrar reuniao
    await prisma.reuniaoComissao.update({
      where: { id: reuniao.id },
      data: { status: 'CONCLUIDA', horaFim: new Date() }
    })
    console.log(`   Reuniao encerrada`)

    // 7. Adicionar na pauta da sessao plenaria
    console.log('\n' + '='.repeat(60))
    console.log('7. ADICIONANDO NA PAUTA DA SESSAO...\n')

    let sessao = sessoes[0]
    if (!sessao) {
      // Criar sessao se nao existir
      const countSessoes = await prisma.sessao.count({
        where: { tipo: 'ORDINARIA' }
      })

      sessao = await prisma.sessao.create({
        data: {
          numero: countSessoes + 1,
          tipo: 'ORDINARIA',
          data: new Date(Date.now() + 86400000), // amanha
          horario: '18:00',
          status: 'AGENDADA'
        }
      })
      console.log(`   Sessao criada: ${sessao.tipo} ${sessao.numero}`)
    }

    // Criar ou obter pauta da sessao
    let pautaSessao = await prisma.pautaSessao.findUnique({
      where: { sessaoId: sessao.id }
    })

    if (!pautaSessao) {
      pautaSessao = await prisma.pautaSessao.create({
        data: {
          sessaoId: sessao.id,
          status: 'RASCUNHO'
        }
      })
    }

    // Contar itens existentes
    const countItens = await prisma.pautaItem.count({
      where: { pautaId: pautaSessao.id }
    })

    // Adicionar item na ordem do dia
    const itemSessao = await prisma.pautaItem.create({
      data: {
        pautaId: pautaSessao.id,
        proposicaoId: proposicao.id,
        secao: 'ORDEM_DO_DIA',
        ordem: countItens + 1,
        titulo: proposicao.numero,
        descricao: proposicao.ementa,
        tipoAcao: 'VOTACAO',
        tipoVotacao: 'NOMINAL',
        status: 'PENDENTE'
      }
    })

    // Atualizar proposicao
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: { status: 'EM_PAUTA' }
    })

    console.log(`   Sessao: ${sessao.tipo} ${sessao.numero}`)
    console.log(`   Item adicionado na Ordem do Dia`)
    console.log(`   Proposicao status: EM_PAUTA`)

    // 8. Simular votacao no plenario
    console.log('\n' + '='.repeat(60))
    console.log('8. SIMULANDO VOTACAO NO PLENARIO...\n')

    // Registrar votos
    let votosSim = 0
    let votosNao = 0

    for (let i = 0; i < parlamentares.length; i++) {
      const voto = i < parlamentares.length - 1 ? 'SIM' : 'NAO'
      await prisma.votacao.create({
        data: {
          proposicaoId: proposicao.id,
          parlamentarId: parlamentares[i].id,
          voto,
          turno: 1,
          sessaoId: sessao.id
        }
      })

      if (voto === 'SIM') votosSim++
      else votosNao++
    }

    console.log(`   Votos registrados: ${votosSim} SIM, ${votosNao} NAO`)

    // Determinar resultado
    const resultado = votosSim > votosNao ? 'APROVADA' : 'REJEITADA'
    const statusFinal = resultado === 'APROVADA' ? 'APROVADA' : 'REJEITADA'

    // Atualizar proposicao com resultado
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: {
        status: statusFinal,
        resultado,
        dataVotacao: new Date(),
        sessaoVotacaoId: sessao.id
      }
    })

    // Atualizar item da pauta
    const statusItem = resultado === 'APROVADA' ? 'APROVADO' : 'REJEITADO'
    await prisma.pautaItem.update({
      where: { id: itemSessao.id },
      data: { status: statusItem }
    })

    console.log(`   Resultado: ${resultado}`)
    console.log(`   Proposicao status final: ${statusFinal}`)

    // Resumo final
    console.log('\n' + '='.repeat(60))
    console.log('RESUMO DO TESTE')
    console.log('='.repeat(60))

    const proposicaoFinal = await prisma.proposicao.findUnique({
      where: { id: proposicao.id },
      include: {
        autor: { select: { nome: true } },
        tramitacoes: true,
        pareceres: true,
        votacoes: true,
        pautaItens: true
      }
    })

    console.log(`
   Proposicao: ${proposicaoFinal?.numero}
   Autor: ${proposicaoFinal?.autor?.nome || 'Não informado'}
   Status Final: ${proposicaoFinal?.status}
   Resultado: ${proposicaoFinal?.resultado}

   Tramitacoes: ${proposicaoFinal?.tramitacoes.length}
   Pareceres: ${proposicaoFinal?.pareceres.length}
   Votacoes: ${proposicaoFinal?.votacoes.length}
   Itens de Pauta: ${proposicaoFinal?.pautaItens.length}

   Data Apresentacao: ${proposicaoFinal?.dataApresentacao.toLocaleDateString('pt-BR')}
   Data Votacao: ${proposicaoFinal?.dataVotacao?.toLocaleDateString('pt-BR')}
`)

    console.log('='.repeat(60))
    console.log('TESTE CONCLUIDO COM SUCESSO!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\nERRO NO TESTE:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
testarFluxoCompleto()
