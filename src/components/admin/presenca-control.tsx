'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, Loader2 } from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { toast } from 'sonner'

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
}

export function PresencaControl({ sessaoId }: PresencaControlProps) {
  const { parlamentares } = useParlamentares()
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

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

  const togglePresenca = async (parlamentarId: string, presente: boolean) => {
    try {
      setUpdating(parlamentarId)
      const response = await fetch(`/api/sessoes/${sessaoId}/presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parlamentarId,
          presente: !presente
        })
      })

      if (response.ok) {
        toast.success(`Presença ${!presente ? 'registrada' : 'removida'} com sucesso!`)
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
    return {
      ...parlamentar,
      presente: presenca?.presente || false,
      presencaId: presenca?.id
    }
  })

  const presentes = parlamentaresComPresenca.filter(p => p.presente).length
  const total = parlamentaresComPresenca.length

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{total}</div>
          <div className="text-sm text-blue-700">Total</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">{presentes}</div>
          <div className="text-sm text-green-700">Presentes</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-600">{total - presentes}</div>
          <div className="text-sm text-red-700">Ausentes</div>
        </div>
      </div>

      {/* Lista de Parlamentares */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {parlamentaresComPresenca.map((parlamentar) => (
          <div
            key={parlamentar.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              parlamentar.presente
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  parlamentar.presente ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                {parlamentar.presente ? (
                  <UserCheck className="h-5 w-5 text-white" />
                ) : (
                  <UserX className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-semibold">{parlamentar.nome}</p>
                {parlamentar.partido && (
                  <p className="text-sm text-gray-600">{parlamentar.partido}</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => togglePresenca(parlamentar.id, parlamentar.presente)}
              disabled={updating === parlamentar.id}
              variant={parlamentar.presente ? 'outline' : 'default'}
              size="sm"
              className={parlamentar.presente ? 'border-green-500 text-green-700' : ''}
            >
              {updating === parlamentar.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : parlamentar.presente ? (
                <>
                  <UserX className="h-4 w-4 mr-1" />
                  Marcar Ausente
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Marcar Presente
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

