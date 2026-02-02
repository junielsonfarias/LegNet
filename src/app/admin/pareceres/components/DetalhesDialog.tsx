'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Upload, File, Link, ExternalLink } from 'lucide-react'
import type { Parecer } from '@/lib/hooks/use-pareceres'
import { getStatusInfo, getTipoLabel, getTipoColor, formatFileSize } from '../types'

interface DetalhesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parecer: Parecer | null
}

export function DetalhesDialog({ open, onOpenChange, parecer }: DetalhesDialogProps) {
  if (!parecer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {parecer.numero
              ? `Parecer n ${parecer.numero}`
              : 'Detalhes do Parecer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status e Tipo */}
          <div className="flex gap-2">
            <Badge className={getStatusInfo(parecer.status).color}>
              {getStatusInfo(parecer.status).label}
            </Badge>
            <Badge className={getTipoColor(parecer.tipo)}>
              {getTipoLabel(parecer.tipo)}
            </Badge>
          </div>

          {/* Proposicao */}
          {parecer.proposicao && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Proposicao Analisada</h4>
              <p className="font-medium">
                {parecer.proposicao.tipo} {parecer.proposicao.numero}/{parecer.proposicao.ano}
              </p>
              <p className="text-gray-700">{parecer.proposicao.titulo}</p>
              {parecer.proposicao.ementa && (
                <p className="text-sm text-gray-600 mt-1 italic">
                  {parecer.proposicao.ementa}
                </p>
              )}
            </div>
          )}

          {/* Informacoes Gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Comissao</Label>
              <p>{parecer.comissao?.nome}</p>
            </div>
            <div>
              <Label className="text-gray-500">Relator</Label>
              <p>{parecer.relator?.nome}</p>
            </div>
            <div>
              <Label className="text-gray-500">Data de Distribuicao</Label>
              <p>{new Date(parecer.dataDistribuicao).toLocaleDateString('pt-BR')}</p>
            </div>
            {parecer.prazoEmissao && (
              <div>
                <Label className="text-gray-500">Prazo para Emissao</Label>
                <p>{new Date(parecer.prazoEmissao).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>

          {/* Ementa */}
          {parecer.ementa && (
            <div>
              <Label className="text-gray-500">Ementa</Label>
              <p className="italic">&ldquo;{parecer.ementa}&rdquo;</p>
            </div>
          )}

          {/* Fundamentacao */}
          <div>
            <Label className="text-gray-500">Fundamentacao</Label>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
              {parecer.fundamentacao}
            </div>
          </div>

          {/* Conclusao */}
          {parecer.conclusao && (
            <div>
              <Label className="text-gray-500">Conclusao</Label>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                {parecer.conclusao}
              </div>
            </div>
          )}

          {/* Emendas Propostas */}
          {parecer.emendasPropostas && (
            <div>
              <Label className="text-gray-500">Emendas Propostas</Label>
              <div className="bg-yellow-50 rounded-lg p-4 whitespace-pre-wrap">
                {parecer.emendasPropostas}
              </div>
            </div>
          )}

          {/* Resultado da Votacao */}
          {(parecer.status === 'APROVADO_COMISSAO' ||
            parecer.status === 'REJEITADO_COMISSAO' ||
            parecer.status === 'EMITIDO') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Resultado da Votacao</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">{parecer.votosAFavor}</div>
                  <p className="text-sm text-gray-600">A Favor</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600">{parecer.votosContra}</div>
                  <p className="text-sm text-gray-600">Contra</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-600">{parecer.votosAbstencao}</div>
                  <p className="text-sm text-gray-600">Abstencao</p>
                </div>
              </div>
              {parecer.dataVotacao && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Votacao realizada em {new Date(parecer.dataVotacao).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* Motivo de Rejeicao */}
          {parecer.motivoRejeicao && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Motivo da Rejeicao</h4>
              <p>{parecer.motivoRejeicao}</p>
            </div>
          )}

          {/* Observacoes */}
          {parecer.observacoes && (
            <div>
              <Label className="text-gray-500">Observacoes</Label>
              <p className="text-gray-600">{parecer.observacoes}</p>
            </div>
          )}

          {/* Anexos */}
          {(parecer.arquivoUrl || parecer.arquivoNome || parecer.driveUrl) && (
            <div className="border-t pt-4">
              <Label className="text-gray-500 flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4" />
                Anexos
              </Label>
              <div className="space-y-2">
                {(parecer.arquivoUrl || parecer.arquivoNome) && (
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {parecer.arquivoNome || 'Documento PDF'}
                        </p>
                        {parecer.arquivoTamanho && (
                          <p className="text-xs text-gray-500">
                            {formatFileSize(parecer.arquivoTamanho)}
                          </p>
                        )}
                      </div>
                    </div>
                    {parecer.arquivoUrl && (
                      <a
                        href={parecer.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </a>
                    )}
                  </div>
                )}
                {parecer.driveUrl && (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Link className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Link do Drive
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[300px]">
                          {parecer.driveUrl}
                        </p>
                      </div>
                    </div>
                    <a
                      href={parecer.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
