'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CalendarioSessoesProps {
  sessoes: Array<{
    id: string
    numero: number
    tipo: string
    data: string
    horario?: string | null
    status: string
    descricao?: string | null
  }>
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const tipoColors: Record<string, string> = {
  'ORDINARIA': 'bg-blue-500',
  'EXTRAORDINARIA': 'bg-orange-500',
  'ESPECIAL': 'bg-purple-500',
  'SOLENE': 'bg-amber-500',
}

const tipoLabels: Record<string, string> = {
  'ORDINARIA': 'Ordinária',
  'EXTRAORDINARIA': 'Extraordinária',
  'ESPECIAL': 'Especial',
  'SOLENE': 'Solene',
}

const statusColors: Record<string, string> = {
  'CONCLUIDA': 'ring-green-400',
  'AGENDADA': 'ring-blue-400',
  'EM_ANDAMENTO': 'ring-red-400',
  'CANCELADA': 'ring-gray-300 opacity-50',
}

export function CalendarioSessoes({ sessoes }: CalendarioSessoesProps) {
  const [mesAtual, setMesAtual] = useState(new Date().getMonth())
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear())
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)

  // Mapear sessões por data (YYYY-MM-DD)
  const sessoesPorDia = useMemo(() => {
    const mapa: Record<string, CalendarioSessoesProps['sessoes']> = {}
    sessoes.forEach(s => {
      const d = new Date(s.data)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!mapa[key]) mapa[key] = []
      mapa[key].push(s)
    })
    return mapa
  }, [sessoes])

  // Gerar dias do mês
  const diasDoMes = useMemo(() => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1)
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0)
    const diasAntes = primeiroDia.getDay()
    const totalDias = ultimoDia.getDate()

    const dias: Array<{ dia: number; data: string; fora: boolean }> = []

    // Dias do mês anterior
    for (let i = diasAntes - 1; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtual, -i)
      dias.push({ dia: d.getDate(), data: '', fora: true })
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDias; i++) {
      const key = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      dias.push({ dia: i, data: key, fora: false })
    }

    // Completar última semana
    const restante = 7 - (dias.length % 7)
    if (restante < 7) {
      for (let i = 1; i <= restante; i++) {
        dias.push({ dia: i, data: '', fora: true })
      }
    }

    return dias
  }, [mesAtual, anoAtual])

  const sessoesDodia = diaSelecionado ? sessoesPorDia[diaSelecionado] || [] : []
  const hoje = new Date()
  const hojeKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      {/* Header: navegação mês */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => {
          if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1) }
          else setMesAtual(m => m - 1)
        }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-bold text-gray-900">{MESES[mesAtual]} {anoAtual}</h3>
        <Button variant="ghost" size="sm" onClick={() => {
          if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1) }
          else setMesAtual(m => m + 1)
        }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid calendário */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {/* Header dias da semana */}
        {DIAS_SEMANA.map(d => (
          <div key={d} className="bg-gray-50 text-center py-2 text-xs font-semibold text-gray-500">{d}</div>
        ))}

        {/* Dias */}
        {diasDoMes.map((item, idx) => {
          const sessoesDia = item.data ? sessoesPorDia[item.data] || [] : []
          const isHoje = item.data === hojeKey
          const isSelecionado = item.data === diaSelecionado
          const temSessao = sessoesDia.length > 0

          return (
            <button
              key={idx}
              className={cn(
                'bg-white p-1 sm:p-2 min-h-[48px] sm:min-h-[64px] text-left transition-all relative',
                item.fora && 'bg-gray-50 text-gray-300',
                !item.fora && 'hover:bg-blue-50 cursor-pointer',
                isHoje && 'bg-blue-50',
                isSelecionado && 'ring-2 ring-blue-500 z-10',
              )}
              onClick={() => item.data && setDiaSelecionado(item.data === diaSelecionado ? null : item.data)}
              disabled={item.fora}
            >
              <span className={cn(
                'text-xs sm:text-sm font-medium',
                isHoje && 'text-blue-600 font-bold',
                item.fora && 'text-gray-300'
              )}>
                {item.dia}
              </span>
              {/* Dots de sessões */}
              {temSessao && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap">
                  {sessoesDia.slice(0, 3).map((s, i) => (
                    <div
                      key={i}
                      className={cn('w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full', tipoColors[s.tipo] || 'bg-gray-400')}
                      title={`${tipoLabels[s.tipo] || s.tipo} - ${s.status}`}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 justify-center text-xs text-gray-500">
        {Object.entries(tipoLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={cn('w-2.5 h-2.5 rounded-full', tipoColors[key])} />
            {label}
          </div>
        ))}
      </div>

      {/* Detalhe do dia selecionado */}
      {diaSelecionado && sessoesDodia.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">
            Sessões em {new Date(diaSelecionado + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </h4>
          {sessoesDodia.map(s => (
            <div key={s.id} className="bg-white rounded-lg p-3 flex items-center justify-between border border-blue-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', tipoColors[s.tipo] || 'bg-gray-400')} />
                  <span className="font-medium text-sm">{s.numero}ª Sessão {tipoLabels[s.tipo] || s.tipo}</span>
                </div>
                {s.horario && <span className="text-xs text-gray-500 ml-5">{s.horario}</span>}
              </div>
              <Badge variant="outline" className="text-xs">
                {s.status === 'CONCLUIDA' ? 'Realizada' : s.status === 'AGENDADA' ? 'Agendada' : s.status === 'CANCELADA' ? 'Cancelada' : s.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {diaSelecionado && sessoesDodia.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-400">
          Nenhuma sessão nesta data
        </div>
      )}
    </div>
  )
}
