'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { usePareceres, Parecer, CreateParecerInput, UpdateParecerInput } from '@/lib/hooks/use-pareceres'
import { useComissoes } from '@/lib/hooks/use-comissoes'
import { calcularStats } from './types'
import { PareceresStats } from './components/PareceresStats'
import { PareceresFilters } from './components/PareceresFilters'
import { ParecerForm } from './components/ParecerForm'
import { ParecerCard } from './components/ParecerCard'
import { VotacaoDialog } from './components/VotacaoDialog'
import { DetalhesDialog } from './components/DetalhesDialog'

export default function PareceresAdminPage() {
  const [filters, setFilters] = useState<{
    comissaoId?: string
    status?: string
    tipo?: string
  }>({})

  const {
    pareceres,
    loading,
    create,
    update,
    remove,
    votar,
    encerrarVotacao,
    getVotos,
    enviarParaVotacao,
    emitirParecer,
    arquivar
  } = usePareceres(filters)

  const { comissoes } = useComissoes()

  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingParecer, setEditingParecer] = useState<Parecer | null>(null)
  const [showVotacaoDialog, setShowVotacaoDialog] = useState(false)
  const [selectedParecer, setSelectedParecer] = useState<Parecer | null>(null)
  const [votosInfo, setVotosInfo] = useState<any>(null)
  const [showDetalhesDialog, setShowDetalhesDialog] = useState(false)

  const handleSubmit = async (data: CreateParecerInput | UpdateParecerInput, isEditing: boolean, parecerId?: string) => {
    if (isEditing && parecerId) {
      await update(parecerId, data as UpdateParecerInput)
    } else {
      await create(data as CreateParecerInput)
    }
    resetForm()
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingParecer(null)
  }

  const handleEdit = (parecer: Parecer) => {
    setEditingParecer(parecer)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este parecer?')) {
      await remove(id)
    }
  }

  const handleOpenVotacao = async (parecer: Parecer) => {
    setSelectedParecer(parecer)
    const votos = await getVotos(parecer.id)
    setVotosInfo(votos)
    setShowVotacaoDialog(true)
  }

  const handleVotar = async (parlamentarId: string, voto: 'SIM' | 'NAO' | 'ABSTENCAO') => {
    if (!selectedParecer) return
    const result = await votar(selectedParecer.id, { parlamentarId, voto })
    if (result) {
      const votos = await getVotos(selectedParecer.id)
      setVotosInfo(votos)
    }
  }

  const handleEncerrarVotacao = async (resultado: 'APROVADO_COMISSAO' | 'REJEITADO_COMISSAO') => {
    if (!selectedParecer) return
    const motivoRejeicao = resultado === 'REJEITADO_COMISSAO'
      ? prompt('Informe o motivo da rejeicao (opcional):') || undefined
      : undefined
    await encerrarVotacao(selectedParecer.id, {
      action: 'encerrar',
      resultado,
      motivoRejeicao
    })
    setShowVotacaoDialog(false)
    setSelectedParecer(null)
  }

  const handleEnviarParaVotacao = async (parecer: Parecer) => {
    if (confirm('Enviar parecer para votacao na comissao?')) {
      await enviarParaVotacao(parecer.id)
    }
  }

  const handleEmitirParecer = async (parecer: Parecer) => {
    if (confirm('Emitir parecer oficialmente?')) {
      await emitirParecer(parecer.id)
    }
  }

  const handleArquivar = async (parecer: Parecer) => {
    if (confirm('Arquivar este parecer?')) {
      await arquivar(parecer.id)
    }
  }

  const handleOpenDetalhes = (parecer: Parecer) => {
    setSelectedParecer(parecer)
    setShowDetalhesDialog(true)
  }

  const filteredPareceres = pareceres.filter(parecer => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      parecer.numero?.toLowerCase().includes(search) ||
      parecer.proposicao?.titulo?.toLowerCase().includes(search) ||
      parecer.comissao?.nome?.toLowerCase().includes(search) ||
      parecer.relator?.nome?.toLowerCase().includes(search)
    )
  })

  const stats = calcularStats(pareceres)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pareceres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pareceres das Comissoes"
        subtitle="Gerencie os pareceres elaborados pelas comissoes sobre proposicoes"
        icon={FileText}
        onNewClick={() => setShowForm(true)}
        newLabel="Novo Parecer"
      />

      {/* Estatisticas */}
      <PareceresStats stats={stats} />

      {/* Filtros */}
      <PareceresFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        comissoes={comissoes}
      />

      {/* Formulario de Parecer */}
      {showForm && (
        <ParecerForm
          editingParecer={editingParecer}
          comissoes={comissoes}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}

      {/* Lista de Pareceres */}
      <div className="space-y-4">
        {filteredPareceres.map((parecer) => (
          <ParecerCard
            key={parecer.id}
            parecer={parecer}
            onView={handleOpenDetalhes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEnviarParaVotacao={handleEnviarParaVotacao}
            onOpenVotacao={handleOpenVotacao}
            onEmitir={handleEmitirParecer}
            onArquivar={handleArquivar}
          />
        ))}

        {filteredPareceres.length === 0 && !loading && (
          <EmptyState
            icon={FileText}
            title="Nenhum parecer encontrado"
            description={
              searchTerm || Object.keys(filters).length > 0
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando o primeiro parecer.'
            }
            onCreateClick={
              !searchTerm && Object.keys(filters).length === 0
                ? () => setShowForm(true)
                : undefined
            }
            createLabel="Novo Parecer"
          />
        )}
      </div>

      {/* Dialog de Votacao */}
      <VotacaoDialog
        open={showVotacaoDialog}
        onOpenChange={setShowVotacaoDialog}
        parecer={selectedParecer}
        votosInfo={votosInfo}
        onVotar={handleVotar}
        onEncerrar={handleEncerrarVotacao}
      />

      {/* Dialog de Detalhes */}
      <DetalhesDialog
        open={showDetalhesDialog}
        onOpenChange={setShowDetalhesDialog}
        parecer={selectedParecer}
      />
    </div>
  )
}
