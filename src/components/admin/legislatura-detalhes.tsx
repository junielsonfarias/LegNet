'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Briefcase, Loader2 } from 'lucide-react'
import { usePeriodosLegislatura } from '@/lib/hooks/use-periodos-legislatura'
import { useCargosMesaDiretora } from '@/lib/hooks/use-cargos-mesa-diretora'
import { useMesaDiretora } from '@/lib/hooks/use-mesa-diretora'

interface LegislaturaDetalhesProps {
  legislaturaId: string
}

export function LegislaturaDetalhes({ legislaturaId }: LegislaturaDetalhesProps) {
  const { periodos, loading: loadingPeriodos } = usePeriodosLegislatura(legislaturaId)
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<string | null>(null)
  const { cargos, loading: loadingCargos } = useCargosMesaDiretora(selectedPeriodoId || undefined)
  const { mesas, loading: loadingMesas } = useMesaDiretora({ legislaturaId })

  useEffect(() => {
    if (periodos.length > 0 && !selectedPeriodoId) {
      setSelectedPeriodoId(periodos[0].id)
    }
  }, [periodos, selectedPeriodoId])

  if (loadingPeriodos) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (periodos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>Nenhum período cadastrado para esta legislatura</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Períodos</p>
                <p className="text-xl font-bold">{periodos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Cargos Configurados</p>
                <p className="text-xl font-bold">
                  {periodos.reduce((acc, p) => acc + (p.cargos?.length || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Mesas Diretora</p>
                <p className="text-xl font-bold">{mesas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {periodos.map(periodo => (
          <Card key={periodo.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Período {periodo.numero}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Início:</span>{' '}
                      {new Date(periodo.dataInicio).toLocaleDateString('pt-BR')}
                    </p>
                    {periodo.dataFim && (
                      <p>
                        <span className="font-medium">Fim:</span>{' '}
                        {new Date(periodo.dataFim).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {periodo.descricao && (
                      <p>
                        <span className="font-medium">Descrição:</span> {periodo.descricao}
                      </p>
                    )}
                  </div>
                  
                  {periodo.cargos && periodo.cargos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Cargos:</p>
                      <div className="flex flex-wrap gap-2">
                        {periodo.cargos.map(cargo => (
                          <Badge
                            key={cargo.id}
                            variant={cargo.obrigatorio ? 'default' : 'outline'}
                            className={cargo.obrigatorio ? 'bg-blue-100 text-blue-800' : ''}
                          >
                            {cargo.nome} {cargo.obrigatorio && '(Obrigatório)'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

