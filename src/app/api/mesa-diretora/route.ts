import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse, ValidationError, ConflictError, validateId } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { parseDateOnlyToUTC } from '@/lib/utils/date'
import { syncMesaDiretoraHistorico } from '@/lib/participation-history'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para membro
const MembroMesaDiretoraSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  cargoId: z.string().min(1, 'Cargo é obrigatório'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional()
})

// Schema de validação para mesa diretora
const MesaDiretoraSchema = z.object({
  periodoId: z.string().min(1, 'Período é obrigatório'),
  ativa: z.boolean().default(false),
  descricao: z.string().optional(),
  membros: z.array(MembroMesaDiretoraSchema).min(1, 'Pelo menos um membro é obrigatório')
})

// GET - Listar mesas diretora
export const GET = withAuth(async (request: NextRequest, _ctx, _session) => {
  const { searchParams } = new URL(request.url)
  const legislaturaId = searchParams.get('legislaturaId')
  const periodoId = searchParams.get('periodoId')
  const ativa = searchParams.get('ativa')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // Construir filtros
  const where: any = {}
  
  if (periodoId) {
    where.periodoId = periodoId
  }
  
  if (legislaturaId) {
    where.periodo = {
      legislaturaId
    }
  }
  
  if (ativa !== null) {
    where.ativa = ativa === 'true'
  }
  
  if (search) {
    where.OR = [
      { descricao: { contains: search, mode: 'insensitive' } },
      {
        periodo: {
          OR: [
            { descricao: { contains: search, mode: 'insensitive' } },
            {
              legislatura: {
                OR: [
                  { descricao: { contains: search, mode: 'insensitive' } }
                ]
              }
            }
          ]
        }
      }
    ]
  }

  const [mesas, total] = await Promise.all([
    prisma.mesaDiretora.findMany({
      where,
      include: {
        periodo: {
          include: {
            legislatura: true
          }
        },
        membros: {
          include: {
            parlamentar: {
              select: {
                id: true,
                nome: true,
                apelido: true
              }
            },
            cargo: true
          },
          orderBy: {
            cargo: {
              ordem: 'asc'
            }
          }
        }
      } as any,
      orderBy: [
        { ativa: 'desc' },
        {
          periodo: {
            dataInicio: 'desc'
          }
        }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.mesaDiretora.count({ where })
  ])

  return createSuccessResponse(
    mesas,
    'Mesas diretora listadas com sucesso',
    total,
    200,
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  )
}, { permissions: 'mesa.view' })

// POST - Criar mesa diretora
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  
  // Validar dados
  const validatedData = MesaDiretoraSchema.parse(body)
  
  // Verificar se período existe
  const periodo = await prisma.periodoLegislatura.findUnique({
    where: { id: validatedData.periodoId },
    include: {
      cargos: true
    }
  })
  
  if (!periodo) {
    throw new ValidationError('Período não encontrado')
  }
  
  // Se marcando como ativa, garantir que não exista outra mesa ativa no período
  if (validatedData.ativa) {
    const mesaAtiva = await prisma.mesaDiretora.findFirst({
      where: {
        periodoId: validatedData.periodoId,
        ativa: true
      }
    })

    if (mesaAtiva) {
      throw new ConflictError('Já existe uma mesa diretora ativa para este período. Desative a mesa atual antes de criar uma nova ativa.')
    }
  }
  
  // Validar se todos os cargos obrigatórios estão presentes
  const cargosObrigatorios = periodo.cargos.filter(c => c.obrigatorio)
  const cargosFornecidos = validatedData.membros.map(m => m.cargoId)
  const cargosFaltantes = cargosObrigatorios.filter(c => !cargosFornecidos.includes(c.id))
  
  if (cargosFaltantes.length > 0) {
    throw new ValidationError(`Cargos obrigatórios não preenchidos: ${cargosFaltantes.map(c => c.nome).join(', ')}`)
  }

  const cargosDuplicados = cargosFornecidos.filter((cargoId, index, arr) => arr.indexOf(cargoId) !== index)
  if (cargosDuplicados.length > 0) {
    const nomesDuplicados = periodo.cargos
      .filter(cargo => cargosDuplicados.includes(cargo.id))
      .map(cargo => cargo.nome)
    throw new ValidationError(`Há cargos duplicados na composição da mesa diretora: ${nomesDuplicados.join(', ')}`)
  }

  // Validar datas dos membros
  validatedData.membros.forEach(membro => {
    const inicio = new Date(membro.dataInicio)
    const fim = membro.dataFim ? new Date(membro.dataFim) : null

    if (Number.isNaN(inicio.getTime())) {
      throw new ValidationError('Data de início do membro inválida')
    }

    if (fim && Number.isNaN(fim.getTime())) {
      throw new ValidationError('Data de fim do membro inválida')
    }

    if (fim && fim < inicio) {
      throw new ValidationError('A data de fim do membro não pode ser anterior à data de início')
    }
  })
  
  // Criar mesa diretora com membros
  const mesa = await prisma.mesaDiretora.create({
    data: {
      periodoId: validatedData.periodoId,
      ativa: validatedData.ativa ?? false,
      descricao: validatedData.descricao || null,
      membros: {
        create: validatedData.membros.map(m => ({
          parlamentarId: m.parlamentarId,
          cargoId: m.cargoId,
          dataInicio: parseDateOnlyToUTC(m.dataInicio),
          dataFim: m.dataFim ? parseDateOnlyToUTC(m.dataFim) : null,
          ativo: m.ativo ?? true,
          observacoes: m.observacoes || null
        }))
      }
    },
    include: {
      periodo: {
        include: {
          legislatura: true
        }
      },
      membros: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true
            }
          },
          cargo: true
        }
      }
    } as any
  })
  
  await logAudit({
    request,
    session,
    action: 'MESA_DIRETORA_CREATE',
    entity: 'MesaDiretora',
    entityId: mesa.id,
    metadata: {
      periodoId: validatedData.periodoId,
      ativa: validatedData.ativa,
      membros: validatedData.membros.map(m => ({ cargoId: m.cargoId, parlamentarId: m.parlamentarId }))
    }
  })

  await syncMesaDiretoraHistorico(mesa.id)
  
  return createSuccessResponse(
    mesa,
    'Mesa diretora criada com sucesso',
    undefined,
    201
  )
}, { permissions: 'mesa.manage' })

