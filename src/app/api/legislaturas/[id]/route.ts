import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ConflictError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para atualização
const LegislaturaUpdateSchema = z.object({
  numero: z.number()
    .int('Número da legislatura deve ser um inteiro')
    .positive('Número da legislatura deve ser positivo')
    .optional(),
  anoInicio: z.number()
    .int('Ano de início deve ser um inteiro')
    .min(1900, 'Ano de início inválido')
    .max(2100, 'Ano de início inválido')
    .optional(),
  anoFim: z.number()
    .int('Ano de fim deve ser um inteiro')
    .min(1900, 'Ano de fim inválido')
    .max(2100, 'Ano de fim inválido')
    .optional(),
  ativa: z.boolean().optional(),
  descricao: z.string().optional()
})

// GET - Buscar legislatura por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  const id = validateId(params.id)
  
  const legislatura = await prisma.legislatura.findUnique({
    where: { id }
  })
  
  if (!legislatura) {
    throw new NotFoundError('Legislatura não encontrada')
  }
  
  return createSuccessResponse(
    legislatura,
    'Legislatura encontrada com sucesso'
  )
}, { permissions: 'legislatura.view' })

// PUT - Atualizar legislatura
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)
  const body = await request.json()
  
  // Validar dados
  const validatedData = LegislaturaUpdateSchema.parse(body)
  
  // Verificar se legislatura existe
  const existingLegislatura = await prisma.legislatura.findUnique({
    where: { id }
  })
  
  if (!existingLegislatura) {
    throw new NotFoundError('Legislatura não encontrada')
  }
  
  // Se estiver ativando, verificar se já existe outra ativa
  if (validatedData.ativa === true && !existingLegislatura.ativa) {
    const outraAtiva = await prisma.legislatura.findFirst({
      where: { 
        ativa: true,
        id: { not: id }
      }
    })
    
    if (outraAtiva) {
      throw new ConflictError('Já existe uma legislatura ativa. Desative a atual antes de ativar esta.')
    }
  }
  
  // Se mudando o número, verificar duplicata
  if (validatedData.numero && validatedData.numero !== existingLegislatura.numero) {
    const numeroExistente = await prisma.legislatura.findFirst({
      where: { 
        numero: validatedData.numero,
        id: { not: id }
      }
    })
    
    if (numeroExistente) {
      throw new ConflictError('Já existe uma legislatura com este número')
    }
  }
  
  const legislatura = await prisma.legislatura.update({
    where: { id },
    data: validatedData
  })
  
  await logAudit({
    request,
    session,
    action: 'LEGISLATURA_UPDATE',
    entity: 'Legislatura',
    entityId: legislatura.id,
    metadata: {
      updates: validatedData
    }
  })
  
  return createSuccessResponse(
    legislatura,
    'Legislatura atualizada com sucesso'
  )
}, { permissions: 'legislatura.manage' })

// DELETE - Excluir legislatura
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = validateId(params.id)
  
  // Verificar se legislatura existe
  const legislatura = await prisma.legislatura.findUnique({
    where: { id }
  })
  
  if (!legislatura) {
    throw new NotFoundError('Legislatura não encontrada')
  }
  
  // Não permitir excluir legislatura ativa
  if (legislatura.ativa) {
    throw new ConflictError('Não é possível excluir uma legislatura ativa. Desative-a primeiro.')
  }
  
  await prisma.legislatura.delete({
    where: { id }
  })
  
  await logAudit({
    request,
    session,
    action: 'LEGISLATURA_DELETE',
    entity: 'Legislatura',
    entityId: id,
    metadata: {
      numero: legislatura.numero
    }
  })
  
  return createSuccessResponse(
    null,
    'Legislatura excluída com sucesso'
  )
}, { permissions: 'legislatura.manage' })

