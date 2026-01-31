'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { leisService } from '@/lib/leis-service'
import { buscarProximoNumero } from '@/lib/utils/proposicao-numero'
import { tramitacoesApi } from '@/lib/api/tramitacoes-api'
import { toast } from 'sonner'
import {
  type ProposicaoFormData,
  type TramitacaoFormData,
  type TipoProposicaoConfig,
  type TramitacaoResultado,
  type ProposicaoApi,
  type TipoTramitacao,
  type TipoOrgao,
  type TramitacaoApi,
  type TramitacaoAdvanceResponse,
  SELECT_AUTO,
  RESULTADO_PADRAO,
  getFormDataInicial,
  getTramitacaoFormDataInicial
} from '../_types'

export interface UseProposicoesStateReturn {
  // Dados de hooks externos
  proposicoes: ProposicaoApi[]
  parlamentares: { id: string; nome: string }[]
  loadingProposicoes: boolean
  loadingParlamentares: boolean
  createProposicao: ReturnType<typeof useProposicoes>['create']
  updateProposicao: ReturnType<typeof useProposicoes>['update']
  removeProposicao: ReturnType<typeof useProposicoes>['remove']

  // Tipos e dados
  tiposProposicao: TipoProposicaoConfig[]
  loadingTiposProposicao: boolean
  tiposTramitacao: TipoTramitacao[]
  tiposOrgaos: TipoOrgao[]
  tramitacoes: TramitacaoApi[]
  leisDisponiveis: ReturnType<typeof leisService.getAll>

  // Modais
  isModalOpen: boolean
  isTramitacaoModalOpen: boolean
  modalLeiAberto: boolean

  // Seleção e edição
  editingProposicao: ProposicaoApi | null
  selectedProposicao: ProposicaoApi | null

  // Filtros
  searchTerm: string
  statusFilter: string
  tipoFilter: string

  // Formulários
  formData: ProposicaoFormData
  tramitacaoFormData: TramitacaoFormData

  // Estado de ações
  comentarioAcao: string
  resultadoFinalizacao: '__sem__' | TramitacaoResultado
  acaoEmProcesso: 'advance' | 'reopen' | 'finalize' | null
  ultimoAvanco: TramitacaoAdvanceResponse | null

  // Leis referenciadas
  leiSelecionada: string
  tipoRelacao: string
  dispositivo: string
  justificativaLei: string

  // Ações
  loadTiposProposicao: () => Promise<void>
  loadTramitacoes: () => Promise<void>
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleEdit: (proposicao: ProposicaoApi) => void
  handleClose: () => void
  handleDelete: (id: string) => Promise<void>
  handleTramitar: (proposicao: ProposicaoApi) => void
  handleSubmitTramitacao: (e: React.FormEvent) => Promise<void>
  handleCloseTramitacao: () => void
  handleAdvanceTramitacao: () => Promise<void>
  handleReopenTramitacao: () => Promise<void>
  handleFinalizeTramitacao: () => Promise<void>
  handleTipoChange: (novoTipo: string) => Promise<void>
  handleAnoChange: (novoAno: number) => Promise<void>
  handleAdicionarLei: () => void
  handleRemoverLei: (index: number) => void
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveFile: (index: number) => void
  validarNumeroManual: (numero: string) => boolean
  getStatusDetalhado: (proposicaoId: string) => { status: string; unidadeAtual: string | null } | null

  // Setters
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setTipoFilter: (tipo: string) => void
  setFormData: React.Dispatch<React.SetStateAction<ProposicaoFormData>>
  setTramitacaoFormData: React.Dispatch<React.SetStateAction<TramitacaoFormData>>
  setIsModalOpen: (open: boolean) => void
  setComentarioAcao: (comentario: string) => void
  setResultadoFinalizacao: (resultado: '__sem__' | TramitacaoResultado) => void
  setLeiSelecionada: (lei: string) => void
  setTipoRelacao: (tipo: string) => void
  setDispositivo: (dispositivo: string) => void
  setJustificativaLei: (justificativa: string) => void
  setModalLeiAberto: (aberto: boolean) => void
}

export function useProposicoesState(): UseProposicoesStateReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hooks externos
  const { proposicoes, loading: loadingProposicoes, create, update, remove } = useProposicoes()
  const { parlamentares, loading: loadingParlamentares } = useParlamentares()

  // Estados de tipos e dados
  const [tiposProposicao, setTiposProposicao] = useState<TipoProposicaoConfig[]>([])
  const [loadingTiposProposicao, setLoadingTiposProposicao] = useState(true)
  const [tiposTramitacao, setTiposTramitacao] = useState<TipoTramitacao[]>([])
  const [tiposOrgaos, setTiposOrgaos] = useState<TipoOrgao[]>([])
  const [tramitacoes, setTramitacoes] = useState<TramitacaoApi[]>([])
  const [leisDisponiveis] = useState(() => leisService.getAll())

  // Estados de modais
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTramitacaoModalOpen, setIsTramitacaoModalOpen] = useState(false)
  const [modalLeiAberto, setModalLeiAberto] = useState(false)

  // Estados de seleção
  const [editingProposicao, setEditingProposicao] = useState<ProposicaoApi | null>(null)
  const [selectedProposicao, setSelectedProposicao] = useState<ProposicaoApi | null>(null)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [tipoFilter, setTipoFilter] = useState('TODOS')

  // Estados de formulários
  const [formData, setFormData] = useState<ProposicaoFormData>(getFormDataInicial())
  const [tramitacaoFormData, setTramitacaoFormData] = useState<TramitacaoFormData>(getTramitacaoFormDataInicial())

  // Estados de ações
  const [comentarioAcao, setComentarioAcao] = useState('')
  const [resultadoFinalizacao, setResultadoFinalizacao] = useState<'__sem__' | TramitacaoResultado>(RESULTADO_PADRAO)
  const [acaoEmProcesso, setAcaoEmProcesso] = useState<'advance' | 'reopen' | 'finalize' | null>(null)
  const [ultimoAvanco, setUltimoAvanco] = useState<TramitacaoAdvanceResponse | null>(null)

  // Estados de leis referenciadas
  const [leiSelecionada, setLeiSelecionada] = useState('')
  const [tipoRelacao, setTipoRelacao] = useState('')
  const [dispositivo, setDispositivo] = useState('')
  const [justificativaLei, setJustificativaLei] = useState('')

  const hasProcessedEditRef = useRef(false)

  // Carregadores
  const loadTiposProposicao = useCallback(async () => {
    try {
      setLoadingTiposProposicao(true)
      const response = await fetch('/api/tipos-proposicao?ativo=true')
      const result = await response.json()
      if (result.success && result.data) {
        setTiposProposicao(result.data)
      } else {
        console.error('Erro ao carregar tipos de proposição:', result.error)
        toast.error('Não foi possível carregar os tipos de proposição')
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de proposição:', error)
      toast.error('Erro ao carregar tipos de proposição')
    } finally {
      setLoadingTiposProposicao(false)
    }
  }, [])

  const loadTiposTramitacao = useCallback(async () => {
    try {
      const response = await fetch('/api/configuracoes/tipos-tramitacao?ativo=true')
      const result = await response.json()
      if (result.success && result.data) {
        // Mapear para o formato esperado pelo componente
        const tipos = result.data.map((t: any) => ({
          id: t.id,
          nome: t.nome,
          descricao: t.descricao,
          prazoRegimental: t.prazoRegimental,
          ativo: t.ativo,
          unidadeResponsavelId: t.unidadeResponsavelId,
          unidadeResponsavel: t.unidadeResponsavel
        }))
        setTiposTramitacao(tipos)
      } else {
        console.error('Erro ao carregar tipos de tramitação:', result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de tramitação:', error)
    }
  }, [])

  const loadTiposOrgaos = useCallback(async () => {
    try {
      const response = await fetch('/api/configuracoes/unidades-tramitacao?ativo=true')
      const result = await response.json()
      if (result.success && result.data) {
        // Mapear para o formato esperado pelo componente
        const unidades = result.data.map((u: any) => ({
          id: u.id,
          nome: u.nome,
          sigla: u.sigla || '',
          descricao: u.descricao,
          tipo: u.tipo,
          ativo: u.ativo
        }))
        setTiposOrgaos(unidades)
      } else {
        console.error('Erro ao carregar unidades de tramitação:', result.error)
      }
    } catch (error) {
      console.error('Erro ao carregar unidades de tramitação:', error)
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

  // Efeito para carregar dados iniciais
  useEffect(() => {
    void loadTiposProposicao()
    void loadTiposTramitacao()
    void loadTiposOrgaos()
    void loadTramitacoes()
  }, [loadTiposProposicao, loadTiposTramitacao, loadTiposOrgaos, loadTramitacoes])

  // Efeito para processar parâmetro de edição na URL
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && !loadingProposicoes && proposicoes.length > 0 && !hasProcessedEditRef.current) {
      const proposicaoParaEditar = proposicoes.find(p => p.id === editId)
      if (proposicaoParaEditar) {
        hasProcessedEditRef.current = true
        handleEdit(proposicaoParaEditar)
        router.replace('/admin/proposicoes')
      }
    }

    if (!searchParams.get('edit')) {
      hasProcessedEditRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadingProposicoes])

  // Handlers CRUD
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.tipo) {
      toast.error('Selecione um tipo de proposição')
      return
    }

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
          urlDocumento: formData.urlDocumento || undefined,
          status: 'EM_TRAMITACAO',
          dataApresentacao: new Date(formData.dataApresentacao).toISOString(),
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
          urlDocumento: formData.urlDocumento || undefined,
          status: 'APRESENTADA',
          dataApresentacao: new Date(formData.dataApresentacao).toISOString(),
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
  }, [formData, editingProposicao, create, update])

  const handleEdit = useCallback((proposicao: ProposicaoApi) => {
    setEditingProposicao(proposicao)
    const dataFormatada = proposicao.dataApresentacao
      ? new Date(proposicao.dataApresentacao).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

    setFormData({
      numero: proposicao.numero,
      numeroAutomatico: false,
      ano: proposicao.ano,
      tipo: proposicao.tipo && typeof proposicao.tipo === 'string' ? proposicao.tipo.toLowerCase() : proposicao.tipo,
      titulo: proposicao.titulo,
      ementa: proposicao.ementa,
      textoCompleto: proposicao.texto || '',
      dataApresentacao: dataFormatada,
      urlDocumento: (proposicao as any).urlDocumento || '',
      autorId: proposicao.autorId || '',
      autorEntidadeId: (proposicao as any).autorEntidadeId || '',
      usarNovoSistemaAutor: !!(proposicao as any).autorEntidadeId,
      autores: [],
      coautores: [],
      assuntos: [],
      anexos: [],
      leisReferenciadas: []
    })
    setIsModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsModalOpen(false)
    setEditingProposicao(null)
    setFormData(getFormDataInicial())
    setComentarioAcao('')
    setResultadoFinalizacao(RESULTADO_PADRAO)
    setAcaoEmProcesso(null)
    setUltimoAvanco(null)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta proposição?')) {
      const sucesso = await remove(id)
      if (sucesso) {
        toast.success('Proposição excluída com sucesso')
      }
    }
  }, [remove])

  // Handlers Tramitação
  const handleTramitar = useCallback((proposicao: ProposicaoApi) => {
    setSelectedProposicao(proposicao)
    setIsTramitacaoModalOpen(true)
    setTramitacaoFormData(getTramitacaoFormDataInicial())
    setComentarioAcao('')
    setResultadoFinalizacao(RESULTADO_PADRAO)
    setAcaoEmProcesso(null)
    setUltimoAvanco(null)
  }, [])

  const handleCloseTramitacao = useCallback(() => {
    setIsTramitacaoModalOpen(false)
    setSelectedProposicao(null)
    setTramitacaoFormData(getTramitacaoFormDataInicial())
    setComentarioAcao('')
    setResultadoFinalizacao(RESULTADO_PADRAO)
    setAcaoEmProcesso(null)
    setUltimoAvanco(null)
  }, [])

  const handleSubmitTramitacao = useCallback(async (e: React.FormEvent) => {
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
      await tramitacoesApi.create({
        proposicaoId: selectedProposicao.id,
        tipoTramitacaoId: tramitacaoFormData.tipoTramitacaoId,
        unidadeId,
        observacoes: tramitacaoFormData.observacoes || undefined,
        parecer: tramitacaoFormData.parecer || undefined
      })

      toast.success('Tramitação registrada com sucesso!')
      handleCloseTramitacao()
      void loadTramitacoes()
    } catch (error) {
      console.error('Erro ao registrar tramitação:', error)
      toast.error('Erro ao registrar tramitação.')
    }
  }, [selectedProposicao, tramitacaoFormData, handleCloseTramitacao, loadTramitacoes])

  const handleAdvanceTramitacao = useCallback(async () => {
    if (!selectedProposicao) return

    try {
      setAcaoEmProcesso('advance')
      const result = await tramitacoesApi.advance(selectedProposicao.id, {
        comentario: comentarioAcao || undefined
      })
      setUltimoAvanco(result)
      toast.success('Tramitação avançada com sucesso!')
      void loadTramitacoes()
    } catch (error) {
      console.error('Erro ao avançar tramitação:', error)
      toast.error('Erro ao avançar tramitação.')
    } finally {
      setAcaoEmProcesso(null)
      setComentarioAcao('')
    }
  }, [selectedProposicao, comentarioAcao, loadTramitacoes])

  const handleReopenTramitacao = useCallback(async () => {
    if (!selectedProposicao) return

    try {
      setAcaoEmProcesso('reopen')
      await tramitacoesApi.reopen(selectedProposicao.id, {
        observacoes: comentarioAcao || undefined
      })
      toast.success('Tramitação reaberta com sucesso!')
      void loadTramitacoes()
    } catch (error) {
      console.error('Erro ao reabrir tramitação:', error)
      toast.error('Erro ao reabrir tramitação.')
    } finally {
      setAcaoEmProcesso(null)
      setComentarioAcao('')
    }
  }, [selectedProposicao, comentarioAcao, loadTramitacoes])

  const handleFinalizeTramitacao = useCallback(async () => {
    if (!selectedProposicao) return

    if (resultadoFinalizacao === RESULTADO_PADRAO) {
      toast.error('Selecione um resultado para finalizar.')
      return
    }

    try {
      setAcaoEmProcesso('finalize')
      await tramitacoesApi.finalize(selectedProposicao.id, {
        resultado: resultadoFinalizacao as TramitacaoResultado,
        observacoes: comentarioAcao || undefined
      })
      toast.success('Tramitação finalizada com sucesso!')
      handleCloseTramitacao()
      void loadTramitacoes()
    } catch (error) {
      console.error('Erro ao finalizar tramitação:', error)
      toast.error('Erro ao finalizar tramitação.')
    } finally {
      setAcaoEmProcesso(null)
    }
  }, [selectedProposicao, resultadoFinalizacao, comentarioAcao, handleCloseTramitacao, loadTramitacoes])

  // Handlers de tipo e ano
  const handleTipoChange = useCallback(async (novoTipo: string) => {
    if (formData.numeroAutomatico) {
      try {
        const proximoNumero = await buscarProximoNumero(novoTipo.toUpperCase(), formData.ano)
        setFormData(prev => ({
          ...prev,
          tipo: novoTipo,
          numero: proximoNumero
        }))
      } catch (error) {
        console.error('Erro ao gerar número automático:', error)
        setFormData(prev => ({
          ...prev,
          tipo: novoTipo
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        tipo: novoTipo
      }))
    }
  }, [formData.numeroAutomatico, formData.ano])

  const handleAnoChange = useCallback(async (novoAno: number) => {
    if (formData.numeroAutomatico) {
      try {
        const proximoNumero = await buscarProximoNumero(formData.tipo.toUpperCase(), novoAno)
        setFormData(prev => ({
          ...prev,
          ano: novoAno,
          numero: proximoNumero
        }))
      } catch (error) {
        console.error('Erro ao gerar número automático:', error)
        setFormData(prev => ({
          ...prev,
          ano: novoAno
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        ano: novoAno
      }))
    }
  }, [formData.numeroAutomatico, formData.tipo])

  // Handlers de leis referenciadas
  const handleAdicionarLei = useCallback(() => {
    if (!leiSelecionada || !tipoRelacao) {
      toast.error('Selecione uma lei e o tipo de relação.')
      return
    }

    const lei = leisDisponiveis.find(l => l.id === leiSelecionada)
    if (!lei) return

    const novaLei = {
      id: `${Date.now()}`,
      leiId: lei.id,
      leiNumero: lei.numero,
      leiTitulo: lei.titulo,
      tipoRelacao,
      dispositivo: dispositivo || undefined,
      justificativa: justificativaLei || undefined
    }

    setFormData(prev => ({
      ...prev,
      leisReferenciadas: [...prev.leisReferenciadas, novaLei]
    }))

    setLeiSelecionada('')
    setTipoRelacao('')
    setDispositivo('')
    setJustificativaLei('')
    setModalLeiAberto(false)
    toast.success('Lei adicionada à proposição.')
  }, [leiSelecionada, tipoRelacao, dispositivo, justificativaLei, leisDisponiveis])

  const handleRemoverLei = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      leisReferenciadas: prev.leisReferenciadas.filter((_, i) => i !== index)
    }))
  }, [])

  // Handlers de arquivos
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} excede 10MB.`)
        return false
      }
      return true
    })

    setFormData(prev => ({
      ...prev,
      anexos: [...prev.anexos, ...newFiles]
    }))
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index)
    }))
  }, [])

  // Validação de número manual - considera tipo + número + ano
  const validarNumeroManual = useCallback((numero: string): boolean => {
    if (!formData.numeroAutomatico && numero && formData.tipo) {
      const existe = proposicoes.some(p =>
        p.numero === numero &&
        p.ano === formData.ano &&
        p.tipo === formData.tipo.toUpperCase() &&
        p.id !== editingProposicao?.id
      )
      return !existe
    }
    return true
  }, [formData.numeroAutomatico, formData.ano, formData.tipo, proposicoes, editingProposicao])

  // Obter status detalhado
  const getStatusDetalhado = useCallback((proposicaoId: string) => {
    const tramitacao = tramitacoes.find(t => t.proposicaoId === proposicaoId)
    if (!tramitacao) return null

    return {
      status: tramitacao.status,
      unidadeAtual: tramitacao.unidade?.nome || null
    }
  }, [tramitacoes])

  return {
    // Dados externos
    proposicoes,
    parlamentares,
    loadingProposicoes,
    loadingParlamentares,
    createProposicao: create,
    updateProposicao: update,
    removeProposicao: remove,

    // Tipos e dados
    tiposProposicao,
    loadingTiposProposicao,
    tiposTramitacao,
    tiposOrgaos,
    tramitacoes,
    leisDisponiveis,

    // Modais
    isModalOpen,
    isTramitacaoModalOpen,
    modalLeiAberto,

    // Seleção e edição
    editingProposicao,
    selectedProposicao,

    // Filtros
    searchTerm,
    statusFilter,
    tipoFilter,

    // Formulários
    formData,
    tramitacaoFormData,

    // Estado de ações
    comentarioAcao,
    resultadoFinalizacao,
    acaoEmProcesso,
    ultimoAvanco,

    // Leis referenciadas
    leiSelecionada,
    tipoRelacao,
    dispositivo,
    justificativaLei,

    // Ações
    loadTiposProposicao,
    loadTramitacoes,
    handleSubmit,
    handleEdit,
    handleClose,
    handleDelete,
    handleTramitar,
    handleSubmitTramitacao,
    handleCloseTramitacao,
    handleAdvanceTramitacao,
    handleReopenTramitacao,
    handleFinalizeTramitacao,
    handleTipoChange,
    handleAnoChange,
    handleAdicionarLei,
    handleRemoverLei,
    handleFileUpload,
    handleRemoveFile,
    validarNumeroManual,
    getStatusDetalhado,

    // Setters
    setSearchTerm,
    setStatusFilter,
    setTipoFilter,
    setFormData,
    setTramitacaoFormData,
    setIsModalOpen,
    setComentarioAcao,
    setResultadoFinalizacao,
    setLeiSelecionada,
    setTipoRelacao,
    setDispositivo,
    setJustificativaLei,
    setModalLeiAberto
  }
}
