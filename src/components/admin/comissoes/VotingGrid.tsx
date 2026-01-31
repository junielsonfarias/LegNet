'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Check,
  AlertTriangle,
  Crown,
  User
} from 'lucide-react'

interface Membro {
  id: string
  parlamentarId: string
  cargo: string
  nome: string
  presente: boolean
}

type Voto = 'SIM' | 'NAO' | 'ABSTENCAO' | null

interface VotingGridProps {
  membros: Membro[]
  onVotacaoFinalizada?: (resultado: {
    votosAFavor: number
    votosContra: number
    votosAbstencao: number
    aprovado: boolean
    votos: Record<string, Voto>
  }) => void
  disabled?: boolean
  votosIniciais?: Record<string, Voto>
}

export function VotingGrid({
  membros,
  onVotacaoFinalizada,
  disabled = false,
  votosIniciais = {}
}: VotingGridProps) {
  const [votos, setVotos] = useState<Record<string, Voto>>(votosIniciais)

  // Separar presidente dos demais membros
  const presidente = membros.find(m => m.cargo === 'PRESIDENTE')
  const demaisMembros = membros.filter(m => m.cargo !== 'PRESIDENTE')

  // Calcular contagem de votos (excluindo presidente)
  const contagem = useMemo(() => {
    let sim = 0
    let nao = 0
    let abstencao = 0

    demaisMembros.forEach(m => {
      const voto = votos[m.parlamentarId]
      if (voto === 'SIM') sim++
      else if (voto === 'NAO') nao++
      else if (voto === 'ABSTENCAO') abstencao++
    })

    return { sim, nao, abstencao }
  }, [votos, demaisMembros])

  // RN-112: Presidente so vota em empate
  const isEmpate = contagem.sim === contagem.nao
  const presidentePodeVotar = isEmpate && presidente?.presente

  // Voto do presidente (se votou)
  const votoPresidente = presidente ? votos[presidente.parlamentarId] : null

  // Resultado final
  const resultado = useMemo(() => {
    let totalSim = contagem.sim
    let totalNao = contagem.nao

    // Adicionar voto do presidente se houver empate e ele votou
    if (isEmpate && votoPresidente) {
      if (votoPresidente === 'SIM') totalSim++
      else if (votoPresidente === 'NAO') totalNao++
    }

    return {
      votosAFavor: totalSim,
      votosContra: totalNao,
      votosAbstencao: contagem.abstencao + (votoPresidente === 'ABSTENCAO' ? 1 : 0),
      aprovado: totalSim > totalNao
    }
  }, [contagem, isEmpate, votoPresidente])

  // Todos votaram?
  const membrosPresentes = membros.filter(m => m.presente)
  const membrosQueDevemVotar = isEmpate
    ? membrosPresentes
    : membrosPresentes.filter(m => m.cargo !== 'PRESIDENTE')
  const todosVotaram = membrosQueDevemVotar.every(m => votos[m.parlamentarId] !== null && votos[m.parlamentarId] !== undefined)

  function registrarVoto(parlamentarId: string, voto: Voto) {
    if (disabled) return

    // Verificar se e o presidente e se pode votar
    if (presidente && parlamentarId === presidente.parlamentarId && !presidentePodeVotar) {
      return
    }

    setVotos(prev => ({
      ...prev,
      [parlamentarId]: prev[parlamentarId] === voto ? null : voto
    }))
  }

  function finalizarVotacao() {
    if (onVotacaoFinalizada) {
      onVotacaoFinalizada({
        ...resultado,
        votos
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Votacao</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <ThumbsUp className="h-3 w-3 mr-1" />
              {resultado.votosAFavor}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              <ThumbsDown className="h-3 w-3 mr-1" />
              {resultado.votosContra}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              <Minus className="h-3 w-3 mr-1" />
              {resultado.votosAbstencao}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          {isEmpate && !votoPresidente && presidente?.presente
            ? 'Empate! Presidente pode exercer voto de desempate.'
            : resultado.aprovado
              ? 'Resultado parcial: APROVADO'
              : 'Resultado parcial: REJEITADO'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Cabecalho */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-sm font-medium text-gray-500 pb-2 border-b">
            <span>Membro</span>
            <span className="text-center text-green-600">SIM</span>
            <span className="text-center text-red-600">NAO</span>
            <span className="text-center text-gray-600">ABS</span>
          </div>

          {/* Presidente (se existir) */}
          {presidente && (
            <div
              className={cn(
                'grid grid-cols-[1fr_80px_80px_80px] gap-2 p-2 rounded-lg',
                presidente.presente
                  ? presidentePodeVotar
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50'
                  : 'bg-gray-100 opacity-50'
              )}
            >
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{presidente.nome}</span>
                {!presidente.presente && (
                  <Badge variant="outline" className="text-xs">Ausente</Badge>
                )}
                {presidente.presente && !presidentePodeVotar && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    Vota em empate
                  </Badge>
                )}
                {isEmpate && presidente.presente && (
                  <Badge className="text-xs bg-yellow-100 text-yellow-700">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Desempate
                  </Badge>
                )}
              </div>
              {[
                { voto: 'SIM' as Voto, icon: ThumbsUp, activeClass: 'bg-green-500 text-white', hoverClass: 'hover:bg-green-100' },
                { voto: 'NAO' as Voto, icon: ThumbsDown, activeClass: 'bg-red-500 text-white', hoverClass: 'hover:bg-red-100' },
                { voto: 'ABSTENCAO' as Voto, icon: Minus, activeClass: 'bg-gray-500 text-white', hoverClass: 'hover:bg-gray-100' }
              ].map(({ voto, icon: Icon, activeClass, hoverClass }) => (
                <button
                  key={voto}
                  onClick={() => registrarVoto(presidente.parlamentarId, voto)}
                  disabled={disabled || !presidente.presente || !presidentePodeVotar}
                  className={cn(
                    'flex items-center justify-center h-8 rounded transition-colors',
                    votos[presidente.parlamentarId] === voto
                      ? activeClass
                      : presidente.presente && presidentePodeVotar && !disabled
                        ? `bg-white border ${hoverClass}`
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}

          {/* Demais membros */}
          {demaisMembros.map(membro => (
            <div
              key={membro.parlamentarId}
              className={cn(
                'grid grid-cols-[1fr_80px_80px_80px] gap-2 p-2 rounded-lg',
                membro.presente ? 'bg-white' : 'bg-gray-100 opacity-50'
              )}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{membro.nome}</span>
                {membro.cargo === 'VICE_PRESIDENTE' && (
                  <Badge variant="outline" className="text-xs">Vice</Badge>
                )}
                {membro.cargo === 'RELATOR' && (
                  <Badge variant="outline" className="text-xs">Relator</Badge>
                )}
                {!membro.presente && (
                  <Badge variant="outline" className="text-xs">Ausente</Badge>
                )}
              </div>
              {[
                { voto: 'SIM' as Voto, icon: ThumbsUp, activeClass: 'bg-green-500 text-white', hoverClass: 'hover:bg-green-100' },
                { voto: 'NAO' as Voto, icon: ThumbsDown, activeClass: 'bg-red-500 text-white', hoverClass: 'hover:bg-red-100' },
                { voto: 'ABSTENCAO' as Voto, icon: Minus, activeClass: 'bg-gray-500 text-white', hoverClass: 'hover:bg-gray-100' }
              ].map(({ voto, icon: Icon, activeClass, hoverClass }) => (
                <button
                  key={voto}
                  onClick={() => registrarVoto(membro.parlamentarId, voto)}
                  disabled={disabled || !membro.presente}
                  className={cn(
                    'flex items-center justify-center h-8 rounded transition-colors',
                    votos[membro.parlamentarId] === voto
                      ? activeClass
                      : membro.presente && !disabled
                        ? `bg-white border ${hoverClass}`
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Resultado e acao */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">
                Resultado: {' '}
                <span className={resultado.aprovado ? 'text-green-600' : 'text-red-600'}>
                  {resultado.aprovado ? 'APROVADO' : 'REJEITADO'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                {resultado.votosAFavor} a favor, {resultado.votosContra} contra, {resultado.votosAbstencao} abstencao(oes)
              </p>
            </div>
            <Button
              onClick={finalizarVotacao}
              disabled={disabled || !todosVotaram}
            >
              <Check className="h-4 w-4 mr-2" />
              Registrar Votacao
            </Button>
          </div>
          {!todosVotaram && (
            <p className="text-sm text-yellow-600 mt-2">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Aguardando voto de todos os membros presentes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
