'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Users, UserCheck, UserX, Loader2, FileText } from 'lucide-react'
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
  sessaoStatus?: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
}

export function PresencaControl({ sessaoId, sessaoStatus }: PresencaControlProps) {
  const { parlamentares } = useParlamentares()
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
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parlamentarId,
          presente,
          justificativa: justificativa || null
        })
      })

      if (response.ok) {
        if (justificativa) {
          toast.success('Falta justificada registrada com sucesso!')
        } else if (presente) {
          toast.success('Presença registrada com sucesso!')
        } else {
          toast.success('Ausência registrada com sucesso!')
        }
        carregarPresencas()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao atualizar presença')
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error)
      toast.error('Erro ao atualizar presença')
    } finally {
      setUpdating(null)
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
      {/* Alerta de modo edição para sessões concluídas */}
      {sessaoStatus === 'CONCLUIDA' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-700 text-center">
            Modo de edição de dados pretéritos - As presenças serão registradas para esta sessão já concluída
          </p>
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
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${style.icon}`}
                >
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{parlamentar.nome}</p>
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
