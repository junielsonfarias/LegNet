'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  Clock,
  MapPin,
  Play,
  Pause,
  Square,
  Plus,
  Check,
  X,
  Vote,
  AlertCircle,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface Parlamentar {
  id: string
  nome: string
  apelido: string | null
}

interface MembroComissao {
  id: string
  cargo: string
  parlamentar: Parlamentar
}

interface Proposicao {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  autor?: Parlamentar
}

interface ItemPauta {
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  tipo: string
  status: string
  resultado: string | null
  proposicao: Proposicao | null
}

interface Presenca {
  id: string
  presente: boolean
  justificativa: string | null
  horaChegada: string | null
  membro: MembroComissao
}

interface Parecer {
  id: string
  numero: string | null
  tipo: string
  status: string
  votosAFavor: number
  votosContra: number
  votosAbstencao: number
  proposicao: Proposicao
  relator: Parlamentar
}

interface ReuniaoCompleta {
  id: string
  numero: number
  ano: number
  tipo: string
  status: string
  data: string
  horaInicio: string | null
  horaFim: string | null
  local: string | null
  motivoConvocacao: string | null
  pautaTexto: string | null
  ataTexto: string | null
  ataAprovada: boolean
  quorumMinimo: number
  comissao: {
    id: string
    nome: string
    sigla: string | null
    membros: MembroComissao[]
  }
  itens: ItemPauta[]
  presencas: Presenca[]
  pareceres: Parecer[]
}

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada',
  CONVOCADA: 'Convocada',
  EM_ANDAMENTO: 'Em Andamento',
  SUSPENSA: 'Suspensa',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada'
}

const STATUS_COLORS: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700',
  CONVOCADA: 'bg-purple-100 text-purple-700',
  EM_ANDAMENTO: 'bg-green-100 text-green-700',
  SUSPENSA: 'bg-yellow-100 text-yellow-700',
  CONCLUIDA: 'bg-gray-100 text-gray-700',
  CANCELADA: 'bg-red-100 text-red-700'
}

const TIPO_ITEM_LABELS: Record<string, string> = {
  ANALISE_PROPOSICAO: 'Analise de Proposicao',
  VOTACAO_PARECER: 'Votacao de Parecer',
  DESIGNACAO_RELATOR: 'Designacao de Relator',
  COMUNICACAO: 'Comunicacao',
  OUTROS: 'Outros'
}

const STATUS_ITEM_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_DISCUSSAO: 'Em Discussao',
  EM_VOTACAO: 'Em Votacao',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ADIADO: 'Adiado',
  RETIRADO: 'Retirado'
}

export default function ReuniaoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const reuniaoId = params.id as string

  const [reuniao, setReuniao] = useState<ReuniaoCompleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pauta')
  const [quorum, setQuorum] = useState({ atingido: false, presentes: 0, minimo: 2 })

  // Dialogs
  const [dialogItemOpen, setDialogItemOpen] = useState(false)
  const [dialogCancelarOpen, setDialogCancelarOpen] = useState(false)
  const [dialogVotarOpen, setDialogVotarOpen] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [parecerVotacao, setParecerVotacao] = useState<Parecer | null>(null)
  const [votosForm, setVotosForm] = useState({ aFavor: 0, contra: 0, abstencao: 0 })

  // Novo item
  const [novoItem, setNovoItem] = useState({
    titulo: '',
    descricao: '',
    tipo: 'ANALISE_PROPOSICAO',
    proposicaoId: ''
  })

  // Ata
  const [ataTexto, setAtaTexto] = useState('')

  const carregarReuniao = useCallback(async () => {
    try {
      const response = await fetch(`/api/reunioes-comissao/${reuniaoId}`)
      const data = await response.json()

      if (data.success) {
        setReuniao(data.data)
        setAtaTexto(data.data.ataTexto || '')
        // Calcular quorum
        const presentes = data.data.presencas.filter((p: Presenca) => p.presente).length
        setQuorum({
          atingido: presentes >= data.data.quorumMinimo,
          presentes,
          minimo: data.data.quorumMinimo
        })
      }
    } catch (error) {
      console.error('Erro ao carregar reuniao:', error)
      toast.error('Erro ao carregar reuniao')
    } finally {
      setLoading(false)
    }
  }, [reuniaoId])

  useEffect(() => {
    carregarReuniao()
  }, [carregarReuniao])

  async function executarAcao(acao: string, dados?: any) {
    try {
      const response = await fetch(`/api/reunioes-comissao/${reuniaoId}/controle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ...dados })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        carregarReuniao()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Erro ao executar acao:', error)
      toast.error('Erro ao executar acao')
    }
  }

  async function registrarPresenca(membroId: string, presente: boolean) {
    try {
      const response = await fetch(`/api/reunioes-comissao/${reuniaoId}/presenca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membroComissaoId: membroId, presente })
      })

      const data = await response.json()
      if (data.success) {
        setQuorum(data.data.quorum)
        carregarReuniao()
      }
    } catch (error) {
      console.error('Erro ao registrar presenca:', error)
      toast.error('Erro ao registrar presenca')
    }
  }

  async function adicionarItem() {
    if (!novoItem.titulo) {
      toast.error('Titulo e obrigatorio')
      return
    }

    try {
      const response = await fetch(`/api/reunioes-comissao/${reuniaoId}/pauta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Item adicionado a pauta')
        setDialogItemOpen(false)
        setNovoItem({ titulo: '', descricao: '', tipo: 'ANALISE_PROPOSICAO', proposicaoId: '' })
        carregarReuniao()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error)
      toast.error('Erro ao adicionar item')
    }
  }

  async function atualizarStatusItem(itemId: string, status: string) {
    try {
      const response = await fetch(`/api/reunioes-comissao/${reuniaoId}/pauta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Status atualizado')
        carregarReuniao()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      toast.error('Erro ao atualizar item')
    }
  }

  async function votarParecer() {
    if (!parecerVotacao) return

    try {
      await executarAcao('votar_parecer', {
        parecerId: parecerVotacao.id,
        votosAFavor: votosForm.aFavor,
        votosContra: votosForm.contra,
        votosAbstencao: votosForm.abstencao
      })
      setDialogVotarOpen(false)
      setParecerVotacao(null)
      setVotosForm({ aFavor: 0, contra: 0, abstencao: 0 })
    } catch (error) {
      console.error('Erro ao votar parecer:', error)
    }
  }

  async function salvarAta() {
    await executarAcao('salvar_ata', { ataTexto })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!reuniao) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Reunião não encontrada</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  const podeIniciar = reuniao.status === 'AGENDADA' || reuniao.status === 'CONVOCADA'
  const emAndamento = reuniao.status === 'EM_ANDAMENTO'
  const podeCancelar = reuniao.status !== 'CONCLUIDA' && reuniao.status !== 'CANCELADA'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/comissoes/reunioes"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Calendar className="h-7 w-7 text-blue-600" />
            {reuniao.numero}a Reuniao {reuniao.tipo} - {reuniao.ano}
          </h1>
          <p className="mt-1 text-gray-600">
            {reuniao.comissao.sigla ? `${reuniao.comissao.sigla} - ` : ''}
            {reuniao.comissao.nome}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${STATUS_COLORS[reuniao.status]} text-sm px-3 py-1`}>
            {STATUS_LABELS[reuniao.status]}
          </Badge>

          {podeIniciar && (
            <Button
              onClick={() => executarAcao('iniciar')}
              disabled={!quorum.atingido}
              title={!quorum.atingido ? 'Quorum insuficiente' : 'Iniciar reuniao'}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar
            </Button>
          )}

          {emAndamento && (
            <>
              <Button variant="outline" onClick={() => executarAcao('suspender')}>
                <Pause className="h-4 w-4 mr-2" />
                Suspender
              </Button>
              <Button onClick={() => executarAcao('encerrar')}>
                <Square className="h-4 w-4 mr-2" />
                Encerrar
              </Button>
            </>
          )}

          {reuniao.status === 'SUSPENSA' && (
            <Button onClick={() => executarAcao('retomar')}>
              <Play className="h-4 w-4 mr-2" />
              Retomar
            </Button>
          )}

          {podeCancelar && (
            <Button variant="destructive" onClick={() => setDialogCancelarOpen(true)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Data/Hora</p>
                <p className="font-medium">
                  {format(new Date(reuniao.data), "dd/MM/yyyy", { locale: ptBR })}
                  {reuniao.horaInicio && ` as ${format(new Date(reuniao.horaInicio), 'HH:mm')}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Local</p>
                <p className="font-medium">{reuniao.local || 'Nao definido'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Quorum</p>
                <p className={`font-medium ${quorum.atingido ? 'text-green-600' : 'text-red-600'}`}>
                  {quorum.presentes}/{quorum.minimo} {quorum.atingido ? '(Atingido)' : '(Insuficiente)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Itens na Pauta</p>
                <p className="font-medium">{reuniao.itens.length} item(ns)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pauta">
            <FileText className="h-4 w-4 mr-2" />
            Pauta ({reuniao.itens.length})
          </TabsTrigger>
          <TabsTrigger value="presenca">
            <Users className="h-4 w-4 mr-2" />
            Presenca ({quorum.presentes}/{reuniao.comissao.membros.length})
          </TabsTrigger>
          <TabsTrigger value="pareceres">
            <Vote className="h-4 w-4 mr-2" />
            Pareceres ({reuniao.pareceres.length})
          </TabsTrigger>
          <TabsTrigger value="ata">
            <FileText className="h-4 w-4 mr-2" />
            Ata
          </TabsTrigger>
        </TabsList>

        {/* Pauta */}
        <TabsContent value="pauta" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pauta da Reuniao</CardTitle>
                <CardDescription>Itens a serem discutidos</CardDescription>
              </div>
              {reuniao.status !== 'CONCLUIDA' && reuniao.status !== 'CANCELADA' && (
                <Dialog open={dialogItemOpen} onOpenChange={setDialogItemOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Item na Pauta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Titulo *</Label>
                        <Input
                          value={novoItem.titulo}
                          onChange={e => setNovoItem(prev => ({ ...prev, titulo: e.target.value }))}
                          placeholder="Titulo do item"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={novoItem.tipo}
                          onValueChange={value => setNovoItem(prev => ({ ...prev, tipo: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ANALISE_PROPOSICAO">Analise de Proposicao</SelectItem>
                            <SelectItem value="VOTACAO_PARECER">Votacao de Parecer</SelectItem>
                            <SelectItem value="DESIGNACAO_RELATOR">Designacao de Relator</SelectItem>
                            <SelectItem value="COMUNICACAO">Comunicacao</SelectItem>
                            <SelectItem value="OUTROS">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Descricao</Label>
                        <Textarea
                          value={novoItem.descricao}
                          onChange={e => setNovoItem(prev => ({ ...prev, descricao: e.target.value }))}
                          placeholder="Descricao do item..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogItemOpen(false)}>Cancelar</Button>
                      <Button onClick={adicionarItem}>Adicionar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {reuniao.itens.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum item na pauta</p>
              ) : (
                <div className="space-y-3">
                  {reuniao.itens.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{item.titulo}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {TIPO_ITEM_LABELS[item.tipo]}
                            </Badge>
                            <Badge
                              className={
                                item.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                                item.status === 'REJEITADO' ? 'bg-red-100 text-red-700' :
                                item.status === 'EM_VOTACAO' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }
                            >
                              {STATUS_ITEM_LABELS[item.status]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {emAndamento && item.status === 'PENDENTE' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => atualizarStatusItem(item.id, 'EM_DISCUSSAO')}
                          >
                            Discutir
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => atualizarStatusItem(item.id, 'APROVADO')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => atualizarStatusItem(item.id, 'REJEITADO')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presenca */}
        <TabsContent value="presenca" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Presenca</CardTitle>
              <CardDescription>
                Membros da comissao - Quorum minimo: {quorum.minimo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reuniao.comissao.membros.map(membro => {
                  const presenca = reuniao.presencas.find(p => p.membro.id === membro.id)
                  const presente = presenca?.presente ?? false

                  return (
                    <div
                      key={membro.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={presente}
                          onCheckedChange={(checked) => registrarPresenca(membro.id, checked as boolean)}
                          disabled={reuniao.status === 'CONCLUIDA' || reuniao.status === 'CANCELADA'}
                        />
                        <div>
                          <p className="font-medium">
                            {membro.parlamentar.apelido || membro.parlamentar.nome}
                          </p>
                          <p className="text-sm text-gray-500">{membro.cargo}</p>
                        </div>
                      </div>
                      {presente && presenca?.horaChegada && (
                        <span className="text-sm text-gray-500">
                          Chegou: {format(new Date(presenca.horaChegada), 'HH:mm')}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pareceres */}
        <TabsContent value="pareceres" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pareceres para Votacao</CardTitle>
              <CardDescription>Pareceres a serem votados nesta reuniao</CardDescription>
            </CardHeader>
            <CardContent>
              {reuniao.pareceres.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum parecer vinculado</p>
              ) : (
                <div className="space-y-3">
                  {reuniao.pareceres.map(parecer => (
                    <div
                      key={parecer.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          Parecer {parecer.numero || 'S/N'} - {parecer.tipo}
                        </p>
                        <p className="text-sm text-gray-600">
                          {parecer.proposicao.tipo} {parecer.proposicao.numero}/{parecer.proposicao.ano}
                        </p>
                        <p className="text-sm text-gray-500">
                          Relator: {parecer.relator.nome}
                        </p>
                        {parecer.votosAFavor > 0 && (
                          <p className="text-sm mt-1">
                            Votos: {parecer.votosAFavor} a favor, {parecer.votosContra} contra, {parecer.votosAbstencao} abstencoes
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            parecer.status === 'APROVADO_COMISSAO' ? 'bg-green-100 text-green-700' :
                            parecer.status === 'REJEITADO_COMISSAO' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }
                        >
                          {parecer.status}
                        </Badge>

                        {emAndamento && parecer.status === 'AGUARDANDO_VOTACAO' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setParecerVotacao(parecer)
                              setVotosForm({ aFavor: 0, contra: 0, abstencao: 0 })
                              setDialogVotarOpen(true)
                            }}
                          >
                            <Vote className="h-4 w-4 mr-2" />
                            Votar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ata */}
        <TabsContent value="ata" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ata da Reuniao</CardTitle>
              <CardDescription>
                {reuniao.ataAprovada ? 'Ata aprovada' : 'Redija a ata da reuniao'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={ataTexto}
                onChange={e => setAtaTexto(e.target.value)}
                placeholder="Digite a ata da reuniao..."
                rows={15}
                disabled={reuniao.ataAprovada}
                className="font-mono text-sm"
              />

              {!reuniao.ataAprovada && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={salvarAta}>
                    Salvar Rascunho
                  </Button>
                  {reuniao.status === 'CONCLUIDA' && ataTexto && (
                    <Button onClick={() => executarAcao('aprovar_ata')}>
                      Aprovar Ata
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Cancelar */}
      <AlertDialog open={dialogCancelarOpen} onOpenChange={setDialogCancelarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reuniao</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo do cancelamento. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={motivoCancelamento}
              onChange={e => setMotivoCancelamento(e.target.value)}
              placeholder="Motivo do cancelamento..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                executarAcao('cancelar', { motivo: motivoCancelamento })
                setDialogCancelarOpen(false)
              }}
              disabled={!motivoCancelamento}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Votar Parecer */}
      <Dialog open={dialogVotarOpen} onOpenChange={setDialogVotarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Votar Parecer</DialogTitle>
            <DialogDescription>
              {parecerVotacao && `Parecer sobre ${parecerVotacao.proposicao.tipo} ${parecerVotacao.proposicao.numero}/${parecerVotacao.proposicao.ano}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>A Favor</Label>
                <Input
                  type="number"
                  min="0"
                  value={votosForm.aFavor}
                  onChange={e => setVotosForm(prev => ({ ...prev, aFavor: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contra</Label>
                <Input
                  type="number"
                  min="0"
                  value={votosForm.contra}
                  onChange={e => setVotosForm(prev => ({ ...prev, contra: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Abstencoes</Label>
                <Input
                  type="number"
                  min="0"
                  value={votosForm.abstencao}
                  onChange={e => setVotosForm(prev => ({ ...prev, abstencao: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Resultado previsto: {votosForm.aFavor > votosForm.contra ? 'APROVADO' : votosForm.contra > votosForm.aFavor ? 'REJEITADO' : 'EMPATE'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVotarOpen(false)}>Cancelar</Button>
            <Button onClick={votarParecer}>Registrar Votacao</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
