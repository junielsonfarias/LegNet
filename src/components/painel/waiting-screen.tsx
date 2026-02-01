'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Monitor, Calendar, Clock, Users, FileText, Timer } from 'lucide-react'
import { useCronometroSincronizado, useHoraSincronizada } from '@/lib/hooks/use-cronometro-sincronizado'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

interface WaitingScreenProps {
  /** Informacoes da sessao */
  sessao: {
    numero: number
    tipo: string
    data: string
    horario?: string | null
    status: string
    tempoInicio?: string | null
  }
  /** Numero de presentes */
  presentes: number
  /** Total de parlamentares */
  totalParlamentares: number
  /** Total de itens na pauta */
  totalItens?: number
  /** Itens ja votados */
  itensVotados?: number
  /** Mensagem personalizada */
  mensagem?: string
  className?: string
}

/**
 * Tela de aguardando entre votacoes
 *
 * Exibe informacoes da sessao enquanto nao ha votacao em andamento
 */
export function WaitingScreen({
  sessao,
  presentes,
  totalParlamentares,
  totalItens = 0,
  itensVotados = 0,
  mensagem,
  className
}: WaitingScreenProps) {
  const { formatada: horaFormatada } = useHoraSincronizada()
  const { formatado: cronometroSessao } = useCronometroSincronizado({
    tempoInicio: sessao.tempoInicio ?? null,
    ativo: sessao.status === 'EM_ANDAMENTO'
  })
  const { configuracao } = useConfiguracaoInstitucional()
  const nomeCasa = configuracao.nomeCasa || 'Câmara Municipal'

  // Formatar tipo de sessao
  const tipoSessaoLabel = {
    'ORDINARIA': 'Ordinaria',
    'EXTRAORDINARIA': 'Extraordinaria',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[sessao.tipo] || sessao.tipo

  // Formatar status
  const statusLabel = {
    'AGENDADA': 'Agendada',
    'EM_ANDAMENTO': 'Em Andamento',
    'CONCLUIDA': 'Concluida',
    'CANCELADA': 'Cancelada'
  }[sessao.status] || sessao.status

  // Animacao de dots
  const [dots, setDots] = useState('')
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8',
        className
      )}
    >
      {/* Logo/Icone */}
      <div className="mb-8 animate-fade-in">
        <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center border-4 border-blue-500/30">
          <Monitor className="w-12 h-12 text-blue-400" />
        </div>
      </div>

      {/* Título da Sessão */}
      <div className="text-center mb-8 animate-slide-in-up">
        <h1 className="text-4xl font-bold text-white mb-2">
          {sessao.numero}ª Sessão {tipoSessaoLabel}
        </h1>
        <p className="text-xl text-blue-300">
          {nomeCasa}
        </p>
      </div>

      {/* Status */}
      <div
        className={cn(
          'px-6 py-3 rounded-full font-semibold text-lg mb-8 animate-scale-in',
          sessao.status === 'EM_ANDAMENTO'
            ? 'bg-green-600/30 text-green-300 border border-green-500/50'
            : 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
        )}
      >
        {sessao.status === 'EM_ANDAMENTO' && (
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse" />
        )}
        {statusLabel.toUpperCase()}
      </div>

      {/* Informacoes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-700 animate-slide-in-up">
          <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Data</div>
          <div className="text-lg text-white font-semibold">
            {new Date(sessao.data).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-700 animate-slide-in-up">
          <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Hora Atual</div>
          <div className="text-lg text-white font-mono font-semibold">
            {horaFormatada}
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-700 animate-slide-in-up">
          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Quorum</div>
          <div className="text-lg text-white font-semibold">
            <span className="text-green-400">{presentes}</span>/{totalParlamentares}
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-700 animate-slide-in-up">
          <FileText className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-sm text-slate-400">Pauta</div>
          <div className="text-lg text-white font-semibold">
            {itensVotados}/{totalItens} itens
          </div>
        </div>
      </div>

      {/* Cronometro da sessao */}
      {sessao.status === 'EM_ANDAMENTO' && (
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 text-2xl text-blue-300">
            <Timer className="w-6 h-6" />
            <span className="font-mono font-bold">{cronometroSessao}</span>
          </div>
        </div>
      )}

      {/* Mensagem de aguardando */}
      <div className="text-center animate-fade-in">
        <p className="text-xl text-slate-400">
          {mensagem || `Aguardando proxima votacao${dots}`}
        </p>
      </div>

      {/* Barra de progresso decorativa */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 animate-pulse"
          style={{
            width: totalItens > 0 ? `${(itensVotados / totalItens) * 100}%` : '0%'
          }}
        />
      </div>
    </div>
  )
}

export default WaitingScreen
