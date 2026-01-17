'use client'

/**
 * Componente de Display de Presenca
 * Mostra parlamentares presentes e ausentes
 */

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle, XCircle, User } from 'lucide-react'
import type { PresencaAtiva } from '@/lib/hooks/use-painel-tempo-real'

interface PresencaDisplayProps {
  presencas: PresencaAtiva[]
  estatisticas?: {
    total: number
    presentes: number
    ausentes: number
    percentual: number
  }
  showLista?: boolean
  compact?: boolean
  tema?: 'claro' | 'escuro'
}

export function PresencaDisplay({
  presencas,
  estatisticas,
  showLista = true,
  compact = false,
  tema = 'escuro'
}: PresencaDisplayProps) {
  const presentes = presencas.filter(p => p.presente)
  const ausentes = presencas.filter(p => !p.presente)

  const stats = estatisticas || {
    total: presencas.length,
    presentes: presentes.length,
    ausentes: ausentes.length,
    percentual: presencas.length > 0
      ? Math.round((presentes.length / presencas.length) * 100)
      : 0
  }

  const cardClass = tema === 'escuro'
    ? 'bg-white/10 backdrop-blur-lg border-white/20 text-white'
    : 'bg-white border-gray-200'

  const getInitials = (nome: string): string => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-4 rounded-lg ${tema === 'escuro' ? 'bg-white/10' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Users className={`h-5 w-5 ${tema === 'escuro' ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className="font-semibold">Presenca</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="font-bold text-green-500">{stats.presentes}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="font-bold text-red-500">{stats.ausentes}</span>
          </div>
          <Badge className={stats.percentual >= 50 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
            {stats.percentual}%
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Users className={tema === 'escuro' ? 'text-blue-400' : 'text-blue-600'} />
          Presenca dos Parlamentares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatisticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`text-center p-3 rounded-lg ${tema === 'escuro' ? 'bg-green-500/20' : 'bg-green-50'}`}>
            <div className={`text-2xl font-bold ${tema === 'escuro' ? 'text-green-300' : 'text-green-600'}`}>
              {stats.presentes}
            </div>
            <div className={`text-sm ${tema === 'escuro' ? 'text-green-200' : 'text-green-700'}`}>
              Presentes
            </div>
          </div>
          <div className={`text-center p-3 rounded-lg ${tema === 'escuro' ? 'bg-red-500/20' : 'bg-red-50'}`}>
            <div className={`text-2xl font-bold ${tema === 'escuro' ? 'text-red-300' : 'text-red-600'}`}>
              {stats.ausentes}
            </div>
            <div className={`text-sm ${tema === 'escuro' ? 'text-red-200' : 'text-red-700'}`}>
              Ausentes
            </div>
          </div>
          <div className={`text-center p-3 rounded-lg ${tema === 'escuro' ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
            <div className={`text-2xl font-bold ${tema === 'escuro' ? 'text-blue-300' : 'text-blue-600'}`}>
              {stats.percentual}%
            </div>
            <div className={`text-sm ${tema === 'escuro' ? 'text-blue-200' : 'text-blue-700'}`}>
              Presenca
            </div>
          </div>
        </div>

        {/* Lista de Parlamentares */}
        {showLista && (
          <div className="space-y-4">
            {/* Presentes */}
            <div>
              <h3 className={`text-lg font-semibold flex items-center gap-2 mb-3 ${tema === 'escuro' ? 'text-green-300' : 'text-green-700'}`}>
                <CheckCircle className="h-5 w-5" />
                Presentes ({presentes.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {presentes.map((parlamentar) => (
                  <div
                    key={parlamentar.parlamentarId}
                    className={`flex items-center gap-3 p-2 rounded-lg ${tema === 'escuro' ? 'bg-green-500/20 border border-green-400/30' : 'bg-green-50 border border-green-200'}`}
                  >
                    {parlamentar.foto ? (
                      <Image
                        src={parlamentar.foto}
                        alt={parlamentar.nome}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getInitials(parlamentar.nome)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${tema === 'escuro' ? 'text-white' : 'text-gray-900'}`}>
                        {parlamentar.nome}
                      </p>
                      <p className={`text-sm ${tema === 'escuro' ? 'text-green-300' : 'text-green-600'}`}>
                        {parlamentar.partido}
                      </p>
                    </div>
                    <Badge className="bg-green-600/30 text-green-200 border-green-400/50">
                      Presente
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Ausentes */}
            {ausentes.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold flex items-center gap-2 mb-3 ${tema === 'escuro' ? 'text-red-300' : 'text-red-700'}`}>
                  <XCircle className="h-5 w-5" />
                  Ausentes ({ausentes.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {ausentes.map((parlamentar) => (
                    <div
                      key={parlamentar.parlamentarId}
                      className={`flex items-center gap-3 p-2 rounded-lg ${tema === 'escuro' ? 'bg-red-500/20 border border-red-400/30' : 'bg-red-50 border border-red-200'}`}
                    >
                      {parlamentar.foto ? (
                        <Image
                          src={parlamentar.foto}
                          alt={parlamentar.nome}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover opacity-50"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center opacity-75">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(parlamentar.nome)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold ${tema === 'escuro' ? 'text-white' : 'text-gray-900'}`}>
                          {parlamentar.nome}
                        </p>
                        <p className={`text-sm ${tema === 'escuro' ? 'text-red-300' : 'text-red-600'}`}>
                          {parlamentar.partido}
                          {parlamentar.justificativa && (
                            <span className="ml-2 text-yellow-500">
                              (Justificado)
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge className="bg-red-600/30 text-red-200 border-red-400/50">
                        Ausente
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Grid de avatares para visualizacao compacta
 */
export function PresencaGrid({
  presencas,
  tema = 'escuro'
}: {
  presencas: PresencaAtiva[]
  tema?: 'claro' | 'escuro'
}) {
  const getInitials = (nome: string): string => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {presencas.map((parlamentar) => (
        <div
          key={parlamentar.parlamentarId}
          className={`group relative w-12 h-12 rounded-full ${parlamentar.presente ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500 opacity-50'}`}
          title={`${parlamentar.nome} (${parlamentar.partido}) - ${parlamentar.presente ? 'Presente' : 'Ausente'}`}
        >
          {parlamentar.foto ? (
            <Image
              src={parlamentar.foto}
              alt={parlamentar.nome}
              width={48}
              height={48}
              className="w-full h-full rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className={`w-full h-full rounded-full flex items-center justify-center ${parlamentar.presente ? 'bg-green-600' : 'bg-red-600'}`}>
              <span className="text-white font-semibold text-xs">
                {getInitials(parlamentar.nome)}
              </span>
            </div>
          )}
          {parlamentar.conectado && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {parlamentar.nome}
          </div>
        </div>
      ))}
    </div>
  )
}
