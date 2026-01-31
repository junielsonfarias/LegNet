import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ConflictError
} from '@/lib/error-handler'
import { isSlugProposicao, gerarSlugProposicao, parseSlugProposicao } from '@/lib/utils/proposicao-slug'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização de proposição
const UpdateProposicaoSchema = z.object({
  numero: z.string().min(1).optional(),
  ano: z.number().min(1900).optional(), // Permite anos anteriores para dados históricos
  tipo: z.enum(['PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO', 'INDICACAO', 'REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO']).optional(),
  titulo: z.string().min(5).optional(),
  ementa: z.string().min(10).optional(),
  texto: z.string().optional(),
  urlDocumento: z.string().url('URL deve ser válida').optional().or(z.literal('')), // URL externa do documento
  status: z.enum(['APRESENTADA', 'EM_TRAMITACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA']).optional(),
  dataApresentacao: z.string().optional(),
  dataVotacao: z.string().optional(),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE']).optional(),
  sessaoId: z.string().optional(),
  autorId: z.string().optional()
})

/**
 * Busca proposição por ID técnico ou slug amigável
 * Também tenta buscar por número/ano/tipo se o slug não encontrar
 * @param idOrSlug - ID técnico (CUID) ou slug (ex: pl-0022-2025)
 * @returns Proposição encontrada ou null
 */
async function findProposicaoByIdOrSlug(idOrSlug: string) {
  // Verifica se é um slug amigável
  if (isSlugProposicao(idOrSlug)) {
    // Primeiro tenta buscar pelo slug armazenado
    let proposicao: Awaited<ReturnType<typeof prisma.proposicao.findUnique>> = null
    try {
      proposicao = await prisma.proposicao.findUnique({
        where: { slug: idOrSlug }
      })
    } catch {
      // Campo slug pode não existir no banco ainda
    }

    // Se não encontrar pelo slug, tenta buscar por número/ano/tipo
    if (!proposicao) {
      const parsed = parseSlugProposicao(idOrSlug)
      if (parsed) {
        // Remove zeros à esquerda do número para compatibilidade
        const numeroSemZeros = parsed.numero.replace(/^0+/, '') || '0'
        proposicao = await prisma.proposicao.findFirst({
          where: {
            OR: [
              { numero: parsed.numero, ano: parsed.ano, tipo: parsed.tipo as any },
              { numero: numeroSemZeros, ano: parsed.ano, tipo: parsed.tipo as any }
            ]
          }
        })
      }
    }

    return proposicao
  }

  // Caso contrário, busca por ID técnico
  return prisma.proposicao.findUnique({
    where: { id: idOrSlug }
  })
}

// GET - Buscar proposição por ID ou slug
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const idOrSlug = params.id

  // Construir query baseada no tipo de identificador
  let whereClause: any

  if (isSlugProposicao(idOrSlug)) {
    // Primeiro tenta buscar pelo slug armazenado no banco
    try {
      const bySlug = await prisma.proposicao.findUnique({
        where: { slug: idOrSlug },
        include: {
          autor: {
            select: { id: true, nome: true, apelido: true, partido: true }
          },
          sessao: {
            select: { id: true, numero: true, data: true }
          }
        }
      })

      if (bySlug) {
        return createSuccessResponse(bySlug, 'Proposição encontrada com sucesso')
      }
    } catch {
      // Campo slug pode não existir no banco ainda, continuar com busca por número/ano/tipo
    }

    // Se não encontrou pelo slug, tenta por número/ano/tipo
    const parsed = parseSlugProposicao(idOrSlug)
    if (parsed) {
      // Remove zeros à esquerda do número para compatibilidade
      const numeroSemZeros = parsed.numero.replace(/^0+/, '') || '0'
      whereClause = {
        OR: [
          { numero: parsed.numero, ano: parsed.ano, tipo: parsed.tipo as any },
          { numero: numeroSemZeros, ano: parsed.ano, tipo: parsed.tipo as any }
        ]
      }
    } else {
      throw new NotFoundError('Proposição')
    }
  } else {
    // Busca por ID técnico
    whereClause = { id: idOrSlug }
  }

  const proposicao = await prisma.proposicao.findFirst({
    where: whereClause,
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      },
      sessao: {
        select: {
          id: true,
          numero: true,
          data: true
        }
      }
    }
  })

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  return createSuccessResponse(proposicao, 'Proposição encontrada com sucesso')
})

// PUT - Atualizar proposição por ID ou slug
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const idOrSlug = params.id
  const body = await request.json()

  // Validar dados
  const validatedData = UpdateProposicaoSchema.parse(body)

  // Verificar se proposição existe (busca por ID ou slug)
  const existingProposicao = await findProposicaoByIdOrSlug(idOrSlug)

  if (!existingProposicao) {
    throw new NotFoundError('Proposição')
  }

  // Verificar duplicatas (se tipo/número/ano foram alterados)
  const tipoParaVerificar = validatedData.tipo || existingProposicao.tipo
  const numeroParaVerificar = validatedData.numero || existingProposicao.numero
  const anoParaVerificar = validatedData.ano || existingProposicao.ano

  if ((validatedData.numero || validatedData.ano || validatedData.tipo) &&
      (validatedData.numero !== existingProposicao.numero ||
       validatedData.ano !== existingProposicao.ano ||
       validatedData.tipo !== existingProposicao.tipo)) {
    const duplicateCheck = await prisma.proposicao.findUnique({
      where: {
        tipo_numero_ano: {
          tipo: tipoParaVerificar,
          numero: numeroParaVerificar,
          ano: anoParaVerificar
        }
      }
    })

    if (duplicateCheck && duplicateCheck.id !== existingProposicao.id) {
      throw new ConflictError('Já existe uma proposição deste tipo com este número e ano')
    }
  }

  // Regenerar slug se tipo, número ou ano foram alterados
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
    const autor = await prisma.parlamentar.findUnique({
      where: { id: validatedData.autorId }
    })

    if (!autor) {
      throw new NotFoundError('Autor')
    }
  }

  const updatedProposicao = await prisma.proposicao.update({
    where: { id: existingProposicao.id },
    data: {
      slug: newSlug, // Atualiza slug se foi regenerado, undefined mantém o atual
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
    },
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    }
  })

  return createSuccessResponse(
    updatedProposicao,
    'Proposição atualizada com sucesso'
  )
})

// DELETE - Excluir proposição por ID ou slug
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const idOrSlug = params.id

  // Verificar se proposição existe (busca por ID ou slug)
  const existingProposicao = await findProposicaoByIdOrSlug(idOrSlug)

  if (!existingProposicao) {
    throw new NotFoundError('Proposição')
  }

  await prisma.proposicao.delete({
    where: { id: existingProposicao.id }
  })

  return createSuccessResponse(
    null,
    'Proposição excluída com sucesso'
  )
})

