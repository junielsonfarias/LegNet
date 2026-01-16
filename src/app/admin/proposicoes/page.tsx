'use client'

import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  Calendar,
  ArrowRight,
  Loader2,
  Check,
  RefreshCw
} from 'lucide-react'
import { ProposicoesListSkeleton } from '@/components/skeletons/proposicao-skeleton'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { tiposTramitacaoService, tiposOrgaosService } from '@/lib/tramitacao-service'
import { leisService } from '@/lib/leis-service'
import { buscarProximoNumero } from '@/lib/utils/proposicao-numero'
import type { TipoTramitacao, TipoOrgao } from '@/lib/types/tramitacao'
import type { ProposicaoApi } from '@/lib/api/proposicoes-api'
import {
  tramitacoesApi,
  type TramitacaoApi,
  type TramitacaoAdvanceResponse,
  type TramitacaoResultado
} from '@/lib/api/tramitacoes-api'
import { toast } from 'sonner'

const SELECT_AUTO = '__auto__'
const RESULTADO_PADRAO = '__sem__'
const RESULTADOS_TRAMITACAO: Array<{ value: TramitacaoResultado; label: string }> = [
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'APROVADO_COM_EMENDAS', label: 'Aprovado com Emendas' },
  { value: 'ARQUIVADO', label: 'Arquivado' }
]

function ProposicoesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { proposicoes, loading: loadingProposicoes, create, update, remove } = useProposicoes()
  const { parlamentares, loading: loadingParlamentares } = useParlamentares()
  const [tiposTramitacao, setTiposTramitacao] = useState<TipoTramitacao[]>([])
  const [tiposOrgaos, setTiposOrgaos] = useState<TipoOrgao[]>([])
  const [tramitacoes, setTramitacoes] = useState<TramitacaoApi[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTramitacaoModalOpen, setIsTramitacaoModalOpen] = useState(false)
  const [editingProposicao, setEditingProposicao] = useState<ProposicaoApi | null>(null)
  const [selectedProposicao, setSelectedProposicao] = useState<ProposicaoApi | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [tipoFilter, setTipoFilter] = useState('TODOS')
  const [formData, setFormData] = useState({
    numero: '',
    numeroAutomatico: true, // Por padrão, numeração automática
    ano: 2024,
    tipo: 'projeto_lei',
    titulo: '',
    ementa: '',
    textoCompleto: '',
    autorId: '',
    autores: [] as string[], // Array de IDs dos autores
    coautores: [] as string[], // Mantido para compatibilidade
    assuntos: [] as string[],
    anexos: [] as File[], // Array de arquivos anexados
    leisReferenciadas: [] as any[] // Array de leis referenciadas
  })

  const [tramitacaoFormData, setTramitacaoFormData] = useState({
    tipoTramitacaoId: '',
    unidadeId: '__auto__',
    observacoes: '',
    parecer: ''
  })
  const [comentarioAcao, setComentarioAcao] = useState('')
  const [resultadoFinalizacao, setResultadoFinalizacao] = useState<'__sem__' | TramitacaoResultado>(RESULTADO_PADRAO)
  const [acaoEmProcesso, setAcaoEmProcesso] = useState<'advance' | 'reopen' | 'finalize' | null>(null)
  const [ultimoAvanco, setUltimoAvanco] = useState<TramitacaoAdvanceResponse | null>(null)

  // Estados para gerenciar leis referenciadas
  const [leisDisponiveis, setLeisDisponiveis] = useState(leisService.getAll())
  const [leiSelecionada, setLeiSelecionada] = useState('')
  const [tipoRelacao, setTipoRelacao] = useState('')
  const [dispositivo, setDispositivo] = useState('')
  const [justificativaLei, setJustificativaLei] = useState('')
  const [modalLeiAberto, setModalLeiAberto] = useState(false)
  const hasProcessedEditRef = useRef(false)

  // Verificar parâmetro de edição na URL separadamente
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && !loadingProposicoes && proposicoes.length > 0 && !hasProcessedEditRef.current) {
      const proposicaoParaEditar = proposicoes.find(p => p.id === editId)
      if (proposicaoParaEditar) {
        hasProcessedEditRef.current = true
        handleEdit(proposicaoParaEditar)
        // Limpar o parâmetro da URL
        router.replace('/admin/proposicoes')
      }
    }
    
    // Resetar a flag quando searchParams mudar
    if (!searchParams.get('edit')) {
      hasProcessedEditRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadingProposicoes])

  const loadTiposTramitacao = useCallback(() => {
    try {
      const data = tiposTramitacaoService.getAll()
      console.log('Tipos de tramitação carregados:', data)
      setTiposTramitacao(data)
    } catch (error) {
      console.error('Erro ao carregar tipos de tramitação:', error)
    }
  }, [])

  const loadTiposOrgaos = useCallback(() => {
    try {
      const data = tiposOrgaosService.getAll()
      console.log('Tipos de órgãos carregados:', data)
      setTiposOrgaos(data)
    } catch (error) {
      console.error('Erro ao carregar tipos de órgãos:', error)
    }
  }, [])

  const loadTramitacoes = useCallback(async () => {
    try {
      const response = await tramitacoesApi.list()
      setTramitacoes(response.data)
    } catch (error) {
      console.error('Erro ao carregar tramitações:', error)
      toast.error('Não foi possível carregar as tramitações (modo offline).')
      setTramitacoes([])
    }
  }, [])

  useEffect(() => {
    loadTiposTramitacao()
    loadTiposOrgaos()
    void loadTramitacoes()
  }, [loadTiposTramitacao, loadTiposOrgaos, loadTramitacoes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.autorId) {
      toast.error('Selecione um autor')
      return
    }
    
    try {
      if (editingProposicao) {
        const updated = await update(editingProposicao.id, {
          numero: formData.numero,
          ano: formData.ano,
          tipo: formData.tipo.toUpperCase() as any,
          titulo: formData.titulo,
          ementa: formData.ementa,
          texto: formData.textoCompleto || undefined,
          status: 'EM_TRAMITACAO',
          dataApresentacao: editingProposicao.dataApresentacao,
          autorId: formData.autorId
        })
        
        if (updated) {
          toast.success('Proposição atualizada com sucesso')
          handleClose()
        }
      } else {
        const nova = await create({
          numero: formData.numero,
          ano: formData.ano,
          tipo: formData.tipo.toUpperCase() as any,
          titulo: formData.titulo,
          ementa: formData.ementa,
          texto: formData.textoCompleto || undefined,
          status: 'APRESENTADA',
          dataApresentacao: new Date().toISOString(),
          autorId: formData.autorId
        })
        
        if (nova) {
          toast.success('Proposição criada com sucesso')
          handleClose()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar proposição:', error)
    }
  }

  const handleEdit = (proposicao: ProposicaoApi) => {
    setEditingProposicao(proposicao)
    setFormData({
      numero: proposicao.numero,
      numeroAutomatico: false,
      ano: proposicao.ano,
      tipo: proposicao.tipo && typeof proposicao.tipo === 'string' ? proposicao.tipo.toLowerCase() : proposicao.tipo,
      titulo: proposicao.titulo,
      ementa: proposicao.ementa,
      textoCompleto: proposicao.texto || '',
      autorId: proposicao.autorId,
      autores: [],
      coautores: [],
      assuntos: [],
      anexos: [],
      leisReferenciadas: []
    })
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingProposicao(null)
    setFormData({
      numero: '',
      numeroAutomatico: true,
      ano: 2024,
      tipo: 'projeto_lei',
      titulo: '',
      ementa: '',
      textoCompleto: '',
      autorId: '',
      autores: [],
      coautores: [],
      assuntos: [],
      anexos: [],
      leisReferenciadas: []
    })
    setComentarioAcao('')
    setResultadoFinalizacao(RESULTADO_PADRAO)
    setAcaoEmProcesso(null)
    setUltimoAvanco(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta proposição?')) {
      const sucesso = await remove(id)
      if (sucesso) {
        toast.success('Proposição excluída com sucesso')
      }
    }
  }

  const handleTramitar = (proposicao: ProposicaoApi) => {
    setSelectedProposicao(proposicao)
    setIsTramitacaoModalOpen(true)
    setTramitacaoFormData({
      tipoTramitacaoId: '',
      unidadeId: SELECT_AUTO,
      observacoes: '',
      parecer: ''
    })
    setComentarioAcao('')
    setResultadoFinalizacao(RESULTADO_PADRAO)
    setAcaoEmProcesso(null)
    setUltimoAvanco(null)
  }

  const handleSubmitTramitacao = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProposicao) {
      toast.error('Nenhuma proposição selecionada.')
      return
    }

    if (!tramitacaoFormData.tipoTramitacaoId) {
      toast.error('Selecione um tipo de tramitação.')
      return
    }

    const unidadeId =
      tramitacaoFormData.unidadeId && tramitacaoFormData.unidadeId !== SELECT_AUTO
        ? tramitacaoFormData.unidadeId
        : undefined

    try {
      const tipoSelecionado = tiposTramitacao.find(t => t.id === tramitacaoFormData.tipoTramitacaoId)
      const unidadeSelecionada = unidadeId ? tiposOrgaos.find(o => o.id === unidadeId) : null

      await tramitacoesApi.create({
        proposicaoId: selectedProposicao.id,
        tipoTramitacaoId: tramitacaoFormData.tipoTramitacaoId,
        unidadeId,
        observacoes: tramitacaoFormData.observacoes || undefined,
        parecer: tramitacaoFormData.parecer || undefined,
        status: 'EM_ANDAMENTO',
        automatica: false
      })

      await loadTramitacoes()
      
      // Limpar formulário e fechar modal
      setTramitacaoFormData({
        tipoTramitacaoId: '',
        unidadeId: SELECT_AUTO,
        observacoes: '',
        parecer: ''
      })
      setIsTramitacaoModalOpen(false)
      setSelectedProposicao(null)
      
      toast.success(
        `Tramitação registrada para ${selectedProposicao.numero} – ${tipoSelecionado?.nome ?? 'Tipo indefinido'}${
          unidadeSelecionada ? ` • ${unidadeSelecionada.nome}` : ''
        }`
      )
    } catch (error) {
      console.error('Erro ao tramitar proposição:', error)
      toast.error('Erro ao registrar tramitação. Tente novamente.')
    }
  }

  const getStatusDetalhado = useCallback((proposicaoId: string) => {
    const relacionadas = tramitacoes
      .filter(t => t.proposicaoId === proposicaoId)
      .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime())

    if (!relacionadas.length) {
      return {
        status: 'NÃO_TRAMITADA',
        localizacao: 'Não iniciada',
        descricao: 'Proposição ainda não foi protocolada',
        prazo: null,
        proximoPasso: 'Protocolo na Mesa Diretora'
      }
    }

    const atual = relacionadas[0]
    const tipoTramitacao = tiposTramitacao.find(tipo => tipo.id === atual.tipoTramitacaoId)
    const unidade = tiposOrgaos.find(orgao => orgao.id === atual.unidadeId)

    let status: string | undefined = atual.status
    let localizacao = unidade?.nome || 'Órgão não identificado'
    let descricao = atual.observacoes || ''
    let proximoPasso = ''

    if (tipoTramitacao?.id === '5') {
      status = 'EM_ANDAMENTO'
      localizacao = 'Plenário - Aguardando Pauta'
      descricao = 'Pronta para votação, aguardando inclusão na pauta'
      proximoPasso = 'Inclusão na pauta de votação'
    } else if (tipoTramitacao?.id === '6') {
      status = 'EM_ANDAMENTO'
      localizacao = `${unidade?.nome ?? 'Órgão responsável'} - Aguardando Resposta`
      descricao = 'Aguardando resposta do órgão competente'
      proximoPasso = 'Resposta do órgão responsável'
    } else if (tipoTramitacao?.id === '3') {
      status = 'EM_ANDAMENTO'
      localizacao = `${unidade?.nome ?? 'Órgão responsável'} - Em Análise`
      descricao = 'Sendo analisada pela comissão competente'
      proximoPasso = 'Conclusão da análise técnica'
    } else if (atual.status === 'CONCLUIDA' && atual.resultado === 'APROVADO') {
      status = 'CONCLUIDA'
      localizacao = `${unidade?.nome ?? 'Órgão responsável'} - Aprovada`
      descricao = 'Aprovada pela unidade competente'
      proximoPasso = 'Próxima etapa do processo'
    }

    return {
      status,
      localizacao,
      descricao,
      prazo: atual.prazoVencimento ?? null,
      proximoPasso,
      tramitacaoAtual: atual,
      tipoTramitacao,
      unidade
    }
  }, [tiposOrgaos, tiposTramitacao, tramitacoes])

  const statusDetalhadoAtual = useMemo(() => {
    if (!selectedProposicao) {
      return null
    }
    return getStatusDetalhado(selectedProposicao.id)
  }, [getStatusDetalhado, selectedProposicao])

  const tramitacaoAtual = statusDetalhadoAtual?.tramitacaoAtual as TramitacaoApi | undefined

  const notificacoesSelecionadas = useMemo(() => {
    if (!selectedProposicao) {
      return []
    }
    return tramitacoes
      .filter(t => t.proposicaoId === selectedProposicao.id)
      .flatMap(tramitacao =>
        (tramitacao.notificacoes ?? []).map(notificacao => ({
          ...notificacao,
          etapa: tramitacao
        }))
      )
      .sort((a, b) => {
        const dataA = a.enviadoEm ? new Date(a.enviadoEm).getTime() : 0
        const dataB = b.enviadoEm ? new Date(b.enviadoEm).getTime() : 0
        return dataB - dataA
      })
  }, [selectedProposicao, tramitacoes])

  const podeAvancar = tramitacaoAtual?.status === 'EM_ANDAMENTO'
  const podeFinalizar = tramitacaoAtual?.status === 'EM_ANDAMENTO'
  const podeReabrir = tramitacaoAtual?.status === 'CONCLUIDA'

  const handleAdvanceEtapa = useCallback(async () => {
    if (!selectedProposicao || !tramitacaoAtual) {
      toast.error('Nenhuma tramitação ativa selecionada.')
      return
    }
    if (!podeAvancar) {
      toast.error('A tramitação atual já está concluída.')
      return
    }

    setAcaoEmProcesso('advance')
    try {
      const resultado = await tramitacoesApi.advance(tramitacaoAtual.id, {
        comentario: comentarioAcao || undefined
      })
      setUltimoAvanco(resultado)
      await loadTramitacoes()
      setComentarioAcao('')
      setResultadoFinalizacao(RESULTADO_PADRAO)

      const mensagem = resultado?.novaEtapa
        ? `Tramitação avançada para ${resultado.novaEtapa.tipoTramitacao?.nome ?? 'próxima etapa'}.`
        : 'Etapa finalizada. Não há próximas etapas configuradas.'
      toast.success(mensagem)
    } catch (error) {
      console.error('Erro ao avançar tramitação:', error)
      toast.error('Erro ao avançar a tramitação.')
    } finally {
      setAcaoEmProcesso(null)
    }
  }, [comentarioAcao, loadTramitacoes, podeAvancar, selectedProposicao, tramitacaoAtual])

  const handleFinalizeTramitacao = useCallback(async () => {
    if (!selectedProposicao || !tramitacaoAtual) {
      toast.error('Nenhuma tramitação ativa selecionada.')
      return
    }
    if (!podeFinalizar) {
      toast.error('A tramitação já está concluída.')
      return
    }

    setAcaoEmProcesso('finalize')
    try {
      await tramitacoesApi.finalize(tramitacaoAtual.id, {
        observacoes: comentarioAcao || undefined,
        resultado: resultadoFinalizacao === RESULTADO_PADRAO ? null : resultadoFinalizacao
      })
      await loadTramitacoes()
      setComentarioAcao('')
      setResultadoFinalizacao(RESULTADO_PADRAO)
      setUltimoAvanco(null)
      toast.success('Tramitação finalizada com sucesso.')
    } catch (error) {
      console.error('Erro ao finalizar tramitação:', error)
      toast.error('Erro ao finalizar a tramitação.')
    } finally {
      setAcaoEmProcesso(null)
    }
  }, [comentarioAcao, loadTramitacoes, podeFinalizar, resultadoFinalizacao, selectedProposicao, tramitacaoAtual])

  const handleReopenTramitacao = useCallback(async () => {
    if (!selectedProposicao || !tramitacaoAtual) {
      toast.error('Nenhuma tramitação ativa selecionada.')
      return
    }
    if (!podeReabrir) {
      toast.error('Somente tramitações concluídas podem ser reabertas.')
      return
    }

    setAcaoEmProcesso('reopen')
    try {
      await tramitacoesApi.reopen(tramitacaoAtual.id, {
        observacoes: comentarioAcao || undefined
      })
      await loadTramitacoes()
      setComentarioAcao('')
      setResultadoFinalizacao(RESULTADO_PADRAO)
      setUltimoAvanco(null)
      toast.success('Tramitação reaberta para ajustes.')
    } catch (error) {
      console.error('Erro ao reabrir tramitação:', error)
      toast.error('Erro ao reabrir a tramitação.')
    } finally {
      setAcaoEmProcesso(null)
    }
  }, [comentarioAcao, loadTramitacoes, podeReabrir, selectedProposicao, tramitacaoAtual])

  // Funções para gerenciar anexos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/msword' || 
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      
      if (!isValidType) {
        alert('Apenas arquivos PDF, DOC ou DOCX são permitidos')
        return false
      }
      
      if (!isValidSize) {
        alert('Arquivo muito grande. Tamanho máximo: 10MB')
        return false
      }
      
      return true
    })
    
    setFormData({
      ...formData,
      anexos: [...formData.anexos, ...validFiles]
    })
  }

  const handleRemoveFile = (index: number) => {
    setFormData({
      ...formData,
      anexos: formData.anexos.filter((_, i) => i !== index)
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Funções para gerenciar leis referenciadas
  const handleAdicionarLei = () => {
    if (!leiSelecionada || !tipoRelacao) {
      alert('Selecione uma lei e o tipo de relação')
      return
    }

    const lei = leisService.getById(leiSelecionada)
    if (!lei) return

    const novaLeiReferenciada = {
      id: `ref-${Date.now()}`,
      numero: lei.numero,
      ano: lei.ano,
      titulo: lei.titulo,
      tipo: lei.tipo,
      tipoRelacao,
      dispositivo: dispositivo || undefined,
      justificativa: justificativaLei || undefined
    }

    setFormData({
      ...formData,
      leisReferenciadas: [...formData.leisReferenciadas, novaLeiReferenciada]
    })

    // Limpar campos
    setLeiSelecionada('')
    setTipoRelacao('')
    setDispositivo('')
    setJustificativaLei('')
    setModalLeiAberto(false)
  }

  const handleRemoverLei = (index: number) => {
    setFormData({
      ...formData,
      leisReferenciadas: formData.leisReferenciadas.filter((_, i) => i !== index)
    })
  }

  const getTipoRelacaoLabel = (tipo: string) => {
    const labels = {
      'altera': 'Altera',
      'revoga': 'Revoga',
      'inclui': 'Inclui',
      'exclui': 'Exclui',
      'regulamenta': 'Regulamenta',
      'complementa': 'Complementa'
    }
    return labels[tipo as keyof typeof labels] || tipo
  }

  // Funções para gerenciar numeração automática
  const handleNumeroAutomaticoChange = async (checked: boolean) => {
    if (checked) {
      // Ativar numeração automática - gerar próximo número
      try {
        const proximoNumero = await buscarProximoNumero(formData.tipo.toUpperCase(), formData.ano)
        setFormData({
          ...formData,
          numeroAutomatico: true,
          numero: proximoNumero
        })
      } catch (error) {
        console.error('Erro ao gerar número automático:', error)
        toast.error('Erro ao gerar número automático')
      }
    } else {
      // Desativar numeração automática - limpar número
      setFormData({
        ...formData,
        numeroAutomatico: false,
        numero: ''
      })
    }
  }

  const handleTipoChange = async (novoTipo: string) => {
    if (formData.numeroAutomatico) {
      // Se numeração automática está ativa, gerar novo número para o tipo
      try {
        const proximoNumero = await buscarProximoNumero(novoTipo.toUpperCase(), formData.ano)
        setFormData({
          ...formData,
          tipo: novoTipo,
          numero: proximoNumero
        })
      } catch (error) {
        console.error('Erro ao gerar número automático:', error)
      }
    } else {
      setFormData({
        ...formData,
        tipo: novoTipo
      })
    }
  }

  const handleAnoChange = async (novoAno: number) => {
    if (formData.numeroAutomatico) {
      // Se numeração automática está ativa, gerar novo número para o ano
      try {
        const proximoNumero = await buscarProximoNumero(formData.tipo.toUpperCase(), novoAno)
        setFormData({
          ...formData,
          ano: novoAno,
          numero: proximoNumero
        })
      } catch (error) {
        console.error('Erro ao gerar número automático:', error)
      }
    } else {
      setFormData({
        ...formData,
        ano: novoAno
      })
    }
  }

  const validarNumeroManual = (numero: string): boolean => {
    if (!formData.numeroAutomatico && numero) {
      const existe = proposicoes.some(p => 
        p.numero === numero && 
        p.ano === formData.ano && 
        p.id !== editingProposicao?.id
      )
      return !existe
    }
    return true
  }

  const filteredProposicoes = (proposicoes && Array.isArray(proposicoes) ? proposicoes : []).filter(proposicao => {
    if (!proposicao) return false
    const matchesSearch = searchTerm === '' ||
      (proposicao.titulo && typeof proposicao.titulo === 'string' && proposicao.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proposicao.ementa && typeof proposicao.ementa === 'string' && proposicao.ementa.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'TODOS' || proposicao.status === statusFilter
    const matchesTipo = tipoFilter === 'TODOS' || 
      (proposicao.tipo && typeof proposicao.tipo === 'string' && proposicao.tipo.toLowerCase() === tipoFilter.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesTipo
  })

  if (loadingProposicoes || loadingParlamentares) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proposições</h1>
            <p className="text-gray-600 mt-1">Gerencie as proposições legislativas</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nova Proposição
          </Button>
        </div>
        <ProposicoesListSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposições</h1>
          <p className="text-gray-600 mt-1">Gerencie as proposições legislativas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposição
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search-proposicoes">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  id="search-proposicoes"
                  placeholder="Título ou descrição"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Buscar proposições"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" aria-label="Filtrar por status">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="APRESENTADA">Apresentada</SelectItem>
                  <SelectItem value="EM_TRAMITACAO">Em Tramitação</SelectItem>
                  <SelectItem value="APROVADA">Aprovada</SelectItem>
                  <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                  <SelectItem value="ARQUIVADA">Arquivada</SelectItem>
                  <SelectItem value="VETADA">Vetada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo-filter">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger id="tipo-filter" aria-label="Filtrar por tipo">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PROJETO_LEI">Projeto de Lei</SelectItem>
                  <SelectItem value="PROJETO_RESOLUCAO">Projeto de Resolução</SelectItem>
                  <SelectItem value="PROJETO_DECRETO">Projeto de Decreto</SelectItem>
                  <SelectItem value="INDICACAO">Indicação</SelectItem>
                  <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                  <SelectItem value="MOCAO">Moção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Proposições */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProposicoes.map((proposicao) => (
          <Card key={proposicao.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {proposicao.numero}/{proposicao.ano}
                    </Badge>
                    <Badge>
                      {proposicao.tipo.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {proposicao.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2">{proposicao.titulo}</CardTitle>
                  <CardDescription className="mt-1">{proposicao.ementa}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    title="Visualizar proposição"
                    onClick={() => {
                      router.push(`/admin/proposicoes/${proposicao.id}`)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Visualizar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    title="Editar proposição"
                    onClick={() => handleEdit(proposicao)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    title="Tramitar proposição"
                    onClick={() => handleTramitar(proposicao)}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Tramitar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    title="Excluir proposição"
                    onClick={() => handleDelete(proposicao.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {proposicao.autor?.nome || parlamentares.find(p => p.id === proposicao.autorId)?.nome || 'Autor não encontrado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
            {/* Status Atual da Tramitação */}
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Status Atual</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {getStatusDetalhado(proposicao.id).localizacao}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {getStatusDetalhado(proposicao.id).prazo ? 
                        `Prazo: ${new Date(getStatusDetalhado(proposicao.id).prazo!).toLocaleDateString('pt-BR')}` :
                        'Sem prazo definido'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingProposicao ? 'Editar Proposição' : 'Nova Proposição'}
              </CardTitle>
              <CardDescription>
                {editingProposicao ? 'Atualize os dados da proposição' : 'Preencha os dados para criar uma nova proposição'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Controle de Numeração */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="numeroAutomatico"
                      checked={formData.numeroAutomatico}
                      onChange={(e) => handleNumeroAutomaticoChange(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="numeroAutomatico" className="text-sm font-medium">
                      Numeração Automática Sequencial
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 mb-4">
                    {formData.numeroAutomatico 
                      ? "O número será gerado automaticamente de forma sequencial para cada tipo de proposição."
                      : "Desmarque apenas para cadastrar dados históricos com numeração específica da Câmara."
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="numero">
                      Número {formData.numeroAutomatico ? '(Gerado Automaticamente)' : '(Manual)'}
                    </Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      disabled={formData.numeroAutomatico}
                      required
                      className={!validarNumeroManual(formData.numero) ? 'border-red-500' : ''}
                    />
                    {!validarNumeroManual(formData.numero) && (
                      <p className="text-xs text-red-500 mt-1">
                        Este número já existe para este tipo de proposição no ano selecionado.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      id="ano"
                      type="number"
                      value={formData.ano}
                      onChange={(e) => handleAnoChange(parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={handleTipoChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="PROJETO_LEI">Projeto de Lei</SelectItem>
                      <SelectItem value="PROJETO_RESOLUCAO">Projeto de Resolução</SelectItem>
                      <SelectItem value="PROJETO_DECRETO">Projeto de Decreto</SelectItem>
                      <SelectItem value="INDICACAO">Indicação</SelectItem>
                      <SelectItem value="REQUERIMENTO">Requerimento</SelectItem>
                      <SelectItem value="MOCAO">Moção</SelectItem>
                      <SelectItem value="VOTO_PESAR">Voto de Pesar</SelectItem>
                      <SelectItem value="VOTO_APLAUSO">Voto de Aplauso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview do número final */}
                {formData.numero && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Número final:</span> {formData.numero}/{formData.ano}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formData.numeroAutomatico 
                        ? "Numeração automática sequencial"
                        : "Numeração manual (dados históricos)"
                      }
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ementa">Ementa</Label>
                  <Textarea
                    id="ementa"
                    value={formData.ementa}
                    onChange={(e) => setFormData({ ...formData, ementa: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="textoCompleto">Texto Completo</Label>
                  <Textarea
                    id="textoCompleto"
                    value={formData.textoCompleto}
                    onChange={(e) => setFormData({ ...formData, textoCompleto: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="autorId">Autor Principal</Label>
                  <Select value={formData.autorId} onValueChange={(value) => setFormData({ ...formData, autorId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o autor principal" />
                    </SelectTrigger>
                    <SelectContent>
                      {parlamentares.map((parlamentar) => (
                        <SelectItem key={parlamentar.id} value={parlamentar.id}>
                          {parlamentar.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="autores">Coautores</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !formData.autores.includes(value)) {
                        setFormData({ 
                          ...formData, 
                          autores: [...formData.autores, value] 
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar coautor" />
                    </SelectTrigger>
                    <SelectContent>
                      {parlamentares.filter(p => p.id !== formData.autorId).map((parlamentar) => (
                        <SelectItem key={parlamentar.id} value={parlamentar.id}>
                          {parlamentar.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Lista de coautores selecionados */}
                  {formData.autores.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.autores.map((autorId) => {
                        const autor = parlamentares.find(p => p.id === autorId)
                        return autor ? (
                          <div key={autorId} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                            <span>{autor.nome}</span>
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                autores: formData.autores.filter(id => id !== autorId)
                              })}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>

                {/* Campo de Anexos */}
                <div>
                  <Label htmlFor="anexos">Anexos</Label>
                  <div className="mt-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="anexos"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="anexos"
                        className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm">
                          Clique para anexar arquivos (PDF, DOC, DOCX)
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          Tamanho máximo: 10MB por arquivo
                        </span>
                      </label>
                    </div>
                    
                    {/* Lista de arquivos anexados */}
                    {formData.anexos.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Arquivos anexados:</h4>
                        {formData.anexos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                {file.type === 'application/pdf' ? (
                                  <span className="text-xs font-bold text-red-600">PDF</span>
                                ) : (
                                  <span className="text-xs font-bold text-blue-600">DOC</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Campo de Leis Referenciadas */}
                <div>
                  <Label>Leis Referenciadas</Label>
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-600">
                        Vincule leis existentes que esta proposição altera, revoga ou inclui dispositivos
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setModalLeiAberto(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Lei
                      </Button>
                    </div>
                    
                    {/* Lista de leis referenciadas */}
                    {formData.leisReferenciadas.length > 0 && (
                      <div className="space-y-3">
                        {formData.leisReferenciadas.map((lei, index) => (
                          <div key={index} className="flex items-start justify-between bg-gray-50 p-4 rounded-lg border">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {lei.tipo.toUpperCase()}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {getTipoRelacaoLabel(lei.tipoRelacao)}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-gray-900">
                                {lei.numero}/{lei.ano} - {lei.titulo}
                              </h4>
                              {lei.dispositivo && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Dispositivo:</span> {lei.dispositivo}
                                </p>
                              )}
                              {lei.justificativa && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Justificativa:</span> {lei.justificativa}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoverLei(index)}
                              className="text-red-500 hover:text-red-700 p-1 ml-4"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProposicao ? 'Atualizar' : 'Criar'} Proposição
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Tramitação */}
      {isTramitacaoModalOpen && selectedProposicao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{zIndex: 9999}}>
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Tramitação - {selectedProposicao.numero}/{selectedProposicao.ano}
              </CardTitle>
              <CardDescription>
                {selectedProposicao.titulo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status Atual da Tramitação */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Atual da Tramitação</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900">Localização:</span>
                      <span className="ml-2 text-gray-700">
                        {statusDetalhadoAtual?.localizacao ?? 'Não iniciada'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900">Prazo:</span>
                      <span className="ml-2 text-gray-700">
                        {statusDetalhadoAtual?.prazo
                          ? new Date(statusDetalhadoAtual.prazo).toLocaleDateString('pt-BR')
                          : 'Sem prazo definido'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Descrição:</span>
                    <p className="mt-1 text-gray-700">
                      {statusDetalhadoAtual?.descricao ?? 'Proposição ainda não foi protocolada'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Próximo Passo:</span>
                    <p className="mt-1 text-gray-700">
                      {statusDetalhadoAtual?.proximoPasso ?? 'Protocolo na Mesa Diretora'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ações sobre a Tramitação</h3>
                    <p className="text-sm text-gray-600">
                      Utilize os controles abaixo para avançar, reabrir ou finalizar a tramitação atual.
                    </p>
                  </div>
                  {tramitacaoAtual && (
                    <Badge variant="outline" className="text-xs">
                      Etapa atual: {tramitacaoAtual.tipoTramitacao?.nome ?? 'Não identificada'}
                    </Badge>
                  )}
                </div>

                {ultimoAvanco && (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {ultimoAvanco.novaEtapa
                      ? `Última ação: etapa avançada para ${
                          ultimoAvanco.novaEtapa.tipoTramitacao?.nome ?? 'próxima etapa'
                        } (${ultimoAvanco.novaEtapa.unidade?.nome ?? 'Unidade não informada'}).`
                      : 'Última ação: etapa finalizada sem próxima etapa configurada.'}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Button
                    type="button"
                    onClick={handleAdvanceEtapa}
                    disabled={!podeAvancar || acaoEmProcesso !== null}
                    aria-label="Avançar etapa de tramitação"
                  >
                    {acaoEmProcesso === 'advance' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Avançar Etapa
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleFinalizeTramitacao}
                    disabled={!podeFinalizar || acaoEmProcesso !== null}
                    aria-label="Finalizar tramitação"
                  >
                    {acaoEmProcesso === 'finalize' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Finalizar Tramitação
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReopenTramitacao}
                    disabled={!podeReabrir || acaoEmProcesso !== null}
                    aria-label="Reabrir tramitação"
                  >
                    {acaoEmProcesso === 'reopen' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Reabrir Tramitação
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="comentarioAcao">Comentário da Ação</Label>
                    <Textarea
                      id="comentarioAcao"
                      value={comentarioAcao}
                      onChange={event => setComentarioAcao(event.target.value)}
                      placeholder="Descreva o motivo ou observações para a ação executada."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resultadoFinalizacao">Resultado da Finalização</Label>
                    <Select
                      value={resultadoFinalizacao}
                      onValueChange={valor => {
                        if (valor === RESULTADO_PADRAO) {
                          setResultadoFinalizacao(RESULTADO_PADRAO)
                          return
                        }
                        setResultadoFinalizacao(valor as TramitacaoResultado)
                      }}
                    >
                      <SelectTrigger id="resultadoFinalizacao">
                        <SelectValue placeholder="Selecione o resultado da tramitação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RESULTADO_PADRAO}>Sem resultado registrado</SelectItem>
                        {RESULTADOS_TRAMITACAO.map(resultado => (
                          <SelectItem key={resultado.value} value={resultado.value}>
                            {resultado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-gray-500">
                      Este resultado será aplicado apenas ao finalizar a tramitação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações Automáticas</h3>
                {notificacoesSelecionadas.length > 0 ? (
                  <div className="space-y-3" role="list">
                    {notificacoesSelecionadas.map(notificacao => (
                      <div
                        key={notificacao.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                        role="listitem"
                        tabIndex={0}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {notificacao.canal.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              Destinatário: {notificacao.destinatario}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {notificacao.status ?? 'pendente'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">
                          {notificacao.mensagem ?? 'Notificação gerada automaticamente pela regra de tramitação.'}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span>
                            Etapa vinculada:{' '}
                            {notificacao.etapa?.tipoTramitacao?.nome ?? 'Etapa não identificada'} •{' '}
                            {notificacao.etapa?.unidade?.nome ?? 'Unidade não informada'}
                          </span>
                          <span className="ml-2">
                            {notificacao.enviadoEm
                              ? `Enviado em ${new Date(notificacao.enviadoEm).toLocaleString('pt-BR')}`
                              : 'Ainda não enviado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma notificação gerada para esta proposição até o momento.</p>
                  </div>
                )}
              </div>

              {/* Histórico de Tramitação */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Tramitação</h3>
                <div className="space-y-3">
                  {tramitacoes
                    .filter(t => t.proposicaoId === selectedProposicao.id)
                    .sort((a, b) => new Date(a.dataEntrada).getTime() - new Date(b.dataEntrada).getTime())
                    .map((tramitacao, index) => {
                      const tipoTramitacao = tiposTramitacao.find(t => t.id === tramitacao.tipoTramitacaoId)
                      const unidade = tiposOrgaos.find(o => o.id === tramitacao.unidadeId)
                      
                      return (
                        <div key={tramitacao.id} className="border-l-4 border-camara-primary pl-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {tipoTramitacao?.nome || 'Tipo não encontrado'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {unidade?.nome || 'Órgão não encontrado'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span> {tramitacao.status}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Data:</span> {new Date(tramitacao.dataEntrada).toLocaleDateString('pt-BR')}
                          </div>
                          {tramitacao.observacoes && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Observações:</span> {tramitacao.observacoes}
                            </div>
                          )}
                          {tramitacao.parecer && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Parecer:</span> {tramitacao.parecer}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  
                  {tramitacoes.filter(t => t.proposicaoId === selectedProposicao.id).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhuma tramitação registrada para esta proposição.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nova Tramitação */}
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Tramitação</h3>
                <form onSubmit={handleSubmitTramitacao} className="space-y-4 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipoTramitacao">Tipo de Tramitação</Label>
                      <Select 
                        value={tramitacaoFormData.tipoTramitacaoId} 
                        onValueChange={(value) => {
                          console.log('Tipo de tramitação selecionado:', value)
                          setTramitacaoFormData({ ...tramitacaoFormData, tipoTramitacaoId: value })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de tramitação" />
                        </SelectTrigger>
                        <SelectContent 
                          className="z-[9999]" 
                          position="popper"
                          sideOffset={5}
                          avoidCollisions={true}
                          collisionPadding={10}
                        >
                          {tiposTramitacao.length > 0 ? (
                            tiposTramitacao.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{tipo.nome}</span>
                                  {tipo.descricao && (
                                    <span className="text-xs text-gray-500">{tipo.descricao}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              Carregando tipos de tramitação...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {tiposTramitacao.length === 0 && (
                        <p className="text-sm text-red-500 mt-1">
                          Nenhum tipo de tramitação encontrado. Verifique se os dados foram carregados corretamente.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="unidadeId">Unidade de Destino</Label>
                      <Select
                        value={tramitacaoFormData.unidadeId}
                        onValueChange={(value) => {
                          console.log('Unidade de destino selecionada:', value)
                          setTramitacaoFormData({ ...tramitacaoFormData, unidadeId: value })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade de destino" />
                        </SelectTrigger>
                        <SelectContent 
                          className="z-[9999]" 
                          position="popper"
                          sideOffset={5}
                          avoidCollisions={true}
                          collisionPadding={10}
                        >
                          <SelectItem value={SELECT_AUTO}>
                            <div className="flex flex-col">
                              <span className="font-medium">Automática</span>
                              <span className="text-xs text-gray-500">
                                Usar unidade padrão definida para o tipo de tramitação
                              </span>
                            </div>
                          </SelectItem>
                          {tiposOrgaos.length > 0 ? (
                            tiposOrgaos.map((orgao) => (
                              <SelectItem key={orgao.id} value={orgao.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{orgao.nome}</span>
                                  <span className="text-xs text-gray-500">
                                    {orgao.sigla} - {orgao.descricao}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              Carregando unidades...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {tiposOrgaos.length === 0 && (
                        <p className="text-sm text-red-500 mt-1">
                          Nenhuma unidade encontrada. Verifique se os dados foram carregados corretamente.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Informações sobre o tipo de tramitação selecionado */}
                  {tramitacaoFormData.tipoTramitacaoId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Informações da Tramitação</h4>
                      {(() => {
                        const tipoSelecionado = tiposTramitacao.find(t => t.id === tramitacaoFormData.tipoTramitacaoId)
                        const unidadeSelecionada =
                          tramitacaoFormData.unidadeId !== SELECT_AUTO
                            ? tiposOrgaos.find(o => o.id === tramitacaoFormData.unidadeId)
                            : undefined
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {tipoSelecionado && (
                              <div>
                                <span className="font-medium text-blue-800">Tipo:</span>
                                <p className="text-blue-700">{tipoSelecionado.nome}</p>
                                {tipoSelecionado.descricao && (
                                  <p className="text-blue-600 text-xs mt-1">{tipoSelecionado.descricao}</p>
                                )}
                                {tipoSelecionado.prazoRegimental > 0 && (
                                  <p className="text-blue-600 text-xs mt-1">
                                    <span className="font-medium">Prazo:</span> {tipoSelecionado.prazoRegimental} dias
                                  </p>
                                )}
                              </div>
                            )}
                            {unidadeSelecionada && (
                              <div>
                                <span className="font-medium text-blue-800">Unidade:</span>
                                <p className="text-blue-700">{unidadeSelecionada.nome}</p>
                                <p className="text-blue-600 text-xs mt-1">
                                  {unidadeSelecionada.sigla} - {unidadeSelecionada.descricao}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={tramitacaoFormData.observacoes}
                      onChange={(e) => setTramitacaoFormData({ ...tramitacaoFormData, observacoes: e.target.value })}
                      placeholder="Digite as observações sobre a tramitação..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="parecer">Parecer</Label>
                    <Textarea
                      id="parecer"
                      value={tramitacaoFormData.parecer}
                      onChange={(e) => setTramitacaoFormData({ ...tramitacaoFormData, parecer: e.target.value })}
                      placeholder="Digite o parecer sobre a tramitação..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsTramitacaoModalOpen(false)
                        setSelectedProposicao(null)
                        setTramitacaoFormData({
                          tipoTramitacaoId: '',
                          unidadeId: SELECT_AUTO,
                          observacoes: '',
                          parecer: ''
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={!tramitacaoFormData.tipoTramitacaoId}
                    >
                      Registrar Tramitação
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para Adicionar Lei Referenciada */}
      {modalLeiAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Vincular Lei Existente</CardTitle>
              <CardDescription>
                Selecione uma lei existente e o tipo de relação com esta proposição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lei">Lei</Label>
                  <Select value={leiSelecionada} onValueChange={setLeiSelecionada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma lei existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {leisDisponiveis.map((lei) => (
                        <SelectItem key={lei.id} value={lei.id}>
                          {lei.numero}/{lei.ano} - {lei.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipoRelacao">Tipo de Relação</Label>
                  <Select value={tipoRelacao} onValueChange={setTipoRelacao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de relação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="altera">Altera</SelectItem>
                      <SelectItem value="revoga">Revoga</SelectItem>
                      <SelectItem value="inclui">Inclui</SelectItem>
                      <SelectItem value="exclui">Exclui</SelectItem>
                      <SelectItem value="regulamenta">Regulamenta</SelectItem>
                      <SelectItem value="complementa">Complementa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dispositivo">Dispositivo Específico (Opcional)</Label>
                  <Input
                    id="dispositivo"
                    value={dispositivo}
                    onChange={(e) => setDispositivo(e.target.value)}
                    placeholder="Ex: Art. 15, § 2º ou Capítulo III"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Artigo, parágrafo, inciso ou capítulo específico
                  </p>
                </div>

                <div>
                  <Label htmlFor="justificativaLei">Justificativa (Opcional)</Label>
                  <Textarea
                    id="justificativaLei"
                    value={justificativaLei}
                    onChange={(e) => setJustificativaLei(e.target.value)}
                    placeholder="Explique o motivo da alteração ou inclusão..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setModalLeiAberto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleAdicionarLei}
                  >
                    Adicionar Lei
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function ProposicoesPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ProposicoesContent />
    </Suspense>
  )
}
