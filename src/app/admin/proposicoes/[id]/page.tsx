'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Loader2,
  Users,
  Eye,
  Edit,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  History,
  Gavel,
  Plus,
  Send,
  Ban,
  Archive,
  BookOpen,
  Megaphone
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useProposicao } from '@/lib/hooks/use-proposicoes'
import { usePareceres } from '@/lib/hooks/use-pareceres'
import { useTramitacoes } from '@/lib/hooks/use-tramitacoes'
import Link from 'next/link'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import { gerarSlugProposicao, isSlugProposicao } from '@/lib/utils/proposicao-slug'

import { STATUS_TRAMITACAO, TIPOS_PARECER, STATUS_PARECER, STATUS_PROPOSICAO, TIPO_PROPOSICAO } from './_constants'

export default function ProposicaoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { proposicao, loading, error } = useProposicao(id)
  const { pareceres, loading: loadingPareceres } = usePareceres({ proposicaoId: proposicao?.id || '' })
  const [showFullText, setShowFullText] = useState(false)
  const [showTramitarForm, setShowTramitarForm] = useState(false)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('')
  const [tipoTramitacaoSelecionado, setTipoTramitacaoSelecionado] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [criandoTramitacao, setCriandoTramitacao] = useState(false)
  const [unidades, setUnidades] = useState<Array<{ id: string; nome: string; sigla: string }>>([])
  const [tiposTramitacao, setTiposTramitacao] = useState<Array<{ id: string; nome: string }>>([])
  const [acaoLoading, setAcaoLoading] = useState<string | null>(null)
  const [showConverterNorma, setShowConverterNorma] = useState(false)
  const [normaForm, setNormaForm] = useState({ tipoNorma: '', numero: '', dataPublicacao: '' })

  // Busca tramitações apenas quando temos o ID da proposição
  const tramitacaoFilters = proposicao?.id ? { proposicaoId: proposicao.id } : { proposicaoId: '__none__' }
  const { tramitacoes, loading: loadingTramitacoes, create: criarTramitacao, refetch: refetchTramitacoes } = useTramitacoes(tramitacaoFilters)

  // Carrega unidades e tipos de tramitação
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [unidadesRes, tiposRes] = await Promise.all([
          fetch('/api/configuracoes/unidades-tramitacao?ativo=true'),
          fetch('/api/configuracoes/tipos-tramitacao?ativo=true')
        ])
        if (unidadesRes.ok) {
          const result = await unidadesRes.json()
          if (result.success && Array.isArray(result.data)) {
            const unidadesMapeadas = result.data.map((u: any) => ({
              id: u.id,
              nome: u.nome,
              sigla: u.sigla || ''
            }))
            setUnidades(unidadesMapeadas)
          }
        }
        if (tiposRes.ok) {
          const result = await tiposRes.json()
          if (result.success && Array.isArray(result.data)) {
            const tiposMapeados = result.data.map((t: any) => ({
              id: t.id,
              nome: t.nome
            }))
            setTiposTramitacao(tiposMapeados)
          }
        }
      } catch (err) {
        // Silently fail - user will see empty dropdowns
      }
    }
    carregarDados()
  }, [])

  // Handler para criar tramitação
  const handleCriarTramitacao = async () => {
    if (!proposicao?.id || !unidadeSelecionada || !tipoTramitacaoSelecionado) {
      toast.error('Selecione o tipo de tramitação e a unidade de destino')
      return
    }

    setCriandoTramitacao(true)
    try {
      await criarTramitacao({
        proposicaoId: proposicao.id,
        tipoTramitacaoId: tipoTramitacaoSelecionado,
        unidadeId: unidadeSelecionada,
        status: 'RECEBIDA',
        observacoes: observacoes || `Proposição recebida em ${new Date().toLocaleDateString('pt-BR')}`
      })

      setShowTramitarForm(false)
      setUnidadeSelecionada('')
      setTipoTramitacaoSelecionado('')
      setObservacoes('')
      await refetchTramitacoes()
    } catch (err) {
      console.error('Erro ao criar tramitação:', err)
      toast.error('Erro ao criar tramitação')
    } finally {
      setCriandoTramitacao(false)
    }
  }

  // Handler para ações pós-aprovação
  const handleFluxoPosAprovacao = async (acao: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    if (!proposicao?.id) return
    setAcaoLoading(acao)
    try {
      const res = await fetch(`/api/proposicoes/${proposicao.id}/fluxo-pos-aprovacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Acao realizada com sucesso')
        router.refresh()
        window.location.reload()
      } else {
        toast.error(data.error || 'Erro ao executar acao')
      }
    } catch {
      toast.error('Erro de conexao')
    } finally {
      setAcaoLoading(null)
    }
  }

  // Handler para converter em norma
  const handleConverterNorma = async () => {
    if (!proposicao?.id) return
    if (!normaForm.tipoNorma || !normaForm.numero || !normaForm.dataPublicacao) {
      toast.error('Preencha todos os campos')
      return
    }
    setAcaoLoading('converter-norma')
    try {
      const res = await fetch(`/api/proposicoes/${proposicao.id}/converter-norma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normaForm)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Proposicao convertida em norma com sucesso')
        setShowConverterNorma(false)
        setNormaForm({ tipoNorma: '', numero: '', dataPublicacao: '' })
        router.refresh()
        window.location.reload()
      } else {
        toast.error(data.error || 'Erro ao converter em norma')
      }
    } catch {
      toast.error('Erro de conexao')
    } finally {
      setAcaoLoading(null)
    }
  }

  // Filtra para não mostrar tramitações de outras proposições quando filters muda
  const tramitacoesFiltradas = proposicao?.id
    ? tramitacoes.filter(t => t.proposicaoId === proposicao.id)
    : []

  // Encontra a tramitação atual (mais recente não concluída ou a última)
  const tramitacaoAtual = tramitacoesFiltradas.find(t => t.status === 'RECEBIDA' || t.status === 'EM_ANDAMENTO')
    || tramitacoesFiltradas[0]

  // Gera o slug para uso em links
  const slug = proposicao?.slug || (proposicao ? gerarSlugProposicao(proposicao.tipo, proposicao.numero, proposicao.ano) : '')

  // Redireciona para URL com slug se acessado por ID
  useEffect(() => {
    if (proposicao && !isSlugProposicao(id) && slug) {
      router.replace(`/admin/proposicoes/${slug}`)
    }
  }, [proposicao, id, slug, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando proposicao...</p>
        </div>
      </div>
    )
  }

  if (error || !proposicao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4 font-medium">{error || 'Proposicao nao encontrada'}</p>
            <Button asChild>
              <Link href="/admin/proposicoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Proposicoes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = STATUS_PROPOSICAO[proposicao.status] || STATUS_PROPOSICAO['EM_TRAMITACAO']
  const tipoInfo = TIPO_PROPOSICAO[proposicao.tipo] || { label: proposicao.tipo, fullLabel: proposicao.tipo, color: 'bg-gray-600 text-white' }
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecalho com Navegacao */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/proposicoes" className="hover:text-blue-600">Proposicoes</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{proposicao.numero}/{proposicao.ano}</span>
        </nav>
      </div>

      {/* Card Principal - Identificacao */}
      <div className={`rounded-xl border-2 ${statusInfo.bgColor} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Identificacao */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${tipoInfo.color}`}>
                {tipoInfo.label}
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {proposicao.numero}/{proposicao.ano}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} bg-white/80 border`}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </span>
            </div>

            <p className="text-lg text-gray-700 font-medium mb-2">
              {tipoInfo.fullLabel}
            </p>

            <h2 className="text-xl text-gray-900 font-semibold mb-3">
              {proposicao.titulo}
            </h2>

            <p className="text-gray-600 leading-relaxed">
              {proposicao.ementa}
            </p>
          </div>

          {/* Acoes */}
          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/proposicoes?edit=${proposicao.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
              <Button size="sm" onClick={() => {
                setShowTramitarForm(true)
                document.getElementById('historico-tramitacao')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Tramitar
              </Button>
            </div>

            {/* Acoes pos-aprovacao */}
            {proposicao.status === 'APROVADA' && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50" disabled={acaoLoading !== null} onClick={() => handleFluxoPosAprovacao('sancionar')}>
                  {acaoLoading === 'sancionar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gavel className="h-4 w-4 mr-2" />}
                  Sancionar
                </Button>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" disabled={acaoLoading !== null} onClick={() => handleFluxoPosAprovacao('vetar', 'Tem certeza que deseja VETAR esta proposicao?')}>
                  {acaoLoading === 'vetar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                  Vetar
                </Button>
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" disabled={acaoLoading !== null} onClick={() => setShowConverterNorma(!showConverterNorma)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Converter em Norma
                </Button>
              </div>
            )}
            {proposicao.status === 'SANCIONADA' && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50" disabled={acaoLoading !== null} onClick={() => handleFluxoPosAprovacao('promulgar')}>
                  {acaoLoading === 'promulgar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Megaphone className="h-4 w-4 mr-2" />}
                  Promulgar
                </Button>
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" disabled={acaoLoading !== null} onClick={() => setShowConverterNorma(!showConverterNorma)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Converter em Norma
                </Button>
              </div>
            )}
            {proposicao.status === 'VETADA' && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" disabled={acaoLoading !== null} onClick={() => handleFluxoPosAprovacao('derrubar-veto')}>
                  {acaoLoading === 'derrubar-veto' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gavel className="h-4 w-4 mr-2" />}
                  Derrubar Veto
                </Button>
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" disabled={acaoLoading !== null} onClick={() => handleFluxoPosAprovacao('arquivar', 'Tem certeza que deseja ARQUIVAR esta proposicao?')}>
                  {acaoLoading === 'arquivar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
                  Arquivar
                </Button>
              </div>
            )}
            {proposicao.status === 'REJEITADA' && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" disabled={acaoLoading !== null} onClick={() => handleFluxoPosAprovacao('arquivar', 'Tem certeza que deseja ARQUIVAR esta proposicao?')}>
                  {acaoLoading === 'arquivar' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
                  Arquivar
                </Button>
              </div>
            )}

            {/* Formulario inline para converter em norma */}
            {showConverterNorma && ['APROVADA', 'SANCIONADA'].includes(proposicao.status) && (
              <div className="w-full lg:w-80 p-4 bg-white rounded-lg border shadow-sm space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Converter em Norma Juridica</h4>
                <div>
                  <Label className="text-sm">Tipo de Norma *</Label>
                  <Select value={normaForm.tipoNorma} onValueChange={(v) => setNormaForm(prev => ({ ...prev, tipoNorma: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="LEI_ORDINARIA">Lei Ordinaria</SelectItem>
                      <SelectItem value="LEI_COMPLEMENTAR">Lei Complementar</SelectItem>
                      <SelectItem value="DECRETO_LEGISLATIVO">Decreto Legislativo</SelectItem>
                      <SelectItem value="RESOLUCAO">Resolucao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Numero *</Label>
                  <Input className="mt-1" placeholder="Ex: 1234" value={normaForm.numero} onChange={(e) => setNormaForm(prev => ({ ...prev, numero: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm">Data de Publicacao *</Label>
                  <Input type="date" className="mt-1" value={normaForm.dataPublicacao} onChange={(e) => setNormaForm(prev => ({ ...prev, dataPublicacao: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" disabled={acaoLoading !== null} onClick={handleConverterNorma}>
                    {acaoLoading === 'converter-norma' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                    Converter
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowConverterNorma(false); setNormaForm({ tipoNorma: '', numero: '', dataPublicacao: '' }) }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Informacoes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informacoes do Autor e Datas */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Autor */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Autor</p>
                    <p className="text-sm font-medium text-gray-900">
                      {proposicao.autor?.nome || 'Nao informado'}
                    </p>
                  </div>
                </div>

                {/* Data Apresentacao */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Apresentacao</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Data Votacao (se houver) */}
                {proposicao.dataVotacao && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Gavel className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Votacao</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resultado (se houver) */}
                {proposicao.resultado && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${proposicao.resultado === 'APROVADA' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {proposicao.resultado === 'APROVADA' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Resultado</p>
                      <p className={`text-sm font-bold ${proposicao.resultado === 'APROVADA' ? 'text-green-600' : 'text-red-600'}`}>
                        {proposicao.resultado}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Texto Completo */}
          {proposicao.texto && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-gray-500" />
                    Texto Completo
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullText(!showFullText)}
                  >
                    {showFullText ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Recolher
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Expandir
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`bg-gray-50 p-4 rounded-lg border transition-all ${showFullText ? '' : 'max-h-48 overflow-hidden relative'}`}>
                  <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                    {proposicao.texto}
                  </p>
                  {!showFullText && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pareceres das Comissoes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-gray-500" />
                  Pareceres das Comissoes
                  {pareceres.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{pareceres.length}</Badge>
                  )}
                </CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/pareceres?proposicaoId=${id}`}>
                    Ver Todos
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPareceres ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : pareceres.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-3">Nenhum parecer emitido para esta proposicao.</p>
                  <Button asChild size="sm">
                    <Link href="/admin/pareceres">
                      Criar Parecer
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pareceres.map((parecer) => {
                    const statusParecer = STATUS_PARECER[parecer.status] || { label: parecer.status, color: 'bg-gray-100 text-gray-800' }
                    const tipoLabel = TIPOS_PARECER[parecer.tipo] || parecer.tipo

                    return (
                      <div key={parecer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="font-semibold text-gray-900">
                                {parecer.comissao?.sigla || parecer.comissao?.nome || 'Comissao'}
                              </span>
                              <Badge className={statusParecer.color}>{statusParecer.label}</Badge>
                              <Badge variant="outline">{tipoLabel}</Badge>
                            </div>

                            {parecer.ementa && (
                              <p className="text-sm text-gray-600 italic line-clamp-2 mb-2">
                                &ldquo;{parecer.ementa}&rdquo;
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Relator: {parecer.relator?.apelido || parecer.relator?.nome || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(parecer.dataDistribuicao).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {(parecer.status === 'APROVADO_COMISSAO' || parecer.status === 'REJEITADO_COMISSAO' || parecer.status === 'EMITIDO') && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-green-600 font-medium">{parecer.votosAFavor} favor</span>
                                <span className="text-red-600 font-medium">{parecer.votosContra} contra</span>
                                <span className="text-yellow-600 font-medium">{parecer.votosAbstencao} abst.</span>
                              </div>
                            )}
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/admin/pareceres?id=${parecer.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Detalhes
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Resumo de Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-gray-500" />
                Situacao Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Visual */}
                <div className={`p-4 rounded-lg ${statusInfo.bgColor} border`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                      <p className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
                    </div>
                  </div>
                </div>

                {/* Unidade Atual */}
                {tramitacaoAtual && (
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <MapPin className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Localizado em</p>
                        <p className="font-bold text-purple-700">
                          {tramitacaoAtual.unidade?.nome || 'Unidade nao informada'}
                        </p>
                        {tramitacaoAtual.status && (
                          <p className="text-xs text-purple-600 mt-0.5">
                            {STATUS_TRAMITACAO[tramitacaoAtual.status]?.label || tramitacaoAtual.status}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Informacoes Adicionais */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Tipo</span>
                    <span className="text-sm font-medium">{tipoInfo.fullLabel}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Numero</span>
                    <span className="text-sm font-medium">{proposicao.numero}/{proposicao.ano}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Apresentacao</span>
                    <span className="text-sm font-medium">
                      {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {proposicao.sessao && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Sessao</span>
                      <span className="text-sm font-medium">
                        {proposicao.sessao.numero} - {new Date(proposicao.sessao.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historico de Tramitacao */}
          <Card id="historico-tramitacao">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5 text-gray-500" />
                  Historico de Tramitacao
                  {tramitacoesFiltradas.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{tramitacoesFiltradas.length}</Badge>
                  )}
                </CardTitle>
                {tramitacoesFiltradas.length > 0 && !showTramitarForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTramitarForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingTramitacoes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : tramitacoesFiltradas.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-sm text-amber-700 font-medium">Proposicao sem tramitacao</p>
                    <p className="text-xs text-amber-600 mt-1">Registre a localizacao atual</p>
                  </div>

                  {!showTramitarForm ? (
                    <Button
                      onClick={() => setShowTramitarForm(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Tramitacao
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <Label className="text-sm">Tipo de Tramitação * ({tiposTramitacao.length} disponíveis)</Label>
                        <Select value={tipoTramitacaoSelecionado} onValueChange={setTipoTramitacaoSelecionado}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={tiposTramitacao.length === 0 ? "Carregando tipos..." : "Selecione o tipo"} />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4}>
                            {tiposTramitacao.length === 0 ? (
                              <SelectItem value="__loading__" disabled>
                                Nenhum tipo disponível
                              </SelectItem>
                            ) : (
                              tiposTramitacao.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id}>
                                  {tipo.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">Unidade Responsavel * ({unidades.length} disponíveis)</Label>
                        <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={unidades.length === 0 ? "Carregando unidades..." : "Selecione a unidade"} />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4}>
                            {unidades.length === 0 ? (
                              <SelectItem value="__loading__" disabled>
                                Nenhuma unidade disponível
                              </SelectItem>
                            ) : (
                              unidades.map((unidade) => (
                                <SelectItem key={unidade.id} value={unidade.id}>
                                  {unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">Observacoes (opcional)</Label>
                        <Textarea
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Ex: Recebida para analise..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCriarTramitacao}
                          disabled={!tipoTramitacaoSelecionado || !unidadeSelecionada || criandoTramitacao}
                          size="sm"
                          className="flex-1"
                        >
                          {criandoTramitacao ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Registrar
                        </Button>
                        <Button
                          onClick={() => {
                            setShowTramitarForm(false)
                            setTipoTramitacaoSelecionado('')
                            setUnidadeSelecionada('')
                            setObservacoes('')
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Linha vertical */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-4">
                    {/* Apresentacao */}
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow flex items-center justify-center z-10">
                        <FileText className="h-3 w-3 text-white" />
                      </div>
                      <div className="ml-10">
                        <p className="text-sm font-medium text-gray-900">Apresentada</p>
                        <p className="text-xs text-gray-500">
                          {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Tramitacoes */}
                    {[...tramitacoesFiltradas].reverse().map((tramitacao, index) => {
                      const statusTram = STATUS_TRAMITACAO[tramitacao.status] || STATUS_TRAMITACAO['EM_ANDAMENTO']
                      const isAtual = tramitacao.id === tramitacaoAtual?.id

                      return (
                        <div key={tramitacao.id} className="relative flex items-start gap-4">
                          <div className={`absolute left-0 w-6 h-6 rounded-full ${
                            isAtual ? 'bg-purple-500 ring-2 ring-purple-300' :
                            tramitacao.status === 'CONCLUIDA' ? 'bg-green-500' :
                            tramitacao.status === 'CANCELADA' ? 'bg-red-500' :
                            'bg-yellow-500'
                          } border-4 border-white shadow flex items-center justify-center z-10`}>
                            {tramitacao.status === 'CONCLUIDA' ? (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            ) : tramitacao.status === 'CANCELADA' ? (
                              <XCircle className="h-3 w-3 text-white" />
                            ) : (
                              <ArrowRight className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className={`ml-10 flex-1 ${isAtual ? 'bg-purple-50 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${isAtual ? 'text-purple-900' : 'text-gray-900'}`}>
                                {tramitacao.unidade?.nome || 'Unidade nao informada'}
                              </p>
                              {isAtual && (
                                <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                                  Atual
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(tramitacao.dataEntrada).toLocaleDateString('pt-BR')}
                              {tramitacao.dataSaida && (
                                <> - {new Date(tramitacao.dataSaida).toLocaleDateString('pt-BR')}</>
                              )}
                            </p>
                            <p className={`text-xs ${statusTram.color}`}>
                              {statusTram.label}
                            </p>
                            {tramitacao.observacoes && (
                              <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">
                                {tramitacao.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Votacao (se aplicavel) */}
                    {proposicao.dataVotacao && (
                      <div className="relative flex items-start gap-4">
                        <div className={`absolute left-0 w-6 h-6 rounded-full ${proposicao.resultado === 'APROVADA' ? 'bg-green-500' : 'bg-red-500'} border-4 border-white shadow flex items-center justify-center z-10`}>
                          <Gavel className="h-3 w-3 text-white" />
                        </div>
                        <div className="ml-10">
                          <p className="text-sm font-medium text-gray-900">
                            {proposicao.resultado === 'APROVADA' ? 'Aprovada' : 'Rejeitada'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formulario para nova tramitacao (quando ja existem tramitacoes) */}
              {showTramitarForm && tramitacoesFiltradas.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Nova Tramitacao</h4>
                  <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                    <div>
                      <Label className="text-sm">Tipo de Tramitação * ({tiposTramitacao.length} disponíveis)</Label>
                      <Select value={tipoTramitacaoSelecionado} onValueChange={setTipoTramitacaoSelecionado}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={tiposTramitacao.length === 0 ? "Carregando tipos..." : "Selecione o tipo"} />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={4}>
                          {tiposTramitacao.length === 0 ? (
                            <SelectItem value="__loading__" disabled>
                              Nenhum tipo disponível
                            </SelectItem>
                          ) : (
                            tiposTramitacao.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                {tipo.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Unidade de Destino * ({unidades.length} disponíveis)</Label>
                      <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={unidades.length === 0 ? "Carregando unidades..." : "Selecione a unidade"} />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={4}>
                          {unidades.length === 0 ? (
                            <SelectItem value="__loading__" disabled>
                              Nenhuma unidade disponível
                            </SelectItem>
                          ) : (
                            unidades.map((unidade) => (
                              <SelectItem key={unidade.id} value={unidade.id}>
                                {unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Observacoes (opcional)</Label>
                      <Textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Ex: Encaminhada para analise..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCriarTramitacao}
                        disabled={!tipoTramitacaoSelecionado || !unidadeSelecionada || criandoTramitacao}
                        size="sm"
                        className="flex-1"
                      >
                        {criandoTramitacao ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Tramitar
                      </Button>
                      <Button
                        onClick={() => {
                          setShowTramitarForm(false)
                          setTipoTramitacaoSelecionado('')
                          setUnidadeSelecionada('')
                          setObservacoes('')
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acoes Rapidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/proposicoes?edit=${proposicao.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Proposicao
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowTramitarForm(true)
                    document.getElementById('historico-tramitacao')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Tramitar
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/pareceres?proposicaoId=${proposicao.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Pareceres
                  </Link>
                </Button>
                {proposicao.sessao && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/admin/sessoes/${gerarSlugSessao(proposicao.sessao.numero, proposicao.sessao.data)}`}>
                      <Gavel className="h-4 w-4 mr-2" />
                      Ver Sessao
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
