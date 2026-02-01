'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar, Loader2, Save } from 'lucide-react'
import { useSessao } from '@/lib/hooks/use-sessoes'
import Link from 'next/link'
import { toast } from 'sonner'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'

export const dynamic = 'force-dynamic'

export default function EditarSessaoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { sessao, loading, error } = useSessao(id || null)

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'ORDINARIA' as 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL',
    data: '',
    horario: '',
    local: '',
    descricao: '',
    status: 'AGENDADA' as 'AGENDADA' | 'EM_ANDAMENTO' | 'SUSPENSA' | 'CONCLUIDA' | 'CANCELADA'
  })

  useEffect(() => {
    if (sessao) {
      const dataObj = new Date(sessao.data)
      // Formatar horário de forma mais segura
      const formatHorario = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      }
      setFormData({
        numero: sessao.numero?.toString() || '',
        tipo: sessao.tipo,
        data: dataObj.toISOString().split('T')[0],
        horario: sessao.horario || formatHorario(dataObj),
        local: sessao.local || '',
        descricao: sessao.descricao || '',
        status: sessao.status
      })
    }
  }, [sessao])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.data) {
      toast.error('A data da sessão é obrigatória')
      return
    }

    if (!formData.local?.trim()) {
      toast.error('O local da sessão é obrigatório')
      return
    }

    // Validar formato do horário
    const horario = formData.horario || '00:00'
    if (!/^\d{2}:\d{2}$/.test(horario)) {
      toast.error('Formato de horário inválido. Use HH:MM')
      return
    }

    try {
      setSaving(true)
      const dataHora = `${formData.data}T${horario}:00`

      const response = await fetch(`/api/sessoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: formData.numero ? parseInt(formData.numero) : undefined,
          tipo: formData.tipo,
          data: dataHora,
          horario: formData.horario,
          local: formData.local,
          descricao: formData.descricao || undefined,
          status: formData.status
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Sessão atualizada com sucesso!')
        // Redirecionar para a página de detalhes usando slug
        const slug = gerarSlugSessao(
          formData.numero ? parseInt(formData.numero) : sessao?.numero || 0,
          formData.data
        )
        router.push(`/admin/sessoes/${slug}`)
      } else {
        toast.error(data.error || 'Erro ao atualizar sessão')
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar sessão')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (error || !sessao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Sessão não encontrada'}</p>
            <Button asChild>
              <Link href="/admin/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Sessões
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const slugSessao = gerarSlugSessao(sessao.numero, sessao.data)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/sessoes/${slugSessao}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Editar Sessão {sessao.numero}ª {sessao.tipo}
          </h1>
          <p className="text-sm text-gray-500">
            Altere os dados da sessão legislativa
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Sessão *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ORDINARIA">Ordinária</option>
                  <option value="EXTRAORDINARIA">Extraordinária</option>
                  <option value="ESPECIAL">Especial</option>
                  <option value="SOLENE">Solene</option>
                </select>
              </div>
              <div>
                <Label htmlFor="numero">Número da Sessão</Label>
                <Input
                  id="numero"
                  type="number"
                  min="1"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data da Sessão *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="horario">Horário</Label>
                <Input
                  id="horario"
                  type="time"
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="local">Local *</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Plenário da Câmara Municipal"
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AGENDADA">Agendada</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da sessão..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/sessoes/${slugSessao}`}>
                  Cancelar
                </Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
