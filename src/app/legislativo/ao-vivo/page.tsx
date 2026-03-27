'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Video, Radio, Calendar, Clock, Loader2, FileText } from 'lucide-react'

interface PautaItem {
  ordem: number
  descricao: string
  proposicao?: {
    id: string
    tipo: string
    numero: number
    ano: number
    ementa: string
  } | null
}

interface SessaoAoVivo {
  id: string
  tipo: string
  titulo: string
  dataInicio: string
  urlTransmissao: string | null
  pauta: PautaItem[]
}

interface ProximaSessao {
  id: string
  tipo: string
  dataInicio: string
  titulo: string
}

export default function AoVivoPage() {
  const [aoVivo, setAoVivo] = useState(false)
  const [sessao, setSessao] = useState<SessaoAoVivo | null>(null)
  const [proximaSessao, setProximaSessao] = useState<ProximaSessao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/publico/sessao-ao-vivo')
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setAoVivo(json.aoVivo)
            if (json.aoVivo) {
              setSessao(json.sessao)
            } else {
              setProximaSessao(json.proximaSessao)
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }

    fetchData()
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`
    return url
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Video className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sessao ao Vivo
          </h1>
          <p className="text-xl text-gray-600">
            Acompanhe as sessoes da Camara Municipal em tempo real
          </p>
        </div>

        {aoVivo && sessao ? (
          <div className="space-y-6">
            {/* Live Badge */}
            <div className="flex justify-center">
              <Badge className="bg-red-600 text-white text-lg py-1 px-4 hover:bg-red-600">
                <Radio className="h-4 w-4 mr-2 animate-pulse" />
                AO VIVO
              </Badge>
            </div>

            {/* Player */}
            {sessao.urlTransmissao ? (
              <Card className="overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src={getYouTubeEmbedUrl(sessao.urlTransmissao) || sessao.urlTransmissao}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Transmissao ao vivo"
                  />
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Link de transmissao nao disponivel no momento.</p>
                </CardContent>
              </Card>
            )}

            {/* Info da sessao */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {sessao.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(sessao.dataInicio).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(sessao.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <Badge variant="outline">{sessao.tipo}</Badge>
                </div>

                {sessao.pauta && sessao.pauta.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Pauta da Sessao</h3>
                    <div className="space-y-2">
                      {sessao.pauta.map((item) => (
                        <div key={item.ordem} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-shrink-0 w-8 h-8 bg-camara-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-camara-primary">
                            {item.ordem}
                          </span>
                          <div>
                            <p className="text-sm text-gray-700">{item.descricao}</p>
                            {item.proposicao && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.proposicao.tipo} {item.proposicao.numero}/{item.proposicao.ano} - {item.proposicao.ementa}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <Video className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Nenhuma sessao ao vivo no momento
                </h2>

                {proximaSessao ? (
                  <div className="mt-6 p-6 bg-camara-primary/5 rounded-lg">
                    <h3 className="font-semibold text-camara-primary mb-3">Proxima Sessao Agendada</h3>
                    <p className="text-lg font-medium text-gray-900 mb-2">{proximaSessao.titulo}</p>
                    <div className="flex items-center justify-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(proximaSessao.dataInicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(proximaSessao.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <Badge variant="outline">{proximaSessao.tipo}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Nao ha sessoes agendadas no momento.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
