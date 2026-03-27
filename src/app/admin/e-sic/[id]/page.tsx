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
  Loader2, ArrowLeft, Clock, CheckCircle, XCircle,
  AlertTriangle, MessageSquare, FileText, Send
} from 'lucide-react'
import { toast } from 'sonner'

interface SolicitacaoESIC {
  id: string
  protocolo: string
  nome: string
  email: string
  cpf?: string
  telefone?: string
  assunto: string
  descricao: string
  status: string
  prazoResposta: string
  dataProrrogacao?: string
  motivoProrrogacao?: string
  resposta?: string
  respondidoPor?: string
  dataResposta?: string
  formaResposta?: string
  orgao?: string
  tipoSolicitante?: string
  createdAt: string
  historico?: HistoricoESIC[]
  recursos?: RecursoESIC[]
  anexos?: AnexoESIC[]
}

interface HistoricoESIC {
  id: string
  acao: string
  descricao?: string
  usuarioNome?: string
  data: string
}

interface RecursoESIC {
  id: string
  instancia: number
  motivo: string
  status: string
  resposta?: string
  dataRecurso: string
  dataResposta?: string
}

interface AnexoESIC {
  id: string
  arquivo: string
  nome: string
  tipo?: string
}

const statusColors: Record<string, string> = {
  ABERTO: 'bg-blue-100 text-blue-800',
  EM_ANALISE: 'bg-yellow-100 text-yellow-800',
  RESPONDIDO: 'bg-green-100 text-green-800',
  PRORROGADO: 'bg-orange-100 text-orange-800',
  RECURSO: 'bg-purple-100 text-purple-800',
  NEGADO: 'bg-red-100 text-red-800',
  ARQUIVADO: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em Analise',
  RESPONDIDO: 'Respondido',
  PRORROGADO: 'Prorrogado',
  RECURSO: 'Recurso',
  NEGADO: 'Negado',
  ARQUIVADO: 'Arquivado',
}

export default function ESICDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [solicitacao, setSolicitacao] = useState<SolicitacaoESIC | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [dialogType, setDialogType] = useState<'responder' | 'prorrogar' | 'negar' | null>(null)
  const [resposta, setResposta] = useState('')
  const [motivo, setMotivo] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/e-sic/${id}`)
      const json = await res.json()
      if (json.success) {
        setSolicitacao(json.data)
      } else {
        toast.error('Solicitacao nao encontrada')
        router.push('/admin/e-sic')
      }
    } catch {
      toast.error('Erro ao carregar solicitacao')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (acao: string, data: Record<string, string>) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/e-sic/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ...data }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message || 'Acao realizada com sucesso')
        setDialogType(null)
        setResposta('')
        setMotivo('')
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

  const handleAnalisar = () => handleAction('analisar', {})

  const handleResponder = () => {
    if (!resposta.trim()) { toast.error('Preencha a resposta'); return }
    handleAction('responder', { resposta })
  }

  const handleProrrogar = () => {
    if (!motivo.trim()) { toast.error('Preencha o motivo'); return }
    handleAction('prorrogar', { motivo })
  }

  const handleNegar = () => {
    if (!motivo.trim()) { toast.error('Preencha o motivo'); return }
    handleAction('negar', { motivo })
  }

  const maskCPF = (cpf?: string) => {
    if (!cpf) return '-'
    if (cpf.length >= 11) return cpf.slice(0, 3) + '.***.***-' + cpf.slice(-2)
    return cpf
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')
  const formatDateTime = (date: string) => new Date(date).toLocaleString('pt-BR')

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!solicitacao) return null

  const isAtrasado = !['RESPONDIDO', 'ARQUIVADO', 'NEGADO'].includes(solicitacao.status) &&
    new Date(solicitacao.prazoResposta) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/admin/e-sic')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Solicitacao {solicitacao.protocolo}</h1>
          <div className="flex gap-2 mt-1">
            <Badge className={statusColors[solicitacao.status]}>
              {statusLabels[solicitacao.status] || solicitacao.status}
            </Badge>
            {isAtrasado && <Badge className="bg-red-100 text-red-800">ATRASADO</Badge>}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Solicitante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label className="text-muted-foreground">Nome</Label><p className="font-medium">{solicitacao.nome}</p></div>
            <div><Label className="text-muted-foreground">Email</Label><p className="font-medium">{solicitacao.email}</p></div>
            <div><Label className="text-muted-foreground">Telefone</Label><p className="font-medium">{solicitacao.telefone || '-'}</p></div>
            <div><Label className="text-muted-foreground">CPF</Label><p className="font-medium">{maskCPF(solicitacao.cpf)}</p></div>
            <div><Label className="text-muted-foreground">Forma de Resposta</Label><p className="font-medium">{solicitacao.formaResposta || '-'}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados da Solicitacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label className="text-muted-foreground">Protocolo</Label><p className="font-mono font-medium">{solicitacao.protocolo}</p></div>
            <div><Label className="text-muted-foreground">Assunto</Label><p className="font-medium">{solicitacao.assunto}</p></div>
            <div><Label className="text-muted-foreground">Data de Criacao</Label><p className="font-medium">{formatDate(solicitacao.createdAt)}</p></div>
            <div><Label className="text-muted-foreground">Prazo de Resposta</Label>
              <p className={`font-medium ${isAtrasado ? 'text-red-600' : ''}`}>
                {formatDate(solicitacao.prazoResposta)}
                {isAtrasado && ' (VENCIDO)'}
              </p>
            </div>
            {solicitacao.dataResposta && (
              <div><Label className="text-muted-foreground">Data da Resposta</Label><p className="font-medium">{formatDate(solicitacao.dataResposta)}</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Descricao da Solicitacao</CardTitle></CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{solicitacao.descricao}</p>
        </CardContent>
      </Card>

      {/* Response (if exists) */}
      {solicitacao.resposta && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Resposta</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="whitespace-pre-wrap">{solicitacao.resposta}</p>
            {solicitacao.respondidoPor && (
              <p className="text-sm text-muted-foreground">Respondido por: {solicitacao.respondidoPor}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Acoes</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {solicitacao.status === 'ABERTO' && (
              <>
                <Button onClick={handleAnalisar} disabled={actionLoading}>
                  <Clock className="h-4 w-4 mr-2" />Iniciar Analise
                </Button>
                <Button variant="default" onClick={() => setDialogType('responder')} disabled={actionLoading}>
                  <Send className="h-4 w-4 mr-2" />Responder
                </Button>
                <Button variant="destructive" onClick={() => setDialogType('negar')} disabled={actionLoading}>
                  <XCircle className="h-4 w-4 mr-2" />Negar
                </Button>
              </>
            )}
            {solicitacao.status === 'EM_ANALISE' && (
              <>
                <Button variant="default" onClick={() => setDialogType('responder')} disabled={actionLoading}>
                  <Send className="h-4 w-4 mr-2" />Responder
                </Button>
                <Button variant="outline" onClick={() => setDialogType('prorrogar')} disabled={actionLoading}>
                  <AlertTriangle className="h-4 w-4 mr-2" />Prorrogar
                </Button>
                <Button variant="destructive" onClick={() => setDialogType('negar')} disabled={actionLoading}>
                  <XCircle className="h-4 w-4 mr-2" />Negar
                </Button>
              </>
            )}
            {solicitacao.status === 'PRORROGADO' && (
              <>
                <Button variant="default" onClick={() => setDialogType('responder')} disabled={actionLoading}>
                  <Send className="h-4 w-4 mr-2" />Responder
                </Button>
                <Button variant="destructive" onClick={() => setDialogType('negar')} disabled={actionLoading}>
                  <XCircle className="h-4 w-4 mr-2" />Negar
                </Button>
              </>
            )}
            {['RESPONDIDO', 'NEGADO', 'ARQUIVADO'].includes(solicitacao.status) && (
              <p className="text-muted-foreground">Nenhuma acao disponivel para este status.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historico */}
      {solicitacao.historico && solicitacao.historico.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Historico</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {solicitacao.historico.map((h) => (
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

      {/* Recursos */}
      {solicitacao.recursos && solicitacao.recursos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recursos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {solicitacao.recursos.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{r.instancia}a Instancia</Badge>
                    <Badge className={r.status === 'ABERTO' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                      {r.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(r.dataRecurso)}</span>
                  </div>
                  <p className="text-sm mb-2"><strong>Motivo:</strong> {r.motivo}</p>
                  {r.resposta && <p className="text-sm"><strong>Resposta:</strong> {r.resposta}</p>}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anexos */}
      {solicitacao.anexos && solicitacao.anexos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Anexos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {solicitacao.anexos.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <a href={a.arquivo} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {a.nome}
                  </a>
                  {a.tipo && <Badge variant="outline" className="text-xs">{a.tipo}</Badge>}
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
            <DialogTitle>Responder Solicitacao</DialogTitle>
            <DialogDescription>Informe a resposta para o solicitante.</DialogDescription>
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
              <CheckCircle className="h-4 w-4 mr-2" />Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Prorrogar */}
      <Dialog open={dialogType === 'prorrogar'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prorrogar Prazo</DialogTitle>
            <DialogDescription>Informe o motivo da prorrogacao.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Prorrogacao *</Label>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Justifique a prorrogacao..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancelar</Button>
            <Button onClick={handleProrrogar} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Prorrogar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Negar */}
      <Dialog open={dialogType === 'negar'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Negar Solicitacao</DialogTitle>
            <DialogDescription>Informe o motivo da negativa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Negativa *</Label>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Justifique a negativa..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleNegar} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Negar Solicitacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
