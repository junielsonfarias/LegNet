'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  Shield,
  Clock,
  Users,
  FileText,
  ArrowRight
} from 'lucide-react'
import { ValidacaoRegimental, RegraAplicada } from '@/lib/regras-regimentais-mock-service'

interface ValidacaoRegimentalProps {
  validacao: ValidacaoRegimental
  onClose?: () => void
  showDetails?: boolean
}

export default function ValidacaoRegimentalComponent({ 
  validacao, 
  onClose, 
  showDetails = false 
}: ValidacaoRegimentalProps) {
  const getStatusIcon = () => {
    if (validacao.valida) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusColor = () => {
    if (validacao.valida) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusLabel = () => {
    if (validacao.valida) {
      return 'Válida'
    }
    return 'Inválida'
  }

  const getRegraIcon = (resultado: string) => {
    switch (resultado) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'reprovado':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'aviso':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getRegraColor = (resultado: string) => {
    switch (resultado) {
      case 'aprovado':
        return 'bg-green-50 border-green-200'
      case 'reprovado':
        return 'bg-red-50 border-red-200'
      case 'aviso':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className="camara-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Validação Regimental
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusLabel()}</span>
            </Badge>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo da Validação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-gray-900">
              {validacao.erros.length} Erro(s)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">
              {validacao.avisos.length} Aviso(s)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              {validacao.sugestoes.length} Sugestão(ões)
            </span>
          </div>
        </div>

        {/* Erros */}
        {validacao.erros.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Erros Encontrados
            </h4>
            <div className="space-y-2">
              {validacao.erros.map((erro, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avisos */}
        {validacao.avisos.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-orange-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Avisos
            </h4>
            <div className="space-y-2">
              {validacao.avisos.map((aviso, index) => (
                <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-700">{aviso}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugestões */}
        {validacao.sugestoes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-700 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Sugestões
            </h4>
            <div className="space-y-2">
              {validacao.sugestoes.map((sugestao, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">{sugestao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detalhes das Regras Aplicadas */}
        {showDetails && validacao.regras.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Regras Aplicadas
            </h4>
            <div className="space-y-2">
              {validacao.regras.map((regraAplicada, index) => (
                <div key={index} className={`p-3 border rounded-md ${getRegraColor(regraAplicada.resultado)}`}>
                  <div className="flex items-start space-x-3">
                    {getRegraIcon(regraAplicada.resultado)}
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{regraAplicada.regra.nome}</h5>
                      <p className="text-sm text-gray-600 mt-1">{regraAplicada.regra.descricao}</p>
                      <p className="text-sm font-medium mt-2">{regraAplicada.mensagem}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        regraAplicada.resultado === 'aprovado' 
                          ? 'text-green-600 border-green-300' 
                          : regraAplicada.resultado === 'reprovado'
                          ? 'text-red-600 border-red-300'
                          : 'text-orange-600 border-orange-300'
                      }
                    >
                      {regraAplicada.resultado === 'aprovado' ? 'Aprovado' : 
                       regraAplicada.resultado === 'reprovado' ? 'Reprovado' : 'Aviso'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Proposição ID: {validacao.proposicaoId}
          </div>
          <div className="flex space-x-2">
            {!validacao.valida && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <XCircle className="h-4 w-4 mr-2" />
                Corrigir Problemas
              </Button>
            )}
            {validacao.valida && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Prosseguir
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
