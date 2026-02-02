'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Edit,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  Vote,
  Send,
  Archive,
  Eye,
  Users,
  File,
  Link,
  ExternalLink
} from 'lucide-react'
import type { Parecer } from '@/lib/hooks/use-pareceres'
import { getStatusInfo, getTipoLabel, getTipoColor, formatFileSize } from '../types'

interface ParecerCardProps {
  parecer: Parecer
  onView: (parecer: Parecer) => void
  onEdit: (parecer: Parecer) => void
  onDelete: (id: string) => void
  onEnviarParaVotacao: (parecer: Parecer) => void
  onOpenVotacao: (parecer: Parecer) => void
  onEmitir: (parecer: Parecer) => void
  onArquivar: (parecer: Parecer) => void
}

export function ParecerCard({
  parecer,
  onView,
  onEdit,
  onDelete,
  onEnviarParaVotacao,
  onOpenVotacao,
  onEmitir,
  onArquivar
}: ParecerCardProps) {
  const statusInfo = getStatusInfo(parecer.status)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {parecer.numero ? `Parecer n ${parecer.numero}` : 'Parecer (sem numero)'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
                <Badge className={getTipoColor(parecer.tipo)}>
                  {getTipoLabel(parecer.tipo)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(parecer)}
              title="Ver detalhes"
            >
              <Eye className="h-3 w-3" />
            </Button>

            {parecer.status === 'RASCUNHO' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(parecer)}
                  title="Editar"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEnviarParaVotacao(parecer)}
                  title="Enviar para votacao"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(parecer.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}

            {parecer.status === 'AGUARDANDO_VOTACAO' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenVotacao(parecer)}
                title="Gerenciar votacao"
                className="text-blue-600 hover:text-blue-700"
              >
                <Vote className="h-3 w-3" />
              </Button>
            )}

            {parecer.status === 'APROVADO_COMISSAO' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEmitir(parecer)}
                title="Emitir parecer"
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}

            {['APROVADO_COMISSAO', 'REJEITADO_COMISSAO', 'EMITIDO'].includes(parecer.status) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onArquivar(parecer)}
                title="Arquivar"
                className="text-purple-600 hover:text-purple-700"
              >
                <Archive className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Informacoes da Proposicao */}
        {parecer.proposicao && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-gray-700">
              {parecer.proposicao.tipo} {parecer.proposicao.numero}/{parecer.proposicao.ano}
            </p>
            <p className="text-sm text-gray-600">{parecer.proposicao.titulo}</p>
            {parecer.proposicao.autor && (
              <p className="text-xs text-gray-500 mt-1">
                Autor: {parecer.proposicao.autor.nome}
              </p>
            )}
          </div>
        )}

        {/* Ementa */}
        {parecer.ementa && (
          <p className="text-gray-700 mb-4 italic">
            &ldquo;{parecer.ementa}&rdquo;
          </p>
        )}

        {/* Grid de informacoes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {parecer.comissao?.sigla || parecer.comissao?.nome || 'Comissao'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              Relator: {parecer.relator?.apelido || parecer.relator?.nome || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {new Date(parecer.dataDistribuicao).toLocaleDateString('pt-BR')}
            </span>
          </div>
          {parecer.status === 'AGUARDANDO_VOTACAO' && (
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                Votos: {parecer.votosAFavor + parecer.votosContra + parecer.votosAbstencao}
              </span>
            </div>
          )}
          {(parecer.status === 'APROVADO_COMISSAO' || parecer.status === 'REJEITADO_COMISSAO') && (
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {parecer.votosAFavor} a favor / {parecer.votosContra} contra / {parecer.votosAbstencao} abst.
              </span>
            </div>
          )}
        </div>

        {/* Indicadores de Anexo */}
        {(parecer.arquivoUrl || parecer.arquivoNome || parecer.driveUrl) && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t">
            {(parecer.arquivoUrl || parecer.arquivoNome) && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <File className="h-4 w-4" />
                <span>PDF anexado</span>
                {parecer.arquivoUrl && (
                  <a
                    href={parecer.arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            )}
            {parecer.driveUrl && (
              <a
                href={parecer.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Link className="h-4 w-4" />
                <span>Link do Drive</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
