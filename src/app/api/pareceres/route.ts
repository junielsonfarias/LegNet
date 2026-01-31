import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

const CreateParecerSchema = z.object({
  proposicaoId: z.string().min(1, 'Proposição é obrigatória'),
  comissaoId: z.string().min(1, 'Comissão é obrigatória'),
  relatorId: z.string().min(1, 'Relator é obrigatório'),
  tipo: z.enum([
    'FAVORAVEL',
    'FAVORAVEL_COM_EMENDAS',
    'CONTRARIO',
    'PELA_INCONSTITUCIONALIDADE',
    'PELA_ILEGALIDADE',
    'PELA_PREJUDICIALIDADE',
    'PELA_RETIRADA'
  ]),
  fundamentacao: z.string().min(10, 'Fundamentação deve ter pelo menos 10 caracteres'),
  conclusao: z.string().optional(),
  ementa: z.string().optional(),
  emendasPropostas: z.string().optional(),
  prazoEmissao: z.string().optional(),
  observacoes: z.string().optional(),
  // Campos de anexo
  arquivoUrl: z.string().url().optional().nullable(),
  arquivoNome: z.string().optional().nullable(),
  arquivoTamanho: z.number().int().optional().nullable(),
  driveUrl: z.string().url().optional().nullable()
})

// GET - Listar pareceres com filtros
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const comissaoId = searchParams.get('comissaoId')
  const proposicaoId = searchParams.get('proposicaoId')
  const relatorId = searchParams.get('relatorId')
  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const ano = searchParams.get('ano')

  const where: any = {}

  if (comissaoId) where.comissaoId = comissaoId
  if (proposicaoId) where.proposicaoId = proposicaoId
  if (relatorId) where.relatorId = relatorId
  if (status) where.status = status
  if (tipo) where.tipo = tipo
  if (ano) where.ano = parseInt(ano)

  const pareceres = await prisma.parecer.findMany({
    where,
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true,
          ementa: true,
          status: true
        }
      },
      comissao: {
        select: {
          id: true,
          nome: true,
          sigla: true,
          tipo: true
        }
      },
      relator: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true,
          foto: true
        }
      },
      _count: {
        select: {
          votosComissao: true
        }
      }
    },
    orderBy: [
      { dataDistribuicao: 'desc' }
    ]
  })

  return createSuccessResponse(pareceres, 'Pareceres listados com sucesso')
})

// POST - Criar novo parecer
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateParecerSchema.parse(body)

  // Verificar se já existe parecer desta comissão para esta proposição
  const parecerExistente = await prisma.parecer.findUnique({
    where: {
      proposicaoId_comissaoId: {
        proposicaoId: validatedData.proposicaoId,
        comissaoId: validatedData.comissaoId
      }
    }
  })

  if (parecerExistente) {
    throw new ValidationError('Já existe um parecer desta comissão para esta proposição')
  }

  // Verificar se a proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: validatedData.proposicaoId }
  })

  if (!proposicao) {
    throw new ValidationError('Proposição não encontrada')
  }

  // Verificar se a comissão existe e está ativa
  const comissao = await prisma.comissao.findUnique({
    where: { id: validatedData.comissaoId }
  })

  if (!comissao) {
    throw new ValidationError('Comissão não encontrada')
  }

  if (!comissao.ativa) {
    throw new ValidationError('Esta comissão não está ativa')
  }

  // Verificar se o relator é membro ativo da comissão
  const membroComissao = await prisma.membroComissao.findFirst({
    where: {
      comissaoId: validatedData.comissaoId,
      parlamentarId: validatedData.relatorId,
      ativo: true
    }
  })

  if (!membroComissao) {
    throw new ValidationError('O relator deve ser membro ativo da comissão')
  }

  // Verificar se a proposição está em tramitação para esta comissão
  // Busca tramitação ativa (RECEBIDA ou EM_ANDAMENTO) para uma unidade que corresponde à comissão
  const unidadeFilter: Prisma.TramitacaoUnidadeWhereInput = {
    OR: [
      { nome: { contains: comissao.nome, mode: 'insensitive' as Prisma.QueryMode } },
      ...(comissao.sigla ? [{ nome: { contains: comissao.sigla, mode: 'insensitive' as Prisma.QueryMode } }] : []),
      ...(comissao.sigla ? [{ sigla: comissao.sigla }] : [])
    ]
  }

  const tramitacaoParaComissao = await prisma.tramitacao.findFirst({
    where: {
      proposicaoId: validatedData.proposicaoId,
      status: { in: ['RECEBIDA', 'EM_ANDAMENTO'] },
      unidade: unidadeFilter
    }
  })

  if (!tramitacaoParaComissao) {
    throw new ValidationError(
      `A proposição não está em tramitação para a ${comissao.sigla || comissao.nome}. ` +
      'Verifique se a proposição foi tramitada para esta comissão.'
    )
  }

  // Gerar número do parecer SEQUENCIAL POR COMISSÃO
  // Formato: NNN/YYYY-SIGLA (ex: 001/2026-CLJ, 002/2026-CFO)
  const anoAtual = new Date().getFullYear()
  const siglaComissao = comissao.sigla || comissao.nome.substring(0, 3).toUpperCase()

  // Buscar último parecer DESTA comissão no ano atual
  const ultimoParecerComissao = await prisma.parecer.findFirst({
    where: {
      ano: anoAtual,
      comissaoId: validatedData.comissaoId
    },
    orderBy: { createdAt: 'desc' }
  })

  let proximoNumero = 1
  if (ultimoParecerComissao?.numero) {
    // Extrai o número do formato NNN/YYYY-SIGLA ou NNN/YYYY
    const numMatch = ultimoParecerComissao.numero.match(/^(\d+)/)
    if (numMatch) {
      proximoNumero = parseInt(numMatch[1]) + 1
    }
  }

  const numero = `${String(proximoNumero).padStart(3, '0')}/${anoAtual}-${siglaComissao}`

  // Criar o parecer com status AGUARDANDO_PAUTA (disponível para inclusão em pauta)
  const parecer = await prisma.parecer.create({
    data: {
      proposicaoId: validatedData.proposicaoId,
      comissaoId: validatedData.comissaoId,
      relatorId: validatedData.relatorId,
      numero,
      ano: anoAtual,
      tipo: validatedData.tipo,
      status: 'AGUARDANDO_PAUTA',
      fundamentacao: validatedData.fundamentacao,
      conclusao: validatedData.conclusao,
      ementa: validatedData.ementa,
      emendasPropostas: validatedData.emendasPropostas,
      dataDistribuicao: new Date(),
      prazoEmissao: validatedData.prazoEmissao ? new Date(validatedData.prazoEmissao) : null,
      observacoes: validatedData.observacoes,
      // Anexos
      arquivoUrl: validatedData.arquivoUrl,
      arquivoNome: validatedData.arquivoNome,
      arquivoTamanho: validatedData.arquivoTamanho,
      driveUrl: validatedData.driveUrl
    },
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true
        }
      },
      comissao: {
        select: {
          id: true,
          nome: true,
          sigla: true
        }
      },
      relator: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    }
  })

  return createSuccessResponse(parecer, 'Parecer criado com sucesso')
})
