'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Pareceres das Comissoes
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os pareceres elaborados pelas comissoes sobre proposicoes
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Parecer
        </Button>
      </div>

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
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum parecer encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando o primeiro parecer.'}
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Novo Parecer
                </Button>
              )}
            </CardContent>
          </Card>
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
