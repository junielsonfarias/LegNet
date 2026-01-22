"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  FileSignature,
  ArrowLeft,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  AlertTriangle,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import type { EmendaApi } from '@/lib/api/emendas-api'

const TIPO_LABELS: Record<string, string> = {
  'ADITIVA': 'Aditiva',
  'MODIFICATIVA': 'Modificativa',
  'SUPRESSIVA': 'Supressiva',
  'SUBSTITUTIVA': 'Substitutiva',
  'EMENDA_DE_REDACAO': 'De Redacao'
}

const STATUS_LABELS: Record<string, string> = {
  'APRESENTADA': 'Apresentada',
  'EM_ANALISE': 'Em Analise',
  'APROVADA': 'Aprovada',
  'REJEITADA': 'Rejeitada',
  'PREJUDICADA': 'Prejudicada',
  'RETIRADA': 'Retirada',
  'INCORPORADA': 'Incorporada'
}

const STATUS_COLORS: Record<string, string> = {
  'APRESENTADA': 'bg-blue-100 text-blue-700',
  'EM_ANALISE': 'bg-yellow-100 text-yellow-700',
  'APROVADA': 'bg-green-100 text-green-700',
  'REJEITADA': 'bg-red-100 text-red-700',
  'PREJUDICADA': 'bg-gray-100 text-gray-700',
  'RETIRADA': 'bg-orange-100 text-orange-700',
  'INCORPORADA': 'bg-purple-100 text-purple-700'
}

export default function EmendaDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const emendaId = params.id as string

  const [emenda, setEmenda] = useState<EmendaApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [showParecerDialog, setShowParecerDialog] = useState(false)
  const [parecer, setParecer] = useState({
    comissao: '',
    tipo: '' as 'FAVORAVEL' | 'CONTRARIO' | 'FAVORAVEL_COM_RESSALVAS' | '',
    texto: ''
  })

  const carregarEmenda = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/emendas/${emendaId}`)
      const data = await response.json()

      if (data.success) {
        setEmenda(data.data)
      } else {
        toast.error(data.error || 'Erro ao carregar emenda')
      }
    } catch (error) {
      console.error('Erro ao carregar emenda:', error)
      toast.error('Erro ao carregar emenda')
    } finally {
      setLoading(false)
    }
  }, [emendaId])

  useEffect(() => {
    carregarEmenda()
  }, [carregarEmenda])

  const handleAtualizarStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/emendas/${emendaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Status atualizado')
        carregarEmenda()
      } else {
        toast.error(data.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleSalvarParecer = async () => {
    if (!parecer.comissao || !parecer.tipo || !parecer.texto) {
      toast.error('Preencha todos os campos do parecer')
      return
    }

    try {
      const response = await fetch(`/api/emendas/${emendaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parecerComissao: parecer.comissao,
          parecerTipo: parecer.tipo,
          parecerTexto: parecer.texto,
          status: 'EM_ANALISE'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Parecer registrado')
        setShowParecerDialog(false)
        carregarEmenda()
      } else {
        toast.error(data.error || 'Erro ao registrar parecer')
      }
    } catch (error) {
      toast.error('Erro ao registrar parecer')
    }
  }

  const handleRetirar = async () => {
    if (!confirm('Deseja retirar esta emenda?')) return

    try {
      const response = await fetch(`/api/emendas/${emendaId}?acao=retirar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Emenda retirada')
        carregarEmenda()
      } else {
        toast.error(data.error || 'Erro ao retirar emenda')
      }
    } catch (error) {
      toast.error('Erro ao retirar emenda')
    }
  }

  const handlePrejudicar = async () => {
    if (!confirm('Deseja marcar esta emenda como prejudicada?')) return

    try {
      const response = await fetch(`/api/emendas/${emendaId}?acao=prejudicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Emenda prejudicada')
        carregarEmenda()
      } else {
        toast.error(data.error || 'Erro ao prejudicar emenda')
      }
    } catch (error) {
      toast.error('Erro ao prejudicar emenda')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!emenda) {
    return (
      <div className="p-6 text-center text-gray-500">
        Emenda nao encontrada
      </div>
    )
  }

  const referencia = [
    emenda.artigo ? `Art. ${emenda.artigo}` : null,
    emenda.paragrafo ? `§ ${emenda.paragrafo}` : null,
    emenda.inciso ? `Inc. ${emenda.inciso}` : null,
    emenda.alinea ? `Al. ${emenda.alinea}` : null
  ].filter(Boolean).join(', ') || 'Texto geral'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FileSignature className="h-7 w-7 text-blue-600" />
            Emenda EMD-{emenda.numero}
          </h1>
          {emenda.proposicao && (
            <p className="text-gray-600">
              {emenda.proposicao.tipo} {emenda.proposicao.numero}/{emenda.proposicao.ano}
            </p>
          )}
        </div>
        <Badge className={`text-base px-4 py-1 ${STATUS_COLORS[emenda.status]}`}>
          {STATUS_LABELS[emenda.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informacoes Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes da Emenda */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Emenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Tipo</Label>
                  <p className="font-medium">{TIPO_LABELS[emenda.tipo]}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Referencia</Label>
                  <p className="font-medium">{referencia}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Turno de Apresentacao</Label>
                  <p className="font-medium">{emenda.turnoApresentacao}o turno</p>
                </div>
                <div>
                  <Label className="text-gray-500">Data de Criacao</Label>
                  <p className="font-medium">
                    {new Date(emenda.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {emenda.dataVotacao && (
                <div>
                  <Label className="text-gray-500">Data de Votacao</Label>
                  <p className="font-medium">
                    {new Date(emenda.dataVotacao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Texto Original */}
          {emenda.textoOriginal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Texto Original</CardTitle>
                <CardDescription>
                  Texto que sera {emenda.tipo === 'SUPRESSIVA' ? 'suprimido' : 'modificado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="whitespace-pre-wrap">{emenda.textoOriginal}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Texto Novo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Texto Proposto</CardTitle>
              <CardDescription>
                {emenda.tipo === 'SUPRESSIVA'
                  ? 'Dispositivo a ser suprimido'
                  : 'Nova redacao proposta pela emenda'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="whitespace-pre-wrap">{emenda.textoNovo}</p>
              </div>
            </CardContent>
          </Card>

          {/* Justificativa */}
          <Card>
            <CardHeader>
              <CardTitle>Justificativa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">{emenda.justificativa}</p>
            </CardContent>
          </Card>

          {/* Parecer */}
          {emenda.parecerComissao && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Parecer da Comissao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Comissao</Label>
                    <p className="font-medium">{emenda.parecerComissao}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Parecer</Label>
                    <Badge className={
                      emenda.parecerTipo === 'FAVORAVEL' ? 'bg-green-100 text-green-700' :
                      emenda.parecerTipo === 'CONTRARIO' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {emenda.parecerTipo === 'FAVORAVEL' ? 'Favoravel' :
                       emenda.parecerTipo === 'CONTRARIO' ? 'Contrario' :
                       'Favoravel com Ressalvas'}
                    </Badge>
                  </div>
                </div>
                {emenda.parecerTexto && (
                  <div>
                    <Label className="text-gray-500">Fundamentacao</Label>
                    <p className="whitespace-pre-wrap mt-2">{emenda.parecerTexto}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultado da Votacao */}
          {emenda.votos && Object.keys(emenda.votos).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado da Votacao</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <ThumbsUp className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {emenda.votos.SIM || 0}
                    </div>
                    <div className="text-sm text-gray-500">Sim</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <ThumbsDown className="h-6 w-6 mx-auto text-red-600 mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {emenda.votos.NAO || 0}
                    </div>
                    <div className="text-sm text-gray-500">Nao</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <MinusCircle className="h-6 w-6 mx-auto text-gray-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-600">
                      {emenda.votos.ABSTENCAO || 0}
                    </div>
                    <div className="text-sm text-gray-500">Abstencao</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {emenda.votos.AUSENTE || 0}
                    </div>
                    <div className="text-sm text-gray-500">Ausente</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                    <div className="text-2xl font-bold text-orange-600">
                      {emenda.votos.OBSTRUCAO || 0}
                    </div>
                    <div className="text-sm text-gray-500">Obstrucao</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Autor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Autor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emenda.autor ? (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{emenda.autor.nome}</p>
                    {emenda.autor.partido && (
                      <p className="text-sm text-gray-500">{emenda.autor.partido}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Autor nao informado</p>
              )}

              {emenda.coautores && emenda.coautores.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-gray-500">Coautores</Label>
                  <ul className="mt-2 space-y-1">
                    {emenda.coautores.map((coautor, idx) => (
                      <li key={idx} className="text-sm">{coautor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acoes */}
          <Card>
            <CardHeader>
              <CardTitle>Acoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!emenda.parecerComissao && emenda.status === 'APRESENTADA' && (
                <Dialog open={showParecerDialog} onOpenChange={setShowParecerDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Registrar Parecer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Parecer</DialogTitle>
                      <DialogDescription>
                        Registrar parecer da comissao sobre a emenda
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Comissao *</Label>
                        <Select
                          value={parecer.comissao}
                          onValueChange={(value) => setParecer(prev => ({ ...prev, comissao: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a comissao" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLJ">Comissao de Legislacao e Justica</SelectItem>
                            <SelectItem value="COF">Comissao de Orcamento e Financas</SelectItem>
                            <SelectItem value="CES">Comissao de Educacao e Saude</SelectItem>
                            <SelectItem value="COI">Comissao de Obras e Infraestrutura</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Parecer *</Label>
                        <Select
                          value={parecer.tipo}
                          onValueChange={(value: any) => setParecer(prev => ({ ...prev, tipo: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o parecer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FAVORAVEL">Favoravel</SelectItem>
                            <SelectItem value="CONTRARIO">Contrario</SelectItem>
                            <SelectItem value="FAVORAVEL_COM_RESSALVAS">Favoravel com Ressalvas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Fundamentacao *</Label>
                        <Textarea
                          value={parecer.texto}
                          onChange={(e) => setParecer(prev => ({ ...prev, texto: e.target.value }))}
                          placeholder="Fundamentacao do parecer..."
                          rows={5}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowParecerDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSalvarParecer}>
                        Salvar Parecer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {['APRESENTADA', 'EM_ANALISE'].includes(emenda.status) && (
                <>
                  <Button
                    variant="outline"
                    className="w-full text-green-600 hover:text-green-700"
                    onClick={() => handleAtualizarStatus('APROVADA')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={() => handleAtualizarStatus('REJEITADA')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePrejudicar}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Prejudicar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-orange-600 hover:text-orange-700"
                    onClick={handleRetirar}
                  >
                    <History className="mr-2 h-4 w-4" />
                    Retirar
                  </Button>
                </>
              )}

              {emenda.proposicao && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/proposicoes/${emenda.proposicao.id}/emendas`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Todas Emendas
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Emendas Aglutinadas */}
          {emenda.emendasAglutinadas && emenda.emendasAglutinadas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Emendas Aglutinadas</CardTitle>
                <CardDescription>
                  Esta emenda incorporou as seguintes emendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {emenda.emendasAglutinadas.map((em) => (
                    <li key={em.id} className="flex items-center justify-between">
                      <span>EMD-{em.numero}</span>
                      <Badge variant="outline">{TIPO_LABELS[em.tipo]}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {emenda.aglutinada && emenda.emendaAglutinada && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-700">Emenda Incorporada</CardTitle>
                <CardDescription>
                  Esta emenda foi incorporada a outra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="p-0" asChild>
                  <Link href={`/admin/emendas/${emenda.emendaAglutinada.id}`}>
                    Ver EMD-{emenda.emendaAglutinada.numero}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
