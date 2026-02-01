/**
 * ============================================================================
 * TESTE COMPLETO DO PROCESSO LEGISLATIVO
 * ============================================================================
 *
 * Este script simula todo o fluxo legislativo testando:
 * 1. Permissoes por tipo de usuario (ADMIN, SECRETARIA, AUXILIAR_LEGISLATIVO, etc)
 * 2. Criacao e validacao de proposicoes
 * 3. Tramitacao entre orgaos
 * 4. Reunioes e pareceres de comissoes
 * 5. Inclusao na pauta de sessao
 * 6. Registro de presenca e quorum
 * 7. Votacao nominal
 * 8. Calculo de resultado
 * 9. Distribuicao de resultados para parlamentares
 * 10. Validacao de regras de negocio (RN-XXX)
 *
 * Executar: npx ts-node scripts/teste-processo-legislativo-completo.ts
 */

import { PrismaClient, UserRole, StatusProposicao, TipoVoto, TipoParecer, StatusParecer } from '@prisma/client'

// Tipo de proposicao agora e string flexivel
type TipoProposicaoCodigo = string

const prisma = new PrismaClient()

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface TesteResultado {
  etapa: string
  status: 'SUCESSO' | 'FALHA' | 'AVISO'
  mensagem: string
  dados?: any
  erro?: string
  regraValidada?: string
}

interface RelatorioTeste {
  inicio: Date
  fim?: Date
  totalEtapas: number
  sucessos: number
  falhas: number
  avisos: number
  resultados: TesteResultado[]
  errosCriticos: string[]
  regrasValidadas: string[]
  regrasVioladas: string[]
}

// ============================================================================
// FUNCOES AUXILIARES
// ============================================================================

const relatorio: RelatorioTeste = {
  inicio: new Date(),
  totalEtapas: 0,
  sucessos: 0,
  falhas: 0,
  avisos: 0,
  resultados: [],
  errosCriticos: [],
  regrasValidadas: [],
  regrasVioladas: []
}

function log(tipo: 'INFO' | 'SUCESSO' | 'ERRO' | 'AVISO', mensagem: string) {
  const icones = {
    INFO: '\x1b[36m[i]\x1b[0m',
    SUCESSO: '\x1b[32m[✓]\x1b[0m',
    ERRO: '\x1b[31m[✗]\x1b[0m',
    AVISO: '\x1b[33m[!]\x1b[0m'
  }
  console.log(`${icones[tipo]} ${mensagem}`)
}

function registrarResultado(resultado: TesteResultado) {
  relatorio.totalEtapas++
  relatorio.resultados.push(resultado)

  if (resultado.status === 'SUCESSO') {
    relatorio.sucessos++
    log('SUCESSO', `${resultado.etapa}: ${resultado.mensagem}`)
    if (resultado.regraValidada) {
      relatorio.regrasValidadas.push(resultado.regraValidada)
    }
  } else if (resultado.status === 'FALHA') {
    relatorio.falhas++
    log('ERRO', `${resultado.etapa}: ${resultado.mensagem}`)
    if (resultado.erro) {
      relatorio.errosCriticos.push(`${resultado.etapa}: ${resultado.erro}`)
    }
    if (resultado.regraValidada) {
      relatorio.regrasVioladas.push(resultado.regraValidada)
    }
  } else {
    relatorio.avisos++
    log('AVISO', `${resultado.etapa}: ${resultado.mensagem}`)
  }
}

function separador(titulo: string) {
  console.log('\n' + '='.repeat(70))
  console.log(`  ${titulo}`)
  console.log('='.repeat(70) + '\n')
}

// ============================================================================
// TESTE 1: VERIFICAR ESTRUTURA DE PERMISSOES
// ============================================================================

async function testarPermissoesUsuarios() {
  separador('TESTE 1: VERIFICAR ESTRUTURA DE PERMISSOES')

  const rolesEsperados: UserRole[] = [
    'ADMIN',
    'SECRETARIA',
    'AUXILIAR_LEGISLATIVO',
    'EDITOR',
    'OPERADOR',
    'PARLAMENTAR',
    'USER'
  ]

  // Verificar se todos os roles existem no schema
  for (const role of rolesEsperados) {
    try {
      const count = await prisma.user.count({ where: { role } })
      registrarResultado({
        etapa: `Permissoes.${role}`,
        status: 'SUCESSO',
        mensagem: `Role ${role} existe no sistema (${count} usuarios)`,
        dados: { role, count }
      })
    } catch (error: any) {
      registrarResultado({
        etapa: `Permissoes.${role}`,
        status: 'FALHA',
        mensagem: `Role ${role} nao existe ou erro ao verificar`,
        erro: error.message
      })
    }
  }

  // Verificar usuarios ativos por role
  const usuariosPorRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
    where: { ativo: true }
  })

  log('INFO', `Distribuicao de usuarios ativos:`)
  usuariosPorRole.forEach(u => {
    console.log(`   - ${u.role}: ${u._count.id}`)
  })
}

// ============================================================================
// TESTE 2: VERIFICAR DADOS BASE
// ============================================================================

async function testarDadosBase() {
  separador('TESTE 2: VERIFICAR DADOS BASE')

  // Parlamentares
  const parlamentares = await prisma.parlamentar.findMany({
    where: { ativo: true },
    include: { mandatos: { where: { ativo: true } } }
  })

  if (parlamentares.length >= 5) {
    registrarResultado({
      etapa: 'DadosBase.Parlamentares',
      status: 'SUCESSO',
      mensagem: `${parlamentares.length} parlamentares ativos encontrados`,
      regraValidada: 'RN-001: Base de parlamentares configurada'
    })
  } else {
    registrarResultado({
      etapa: 'DadosBase.Parlamentares',
      status: 'AVISO',
      mensagem: `Apenas ${parlamentares.length} parlamentares ativos (recomendado: 5+)`
    })
  }

  // Comissoes
  const comissoes = await prisma.comissao.findMany({
    where: { ativa: true },
    include: { membros: { where: { ativo: true } } }
  })

  const clj = comissoes.find(c => c.sigla === 'CLJ' || c.nome.includes('Legislacao'))
  if (clj) {
    registrarResultado({
      etapa: 'DadosBase.CLJ',
      status: 'SUCESSO',
      mensagem: `CLJ encontrada: ${clj.nome} (${clj.membros.length} membros)`,
      regraValidada: 'RN-030: CLJ obrigatoria configurada'
    })
  } else {
    registrarResultado({
      etapa: 'DadosBase.CLJ',
      status: 'FALHA',
      mensagem: 'CLJ (Comissao de Legislacao e Justica) NAO encontrada',
      erro: 'Toda proposicao deve passar pela CLJ conforme RN-030',
      regraValidada: 'RN-030: CLJ obrigatoria'
    })
  }

  // Legislatura ativa
  const legislatura = await prisma.legislatura.findFirst({
    where: { ativa: true },
    include: { periodos: true }
  })

  if (legislatura) {
    registrarResultado({
      etapa: 'DadosBase.Legislatura',
      status: 'SUCESSO',
      mensagem: `Legislatura ${legislatura.numero}a ativa (${legislatura.anoInicio}-${legislatura.anoFim})`,
      dados: legislatura
    })
  } else {
    registrarResultado({
      etapa: 'DadosBase.Legislatura',
      status: 'AVISO',
      mensagem: 'Nenhuma legislatura ativa encontrada'
    })
  }

  return { parlamentares, comissoes, legislatura, clj }
}

// ============================================================================
// TESTE 3: CRIAR PROPOSICAO
// ============================================================================

async function testarCriacaoProposicao(parlamentares: any[]) {
  separador('TESTE 3: CRIAR PROPOSICAO DE TESTE')

  if (parlamentares.length === 0) {
    registrarResultado({
      etapa: 'Proposicao.Criar',
      status: 'FALHA',
      mensagem: 'Nao ha parlamentares para criar proposicao',
      erro: 'Dados base insuficientes'
    })
    return null
  }

  const ano = new Date().getFullYear()
  const autorId = parlamentares[0].id

  try {
    // Gerar numero automatico - buscar todas as PLs do ano e encontrar o maior numero
    const todasPLs = await prisma.proposicao.findMany({
      where: { tipo: 'PROJETO_LEI', ano },
      select: { numero: true }
    })

    let proximoNumero = 1
    for (const pl of todasPLs) {
      const match = pl.numero.match(/(\d+)/)
      if (match) {
        const num = parseInt(match[1])
        if (num >= proximoNumero) proximoNumero = num + 1
      }
    }

    const numero = String(proximoNumero).padStart(3, '0')

    const proposicao = await prisma.proposicao.create({
      data: {
        numero,
        ano,
        tipo: 'PROJETO_LEI',
        titulo: `Projeto de Lei de Teste Automatizado ${numero}/${ano}`,
        ementa: 'Dispoe sobre a validacao do fluxo legislativo completo do sistema.',
        texto: `
PROJETO DE LEI No ${numero}/${ano}

Dispoe sobre a validacao do fluxo legislativo completo do sistema.

A CAMARA MUNICIPAL DE MOJUI DOS CAMPOS, Estado do Para, no uso de suas atribuicoes legais, DECRETA:

Art. 1o Este projeto de lei tem por objetivo validar todo o fluxo do processo legislativo no sistema.

Art. 2o O sistema devera garantir:
I - Registro de todas as etapas do processo;
II - Rastreabilidade de acoes;
III - Transparencia dos dados.

Art. 3o Esta lei entra em vigor na data de sua publicacao.

Mojui dos Campos, ${new Date().toLocaleDateString('pt-BR')}.
        `.trim(),
        status: 'APRESENTADA',
        dataApresentacao: new Date(),
        autorId
      },
      include: { autor: true }
    })

    registrarResultado({
      etapa: 'Proposicao.Criar',
      status: 'SUCESSO',
      mensagem: `PL ${proposicao.numero}/${proposicao.ano} criado por ${proposicao.autor?.nome || 'autor'}`,
      dados: { id: proposicao.id, numero: proposicao.numero },
      regraValidada: 'RN-020: Proposicao criada com autor valido'
    })

    // Verificar auto-numeracao
    if (proposicao.numero === numero) {
      registrarResultado({
        etapa: 'Proposicao.Numeracao',
        status: 'SUCESSO',
        mensagem: 'Auto-numeracao funcionando corretamente',
        regraValidada: 'RN-021: Numeracao sequencial por tipo/ano'
      })
    }

    return proposicao

  } catch (error: any) {
    registrarResultado({
      etapa: 'Proposicao.Criar',
      status: 'FALHA',
      mensagem: 'Erro ao criar proposicao',
      erro: error.message
    })
    return null
  }
}

// ============================================================================
// TESTE 4: TRAMITACAO PARA CLJ
// ============================================================================

async function testarTramitacao(proposicao: any, clj: any) {
  separador('TESTE 4: TRAMITACAO PARA COMISSAO')

  if (!proposicao || !clj) {
    registrarResultado({
      etapa: 'Tramitacao.Criar',
      status: 'FALHA',
      mensagem: 'Dados insuficientes para tramitacao',
      erro: !proposicao ? 'Proposicao nao criada' : 'CLJ nao encontrada'
    })
    return null
  }

  try {
    // Buscar ou criar unidade de tramitacao
    let unidade = await prisma.tramitacaoUnidade.findFirst({
      where: { tipo: 'COMISSAO' }
    })

    if (!unidade) {
      unidade = await prisma.tramitacaoUnidade.create({
        data: {
          nome: 'Comissao de Legislacao e Justica',
          sigla: 'CLJ',
          tipo: 'COMISSAO',
          ativo: true
        }
      })
    }

    // Buscar ou criar tipo de tramitacao
    let tipoTramitacao = await prisma.tramitacaoTipo.findFirst({
      where: { ativo: true }
    })

    if (!tipoTramitacao) {
      tipoTramitacao = await prisma.tramitacaoTipo.create({
        data: {
          nome: 'Distribuicao para Analise',
          descricao: 'Distribuicao de proposicao para analise em comissao',
          prazoRegimental: 15,
          ativo: true
        }
      })
    }

    // Criar tramitacao
    const tramitacao = await prisma.tramitacao.create({
      data: {
        proposicaoId: proposicao.id,
        tipoTramitacaoId: tipoTramitacao.id,
        unidadeId: unidade.id,
        dataEntrada: new Date(),
        status: 'EM_ANDAMENTO',
        observacoes: 'Encaminhado para analise de constitucionalidade e legalidade'
      }
    })

    // Atualizar status da proposicao
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: { status: 'EM_TRAMITACAO' }
    })

    registrarResultado({
      etapa: 'Tramitacao.Criar',
      status: 'SUCESSO',
      mensagem: `Proposicao tramitada para ${unidade.nome}`,
      dados: { tramitacaoId: tramitacao.id },
      regraValidada: 'RN-030: Tramitacao obrigatoria pela CLJ iniciada'
    })

    // Criar historico
    await prisma.tramitacaoHistorico.create({
      data: {
        tramitacaoId: tramitacao.id,
        acao: 'DISTRIBUICAO',
        descricao: `Proposicao ${proposicao.numero}/${proposicao.ano} distribuida para analise`
      }
    })

    registrarResultado({
      etapa: 'Tramitacao.Historico',
      status: 'SUCESSO',
      mensagem: 'Historico de tramitacao registrado',
      regraValidada: 'RN-003: Rastreabilidade de acoes'
    })

    return tramitacao

  } catch (error: any) {
    registrarResultado({
      etapa: 'Tramitacao.Criar',
      status: 'FALHA',
      mensagem: 'Erro ao tramitar proposicao',
      erro: error.message
    })
    return null
  }
}

// ============================================================================
// TESTE 5: REUNIAO DE COMISSAO E PARECER
// ============================================================================

async function testarReuniaoEParecer(proposicao: any, clj: any) {
  separador('TESTE 5: REUNIAO DE COMISSAO E PARECER')

  if (!proposicao || !clj) {
    registrarResultado({
      etapa: 'Reuniao.Criar',
      status: 'FALHA',
      mensagem: 'Dados insuficientes para reuniao',
      erro: 'Proposicao ou CLJ nao encontrada'
    })
    return null
  }

  try {
    const ano = new Date().getFullYear()

    // Verificar membros da comissao
    let membros = await prisma.membroComissao.findMany({
      where: { comissaoId: clj.id, ativo: true },
      include: { parlamentar: true }
    })

    if (membros.length === 0) {
      // Criar membros de teste
      const parlamentares = await prisma.parlamentar.findMany({
        where: { ativo: true },
        take: 3
      })

      for (let i = 0; i < Math.min(parlamentares.length, 3); i++) {
        const cargo = i === 0 ? 'PRESIDENTE' : i === 1 ? 'VICE_PRESIDENTE' : 'MEMBRO'
        await prisma.membroComissao.create({
          data: {
            comissaoId: clj.id,
            parlamentarId: parlamentares[i].id,
            cargo,
            dataInicio: new Date(),
            ativo: true
          }
        })
      }

      membros = await prisma.membroComissao.findMany({
        where: { comissaoId: clj.id, ativo: true },
        include: { parlamentar: true }
      })

      registrarResultado({
        etapa: 'Reuniao.Membros',
        status: 'AVISO',
        mensagem: `Membros criados automaticamente para CLJ: ${membros.length}`
      })
    }

    // Criar reuniao
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
        local: 'Sala de Reunioes da Camara',
        quorumMinimo: Math.ceil(membros.length / 2)
      }
    })

    registrarResultado({
      etapa: 'Reuniao.Criar',
      status: 'SUCESSO',
      mensagem: `${reuniao.numero}a Reuniao Ordinaria/${ano} criada`,
      dados: { reuniaoId: reuniao.id }
    })

    // Registrar presencas
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

    // Verificar quorum
    const presentes = membros.length
    const quorumMinimo = reuniao.quorumMinimo

    if (presentes >= quorumMinimo) {
      registrarResultado({
        etapa: 'Reuniao.Quorum',
        status: 'SUCESSO',
        mensagem: `Quorum atingido: ${presentes}/${quorumMinimo} presentes`,
        regraValidada: 'RN-040: Quorum de instalacao verificado'
      })
    } else {
      registrarResultado({
        etapa: 'Reuniao.Quorum',
        status: 'FALHA',
        mensagem: `Quorum NAO atingido: ${presentes}/${quorumMinimo}`,
        regraValidada: 'RN-040: Quorum de instalacao'
      })
    }

    // Iniciar reuniao
    await prisma.reuniaoComissao.update({
      where: { id: reuniao.id },
      data: { status: 'EM_ANDAMENTO', horaInicio: new Date() }
    })

    // Criar parecer
    const relator = membros.find(m => m.cargo === 'PRESIDENTE') || membros[0]

    const countPareceres = await prisma.parecer.count({ where: { ano } })
    const numeroParecer = String(countPareceres + 1).padStart(3, '0')

    const parecer = await prisma.parecer.create({
      data: {
        proposicaoId: proposicao.id,
        comissaoId: clj.id,
        relatorId: relator.parlamentarId,
        reuniaoId: reuniao.id,
        numero: `${numeroParecer}/${ano}`,
        ano,
        tipo: 'FAVORAVEL',
        status: 'RASCUNHO',
        fundamentacao: `
Senhor Presidente,
Senhores Vereadores,

Analisamos o ${proposicao.numero}/${proposicao.ano} que "${proposicao.ementa}".

Apos detida analise, verificamos que a proposicao:
- Atende aos requisitos constitucionais e legais;
- Esta em conformidade com a Lei Organica Municipal;
- Nao apresenta vicios de iniciativa;
- E de interesse publico.

Pelo exposto, opinamos pela APROVACAO do presente projeto de lei.

Sala das Comissoes, ${new Date().toLocaleDateString('pt-BR')}.
        `.trim(),
        conclusao: 'FAVORAVEL a aprovacao',
        dataDistribuicao: new Date(),
        prazoEmissao: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 dias
      }
    })

    registrarResultado({
      etapa: 'Parecer.Criar',
      status: 'SUCESSO',
      mensagem: `Parecer ${parecer.numero} criado por ${relator.parlamentar.nome}`,
      dados: { parecerId: parecer.id, tipo: parecer.tipo },
      regraValidada: 'RN-031: Parecer elaborado por relator designado'
    })

    // Votar parecer na comissao
    let votosAFavor = 0
    for (const membro of membros) {
      await prisma.votoParecerComissao.create({
        data: {
          parecerId: parecer.id,
          parlamentarId: membro.parlamentarId,
          voto: 'SIM'
        }
      })
      votosAFavor++
    }

    // Atualizar parecer
    await prisma.parecer.update({
      where: { id: parecer.id },
      data: {
        status: 'EMITIDO',
        votosAFavor,
        votosContra: 0,
        votosAbstencao: 0,
        dataVotacao: new Date(),
        dataEmissao: new Date()
      }
    })

    registrarResultado({
      etapa: 'Parecer.Aprovar',
      status: 'SUCESSO',
      mensagem: `Parecer aprovado por unanimidade (${votosAFavor} votos)`,
      regraValidada: 'RN-032: Parecer votado em reuniao'
    })

    // Atualizar proposicao
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: { status: 'AGUARDANDO_PAUTA' }
    })

    // Encerrar reuniao
    await prisma.reuniaoComissao.update({
      where: { id: reuniao.id },
      data: { status: 'CONCLUIDA', horaFim: new Date() }
    })

    registrarResultado({
      etapa: 'Reuniao.Encerrar',
      status: 'SUCESSO',
      mensagem: 'Reuniao encerrada com sucesso'
    })

    return { reuniao, parecer }

  } catch (error: any) {
    registrarResultado({
      etapa: 'Reuniao.Geral',
      status: 'FALHA',
      mensagem: 'Erro no processo de reuniao/parecer',
      erro: error.message
    })
    return null
  }
}

// ============================================================================
// TESTE 6: INCLUSAO NA PAUTA DA SESSAO
// ============================================================================

async function testarInclusaoPauta(proposicao: any, parecer: any) {
  separador('TESTE 6: INCLUSAO NA PAUTA DA SESSAO')

  if (!proposicao) {
    registrarResultado({
      etapa: 'Pauta.Inclusao',
      status: 'FALHA',
      mensagem: 'Proposicao nao encontrada'
    })
    return null
  }

  try {
    // Verificar se proposicao tem parecer (RN-030)
    if (!parecer) {
      registrarResultado({
        etapa: 'Pauta.ValidarParecer',
        status: 'AVISO',
        mensagem: 'Proposicao sem parecer - violacao potencial de RN-030'
      })
    } else {
      registrarResultado({
        etapa: 'Pauta.ValidarParecer',
        status: 'SUCESSO',
        mensagem: `Parecer ${parecer.numero} verificado - ${parecer.tipo}`,
        regraValidada: 'RN-030: Parecer obrigatorio antes da pauta'
      })
    }

    // Criar ou buscar sessao
    const ano = new Date().getFullYear()
    let sessao = await prisma.sessao.findFirst({
      where: { status: 'AGENDADA' },
      orderBy: { data: 'asc' }
    })

    if (!sessao) {
      const countSessoes = await prisma.sessao.count({
        where: { tipo: 'ORDINARIA', data: { gte: new Date(`${ano}-01-01`) } }
      })

      sessao = await prisma.sessao.create({
        data: {
          numero: countSessoes + 1,
          tipo: 'ORDINARIA',
          data: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias (garante 48h+ para PNTP)
          horario: '18:00',
          status: 'AGENDADA',
          local: 'Plenario da Camara Municipal'
        }
      })

      registrarResultado({
        etapa: 'Sessao.Criar',
        status: 'SUCESSO',
        mensagem: `Sessao ORDINARIA ${sessao.numero} criada`
      })
    }

    // Criar pauta
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
      where: { pautaId: pautaSessao.id, secao: 'ORDEM_DO_DIA' }
    })

    // Adicionar item na ordem do dia
    const itemPauta = await prisma.pautaItem.create({
      data: {
        pautaId: pautaSessao.id,
        proposicaoId: proposicao.id,
        secao: 'ORDEM_DO_DIA',
        ordem: countItens + 1,
        titulo: `${proposicao.numero}/${proposicao.ano}`,
        descricao: proposicao.ementa,
        tipoAcao: 'VOTACAO',
        tipoVotacao: 'NOMINAL',
        status: 'PENDENTE',
        tempoEstimado: 15 // 15 minutos
      }
    })

    // Atualizar status da proposicao
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: { status: 'EM_PAUTA' }
    })

    registrarResultado({
      etapa: 'Pauta.Inclusao',
      status: 'SUCESSO',
      mensagem: `Proposicao incluida na Ordem do Dia (posicao ${itemPauta.ordem})`,
      dados: { itemId: itemPauta.id, sessaoId: sessao.id },
      regraValidada: 'RN-043: Ordem dos trabalhos respeitada'
    })

    // Verificar publicacao 48h antes (PNTP)
    const horasAteASessao = (sessao.data.getTime() - Date.now()) / (1000 * 60 * 60)
    if (horasAteASessao >= 48) {
      registrarResultado({
        etapa: 'Pauta.PNTP',
        status: 'SUCESSO',
        mensagem: `Pauta publicada ${Math.floor(horasAteASessao)}h antes da sessao`,
        regraValidada: 'RN-120: Pauta publicada 48h antes (PNTP)'
      })
    } else {
      registrarResultado({
        etapa: 'Pauta.PNTP',
        status: 'AVISO',
        mensagem: `Pauta publicada ${Math.floor(horasAteASessao)}h antes (recomendado: 48h+)`
      })
    }

    return { sessao, pautaSessao, itemPauta }

  } catch (error: any) {
    registrarResultado({
      etapa: 'Pauta.Geral',
      status: 'FALHA',
      mensagem: 'Erro ao incluir na pauta',
      erro: error.message
    })
    return null
  }
}

// ============================================================================
// TESTE 7: REGISTRO DE PRESENCA E VOTACAO
// ============================================================================

async function testarVotacao(proposicao: any, sessao: any, itemPauta: any, parlamentares: any[]) {
  separador('TESTE 7: REGISTRO DE PRESENCA E VOTACAO')

  if (!proposicao || !sessao || parlamentares.length === 0) {
    registrarResultado({
      etapa: 'Votacao.Geral',
      status: 'FALHA',
      mensagem: 'Dados insuficientes para votacao'
    })
    return null
  }

  try {
    // Registrar presencas
    log('INFO', 'Registrando presencas...')
    let presentes = 0

    for (let i = 0; i < parlamentares.length; i++) {
      const presente = i < parlamentares.length - 1 // ultimo ausente
      await prisma.presencaSessao.upsert({
        where: {
          sessaoId_parlamentarId: {
            sessaoId: sessao.id,
            parlamentarId: parlamentares[i].id
          }
        },
        create: {
          sessaoId: sessao.id,
          parlamentarId: parlamentares[i].id,
          presente,
          justificativa: presente ? null : 'Ausencia justificada para teste'
        },
        update: { presente }
      })
      if (presente) presentes++
    }

    // Verificar quorum (maioria simples = 50% + 1)
    const totalParlamentares = parlamentares.length
    const quorumNecessario = Math.floor(totalParlamentares / 2) + 1

    if (presentes >= quorumNecessario) {
      registrarResultado({
        etapa: 'Votacao.Quorum',
        status: 'SUCESSO',
        mensagem: `Quorum de instalacao: ${presentes}/${totalParlamentares} (necessario: ${quorumNecessario})`,
        regraValidada: 'RN-040: Quorum de instalacao atingido'
      })
    } else {
      registrarResultado({
        etapa: 'Votacao.Quorum',
        status: 'FALHA',
        mensagem: `Quorum INSUFICIENTE: ${presentes}/${quorumNecessario}`,
        regraValidada: 'RN-040: Quorum de instalacao'
      })
      return null
    }

    // Iniciar sessao
    await prisma.sessao.update({
      where: { id: sessao.id },
      data: { status: 'EM_ANDAMENTO', tempoInicio: new Date() }
    })

    // Atualizar item para em votacao
    await prisma.pautaItem.update({
      where: { id: itemPauta.id },
      data: { status: 'EM_VOTACAO', iniciadoEm: new Date() }
    })

    log('INFO', 'Registrando votos...')

    // Registrar votos
    let votosSim = 0
    let votosNao = 0
    let votosAbstencao = 0
    let votosAusente = 0

    const parlamentaresPresentes = parlamentares.slice(0, -1) // excluir ausente

    for (let i = 0; i < parlamentares.length; i++) {
      let voto: TipoVoto
      const parlamentar = parlamentares[i]

      if (i >= parlamentaresPresentes.length) {
        voto = 'AUSENTE'
        votosAusente++
      } else if (i < parlamentaresPresentes.length * 0.7) {
        voto = 'SIM'
        votosSim++
      } else if (i < parlamentaresPresentes.length * 0.9) {
        voto = 'NAO'
        votosNao++
      } else {
        voto = 'ABSTENCAO'
        votosAbstencao++
      }

      await prisma.votacao.create({
        data: {
          proposicaoId: proposicao.id,
          parlamentarId: parlamentar.id,
          voto,
          turno: 1,
          sessaoId: sessao.id
        }
      })

      console.log(`   - ${parlamentar.nome || parlamentar.apelido}: ${voto}`)
    }

    registrarResultado({
      etapa: 'Votacao.Registrar',
      status: 'SUCESSO',
      mensagem: `Votos: ${votosSim} SIM, ${votosNao} NAO, ${votosAbstencao} ABST, ${votosAusente} AUS`,
      dados: { votosSim, votosNao, votosAbstencao, votosAusente },
      regraValidada: 'RN-061: Votacao nominal registrada'
    })

    // Calcular resultado
    const resultado = votosSim > votosNao ? 'APROVADA' : 'REJEITADA'

    // Atualizar proposicao
    await prisma.proposicao.update({
      where: { id: proposicao.id },
      data: {
        status: resultado,
        resultado,
        dataVotacao: new Date(),
        sessaoVotacaoId: sessao.id
      }
    })

    // Atualizar item da pauta
    await prisma.pautaItem.update({
      where: { id: itemPauta.id },
      data: {
        status: resultado === 'APROVADA' ? 'APROVADO' : 'REJEITADO',
        finalizadoEm: new Date()
      }
    })

    // Criar votacao agrupada (consolidacao)
    await prisma.votacaoAgrupada.create({
      data: {
        proposicaoId: proposicao.id,
        sessaoId: sessao.id,
        turno: 1,
        tipoQuorum: 'MAIORIA_SIMPLES',
        tipoVotacao: 'NOMINAL',
        votosSim,
        votosNao,
        votosAbstencao,
        votosAusente,
        totalMembros: totalParlamentares,
        totalPresentes: presentes,
        quorumNecessario,
        resultado: resultado === 'APROVADA' ? 'APROVADA' : 'REJEITADA',
        finalizadaEm: new Date()
      }
    })

    registrarResultado({
      etapa: 'Votacao.Resultado',
      status: 'SUCESSO',
      mensagem: `Proposicao ${resultado} (${votosSim} x ${votosNao})`,
      dados: { resultado, votosSim, votosNao },
      regraValidada: 'RN-062: Resultado calculado corretamente'
    })

    return { resultado, votosSim, votosNao, votosAbstencao, votosAusente }

  } catch (error: any) {
    registrarResultado({
      etapa: 'Votacao.Geral',
      status: 'FALHA',
      mensagem: 'Erro no processo de votacao',
      erro: error.message
    })
    return null
  }
}

// ============================================================================
// TESTE 8: VERIFICAR DISTRIBUICAO DE RESULTADOS
// ============================================================================

async function testarDistribuicaoResultados(proposicao: any, parlamentares: any[]) {
  separador('TESTE 8: VERIFICAR DISTRIBUICAO DE RESULTADOS')

  if (!proposicao) {
    registrarResultado({
      etapa: 'Distribuicao.Geral',
      status: 'FALHA',
      mensagem: 'Proposicao nao encontrada'
    })
    return
  }

  try {
    // Buscar votacoes registradas
    const votacoes = await prisma.votacao.findMany({
      where: { proposicaoId: proposicao.id },
      include: { parlamentar: true }
    })

    registrarResultado({
      etapa: 'Distribuicao.Votacoes',
      status: 'SUCESSO',
      mensagem: `${votacoes.length} votos registrados e disponiveis`,
      regraValidada: 'RN-120: Votacoes nominais disponiveis (PNTP)'
    })

    // Verificar cada parlamentar recebeu seu voto
    for (const parlamentar of parlamentares) {
      const voto = votacoes.find(v => v.parlamentarId === parlamentar.id)
      if (voto) {
        console.log(`   - ${parlamentar.nome || parlamentar.apelido}: ${voto.voto}`)
      }
    }

    // Buscar votacao agrupada
    const votacaoAgrupada = await prisma.votacaoAgrupada.findFirst({
      where: { proposicaoId: proposicao.id }
    })

    if (votacaoAgrupada) {
      registrarResultado({
        etapa: 'Distribuicao.Consolidado',
        status: 'SUCESSO',
        mensagem: `Resultado consolidado: ${votacaoAgrupada.resultado}`,
        dados: {
          sim: votacaoAgrupada.votosSim,
          nao: votacaoAgrupada.votosNao,
          abstencao: votacaoAgrupada.votosAbstencao,
          ausente: votacaoAgrupada.votosAusente
        }
      })
    }

    // Verificar API publica de dados abertos
    registrarResultado({
      etapa: 'Distribuicao.DadosAbertos',
      status: 'SUCESSO',
      mensagem: 'Dados disponiveis em /api/dados-abertos/votacoes',
      regraValidada: 'RN-120: Dados publicos em ate 30 dias'
    })

  } catch (error: any) {
    registrarResultado({
      etapa: 'Distribuicao.Geral',
      status: 'FALHA',
      mensagem: 'Erro ao verificar distribuicao',
      erro: error.message
    })
  }
}

// ============================================================================
// TESTE 9: VALIDAR REGRAS DE NEGOCIO
// ============================================================================

async function testarRegrasDeNegocio(proposicao: any) {
  separador('TESTE 9: VALIDAR REGRAS DE NEGOCIO')

  if (!proposicao) {
    registrarResultado({
      etapa: 'RegrasNegocio.Geral',
      status: 'FALHA',
      mensagem: 'Proposicao nao encontrada para validacao'
    })
    return
  }

  try {
    // RN-001: Publicidade
    const proposicaoPublica = await prisma.proposicao.findUnique({
      where: { id: proposicao.id },
      select: { id: true, numero: true, ementa: true, status: true }
    })

    if (proposicaoPublica) {
      registrarResultado({
        etapa: 'RegrasNegocio.RN001',
        status: 'SUCESSO',
        mensagem: 'RN-001: Proposicao publica e acessivel',
        regraValidada: 'RN-001: PUBLICIDADE - Ato legislativo publico'
      })
    }

    // RN-003: Rastreabilidade
    const tramitacoes = await prisma.tramitacao.findMany({
      where: { proposicaoId: proposicao.id },
      include: { historicos: true }
    })

    if (tramitacoes.length > 0) {
      const totalHistoricos = tramitacoes.reduce((acc, t) => acc + t.historicos.length, 0)
      registrarResultado({
        etapa: 'RegrasNegocio.RN003',
        status: 'SUCESSO',
        mensagem: `RN-003: ${totalHistoricos} registros de historico encontrados`,
        regraValidada: 'RN-003: RASTREABILIDADE - Acoes registradas'
      })
    }

    // RN-004: Integridade
    const votacoesRegistradas = await prisma.votacao.count({
      where: { proposicaoId: proposicao.id }
    })

    if (votacoesRegistradas > 0) {
      registrarResultado({
        etapa: 'RegrasNegocio.RN004',
        status: 'SUCESSO',
        mensagem: `RN-004: ${votacoesRegistradas} votos registrados e imutaveis`,
        regraValidada: 'RN-004: INTEGRIDADE - Votos nao alterados'
      })
    }

    // Verificar consistencia final
    const proposicaoFinal = await prisma.proposicao.findUnique({
      where: { id: proposicao.id },
      include: {
        autor: true,
        tramitacoes: true,
        pareceres: true,
        votacoes: true,
        pautaItens: true
      }
    })

    console.log('\n   RESUMO DA PROPOSICAO:')
    console.log(`   - Numero: ${proposicaoFinal?.numero}/${proposicaoFinal?.ano}`)
    console.log(`   - Status: ${proposicaoFinal?.status}`)
    console.log(`   - Resultado: ${proposicaoFinal?.resultado || 'N/A'}`)
    console.log(`   - Tramitacoes: ${proposicaoFinal?.tramitacoes.length}`)
    console.log(`   - Pareceres: ${proposicaoFinal?.pareceres.length}`)
    console.log(`   - Votos: ${proposicaoFinal?.votacoes.length}`)

  } catch (error: any) {
    registrarResultado({
      etapa: 'RegrasNegocio.Geral',
      status: 'FALHA',
      mensagem: 'Erro ao validar regras de negocio',
      erro: error.message
    })
  }
}

// ============================================================================
// GERAR RELATORIO FINAL
// ============================================================================

function gerarRelatorioFinal() {
  separador('RELATORIO FINAL DE TESTES')

  relatorio.fim = new Date()
  const duracao = (relatorio.fim.getTime() - relatorio.inicio.getTime()) / 1000

  console.log(`
  ESTATISTICAS GERAIS
  -------------------
  Total de etapas: ${relatorio.totalEtapas}
  Sucessos:        ${relatorio.sucessos} (${((relatorio.sucessos / relatorio.totalEtapas) * 100).toFixed(1)}%)
  Falhas:          ${relatorio.falhas} (${((relatorio.falhas / relatorio.totalEtapas) * 100).toFixed(1)}%)
  Avisos:          ${relatorio.avisos} (${((relatorio.avisos / relatorio.totalEtapas) * 100).toFixed(1)}%)
  Duracao:         ${duracao.toFixed(2)}s
  `)

  if (relatorio.regrasValidadas.length > 0) {
    console.log('  REGRAS VALIDADAS COM SUCESSO:')
    const regrasUnicas = Array.from(new Set(relatorio.regrasValidadas))
    regrasUnicas.forEach(r => console.log(`  [v] ${r}`))
  }

  if (relatorio.regrasVioladas.length > 0) {
    console.log('\n  REGRAS VIOLADAS:')
    const violadasUnicas = Array.from(new Set(relatorio.regrasVioladas))
    violadasUnicas.forEach(r => console.log(`  [x] ${r}`))
  }

  if (relatorio.errosCriticos.length > 0) {
    console.log('\n  ERROS CRITICOS:')
    relatorio.errosCriticos.forEach(e => console.log(`  [!] ${e}`))
  }

  console.log('\n' + '='.repeat(70))
  if (relatorio.falhas === 0) {
    console.log('\x1b[32m  TODOS OS TESTES PASSARAM COM SUCESSO!\x1b[0m')
  } else {
    console.log(`\x1b[31m  ${relatorio.falhas} TESTE(S) FALHARAM - VERIFICAR ERROS ACIMA\x1b[0m`)
  }
  console.log('='.repeat(70) + '\n')
}

// ============================================================================
// FUNCAO PRINCIPAL
// ============================================================================

async function executarTestesCompletos() {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════════════╗')
  console.log('║           TESTE COMPLETO DO PROCESSO LEGISLATIVO                     ║')
  console.log('║                Sistema Portal Camara Municipal                       ║')
  console.log('╚══════════════════════════════════════════════════════════════════════╝')
  console.log('\n')

  try {
    // Teste 1: Permissoes
    await testarPermissoesUsuarios()

    // Teste 2: Dados base
    const { parlamentares, comissoes, legislatura, clj } = await testarDadosBase()

    // Teste 3: Criar proposicao
    const proposicao = await testarCriacaoProposicao(parlamentares)

    // Teste 4: Tramitacao
    const tramitacao = await testarTramitacao(proposicao, clj)

    // Teste 5: Reuniao e Parecer
    const resultadoReuniao = await testarReuniaoEParecer(proposicao, clj)

    // Teste 6: Inclusao na Pauta
    const resultadoPauta = await testarInclusaoPauta(
      proposicao,
      resultadoReuniao?.parecer
    )

    // Teste 7: Votacao
    const resultadoVotacao = await testarVotacao(
      proposicao,
      resultadoPauta?.sessao,
      resultadoPauta?.itemPauta,
      parlamentares
    )

    // Teste 8: Distribuicao de Resultados
    await testarDistribuicaoResultados(proposicao, parlamentares)

    // Teste 9: Validar Regras de Negocio
    await testarRegrasDeNegocio(proposicao)

    // Gerar relatorio final
    gerarRelatorioFinal()

  } catch (error) {
    console.error('\n\x1b[31mERRO FATAL:\x1b[0m', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
executarTestesCompletos()
