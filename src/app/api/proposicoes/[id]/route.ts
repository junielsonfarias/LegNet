import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ConflictError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { gerarSlugProposicao } from '@/lib/utils/proposicao-slug'
import { proposicaoDbService } from '@/lib/services/proposicao-db-service'

// Configurar para renderizacao dinamica
export const dynamic = 'force-dynamic'

// Schema de validacao para atualizacao de proposicao
// O campo 'tipo' aceita qualquer codigo de tipo cadastrado em TipoProposicaoConfig
const UpdateProposicaoSchema = z.object({
  numero: z.string().min(1).optional(),
  ano: z.number().min(1900).optional(), // Permite anos anteriores para dados historicos
  tipo: z.string().min(1).max(50).optional(), // Tipos sao dinamicos - validados contra TipoProposicaoConfig
  titulo: z.string().min(5).optional(),
  ementa: z.string().min(10).optional(),
  texto: z.string().optional(),
  urlDocumento: z.string().url('URL deve ser válida').optional().or(z.literal('')), // URL externa do documento
  status: z.enum(['APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA', 'EM_DISCUSSAO', 'EM_VOTACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA', 'SANCIONADA', 'PROMULGADA']).optional(),
  dataApresentacao: z.string().optional(),
  dataVotacao: z.string().optional(),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE']).optional(),
  sessaoId: z.string().optional(),
  autorId: z.string().optional()
})

// GET - Buscar proposicao por ID ou slug
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: idOrSlug } = await params

  const proposicao = await proposicaoDbService.getByIdOrSlug(idOrSlug)

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  return createSuccessResponse(proposicao, 'Proposição encontrada com sucesso')
})

// PUT - Atualizar proposicao por ID ou slug
// SEGURANCA: Requer autenticacao e permissao 'proposicao.manage'
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: idOrSlug } = await context.params
  const body = await request.json()

  // Validar dados
  const validatedData = UpdateProposicaoSchema.parse(body)

  // Verificar se proposicao existe (busca por ID ou slug)
  const existingProposicao = await proposicaoDbService.findByIdOrSlug(idOrSlug)

  if (!existingProposicao) {
    throw new NotFoundError('Proposição')
  }

  // Verificar duplicatas (se tipo/numero/ano foram alterados)
  const tipoParaVerificar = validatedData.tipo || existingProposicao.tipo
  const numeroParaVerificar = validatedData.numero || existingProposicao.numero
  const anoParaVerificar = validatedData.ano || existingProposicao.ano

  if ((validatedData.numero || validatedData.ano || validatedData.tipo) &&
      (validatedData.numero !== existingProposicao.numero ||
       validatedData.ano !== existingProposicao.ano ||
       validatedData.tipo !== existingProposicao.tipo)) {
    const duplicateCheck = await proposicaoDbService.checkDuplicate(
      tipoParaVerificar,
      numeroParaVerificar,
      anoParaVerificar,
      existingProposicao.id
    )

    if (duplicateCheck) {
      throw new ConflictError('Já existe uma proposição deste tipo com este número e ano')
    }
  }

  // Regenerar slug se tipo, numero ou ano foram alterados
  let newSlug: string | undefined
  const tipoAlterado = validatedData.tipo && validatedData.tipo !== existingProposicao.tipo
  const numeroAlterado = validatedData.numero && validatedData.numero !== existingProposicao.numero
  const anoAlterado = validatedData.ano && validatedData.ano !== existingProposicao.ano

  if (tipoAlterado || numeroAlterado || anoAlterado) {
    newSlug = gerarSlugProposicao(
      validatedData.tipo || existingProposicao.tipo,
      validatedData.numero || existingProposicao.numero,
      validatedData.ano || existingProposicao.ano
    )
  }

  // Verificar se autor existe (se foi alterado)
  if (validatedData.autorId && validatedData.autorId !== existingProposicao.autorId) {
    const autor = await proposicaoDbService.checkAutorExists(validatedData.autorId)

    if (!autor) {
      throw new NotFoundError('Autor')
    }
  }

  const updatedProposicao = await proposicaoDbService.update(existingProposicao.id, {
    slug: newSlug,
    numero: validatedData.numero,
    ano: validatedData.ano,
    tipo: validatedData.tipo,
    titulo: validatedData.titulo,
    ementa: validatedData.ementa,
    texto: validatedData.texto,
    urlDocumento: validatedData.urlDocumento || null,
    status: validatedData.status,
    dataApresentacao: validatedData.dataApresentacao ? new Date(validatedData.dataApresentacao) : undefined,
    dataVotacao: validatedData.dataVotacao ? new Date(validatedData.dataVotacao) : validatedData.dataVotacao === null ? null : undefined,
    resultado: validatedData.resultado,
    sessaoId: validatedData.sessaoId,
    autorId: validatedData.autorId
  })

  return createSuccessResponse(
    updatedProposicao,
    'Proposição atualizada com sucesso'
  )
}, { permissions: 'proposicao.manage' })

// DELETE - Excluir proposicao por ID ou slug
// SEGURANCA: Requer autenticacao e permissao 'proposicao.manage'
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: idOrSlug } = await context.params

  // Verificar se proposicao existe (busca por ID ou slug)
  const existingProposicao = await proposicaoDbService.findByIdOrSlug(idOrSlug)

  if (!existingProposicao) {
    throw new NotFoundError('Proposição')
  }

  await proposicaoDbService.remove(existingProposicao.id)

  return createSuccessResponse(
    null,
    'Proposição excluída com sucesso'
  )
}, { permissions: 'proposicao.manage' })
