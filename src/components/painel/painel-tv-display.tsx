'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { VereadorVotoGrid } from './vereador-voto-card'
import { CheckCircle, XCircle, MinusCircle, Clock, Users, Vote, Monitor, Timer } from 'lucide-react'

// Tipos para o estado do painel - exportados para uso em outras paginas
export interface VotoVereador {
  id: string
  nome: string
  apelido?: string | null
  foto?: string | null
  partido?: string | null
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | null
  votoPorProcuracao?: boolean
}

export interface ItemPautaAtivo {
  id: string
  titulo: string
  descricao?: string | null
  status: string // Flexivel para aceitar qualquer status da API
  proposicao?: {
    id: string
    numero: string | number
    ano: number
    tipo: string
    ementa?: string | null
  } | null
}

export interface EstadoPainel {
  sessao: {
    id: string
    numero: number
    tipo: string
    status: string
    data: string
    horarioInicio?: string
    tempoInicio?: string | null
  } | null
  itemAtual: ItemPautaAtivo | null
  votacao: {
    sim: number
    nao: number
    abstencao: number
    pendentes: number
  }
  vereadores: VotoVereador[]
  presentes: number
  totalVereadores: number
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE' | null
}

interface PainelTvDisplayProps {
  estado: EstadoPainel
  modo?: 'completo' | 'votacao' | 'placar' | 'presenca'
  transparente?: boolean
  horaAtual?: string
  cronometroSessao?: string // Duração da sessão no formato HH:MM:SS
  className?: string
}

/**
 * Componente de exibicao do painel para transmissao ao vivo
 * Otimizado para overlay em OBS, telao do plenario e captura de tela
 */
export function PainelTvDisplay({
  estado,
  modo = 'completo',
  transparente = false,
  horaAtual,
  cronometroSessao,
  className
}: PainelTvDisplayProps) {
  const { sessao, itemAtual, votacao, vereadores, presentes, totalVereadores, resultado } = estado

  // Calcular porcentagens para barra de progresso
  const totalVotos = votacao.sim + votacao.nao + votacao.abstencao
  const percentSim = totalVotos > 0 ? (votacao.sim / totalVotos) * 100 : 0
  const percentNao = totalVotos > 0 ? (votacao.nao / totalVotos) * 100 : 0
  const percentAbst = totalVotos > 0 ? (votacao.abstencao / totalVotos) * 100 : 0

  // Status da sessao para exibicao
  const statusSessaoLabel = useMemo(() => {
    if (!sessao) return ''
    switch (sessao.status) {
      case 'EM_ANDAMENTO': return 'EM ANDAMENTO'
      case 'AGENDADA': return 'AGENDADA'
      case 'CONCLUIDA': return 'CONCLUIDA'
      case 'CANCELADA': return 'CANCELADA'
      default: return sessao.status
    }
  }, [sessao])

  // Tipo de sessao para exibicao
  const tipoSessaoLabel = useMemo(() => {
    if (!sessao) return ''
    switch (sessao.tipo) {
      case 'ORDINARIA': return 'ORDINARIA'
      case 'EXTRAORDINARIA': return 'EXTRAORDINARIA'
      case 'SOLENE': return 'SOLENE'
      case 'ESPECIAL': return 'ESPECIAL'
      default: return sessao.tipo
    }
  }, [sessao])

  // Status do item atual
  const statusItemLabel = useMemo(() => {
    if (!itemAtual) return ''
    switch (itemAtual.status) {
      case 'EM_DISCUSSAO': return 'EM LEITURA'
      case 'EM_VOTACAO': return 'EM VOTACAO'
      case 'APROVADO': return 'APROVADO'
      case 'REJEITADO': return 'REJEITADO'
      default: return itemAtual.status.replace('_', ' ')
    }
  }, [itemAtual])

  // Estilos base
  const containerStyles = cn(
    'w-full h-full min-h-screen font-sans',
    transparente ? 'bg-transparent' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    className
  )

  // Modo apenas placar
  if (modo === 'placar') {
    return (
      <div className={containerStyles}>
        <PlacarVotacao
          sim={votacao.sim}
          nao={votacao.nao}
          abstencao={votacao.abstencao}
          percentSim={percentSim}
          percentNao={percentNao}
          percentAbst={percentAbst}
          resultado={resultado}
        />
      </div>
    )
  }

  // Modo apenas presenca
  if (modo === 'presenca') {
    return (
      <div className={containerStyles}>
        <div className="p-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Users className="w-12 h-12 text-blue-400" />
            <h2 className="text-4xl font-bold text-white">
              PRESENCA: {presentes}/{totalVereadores}
            </h2>
          </div>
          <VereadorVotoGrid
            vereadores={vereadores.map(v => ({ ...v, voto: null }))}
            size="lg"
          />
        </div>
      </div>
    )
  }

  // Modo apenas votacao
  if (modo === 'votacao') {
    return (
      <div className={containerStyles}>
        <div className="p-6 flex flex-col h-full">
          {/* Materia em votacao */}
          {itemAtual && (
            <div className="mb-6 bg-slate-800/80 rounded-xl p-4 border border-slate-600">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full uppercase">
                  {statusItemLabel}
                </span>
                {itemAtual.proposicao && (
                  <span className="text-xl font-bold text-white">
                    {itemAtual.proposicao.tipo.replace('_', ' ')} {itemAtual.proposicao.numero}/{itemAtual.proposicao.ano}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white leading-tight">
                {itemAtual.titulo}
              </h3>
            </div>
          )}

          {/* Placar */}
          <PlacarVotacao
            sim={votacao.sim}
            nao={votacao.nao}
            abstencao={votacao.abstencao}
            percentSim={percentSim}
            percentNao={percentNao}
            percentAbst={percentAbst}
            resultado={resultado}
            compacto
          />

          {/* Grid de vereadores */}
          <div className="flex-1 mt-6 overflow-hidden">
            <VereadorVotoGrid vereadores={vereadores} size="md" />
          </div>
        </div>
      </div>
    )
  }

  // Modo completo
  return (
    <div className={containerStyles}>
      <div className="flex flex-col h-full">
        {/* Header - Info da Sessao */}
        <header className="bg-slate-800/90 border-b-2 border-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Monitor className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  SESSAO {tipoSessaoLabel} #{sessao?.numero}
                </h1>
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full font-semibold',
                    sessao?.status === 'EM_ANDAMENTO' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                  )}>
                    {statusSessaoLabel}
                  </span>
                  {sessao?.data && (
                    <span className="text-gray-300">
                      {new Date(sessao.data).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hora atual, cronômetro e quorum */}
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-white tracking-wider">
                {horaAtual || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="flex items-center justify-end gap-4 text-sm text-gray-300 mt-1">
                {/* Cronômetro da sessão */}
                {cronometroSessao && (
                  <div className="flex items-center gap-1 text-blue-300">
                    <Timer className="w-4 h-4" />
                    <span className="font-mono font-semibold">{cronometroSessao}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>QUORUM: {presentes}/{totalVereadores} PRESENTES</span>
                  {presentes >= Math.floor(totalVereadores / 2) + 1 && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Corpo principal */}
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* Materia em discussao/votacao */}
          {itemAtual && (
            <div className="mb-6 bg-slate-800/80 rounded-xl p-5 border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <Vote className="w-6 h-6 text-purple-400" />
                <span className="text-gray-400 uppercase text-sm font-semibold tracking-wider">
                  MATERIA {statusItemLabel}
                </span>
              </div>
              <div className="flex items-start gap-4">
                {itemAtual.proposicao && (
                  <div className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg text-lg whitespace-nowrap">
                    {itemAtual.proposicao.tipo.replace('_', ' ')} {itemAtual.proposicao.numero}/{itemAtual.proposicao.ano}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                    {itemAtual.titulo}
                  </h2>
                  {itemAtual.proposicao?.ementa && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {itemAtual.proposicao.ementa}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Area de votacao */}
          {itemAtual?.status === 'EM_VOTACAO' && (
            <>
              {/* Placar */}
              <PlacarVotacao
                sim={votacao.sim}
                nao={votacao.nao}
                abstencao={votacao.abstencao}
                percentSim={percentSim}
                percentNao={percentNao}
                percentAbst={percentAbst}
                resultado={resultado}
              />

              {/* Grid de vereadores */}
              <div className="flex-1 mt-6 overflow-hidden">
                <VereadorVotoGrid vereadores={vereadores} size="lg" />
              </div>
            </>
          )}

          {/* Area de presenca quando nao em votacao */}
          {itemAtual?.status !== 'EM_VOTACAO' && vereadores.length > 0 && (
            <div className="flex-1 mt-4 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 uppercase text-sm font-semibold tracking-wider">
                  VEREADORES PRESENTES
                </span>
              </div>
              <VereadorVotoGrid
                vereadores={vereadores.filter(v => v.voto !== null || presentes > 0)}
                size="md"
              />
            </div>
          )}

          {/* Resultado quando finalizado */}
          {resultado && (
            <div className={cn(
              'mt-6 p-6 rounded-xl text-center animate-pulse',
              resultado === 'APROVADA' ? 'bg-green-600' :
              resultado === 'REJEITADA' ? 'bg-red-600' : 'bg-yellow-600'
            )}>
              <h3 className="text-4xl font-bold text-white uppercase tracking-wider">
                {resultado === 'APROVADA' ? 'APROVADA' :
                 resultado === 'REJEITADA' ? 'REJEITADA' : 'EMPATE'}
              </h3>
              <p className="text-xl text-white/90 mt-2">
                {votacao.sim} SIM x {votacao.nao} NAO ({votacao.abstencao} abstencoes)
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/**
 * Componente de placar de votacao
 */
interface PlacarVotacaoProps {
  sim: number
  nao: number
  abstencao: number
  percentSim: number
  percentNao: number
  percentAbst: number
  resultado?: 'APROVADA' | 'REJEITADA' | 'EMPATE' | null
  compacto?: boolean
}

function PlacarVotacao({
  sim,
  nao,
  abstencao,
  percentSim,
  percentNao,
  percentAbst,
  resultado,
  compacto = false
}: PlacarVotacaoProps) {
  const totalVotos = sim + nao + abstencao

  if (compacto) {
    return (
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-600/20 rounded-lg p-3">
            <div className="text-4xl font-bold text-green-400">{sim}</div>
            <div className="text-sm text-green-300 font-semibold">SIM</div>
          </div>
          <div className="bg-red-600/20 rounded-lg p-3">
            <div className="text-4xl font-bold text-red-400">{nao}</div>
            <div className="text-sm text-red-300 font-semibold">NAO</div>
          </div>
          <div className="bg-yellow-600/20 rounded-lg p-3">
            <div className="text-4xl font-bold text-yellow-400">{abstencao}</div>
            <div className="text-sm text-yellow-300 font-semibold">ABST</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-600">
      {/* Barra de progresso visual */}
      <div className="h-8 rounded-full overflow-hidden flex mb-6 bg-slate-700">
        {totalVotos > 0 ? (
          <>
            <div
              className="bg-green-500 flex items-center justify-center transition-all duration-500"
              style={{ width: `${percentSim}%` }}
            >
              {percentSim > 10 && (
                <span className="text-white font-bold text-sm">{Math.round(percentSim)}%</span>
              )}
            </div>
            <div
              className="bg-red-500 flex items-center justify-center transition-all duration-500"
              style={{ width: `${percentNao}%` }}
            >
              {percentNao > 10 && (
                <span className="text-white font-bold text-sm">{Math.round(percentNao)}%</span>
              )}
            </div>
            <div
              className="bg-yellow-500 flex items-center justify-center transition-all duration-500"
              style={{ width: `${percentAbst}%` }}
            >
              {percentAbst > 10 && (
                <span className="text-black font-bold text-sm">{Math.round(percentAbst)}%</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Aguardando votos...
          </div>
        )}
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CheckCircle className="w-10 h-10 text-green-400" />
            <span className="text-6xl font-bold text-green-400">{sim}</span>
          </div>
          <div className="text-xl font-bold text-green-300 uppercase tracking-wider">SIM</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <XCircle className="w-10 h-10 text-red-400" />
            <span className="text-6xl font-bold text-red-400">{nao}</span>
          </div>
          <div className="text-xl font-bold text-red-300 uppercase tracking-wider">NAO</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <MinusCircle className="w-10 h-10 text-yellow-400" />
            <span className="text-6xl font-bold text-yellow-400">{abstencao}</span>
          </div>
          <div className="text-xl font-bold text-yellow-300 uppercase tracking-wider">ABSTENCAO</div>
        </div>
      </div>

      {/* Indicador de tendencia */}
      {totalVotos > 0 && !resultado && (
        <div className="mt-6 text-center">
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold',
            sim > nao ? 'bg-green-600/30 text-green-300' :
            nao > sim ? 'bg-red-600/30 text-red-300' : 'bg-yellow-600/30 text-yellow-300'
          )}>
            {sim > nao ? (
              <>
                <CheckCircle className="w-5 h-5" />
                TENDENCIA: APROVACAO
              </>
            ) : nao > sim ? (
              <>
                <XCircle className="w-5 h-5" />
                TENDENCIA: REJEICAO
              </>
            ) : (
              <>
                <MinusCircle className="w-5 h-5" />
                EMPATE PARCIAL
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PainelTvDisplay
