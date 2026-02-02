'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Monitor } from 'lucide-react'
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

  // Error state
  if (error || !sessao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white p-8 max-w-md">
          <CardContent className="text-center">
            <Monitor className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              {error || 'Nenhuma sessao disponivel'}
            </h2>
            <p className="text-blue-200 mb-6">
              Nao ha sessoes disponiveis no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sessaoEmAndamento = sessao.status === 'EM_ANDAMENTO'
  const sessaoConcluida = sessao.status === 'CONCLUIDA'
  const sessaoSuspensa = sessao.status === 'SUSPENSA'

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
        <CompletedBanner itens={itensOrdenados} totalItens={totalItens} />
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
