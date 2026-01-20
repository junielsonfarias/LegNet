import { NextRequest, NextResponse } from 'next/server'
import {
  buscarEventos,
  buscarEventosDoMes,
  buscarEventosDaSemana,
  buscarEventosDoDia,
  buscarProximosEventos,
  gerarICalEvento,
  type TipoEvento,
} from '@/lib/services/calendario-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendario - Busca eventos do calendário
 *
 * Query params:
 * - periodo: 'mes' | 'semana' | 'dia' | 'proximos' | 'intervalo'
 * - ano: número do ano (para periodo=mes)
 * - mes: número do mês 1-12 (para periodo=mes)
 * - data: data ISO (para periodo=dia)
 * - inicio: data ISO de início (para periodo=intervalo)
 * - fim: data ISO de fim (para periodo=intervalo)
 * - tipos: tipos separados por vírgula
 * - limite: número máximo de eventos (para periodo=proximos)
 * - formato: 'json' | 'ical' (default: json)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const periodo = searchParams.get('periodo') || 'mes'
    const formato = searchParams.get('formato') || 'json'
    const tiposParam = searchParams.get('tipos')
    const tipos = tiposParam ? (tiposParam.split(',') as TipoEvento[]) : undefined

    let eventos

    switch (periodo) {
      case 'mes': {
        const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()))
        const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1))
        eventos = await buscarEventosDoMes(ano, mes)
        break
      }

      case 'semana': {
        const dataRef = searchParams.get('data')
        eventos = await buscarEventosDaSemana(dataRef ? new Date(dataRef) : undefined)
        break
      }

      case 'dia': {
        const data = searchParams.get('data')
        if (!data) {
          return NextResponse.json(
            { error: 'Parâmetro "data" é obrigatório para periodo=dia' },
            { status: 400 }
          )
        }
        eventos = await buscarEventosDoDia(new Date(data))
        break
      }

      case 'proximos': {
        const limite = parseInt(searchParams.get('limite') || '5')
        eventos = await buscarProximosEventos(limite)
        break
      }

      case 'intervalo': {
        const inicio = searchParams.get('inicio')
        const fim = searchParams.get('fim')
        if (!inicio || !fim) {
          return NextResponse.json(
            { error: 'Parâmetros "inicio" e "fim" são obrigatórios para periodo=intervalo' },
            { status: 400 }
          )
        }
        eventos = await buscarEventos({
          inicio: new Date(inicio),
          fim: new Date(fim),
          tipos,
        })
        break
      }

      default:
        eventos = await buscarEventosDoMes(
          new Date().getFullYear(),
          new Date().getMonth() + 1
        )
    }

    // Filtrar por tipos se especificado
    if (tipos && tipos.length > 0) {
      eventos = eventos.filter(e => tipos.includes(e.tipo))
    }

    // Retornar em formato iCal se solicitado
    if (formato === 'ical' && eventos.length > 0) {
      const icalContent = eventos.map(e => gerarICalEvento(e)).join('\n')
      return new NextResponse(icalContent, {
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': 'attachment; filename="calendario-legislativo.ics"',
        },
      })
    }

    return NextResponse.json({
      eventos,
      total: eventos.length,
      periodo,
    })
  } catch (error) {
    console.error('Erro ao buscar calendário:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar calendário' },
      { status: 500 }
    )
  }
}
