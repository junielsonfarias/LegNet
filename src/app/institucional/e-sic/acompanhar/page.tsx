'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search, Loader2, FileText, Clock, CheckCircle, XCircle, AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface Solicitacao {
  id: string
  protocolo: string
  nome: string
  assunto: string
  descricao: string
  status: string
  prazoResposta: string
  resposta: string | null
  dataResposta: string | null
  createdAt: string
  temRecurso: boolean
  historico?: Array<{
    id: string
    acao: string
    descricao: string | null
    usuarioNome: string | null
    data: string
  }>
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  ABERTO: { label: 'Aberto', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100', icon: Clock },
  EM_ANALISE: { label: 'Em Analise', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', icon: AlertTriangle },
  RESPONDIDO: { label: 'Respondido', className: 'bg-green-100 text-green-800 hover:bg-green-100', icon: CheckCircle },
  PRORROGADO: { label: 'Prorrogado', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100', icon: Clock },
  RECURSO: { label: 'Em Recurso', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100', icon: AlertTriangle },
  ARQUIVADO: { label: 'Arquivado', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100', icon: XCircle },
  NEGADO: { label: 'Negado', className: 'bg-red-100 text-red-800 hover:bg-red-100', icon: XCircle },
}

export default function AcompanharESicPage() {
  const searchParams = useSearchParams()
  const [protocolo, setProtocolo] = useState(searchParams.get('protocolo') || '')
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const buscar = async () => {
    if (!protocolo.trim()) return
    setLoading(true)
    setError('')
    setSolicitacao(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/e-sic/acompanhar?protocolo=${protocolo}`)
      const json = await res.json()
      if (json.success) {
        setSolicitacao(json.data)
      } else {
        setError(json.error || 'Solicitacao nao encontrada.')
      }
    } catch {
      setError('Erro de conexao. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('protocolo')) {
      buscar()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = solicitacao ? (statusConfig[solicitacao.status] || statusConfig.ABERTO) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Link href="/institucional/e-sic">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao E-SIC
          </Button>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acompanhar Solicitacao</h1>
          <p className="text-gray-600">Consulte o status da sua solicitacao E-SIC</p>
        </div>

        <Card className="mb-8 max-w-2xl mx-auto">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Input
                placeholder="Digite o numero do protocolo"
                value={protocolo}
                onChange={(e) => setProtocolo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscar()}
                className="flex-1"
              />
              <Button onClick={buscar} disabled={loading || !protocolo.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="max-w-2xl mx-auto mb-8 border-red-200">
            <CardContent className="p-4 text-center text-red-600">
              <XCircle className="h-8 w-8 mx-auto mb-2" />
              {error}
            </CardContent>
          </Card>
        )}

        {searched && !loading && !solicitacao && !error && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma solicitacao encontrada para o protocolo informado.</p>
            </CardContent>
          </Card>
        )}

        {solicitacao && cfg && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Protocolo: {solicitacao.protocolo}
                  </div>
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Assunto</p>
                    <p className="font-medium">{solicitacao.assunto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data da Solicitacao</p>
                    <p className="font-medium">{new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prazo para Resposta</p>
                    <p className="font-medium">{new Date(solicitacao.prazoResposta).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Solicitante</p>
                    <p className="font-medium">{solicitacao.nome}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Descricao</p>
                  <p className="text-gray-700 mt-1">{solicitacao.descricao}</p>
                </div>
              </CardContent>
            </Card>

            {solicitacao.resposta && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Resposta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{solicitacao.resposta}</p>
                  {solicitacao.dataResposta && (
                    <p className="text-sm text-gray-500 mt-2">
                      Respondido em: {new Date(solicitacao.dataResposta).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {solicitacao.historico && solicitacao.historico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {solicitacao.historico.map((h) => (
                      <div key={h.id} className="flex gap-3 border-l-2 border-gray-200 pl-4">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{h.acao}</p>
                          {h.descricao && <p className="text-sm text-gray-600">{h.descricao}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(h.data).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {h.usuarioNome ? ` - ${h.usuarioNome}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {solicitacao.status === 'NEGADO' && (
              <div className="text-center">
                <Link href={`/institucional/e-sic/recurso/${solicitacao.protocolo}`}>
                  <Button>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Interpor Recurso
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
