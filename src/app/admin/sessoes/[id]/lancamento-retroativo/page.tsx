'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Save,
  AlertCircle,
  Vote,
  Users,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  XCircle,
  Info,
  History,
  Plus,
  PenLine,
  ClipboardList
} from 'lucide-react'
import { useSessao } from '@/lib/hooks/use-sessoes'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import { PautaEditor } from '@/components/admin/pauta-editor'

export const dynamic = 'force-dynamic'

type TipoVoto = 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE' | null

interface VotoParlamentar {
  parlamentarId: string
  nome: string
  apelido?: string
  presente: boolean
  voto: TipoVoto
  votoAnterior?: TipoVoto
}

interface ItemPauta {
  id: string
  titulo: string
  ordem: number
  secao: string
  status: string
  proposicao?: {
    id: string
    numero: string
    ano: number
    tipo: string
    titulo: string
    status: string
  }
  tipoVotacao?: string
}

export default function LancamentoRetroativoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { sessao, loading, error } = useSessao(id || null)

  const [itemSelecionado, setItemSelecionado] = useState<ItemPauta | null>(null)
  const [votos, setVotos] = useState<VotoParlamentar[]>([])
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregandoVotos, setCarregandoVotos] = useState(false)
  const [editandoPauta, setEditandoPauta] = useState(false)
  const [alterandoStatus, setAlterandoStatus] = useState<string | null>(null)

  // Alterar status diretamente (sem votos individuais)
  const alterarStatusItem = async (itemId: string, novoStatus: 'APROVADO' | 'REJEITADO' | 'ADIADO' | 'RETIRADO') => {
    setAlterandoStatus(itemId)
    try {
      const response = await fetch(`/api/pauta/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novoStatus,
          observacoes: `Status alterado retroativamente para ${novoStatus}`
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao alterar status')
      }

      toast.success(`Item marcado como ${novoStatus}`)
      router.refresh()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status')
    } finally {
      setAlterandoStatus(null)
    }
  }

  // Carregar votos existentes quando item for selecionado
  const carregarVotosExistentes = useCallback(async (proposicaoId: string) => {
    if (!sessao) return

    setCarregandoVotos(true)
    try {
      // Buscar votos existentes da API
      const response = await fetch(`/api/sessoes/${id}/votacao`)
      if (response.ok) {
        const data = await response.json()
        const proposicaoData = data.data?.find((p: any) => p.id === proposicaoId)

        // Criar lista de parlamentares presentes com votos
        const parlamentaresComVoto: VotoParlamentar[] = (sessao.presencas || []).map(p => {
          const votoExistente = proposicaoData?.votacoes?.find(
            (v: any) => v.parlamentarId === p.parlamentar.id
          )
          return {
            parlamentarId: p.parlamentar.id,
            nome: p.parlamentar?.nome || 'Parlamentar',
            apelido: p.parlamentar?.apelido ?? undefined,
            presente: p.presente,
            voto: votoExistente?.voto || (p.presente ? null : 'AUSENTE'),
            votoAnterior: votoExistente?.voto || null
          }
        })

        // Ordenar: presentes primeiro, depois por nome
        parlamentaresComVoto.sort((a, b) => {
          if (a.presente !== b.presente) return a.presente ? -1 : 1
          return (a.apelido || a.nome).localeCompare(b.apelido || b.nome)
        })

        setVotos(parlamentaresComVoto)
      }
    } catch (err) {
      console.error('Erro ao carregar votos:', err)
      toast.error('Erro ao carregar votos existentes')
    } finally {
      setCarregandoVotos(false)
    }
  }, [sessao, id])

  // Quando seleciona um item
  useEffect(() => {
    if (itemSelecionado?.proposicao?.id) {
      carregarVotosExistentes(itemSelecionado.proposicao.id)
    }
  }, [itemSelecionado, carregarVotosExistentes])

  // Atualizar voto de um parlamentar
  const atualizarVoto = (parlamentarId: string, novoVoto: TipoVoto) => {
    setVotos(prev => prev.map(v =>
      v.parlamentarId === parlamentarId
        ? { ...v, voto: novoVoto }
        : v
    ))
  }

  // Limpar voto de um parlamentar
  const limparVoto = (parlamentarId: string) => {
    setVotos(prev => prev.map(v =>
      v.parlamentarId === parlamentarId
        ? { ...v, voto: v.presente ? null : 'AUSENTE' }
        : v
    ))
  }

  // Calcular resumo
  const calcularResumo = () => {
    const votosValidos = votos.filter(v => v.presente)
    return {
      sim: votosValidos.filter(v => v.voto === 'SIM').length,
      nao: votosValidos.filter(v => v.voto === 'NAO').length,
      abstencao: votosValidos.filter(v => v.voto === 'ABSTENCAO').length,
      pendentes: votosValidos.filter(v => v.voto === null).length,
      ausentes: votos.filter(v => !v.presente).length,
      total: votosValidos.length
    }
  }

  const resumo = calcularResumo()

  // Calcular resultado
  const calcularResultado = () => {
    if (resumo.pendentes > 0) return null
    if (resumo.sim > resumo.nao) return 'APROVADO'
    if (resumo.nao > resumo.sim) return 'REJEITADO'
    return 'EMPATE'
  }

  const resultado = calcularResultado()

  // Salvar votacao
  const salvarVotacao = async () => {
    if (!itemSelecionado?.proposicao?.id || !motivo.trim()) {
      toast.error('Informe o motivo do lancamento retroativo')
      return
    }

    if (resumo.pendentes > 0) {
      toast.error('Todos os parlamentares presentes devem ter seu voto registrado')
      return
    }

    setSalvando(true)
    try {
      const votosParaEnviar = votos
        .filter(v => v.presente && v.voto && v.voto !== 'AUSENTE')
        .map(v => ({
          parlamentarId: v.parlamentarId,
          voto: v.voto as 'SIM' | 'NAO' | 'ABSTENCAO'
        }))

      const response = await fetch(`/api/sessoes/${id}/votacao/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposicaoId: itemSelecionado.proposicao.id,
          itemPautaId: itemSelecionado.id,
          votos: votosParaEnviar,
          motivo: motivo.trim(),
          finalizarVotacao: true,
          resultado: resultado
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar votacao')
      }

      toast.success('Votacao registrada com sucesso!')

      // Limpar selecao e recarregar dados
      setItemSelecionado(null)
      setMotivo('')
      router.refresh()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar votacao')
    } finally {
      setSalvando(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando sessao...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error || !sessao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Sessão não encontrada'}</p>
            <Button asChild>
              <Link href="/admin/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Gerar slug amigável para URLs
  const slugSessao = gerarSlugSessao(sessao.numero, sessao.data)

  // Validar que sessao esta CONCLUIDA
  if (sessao.status !== 'CONCLUIDA') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Sessao nao concluida</h2>
            <p className="text-gray-600 mb-4">
              O lancamento retroativo de votacoes so e permitido para sessoes ja concluidas.
              Esta sessao esta com status: <Badge>{sessao.status}</Badge>
            </p>
            <Button asChild>
              <Link href={`/admin/sessoes/${slugSessao}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Sessao
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Itens da pauta com proposicao
  const itensPauta: ItemPauta[] = (sessao.pautaSessao?.itens || [])
    .filter((item: any) => item.proposicao)
    .map((item: any) => ({
      id: item.id,
      titulo: item.titulo,
      ordem: item.ordem,
      secao: item.secao,
      status: item.status,
      proposicao: item.proposicao,
      tipoVotacao: item.tipoVotacao
    }))

  const presentes = (sessao.presencas || []).filter(p => p.presente).length
  const totalParlamentares = (sessao.presencas || []).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href={`/admin/sessoes/${slugSessao}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Lancamento Retroativo de Votacoes
            </h1>
            <Badge className="bg-amber-100 text-amber-800">
              <History className="h-3 w-3 mr-1" />
              Retroativo
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {sessao.numero}a Sessao {sessao.tipo}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(sessao.data).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {presentes} de {totalParlamentares} presentes
            </span>
          </div>
        </div>
      </div>

      {/* Alerta informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Lancamento de dados preteritos</AlertTitle>
        <AlertDescription>
          Este recurso permite registrar ou corrigir votacoes de sessoes ja concluidas.
          Todas as alteracoes serao auditadas com data, hora, usuario e motivo.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Selecao de Proposicao */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Selecione a Proposição
                </CardTitle>
                <CardDescription>
                  Escolha o item da pauta para registrar os votos
                </CardDescription>
              </div>
              {!editandoPauta && itensPauta.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditandoPauta(true)}
                >
                  <PenLine className="h-4 w-4 mr-1" />
                  Editar Pauta
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {editandoPauta ? (
              <PautaEditor
                sessaoId={sessao.id}
                onClose={() => {
                  setEditandoPauta(false)
                  router.refresh()
                }}
              />
            ) : itensPauta.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Nenhuma proposição na pauta desta sessão.
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Para lançar votações retroativas, primeiro adicione as proposições que foram votadas na sessão.
                </p>
                <Button onClick={() => setEditandoPauta(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Proposições à Pauta
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {itensPauta.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      itemSelecionado?.id === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setItemSelecionado(item)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {item.proposicao?.tipo} {item.proposicao?.numero}/{item.proposicao?.ano}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              item.status === 'APROVADO' && 'bg-green-50 text-green-700 border-green-200',
                              item.status === 'REJEITADO' && 'bg-red-50 text-red-700 border-red-200',
                              item.status === 'ADIADO' && 'bg-orange-50 text-orange-700 border-orange-200',
                              item.status === 'RETIRADO' && 'bg-purple-50 text-purple-700 border-purple-200',
                              item.status === 'PENDENTE' && 'bg-gray-50 text-gray-700'
                            )}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.proposicao?.titulo || item.titulo}
                        </p>
                      </div>
                      {itemSelecionado?.id === item.id && (
                        <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Ações Rápidas - alterar status diretamente */}
                    {item.status === 'PENDENTE' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <span className="text-xs text-gray-500 mr-2">Ação rápida:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-600 hover:bg-green-50"
                          disabled={alterandoStatus === item.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            alterarStatusItem(item.id, 'APROVADO')
                          }}
                        >
                          {alterandoStatus === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Aprovado
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 hover:bg-red-50"
                          disabled={alterandoStatus === item.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            alterarStatusItem(item.id, 'REJEITADO')
                          }}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Rejeitado
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-orange-600 hover:bg-orange-50"
                          disabled={alterandoStatus === item.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            alterarStatusItem(item.id, 'ADIADO')
                          }}
                        >
                          Adiado
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-purple-600 hover:bg-purple-50"
                          disabled={alterandoStatus === item.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            alterarStatusItem(item.id, 'RETIRADO')
                          }}
                        >
                          Retirado
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulario de Votacao */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Parlamentares Presentes
            </CardTitle>
            <CardDescription>
              {itemSelecionado
                ? `Registre os votos para ${itemSelecionado.proposicao?.tipo} ${itemSelecionado.proposicao?.numero}/${itemSelecionado.proposicao?.ano}`
                : 'Selecione uma proposicao para registrar os votos'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!itemSelecionado ? (
              <div className="text-center py-8 text-gray-500">
                <Vote className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Selecione uma proposicao na lista ao lado</p>
              </div>
            ) : carregandoVotos ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                <p className="text-gray-500">Carregando votos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lista de parlamentares */}
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {votos.map(parlamentar => (
                    <div
                      key={parlamentar.parlamentarId}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg',
                        parlamentar.presente ? 'bg-white border' : 'bg-gray-50 border border-dashed'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium text-sm',
                          !parlamentar.presente && 'text-gray-400'
                        )}>
                          {parlamentar.apelido || parlamentar.nome}
                        </span>
                        {!parlamentar.presente && (
                          <Badge variant="outline" className="text-xs">Ausente</Badge>
                        )}
                        {parlamentar.votoAnterior && (
                          <Badge variant="outline" className="text-xs bg-yellow-50">
                            Anterior: {parlamentar.votoAnterior}
                          </Badge>
                        )}
                      </div>

                      {parlamentar.presente && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant={parlamentar.voto === 'SIM' ? 'default' : 'outline'}
                            className={cn(
                              'h-8 px-2',
                              parlamentar.voto === 'SIM' && 'bg-green-600 hover:bg-green-700'
                            )}
                            onClick={() => atualizarVoto(parlamentar.parlamentarId, 'SIM')}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={parlamentar.voto === 'NAO' ? 'default' : 'outline'}
                            className={cn(
                              'h-8 px-2',
                              parlamentar.voto === 'NAO' && 'bg-red-600 hover:bg-red-700'
                            )}
                            onClick={() => atualizarVoto(parlamentar.parlamentarId, 'NAO')}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={parlamentar.voto === 'ABSTENCAO' ? 'default' : 'outline'}
                            className={cn(
                              'h-8 px-2',
                              parlamentar.voto === 'ABSTENCAO' && 'bg-amber-600 hover:bg-amber-700'
                            )}
                            onClick={() => atualizarVoto(parlamentar.parlamentarId, 'ABSTENCAO')}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          {parlamentar.voto && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => limparVoto(parlamentar.parlamentarId)}
                            >
                              <XCircle className="h-4 w-4 text-gray-400" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Resumo */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Resumo da Votacao</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{resumo.sim}</div>
                      <div className="text-xs text-gray-500">SIM</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{resumo.nao}</div>
                      <div className="text-xs text-gray-500">NAO</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">{resumo.abstencao}</div>
                      <div className="text-xs text-gray-500">ABST</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-400">{resumo.pendentes}</div>
                      <div className="text-xs text-gray-500">Pendente</div>
                    </div>
                  </div>

                  {resultado && (
                    <div className={cn(
                      'mt-4 p-3 rounded-lg text-center font-medium',
                      resultado === 'APROVADO' && 'bg-green-100 text-green-800',
                      resultado === 'REJEITADO' && 'bg-red-100 text-red-800',
                      resultado === 'EMPATE' && 'bg-amber-100 text-amber-800'
                    )}>
                      Resultado: {resultado === 'APROVADO' ? 'APROVADA' : resultado === 'REJEITADO' ? 'REJEITADA' : 'EMPATE'}
                      {resultado === 'APROVADO' ? ' (maioria simples)' : ''}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Motivo obrigatorio */}
                <div>
                  <Label htmlFor="motivo" className="text-sm font-medium">
                    Motivo do lancamento retroativo *
                  </Label>
                  <Textarea
                    id="motivo"
                    placeholder="Informe o motivo do lancamento retroativo (obrigatorio para auditoria)"
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este motivo sera registrado na auditoria
                  </p>
                </div>

                {/* Botoes de acao */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={salvando || resumo.pendentes > 0 || !motivo.trim()}
                    onClick={salvarVotacao}
                  >
                    {salvando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Votacao
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setItemSelecionado(null)
                      setMotivo('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
