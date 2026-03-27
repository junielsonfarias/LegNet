import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { TipoVoto } from '@prisma/client'

export interface ParecerFilters {
  comissaoId?: string
  proposicaoId?: string
  relatorId?: string
  status?: string
  tipo?: string
  ano?: number
}

export interface CreateParecerData {
  proposicaoId: string
  comissaoId: string
  relatorId: string
  tipo: string
  fundamentacao: string
  conclusao?: string
  ementa?: string
  emendasPropostas?: string
  prazoEmissao?: string
  observacoes?: string
  arquivoUrl?: string | null
  arquivoNome?: string | null
  arquivoTamanho?: number | null
  driveUrl?: string | null
}

const defaultInclude = {
  proposicao: {
    select: { id: true, numero: true, ano: true, tipo: true, titulo: true, ementa: true, status: true }
  },
  comissao: {
    select: { id: true, nome: true, sigla: true, tipo: true }
  },
  relator: {
    select: { id: true, nome: true, apelido: true, partido: true, foto: true }
  },
  _count: { select: { votosComissao: true } }
}

const buildWhereClause = (filters: ParecerFilters = {}) => {
  const where: any = {}
  if (filters.comissaoId) where.comissaoId = filters.comissaoId
  if (filters.proposicaoId) where.proposicaoId = filters.proposicaoId
  if (filters.relatorId) where.relatorId = filters.relatorId
  if (filters.status) where.status = filters.status
  if (filters.tipo) where.tipo = filters.tipo
  if (filters.ano) where.ano = filters.ano
  return where
}

export const pareceresDbService = {
  async list(filters: ParecerFilters = {}) {
    return prisma.parecer.findMany({
      where: buildWhereClause(filters),
      include: defaultInclude,
      orderBy: [{ dataDistribuicao: 'desc' }]
    })
  },

  async getById(id: string) {
    return prisma.parecer.findUnique({
      where: { id },
      include: {
        ...defaultInclude,
        votosComissao: {
          include: {
            parlamentar: { select: { id: true, nome: true, apelido: true, partido: true } }
          }
        }
      }
    })
  },

  async checkDuplicate(proposicaoId: string, comissaoId: string) {
    return prisma.parecer.findUnique({
      where: { proposicaoId_comissaoId: { proposicaoId, comissaoId } }
    })
  },

  async getNextNumero(comissaoId: string, ano: number) {
    const ultimo = await prisma.parecer.findFirst({
      where: { ano, comissaoId },
      orderBy: { createdAt: 'desc' }
    })

    let proximo = 1
    if (ultimo?.numero) {
      const match = ultimo.numero.match(/^(\d+)/)
      if (match) proximo = parseInt(match[1]) + 1
    }

    return proximo
  },

  /**
   * Gera o proximo numero formatado para um parecer de uma comissao no ano corrente.
   * Retorna tambem informacoes da comissao e total de pareceres no ano.
   */
  async getNextNumeroFormatado(comissaoId: string) {
    const comissao = await prisma.comissao.findUnique({
      where: { id: comissaoId },
      select: { id: true, nome: true, sigla: true }
    })

    if (!comissao) {
      throw new Error('Comissão não encontrada')
    }

    const anoAtual = new Date().getFullYear()
    const siglaComissao = comissao.sigla || comissao.nome.substring(0, 3).toUpperCase()
    const proximoNumero = await this.getNextNumero(comissaoId, anoAtual)

    const totalPareceresAno = await prisma.parecer.count({
      where: { ano: anoAtual, comissaoId }
    })

    const numeroFormatado = `${String(proximoNumero).padStart(3, '0')}/${anoAtual}-${siglaComissao}`

    return {
      proximoNumero,
      numeroFormatado,
      comissao: { id: comissao.id, nome: comissao.nome, sigla: siglaComissao },
      ano: anoAtual,
      totalPareceresAno
    }
  },

  /**
   * Cria um parecer com todas as validacoes de negocio:
   * - Verificacao de duplicidade (proposicao + comissao)
   * - Verificacao de existencia da proposicao
   * - Verificacao de comissao ativa
   * - Verificacao de relator como membro ativo da comissao
   * - Verificacao de tramitacao pendente para a comissao
   * - Geracao automatica de numero sequencial
   */
  async createWithValidation(data: CreateParecerData) {
    // Verificar duplicidade
    const parecerExistente = await this.checkDuplicate(data.proposicaoId, data.comissaoId)
    if (parecerExistente) {
      throw new Error('Já existe um parecer desta comissão para esta proposição')
    }

    // Verificar proposicao
    const proposicao = await prisma.proposicao.findUnique({
      where: { id: data.proposicaoId }
    })
    if (!proposicao) throw new Error('Proposição não encontrada')

    // Verificar comissao
    const comissao = await prisma.comissao.findUnique({
      where: { id: data.comissaoId }
    })
    if (!comissao) throw new Error('Comissão não encontrada')
    if (!comissao.ativa) throw new Error('Esta comissão não está ativa')

    // Verificar relator e membro ativo
    const membroComissao = await prisma.membroComissao.findFirst({
      where: {
        comissaoId: data.comissaoId,
        parlamentarId: data.relatorId,
        ativo: true
      }
    })
    if (!membroComissao) throw new Error('O relator deve ser membro ativo da comissão')

    // Verificar tramitacao para a comissao
    const unidadeFilter: Prisma.TramitacaoUnidadeWhereInput = {
      OR: [
        { nome: { contains: comissao.nome, mode: 'insensitive' as Prisma.QueryMode } },
        ...(comissao.sigla ? [{ nome: { contains: comissao.sigla, mode: 'insensitive' as Prisma.QueryMode } }] : []),
        ...(comissao.sigla ? [{ sigla: comissao.sigla }] : [])
      ]
    }

    const tramitacaoParaComissao = await prisma.tramitacao.findFirst({
      where: {
        proposicaoId: data.proposicaoId,
        status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] },
        unidade: unidadeFilter
      }
    })

    if (!tramitacaoParaComissao) {
      throw new Error(
        `A proposição não está em tramitação para a ${comissao.sigla || comissao.nome}. ` +
        'Verifique se a proposição foi tramitada para esta comissão.'
      )
    }

    // Gerar numero
    const anoAtual = new Date().getFullYear()
    const siglaComissao = comissao.sigla || comissao.nome.substring(0, 3).toUpperCase()
    const proximoNumero = await this.getNextNumero(data.comissaoId, anoAtual)
    const numero = `${String(proximoNumero).padStart(3, '0')}/${anoAtual}-${siglaComissao}`

    return this.create({
      proposicaoId: data.proposicaoId,
      comissaoId: data.comissaoId,
      relatorId: data.relatorId,
      numero,
      ano: anoAtual,
      tipo: data.tipo,
      status: 'AGUARDANDO_PAUTA',
      fundamentacao: data.fundamentacao,
      conclusao: data.conclusao,
      ementa: data.ementa,
      emendasPropostas: data.emendasPropostas,
      dataDistribuicao: new Date(),
      prazoEmissao: data.prazoEmissao ? new Date(data.prazoEmissao) : null,
      observacoes: data.observacoes,
      arquivoUrl: data.arquivoUrl,
      arquivoNome: data.arquivoNome,
      arquivoTamanho: data.arquivoTamanho,
      driveUrl: data.driveUrl
    })
  },

  async create(data: any) {
    return prisma.parecer.create({
      data,
      include: {
        proposicao: { select: { id: true, numero: true, ano: true, tipo: true, titulo: true } },
        comissao: { select: { id: true, nome: true, sigla: true } },
        relator: { select: { id: true, nome: true, apelido: true } }
      }
    })
  },

  async update(id: string, data: any) {
    return prisma.parecer.update({
      where: { id },
      data,
      include: defaultInclude
    })
  },

  async remove(id: string) {
    await prisma.parecer.delete({ where: { id } })
    return { success: true }
  },

  async registrarVoto(parecerId: string, parlamentarId: string, voto: string, justificativa?: string) {
    return prisma.votoParecerComissao.upsert({
      where: {
        parecerId_parlamentarId: { parecerId, parlamentarId }
      },
      update: { voto: voto as TipoVoto },
      create: {
        parecerId,
        parlamentarId,
        voto: voto as TipoVoto
      },
      include: {
        parlamentar: { select: { id: true, nome: true, apelido: true } }
      }
    })
  },

  /**
   * Registra ou atualiza o voto de um parlamentar em um parecer,
   * valida status e pertencimento a comissao, e atualiza contagens agregadas.
   */
  async votar(parecerId: string, parlamentarId: string, voto: string, observacoes?: string) {
    // Buscar parecer com membros da comissao
    const parecer = await prisma.parecer.findUnique({
      where: { id: parecerId },
      include: {
        comissao: {
          include: {
            membros: { where: { ativo: true } }
          }
        }
      }
    })

    if (!parecer) throw new Error('Parecer não encontrado')

    if (parecer.status !== 'AGUARDANDO_VOTACAO') {
      throw new Error(`O parecer não está em votação. Status atual: ${parecer.status}`)
    }

    // Verificar se o parlamentar e membro ativo da comissao
    const membroComissao = parecer.comissao.membros.find(
      m => m.parlamentarId === parlamentarId
    )
    if (!membroComissao) {
      throw new Error('Este parlamentar não é membro ativo da comissão')
    }

    // Registrar ou atualizar voto
    const votoRegistrado = await prisma.votoParecerComissao.upsert({
      where: {
        parecerId_parlamentarId: { parecerId, parlamentarId }
      },
      update: {
        voto: voto as TipoVoto,
        observacoes,
        dataVoto: new Date()
      },
      create: {
        parecerId,
        parlamentarId,
        voto: voto as TipoVoto,
        observacoes
      },
      include: {
        parlamentar: {
          select: { id: true, nome: true, apelido: true, partido: true }
        }
      }
    })

    // Atualizar contagem agregada
    const votos = await prisma.votoParecerComissao.groupBy({
      by: ['voto'],
      where: { parecerId },
      _count: true
    })

    const contagem = { votosAFavor: 0, votosContra: 0, votosAbstencao: 0 }
    for (const v of votos) {
      if (v.voto === 'SIM') contagem.votosAFavor = v._count
      else if (v.voto === 'NAO') contagem.votosContra = v._count
      else if (v.voto === 'ABSTENCAO') contagem.votosAbstencao = v._count
    }

    await prisma.parecer.update({
      where: { id: parecerId },
      data: contagem
    })

    return {
      voto: votoRegistrado,
      contagem,
      totalMembros: parecer.comissao.membros.length
    }
  },

  /**
   * Retorna o estado atual da votacao de um parecer,
   * incluindo votos registrados, contagens e membros que ainda nao votaram.
   */
  async getVotingStatus(parecerId: string) {
    const parecer = await prisma.parecer.findUnique({
      where: { id: parecerId },
      select: {
        id: true,
        status: true,
        votosAFavor: true,
        votosContra: true,
        votosAbstencao: true,
        comissao: {
          select: {
            membros: {
              where: { ativo: true },
              select: {
                parlamentarId: true,
                parlamentar: {
                  select: { id: true, nome: true, apelido: true, partido: true }
                },
                cargo: true
              }
            }
          }
        },
        votosComissao: {
          include: {
            parlamentar: {
              select: { id: true, nome: true, apelido: true, partido: true }
            }
          }
        }
      }
    })

    if (!parecer) throw new Error('Parecer não encontrado')

    const parlamentaresVotaram = parecer.votosComissao.map(v => v.parlamentarId)
    const membrosNaoVotaram = parecer.comissao.membros.filter(
      m => !parlamentaresVotaram.includes(m.parlamentarId)
    )

    return {
      parecerId: parecer.id,
      status: parecer.status,
      contagem: {
        aFavor: parecer.votosAFavor,
        contra: parecer.votosContra,
        abstencao: parecer.votosAbstencao,
        total: parecer.votosAFavor + parecer.votosContra + parecer.votosAbstencao
      },
      totalMembros: parecer.comissao.membros.length,
      votos: parecer.votosComissao,
      membrosNaoVotaram: membrosNaoVotaram.map(m => ({
        parlamentarId: m.parlamentarId,
        parlamentar: m.parlamentar,
        cargo: m.cargo
      }))
    }
  },

  /**
   * Encerra a votacao de um parecer. Verifica quorum minimo (maioria simples)
   * e atualiza o status para APROVADO_COMISSAO ou REJEITADO_COMISSAO.
   */
  async closeVoting(parecerId: string, resultado: 'APROVADO_COMISSAO' | 'REJEITADO_COMISSAO', motivoRejeicao?: string) {
    const parecer = await prisma.parecer.findUnique({
      where: { id: parecerId },
      include: {
        comissao: {
          include: {
            membros: { where: { ativo: true } }
          }
        },
        _count: { select: { votosComissao: true } }
      }
    })

    if (!parecer) throw new Error('Parecer não encontrado')

    if (parecer.status !== 'AGUARDANDO_VOTACAO') {
      throw new Error(`O parecer não está em votação. Status atual: ${parecer.status}`)
    }

    // Verificar quorum (maioria dos membros votou)
    const totalMembros = parecer.comissao.membros.length
    const totalVotos = parecer._count.votosComissao
    const quorumMinimo = Math.floor(totalMembros / 2) + 1

    if (totalVotos < quorumMinimo) {
      throw new Error(
        `Quórum insuficiente para encerrar votação. ` +
        `Votos: ${totalVotos}, Mínimo necessário: ${quorumMinimo}`
      )
    }

    const updateData: any = {
      status: resultado,
      dataVotacao: new Date()
    }

    if (resultado === 'REJEITADO_COMISSAO' && motivoRejeicao) {
      updateData.motivoRejeicao = motivoRejeicao
    }

    return prisma.parecer.update({
      where: { id: parecerId },
      data: updateData,
      include: {
        proposicao: { select: { id: true, numero: true, ano: true, tipo: true, titulo: true } },
        comissao: { select: { id: true, nome: true, sigla: true } },
        relator: { select: { id: true, nome: true, apelido: true } }
      }
    })
  }
}
