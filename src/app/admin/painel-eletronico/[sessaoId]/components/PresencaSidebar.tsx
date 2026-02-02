'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle, AlertCircle } from 'lucide-react'
import { PresencaControl } from '@/components/admin/presenca-control'

interface Presenca {
  id: string
  presente: boolean
  justificativa?: string | null
  parlamentar: {
    id: string
    nome: string
    apelido?: string | null
    partido?: string | null
  }
}

interface PresencaSidebarProps {
  sessaoId: string
  sessaoStatus: string
  presencas?: Presenca[]
  presentes: number
  ausentes: number
  totalParlamentares: number
}

export function PresencaSidebar({
  sessaoId,
  sessaoStatus,
  presencas,
  presentes,
  ausentes,
  totalParlamentares
}: PresencaSidebarProps) {
  return (
    <Card className="border-slate-700 bg-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-blue-400" />
          Presenca dos Parlamentares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Boxes */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-blue-600 p-3 text-center">
            <p className="text-2xl font-bold text-white">{presentes}</p>
            <p className="text-xs text-blue-100">Presentes</p>
          </div>
          <div className="rounded-lg bg-red-600 p-3 text-center">
            <p className="text-2xl font-bold text-white">{ausentes}</p>
            <p className="text-xs text-red-100">Ausentes</p>
          </div>
          <div className="rounded-lg bg-slate-600 p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {totalParlamentares > 0 ? Math.round((presentes / totalParlamentares) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-300">Presenca</p>
          </div>
        </div>

        {/* Barra de Quorum */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Quorum: {presentes}/{totalParlamentares} parlamentares</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-700">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${totalParlamentares > 0 ? (presentes / totalParlamentares) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Lista de Parlamentares */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {/* Presentes */}
          {presencas && presencas.filter(p => p.presente).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Presentes ({presencas.filter(p => p.presente).length})
              </h4>
              <div className="space-y-1">
                {presencas.filter(p => p.presente).map(presenca => (
                  <div
                    key={presenca.id}
                    className="flex items-center gap-2 rounded-md bg-slate-700/50 px-3 py-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                      </p>
                      {presenca.parlamentar.partido && (
                        <p className="text-xs text-slate-400">{presenca.parlamentar.partido}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ausentes */}
          {presencas && presencas.filter(p => !p.presente).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Ausentes ({presencas.filter(p => !p.presente).length})
              </h4>
              <div className="space-y-1">
                {presencas.filter(p => !p.presente).map(presenca => (
                  <div
                    key={presenca.id}
                    className="flex items-center gap-2 rounded-md bg-slate-700/50 px-3 py-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-300 truncate">
                        {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                      </p>
                      {presenca.parlamentar.partido && (
                        <p className="text-xs text-slate-500">{presenca.parlamentar.partido}</p>
                      )}
                      {presenca.justificativa && (
                        <p className="text-xs text-yellow-500 italic">
                          {presenca.justificativa}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!presencas || presencas.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-4">
              Nenhum parlamentar registrado
            </p>
          )}
        </div>

        {/* Componente de Controle de Presenca */}
        {(sessaoStatus === 'EM_ANDAMENTO' || sessaoStatus === 'CONCLUIDA') && (
          <div className="pt-4 border-t border-slate-700">
            <PresencaControl sessaoId={sessaoId} sessaoStatus={sessaoStatus} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
