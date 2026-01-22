'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ArrowLeft, Lightbulb, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIAS = [
  { value: 'SAUDE', label: 'Saude' },
  { value: 'EDUCACAO', label: 'Educacao' },
  { value: 'SEGURANCA', label: 'Seguranca' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'MEIO_AMBIENTE', label: 'Meio Ambiente' },
  { value: 'CULTURA', label: 'Cultura' },
  { value: 'ESPORTE', label: 'Esporte' },
  { value: 'ASSISTENCIA_SOCIAL', label: 'Assistencia Social' },
  { value: 'URBANISMO', label: 'Urbanismo' },
  { value: 'OUTROS', label: 'Outros' }
]

export default function NovaSugestaoPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    justificativa: '',
    categoria: '',
    nome: '',
    email: '',
    cpf: '',
    bairro: '',
    telefone: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const newErrors: Record<string, string> = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Titulo e obrigatorio'
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descricao e obrigatoria'
    }
    if (!formData.justificativa.trim()) {
      newErrors.justificativa = 'Justificativa e obrigatoria'
    }
    if (!formData.categoria) {
      newErrors.categoria = 'Categoria e obrigatoria'
    }
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome e obrigatorio'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email e obrigatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalido'
    }
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF e obrigatorio'
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 digitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) {
      toast.error('Corrija os erros no formulario')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/participacao/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          descricao: formData.descricao,
          justificativa: formData.justificativa,
          categoria: formData.categoria,
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf.replace(/\D/g, ''),
          bairro: formData.bairro,
          telefone: formData.telefone
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        toast.success('Sugestao enviada com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao enviar sugestao')
      }
    } catch (error) {
      console.error('Erro ao enviar sugestao:', error)
      toast.error('Erro ao enviar sugestao')
    } finally {
      setSubmitting(false)
    }
  }

  function formatCPF(value: string) {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sugestao Enviada!</h2>
            <p className="text-gray-600 mb-6">
              Sua sugestao foi registrada com sucesso e sera analisada pela equipe
              da Camara Municipal. Agradecemos sua participacao!
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/participacao-cidada">
                  Voltar para Participacao Cidada
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmitted(false)
                  setFormData({
                    titulo: '',
                    descricao: '',
                    justificativa: '',
                    categoria: '',
                    nome: '',
                    email: '',
                    cpf: '',
                    bairro: '',
                    telefone: ''
                  })
                }}
              >
                Enviar outra sugestao
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/participacao-cidada"
            className="inline-flex items-center text-yellow-100 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Lightbulb className="h-8 w-8" />
            Nova Sugestao Legislativa
          </h1>
          <p className="mt-2 text-yellow-100">
            Compartilhe sua ideia para melhorar nossa cidade
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Dados da Sugestao */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sua Sugestao</CardTitle>
                  <CardDescription>
                    Descreva sua ideia com o maximo de detalhes possivel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">
                      Titulo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ex: Criacao de ciclovias no centro da cidade"
                      className={errors.titulo ? 'border-red-500' : ''}
                    />
                    {errors.titulo && (
                      <p className="text-sm text-red-500">{errors.titulo}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">
                      Categoria <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={value => setFormData(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger className={errors.categoria ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoria && (
                      <p className="text-sm text-red-500">{errors.categoria}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">
                      Descricao <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descreva detalhadamente sua sugestao..."
                      rows={5}
                      className={errors.descricao ? 'border-red-500' : ''}
                    />
                    {errors.descricao && (
                      <p className="text-sm text-red-500">{errors.descricao}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="justificativa">
                      Justificativa <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="justificativa"
                      value={formData.justificativa}
                      onChange={e => setFormData(prev => ({ ...prev, justificativa: e.target.value }))}
                      placeholder="Por que esta sugestao e importante para a cidade?"
                      rows={4}
                      className={errors.justificativa ? 'border-red-500' : ''}
                    />
                    {errors.justificativa && (
                      <p className="text-sm text-red-500">{errors.justificativa}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dados do Autor */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Seus Dados</CardTitle>
                  <CardDescription>
                    Informacoes para identificacao e contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Seu nome completo"
                      className={errors.nome ? 'border-red-500' : ''}
                    />
                    {errors.nome && (
                      <p className="text-sm text-red-500">{errors.nome}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">
                      CPF <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={e => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={errors.cpf ? 'border-red-500' : ''}
                    />
                    {errors.cpf && (
                      <p className="text-sm text-red-500">{errors.cpf}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Usado apenas para evitar duplicidade
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={e => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                      placeholder="Seu bairro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={e => setFormData(prev => ({ ...prev, telefone: formatPhone(e.target.value) }))}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Sugestao'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Ao enviar, voce concorda com os termos de uso
                    e politica de privacidade.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
