'use client'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

import type { SessaoFormData } from './StepSessaoInfo'
import type { PautaItem } from './StepMontarPauta'

interface StepConfirmarProps {
  sessaoInfo: SessaoFormData
  pautaItens: PautaItem[]
  publicarPauta: boolean
  onPublicarChange: (publicar: boolean) => void
}

const TIPOS_SESSAO_LABELS: Record<string, string> = {
  'ORDINARIA': 'Ordinaria',
  'EXTRAORDINARIA': 'Extraordinaria',
  'SOLENE': 'Solene',
  'ESPECIAL': 'Especial'
}

const SECAO_LABELS: Record<string, string> = {
  'EXPEDIENTE': 'Expediente',
  'ORDEM_DO_DIA': 'Ordem do Dia',
  'COMUNICACOES': 'Comunicacoes',
  'HONRAS': 'Honras',
  'OUTROS': 'Outros'
}

export function StepConfirmar({
  sessaoInfo,
  pautaItens,
  publicarPauta,
  onPublicarChange
}: StepConfirmarProps) {
  const tempoTotal = pautaItens.reduce((acc, item) => acc + (item.tempoEstimado || 0), 0)

  // Agrupa itens por secao
  const itensPorSecao = pautaItens.reduce((acc, item) => {
    if (!acc[item.secao]) {
      acc[item.secao] = []
    }
    acc[item.secao].push(item)
    return acc
  }, {} as Record<string, PautaItem[]>)

  // Calcula se a pauta esta sendo criada com 48h de antecedencia
  const dataSessao = sessaoInfo.data ? new Date(sessaoInfo.data + 'T00:00:00') : null
  const agora = new Date()
  const horasAntecedencia = dataSessao
    ? Math.floor((dataSessao.getTime() - agora.getTime()) / (1000 * 60 * 60))
    : 0
  const cumpre48h = horasAntecedencia >= 48

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Confirmar e Criar Sessao</h2>
        <p className="text-sm text-gray-500">
          Revise as informacoes antes de criar a sessao
        </p>
      </div>

      {/* Resumo da Sessao */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Resumo da Sessao
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="font-medium">
              {sessaoInfo.numero}a Sessao {TIPOS_SESSAO_LABELS[sessaoInfo.tipo]}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-medium">
                {sessaoInfo.data && new Date(sessaoInfo.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Horario</p>
              <p className="font-medium">{sessaoInfo.horario}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Local</p>
              <p className="font-medium">{sessaoInfo.local || 'Nao informado'}</p>
            </div>
          </div>
        </div>

        {sessaoInfo.descricao && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">Descricao</p>
            <p className="text-gray-700">{sessaoInfo.descricao}</p>
          </div>
        )}
      </div>

      {/* Resumo da Pauta */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Pauta da Sessao
          </span>
          <Badge variant="outline">{pautaItens.length} itens</Badge>
        </h3>

        {pautaItens.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>Pauta vazia</p>
            <p className="text-sm">Voce pode adicionar itens depois de criar a sessao</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(itensPorSecao).map(([secao, itens]) => (
              <div key={secao}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {SECAO_LABELS[secao]} ({itens.length})
                </h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  {itens.map((item, index) => (
                    <li key={item.id} className="text-sm">
                      <span className="text-gray-700">{item.titulo}</span>
                      {item.proposicaoTipo && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {item.proposicaoTipo}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}

            <div className="pt-4 border-t flex justify-between text-sm">
              <span className="text-gray-500">Tempo total estimado:</span>
              <span className="font-medium">
                {tempoTotal} min ({Math.floor(tempoTotal / 60)}h {tempoTotal % 60}min)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Opcao de publicar pauta */}
      {pautaItens.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-base font-medium">Publicar pauta agora</Label>
              <p className="text-sm text-gray-500 mt-1">
                A pauta sera publicada no portal de transparencia.
                Conforme RN-120, pautas devem ser publicadas 48h antes da sessao.
              </p>

              {/* Aviso sobre 48h */}
              <div className={`mt-2 p-2 rounded text-sm flex items-start gap-2 ${
                cumpre48h ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                {cumpre48h ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-green-700">
                      A sessao sera realizada em {horasAntecedencia}h. Publicar agora atende ao prazo de 48h.
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span className="text-yellow-700">
                      A sessao sera realizada em {horasAntecedencia}h. A publicacao esta fora do prazo recomendado de 48h.
                    </span>
                  </>
                )}
              </div>
            </div>

            <Switch
              checked={publicarPauta}
              onCheckedChange={onPublicarChange}
            />
          </div>
        </div>
      )}

      {/* Checklist final */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Checklist antes de criar</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-blue-800">Numero, data e horario definidos</span>
          </li>
          <li className="flex items-center gap-2">
            {pautaItens.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-blue-800">
              {pautaItens.length > 0
                ? `${pautaItens.length} itens adicionados a pauta`
                : 'Pauta vazia (pode ser preenchida depois)'}
            </span>
          </li>
          {pautaItens.some(item => item.secao === 'ORDEM_DO_DIA') && (
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-blue-800">
                Proposicoes na Ordem do Dia sao elegiveis (encaminhadas para Plenario)
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
