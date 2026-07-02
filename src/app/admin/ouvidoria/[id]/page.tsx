'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
  Loader2, ArrowLeft, CheckCircle, Send, Forward,
  Star, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/lib/hooks/use-confirm-dialog'

interface ManifestacaoOuvidoria {
  id: string
  protocolo: string
  tipo: string
  anonimo: boolean
  nome?: string
  email?: string
  telefone?: string
  cpf?: string
  assunto: string
  descricao: string
  setor?: string
  status: string
  prioridade: string
  prazoResposta: string
  resposta?: string
  respondidoPor?: string
  dataResposta?: string
  satisfacao?: number
  createdAt: string
  historico?: HistoricoOuvidoria[]
  anexos?: AnexoOuvidoria[]
}

interface HistoricoOuvidoria {
  id: string
  acao: string
  descricao?: string
  usuarioNome?: string
  data: string
}

interface AnexoOuvidoria {
  id: string
  arquivo: string
  nome: string
  tipo?: string
}

const statusColors: Record<string, string> = {
  REGISTRADA: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  ENCAMINHADA: 'bg-orange-100 text-orange-800',
  RESPONDIDA: 'bg-green-100 text-green-800',
  CONCLUIDA: 'bg-emerald-100 text-emerald-800',
  ARQUIVADA: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  REGISTRADA: 'Registrada',
  EM_ANALISE: 'Em Analise',
  ENCAMINHADA: 'Encaminhada',
  RESPONDIDA: 'Respondida',
  CONCLUIDA: 'Concluida',
  ARQUIVADA: 'Arquivada',
}

const tipoColors: Record<string, string> = {
  RECLAMACAO: 'bg-red-100 text-red-800',
  SUGESTAO: 'bg-blue-100 text-blue-800',
  ELOGIO: 'bg-green-100 text-green-800',
  DENUNCIA: 'bg-orange-100 text-orange-800',
  SOLICITACAO: 'bg-purple-100 text-purple-800',
}

const tipoLabels: Record<string, string> = {
  RECLAMACAO: 'Reclamacao',
  SUGESTAO: 'Sugestao',
  ELOGIO: 'Elogio',
  DENUNCIA: 'Denuncia',
  SOLICITACAO: 'Solicitacao',
}

const setores = [
  'Gabinete da Presidencia',
  'Secretaria Geral',
  'Assessoria Juridica',
  'Diretoria Legislativa',
  'Diretoria Administrativa',
  'Recursos Humanos',
  'Contabilidade',
  'Comunicacao',
  'Outro',
]

export default function OuvidoriaDetailPage() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [manifestacao, setManifestacao] = useState<ManifestacaoOuvidoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [dialogType, setDialogType] = useState<'responder' | 'encaminhar' | null>(null)
  const [resposta, setResposta] = useState('')
  const [setor, setSetor] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/ouvidoria/${id}`)
      const json = await res.json()
      if (json.success) {
        setManifestacao(json.data)
      } else {
        toast.error('Manifestacao nao encontrada')
        router.push('/admin/ouvidoria')
      }
    } catch {
      toast.error('Erro ao carregar manifestacao')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (acao: string, data: Record<string, string>) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/ouvidoria/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ...data }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message || 'Acao realizada com sucesso')
        setDialogType(null)
        setResposta('')
        setSetor('')
        fetchData()
      } else {
        toast.error(json.error || 'Erro ao executar acao')
      }
    } catch {
      toast.error('Erro ao executar acao')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResponder = () => {
    if (!resposta.trim()) { toast.error('Preencha a resposta'); return }
    handleAction('responder', { resposta })
  }

  const handleEncaminhar = () => {
    if (!setor) { toast.error('Selecione o setor'); return }
    handleAction('encaminhar', { setor })
  }

  const handleConcluir = async () => {
    const ok = await confirm({
      title: 'Concluir manifestação?',
      description: 'A manifestação será marcada como concluída e poderá ser encerrada para auditoria.',
      confirmLabel: 'Concluir',
    })
    if (!ok) return
    handleAction('concluir', {})
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')
  const formatDateTime = (date: string) => new Date(date).toLocaleString('pt-BR')

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!manifestacao) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/admin/ouvidoria')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Manifestacao {manifestacao.protocolo}</h1>
          <div className="flex gap-2 mt-1">
            <Badge className={tipoColors[manifestacao.tipo]}>
              {tipoLabels[manifestacao.tipo] || manifestacao.tipo}
            </Badge>
            <Badge className={statusColors[manifestacao.status]}>
              {statusLabels[manifestacao.status] || manifestacao.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Manifestante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {manifestacao.anonimo ? (
              <p className="text-muted-foreground italic">Manifestacao anonima</p>
            ) : (
              <>
                <div><Label className="text-muted-foreground">Nome</Label><p className="font-medium">{manifestacao.nome || '-'}</p></div>
                <div><Label className="text-muted-foreground">Email</Label><p className="font-medium">{manifestacao.email || '-'}</p></div>
                <div><Label className="text-muted-foreground">Telefone</Label><p className="font-medium">{manifestacao.telefone || '-'}</p></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Manifestacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label className="text-muted-foreground">Protocolo</Label><p className="font-mono font-medium">{manifestacao.protocolo}</p></div>
            <div><Label className="text-muted-foreground">Assunto</Label><p className="font-medium">{manifestacao.assunto}</p></div>
            <div><Label className="text-muted-foreground">Setor</Label><p className="font-medium">{manifestacao.setor || '-'}</p></div>
            <div><Label className="text-muted-foreground">Prioridade</Label><p className="font-medium">{manifestacao.prioridade}</p></div>
            <div><Label className="text-muted-foreground">Data de Criacao</Label><p className="font-medium">{formatDate(manifestacao.createdAt)}</p></div>
            <div><Label className="text-muted-foreground">Prazo de Resposta</Label><p className="font-medium">{formatDate(manifestacao.prazoResposta)}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Descricao</CardTitle></CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{manifestacao.descricao}</p>
        </CardContent>
      </Card>

      {/* Response */}
      {manifestacao.resposta && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Resposta</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="whitespace-pre-wrap">{manifestacao.resposta}</p>
            {manifestacao.respondidoPor && (
              <p className="text-sm text-muted-foreground">Respondido por: {manifestacao.respondidoPor}</p>
            )}
            {manifestacao.dataResposta && (
              <p className="text-sm text-muted-foreground">Data: {formatDate(manifestacao.dataResposta)}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Satisfacao */}
      {manifestacao.satisfacao !== null && manifestacao.satisfacao !== undefined && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Avaliacao de Satisfacao</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`h-6 w-6 ${s <= (manifestacao.satisfacao || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
              ))}
              <span className="ml-2 text-lg font-medium">{manifestacao.satisfacao}/5</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Acoes</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {manifestacao.status === 'REGISTRADA' && (
              <>
                <Button variant="outline" onClick={() => handleAction('analisar', {})} disabled={actionLoading}>
                  <MessageSquare className="h-4 w-4 mr-2" />Analisar
                </Button>
                <Button variant="outline" onClick={() => setDialogType('encaminhar')} disabled={actionLoading}>
                  <Forward className="h-4 w-4 mr-2" />Encaminhar
                </Button>
                <Button onClick={() => setDialogType('responder')} disabled={actionLoading}>
                  <Send className="h-4 w-4 mr-2" />Responder
                </Button>
              </>
            )}
            {manifestacao.status === 'EM_ANALISE' && (
              <>
                <Button variant="outline" onClick={() => setDialogType('encaminhar')} disabled={actionLoading}>
                  <Forward className="h-4 w-4 mr-2" />Encaminhar
                </Button>
                <Button onClick={() => setDialogType('responder')} disabled={actionLoading}>
                  <Send className="h-4 w-4 mr-2" />Responder
                </Button>
              </>
            )}
            {manifestacao.status === 'ENCAMINHADA' && (
              <Button onClick={() => setDialogType('responder')} disabled={actionLoading}>
                <Send className="h-4 w-4 mr-2" />Responder
              </Button>
            )}
            {manifestacao.status === 'RESPONDIDA' && (
              <Button onClick={handleConcluir} disabled={actionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />Concluir
              </Button>
            )}
            {['CONCLUIDA', 'ARQUIVADA'].includes(manifestacao.status) && (
              <p className="text-muted-foreground">Nenhuma acao disponivel para este status.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historico */}
      {manifestacao.historico && manifestacao.historico.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Historico</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {manifestacao.historico.map((h) => (
                <div key={h.id} className="flex gap-3 border-l-2 border-primary/20 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{h.acao}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(h.data)}</span>
                    </div>
                    {h.descricao && <p className="text-sm text-muted-foreground mt-1">{h.descricao}</p>}
                    {h.usuarioNome && <p className="text-xs text-muted-foreground">Por: {h.usuarioNome}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anexos */}
      {manifestacao.anexos && manifestacao.anexos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Anexos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {manifestacao.anexos.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <a href={a.arquivo} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {a.nome}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Responder */}
      <Dialog open={dialogType === 'responder'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Manifestacao</DialogTitle>
            <DialogDescription>Informe a resposta para o manifestante.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Resposta *</Label>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                value={resposta}
                onChange={e => setResposta(e.target.value)}
                placeholder="Digite a resposta..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancelar</Button>
            <Button onClick={handleResponder} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Encaminhar */}
      <Dialog open={dialogType === 'encaminhar'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaminhar Manifestacao</DialogTitle>
            <DialogDescription>Selecione o setor de destino.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Setor *</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={setor}
                onChange={e => setSetor(e.target.value)}
              >
                <option value="">Selecione o setor</option>
                {setores.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancelar</Button>
            <Button onClick={handleEncaminhar} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Encaminhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
