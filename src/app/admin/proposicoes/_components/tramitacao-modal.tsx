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
  RefreshCw
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
  acaoEmProcesso: 'advance' | 'reopen' | 'finalize' | null
  ultimoAvanco: TramitacaoAdvanceResponse | null
  onClose: () => void
  onAdvance: () => void
  onReopen: () => void
  onFinalize: () => void
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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-camara-primary">
            Tramitação - {proposicao.numero}/{proposicao.ano}
          </CardTitle>
          <CardDescription>{proposicao.titulo}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Atual */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Atual</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="font-medium">Localização:</span>
                  <span className="ml-2">{statusDetalhado?.localizacao ?? 'Não iniciada'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <span className="font-medium">Prazo:</span>
                  <span className="ml-2">
                    {statusDetalhado?.prazo
                      ? new Date(statusDetalhado.prazo).toLocaleDateString('pt-BR')
                      : 'Sem prazo definido'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ações de Tramitação */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Ações sobre a Tramitação</h3>
                <p className="text-sm text-gray-600">Avançar, reabrir ou finalizar a tramitação</p>
              </div>
              {tramitacaoAtual && (
                <Badge variant="outline">
                  Etapa: {tramitacaoAtual.tipoTramitacao?.nome ?? 'Não identificada'}
                </Badge>
              )}
            </div>

            {ultimoAvanco && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {ultimoAvanco.novaEtapa
                  ? `Avançada para ${ultimoAvanco.novaEtapa.tipoTramitacao?.nome ?? 'próxima etapa'}`
                  : 'Etapa finalizada sem próxima etapa configurada.'}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Button
                type="button"
                onClick={onAdvance}
                disabled={!podeAvancar || acaoEmProcesso !== null}
              >
                {acaoEmProcesso === 'advance' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Avançar Etapa
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onFinalize}
                disabled={!podeFinalizar || acaoEmProcesso !== null}
              >
                {acaoEmProcesso === 'finalize' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Finalizar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReopen}
                disabled={!podeReabrir || acaoEmProcesso !== null}
              >
                {acaoEmProcesso === 'reopen' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reabrir
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="comentarioAcao">Comentário</Label>
                <Textarea
                  id="comentarioAcao"
                  value={comentarioAcao}
                  onChange={(e) => onComentarioChange(e.target.value)}
                  placeholder="Observações para a ação executada"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="resultadoFinalizacao">Resultado (para finalização)</Label>
                <Select
                  value={resultadoFinalizacao}
                  onValueChange={(valor) => onResultadoChange(valor as '__sem__' | TramitacaoResultado)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o resultado" />
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

          {/* Notificações */}
          {notificacoes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Notificações Automáticas</h3>
              <div className="space-y-2">
                {notificacoes.map(notif => (
                  <div key={notif.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{notif.canal.toUpperCase()}</Badge>
                      <span>{notif.destinatario}</span>
                      <Badge variant="secondary" className="ml-auto">{notif.status ?? 'pendente'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nova Tramitação Manual */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Registrar Nova Tramitação Manual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Tramitação</Label>
                <Select
                  value={tramitacaoFormData.tipoTramitacaoId}
                  onValueChange={(value) => onTramitacaoFormDataChange({ ...tramitacaoFormData, tipoTramitacaoId: value })}
                >
                  <SelectTrigger>
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
                <Label>Unidade de Destino</Label>
                <Select
                  value={tramitacaoFormData.unidadeId}
                  onValueChange={(value) => onTramitacaoFormDataChange({ ...tramitacaoFormData, unidadeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_AUTO}>Automática</SelectItem>
                    {tiposOrgaos.map((orgao) => (
                      <SelectItem key={orgao.id} value={orgao.id}>
                        {orgao.nome} ({orgao.sigla})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label>Observações</Label>
              <Textarea
                value={tramitacaoFormData.observacoes}
                onChange={(e) => onTramitacaoFormDataChange({ ...tramitacaoFormData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
