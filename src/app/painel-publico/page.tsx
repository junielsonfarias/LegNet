'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Monitor, Clock, Calendar, Users } from 'lucide-react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { usePainelPublico } from './hooks/usePainelPublico'
import {
  PainelHeader,
  SuspendedBanner,
  CompletedBanner,
  ItemNavigation,
  ItemAtual,
  VotacaoEmAndamento,
  VotacaoResultado,
  ItemStatus,
  PresencaSidebar
} from './components'

function PainelPublicoContent() {
  const searchParams = useSearchParams()
  const sessaoIdParam = searchParams.get('sessaoId')
  const { configuracao } = useConfiguracaoInstitucional()
  const nomeCasa = configuracao.nomeCasa || 'Camara Municipal'

  const {
    sessao,
    loading,
    error,
    tempoSessao,
    itemAtualIndex,
    itensOrdenados,
    itemAtual,
    totalItens,
    presentes,
    ausentes,
    totalParlamentares,
    percentualPresenca,
    votacoesItemAtual,
    estatisticasVotacao,
    irParaAnterior,
    irParaProximo
  } = usePainelPublico({ sessaoIdParam })

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando painel publico...</p>
        </div>
      </div>
    )
  }

  // Sem sessão disponível
  if (error || !sessao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
      >
        <div className="text-center px-6 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Monitor className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{nomeCasa}</h1>
          <p className="text-blue-300/70 mb-8">Painel Eletronico Legislativo</p>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <Users className="h-10 w-10 text-blue-400/50 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-2">
              Nenhuma sessao disponivel
            </h2>
            <p className="text-blue-200/50 text-sm">
              Nao ha sessoes em andamento ou agendadas para os proximos minutos.
              O painel sera atualizado automaticamente quando uma sessao for iniciada.
            </p>
          </div>

          <p className="text-blue-300/30 text-xs mt-6">Verificando a cada 30 segundos</p>
        </div>
      </div>
    )
  }

  const sessaoEmAndamento = sessao.status === 'EM_ANDAMENTO'
  const sessaoConcluida = sessao.status === 'CONCLUIDA'
  const sessaoSuspensa = sessao.status === 'SUSPENSA'
  const sessaoAgendada = sessao.status === 'AGENDADA'

  // Tela de espera para sessão AGENDADA (pré-sessão)
  if (sessaoAgendada) {
    return <WaitingForSession sessao={sessao} nomeCasa={nomeCasa} />
  }

  return (
    <>
      {/* Header do Painel */}
      <PainelHeader
        sessao={sessao}
        tempoSessao={tempoSessao}
        totalItens={totalItens}
        nomeCasa={nomeCasa}
      />

      {/* Banner de Sessao Suspensa */}
      {sessaoSuspensa && <SuspendedBanner tempoSessao={tempoSessao} />}

      {/* Banner de Sessao Concluida com Resumo */}
      {sessaoConcluida && (
        <CompletedBanner itens={itensOrdenados} totalItens={totalItens} totalPresentes={presentes.length} totalAusentes={ausentes.length} />
      )}

      {/* Conteudo Principal */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Coluna 1: Item Atual / Votacao */}
          <div className="xl:col-span-2 space-y-6">
            {/* Navegacao entre Itens da Pauta */}
            <ItemNavigation
              itemAtualIndex={itemAtualIndex}
              totalItens={totalItens}
              itemAtual={itemAtual}
              sessaoEmAndamento={sessaoEmAndamento}
              onAnterior={irParaAnterior}
              onProximo={irParaProximo}
            />

            {/* Item Atual da Pauta */}
            <ItemAtual itemAtual={itemAtual} />

            {/* Votacao em Andamento - Mostra apenas durante a votacao */}
            {itemAtual && itemAtual.status === 'EM_VOTACAO' && (
              <VotacaoEmAndamento
                estatisticas={estatisticasVotacao}
                totalPresentes={presentes.length}
              />
            )}

            {/* Resultado da Votacao - Mostra apenas apos encerrar a votacao */}
            {itemAtual && votacoesItemAtual.length > 0 && itemAtual.status !== 'EM_VOTACAO' && (
              <VotacaoResultado estatisticas={estatisticasVotacao} />
            )}

            {/* Informacoes do Item (quando nao ha votacao registrada) */}
            {itemAtual && votacoesItemAtual.length === 0 && (
              <ItemStatus
                itemAtual={itemAtual}
                estatisticas={estatisticasVotacao}
                totalPresentes={presentes.length}
              />
            )}
          </div>

          {/* Coluna 2: Presenca dos Parlamentares ou Andamento da Votacao */}
          <div className="space-y-6">
            <PresencaSidebar
              itemAtual={itemAtual}
              presentes={presentes}
              ausentes={ausentes}
              totalParlamentares={totalParlamentares}
              percentualPresenca={percentualPresenca}
              votacoesItemAtual={votacoesItemAtual}
              estatisticas={estatisticasVotacao}
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Tela de espera pré-sessão com countdown
function WaitingForSession({ sessao, nomeCasa }: { sessao: any; nomeCasa: string }) {
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0, total: 0 })

  useEffect(() => {
    const calcCountdown = () => {
      const dataSessao = new Date(sessao.data)
      if (sessao.horarioInicio) {
        const [h, m] = sessao.horarioInicio.split(':')
        dataSessao.setHours(parseInt(h), parseInt(m), 0, 0)
      }
      const diff = Math.max(0, Math.floor((dataSessao.getTime() - Date.now()) / 1000))
      setCountdown({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
        total: diff
      })
    }
    calcCountdown()
    const interval = setInterval(calcCountdown, 1000)
    return () => clearInterval(interval)
  }, [sessao.data, sessao.horarioInicio])

  // Se countdown chegou a 0, recarregar a página (sessão pode ter sido iniciada)
  useEffect(() => {
    if (countdown.total === 0 && countdown.h === 0) {
      const timeout = setTimeout(() => window.location.reload(), 5000)
      return () => clearTimeout(timeout)
    }
  }, [countdown.total, countdown.h])

  const tipoLabels: Record<string, string> = {
    'ORDINARIA': 'Sessao Ordinaria',
    'EXTRAORDINARIA': 'Sessao Extraordinaria',
    'SOLENE': 'Sessao Solene',
    'ESPECIAL': 'Sessao Especial',
  }

  const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Logo / Nome da Casa */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Monitor className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{nomeCasa}</h1>
          <p className="text-blue-300/70 mt-1">Painel Eletronico Legislativo</p>
        </div>

        {/* Info da sessão */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium uppercase tracking-wider">Proxima Sessao</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            {tipoLabels[sessao.tipo] || sessao.tipo} {sessao.numero && `nº ${sessao.numero}`}
          </h2>

          <p className="text-blue-200/80 text-sm mb-1 capitalize">{dataFormatada}</p>
          {sessao.horarioInicio && (
            <p className="text-blue-200/60 text-sm">
              <Clock className="h-3.5 w-3.5 inline mr-1" />
              Inicio previsto: {sessao.horarioInicio}
            </p>
          )}
        </div>

        {/* Countdown */}
        {countdown.total > 0 ? (
          <div className="mb-8">
            <p className="text-blue-300/60 text-sm mb-4 uppercase tracking-wider font-medium">Sessao inicia em</p>
            <div className="flex items-center justify-center gap-3 md:gap-4">
              {[
                { value: countdown.h, label: 'Horas' },
                { value: countdown.m, label: 'Min' },
                { value: countdown.s, label: 'Seg' },
              ].map((unit) => (
                <div key={unit.label} className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-white font-mono">
                      {String(unit.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-xs text-blue-300/50 uppercase tracking-wider">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full border border-emerald-400/30 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-sm">Sessao prestes a iniciar...</span>
            </div>
            <p className="text-blue-300/40 text-xs mt-3">Aguardando operador iniciar a sessao</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-blue-300/30 text-xs">
          Painel atualizado automaticamente
        </p>
      </div>
    </div>
  )
}

// Loading fallback para o Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-xl">Carregando painel publico...</p>
      </div>
    </div>
  )
}

// Componente principal com Suspense boundary
export default function PainelPublicoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PainelPublicoContent />
    </Suspense>
  )
}
