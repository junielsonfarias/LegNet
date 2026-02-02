'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpDown
} from 'lucide-react'
import type { Legislatura } from '../types'
import { formatDateUTC } from '../types'

interface LegislaturasTableProps {
  legislaturas: Legislatura[]
  loading: boolean
  loadingDetalhes: boolean
  searchTerm: string
  onView: (legislatura: Legislatura) => void
  onEdit: (legislatura: Legislatura) => void
  onDelete: (id: string) => void
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

export function LegislaturasTable({
  legislaturas,
  loading,
  loadingDetalhes,
  searchTerm,
  onView,
  onEdit,
  onDelete
}: LegislaturasTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Lista de Legislaturas
          <Badge variant="secondary" className="ml-2">{legislaturas.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
            <span className="ml-2 text-gray-600">Carregando legislaturas...</span>
          </div>
        ) : legislaturas.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma legislatura encontrada</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando a primeira legislatura.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Legislatura
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Periodo</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Descricao</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right p-4 font-semibold text-gray-700">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {legislaturas.map((legislatura, index) => (
                  <tr
                    key={legislatura.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-camara-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-camara-primary font-bold">{legislatura.numero}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{legislatura.numero}a Legislatura</p>
                          <p className="text-sm text-gray-500">ID: {legislatura.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{legislatura.anoInicio} - {legislatura.anoFim}</span>
                      </div>
                      {(legislatura.dataInicio || legislatura.dataFim) && (
                        <p className="text-xs text-blue-600 mt-1">
                          {legislatura.dataInicio ? formatDateUTC(legislatura.dataInicio) : '?'}
                          {' → '}
                          {legislatura.dataFim ? formatDateUTC(legislatura.dataFim) : 'Em andamento'}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {legislatura.anoFim - legislatura.anoInicio + 1} anos de duracao
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-700 max-w-xs truncate">
                        {legislatura.descricao || <span className="text-gray-400 italic">Sem descricao</span>}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge ativa={legislatura.ativa} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(legislatura)}
                          disabled={loadingDetalhes}
                          title="Ver detalhes"
                        >
                          {loadingDetalhes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(legislatura)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(legislatura.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
