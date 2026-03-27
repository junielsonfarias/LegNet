'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search, Loader2, MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle,
  ArrowLeft, Star
} from 'lucide-react'
import Link from 'next/link'

interface Manifestacao {
  id: string
  protocolo: string
  anonimo: boolean
  nome: string | null
  assunto: string
  descricao: string
  tipo: string
  status: string
  prazoResposta: string
  resposta: string | null
  dataResposta: string | null
  satisfacao: number | null
  createdAt: string
  historico?: Array<{
    id: string
    acao: string
    descricao: string | null
    usuarioNome: string | null
    data: string
  }>
}

const statusConfig: Record<string, { label: string; className: string }> = {
  REGISTRADA: { label: 'Registrada', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  EM_ANALISE: { label: 'Em Analise', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  ENCAMINHADA: { label: 'Encaminhada', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  RESPONDIDA: { label: 'Respondida', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  CONCLUIDA: { label: 'Concluida', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  ARQUIVADA: { label: 'Arquivada', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
}

const tipoLabels: Record<string, string> = {
  RECLAMACAO: 'Reclamacao',
  SUGESTAO: 'Sugestao',
  ELOGIO: 'Elogio',
  DENUNCIA: 'Denuncia',
  SOLICITACAO: 'Solicitacao',
}

export default function AcompanharOuvidoriaPage() {
  const searchParams = useSearchParams()
  const [protocolo, setProtocolo] = useState(searchParams.get('protocolo') || '')
  const [manifestacao, setManifestacao] = useState<Manifestacao | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const buscar = async () => {
    if (!protocolo.trim()) return
    setLoading(true)
    setError('')
    setManifestacao(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/ouvidoria/acompanhar?protocolo=${protocolo}`)
      const json = await res.json()
      if (json.success) {
        setManifestacao(json.data)
      } else {
        setError(json.error || 'Manifestacao nao encontrada.')
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

  const cfg = manifestacao ? (statusConfig[manifestacao.status] || statusConfig.REGISTRADA) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Link href="/institucional/ouvidoria">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar a Ouvidoria
          </Button>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acompanhar Manifestacao</h1>
          <p className="text-gray-600">Consulte o status da sua manifestacao na Ouvidoria</p>
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

        {searched && !loading && !manifestacao && !error && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma manifestacao encontrada para o protocolo informado.</p>
            </CardContent>
          </Card>
        )}

        {manifestacao && cfg && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Protocolo: {manifestacao.protocolo}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{tipoLabels[manifestacao.tipo] || manifestacao.tipo}</Badge>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Assunto</p>
                    <p className="font-medium">{manifestacao.assunto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data do Registro</p>
                    <p className="font-medium">{new Date(manifestacao.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prazo para Resposta</p>
                    <p className="font-medium">{new Date(manifestacao.prazoResposta).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {!manifestacao.anonimo && manifestacao.nome && (
                    <div>
                      <p className="text-sm text-gray-500">Manifestante</p>
                      <p className="font-medium">{manifestacao.nome}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Descricao</p>
                  <p className="text-gray-700 mt-1">{manifestacao.descricao}</p>
                </div>
              </CardContent>
            </Card>

            {manifestacao.resposta && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Resposta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{manifestacao.resposta}</p>
                  {manifestacao.dataResposta && (
                    <p className="text-sm text-gray-500 mt-2">
                      Respondido em: {new Date(manifestacao.dataResposta).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {(manifestacao.status === 'RESPONDIDA' || manifestacao.status === 'CONCLUIDA') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Avaliacao de Satisfacao
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {manifestacao.satisfacao ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-6 w-6 ${n <= manifestacao.satisfacao! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-2 text-gray-600">{manifestacao.satisfacao}/5</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      A avaliacao de satisfacao estara disponivel apos o encerramento.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {manifestacao.historico && manifestacao.historico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {manifestacao.historico.map((h) => (
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
          </div>
        )}
      </div>
    </div>
  )
}
