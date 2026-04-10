'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Users, UserCheck, UserX, Loader2, FileText, Clock, AlertCircle } from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { toast } from 'sonner'

type StatusPresenca = 'PRESENTE' | 'AUSENTE' | 'FALTA_JUSTIFICADA'

interface Presenca {
  id: string
  parlamentarId: string
  presente: boolean
  justificativa: string | null
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
    partido: string | null
  }
}

interface PresencaControlProps {
  sessaoId: string
  sessaoStatus?: 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'
  sessaoData?: string
  sessaoHorario?: string
}

export function PresencaControl({ sessaoId, sessaoStatus, sessaoData, sessaoHorario }: PresencaControlProps) {
  // Busca todos os parlamentares ativos da casa para registro de presença
  const { parlamentares } = useParlamentares({ ativo: true })
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Estado para modal de falta justificada
  const [modalJustificativa, setModalJustificativa] = useState<{
    open: boolean
    parlamentarId: string
    parlamentarNome: string
  }>({ open: false, parlamentarId: '', parlamentarNome: '' })
  const [justificativaTexto, setJustificativaTexto] = useState('')

  // Calcular se estamos dentro do periodo de 15 minutos antes da sessao
  const calcularPeriodoPresenca = useCallback(() => {
    if (!sessaoData || !sessaoHorario) return { permitido: true, mensagem: '' }

    try {
      const dataHoraSessao = new Date(`${sessaoData}T${sessaoHorario}:00`)
      const agora = new Date()
      const quinzeMinutosAntes = new Date(dataHoraSessao.getTime() - 15 * 60 * 1000)

      if (sessaoStatus === 'AGENDADA') {
        if (agora < quinzeMinutosAntes) {
          const minutosRestantes = Math.ceil((quinzeMinutosAntes.getTime() - agora.getTime()) / (60 * 1000))
          const horasRestantes = Math.floor(minutosRestantes / 60)
          const mins = minutosRestantes % 60

          return {
            permitido: true, // Ainda permite, mas mostra aviso
            mensagem: horasRestantes > 0
              ? `Lancamento de presenca disponivel em ${horasRestantes}h ${mins}min`
              : `Lancamento de presenca disponivel em ${mins} minutos`
          }
        }
        return { permitido: true, mensagem: 'Presenca pode ser registrada (15 min antes da sessao)' }
      }

      return { permitido: true, mensagem: '' }
    } catch {
      return { permitido: true, mensagem: '' }
    }
  }, [sessaoData, sessaoHorario, sessaoStatus])

  const periodoPresenca = calcularPeriodoPresenca()

  const carregarPresencas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca`)
      if (response.ok) {
        const { data } = await response.json()
        setPresencas(data)
      }
    } catch (error) {
      console.error('Erro ao carregar presenças:', error)
    } finally {
      setLoading(false)
    }
  }, [sessaoId])

  useEffect(() => {
    carregarPresencas()
  }, [carregarPresencas])

  const registrarPresenca = async (
    parlamentarId: string,
    presente: boolean,
    justificativa?: string
  ) => {
    try {
      setUpdating(parlamentarId)

      // Atualização otimista: atualizar UI imediatamente
      setPresencas(prev => {
        const existente = prev.find(p => p.parlamentarId === parlamentarId)
        if (existente) {
          return prev.map(p => p.parlamentarId === parlamentarId
            ? { ...p, presente, justificativa: justificativa || null }
            : p
          )
        }
        // Criar registro virtual se não existia
        const parl = parlamentares.find(p => p.id === parlamentarId)
        return [...prev, {
          id: `temp-${parlamentarId}`,
          parlamentarId,
          presente,
          justificativa: justificativa || null,
          parlamentar: { id: parlamentarId, nome: parl?.nome || '', apelido: parl?.apelido || null, partido: parl?.partido || null }
        }]
      })

      const response = await fetch(`/api/sessoes/${sessaoId}/presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parlamentarId,
          presente,
          justificativa: justificativa || null
        })
      })

      if (!response.ok) {
        // Reverter otimismo se falhou
        await carregarPresencas()
        const error = await response.json()
        toast.error(error.message || 'Erro ao atualizar presença')
      }
    } catch (error) {
      await carregarPresencas()
      toast.error('Erro ao atualizar presença')
    } finally {
      setUpdating(null)
    }
  }

  // Marcar todos como presentes de uma vez
  const marcarTodosPresentes = async () => {
    const ausentes = parlamentares.filter(p => {
      const presenca = presencas.find(pr => pr.parlamentarId === p.id)
      return !presenca?.presente
    })
    if (ausentes.length === 0) {
      toast.info('Todos ja estao marcados como presentes')
      return
    }

    // Atualização otimista: marcar todos na UI
    setPresencas(prev => {
      const map = new Map(prev.map(p => [p.parlamentarId, p]))
      parlamentares.forEach(p => {
        const existente = map.get(p.id)
        if (existente) {
          map.set(p.id, { ...existente, presente: true })
        } else {
          map.set(p.id, {
            id: `temp-${p.id}`,
            parlamentarId: p.id,
            presente: true,
            justificativa: null,
            parlamentar: { id: p.id, nome: p.nome, apelido: p.apelido || null, partido: p.partido || null }
          })
        }
      })
      return Array.from(map.values())
    })

    // Enviar todos em paralelo (batch)
    try {
      await Promise.all(
        ausentes.map(p =>
          fetch(`/api/sessoes/${sessaoId}/presenca`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parlamentarId: p.id, presente: true })
          })
        )
      )
      toast.success(`${ausentes.length} presenca(s) registrada(s)`)
    } catch {
      await carregarPresencas()
      toast.error('Erro ao registrar presenças em lote')
    }
  }

  // Marcar todos como ausentes
  const marcarTodosAusentes = async () => {
    const presentesList = parlamentares.filter(p => {
      const presenca = presencas.find(pr => pr.parlamentarId === p.id)
      return presenca?.presente
    })
    if (presentesList.length === 0) return

    setPresencas(prev => prev.map(p => ({ ...p, presente: false })))

    try {
      await Promise.all(
        presentesList.map(p =>
          fetch(`/api/sessoes/${sessaoId}/presenca`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parlamentarId: p.id, presente: false })
          })
        )
      )
      toast.success('Todas as presencas removidas')
    } catch {
      await carregarPresencas()
      toast.error('Erro ao atualizar presenças')
    }
  }

  const abrirModalJustificativa = (parlamentarId: string, parlamentarNome: string) => {
    setModalJustificativa({ open: true, parlamentarId, parlamentarNome })
    setJustificativaTexto('')
  }

  const confirmarFaltaJustificada = async () => {
    if (!justificativaTexto.trim()) {
      toast.error('Informe o motivo da justificativa')
      return
    }

    await registrarPresenca(
      modalJustificativa.parlamentarId,
      false,
      justificativaTexto.trim()
    )

    setModalJustificativa({ open: false, parlamentarId: '', parlamentarNome: '' })
    setJustificativaTexto('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  // Combinar parlamentares com presenças
  const parlamentaresComPresenca = parlamentares.map(parlamentar => {
    const presenca = presencas.find(p => p.parlamentarId === parlamentar.id)

    // Determinar status
    let status: StatusPresenca = 'AUSENTE'
    if (presenca?.presente) {
      status = 'PRESENTE'
    } else if (presenca?.justificativa) {
      status = 'FALTA_JUSTIFICADA'
    }

    return {
      ...parlamentar,
      presente: presenca?.presente || false,
      justificativa: presenca?.justificativa || null,
      status,
      presencaId: presenca?.id
    }
  })

  const presentes = parlamentaresComPresenca.filter(p => p.status === 'PRESENTE').length
  const faltasJustificadas = parlamentaresComPresenca.filter(p => p.status === 'FALTA_JUSTIFICADA').length
  const ausentes = parlamentaresComPresenca.filter(p => p.status === 'AUSENTE').length
  const total = parlamentaresComPresenca.length

  const getStatusStyle = (status: StatusPresenca) => {
    switch (status) {
      case 'PRESENTE':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'bg-green-500',
          IconComponent: UserCheck
        }
      case 'FALTA_JUSTIFICADA':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'bg-yellow-500',
          IconComponent: FileText
        }
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          icon: 'bg-gray-400',
          IconComponent: UserX
        }
    }
  }

  return (
    <div className="space-y-4">
      {/* Indicador de periodo de presenca - 15 minutos antes */}
      {sessaoStatus === 'AGENDADA' && periodoPresenca.mensagem && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              {periodoPresenca.mensagem}
            </p>
          </div>
        </div>
      )}

      {/* Alerta de modo edição para sessões concluídas */}
      {sessaoStatus === 'CONCLUIDA' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-700 text-center">
            Modo de edicao de dados preteritos - As presencas serao registradas para esta sessao ja concluida
          </p>
        </div>
      )}

      {/* Indicador de sessao suspensa */}
      {sessaoStatus === 'SUSPENSA' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-700">
              Sessao suspensa - Presencas podem ser ajustadas
            </p>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{total}</div>
          <div className="text-sm text-blue-700">Total</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">{presentes}</div>
          <div className="text-sm text-green-700">Presentes</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">{faltasJustificadas}</div>
          <div className="text-sm text-yellow-700">Justificadas</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-600">{ausentes}</div>
          <div className="text-sm text-red-700">Ausentes</div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={marcarTodosPresentes}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={updating !== null}
        >
          <UserCheck className="h-4 w-4 mr-1.5" />
          Todos Presentes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={marcarTodosAusentes}
          disabled={updating !== null}
        >
          <UserX className="h-4 w-4 mr-1.5" />
          Limpar Todos
        </Button>
        <span className="text-xs text-gray-400 ml-auto">
          Clique no vereador para alterar individualmente
        </span>
      </div>

      {/* Lista de Parlamentares */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {parlamentaresComPresenca.map((parlamentar) => {
          const style = getStatusStyle(parlamentar.status)
          const IconComponent = style.IconComponent

          return (
            <div
              key={parlamentar.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${style.bg}`}
            >
              <div className="flex items-center gap-3">
                {parlamentar.foto ? (
                  <Image
                    src={parlamentar.foto}
                    alt={`Foto de ${parlamentar.apelido || parlamentar.nome}`}
                    width={40}
                    height={40}
                    className={`w-10 h-10 rounded-full object-cover ring-2 ${
                      parlamentar.status === 'PRESENTE' ? 'ring-green-400' :
                      parlamentar.status === 'FALTA_JUSTIFICADA' ? 'ring-yellow-400' : 'ring-gray-300'
                    }`}
                    unoptimized
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${style.icon}`}
                  >
                    {(parlamentar.apelido || parlamentar.nome).split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{parlamentar.apelido || parlamentar.nome}</p>
                  <div className="flex items-center gap-2">
                    {parlamentar.partido && (
                      <span className="text-sm text-gray-600">{parlamentar.partido}</span>
                    )}
                    {parlamentar.justificativa && (
                      <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300 text-yellow-700">
                        {parlamentar.justificativa}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {updating === parlamentar.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {/* Botão Presente */}
                    <Button
                      onClick={() => registrarPresenca(parlamentar.id, true)}
                      disabled={updating !== null}
                      variant={parlamentar.status === 'PRESENTE' ? 'default' : 'outline'}
                      size="sm"
                      className={
                        parlamentar.status === 'PRESENTE'
                          ? 'bg-green-600 hover:bg-green-700'
                          : ''
                      }
                      title="Marcar como presente"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>

                    {/* Botão Falta Justificada */}
                    <Button
                      onClick={() => abrirModalJustificativa(parlamentar.id, parlamentar.nome)}
                      disabled={updating !== null}
                      variant={parlamentar.status === 'FALTA_JUSTIFICADA' ? 'default' : 'outline'}
                      size="sm"
                      className={
                        parlamentar.status === 'FALTA_JUSTIFICADA'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : ''
                      }
                      title="Registrar falta justificada"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>

                    {/* Botão Ausente */}
                    <Button
                      onClick={() => registrarPresenca(parlamentar.id, false)}
                      disabled={updating !== null}
                      variant={parlamentar.status === 'AUSENTE' ? 'default' : 'outline'}
                      size="sm"
                      className={
                        parlamentar.status === 'AUSENTE'
                          ? 'bg-red-600 hover:bg-red-700'
                          : ''
                      }
                      title="Marcar como ausente"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Falta Justificada */}
      <Dialog
        open={modalJustificativa.open}
        onOpenChange={(open) => {
          if (!open) {
            setModalJustificativa({ open: false, parlamentarId: '', parlamentarNome: '' })
            setJustificativaTexto('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Falta Justificada</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Parlamentar: <strong>{modalJustificativa.parlamentarNome}</strong>
            </p>
            <label htmlFor="justificativa" className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da justificativa:
            </label>
            <Input
              id="justificativa"
              value={justificativaTexto}
              onChange={(e) => setJustificativaTexto(e.target.value)}
              placeholder="Ex: Atestado médico, compromisso oficial..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalJustificativa({ open: false, parlamentarId: '', parlamentarNome: '' })
                setJustificativaTexto('')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarFaltaJustificada}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Confirmar Falta Justificada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
