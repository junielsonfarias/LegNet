import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { pareceresDbService } from '@/lib/services/pareceres-db-service'

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
  arquivoUrl: z.string().url().optional().nullable(),
  arquivoNome: z.string().optional().nullable(),
  arquivoTamanho: z.number().int().optional().nullable(),
  driveUrl: z.string().url().optional().nullable()
})

// GET - Listar pareceres com filtros
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const pareceres = await pareceresDbService.list({
    comissaoId: searchParams.get('comissaoId') || undefined,
    proposicaoId: searchParams.get('proposicaoId') || undefined,
    relatorId: searchParams.get('relatorId') || undefined,
    status: searchParams.get('status') || undefined,
    tipo: searchParams.get('tipo') || undefined,
    ano: searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
  })

  return createSuccessResponse(pareceres, 'Pareceres listados com sucesso')
})

// POST - Criar novo parecer
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateParecerSchema.parse(body)

  // Verificar duplicidade
  const parecerExistente = await pareceresDbService.checkDuplicate(
    validatedData.proposicaoId,
    validatedData.comissaoId
  )
  if (parecerExistente) {
    throw new ValidationError('Já existe um parecer desta comissão para esta proposição')
  }

  // Verificar proposição
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: validatedData.proposicaoId }
  })
  if (!proposicao) throw new ValidationError('Proposição não encontrada')

  // Verificar comissão
  const comissao = await prisma.comissao.findUnique({
    where: { id: validatedData.comissaoId }
  })
  if (!comissao) throw new ValidationError('Comissão não encontrada')
  if (!comissao.ativa) throw new ValidationError('Esta comissão não está ativa')

  // Verificar relator é membro ativo
  const membroComissao = await prisma.membroComissao.findFirst({
    where: {
      comissaoId: validatedData.comissaoId,
      parlamentarId: validatedData.relatorId,
      ativo: true
    }
  })
  if (!membroComissao) throw new ValidationError('O relator deve ser membro ativo da comissão')

  // Verificar tramitação
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

  // Gerar número
  const anoAtual = new Date().getFullYear()
  const siglaComissao = comissao.sigla || comissao.nome.substring(0, 3).toUpperCase()
  const proximoNumero = await pareceresDbService.getNextNumero(validatedData.comissaoId, anoAtual)
  const numero = `${String(proximoNumero).padStart(3, '0')}/${anoAtual}-${siglaComissao}`

  const parecer = await pareceresDbService.create({
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
    arquivoUrl: validatedData.arquivoUrl,
    arquivoNome: validatedData.arquivoNome,
    arquivoTamanho: validatedData.arquivoTamanho,
    driveUrl: validatedData.driveUrl
  })

  return createSuccessResponse(parecer, 'Parecer criado com sucesso')
}, { permissions: 'comissao.manage' })
