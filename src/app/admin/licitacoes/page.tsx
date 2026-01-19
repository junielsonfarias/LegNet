'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  Loader2,
  X
} from 'lucide-react'
import { useLicitacoes, Licitacao } from '@/lib/hooks/use-licitacoes'
import { toast } from 'sonner'

const modalidades = [
  'PREGAO_ELETRONICO',
  'PREGAO_PRESENCIAL',
  'CONCORRENCIA',
  'TOMADA_DE_PRECOS',
  'CONVITE',
  'CONCURSO',
  'LEILAO',
  'DISPENSA',
  'INEXIGIBILIDADE'
]

const situacoes = [
  'EM_ANDAMENTO',
  'HOMOLOGADA',
  'DESERTA',
  'FRACASSADA',
  'REVOGADA',
  'ANULADA',
  'SUSPENSA'
]

const tiposLicitacao = [
  'MENOR_PRECO',
  'MELHOR_TECNICA',
  'TECNICA_E_PRECO',
  'MAIOR_LANCE'
]

export default function LicitacoesAdminPage() {
  const { licitacoes, loading, create, update, remove } = useLicitacoes()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    numero: '',
    ano: new Date().getFullYear(),
    modalidade: 'PREGAO_ELETRONICO',
    tipo: 'MENOR_PRECO',
    objeto: '',
    valorEstimado: '',
    dataPublicacao: '',
    dataAbertura: '',
    horaAbertura: '',
    dataEntregaPropostas: '',
    situacao: 'EM_ANDAMENTO',
    unidadeGestora: 'Camara Municipal',
    linkEdital: '',
    observacoes: ''
  })

  const resetForm = () => {
    setFormData({
      numero: '',
      ano: new Date().getFullYear(),
      modalidade: 'PREGAO_ELETRONICO',
      tipo: 'MENOR_PRECO',
      objeto: '',
      valorEstimado: '',
      dataPublicacao: '',
      dataAbertura: '',
      horaAbertura: '',
      dataEntregaPropostas: '',
      situacao: 'EM_ANDAMENTO',
      unidadeGestora: 'Camara Municipal',
      linkEdital: '',
      observacoes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.numero || !formData.objeto || !formData.dataAbertura) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    const data = {
      ...formData,
      valorEstimado: formData.valorEstimado ? parseFloat(formData.valorEstimado) : null
    }

    if (editingId) {
      await update(editingId, data)
    } else {
      await create(data)
    }

    resetForm()
  }

  const handleEdit = (licitacao: Licitacao) => {
    setFormData({
      numero: licitacao.numero,
      ano: licitacao.ano,
      modalidade: licitacao.modalidade,
      tipo: licitacao.tipo,
      objeto: licitacao.objeto,
      valorEstimado: licitacao.valorEstimado?.toString() || '',
      dataPublicacao: licitacao.dataPublicacao ? licitacao.dataPublicacao.split('T')[0] : '',
      dataAbertura: licitacao.dataAbertura.split('T')[0],
      horaAbertura: licitacao.horaAbertura || '',
      dataEntregaPropostas: licitacao.dataEntregaPropostas ? licitacao.dataEntregaPropostas.split('T')[0] : '',
      situacao: licitacao.situacao,
      unidadeGestora: licitacao.unidadeGestora || '',
      linkEdital: licitacao.linkEdital || '',
      observacoes: licitacao.observacoes || ''
    })
    setEditingId(licitacao.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta licitacao?')) {
      await remove(id)
    }
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'HOMOLOGADA': return 'bg-green-100 text-green-800'
      case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-800'
      case 'DESERTA':
      case 'FRACASSADA': return 'bg-yellow-100 text-yellow-800'
      case 'REVOGADA':
      case 'ANULADA': return 'bg-red-100 text-red-800'
      case 'SUSPENSA': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLicitacoes = licitacoes.filter(l =>
    l.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.objeto.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Licitacoes</h1>
          <p className="text-muted-foreground">Gerencie as licitacoes da Camara</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Licitacao
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Licitacao' : 'Nova Licitacao'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Numero *</Label>
                  <Input
                    value={formData.numero}
                    onChange={e => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="001/2025"
                  />
                </div>
                <div>
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={formData.ano}
                    onChange={e => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Modalidade</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.modalidade}
                    onChange={e => setFormData({ ...formData, modalidade: e.target.value })}
                  >
                    {modalidades.map(m => (
                      <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    {tiposLicitacao.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Objeto *</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  value={formData.objeto}
                  onChange={e => setFormData({ ...formData, objeto: e.target.value })}
                  placeholder="Descricao do objeto da licitacao"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Valor Estimado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valorEstimado}
                    onChange={e => setFormData({ ...formData, valorEstimado: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Publicacao</Label>
                  <Input
                    type="date"
                    value={formData.dataPublicacao}
                    onChange={e => setFormData({ ...formData, dataPublicacao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Abertura *</Label>
                  <Input
                    type="date"
                    value={formData.dataAbertura}
                    onChange={e => setFormData({ ...formData, dataAbertura: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hora Abertura</Label>
                  <Input
                    type="time"
                    value={formData.horaAbertura}
                    onChange={e => setFormData({ ...formData, horaAbertura: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Situacao</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.situacao}
                    onChange={e => setFormData({ ...formData, situacao: e.target.value })}
                  >
                    {situacoes.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Unidade Gestora</Label>
                  <Input
                    value={formData.unidadeGestora}
                    onChange={e => setFormData({ ...formData, unidadeGestora: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Link do Edital</Label>
                  <Input
                    value={formData.linkEdital}
                    onChange={e => setFormData({ ...formData, linkEdital: e.target.value })}
                    placeholder="URL do edital"
                  />
                </div>
              </div>

              <div>
                <Label>Observacoes</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Criar'} Licitacao
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por numero ou objeto..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLicitacoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma licitacao encontrada
              </p>
            ) : (
              filteredLicitacoes.map(licitacao => (
                <Card key={licitacao.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{licitacao.numero}</span>
                        <Badge className={getSituacaoColor(licitacao.situacao)}>
                          {licitacao.situacao.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {licitacao.modalidade.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{licitacao.objeto}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Abertura: {new Date(licitacao.dataAbertura).toLocaleDateString('pt-BR')}
                        </span>
                        {licitacao.valorEstimado && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {Number(licitacao.valorEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(licitacao)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(licitacao.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
