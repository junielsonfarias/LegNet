import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, ValidationError, ConflictError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { 
  getLegislaturaAtual, 
  getPeriodoAtual, 
  getProximoNumeroSessaoOrdinaria,
  gerarPautaAutomatica,
  gerarAtaSessao
} from '@/lib/utils/sessoes-utils'
import { combineDateAndTimeUTC } from '@/lib/utils/date'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

// Schema de validação para sessão
const SessaoSchema = z.object({
  numero: z.number().min(1, 'Número da sessão é obrigatório').optional(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']),
  data: z.string().min(1, 'Data é obrigatória'),
  horario: z.string().optional(),
  local: z.string().optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).default('AGENDADA'),
  descricao: z.string().optional(),
  ata: z.string().optional(),
  finalizada: z.boolean().default(false),
  legislaturaId: z.string().optional(),
  periodoId: z.string().optional(),
  pauta: z.string().optional(),
  tempoInicio: z.string().optional()
})

// GET - Listar sessões
export const GET = withAuth(async (request: NextRequest, _ctx, _session) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // Construir filtros
  const where: any = {}
  
  if (status) {
    where.status = status
  }
  
  if (tipo) {
    where.tipo = tipo
  }

  console.log('🔍 GET /api/sessoes - Tipo de banco:', prisma.constructor.name)
  console.log('🔍 Filtros aplicados:', where)
  console.log('🔍 Paginação:', { page, limit, skip: (page - 1) * limit })
  
  const [sessoes, total] = await Promise.all([
    prisma.sessao.findMany({
      where,
      orderBy: [
        { data: 'desc' },
        { numero: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        legislatura: {
          select: {
            id: true,
            numero: true,
            anoInicio: true,
            anoFim: true
          }
        },
        periodo: {
          select: {
            id: true,
            numero: true,
            dataInicio: true,
            dataFim: true
          }
        },
        pautaSessao: {
          include: {
            itemAtual: {
              select: {
                id: true,
                titulo: true,
                secao: true,
                ordem: true,
                tempoEstimado: true,
                tempoReal: true,
                tempoAcumulado: true,
                iniciadoEm: true,
                finalizadoEm: true,
                status: true
              }
            },
            itens: {
              orderBy: { ordem: 'asc' },
              include: {
                proposicao: {
                  select: {
                    id: true,
                    numero: true,
                    ano: true,
                    titulo: true,
                    tipo: true,
                    status: true
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.sessao.count({ where })
  ])

  console.log('📋 Sessões retornadas da API GET:', {
    total: sessoes.length,
    totalCount: total,
    filtros: where,
    usandoMock: prisma.constructor.name !== 'PrismaClient',
    sessoes: sessoes.map(s => ({ id: s.id, numero: s.numero, tipo: s.tipo, status: s.status }))
  })
  
  // Se estiver usando mock, verificar todas as sessões sem filtro
  if (prisma.constructor.name !== 'PrismaClient') {
    const todasSessoes = await prisma.sessao.findMany({})
    console.log('📊 Total de sessões no mock (sem filtro):', todasSessoes.length)
  }

  return createSuccessResponse(
    sessoes,
    'Sessões listadas com sucesso',
    total,
    200,
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  )
}, { permissions: 'sessao.view' })

// POST - Criar sessão
export const POST = withAuth(async (request: NextRequest, _ctx, session) => {
  console.log('📥 POST /api/sessoes - Requisição recebida')
  let body
  try {
    body = await request.json()
    console.log('📦 Body recebido (raw):', JSON.stringify(body))
    console.log('📦 Body recebido (parsed):', body)
    console.log('📦 Tipos dos dados:', {
      numero: typeof body.numero,
      tipo: typeof body.tipo,
      data: typeof body.data,
      status: typeof body.status
    })
  } catch (error) {
    console.error('❌ Erro ao parsear JSON:', error)
    throw new ValidationError('Body inválido')
  }
  
  // Validar dados
  console.log('✅ Validando dados com Zod...')
  let validatedData
  try {
    // Converter numero para number se for string
    if (typeof body.numero === 'string') {
      body.numero = parseInt(body.numero, 10)
      console.log('🔄 numero convertido de string para number:', body.numero)
    }
    
    validatedData = SessaoSchema.parse(body)
    console.log('✅ Dados validados com sucesso:', validatedData)
    
    // Validação de data no backend
    const dataSessao = combineDateAndTimeUTC(validatedData.data, validatedData.horario)
    const agora = new Date()
    
    // Se não for finalizada, a data deve ser futura
    if (!validatedData.finalizada && dataSessao <= agora) {
      throw new ValidationError('A data e hora da sessão deve ser futura para sessões não finalizadas')
    }
    
    // Se for finalizada, permitir data passada mas validar formato
    if (validatedData.finalizada && isNaN(dataSessao.getTime())) {
      throw new ValidationError('Data inválida')
    }
  } catch (error: any) {
    console.error('❌ Erro na validação Zod:', error)
    console.error('❌ Detalhes do erro:', {
      errors: error.errors,
      message: error.message,
      issues: error.issues
    })
    throw new ValidationError(error.errors?.[0]?.message || error.message || 'Dados inválidos')
  }
  
  // Identificar legislatura e período se não fornecidos
  const dataSessao = combineDateAndTimeUTC(validatedData.data, validatedData.horario)
  let legislaturaId = validatedData.legislaturaId
  let periodoId = validatedData.periodoId
  
  if (!legislaturaId) {
    const legislatura = await getLegislaturaAtual()
    if (!legislatura) {
      throw new ValidationError('Não há legislatura ativa cadastrada. Cadastre uma legislatura primeiro.')
    }
    legislaturaId = legislatura.id
    console.log('📋 Legislatura identificada automaticamente:', legislatura.numero)
  }
  
  if (!periodoId && legislaturaId) {
    const periodo = await getPeriodoAtual(dataSessao, legislaturaId)
    if (!periodo) {
      throw new ValidationError('Não há período ativo para a data informada. Verifique os períodos da legislatura.')
    }
    periodoId = periodo.id
    console.log('📋 Período identificado automaticamente:', periodo.numero)
  }
  
  // Calcular número sequencial se não fornecido (apenas para sessões ordinárias)
  let numeroSessao = validatedData.numero
  if (!numeroSessao && validatedData.tipo === 'ORDINARIA' && legislaturaId && periodoId) {
    numeroSessao = await getProximoNumeroSessaoOrdinaria(legislaturaId, periodoId)
    console.log('📋 Número sequencial calculado:', numeroSessao)
  } else if (!numeroSessao) {
    // Para outros tipos, buscar o maior número e adicionar 1
    const ultimaSessao = await prisma.sessao.findFirst({
      where: {
        tipo: validatedData.tipo,
        ...(legislaturaId && periodoId ? { legislaturaId, periodoId } : {})
      },
      orderBy: { numero: 'desc' }
    })
    numeroSessao = ultimaSessao ? ultimaSessao.numero + 1 : 1
    console.log('📋 Número calculado para sessão não-ordinária:', numeroSessao)
  }
  
  // Verificar se já existe sessão com mesmo número na mesma legislatura/período
  const existingSessao = await prisma.sessao.findFirst({
    where: {
      numero: numeroSessao,
      tipo: validatedData.tipo,
      ...(legislaturaId && periodoId ? { legislaturaId, periodoId } : {})
    }
  })
  
  if (existingSessao) {
    throw new ConflictError(`Já existe uma sessão ${validatedData.tipo} número ${numeroSessao}${legislaturaId && periodoId ? ' nesta legislatura/período' : ''}`)
  }
  
  const sessao = await prisma.sessao.create({
    data: {
      numero: numeroSessao,
      tipo: validatedData.tipo,
      data: dataSessao,
      horario: validatedData.horario || null,
      local: validatedData.local || null,
      status: validatedData.status || 'AGENDADA',
      descricao: validatedData.descricao || null,
      ata: validatedData.ata || null,
      finalizada: validatedData.finalizada || false,
      legislaturaId: legislaturaId || null,
      periodoId: periodoId || null,
      pauta: validatedData.pauta || null
    }
  })

  // Gerar pauta relacional automática
  const pautaAutomatica = await gerarPautaAutomatica(numeroSessao, dataSessao, validatedData.horario)
  const tempoTotal = pautaAutomatica.itens.reduce((acc, item) => acc + (item.tempoEstimado || 0), 0)

  await prisma.pautaSessao.create({
    data: {
      sessaoId: sessao.id,
      status: 'RASCUNHO',
      geradaAutomaticamente: true,
      observacoes: pautaAutomatica.observacoes,
      tempoTotalEstimado: tempoTotal,
      tempoTotalReal: 0,
      itemAtualId: null,
      itens: {
        create: pautaAutomatica.itens.map(item => ({
          secao: item.secao,
          ordem: item.ordem,
          titulo: item.titulo,
          descricao: item.descricao || null,
          tempoEstimado: item.tempoEstimado || null,
          tempoAcumulado: 0,
          tempoReal: null,
          iniciadoEm: null,
          finalizadoEm: null,
          status: 'PENDENTE'
        }))
      }
    }
  })

  if (validatedData.finalizada && validatedData.status === 'CONCLUIDA' && !validatedData.ata) {
    try {
      const ataGerada = await gerarAtaSessao(sessao.id)
      await prisma.sessao.update({
        where: { id: sessao.id },
        data: { ata: ataGerada }
      })
      console.log('📋 Ata gerada automaticamente')
    } catch (error) {
      console.error('⚠️ Erro ao gerar ata (não crítico):', error)
    }
  }

  const sessaoCompleta = await prisma.sessao.findUnique({
    where: { id: sessao.id },
    include: {
      legislatura: {
        select: {
          id: true,
          numero: true,
          anoInicio: true,
          anoFim: true
        }
      },
      periodo: {
        select: {
          id: true,
          numero: true,
          dataInicio: true,
          dataFim: true
        }
      },
      pautaSessao: {
        include: {
          itens: {
            orderBy: { ordem: 'asc' },
            include: {
              proposicao: {
                select: {
                  id: true,
                  numero: true,
                  ano: true,
                  titulo: true,
                  tipo: true,
                  status: true
                }
              }
            }
          }
        }
      }
    }
  })

  console.log('✅ Sessão criada no banco de dados:', {
    id: sessao.id,
    numero: sessao.numero,
    tipo: sessao.tipo,
    data: sessao.data,
    status: sessao.status
  })
  
  await logAudit({
    request,
    session,
    action: 'SESSAO_CREATE',
    entity: 'Sessao',
    entityId: sessao.id,
    metadata: {
      numero: sessao.numero,
      tipo: sessao.tipo,
      status: sessao.status,
      legislaturaId,
      periodoId
    }
  })

  return createSuccessResponse(
    sessaoCompleta,
    'Sessão criada com sucesso',
    undefined,
    201
  )
})
