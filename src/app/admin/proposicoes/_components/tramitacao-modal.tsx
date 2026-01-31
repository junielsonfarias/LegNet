'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Clock,
  Calendar,
  ArrowRight,
  Loader2,
  Check,
  RefreshCw,
  X
} from 'lucide-react'
import type {
  ProposicaoApi,
  TramitacaoFormData,
  TramitacaoApi,
  TramitacaoAdvanceResponse,
  TramitacaoResultado,
  TipoTramitacao,
  TipoOrgao
} from '../_types'
import { SELECT_AUTO, RESULTADO_PADRAO, RESULTADOS_TRAMITACAO } from '../_types'

interface StatusDetalhado {
  status: string
  localizacao: string
  descricao: string
  prazo: string | null
  proximoPasso: string
  tramitacaoAtual: TramitacaoApi | null
  tipoTramitacao?: TipoTramitacao
  unidade?: TipoOrgao
}

interface Notificacao {
  id: string
  canal: string
  destinatario: string
  status?: string | null
  enviadoEm?: string | null
  etapa: TramitacaoApi
}

interface TramitacaoModalProps {
  isOpen: boolean
  proposicao: ProposicaoApi | null
  statusDetalhado: StatusDetalhado | null
  tramitacaoFormData: TramitacaoFormData
  tiposTramitacao: TipoTramitacao[]
  tiposOrgaos: TipoOrgao[]
  notificacoes: Notificacao[]
  comentarioAcao: string
  resultadoFinalizacao: '__sem__' | TramitacaoResultado
  acaoEmProcesso: 'advance' | 'reopen' | 'finalize' | 'create' | null
  ultimoAvanco: TramitacaoAdvanceResponse | null
  onClose: () => void
  onAdvance: () => void
  onReopen: () => void
  onFinalize: () => void
  onSubmitTramitacao: (e: React.FormEvent) => void
  onTramitacaoFormDataChange: (data: TramitacaoFormData) => void
  onComentarioChange: (comentario: string) => void
  onResultadoChange: (resultado: '__sem__' | TramitacaoResultado) => void
}

export function TramitacaoModal({
  isOpen,
  proposicao,
  statusDetalhado,
  tramitacaoFormData,
  tiposTramitacao,
  tiposOrgaos,
  notificacoes,
  comentarioAcao,
  resultadoFinalizacao,
  acaoEmProcesso,
  ultimoAvanco,
  onClose,
  onAdvance,
  onReopen,
  onFinalize,
  onSubmitTramitacao,
  onTramitacaoFormDataChange,
  onComentarioChange,
  onResultadoChange
}: TramitacaoModalProps) {
  if (!isOpen || !proposicao) return null

  const tramitacaoAtual = statusDetalhado?.tramitacaoAtual
  const podeAvancar = tramitacaoAtual?.status === 'EM_ANDAMENTO'
  const podeFinalizar = tramitacaoAtual?.status === 'EM_ANDAMENTO'
  const podeReabrir = tramitacaoAtual?.status === 'CONCLUIDA'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-camara-primary">
                Tramitação - {proposicao.numero}/{proposicao.ano}
              </CardTitle>
              <CardDescription className="line-clamp-1">{proposicao.titulo}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Layout em duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              {/* Status Atual - Compacto */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Status Atual</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{statusDetalhado?.localizacao ?? 'Não iniciada'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {statusDetalhado?.prazo
                        ? new Date(statusDetalhado.prazo).toLocaleDateString('pt-BR')
                        : 'Sem prazo'}
                    </span>
                  </div>
                  {tramitacaoAtual && (
                    <Badge variant="outline" className="ml-auto">
                      {tramitacaoAtual.tipoTramitacao?.nome ?? 'N/A'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Ações de Tramitação */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Ações da Etapa Atual</h4>

                {ultimoAvanco && (
                  <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
                    {ultimoAvanco.novaEtapa
                      ? `Avançada para ${ultimoAvanco.novaEtapa.tipoTramitacao?.nome ?? 'próxima etapa'}`
                      : 'Etapa finalizada.'}
                  </div>
                )}

                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={onAdvance}
                    disabled={!podeAvancar || acaoEmProcesso !== null}
                  >
                    {acaoEmProcesso === 'advance' ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <ArrowRight className="h-3 w-3 mr-1" />
                    )}
                    Avançar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={onFinalize}
                    disabled={!podeFinalizar || acaoEmProcesso !== null}
                  >
                    {acaoEmProcesso === 'finalize' ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Finalizar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onReopen}
                    disabled={!podeReabrir || acaoEmProcesso !== null}
                  >
                    {acaoEmProcesso === 'reopen' ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Reabrir
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Comentário</Label>
                    <Textarea
                      value={comentarioAcao}
                      onChange={(e) => onComentarioChange(e.target.value)}
                      placeholder="Observações..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Resultado</Label>
                    <Select
                      value={resultadoFinalizacao}
                      onValueChange={(valor) => onResultadoChange(valor as '__sem__' | TramitacaoResultado)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RESULTADO_PADRAO}>Sem resultado</SelectItem>
                        {RESULTADOS_TRAMITACAO.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notificações - Compacto */}
              {notificacoes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Notificações</h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {notificacoes.map(notif => (
                      <div key={notif.id} className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-[10px]">{notif.canal}</Badge>
                        <span className="text-gray-600 truncate">{notif.destinatario}</span>
                        <Badge variant="secondary" className="text-[10px] ml-auto">{notif.status ?? 'pendente'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita - Nova Tramitação */}
            <div className="border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Nova Tramitação Manual</h4>
              <form onSubmit={onSubmitTramitacao}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo de Tramitação *</Label>
                      <Select
                        value={tramitacaoFormData.tipoTramitacaoId}
                        onValueChange={(value) => onTramitacaoFormDataChange({ ...tramitacaoFormData, tipoTramitacaoId: value })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposTramitacao.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.id}>
                              {tipo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Unidade de Destino</Label>
                      <Select
                        value={tramitacaoFormData.unidadeId}
                        onValueChange={(value) => onTramitacaoFormDataChange({ ...tramitacaoFormData, unidadeId: value })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SELECT_AUTO}>Automática</SelectItem>
                          {tiposOrgaos.map((orgao) => (
                            <SelectItem key={orgao.id} value={orgao.id}>
                              {orgao.nome} {orgao.sigla && `(${orgao.sigla})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Observações</Label>
                    <Textarea
                      value={tramitacaoFormData.observacoes}
                      onChange={(e) => onTramitacaoFormDataChange({ ...tramitacaoFormData, observacoes: e.target.value })}
                      rows={2}
                      className="text-sm"
                      placeholder="Observações da tramitação..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!tramitacaoFormData.tipoTramitacaoId || acaoEmProcesso === 'create'}
                    >
                      {acaoEmProcesso === 'create' ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      Salvar Tramitação
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex justify-end mt-4 pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
