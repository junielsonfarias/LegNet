import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

interface ProximoEvento {
  id: string
  title: string
  type: 'sessao' | 'reuniao' | 'audiencia'
  date: Date
  time: string
  location?: string
  attendees?: number
}

// GET - Buscar próximos eventos
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
  const agora = new Date()

  const eventos: ProximoEvento[] = []

  // Buscar sessões agendadas
  const sessoesAgendadas = await prisma.sessao.findMany({
    where: {
      status: { in: ['AGENDADA', 'EM_ANDAMENTO'] },
      data: { gte: agora }
    },
    orderBy: { data: 'asc' },
    take: 10
  })

  // Buscar total de parlamentares ativos para número de participantes
  const totalParlamentaresAtivos = await prisma.parlamentar.count({ where: { ativo: true } })

  sessoesAgendadas.forEach(s => {
    const tipoFormatado = {
      'ORDINARIA': 'Ordinária',
      'EXTRAORDINARIA': 'Extraordinária',
      'SOLENE': 'Solene',
      'ESPECIAL': 'Especial'
    }[s.tipo] || s.tipo

    eventos.push({
      id: `sessao-${s.id}`,
      title: `Sessão ${tipoFormatado} ${String(s.numero).padStart(3, '0')}`,
      type: 'sessao',
      date: s.data,
      time: s.horario || '09:00',
      location: s.local || 'Plenário',
      attendees: totalParlamentaresAtivos
    })
  })

  // Buscar reuniões de comissão agendadas
  const reunioesAgendadas = await prisma.reuniaoComissao.findMany({
    where: {
      status: { in: ['AGENDADA', 'EM_ANDAMENTO'] },
      data: { gte: agora }
    },
    orderBy: { data: 'asc' },
    take: 10,
    include: {
      comissao: {
        include: {
          membros: {
            where: { ativo: true },
            select: { id: true }
          }
        }
      }
    }
  })

  reunioesAgendadas.forEach(r => {
    // Formatar hora a partir de horaInicio se disponivel
    const horaFormatada = r.horaInicio
      ? `${r.horaInicio.getHours().toString().padStart(2, '0')}:${r.horaInicio.getMinutes().toString().padStart(2, '0')}`
      : '14:00'
    eventos.push({
      id: `reuniao-${r.id}`,
      title: `Reuniao ${r.comissao.sigla || r.comissao.nome}`,
      type: 'reuniao',
      date: r.data,
      time: horaFormatada,
      location: r.local || 'Sala de Comissoes',
      attendees: r.comissao.membros?.length || 0
    })
  })

  // TODO: Audiencias publicas - modelo ainda nao implementado
  // Quando o modelo AudienciaPublica for criado, descomentar o codigo abaixo:
  // const audienciasAgendadas = await prisma.audienciaPublica.findMany({...})

  // Ordenar por data e limitar
  eventos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const eventosLimitados = eventos.slice(0, limit)

  return createSuccessResponse(eventosLimitados, 'Eventos carregados com sucesso')
}, { permissions: 'dashboard.view' })
