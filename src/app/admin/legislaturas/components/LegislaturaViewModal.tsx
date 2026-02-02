'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Edit, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Legislatura } from '../types'
import { formatDateUTC, formatDateUTCLong } from '../types'

interface LegislaturaViewModalProps {
  legislatura: Legislatura | null
  onClose: () => void
  onEdit: (legislatura: Legislatura) => void
}

function StatusBadge({ ativa }: { ativa: boolean }) {
  return ativa ? (
    <Badge className="bg-green-100 text-green-800">
      <CheckCircle className="h-3 w-3 mr-1" />
      Ativa
    </Badge>
  ) : (
    <Badge variant="secondary">
      <XCircle className="h-3 w-3 mr-1" />
      Inativa
    </Badge>
  )
}

export function LegislaturaViewModal({ legislatura, onClose, onEdit }: LegislaturaViewModalProps) {
  if (!legislatura) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {legislatura.numero}a Legislatura
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Periodo: {legislatura.anoInicio} - {legislatura.anoFim}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge ativa={legislatura.ativa} />
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informacoes Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Numero</p>
              <p className="text-xl font-bold">{legislatura.numero}a</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Ano Inicio</p>
              <p className="text-xl font-bold">{legislatura.anoInicio}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Ano Fim</p>
              <p className="text-xl font-bold">{legislatura.anoFim}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Duracao</p>
              <p className="text-xl font-bold">{legislatura.anoFim - legislatura.anoInicio + 1} anos</p>
            </div>
          </div>

          {/* Datas Completas */}
          {(legislatura.dataInicio || legislatura.dataFim) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Data de Inicio</p>
                <p className="text-lg font-bold text-blue-800">
                  {legislatura.dataInicio
                    ? formatDateUTCLong(legislatura.dataInicio)
                    : 'Nao informada'}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Data de Fim</p>
                <p className="text-lg font-bold text-blue-800">
                  {legislatura.dataFim
                    ? formatDateUTCLong(legislatura.dataFim)
                    : 'Em andamento'}
                </p>
              </div>
            </div>
          )}

          {/* Descricao */}
          {legislatura.descricao && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium mb-1">Descricao</p>
              <p className="text-gray-700">{legislatura.descricao}</p>
            </div>
          )}

          {/* Periodos */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Periodos da Mesa Diretora
            </h3>
            {legislatura.periodos && legislatura.periodos.length > 0 ? (
              <div className="space-y-4">
                {legislatura.periodos.map((periodo: any) => (
                  <Card key={periodo.id} className="border-l-4 border-l-camara-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Periodo {periodo.numero}
                        {periodo.descricao && ` - ${periodo.descricao}`}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {formatDateUTC(periodo.dataInicio)}
                        {periodo.dataFim ? ` ate ${formatDateUTC(periodo.dataFim)}` : ' - Em andamento'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {periodo.cargos && periodo.cargos.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">Cargos da Mesa:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {periodo.cargos
                              .sort((a: any, b: any) => a.ordem - b.ordem)
                              .map((cargo: any) => (
                                <div key={cargo.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <span className="w-6 h-6 bg-camara-primary text-white rounded-full flex items-center justify-center text-xs">
                                    {cargo.ordem}
                                  </span>
                                  <span className="font-medium">{cargo.nome}</span>
                                  {cargo.obrigatorio && (
                                    <Badge variant="outline" className="text-xs">Obrigatorio</Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhum cargo configurado para este periodo.</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-lg text-center">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum periodo cadastrado para esta legislatura.</p>
              </div>
            )}
          </div>

          {/* Botoes de Acao */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                onEdit(legislatura)
                onClose()
              }}
              className="bg-camara-primary hover:bg-camara-primary/90"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Legislatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
