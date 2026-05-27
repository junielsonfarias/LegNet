'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, Calendar, Users, FileText, Loader2, ExternalLink } from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Concurso {
  id: string
  titulo: string
  edital: string | null
  descricao: string | null
  dataPublicacao: string
  dataInscricaoInicio: string | null
  dataInscricaoFim: string | null
  dataProva: string | null
  status: string
  vagas: number | null
  arquivo: string | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ABERTO: { label: 'Aberto', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  EM_ANDAMENTO: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  CONCLUIDO: { label: 'Concluido', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
}

export default function ConcursosPage() {
  return (
    <TransparenciaPageWrapper slug="concursos" nome="Concursos e Processos Seletivos">
      <ConcursosPageContent />
    </TransparenciaPageWrapper>
  )
}

function ConcursosPageContent() {
  const [concursos, setConcursos] = useState<Concurso[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('todos')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'todos') params.set('status', statusFilter)

    fetch(`/api/concursos?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setConcursos(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Concursos Publicos</h1>
          <p className="text-gray-600">Editais e processos seletivos da Camara Municipal</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ABERTO">Aberto</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="CONCLUIDO">Concluido</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
          </div>
        ) : concursos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum concurso encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {concursos.map((c) => {
              const config = statusConfig[c.status] || statusConfig.CONCLUIDO
              const isAtivo = c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO'
              return (
                <Card key={c.id} className={`hover:shadow-lg transition-shadow ${isAtivo ? 'border-2 border-green-300' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{c.titulo}</span>
                      <Badge className={config.className}>{config.label}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {c.descricao && (
                      <p className="text-gray-600 mb-4 text-sm">{c.descricao}</p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Publicacao: {new Date(c.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {c.dataInscricaoInicio && c.dataInscricaoFim && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>
                            Inscricoes: {new Date(c.dataInscricaoInicio).toLocaleDateString('pt-BR')} a{' '}
                            {new Date(c.dataInscricaoFim).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {c.dataProva && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Prova: {new Date(c.dataProva).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {c.vagas && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{c.vagas} vaga(s)</span>
                        </div>
                      )}
                    </div>
                    {c.arquivo && (
                      <div className="mt-4">
                        <a href={c.arquivo} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Edital
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
