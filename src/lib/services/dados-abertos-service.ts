/**
 * Servico de Dados Abertos
 * Centraliza toda logica de acesso a dados para a API publica de dados abertos.
 *
 * Funcionalidades:
 * - Informacoes institucionais
 * - Proposicoes legislativas com filtros e paginacao
 * - Sessoes legislativas com filtros e paginacao
 * - Parlamentares ativos
 * - Estatisticas de parlamentares (presenca e proposicoes)
 * - Presencas em sessoes
 * - Votacoes nominais
 * - Comissoes com membros ativos
 * - Publicacoes oficiais
 */

import { prisma } from '@/lib/prisma'
import { maskCpfOrCnpj as mascararCpfCnpj } from '@/lib/security/cpf-utils'

// ==================== Tipos ====================

export interface PaginacaoParams {
  page: number
  limit: number
}

export interface ProposicoesFilters {
  ano?: number
  tipo?: string
  status?: string
  autorId?: string
}

export interface SessoesFilters {
  ano?: number
  tipo?: string
  status?: string
}

export interface PresencasFilters {
  ano?: number
  parlamentarId?: string
  sessaoId?: string
}

export interface VotacoesFilters {
  ano?: number
  proposicaoId?: string
  parlamentarId?: string
}

export interface ComissoesFilters {
  tipo?: string
  ativa?: boolean | null
}

export interface PublicacoesFilters {
  tipo?: string
  ano?: number
}

export interface ParlamentaresFilters {
  legislaturaId?: string
}

export interface ServidoresFilters {
  vinculo?: string
  unidade?: string
  situacao?: string
}

export interface OrdensPagamentoFilters {
  ano?: number
  mes?: number
}

export interface ContratosFilters {
  ano?: number
  situacao?: string
}

export interface LicitacoesFilters {
  ano?: number
  modalidade?: string
  situacao?: string
}

export interface DespesasFilters {
  ano?: number
  mes?: number
  situacao?: string
}

// ==================== Servico ====================

export const dadosAbertosService = {
  /**
   * Busca informacoes institucionais (nome da casa, contato)
   */
  async getInfo() {
    const config = await prisma.configuracaoInstitucional.findFirst({
      where: { slug: 'principal' }
    })

    return {
      nomeCasa: config?.nomeCasa || 'Câmara Municipal',
      email: config?.email || 'transparencia@camara.gov.br',
      telefone: config?.telefone || ''
    }
  },

  /**
   * Busca proposicoes legislativas com filtros e paginacao
   */
  async getProposicoes(filters: ProposicoesFilters, paginacao: PaginacaoParams) {
    const { ano, tipo, status, autorId } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && { ano }),
      ...(tipo && { tipo: tipo as 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOCAO' | 'VOTO_PESAR' | 'VOTO_APLAUSO' }),
      ...(status && { status: status as 'APRESENTADA' | 'EM_TRAMITACAO' | 'APROVADA' | 'REJEITADA' | 'ARQUIVADA' | 'VETADA' }),
      ...(autorId && { autorId })
    }

    const [proposicoes, total] = await Promise.all([
      prisma.proposicao.findMany({
        where,
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true,
          ementa: true,
          status: true,
          dataApresentacao: true,
          dataVotacao: true,
          resultado: true,
          autor: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              partido: true
            }
          },
          _count: {
            select: {
              tramitacoes: true,
              votacoes: true
            }
          }
        },
        orderBy: { dataApresentacao: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.proposicao.count({ where })
    ])

    const dados = proposicoes.map(p => ({
      id: p.id,
      numero: p.numero,
      ano: p.ano,
      tipo: p.tipo,
      titulo: p.titulo,
      ementa: p.ementa,
      status: p.status,
      dataApresentacao: p.dataApresentacao?.toISOString() || null,
      dataVotacao: p.dataVotacao?.toISOString() || null,
      resultado: p.resultado || null,
      // Manter snake_case para compatibilidade CSV/dados abertos
      data_apresentacao: p.dataApresentacao?.toISOString().split('T')[0] || null,
      data_votacao: p.dataVotacao?.toISOString().split('T')[0] || null,
      autor: p.autor ? {
        id: p.autor.id,
        nome: p.autor.nome,
        apelido: p.autor.apelido || null,
        partido: p.autor.partido
      } : null,
      total_tramitacoes: p._count.tramitacoes,
      total_votacoes: p._count.votacoes
    }))

    return { dados, total }
  },

  /**
   * Busca sessoes legislativas com filtros e paginacao
   */
  async getSessoes(filters: SessoesFilters, paginacao: PaginacaoParams) {
    const { ano, tipo, status } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && {
        data: {
          gte: new Date(ano, 0, 1),
          lt: new Date(ano + 1, 0, 1)
        }
      }),
      ...(tipo && { tipo: tipo as 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL' }),
      ...(status && { status: status as 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA' })
    }

    const [sessoes, total] = await Promise.all([
      prisma.sessao.findMany({
        where,
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true,
          horario: true,
          local: true,
          status: true,
          descricao: true,
          ata: true,
          arquivoAta: true,
          urlAudio: true,
          urlVideo: true,
          urlTransmissao: true,
          _count: {
            select: {
              presencas: true,
              proposicoes: true
            }
          },
          legislatura: {
            select: {
              numero: true,
              anoInicio: true,
              anoFim: true
            }
          }
        },
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.sessao.count({ where })
    ])

    const dados = sessoes.map(s => ({
      id: s.id,
      numero: s.numero,
      tipo: s.tipo,
      data: s.data.toISOString().split('T')[0],
      horario: s.horario,
      local: s.local,
      status: s.status,
      descricao: s.descricao,
      ata: s.ata,
      arquivoAta: s.arquivoAta,
      urlAudio: s.urlAudio,
      urlVideo: s.urlVideo,
      urlTransmissao: s.urlTransmissao,
      total_presencas: s._count.presencas,
      total_proposicoes: s._count.proposicoes,
      legislatura: s.legislatura ? {
        numero: s.legislatura.numero,
        ano_inicio: s.legislatura.anoInicio,
        ano_fim: s.legislatura.anoFim
      } : null
    }))

    return { dados, total }
  },

  /**
   * Busca parlamentares ativos com dados publicos
   */
  async getParlamentares(filters: ParlamentaresFilters) {
    const { legislaturaId } = filters

    const parlamentares = await prisma.parlamentar.findMany({
      where: {
        ativo: true,
        ...(legislaturaId && {
          mandatos: {
            some: { legislaturaId }
          }
        })
      },
      select: {
        id: true,
        nome: true,
        apelido: true,
        partido: true,
        cargo: true,
        email: true,
        telefone: true,
        biografia: true,
        foto: true,
        mandatos: {
          select: {
            legislatura: {
              select: {
                numero: true,
                anoInicio: true,
                anoFim: true
              }
            }
          },
          take: 1,
          orderBy: { legislatura: { anoInicio: 'desc' } }
        }
      },
      orderBy: { nome: 'asc' }
    })

    const dados = parlamentares.map(p => ({
      id: p.id,
      nome: p.nome,
      apelido: p.apelido,
      partido: p.partido,
      cargo: p.cargo,
      email: p.email,
      telefone: p.telefone,
      biografia: p.biografia,
      foto: p.foto,
      foto_url: p.foto,
      legislatura: p.mandatos[0]?.legislatura ? {
        numero: p.mandatos[0].legislatura.numero,
        ano_inicio: p.mandatos[0].legislatura.anoInicio,
        ano_fim: p.mandatos[0].legislatura.anoFim
      } : null
    }))

    return { dados }
  },

  /**
   * Busca estatisticas de parlamentares (presencas e proposicoes)
   */
  async getEstatisticasParlamentares() {
    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        cargo: true,
        partido: true,
        _count: {
          select: {
            presencas: {
              where: { presente: true }
            },
            proposicoes: true
          }
        }
      },
      orderBy: [
        { cargo: 'asc' },
        { nome: 'asc' }
      ]
    })

    const dados = parlamentares.map(p => ({
      id: p.id,
      nome: p.nome,
      cargo: p.cargo,
      partido: p.partido,
      sessoes: p._count.presencas,
      materias: p._count.proposicoes
    }))

    return { dados, total: parlamentares.length }
  },

  /**
   * Busca presencas em sessoes com filtros e paginacao
   */
  async getPresencas(filters: PresencasFilters, paginacao: PaginacaoParams) {
    const { ano, parlamentarId, sessaoId } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && {
        sessao: {
          data: {
            gte: new Date(ano, 0, 1),
            lt: new Date(ano + 1, 0, 1)
          }
        }
      }),
      ...(parlamentarId && { parlamentarId }),
      ...(sessaoId && { sessaoId })
    }

    const [presencas, total] = await Promise.all([
      prisma.presencaSessao.findMany({
        where,
        select: {
          id: true,
          presente: true,
          justificativa: true,
          createdAt: true,
          parlamentar: {
            select: {
              id: true,
              nome: true,
              partido: true
            }
          },
          sessao: {
            select: {
              id: true,
              numero: true,
              tipo: true,
              data: true
            }
          }
        },
        orderBy: { sessao: { data: 'desc' } },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.presencaSessao.count({ where })
    ])

    const dados = presencas.map(p => ({
      id: p.id,
      presente: p.presente,
      justificativa: p.justificativa,
      registrado_em: p.createdAt.toISOString(),
      parlamentar: {
        id: p.parlamentar.id,
        nome: p.parlamentar.nome,
        partido: p.parlamentar.partido
      },
      sessao: {
        id: p.sessao.id,
        numero: p.sessao.numero,
        tipo: p.sessao.tipo,
        data: p.sessao.data.toISOString().split('T')[0]
      }
    }))

    return { dados, total }
  },

  /**
   * Busca votacoes nominais com filtros e paginacao
   */
  async getVotacoes(filters: VotacoesFilters, paginacao: PaginacaoParams) {
    const { ano, proposicaoId, parlamentarId } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && {
        proposicao: {
          ano
        }
      }),
      ...(proposicaoId && { proposicaoId }),
      ...(parlamentarId && { parlamentarId })
    }

    const [votacoes, total] = await Promise.all([
      prisma.votacao.findMany({
        where,
        select: {
          id: true,
          voto: true,
          createdAt: true,
          parlamentar: {
            select: {
              id: true,
              nome: true,
              partido: true
            }
          },
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              tipo: true,
              ementa: true,
              sessao: {
                select: {
                  id: true,
                  numero: true,
                  tipo: true,
                  data: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.votacao.count({ where })
    ])

    const dados = votacoes.map(v => ({
      id: v.id,
      voto: v.voto,
      data_voto: v.createdAt.toISOString(),
      parlamentar: {
        id: v.parlamentar.id,
        nome: v.parlamentar.nome,
        partido: v.parlamentar.partido
      },
      proposicao: v.proposicao ? {
        id: v.proposicao.id,
        numero: v.proposicao.numero,
        ano: v.proposicao.ano,
        tipo: v.proposicao.tipo,
        ementa: v.proposicao.ementa
      } : null,
      sessao: v.proposicao?.sessao ? {
        id: v.proposicao.sessao.id,
        numero: v.proposicao.sessao.numero,
        tipo: v.proposicao.sessao.tipo,
        data: v.proposicao.sessao.data.toISOString().split('T')[0]
      } : null
    }))

    return { dados, total }
  },

  /**
   * Busca comissoes com membros ativos
   */
  async getComissoes(filters: ComissoesFilters) {
    const { tipo, ativa } = filters

    const where = {
      ...(tipo && { tipo: tipo as 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL' | 'INQUERITO' }),
      ...(ativa !== null && ativa !== undefined && { ativa })
    }

    const comissoes = await prisma.comissao.findMany({
      where,
      select: {
        id: true,
        nome: true,
        tipo: true,
        descricao: true,
        ativa: true,
        membros: {
          select: {
            id: true,
            cargo: true,
            parlamentar: {
              select: {
                id: true,
                nome: true,
                partido: true
              }
            }
          },
          where: {
            ativo: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    })

    const dados = comissoes.map(c => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      descricao: c.descricao,
      ativa: c.ativa,
      membros: c.membros.map(m => ({
        id: m.id,
        cargo: m.cargo,
        parlamentar: {
          id: m.parlamentar.id,
          nome: m.parlamentar.nome,
          partido: m.parlamentar.partido
        }
      }))
    }))

    return { dados }
  },

  /**
   * Busca publicacoes oficiais com filtros e paginacao
   */
  async getPublicacoes(filters: PublicacoesFilters, paginacao: PaginacaoParams) {
    const { tipo, ano } = filters
    const { page, limit } = paginacao

    // Validar tipo se fornecido
    const tiposValidos = ['LEI', 'DECRETO', 'PORTARIA', 'RESOLUCAO', 'NOTICIA', 'INFORMATIVO', 'RELATORIO', 'PLANEJAMENTO', 'MANUAL', 'CODIGO', 'OUTRO']
    const tipoValidado = tipo && tiposValidos.includes(tipo.toUpperCase())
      ? tipo.toUpperCase() as 'LEI' | 'DECRETO' | 'PORTARIA' | 'RESOLUCAO' | 'NOTICIA' | 'INFORMATIVO' | 'RELATORIO' | 'PLANEJAMENTO' | 'MANUAL' | 'CODIGO' | 'OUTRO'
      : undefined

    const where = {
      publicada: true,
      ...(tipoValidado && { tipo: tipoValidado }),
      ...(ano && { ano })
    }

    const [publicacoes, total] = await Promise.all([
      prisma.publicacao.findMany({
        where,
        select: {
          id: true,
          titulo: true,
          tipo: true,
          numero: true,
          ano: true,
          descricao: true,
          data: true,
          arquivo: true,
          autorNome: true,
          autorParlamentar: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: [{ ano: 'desc' }, { data: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.publicacao.count({ where })
    ])

    const dados = publicacoes.map(p => ({
      id: p.id,
      titulo: p.titulo,
      tipo: p.tipo,
      numero: p.numero,
      ano: p.ano,
      descricao: p.descricao,
      data: p.data.toISOString().split('T')[0],
      arquivo_url: p.arquivo,
      url: (p as any).url || null,
      autor: p.autorParlamentar ? {
        id: p.autorParlamentar.id,
        nome: p.autorParlamentar.nome
      } : { nome: p.autorNome }
    }))

    return { dados, total }
  },

  /**
   * Busca servidores com filtros e paginacao (sem CPF por LGPD).
   * Cumpre PNTP Nivel Diamante - Categoria Pessoal.
   */
  async getServidores(filters: ServidoresFilters, paginacao: PaginacaoParams) {
    const { vinculo, unidade, situacao } = filters
    const { page, limit } = paginacao

    const where = {
      ...(vinculo && { vinculo: vinculo as 'EFETIVO' | 'COMISSIONADO' | 'TEMPORARIO' | 'ESTAGIARIO' | 'TERCEIRIZADO' }),
      ...(unidade && { unidade }),
      ...(situacao && { situacao: situacao as 'ATIVO' | 'APOSENTADO' | 'AFASTADO' | 'CEDIDO' | 'LICENCIADO' | 'EXONERADO' | 'FALECIDO' })
    }

    const [servidores, total] = await Promise.all([
      prisma.servidor.findMany({
        where,
        select: {
          id: true,
          nome: true,
          matricula: true,
          cargo: true,
          funcao: true,
          unidade: true,
          lotacao: true,
          vinculo: true,
          dataAdmissao: true,
          dataDesligamento: true,
          cargaHoraria: true,
          salarioBruto: true,
          situacao: true
        },
        orderBy: [{ nome: 'asc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.servidor.count({ where })
    ])

    const dados = servidores.map(s => ({
      id: s.id,
      nome: s.nome,
      matricula: s.matricula,
      cargo: s.cargo,
      funcao: s.funcao,
      unidade: s.unidade,
      lotacao: s.lotacao,
      vinculo: s.vinculo,
      data_admissao: s.dataAdmissao.toISOString().split('T')[0],
      data_desligamento: s.dataDesligamento?.toISOString().split('T')[0] || null,
      carga_horaria: s.cargaHoraria,
      salario_bruto: Number(s.salarioBruto),
      situacao: s.situacao
    }))

    return { dados, total }
  },

  /**
   * Busca ordens de pagamento (RN-008 ordem cronologica publica obrigatoria).
   * Cumpre PNTP Nivel Diamante - Categoria Financeiro.
   */
  async getOrdensPagamento(filters: OrdensPagamentoFilters, paginacao: PaginacaoParams) {
    const { ano, mes } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && { ano }),
      ...(mes && { mes })
    }

    const [ordens, total] = await Promise.all([
      prisma.ordemPagamento.findMany({
        where,
        select: {
          id: true,
          numero: true,
          ano: true,
          mes: true,
          data: true,
          credor: true,
          cnpjCpf: true,
          valor: true,
          dataVencimento: true,
          dataPagamento: true,
          ordemCronologica: true,
          fonteRecurso: true,
          despesa: {
            select: {
              id: true,
              numeroEmpenho: true,
              ano: true
            }
          }
        },
        orderBy: [{ ordemCronologica: 'asc' }, { data: 'asc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.ordemPagamento.count({ where })
    ])

    const dados = ordens.map(o => ({
      id: o.id,
      numero: o.numero,
      ano: o.ano,
      mes: o.mes,
      data: o.data.toISOString().split('T')[0],
      credor: o.credor,
      cnpj_cpf: mascararCpfCnpj(o.cnpjCpf),
      valor: Number(o.valor),
      data_vencimento: o.dataVencimento?.toISOString().split('T')[0] || null,
      data_pagamento: o.dataPagamento?.toISOString().split('T')[0] || null,
      ordem_cronologica: o.ordemCronologica,
      fonte_recurso: o.fonteRecurso,
      empenho: o.despesa ? `${o.despesa.numeroEmpenho}/${o.despesa.ano}` : null
    }))

    return { dados, total }
  },

  /**
   * Busca contratos (RN-124 PNTP - publicacao em 24h apos assinatura).
   */
  async getContratos(filters: ContratosFilters, paginacao: PaginacaoParams) {
    const { ano, situacao } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && { ano }),
      ...(situacao && { situacao: situacao as 'VIGENTE' | 'ENCERRADO' | 'RESCINDIDO' | 'SUSPENSO' })
    }

    const [contratos, total] = await Promise.all([
      prisma.contrato.findMany({
        where,
        select: {
          id: true,
          numero: true,
          ano: true,
          modalidade: true,
          objeto: true,
          contratado: true,
          cnpjCpf: true,
          valorTotal: true,
          dataAssinatura: true,
          dataPublicacao: true,
          vigenciaInicio: true,
          vigenciaFim: true,
          fiscalContrato: true,
          situacao: true,
          arquivo: true,
          licitacao: {
            select: { id: true, numero: true, ano: true }
          }
        },
        orderBy: [{ ano: 'desc' }, { numero: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.contrato.count({ where })
    ])

    const dados = contratos.map(c => ({
      id: c.id,
      numero: c.numero,
      ano: c.ano,
      modalidade: c.modalidade,
      objeto: c.objeto,
      contratado: c.contratado,
      cnpj_cpf: mascararCpfCnpj(c.cnpjCpf),
      valor_total: Number(c.valorTotal),
      data_assinatura: c.dataAssinatura.toISOString().split('T')[0],
      data_publicacao: c.dataPublicacao?.toISOString().split('T')[0] || null,
      vigencia_inicio: c.vigenciaInicio.toISOString().split('T')[0],
      vigencia_fim: c.vigenciaFim.toISOString().split('T')[0],
      fiscal_contrato: c.fiscalContrato,
      situacao: c.situacao,
      arquivo_url: c.arquivo,
      licitacao: c.licitacao ? `${c.licitacao.numero}/${c.licitacao.ano}` : null
    }))

    return { dados, total }
  },

  /**
   * Busca licitacoes com filtros e paginacao.
   */
  async getLicitacoes(filters: LicitacoesFilters, paginacao: PaginacaoParams) {
    const { ano, modalidade, situacao } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && { ano }),
      ...(modalidade && { modalidade: modalidade as 'PREGAO_ELETRONICO' | 'PREGAO_PRESENCIAL' | 'CONCORRENCIA' | 'TOMADA_DE_PRECOS' | 'CONVITE' | 'CONCURSO' | 'LEILAO' | 'DISPENSA' | 'INEXIGIBILIDADE' | 'ADESAO_ATA' }),
      ...(situacao && { situacao: situacao as 'EM_ANDAMENTO' | 'HOMOLOGADA' | 'ADJUDICADA' | 'REVOGADA' | 'FRACASSADA' | 'DESERTA' | 'ANULADA' | 'SUSPENSA' })
    }

    const [licitacoes, total] = await Promise.all([
      prisma.licitacao.findMany({
        where,
        select: {
          id: true,
          numero: true,
          ano: true,
          modalidade: true,
          tipo: true,
          objeto: true,
          valorEstimado: true,
          valorHomologado: true,
          dataPublicacao: true,
          dataAbertura: true,
          situacao: true,
          unidadeGestora: true,
          linkEdital: true,
          linkAta: true
        },
        orderBy: [{ ano: 'desc' }, { numero: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.licitacao.count({ where })
    ])

    const dados = licitacoes.map(l => ({
      id: l.id,
      numero: l.numero,
      ano: l.ano,
      modalidade: l.modalidade,
      tipo: l.tipo,
      objeto: l.objeto,
      valor_estimado: l.valorEstimado ? Number(l.valorEstimado) : null,
      valor_homologado: l.valorHomologado ? Number(l.valorHomologado) : null,
      data_publicacao: l.dataPublicacao?.toISOString().split('T')[0] || null,
      data_abertura: l.dataAbertura.toISOString().split('T')[0],
      situacao: l.situacao,
      unidade_gestora: l.unidadeGestora,
      link_edital: l.linkEdital,
      link_ata: l.linkAta
    }))

    return { dados, total }
  },

  /**
   * Busca despesas (empenhadas, liquidadas, pagas) com filtros e paginacao.
   */
  async getDespesas(filters: DespesasFilters, paginacao: PaginacaoParams) {
    const { ano, mes, situacao } = filters
    const { page, limit } = paginacao

    const where = {
      ...(ano && { ano }),
      ...(mes && { mes }),
      ...(situacao && { situacao: situacao as 'EMPENHADA' | 'LIQUIDADA' | 'PAGA' | 'ANULADA' | 'PARCIALMENTE_PAGA' })
    }

    const [despesas, total] = await Promise.all([
      prisma.despesa.findMany({
        where,
        select: {
          id: true,
          numeroEmpenho: true,
          ano: true,
          mes: true,
          data: true,
          credor: true,
          cnpjCpf: true,
          unidade: true,
          elemento: true,
          funcao: true,
          subfuncao: true,
          programa: true,
          acao: true,
          valorEmpenhado: true,
          valorLiquidado: true,
          valorPago: true,
          situacao: true,
          fonteRecurso: true
        },
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }, { data: 'desc' }],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.despesa.count({ where })
    ])

    const dados = despesas.map(d => ({
      id: d.id,
      numero_empenho: d.numeroEmpenho,
      ano: d.ano,
      mes: d.mes,
      data: d.data.toISOString().split('T')[0],
      credor: d.credor,
      cnpj_cpf: mascararCpfCnpj(d.cnpjCpf),
      unidade: d.unidade,
      elemento: d.elemento,
      funcao: d.funcao,
      subfuncao: d.subfuncao,
      programa: d.programa,
      acao: d.acao,
      valor_empenhado: Number(d.valorEmpenhado),
      valor_liquidado: Number(d.valorLiquidado),
      valor_pago: Number(d.valorPago),
      situacao: d.situacao,
      fonte_recurso: d.fonteRecurso
    }))

    return { dados, total }
  }
}
