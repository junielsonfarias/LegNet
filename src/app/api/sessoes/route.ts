import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, ValidationError, ConflictError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import {
  getLegislaturaAtual,
  getLegislaturaParaData,
  getPeriodoAtual,
  getPeriodoParaData,
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
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA']).default('AGENDADA'),
  descricao: z.string().optional(),
  ata: z.string().optional(),
  finalizada: z.boolean().default(false),
  legislaturaId: z.string().optional(),
  periodoId: z.string().optional(),
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
  let body
  try {
    body = await request.json()
  } catch (error) {
    throw new ValidationError('Body inválido')
  }

  // Validar dados
  let validatedData
  try {
    // Converter numero para number se for string
    if (typeof body.numero === 'string') {
      body.numero = parseInt(body.numero, 10)
    }

    validatedData = SessaoSchema.parse(body)
    
    // Validação de data no backend
    const dataSessao = combineDateAndTimeUTC(validatedData.data, validatedData.horario)
    const agora = new Date()

    // Se não for finalizada, verificar se a data é válida
    // Permitimos sessões para hoje (independente do horário) ou futuras
    if (!validatedData.finalizada) {
      // Comparar apenas as datas (ignorando o horário)
      const dataHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
      const dataSessaoSemHora = new Date(dataSessao.getFullYear(), dataSessao.getMonth(), dataSessao.getDate())

      if (dataSessaoSemHora < dataHoje) {
        throw new ValidationError('A data da sessão não pode ser no passado para sessões não finalizadas')
      }
    }

    // Se for finalizada, permitir data passada mas validar formato
    if (validatedData.finalizada && isNaN(dataSessao.getTime())) {
      throw new ValidationError('Data inválida')
    }
  } catch (error: any) {
    throw new ValidationError(error.errors?.[0]?.message || error.message || 'Dados inválidos')
  }
  
  // Identificar legislatura e período se não fornecidos
  const dataSessao = combineDateAndTimeUTC(validatedData.data, validatedData.horario)
  let legislaturaId = validatedData.legislaturaId
  let periodoId = validatedData.periodoId
  const ehDadoPreterito = validatedData.finalizada === true

  if (!legislaturaId) {
    // Para dados pretéritos, busca legislatura pelo ano da data
    // Para sessões novas, usa legislatura ativa
    const legislatura = ehDadoPreterito
      ? await getLegislaturaParaData(dataSessao)
      : await getLegislaturaAtual()

    if (!legislatura) {
      throw new ValidationError(
        ehDadoPreterito
          ? `Não há legislatura cadastrada para o ano ${dataSessao.getFullYear()}. Cadastre a legislatura primeiro.`
          : 'Não há legislatura ativa cadastrada. Cadastre uma legislatura primeiro.'
      )
    }
    legislaturaId = legislatura.id
  }

  if (!periodoId && legislaturaId) {
    // Para dados pretéritos, usa busca mais flexível de período
    // Para sessões novas, exige período ativo
    const periodo = ehDadoPreterito
      ? await getPeriodoParaData(dataSessao, legislaturaId)
      : await getPeriodoAtual(dataSessao, legislaturaId)

    if (!periodo) {
      throw new ValidationError(
        ehDadoPreterito
          ? `Não há período cadastrado na legislatura para a data informada. Cadastre os períodos da legislatura primeiro.`
          : 'Não há período ativo para a data informada. Verifique os períodos da legislatura.'
      )
    }
    periodoId = periodo.id
  }
  
  // Calcular número sequencial se não fornecido (apenas para sessões ordinárias)
  let numeroSessao = validatedData.numero
  if (!numeroSessao && validatedData.tipo === 'ORDINARIA' && legislaturaId && periodoId) {
    numeroSessao = await getProximoNumeroSessaoOrdinaria(legislaturaId, periodoId)
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
      periodoId: periodoId || null
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
    } catch (error) {
      // Erro ao gerar ata não é crítico, sessão ainda foi criada
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
