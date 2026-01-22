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
import { ArrowLeft, Scale, Save } from 'lucide-react'
import { toast } from 'sonner'

const TIPOS_NORMA = [
  { value: 'LEI_ORDINARIA', label: 'Lei Ordinaria' },
  { value: 'LEI_COMPLEMENTAR', label: 'Lei Complementar' },
  { value: 'DECRETO_LEGISLATIVO', label: 'Decreto Legislativo' },
  { value: 'RESOLUCAO', label: 'Resolucao' },
  { value: 'EMENDA_LEI_ORGANICA', label: 'Emenda a Lei Organica' },
  { value: 'LEI_ORGANICA', label: 'Lei Organica' },
  { value: 'REGIMENTO_INTERNO', label: 'Regimento Interno' }
]

const SITUACOES = [
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'REVOGADA', label: 'Revogada' },
  { value: 'REVOGADA_PARCIALMENTE', label: 'Revogada Parcialmente' },
  { value: 'COM_ALTERACOES', label: 'Com Alteracoes' },
  { value: 'SUSPENSA', label: 'Suspensa' }
]

export default function NovaNormaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    tipo: '',
    numero: '',
    ano: new Date().getFullYear().toString(),
    ementa: '',
    texto: '',
    situacao: 'VIGENTE',
    data: '',
    dataPublicacao: '',
    dataVigencia: '',
    assunto: '',
    observacao: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.tipo || !formData.numero || !formData.ementa || !formData.data) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/normas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ano: parseInt(formData.ano),
          data: new Date(formData.data).toISOString(),
          dataPublicacao: formData.dataPublicacao ? new Date(formData.dataPublicacao).toISOString() : null,
          dataVigencia: formData.dataVigencia ? new Date(formData.dataVigencia).toISOString() : null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Norma criada com sucesso!')
        router.push(`/admin/normas/${data.data.id}`)
      } else {
        toast.error(data.error || 'Erro ao criar norma')
      }
    } catch (error) {
      console.error('Erro ao criar norma:', error)
      toast.error('Erro ao criar norma')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/normas"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Scale className="h-7 w-7 text-blue-600" />
            Nova Norma Juridica
          </h1>
          <p className="mt-1 text-gray-600">
            Cadastre uma nova lei, decreto ou resolucao
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Dados Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identificacao</CardTitle>
                <CardDescription>
                  Dados de identificacao da norma juridica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={value => setFormData(prev => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_NORMA.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">
                      Numero <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={e => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="Ex: 1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ano">
                      Ano <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ano"
                      type="number"
                      value={formData.ano}
                      onChange={e => setFormData(prev => ({ ...prev, ano: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ementa">
                    Ementa <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="ementa"
                    value={formData.ementa}
                    onChange={e => setFormData(prev => ({ ...prev, ementa: e.target.value }))}
                    placeholder="Descricao resumida da norma..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto/Indexacao</Label>
                  <Input
                    id="assunto"
                    value={formData.assunto}
                    onChange={e => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                    placeholder="Palavras-chave para busca"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Texto da Norma</CardTitle>
                <CardDescription>
                  Texto integral da norma juridica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.texto}
                  onChange={e => setFormData(prev => ({ ...prev, texto: e.target.value }))}
                  placeholder="Digite ou cole o texto completo da norma..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data">
                    Data da Norma <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataPublicacao">Data de Publicacao</Label>
                  <Input
                    id="dataPublicacao"
                    type="date"
                    value={formData.dataPublicacao}
                    onChange={e => setFormData(prev => ({ ...prev, dataPublicacao: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataVigencia">Inicio da Vigencia</Label>
                  <Input
                    id="dataVigencia"
                    type="date"
                    value={formData.dataVigencia}
                    onChange={e => setFormData(prev => ({ ...prev, dataVigencia: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Situacao</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="situacao">Situacao Atual</Label>
                  <Select
                    value={formData.situacao}
                    onValueChange={value => setFormData(prev => ({ ...prev, situacao: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SITUACOES.map(sit => (
                        <SelectItem key={sit.value} value={sit.value}>
                          {sit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacao">Observacoes</Label>
                  <Textarea
                    id="observacao"
                    value={formData.observacao}
                    onChange={e => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                    placeholder="Observacoes adicionais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Norma'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
