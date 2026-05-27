'use client'

import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CaptchaChallenge, type CaptchaChallengeHandle, type CaptchaValue } from '@/components/ui/captcha-challenge'
import {
  Shield, FileText, Clock, CheckCircle, AlertCircle, Search, Loader2, Copy,
  BarChart3, BookOpen, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function ESicPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    tipoSolicitante: '',
    assunto: '',
    descricao: '',
    orgao: '',
    formaResposta: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState<{ protocolo: string; prazoResposta: string } | null>(null)
  const [error, setError] = useState('')
  const [protocoloConsulta, setProtocoloConsulta] = useState('')

  // F1.2 — captcha matematico publico
  const [captcha, setCaptcha] = useState<CaptchaValue>({ captchaId: '', captchaAnswer: '' })
  const [captchaError, setCaptchaError] = useState(false)
  const captchaRef = useRef<CaptchaChallengeHandle>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setCaptchaError(false)
    setResultado(null)

    try {
      const res = await fetch('/api/e-sic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaId: captcha.captchaId,
          captchaAnswer: captcha.captchaAnswer,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setResultado({ protocolo: json.protocolo, prazoResposta: json.prazoResposta })
        setFormData({ nome: '', email: '', cpf: '', telefone: '', tipoSolicitante: '', assunto: '', descricao: '', orgao: '', formaResposta: '' })
      } else {
        const msg = json.error || 'Erro ao enviar solicitacao.'
        if (/captcha/i.test(msg)) {
          setCaptchaError(true)
          void captchaRef.current?.reload()
        }
        setError(msg)
      }
    } catch {
      setError('Erro de conexao. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const perguntasFrequentes = [
    {
      pergunta: 'O que e o E-SIC?',
      resposta: 'O E-SIC (Sistema Eletronico do Servico de Informacao ao Cidadao) e uma ferramenta que permite ao cidadao solicitar informacoes publicas de forma online, conforme previsto na Lei de Acesso a Informacao (Lei 12.527/2011).',
    },
    {
      pergunta: 'Quem pode utilizar o E-SIC?',
      resposta: 'Qualquer pessoa, fisica ou juridica, pode utilizar o sistema para solicitar informacoes publicas, sem necessidade de justificativa do pedido.',
    },
    {
      pergunta: 'Qual o prazo para resposta?',
      resposta: 'O orgao tem ate 20 dias para responder a solicitacao, podendo ser prorrogado por mais 10 dias mediante justificativa.',
    },
    {
      pergunta: 'E necessario pagar alguma taxa?',
      resposta: 'Nao. O acesso as informacoes publicas e gratuito, exceto quando houver necessidade de reproducao de documentos.',
    },
    {
      pergunta: 'Posso solicitar qualquer informacao?',
      resposta: 'Sim, desde que seja uma informacao publica. Algumas informacoes podem ter restricoes de acesso por questoes de seguranca nacional, sigilo fiscal, etc.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-16 w-16 text-camara-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            E-SIC - Sistema Eletronico de Informacao ao Cidadao
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Exercite seu direito de acesso a informacao publica de forma rapida,
            transparente e eficiente.
          </p>
        </div>

        {/* LAI Banner */}
        <Card className="mb-12 bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <Shield className="h-16 w-16 text-white flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Lei de Acesso a Informacao</h2>
                <p className="text-lg opacity-90">
                  A Lei 12.527/2011 garante o direito fundamental de acesso as informacoes publicas,
                  promovendo a transparencia e o controle social.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Servicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-camara-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-camara-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Solicitar Informacao</h3>
              <p className="text-gray-600 mb-4">Solicite informacoes publicas pelo formulario abaixo</p>
              <Button onClick={() => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })}>
                Solicitar
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Acompanhar Pedido</h3>
              <p className="text-gray-600 mb-4">Consulte o status de suas solicitacoes</p>
              <Button variant="outline" onClick={() => document.getElementById('acompanhar')?.scrollIntoView({ behavior: 'smooth' })}>
                Consultar
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Recursos</h3>
              <p className="text-gray-600 mb-4">Interponha recursos em caso de negativa</p>
              <Link href="/institucional/e-sic/acompanhar">
                <Button variant="outline">Acessar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Acesso rapido a normativa e estatisticas (PNTP 12.5, 12.6, 12.7) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link href="/transparencia/e-sic/normativa" className="group">
            <Card className="h-full hover:shadow-md transition-shadow border-l-4 border-l-camara-primary">
              <CardContent className="p-5 flex items-start gap-3">
                <BookOpen className="h-8 w-8 text-camara-primary flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-camara-primary mb-1">
                    Marco Normativo da LAI
                  </h3>
                  <p className="text-sm text-gray-600">
                    Regulamento local, prazos, autoridades competentes e procedimento de recurso.
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-camara-primary flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/transparencia/e-sic/estatisticas" className="group">
            <Card className="h-full hover:shadow-md transition-shadow border-l-4 border-l-camara-secondary">
              <CardContent className="p-5 flex items-start gap-3">
                <BarChart3 className="h-8 w-8 text-camara-secondary flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-camara-secondary mb-1">
                    Estatisticas do e-SIC
                  </h3>
                  <p className="text-sm text-gray-600">
                    Relatorio anual com pedidos recebidos, atendidos, indeferidos e prazos.
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-camara-secondary flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/transparencia/informacoes-classificadas" className="group">
            <Card className="h-full hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
              <CardContent className="p-5 flex items-start gap-3">
                <Shield className="h-8 w-8 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 mb-1">
                    Informacoes Classificadas
                  </h3>
                  <p className="text-sm text-gray-600">
                    Rol de documentos com grau de sigilo e lista de desclassificados.
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-amber-600 flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Formulario */}
        <div id="formulario" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Solicitar Informacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultado ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Solicitacao Enviada!</h3>
                  <p className="text-gray-600 mb-4">Guarde o numero do protocolo para acompanhamento:</p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge className="text-2xl py-2 px-4 bg-camara-primary">{resultado.protocolo}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(resultado.protocolo)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    Prazo para resposta: {new Date(resultado.prazoResposta).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button onClick={() => setResultado(null)}>Nova Solicitacao</Button>
                    <Link href={`/institucional/e-sic/acompanhar?protocolo=${resultado.protocolo}`}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Solicitante</Label>
                      <Select
                        value={formData.tipoSolicitante}
                        onValueChange={(v) => setFormData({ ...formData, tipoSolicitante: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pessoa_fisica">Pessoa Fisica</SelectItem>
                          <SelectItem value="pessoa_juridica">Pessoa Juridica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Forma de Resposta</Label>
                      <Select
                        value={formData.formaResposta}
                        onValueChange={(v) => setFormData({ ...formData, formaResposta: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="correspondencia">Correspondencia</SelectItem>
                          <SelectItem value="presencial">Presencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto *</Label>
                    <Input
                      id="assunto"
                      value={formData.assunto}
                      onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descricao da Solicitacao *</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva detalhadamente a informacao que deseja solicitar..."
                      rows={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Orgao/Entidade</Label>
                    <Select
                      value={formData.orgao}
                      onValueChange={(v) => setFormData({ ...formData, orgao: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o orgao" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camara">Camara Municipal</SelectItem>
                        <SelectItem value="prefeitura">Prefeitura Municipal</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <CaptchaChallenge
                    ref={captchaRef}
                    value={captcha}
                    onChange={setCaptcha}
                    hasError={captchaError}
                    errorMessage={captchaError ? 'Resposta incorreta. Tente novamente com o novo desafio.' : undefined}
                  />

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitacao'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acompanhar */}
        <div id="acompanhar" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Acompanhar Pedido
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
                <Link href={protocoloConsulta ? `/institucional/e-sic/acompanhar?protocolo=${protocoloConsulta}` : '#'}>
                  <Button disabled={!protocoloConsulta}>
                    <Search className="h-4 w-4 mr-2" />
                    Consultar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-8 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {perguntasFrequentes.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-camara-primary" />
                    {item.pergunta}
                  </h3>
                  <p className="text-gray-700">{item.resposta}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contato */}
        <Card className="bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Precisa de Ajuda?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Contato E-SIC</h3>
                <p className="opacity-90 mb-1"><strong>E-mail:</strong> {configuracao.email || 'Não configurado'}</p>
                <p className="opacity-90 mb-1"><strong>Telefone:</strong> {configuracao.telefone || 'Não configurado'}</p>
                <p className="opacity-90"><strong>Horário:</strong> Segunda a Sexta</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ouvidoria</h3>
                <p className="opacity-90 mb-1"><strong>E-mail:</strong> {configuracao.email || 'Não configurado'}</p>
                <p className="opacity-90 mb-1"><strong>Telefone:</strong> {configuracao.telefone || 'Não configurado'}</p>
                <p className="opacity-90"><strong>Horário:</strong> Segunda a Sexta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
