"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Vote,
  ArrowRight,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface TurnoInfo {
  itemId: string
  turnoAtual: number
  turnoFinal: number
  resultadoTurno1: string | null
  resultadoTurno2: string | null
  dataVotacaoTurno1: string | null
  dataVotacaoTurno2: string | null
  intersticio: boolean
  prazoIntersticio: string | null
  podeSegundoTurno: boolean
  motivoSegundoTurno: string
  configuracao: {
    totalTurnos: number
    intersticioDias: number
    tipoQuorum: string
    descricao: string
  }
}

interface TurnoControlProps {
  sessaoId: string
  itemId: string
  titulo: string
  tipoProposicao: string
  onTurnoIniciado?: () => void
  onTurnoFinalizado?: () => void
}

export function TurnoControl({
  sessaoId,
  itemId,
  titulo,
  tipoProposicao,
  onTurnoIniciado,
  onTurnoFinalizado
}: TurnoControlProps) {
  const [turnoInfo, setTurnoInfo] = useState<TurnoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)

  const carregarTurnoInfo = async () => {
    try {
      const response = await fetch(
        `/api/sessoes/${sessaoId}/votacao/turno?itemId=${itemId}`
      )
      const data = await response.json()
      if (data.success) {
        setTurnoInfo(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar informações de turno:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarTurnoInfo()
  }, [sessaoId, itemId])

  const iniciarTurno = async (turno: number) => {
    try {
      setExecutando(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/votacao/turno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, turno })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.data.mensagem || `${turno}º turno iniciado`)
        await carregarTurnoInfo()
        onTurnoIniciado?.()
      } else {
        toast.error(data.error || 'Erro ao iniciar turno')
      }
    } catch (error) {
      console.error('Erro ao iniciar turno:', error)
      toast.error('Erro ao iniciar turno')
    } finally {
      setExecutando(false)
    }
  }

  const finalizarTurno = async (turno: number, resultado?: string) => {
    try {
      setExecutando(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/votacao/turno`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, turno, resultado })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.data.mensagem || `${turno}º turno finalizado`)
        await carregarTurnoInfo()
        onTurnoFinalizado?.()
      } else {
        toast.error(data.error || 'Erro ao finalizar turno')
      }
    } catch (error) {
      console.error('Erro ao finalizar turno:', error)
      toast.error('Erro ao finalizar turno')
    } finally {
      setExecutando(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Carregando informações de turno...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!turnoInfo) {
    return null
  }

  const requerDoisTurnos = turnoInfo.configuracao.totalTurnos === 2
  const progressoTurnos = turnoInfo.turnoFinal > 0
    ? ((turnoInfo.resultadoTurno1 ? 1 : 0) + (turnoInfo.resultadoTurno2 ? 1 : 0)) / turnoInfo.turnoFinal * 100
    : 0

  const calcularTempoRestante = () => {
    if (!turnoInfo.prazoIntersticio) return null
    const prazo = new Date(turnoInfo.prazoIntersticio)
    const agora = new Date()
    const diff = prazo.getTime() - agora.getTime()
    if (diff <= 0) return 'Cumprido'
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${horas}h ${minutos}min restantes`
  }

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
          <Vote className="h-5 w-5" />
          Controle de Turnos - {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informação do tipo de matéria */}
        <div className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm">
          <Info className="mt-0.5 h-4 w-4 text-blue-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">
              {turnoInfo.configuracao.descricao}
            </p>
            <p className="text-gray-500">
              Quórum: {turnoInfo.configuracao.tipoQuorum.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Progresso de turnos */}
        {requerDoisTurnos && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progresso dos turnos</span>
              <span className="font-medium">
                {turnoInfo.resultadoTurno1 ? 1 : 0} de {turnoInfo.turnoFinal} turno(s)
              </span>
            </div>
            <Progress value={progressoTurnos} className="h-2" />
          </div>
        )}

        {/* Status dos turnos */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* 1º Turno */}
          <div className={`rounded-lg border p-3 ${
            turnoInfo.resultadoTurno1 === 'APROVADA'
              ? 'border-green-200 bg-green-50'
              : turnoInfo.resultadoTurno1 === 'REJEITADA'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">1º Turno</span>
              {turnoInfo.resultadoTurno1 ? (
                <Badge className={
                  turnoInfo.resultadoTurno1 === 'APROVADA'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }>
                  {turnoInfo.resultadoTurno1}
                </Badge>
              ) : (
                <Badge variant="outline">Pendente</Badge>
              )}
            </div>
            {turnoInfo.dataVotacaoTurno1 && (
              <p className="mt-1 text-xs text-gray-500">
                Votado em: {new Date(turnoInfo.dataVotacaoTurno1).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          {/* 2º Turno (se aplicável) */}
          {requerDoisTurnos && (
            <div className={`rounded-lg border p-3 ${
              turnoInfo.resultadoTurno2 === 'APROVADA'
                ? 'border-green-200 bg-green-50'
                : turnoInfo.resultadoTurno2 === 'REJEITADA'
                  ? 'border-red-200 bg-red-50'
                  : turnoInfo.intersticio
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">2º Turno</span>
                {turnoInfo.resultadoTurno2 ? (
                  <Badge className={
                    turnoInfo.resultadoTurno2 === 'APROVADA'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }>
                    {turnoInfo.resultadoTurno2}
                  </Badge>
                ) : turnoInfo.intersticio ? (
                  <Badge className="bg-yellow-100 text-yellow-700">Aguardando</Badge>
                ) : (
                  <Badge variant="outline">Pendente</Badge>
                )}
              </div>
              {turnoInfo.dataVotacaoTurno2 && (
                <p className="mt-1 text-xs text-gray-500">
                  Votado em: {new Date(turnoInfo.dataVotacaoTurno2).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Interstício */}
        {turnoInfo.intersticio && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Interstício em andamento</p>
              <p className="text-sm text-yellow-700">
                Prazo: {turnoInfo.prazoIntersticio
                  ? new Date(turnoInfo.prazoIntersticio).toLocaleString('pt-BR')
                  : 'Não definido'
                }
              </p>
              <p className="text-xs text-yellow-600">
                {calcularTempoRestante()}
              </p>
            </div>
            {turnoInfo.podeSegundoTurno && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pt-2">
          {/* Botão para iniciar 1º turno */}
          {!turnoInfo.resultadoTurno1 && turnoInfo.turnoAtual === 1 && (
            <Button
              onClick={() => iniciarTurno(1)}
              disabled={executando}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Vote className="mr-2 h-4 w-4" />
              Iniciar 1º Turno
            </Button>
          )}

          {/* Botão para iniciar 2º turno */}
          {turnoInfo.intersticio && turnoInfo.podeSegundoTurno && (
            <Button
              onClick={() => iniciarTurno(2)}
              disabled={executando}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Iniciar 2º Turno
            </Button>
          )}

          {/* Mensagem se não pode iniciar 2º turno */}
          {turnoInfo.intersticio && !turnoInfo.podeSegundoTurno && (
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              {turnoInfo.motivoSegundoTurno}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
