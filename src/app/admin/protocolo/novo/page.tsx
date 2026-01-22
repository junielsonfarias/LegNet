"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  FileText,
  ArrowLeft,
  Save,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

export default function NovoProtocoloPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tipo: 'ENTRADA',
    nomeRemetente: '',
    cpfCnpjRemetente: '',
    tipoRemetente: 'PESSOA_FISICA',
    enderecoRemetente: '',
    telefoneRemetente: '',
    emailRemetente: '',
    assunto: '',
    descricao: '',
    tipoDocumento: '',
    numeroDocOrigem: '',
    prazoResposta: '',
    prioridade: 'NORMAL',
    sigiloso: false
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nomeRemetente.trim()) {
      toast.error('Nome do remetente é obrigatório')
      return
    }

    if (!formData.assunto.trim()) {
      toast.error('Assunto é obrigatório')
      return
    }

    try {
      setLoading(true)

      const payload = {
        ...formData,
        prazoResposta: formData.prazoResposta
          ? new Date(formData.prazoResposta).toISOString()
          : undefined
      }

      const response = await fetch('/api/protocolo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Protocolo ${data.data.numero}/${data.data.ano} criado com sucesso!`)
        router.push(`/admin/protocolo/${data.data.id}`)
      } else {
        toast.error(data.error || 'Erro ao criar protocolo')
      }
    } catch (error) {
      console.error('Erro ao criar protocolo:', error)
      toast.error('Erro ao criar protocolo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/protocolo">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FileText className="h-7 w-7 text-blue-600" />
            Novo Protocolo
          </h1>
          <p className="text-gray-600">
            Registre um novo documento no sistema de protocolo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo e Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação</CardTitle>
            <CardDescription>
              Defina o tipo e prioridade do protocolo
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de Protocolo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saída</SelectItem>
                  <SelectItem value="INTERNO">Interno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => handleChange('prioridade', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sigiloso"
                checked={formData.sigiloso}
                onCheckedChange={(checked) => handleChange('sigiloso', checked)}
              />
              <Label htmlFor="sigiloso" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Documento sigiloso
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Remetente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Remetente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de Remetente</Label>
              <Select
                value={formData.tipoRemetente}
                onValueChange={(value) => handleChange('tipoRemetente', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PESSOA_FISICA">Pessoa Física</SelectItem>
                  <SelectItem value="PESSOA_JURIDICA">Pessoa Jurídica</SelectItem>
                  <SelectItem value="ORGAO_PUBLICO">Órgão Público</SelectItem>
                  <SelectItem value="PARLAMENTAR">Parlamentar</SelectItem>
                  <SelectItem value="EXECUTIVO">Executivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome / Razão Social *</Label>
              <Input
                value={formData.nomeRemetente}
                onChange={(e) => handleChange('nomeRemetente', e.target.value)}
                placeholder="Nome completo ou razão social"
              />
            </div>

            <div className="space-y-2">
              <Label>CPF / CNPJ</Label>
              <Input
                value={formData.cpfCnpjRemetente}
                onChange={(e) => handleChange('cpfCnpjRemetente', e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input
                type="email"
                value={formData.emailRemetente}
                onChange={(e) => handleChange('emailRemetente', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                value={formData.telefoneRemetente}
                onChange={(e) => handleChange('telefoneRemetente', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                value={formData.enderecoRemetente}
                onChange={(e) => handleChange('enderecoRemetente', e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo do Documento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conteúdo do Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(value) => handleChange('tipoDocumento', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFICIO">Ofício</SelectItem>
                    <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                    <SelectItem value="SOLICITACAO">Solicitação</SelectItem>
                    <SelectItem value="DENUNCIA">Denúncia</SelectItem>
                    <SelectItem value="RECLAMACAO">Reclamação</SelectItem>
                    <SelectItem value="SUGESTAO">Sugestão</SelectItem>
                    <SelectItem value="INFORMACAO">Pedido de Informação</SelectItem>
                    <SelectItem value="CONVITE">Convite</SelectItem>
                    <SelectItem value="COMUNICACAO">Comunicação</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número do Documento de Origem</Label>
                <Input
                  value={formData.numeroDocOrigem}
                  onChange={(e) => handleChange('numeroDocOrigem', e.target.value)}
                  placeholder="Ex: OF. 123/2026-GAB"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto *</Label>
              <Input
                value={formData.assunto}
                onChange={(e) => handleChange('assunto', e.target.value)}
                placeholder="Resumo do assunto do documento"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição / Conteúdo</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                placeholder="Descrição detalhada do conteúdo do documento..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prazo para Resposta
              </Label>
              <Input
                type="date"
                value={formData.prazoResposta}
                onChange={(e) => handleChange('prazoResposta', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/protocolo')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Registrar Protocolo
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
