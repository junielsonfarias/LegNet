'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Pergunta {
  id: string
  ordem: number
  texto: string
  tipo: string
  obrigatoria: boolean
  opcoes: string | null
}

interface Consulta {
  id: string
  titulo: string
  descricao: string
  status: string
  dataInicio: string
  dataFim: string
  permitirAnonimo: boolean
  requerCadastro: boolean
  perguntas: Pergunta[]
  _count: {
    participacoes: number
  }
}

export default function ParticiparConsultaPage() {
  const params = useParams()
  const router = useRouter()
  const consultaId = params.id as string

  const [consulta, setConsulta] = useState<Consulta | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [dadosParticipante, setDadosParticipante] = useState({
    nome: '',
    email: '',
    cpf: '',
    bairro: ''
  })

  const [respostas, setRespostas] = useState<Record<string, string>>({})

  const carregarConsulta = useCallback(async () => {
    try {
      const response = await fetch(`/api/participacao/consultas/${consultaId}`)
      const data = await response.json()

      if (data.success) {
        setConsulta(data.data)
      } else {
        toast.error('Consulta nao encontrada')
        router.push('/participacao-cidada/consultas')
      }
    } catch (error) {
      console.error('Erro ao carregar consulta:', error)
      toast.error('Erro ao carregar consulta')
    } finally {
      setLoading(false)
    }
  }, [consultaId, router])

  useEffect(() => {
    carregarConsulta()
  }, [carregarConsulta])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validar campos obrigatorios
      if (!consulta?.permitirAnonimo && !dadosParticipante.nome) {
        toast.error('Nome e obrigatorio')
        setSubmitting(false)
        return
      }

      // Validar perguntas obrigatorias
      for (const pergunta of consulta?.perguntas || []) {
        if (pergunta.obrigatoria && !respostas[pergunta.id]) {
          toast.error(`A pergunta "${pergunta.texto}" e obrigatoria`)
          setSubmitting(false)
          return
        }
      }

      const response = await fetch(`/api/participacao/consultas/${consultaId}/participar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dadosParticipante,
          respostas: Object.entries(respostas).map(([perguntaId, resposta]) => ({
            perguntaId,
            resposta
          }))
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        toast.success('Participacao registrada com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao registrar participacao')
      }
    } catch (error) {
      console.error('Erro ao submeter:', error)
      toast.error('Erro ao registrar participacao')
    } finally {
      setSubmitting(false)
    }
  }

  const parseOpcoes = (opcoes: string | null): string[] => {
    if (!opcoes) return []
    try {
      return JSON.parse(opcoes)
    } catch (error) {
      // Opções não estão em formato JSON, tentando split por vírgula
      console.debug('Opções não são JSON válido, usando split:', error)
      return opcoes.split(',').map(o => o.trim())
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!consulta) {
    return null
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obrigado pela sua participacao!</h2>
            <p className="text-gray-600 mb-6">
              Sua contribuicao e muito importante para o desenvolvimento da nossa cidade.
            </p>
            <Button asChild>
              <Link href="/participacao-cidada/consultas">
                Ver outras consultas
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isEncerrada = consulta.status !== 'ABERTA' || new Date(consulta.dataFim) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/participacao-cidada/consultas"
            className="inline-flex items-center text-blue-200 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para consultas
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{consulta.titulo}</h1>
          <div className="flex items-center gap-4 mt-3 text-blue-200">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Ate {format(new Date(consulta.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{consulta._count.participacoes} participacoes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isEncerrada ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Esta consulta foi encerrada
              </h3>
              <p className="text-gray-500 mb-4">
                O periodo de participacao terminou em{' '}
                {format(new Date(consulta.dataFim), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <Button asChild variant="outline">
                <Link href="/participacao-cidada/consultas">
                  Ver outras consultas
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Descricao */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre esta consulta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 whitespace-pre-wrap">{consulta.descricao}</p>
                  </CardContent>
                </Card>

                {/* Perguntas */}
                {consulta.perguntas.map((pergunta, index) => (
                  <Card key={pergunta.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {index + 1}. {pergunta.texto}
                        {pergunta.obrigatoria && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pergunta.tipo === 'TEXTO' && (
                        <Textarea
                          placeholder="Digite sua resposta..."
                          value={respostas[pergunta.id] || ''}
                          onChange={e => setRespostas(prev => ({
                            ...prev,
                            [pergunta.id]: e.target.value
                          }))}
                          rows={4}
                        />
                      )}

                      {pergunta.tipo === 'ESCOLHA_UNICA' && (
                        <RadioGroup
                          value={respostas[pergunta.id] || ''}
                          onValueChange={value => setRespostas(prev => ({
                            ...prev,
                            [pergunta.id]: value
                          }))}
                        >
                          {parseOpcoes(pergunta.opcoes).map((opcao, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <RadioGroupItem value={opcao} id={`${pergunta.id}-${i}`} />
                              <Label htmlFor={`${pergunta.id}-${i}`}>{opcao}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {pergunta.tipo === 'MULTIPLA_ESCOLHA' && (
                        <div className="space-y-2">
                          {parseOpcoes(pergunta.opcoes).map((opcao, i) => {
                            const currentValues = respostas[pergunta.id]?.split(',') || []
                            const isChecked = currentValues.includes(opcao)

                            return (
                              <div key={i} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${pergunta.id}-${i}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    let newValues = [...currentValues].filter(v => v)
                                    if (checked) {
                                      newValues.push(opcao)
                                    } else {
                                      newValues = newValues.filter(v => v !== opcao)
                                    }
                                    setRespostas(prev => ({
                                      ...prev,
                                      [pergunta.id]: newValues.join(',')
                                    }))
                                  }}
                                />
                                <Label htmlFor={`${pergunta.id}-${i}`}>{opcao}</Label>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {pergunta.tipo === 'ESCALA' && (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(valor => (
                            <Button
                              key={valor}
                              type="button"
                              variant={respostas[pergunta.id] === String(valor) ? 'default' : 'outline'}
                              onClick={() => setRespostas(prev => ({
                                ...prev,
                                [pergunta.id]: String(valor)
                              }))}
                              className="w-12 h-12"
                            >
                              {valor}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Dados do participante */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Seus dados</CardTitle>
                    <CardDescription>
                      {consulta.permitirAnonimo
                        ? 'Participacao anonima permitida'
                        : 'Preencha seus dados para participar'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">
                        Nome {!consulta.permitirAnonimo && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id="nome"
                        value={dadosParticipante.nome}
                        onChange={e => setDadosParticipante(prev => ({
                          ...prev,
                          nome: e.target.value
                        }))}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={dadosParticipante.email}
                        onChange={e => setDadosParticipante(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={dadosParticipante.bairro}
                        onChange={e => setDadosParticipante(prev => ({
                          ...prev,
                          bairro: e.target.value
                        }))}
                        placeholder="Seu bairro"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? 'Enviando...' : 'Enviar participacao'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
