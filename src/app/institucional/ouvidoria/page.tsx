'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MessageSquare, Phone, Mail, MapPin, Clock, Shield, FileText, AlertCircle,
  Loader2, CheckCircle, Copy, Search
} from 'lucide-react'
import Link from 'next/link'

export default function OuvidoriaPage() {
  const [anonimo, setAnonimo] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    tipo: '',
    assunto: '',
    descricao: '',
    setor: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState<{ protocolo: string } | null>(null)
  const [error, setError] = useState('')
  const [protocoloConsulta, setProtocoloConsulta] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setResultado(null)

    try {
      const res = await fetch('/api/ouvidoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          anonimo,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setResultado({ protocolo: json.protocolo })
        setFormData({ nome: '', email: '', telefone: '', cpf: '', tipo: '', assunto: '', descricao: '', setor: '' })
        setAnonimo(false)
      } else {
        setError(json.error || 'Erro ao enviar manifestacao.')
      }
    } catch {
      setError('Erro de conexao. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const tiposManifestacao = [
    { icon: FileText, title: 'Reclamacao', description: 'Relate problemas ou irregularidades nos servicos', color: 'text-camara-primary', bgColor: 'bg-camara-primary/10' },
    { icon: MessageSquare, title: 'Sugestao', description: 'Proponha melhorias para os servicos e processos', color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: Shield, title: 'Denuncia', description: 'Informe irregularidades ou atos ilicitos (pode ser anonima)', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { icon: AlertCircle, title: 'Elogio', description: 'Reconheca bons servicos e atendimentos recebidos', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Ouvidoria</h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Canal de comunicacao direta entre voce e a Camara Municipal.
            Registre suas sugestoes, reclamacoes, elogios ou denuncias.
          </p>
        </div>

        {/* O que e */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-camara-primary flex items-center">
              <MessageSquare className="h-6 w-6 mr-2" />
              O que e a Ouvidoria?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">
              A Ouvidoria da Camara Municipal e um canal de comunicacao direto entre
              os cidadaos e a administracao legislativa. Sua funcao principal e receber,
              registrar e encaminhar manifestacoes, garantindo uma resposta adequada.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Atraves da Ouvidoria, voce pode apresentar reclamacoes, sugestoes, elogios,
              denuncias e solicitar informacoes sobre os servicos prestados.
            </p>
          </CardContent>
        </Card>

        {/* Tipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiposManifestacao.map((tipo) => {
            const Icon = tipo.icon
            return (
              <Card key={tipo.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full ${tipo.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-8 w-8 ${tipo.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tipo.title}</h3>
                  <p className="text-sm text-gray-600">{tipo.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Formulario */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-camara-primary">
              Registre sua Manifestacao
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resultado ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Manifestacao Registrada!</h3>
                <p className="text-gray-600 mb-4">Guarde o numero do protocolo para acompanhamento:</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Badge className="text-2xl py-2 px-4 bg-camara-primary">{resultado.protocolo}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(resultado.protocolo)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button onClick={() => setResultado(null)}>Nova Manifestacao</Button>
                  <Link href={`/institucional/ouvidoria/acompanhar?protocolo=${resultado.protocolo}`}>
                    <Button variant="outline">Acompanhar</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonimo"
                    checked={anonimo}
                    onCheckedChange={(checked) => setAnonimo(checked === true)}
                  />
                  <Label htmlFor="anonimo" className="text-sm text-gray-600">
                    Manifestacao anonima
                  </Label>
                </div>

                {!anonimo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="mt-1"
                        required={!anonimo}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1"
                        required={!anonimo}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="mt-1"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        className="mt-1"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Tipo de Manifestacao *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECLAMACAO">Reclamacao</SelectItem>
                        <SelectItem value="SUGESTAO">Sugestao</SelectItem>
                        <SelectItem value="ELOGIO">Elogio</SelectItem>
                        <SelectItem value="DENUNCIA">Denuncia</SelectItem>
                        <SelectItem value="SOLICITACAO">Solicitacao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Setor</Label>
                    <Input
                      value={formData.setor}
                      onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                      className="mt-1"
                      placeholder="Setor relacionado (opcional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="assunto">Assunto *</Label>
                  <Input
                    id="assunto"
                    value={formData.assunto}
                    onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descricao *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={6}
                    className="mt-1"
                    placeholder="Descreva detalhadamente sua manifestacao..."
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full md:w-auto" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Enviar Manifestacao
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Acompanhar */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Acompanhar Manifestacao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Digite o numero do protocolo"
                value={protocoloConsulta}
                onChange={(e) => setProtocoloConsulta(e.target.value)}
                className="flex-1"
              />
              <Link href={protocoloConsulta ? `/institucional/ouvidoria/acompanhar?protocolo=${protocoloConsulta}` : '#'}>
                <Button disabled={!protocoloConsulta}>
                  <Search className="h-4 w-4 mr-2" />
                  Consultar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <Phone className="h-10 w-10 text-camara-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Telefone</h3>
              <p className="text-gray-600">(93) 3000-0000</p>
              <p className="text-sm text-gray-500 mt-1">Seg-Sex, 8h-14h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <Mail className="h-10 w-10 text-camara-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">E-mail</h3>
              <p className="text-gray-600 text-sm break-all">ouvidoria@camara.gov.br</p>
              <p className="text-sm text-gray-500 mt-1">Resposta em 48h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <MapPin className="h-10 w-10 text-camara-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Presencial</h3>
              <p className="text-gray-600 text-sm">Centro, Mojui dos Campos - PA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <Clock className="h-10 w-10 text-camara-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Horario</h3>
              <p className="text-gray-600">Segunda a Sexta</p>
              <p className="text-gray-600">8:00 as 14:00</p>
            </CardContent>
          </Card>
        </div>

        {/* Prazos */}
        <Card className="border-l-4 border-l-camara-primary">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-camara-primary">Prazos de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { tipo: 'Reclamacao', desc: 'Analise e posicionamento oficial', dias: 15 },
                { tipo: 'Denuncia', desc: 'Investigacao e providencias', dias: 30 },
                { tipo: 'Sugestao/Elogio', desc: 'Confirmacao de recebimento', dias: 5 },
                { tipo: 'Informacao', desc: 'Resposta completa', dias: 10 },
              ].map((item) => (
                <div key={item.tipo} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.tipo}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-camara-primary">{item.dias}</p>
                    <p className="text-sm text-gray-600">dias uteis</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
