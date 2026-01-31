'use client'

import { Suspense, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { ProposicoesListSkeleton } from '@/components/skeletons/proposicao-skeleton'
import { useProposicoesState } from './_hooks/use-proposicoes-state'
import {
  ProposicoesFilters,
  ProposicaoCard,
  ProposicaoFormModal,
  TramitacaoModal,
  LeiReferenciadaModal
} from './_components'

function ProposicoesContent() {
  const state = useProposicoesState()

  const {
    // Dados externos
    proposicoes,
    parlamentares,
    loadingProposicoes,
    loadingParlamentares,

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
    handleSubmit,
    handleEdit,
    handleClose,
    handleDelete,
    handleTramitar,
    handleTipoChange,
    handleAnoChange,
    handleAdicionarLei,
    handleRemoverLei,
    handleFileUpload,
    handleRemoveFile,
    validarNumeroManual,
    getStatusDetalhado,
    handleSubmitTramitacao,
    handleAdvanceTramitacao,
    handleReopenTramitacao,
    handleFinalizeTramitacao,
    handleCloseTramitacao,

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
  } = state

  // Computed values
  const filteredProposicoes = useMemo(() => {
    return (proposicoes || []).filter(proposicao => {
      if (!proposicao) return false
      const matchesSearch = searchTerm === '' ||
        (proposicao.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (proposicao.ementa?.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'TODOS' || proposicao.status === statusFilter
      const matchesTipo = tipoFilter === 'TODOS' ||
        (proposicao.tipo?.toLowerCase() === tipoFilter.toLowerCase())
      return matchesSearch && matchesStatus && matchesTipo
    })
  }, [proposicoes, searchTerm, statusFilter, tipoFilter])

  const statusDetalhadoAtual = useMemo(() => {
    if (!selectedProposicao) return null
    const relacionadas = tramitacoes
      .filter(t => t.proposicaoId === selectedProposicao.id)
      .sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime())

    if (!relacionadas.length) {
      return {
        status: 'NÃO_TRAMITADA',
        localizacao: 'Não iniciada',
        descricao: 'Proposição ainda não foi protocolada',
        prazo: null,
        proximoPasso: 'Protocolo na Mesa Diretora',
        tramitacaoAtual: null
      }
    }

    const atual = relacionadas[0]
    const tipoTramitacao = tiposTramitacao.find(tipo => tipo.id === atual.tipoTramitacaoId)
    const unidade = tiposOrgaos.find(orgao => orgao.id === atual.unidadeId)

    return {
      status: atual.status,
      localizacao: unidade?.nome || 'Órgão não identificado',
      descricao: atual.observacoes || '',
      prazo: atual.prazoVencimento ?? null,
      proximoPasso: 'Próxima etapa do processo',
      tramitacaoAtual: atual,
      tipoTramitacao,
      unidade
    }
  }, [selectedProposicao, tramitacoes, tiposTramitacao, tiposOrgaos])

  const tramitacaoAtual = statusDetalhadoAtual?.tramitacaoAtual
  const podeAvancar = tramitacaoAtual?.status === 'EM_ANDAMENTO'
  const podeFinalizar = tramitacaoAtual?.status === 'EM_ANDAMENTO'
  const podeReabrir = tramitacaoAtual?.status === 'CONCLUIDA'

  const notificacoesSelecionadas = useMemo(() => {
    if (!selectedProposicao) return []
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

  // Helpers
  const handleNumeroAutomaticoChange = async (checked: boolean) => {
    if (checked && formData.tipo) {
      try {
        const { buscarProximoNumero } = await import('@/lib/utils/proposicao-numero')
        const proximoNumero = await buscarProximoNumero(formData.tipo.toUpperCase(), formData.ano)
        setFormData(prev => ({ ...prev, numeroAutomatico: true, numero: proximoNumero }))
      } catch (error) {
        console.error('Erro ao gerar número automático:', error)
        setFormData(prev => ({ ...prev, numeroAutomatico: true }))
      }
    } else {
      setFormData(prev => ({ ...prev, numeroAutomatico: checked }))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTipoRelacaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'altera': 'Altera',
      'revoga': 'Revoga',
      'inclui': 'Inclui',
      'exclui': 'Exclui',
      'regulamenta': 'Regulamenta',
      'complementa': 'Complementa'
    }
    return labels[tipo] || tipo
  }

  // Loading state
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
      <ProposicoesFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        tipoFilter={tipoFilter}
        tiposProposicao={tiposProposicao}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onTipoChange={setTipoFilter}
      />

      {/* Lista de Proposições */}
      <div className="space-y-3">
        {filteredProposicoes.map((proposicao) => (
          <ProposicaoCard
            key={proposicao.id}
            proposicao={proposicao}
            tiposProposicao={tiposProposicao}
            parlamentares={parlamentares}
            statusDetalhado={getStatusDetalhado(proposicao.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTramitar={handleTramitar}
          />
        ))}

        {/* Estado vazio */}
        {filteredProposicoes.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma proposição encontrada</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'TODOS' || tipoFilter !== 'TODOS'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Nova Proposição" para criar a primeira'}
            </p>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      {filteredProposicoes.length > 0 && (
        <div className="text-center text-sm text-gray-500 py-2">
          Mostrando {filteredProposicoes.length} de {proposicoes.length} proposições
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <ProposicaoFormModal
        isOpen={isModalOpen}
        editingProposicao={editingProposicao}
        formData={formData}
        tiposProposicao={tiposProposicao}
        loadingTiposProposicao={loadingTiposProposicao}
        parlamentares={parlamentares}
        unidades={tiposOrgaos}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
        onNumeroAutomaticoChange={async (checked) => {
          if (checked && formData.tipo) {
            try {
              const { buscarProximoNumero } = await import('@/lib/utils/proposicao-numero')
              const proximoNumero = await buscarProximoNumero(formData.tipo.toUpperCase(), formData.ano)
              setFormData(prev => ({ ...prev, numeroAutomatico: true, numero: proximoNumero }))
            } catch (error) {
              console.error('Erro ao gerar número automático:', error)
              setFormData(prev => ({ ...prev, numeroAutomatico: true }))
            }
          } else {
            setFormData(prev => ({ ...prev, numeroAutomatico: checked }))
          }
        }}
        onTipoChange={handleTipoChange}
        onAnoChange={handleAnoChange}
        onFileUpload={handleFileUpload}
        onRemoveFile={handleRemoveFile}
        onOpenLeiModal={() => setModalLeiAberto(true)}
        onRemoverLei={handleRemoverLei}
        validarNumeroManual={validarNumeroManual}
      />

      {/* Modal de Tramitação */}
      <TramitacaoModal
        isOpen={isTramitacaoModalOpen}
        proposicao={selectedProposicao}
        statusDetalhado={statusDetalhadoAtual}
        tramitacaoFormData={tramitacaoFormData}
        tiposTramitacao={tiposTramitacao}
        tiposOrgaos={tiposOrgaos}
        notificacoes={notificacoesSelecionadas}
        comentarioAcao={comentarioAcao}
        resultadoFinalizacao={resultadoFinalizacao}
        acaoEmProcesso={acaoEmProcesso}
        ultimoAvanco={ultimoAvanco}
        onClose={handleCloseTramitacao}
        onAdvance={handleAdvanceTramitacao}
        onReopen={handleReopenTramitacao}
        onFinalize={handleFinalizeTramitacao}
        onSubmitTramitacao={handleSubmitTramitacao}
        onTramitacaoFormDataChange={setTramitacaoFormData}
        onComentarioChange={setComentarioAcao}
        onResultadoChange={setResultadoFinalizacao}
      />

      {/* Modal de Lei Referenciada */}
      <LeiReferenciadaModal
        isOpen={modalLeiAberto}
        leisDisponiveis={leisDisponiveis}
        leiSelecionada={leiSelecionada}
        tipoRelacao={tipoRelacao}
        dispositivo={dispositivo}
        justificativa={justificativaLei}
        onClose={() => setModalLeiAberto(false)}
        onAdd={handleAdicionarLei}
        onLeiChange={setLeiSelecionada}
        onTipoRelacaoChange={setTipoRelacao}
        onDispositivoChange={setDispositivo}
        onJustificativaChange={setJustificativaLei}
      />
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
