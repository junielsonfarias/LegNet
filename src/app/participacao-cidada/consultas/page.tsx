'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Users, MessageSquare, ArrowRight } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Consulta {
  id: string
  titulo: string
  descricao: string
  status: string
  dataInicio: string
  dataFim: string
  permitirAnonimo: boolean
  _count: {
    participacoes: number
    perguntas: number
  }
}

export default function ConsultasPublicasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarConsultas()
  }, [])

  async function carregarConsultas() {
    try {
      const response = await fetch('/api/participacao/consultas?status=ABERTA')
      const data = await response.json()

      if (data.success) {
        setConsultas(data.data.consultas || [])
      }
    } catch (error) {
      console.error('Erro ao carregar consultas:', error)
    } finally {
      setLoading(false)
    }
  }

  const consultasFiltradas = consultas.filter(c =>
    c.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    c.descricao.toLowerCase().includes(busca.toLowerCase())
  )

  const diasRestantes = (dataFim: string) => {
    const dias = differenceInDays(new Date(dataFim), new Date())
    if (dias < 0) return 'Encerrada'
    if (dias === 0) return 'Ultimo dia'
    if (dias === 1) return '1 dia restante'
    return `${dias} dias restantes`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Consultas Publicas
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Participe das consultas publicas e contribua com sua opiniao sobre
            temas importantes para nossa cidade.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Busca */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar consultas..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de Consultas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : consultasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhuma consulta aberta no momento
              </h3>
              <p className="text-gray-500">
                Volte em breve para participar de novas consultas publicas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {consultasFiltradas.map(consulta => (
              <Card key={consulta.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge className="bg-green-100 text-green-700">
                      Aberta
                    </Badge>
                    <span className="text-sm text-orange-600 font-medium">
                      {diasRestantes(consulta.dataFim)}
                    </span>
                  </div>
                  <CardTitle className="mt-2">{consulta.titulo}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {consulta.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Ate {format(new Date(consulta.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{consulta._count.participacoes} participacoes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{consulta._count.perguntas} perguntas</span>
                      </div>
                    </div>
                    {consulta.permitirAnonimo && (
                      <p className="text-xs text-gray-400">
                        Participacao anonima permitida
                      </p>
                    )}
                    <Button asChild className="w-full mt-4">
                      <Link href={`/participacao-cidada/consultas/${consulta.id}`}>
                        Participar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
