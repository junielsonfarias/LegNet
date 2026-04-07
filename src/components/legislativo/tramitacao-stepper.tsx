'use client'

import { CheckCircle, Circle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TramitacaoStepperProps {
  status: string
  tramitacoes: Array<{
    tipoTramitacao?: { nome: string }
    unidade?: { nome: string; sigla?: string }
    status?: string
    resultado?: string
  }>
  resultado?: string | null
}

const ETAPAS = [
  { key: 'APRESENTADA', label: 'Apresentada', short: 'Apresent.' },
  { key: 'COMISSAO', label: 'Comissão', short: 'Comissão' },
  { key: 'PARECER', label: 'Parecer', short: 'Parecer' },
  { key: 'PLENARIO', label: 'Plenário', short: 'Plenário' },
  { key: 'VOTACAO', label: 'Votação', short: 'Votação' },
  { key: 'RESULTADO', label: 'Resultado', short: 'Resultado' },
]

function getEtapaAtual(status: string, tramitacoes: TramitacaoStepperProps['tramitacoes'], resultado?: string | null): number {
  // Resultado final
  if (['APROVADA', 'REJEITADA', 'ARQUIVADA', 'RETIRADA', 'VETADA'].includes(status)) return 6
  if (resultado) return 6

  // Votação
  if (status === 'EM_VOTACAO' || status === 'VOTADA') return 5

  // Verificar tramitações para determinar estágio
  const temParecer = tramitacoes.some(t =>
    t.resultado || t.parecer || (t.tipoTramitacao?.nome || '').toLowerCase().includes('parecer')
  )
  if (temParecer) return 4

  const temComissao = tramitacoes.some(t => {
    const unidade = (t.unidade?.nome || '').toLowerCase()
    return unidade.includes('comiss') || unidade.includes('clj')
  })
  if (temComissao) return 3

  // Em tramitação genérica
  if (['EM_TRAMITACAO', 'EM_PAUTA', 'EM_DISCUSSAO', 'AGUARDANDO_PAUTA'].includes(status)) return 2

  // Apresentada
  return 1
}

export function TramitacaoStepper({ status, tramitacoes, resultado }: TramitacaoStepperProps) {
  const etapaAtual = getEtapaAtual(status, tramitacoes, resultado)
  const isFinal = etapaAtual >= 6
  const isAprovada = status === 'APROVADA' || resultado === 'APROVADA'
  const isRejeitada = status === 'REJEITADA' || resultado === 'REJEITADA'

  return (
    <div className="w-full">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center justify-between">
        {ETAPAS.map((etapa, index) => {
          const stepNum = index + 1
          const isCompleted = stepNum < etapaAtual
          const isCurrent = stepNum === etapaAtual
          const isFinalStep = stepNum === 6

          let dotColor = 'bg-gray-200 text-gray-400'
          if (isCompleted) dotColor = 'bg-green-500 text-white'
          if (isCurrent && !isFinal) dotColor = 'bg-blue-500 text-white animate-pulse'
          if (isCurrent && isFinal && isAprovada) dotColor = 'bg-green-500 text-white'
          if (isCurrent && isFinal && isRejeitada) dotColor = 'bg-red-500 text-white'
          if (isCurrent && isFinal && !isAprovada && !isRejeitada) dotColor = 'bg-gray-500 text-white'

          return (
            <div key={etapa.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all', dotColor)}>
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                <span className={cn(
                  'text-[10px] mt-1.5 text-center leading-tight',
                  isCompleted || isCurrent ? 'text-gray-900 font-semibold' : 'text-gray-400'
                )}>
                  {isFinalStep && isFinal
                    ? (isAprovada ? 'Aprovada' : isRejeitada ? 'Rejeitada' : etapa.label)
                    : etapa.label
                  }
                </span>
              </div>
              {index < ETAPAS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-1.5',
                  stepNum < etapaAtual ? 'bg-green-400' : 'bg-gray-200'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical compacto */}
      <div className="sm:hidden flex items-center gap-1 overflow-x-auto pb-2">
        {ETAPAS.map((etapa, index) => {
          const stepNum = index + 1
          const isCompleted = stepNum < etapaAtual
          const isCurrent = stepNum === etapaAtual

          let dotColor = 'bg-gray-200'
          if (isCompleted) dotColor = 'bg-green-500'
          if (isCurrent) dotColor = 'bg-blue-500'
          if (isCurrent && isFinal && isAprovada) dotColor = 'bg-green-500'
          if (isCurrent && isFinal && isRejeitada) dotColor = 'bg-red-500'

          return (
            <div key={etapa.key} className="flex items-center">
              <div className="flex flex-col items-center min-w-[48px]">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white', dotColor)}>
                  {isCompleted ? '✓' : stepNum}
                </div>
                <span className={cn('text-[8px] mt-0.5', isCurrent ? 'font-bold text-gray-900' : 'text-gray-400')}>
                  {etapa.short}
                </span>
              </div>
              {index < ETAPAS.length - 1 && (
                <div className={cn('w-3 h-0.5', stepNum < etapaAtual ? 'bg-green-400' : 'bg-gray-200')} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
