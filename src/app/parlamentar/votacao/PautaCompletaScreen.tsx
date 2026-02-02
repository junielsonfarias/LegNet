'use client'

import {
  Vote,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  BookOpen,
  FileText,
  ListOrdered,
  AlertCircle,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VotacaoHeader } from './components/headers/VotacaoHeader'
import type { SessaoCompleta, ParlamentarInfo, PautaItem, ConfiguracaoInstitucional } from './types/votacao'

interface PautaCompletaScreenProps {
  sessao: SessaoCompleta
  parlamentarInfo: ParlamentarInfo | null
  nomeParlamentar: string
  tempoSessao: number
  configuracao: ConfiguracaoInstitucional
  itens: PautaItem[]
  itemEmDiscussao?: PautaItem
}

export function PautaCompletaScreen({
  sessao,
  parlamentarInfo,
  nomeParlamentar,
  tempoSessao,
  configuracao,
  itens,
  itemEmDiscussao
}: PautaCompletaScreenProps) {
  // Função para obter ícone do status
  const getStatusIcon = (itemStatus: string) => {
    const iconClass = "h-3 w-3 sm:h-4 sm:w-4"
    switch (itemStatus) {
      case 'APROVADO':
      case 'CONCLUIDO':
        return <CheckCircle className={`${iconClass} text-green-500`} />
      case 'REJEITADO':
        return <XCircle className={`${iconClass} text-red-500`} />
      case 'EM_VOTACAO':
        return <Vote className={`${iconClass} text-orange-500`} />
      case 'EM_DISCUSSAO':
        return <MessageSquare className={`${iconClass} text-yellow-500`} />
      case 'ADIADO':
        return <Clock className={`${iconClass} text-gray-500`} />
      default:
        return <BookOpen className={`${iconClass} text-gray-400`} />
    }
  }

  // Função para obter cor do badge de status
  const getStatusBadgeClass = (itemStatus: string) => {
    switch (itemStatus) {
      case 'APROVADO':
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'REJEITADO':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'EM_VOTACAO':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'EM_DISCUSSAO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'ADIADO':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300'
    }
  }

  // Função para formatar label do status
  const getStatusLabel = (itemStatus: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Aguardando',
      'EM_DISCUSSAO': 'Em Discussão',
      'EM_VOTACAO': 'Em Votação',
      'APROVADO': 'Aprovado',
      'REJEITADO': 'Rejeitado',
      'CONCLUIDO': 'Concluído',
      'ADIADO': 'Adiado',
      'RETIRADO': 'Retirado'
    }
    return labels[itemStatus] || itemStatus
  }

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      <VotacaoHeader
        sessao={sessao}
        parlamentarInfo={parlamentarInfo}
        nomeParlamentar={nomeParlamentar}
        tempoSessao={tempoSessao}
        configuracao={configuracao}
        variant="default"
        statusBadge={
          <Badge className="bg-green-500/20 text-green-200 border border-green-400/30 text-[10px] sm:text-xs">
            <Vote className="h-3 w-3 mr-1" />
            EM SESSÃO
          </Badge>
        }
      />

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">

          {/* Card de Discussão */}
          {itemEmDiscussao && (
            <Card className="border-2 border-yellow-400 bg-yellow-50">
              <CardHeader className="bg-yellow-100 border-b border-yellow-200 p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-yellow-800 text-base sm:text-lg md:text-xl">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                  ITEM EM DISCUSSÃO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-yellow-200">
                  {itemEmDiscussao.proposicao ? (
                    <>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="bg-blue-600 text-white text-xs sm:text-sm">
                          {itemEmDiscussao.proposicao.tipo.replace('_', ' ')}
                        </Badge>
                        <span className="font-bold text-sm sm:text-base md:text-lg">
                          Nº {itemEmDiscussao.proposicao.numero}/{itemEmDiscussao.proposicao.ano}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">
                        {itemEmDiscussao.proposicao.titulo}
                      </h3>
                      {itemEmDiscussao.proposicao.ementa && (
                        <p className="text-gray-700 mb-3 text-sm sm:text-base line-clamp-3">
                          {itemEmDiscussao.proposicao.ementa}
                        </p>
                      )}
                      {itemEmDiscussao.proposicao.autor && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>
                            <strong>Autor:</strong> {itemEmDiscussao.proposicao.autor.apelido || itemEmDiscussao.proposicao.autor.nome}
                            {itemEmDiscussao.proposicao.autor.partido && (
                              <span className="text-blue-600 ml-1">
                                ({itemEmDiscussao.proposicao.autor.partido})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">
                        {itemEmDiscussao.titulo}
                      </h3>
                      {itemEmDiscussao.descricao && (
                        <p className="text-gray-700 text-sm sm:text-base">
                          {itemEmDiscussao.descricao}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                  <p className="text-xs sm:text-sm text-yellow-800 text-center">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                    Aguarde o início da votação para registrar seu voto
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ordem do Dia - Lista Completa */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <ListOrdered className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Ordem do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              {itens.length > 0 ? (
                <div className="space-y-2">
                  {itens.map((item, index) => {
                    const isAtivo = item.status === 'EM_DISCUSSAO' || item.status === 'EM_VOTACAO'
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
                          isAtivo
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                            : item.status === 'APROVADO' || item.status === 'CONCLUIDO'
                              ? 'bg-green-50 border-green-200'
                              : item.status === 'REJEITADO'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* Número do item */}
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                          isAtivo ? 'bg-blue-600 text-white' :
                          item.status === 'APROVADO' || item.status === 'CONCLUIDO' ? 'bg-green-600 text-white' :
                          item.status === 'REJEITADO' ? 'bg-red-600 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {item.status === 'APROVADO' || item.status === 'CONCLUIDO'
                            ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            : item.status === 'REJEITADO'
                              ? <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              : index + 1
                          }
                        </div>

                        {/* Conteúdo do item */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 sm:gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-xs sm:text-sm md:text-base truncate ${isAtivo ? 'text-blue-900' : 'text-gray-900'}`}>
                                {item.proposicao
                                  ? `${item.proposicao.tipo} Nº ${item.proposicao.numero}/${item.proposicao.ano}`
                                  : item.titulo
                                }
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
                                {item.proposicao?.titulo || item.descricao || '-'}
                              </p>
                            </div>
                            <Badge className={`flex-shrink-0 border text-[10px] sm:text-xs ${getStatusBadgeClass(item.status)}`}>
                              <span className="hidden sm:inline">{getStatusIcon(item.status)}</span>
                              <span className="sm:ml-1">{getStatusLabel(item.status)}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Nenhum item na pauta desta sessão</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="bg-blue-50 p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-800">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  <strong>Acompanhamento em tempo real:</strong> Atualização automática a cada 5 segundos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
