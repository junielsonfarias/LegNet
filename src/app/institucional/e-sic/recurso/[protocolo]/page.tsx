'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Loader2, CheckCircle, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

interface Solicitacao {
  id: string
  protocolo: string
  assunto: string
  status: string
}

export default function RecursoESicPage() {
  const params = useParams()
  const protocolo = params.protocolo as string
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [motivo, setMotivo] = useState('')
  const [instancia, setInstancia] = useState('1')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/e-sic/acompanhar?protocolo=${protocolo}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSolicitacao(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [protocolo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!solicitacao || !motivo.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/e-sic/${solicitacao.id}/recurso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, instancia: parseInt(instancia) }),
      })
      const json = await res.json()
      if (json.success) {
        setSucesso(true)
      } else {
        setError(json.error || 'Erro ao registrar recurso.')
      }
    } catch {
      setError('Erro de conexao. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  if (!solicitacao) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Solicitacao nao encontrada para o protocolo: {protocolo}</p>
          <Link href="/institucional/e-sic">
            <Button className="mt-4">Voltar ao E-SIC</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link href={`/institucional/e-sic/acompanhar?protocolo=${protocolo}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interpor Recurso</h1>
          <p className="text-gray-600">Protocolo: {protocolo}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-camara-primary" />
            <div>
              <p className="font-medium">{solicitacao.assunto}</p>
              <Badge variant="outline">{solicitacao.status}</Badge>
            </div>
          </CardContent>
        </Card>

        {sucesso ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Recurso Registrado!</h3>
              <p className="text-gray-600 mb-6">
                Seu recurso foi registrado com sucesso. Acompanhe o andamento pelo protocolo.
              </p>
              <Link href={`/institucional/e-sic/acompanhar?protocolo=${protocolo}`}>
                <Button>Acompanhar Solicitacao</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Formulario de Recurso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Instancia do Recurso</Label>
                  <Select value={instancia} onValueChange={setInstancia}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1a Instancia - Autoridade Superior</SelectItem>
                      <SelectItem value="2">2a Instancia - Controladoria</SelectItem>
                      <SelectItem value="3">3a Instancia - CGU/CMRI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo do Recurso *</Label>
                  <Textarea
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Descreva os motivos pelos quais voce discorda da resposta ou negativa..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting || !motivo.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Recurso'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
