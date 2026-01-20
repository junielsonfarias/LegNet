/**
 * Serviço de Calendário Legislativo
 * Consolida eventos de sessões, audiências públicas e reuniões de comissões
 */

import { prisma } from '@/lib/prisma'

export type TipoEvento =
  | 'sessao_ordinaria'
  | 'sessao_extraordinaria'
  | 'sessao_solene'
  | 'sessao_especial'
  | 'audiencia_publica'
  | 'reuniao_comissao'
  | 'evento_especial'

export interface EventoCalendario {
  id: string
  titulo: string
  descricao?: string
  tipo: TipoEvento
  inicio: Date
  fim?: Date
  local?: string
  cor: string
  url?: string
  metadata?: Record<string, unknown>
}

export interface FiltrosCalendario {
  inicio: Date
  fim: Date
  tipos?: TipoEvento[]
  comissaoId?: string
}

// Cores por tipo de evento
const coresEventos: Record<TipoEvento, string> = {
  sessao_ordinaria: '#3B82F6',      // Azul
  sessao_extraordinaria: '#EF4444', // Vermelho
  sessao_solene: '#8B5CF6',         // Roxo
  sessao_especial: '#F59E0B',       // Amarelo
  audiencia_publica: '#10B981',     // Verde
  reuniao_comissao: '#6366F1',      // Indigo
  evento_especial: '#EC4899',       // Rosa
}

// Labels por tipo de evento
export const labelsEventos: Record<TipoEvento, string> = {
  sessao_ordinaria: 'Sessao Ordinaria',
  sessao_extraordinaria: 'Sessao Extraordinaria',
  sessao_solene: 'Sessao Solene',
  sessao_especial: 'Sessao Especial',
  audiencia_publica: 'Audiencia Publica',
  reuniao_comissao: 'Reuniao de Comissao',
  evento_especial: 'Evento Especial',
}

/**
 * Busca todos os eventos do calendário em um período
 */
export async function buscarEventos(filtros: FiltrosCalendario): Promise<EventoCalendario[]> {
  const { inicio, fim, tipos, comissaoId } = filtros
  const eventos: EventoCalendario[] = []

  // Determinar quais tipos buscar
  const tiposFiltrados = tipos || Object.keys(coresEventos) as TipoEvento[]

  // Buscar sessões
  if (tiposFiltrados.some(t => t.startsWith('sessao_'))) {
    const sessoes = await buscarSessoes(inicio, fim, tiposFiltrados)
    eventos.push(...sessoes)
  }

  // Buscar audiências públicas
  if (tiposFiltrados.includes('audiencia_publica')) {
    const audiencias = await buscarAudienciasPublicas(inicio, fim)
    eventos.push(...audiencias)
  }

  // Buscar reuniões de comissões
  if (tiposFiltrados.includes('reuniao_comissao')) {
    const reunioes = await buscarReunioesComissoes(inicio, fim, comissaoId)
    eventos.push(...reunioes)
  }

  // Ordenar por data de início
  eventos.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())

  return eventos
}

/**
 * Busca sessões legislativas
 */
async function buscarSessoes(inicio: Date, fim: Date, tipos: TipoEvento[]): Promise<EventoCalendario[]> {
  try {
    // Mapear tipos de evento para tipos de sessão do Prisma
    const tiposSessao: string[] = []
    if (tipos.includes('sessao_ordinaria')) tiposSessao.push('ORDINARIA')
    if (tipos.includes('sessao_extraordinaria')) tiposSessao.push('EXTRAORDINARIA')
    if (tipos.includes('sessao_solene')) tiposSessao.push('SOLENE')
    if (tipos.includes('sessao_especial')) tiposSessao.push('ESPECIAL')

    if (tiposSessao.length === 0) return []

    const sessoes = await prisma.sessao.findMany({
      where: {
        data: {
          gte: inicio,
          lte: fim,
        },
        tipo: {
          in: tiposSessao as any[],
        },
      },
      orderBy: { data: 'asc' },
    })

    return sessoes.map(s => {
      const tipoEvento = `sessao_${s.tipo.toLowerCase()}` as TipoEvento
      return {
        id: s.id,
        titulo: `Sessao ${s.tipo} ${s.numero}`,
        descricao: s.descricao || undefined,
        tipo: tipoEvento,
        inicio: s.data,
        fim: calcularFimSessao(s.data, s.horario),
        local: s.local || 'Plenario da Camara',
        cor: coresEventos[tipoEvento],
        url: `/legislativo/sessoes/${s.id}`,
        metadata: {
          numero: s.numero,
          status: s.status,
          horario: s.horario,
        },
      }
    })
  } catch (error) {
    console.error('Erro ao buscar sessões:', error)
    return []
  }
}

/**
 * Busca audiências públicas
 * Nota: Este modelo pode não existir no schema atual, então tratamos o erro
 */
async function buscarAudienciasPublicas(inicio: Date, fim: Date): Promise<EventoCalendario[]> {
  try {
    // Verificar se existe o modelo AudienciaPublica
    // Por ora, retornar array vazio se não existir
    // @ts-ignore - modelo pode não existir
    if (!prisma.audienciaPublica) {
      return []
    }

    // @ts-ignore
    const audiencias = await prisma.audienciaPublica.findMany({
      where: {
        data: {
          gte: inicio,
          lte: fim,
        },
      },
      include: {
        comissao: { select: { nome: true, sigla: true } },
      },
      orderBy: { data: 'asc' },
    })

    return audiencias.map((a: any) => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao || undefined,
      tipo: 'audiencia_publica' as TipoEvento,
      inicio: a.data,
      fim: a.dataFim || undefined,
      local: a.local || 'Camara Municipal',
      cor: coresEventos.audiencia_publica,
      url: `/legislativo/audiencias-publicas/${a.id}`,
      metadata: {
        comissao: a.comissao?.nome,
        comissaoSigla: a.comissao?.sigla,
        status: a.status,
      },
    }))
  } catch (error) {
    // Modelo provavelmente não existe, retornar array vazio
    return []
  }
}

/**
 * Busca reuniões de comissões
 * Nota: Este modelo pode não existir no schema atual, então tratamos o erro
 */
async function buscarReunioesComissoes(
  inicio: Date,
  fim: Date,
  comissaoId?: string
): Promise<EventoCalendario[]> {
  try {
    // Verificar se existe o modelo ReuniaoComissao
    // Por ora, retornar array vazio se não existir
    // @ts-ignore - modelo pode não existir
    if (!prisma.reuniaoComissao) {
      return []
    }

    // @ts-ignore
    const reunioes = await prisma.reuniaoComissao.findMany({
      where: {
        data: {
          gte: inicio,
          lte: fim,
        },
        ...(comissaoId && { comissaoId }),
      },
      include: {
        comissao: { select: { nome: true, sigla: true } },
      },
      orderBy: { data: 'asc' },
    })

    return reunioes.map((r: any) => ({
      id: r.id,
      titulo: `Reuniao ${r.comissao?.sigla || 'Comissao'}`,
      descricao: r.pauta || undefined,
      tipo: 'reuniao_comissao' as TipoEvento,
      inicio: r.data,
      fim: r.dataFim || undefined,
      local: r.local || 'Sala de Comissoes',
      cor: coresEventos.reuniao_comissao,
      url: `/legislativo/comissoes/${r.comissaoId}`,
      metadata: {
        comissao: r.comissao?.nome,
        comissaoSigla: r.comissao?.sigla,
      },
    }))
  } catch (error) {
    // Modelo provavelmente não existe, retornar array vazio
    return []
  }
}

/**
 * Calcula horário de fim da sessão (padrão: 3 horas após início)
 */
function calcularFimSessao(data: Date, horario?: string | null): Date {
  const dataInicio = new Date(data)

  if (horario) {
    const [horas, minutos] = horario.split(':').map(Number)
    dataInicio.setHours(horas, minutos, 0, 0)
  }

  // Adicionar 3 horas como duração padrão
  const dataFim = new Date(dataInicio)
  dataFim.setHours(dataFim.getHours() + 3)

  return dataFim
}

/**
 * Busca eventos de um dia específico
 */
export async function buscarEventosDoDia(data: Date): Promise<EventoCalendario[]> {
  const inicioDia = new Date(data)
  inicioDia.setHours(0, 0, 0, 0)

  const fimDia = new Date(data)
  fimDia.setHours(23, 59, 59, 999)

  return buscarEventos({ inicio: inicioDia, fim: fimDia })
}

/**
 * Busca eventos da semana atual
 */
export async function buscarEventosDaSemana(dataReferencia?: Date): Promise<EventoCalendario[]> {
  const data = dataReferencia || new Date()
  const diaSemana = data.getDay()

  const inicioSemana = new Date(data)
  inicioSemana.setDate(data.getDate() - diaSemana)
  inicioSemana.setHours(0, 0, 0, 0)

  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(inicioSemana.getDate() + 6)
  fimSemana.setHours(23, 59, 59, 999)

  return buscarEventos({ inicio: inicioSemana, fim: fimSemana })
}

/**
 * Busca eventos do mês
 */
export async function buscarEventosDoMes(ano: number, mes: number): Promise<EventoCalendario[]> {
  const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0, 0)
  const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999)

  return buscarEventos({ inicio: inicioMes, fim: fimMes })
}

/**
 * Gera URL para exportar evento para Google Calendar
 */
export function gerarLinkGoogleCalendar(evento: EventoCalendario): string {
  const formatarData = (data: Date) => {
    return data.toISOString().replace(/-|:|\.\d{3}/g, '')
  }

  const inicio = formatarData(new Date(evento.inicio))
  const fim = evento.fim
    ? formatarData(new Date(evento.fim))
    : formatarData(new Date(new Date(evento.inicio).getTime() + 2 * 60 * 60 * 1000))

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evento.titulo,
    dates: `${inicio}/${fim}`,
    details: evento.descricao || '',
    location: evento.local || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Gera conteúdo iCal para download
 */
export function gerarICalEvento(evento: EventoCalendario): string {
  const formatarDataICal = (data: Date) => {
    return data.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z'
  }

  const inicio = formatarDataICal(new Date(evento.inicio))
  const fim = evento.fim
    ? formatarDataICal(new Date(evento.fim))
    : formatarDataICal(new Date(new Date(evento.inicio).getTime() + 2 * 60 * 60 * 1000))

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Camara Municipal//Calendario Legislativo//PT
BEGIN:VEVENT
UID:${evento.id}@camara.gov.br
DTSTAMP:${formatarDataICal(new Date())}
DTSTART:${inicio}
DTEND:${fim}
SUMMARY:${evento.titulo}
DESCRIPTION:${evento.descricao || ''}
LOCATION:${evento.local || ''}
END:VEVENT
END:VCALENDAR`
}

/**
 * Busca próximos eventos (próximos 7 dias)
 */
export async function buscarProximosEventos(limite: number = 5): Promise<EventoCalendario[]> {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const seteDias = new Date(hoje)
  seteDias.setDate(hoje.getDate() + 7)

  const eventos = await buscarEventos({ inicio: hoje, fim: seteDias })
  return eventos.slice(0, limite)
}

/**
 * Conta eventos por tipo em um período
 */
export async function contarEventosPorTipo(
  inicio: Date,
  fim: Date
): Promise<Record<TipoEvento, number>> {
  const eventos = await buscarEventos({ inicio, fim })

  const contagem: Record<TipoEvento, number> = {
    sessao_ordinaria: 0,
    sessao_extraordinaria: 0,
    sessao_solene: 0,
    sessao_especial: 0,
    audiencia_publica: 0,
    reuniao_comissao: 0,
    evento_especial: 0,
  }

  for (const evento of eventos) {
    contagem[evento.tipo]++
  }

  return contagem
}
