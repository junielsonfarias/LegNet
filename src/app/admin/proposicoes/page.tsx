'use client'

import { Suspense, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  Clock,
  Calendar,
  ArrowRight,
  Loader2,
  Check,
  RefreshCw
} from 'lucide-react'
import { ProposicoesListSkeleton } from '@/components/skeletons/proposicao-skeleton'
import { useProposicoesState } from './_hooks/use-proposicoes-state'
import { ProposicoesFilters, ProposicaoCard } from './_components'
import {
  SELECT_AUTO,
  RESULTADO_PADRAO,
  RESULTADOS_TRAMITACAO,
  type TramitacaoResultado
} from './_types'

function ProposicoesContent() {
  const router = useRouter()
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="numero">
                      Número {formData.numeroAutomatico ? '(Gerado)' : '(Manual)'}
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
                        Este número já existe para este tipo no ano selecionado.
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
                    <Label htmlFor="dataApresentacao">Data de Apresentação</Label>
                    <Input
                      id="dataApresentacao"
                      type="date"
                      value={formData.dataApresentacao}
                      onChange={(e) => setFormData({ ...formData, dataApresentacao: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={handleTipoChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingTiposProposicao ? (
                          <SelectItem value="loading" disabled>Carregando tipos...</SelectItem>
                        ) : tiposProposicao.length === 0 ? (
                          <SelectItem value="empty" disabled>Nenhum tipo cadastrado</SelectItem>
                        ) : (
                          tiposProposicao.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.codigo}>
                              <div className="flex items-center gap-2">
                                {tipo.corBadge && (
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tipo.corBadge }}
                                  />
                                )}
                                <span>{tipo.nome} ({tipo.sigla})</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
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
                  />
                </div>

                <div>
                  <Label htmlFor="urlDocumento">URL do Documento (Opcional)</Label>
                  <Input
                    id="urlDocumento"
                    type="url"
                    value={formData.urlDocumento}
                    onChange={(e) => setFormData({ ...formData, urlDocumento: e.target.value })}
                    placeholder="https://drive.google.com/..."
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
                  <Label>Coautores</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !formData.autores.includes(value)) {
                        setFormData({ ...formData, autores: [...formData.autores, value] })
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

                {/* Anexos */}
                <div>
                  <Label>Anexos</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      id="anexos"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="anexos" className="cursor-pointer flex flex-col items-center text-gray-500">
                      <span className="text-sm">Clique para anexar arquivos (PDF, DOC, DOCX)</span>
                      <span className="text-xs text-gray-400 mt-1">Máximo: 10MB por arquivo</span>
                    </label>
                  </div>
                  {formData.anexos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.anexos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-sm">
                          <span>{file.name} ({formatFileSize(file.size)})</span>
                          <button type="button" onClick={() => handleRemoveFile(index)} className="text-red-500">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Leis Referenciadas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Leis Referenciadas</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setModalLeiAberto(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar Lei
                    </Button>
                  </div>
                  {formData.leisReferenciadas.length > 0 && (
                    <div className="space-y-2">
                      {formData.leisReferenciadas.map((lei, index) => (
                        <div key={lei.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                          <div>
                            <span className="font-medium">{lei.leiNumero}</span>
                            <span className="mx-2">-</span>
                            <span>{getTipoRelacaoLabel(lei.tipoRelacao)}</span>
                            {lei.dispositivo && <span className="text-gray-500 ml-2">({lei.dispositivo})</span>}
                          </div>
                          <button type="button" onClick={() => handleRemoverLei(index)} className="text-red-500">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-camara-primary">
                Tramitação - {selectedProposicao.numero}/{selectedProposicao.ano}
              </CardTitle>
              <CardDescription>{selectedProposicao.titulo}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Atual */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Atual</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium">Localização:</span>
                      <span className="ml-2">{statusDetalhadoAtual?.localizacao ?? 'Não iniciada'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="font-medium">Prazo:</span>
                      <span className="ml-2">
                        {statusDetalhadoAtual?.prazo
                          ? new Date(statusDetalhadoAtual.prazo).toLocaleDateString('pt-BR')
                          : 'Sem prazo definido'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações de Tramitação */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Ações sobre a Tramitação</h3>
                    <p className="text-sm text-gray-600">Avançar, reabrir ou finalizar a tramitação</p>
                  </div>
                  {tramitacaoAtual && (
                    <Badge variant="outline">
                      Etapa: {tramitacaoAtual.tipoTramitacao?.nome ?? 'Não identificada'}
                    </Badge>
                  )}
                </div>

                {ultimoAvanco && (
                  <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {ultimoAvanco.novaEtapa
                      ? `Avançada para ${ultimoAvanco.novaEtapa.tipoTramitacao?.nome ?? 'próxima etapa'}`
                      : 'Etapa finalizada sem próxima etapa configurada.'}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Button
                    type="button"
                    onClick={handleAdvanceTramitacao}
                    disabled={!podeAvancar || acaoEmProcesso !== null}
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
                  >
                    {acaoEmProcesso === 'finalize' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Finalizar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReopenTramitacao}
                    disabled={!podeReabrir || acaoEmProcesso !== null}
                  >
                    {acaoEmProcesso === 'reopen' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Reabrir
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="comentarioAcao">Comentário</Label>
                    <Textarea
                      id="comentarioAcao"
                      value={comentarioAcao}
                      onChange={(e) => setComentarioAcao(e.target.value)}
                      placeholder="Observações para a ação executada"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resultadoFinalizacao">Resultado (para finalização)</Label>
                    <Select
                      value={resultadoFinalizacao}
                      onValueChange={(valor) => setResultadoFinalizacao(valor as '__sem__' | TramitacaoResultado)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o resultado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RESULTADO_PADRAO}>Sem resultado</SelectItem>
                        {RESULTADOS_TRAMITACAO.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notificações */}
              {notificacoesSelecionadas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notificações Automáticas</h3>
                  <div className="space-y-2">
                    {notificacoesSelecionadas.map(notif => (
                      <div key={notif.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{notif.canal.toUpperCase()}</Badge>
                          <span>{notif.destinatario}</span>
                          <Badge variant="secondary" className="ml-auto">{notif.status ?? 'pendente'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nova Tramitação Manual */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Registrar Nova Tramitação Manual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Tramitação</Label>
                    <Select
                      value={tramitacaoFormData.tipoTramitacaoId}
                      onValueChange={(value) => setTramitacaoFormData({ ...tramitacaoFormData, tipoTramitacaoId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposTramitacao.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade de Destino</Label>
                    <Select
                      value={tramitacaoFormData.unidadeId}
                      onValueChange={(value) => setTramitacaoFormData({ ...tramitacaoFormData, unidadeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SELECT_AUTO}>Automática</SelectItem>
                        {tiposOrgaos.map((orgao) => (
                          <SelectItem key={orgao.id} value={orgao.id}>
                            {orgao.nome} ({orgao.sigla})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Observações</Label>
                  <Textarea
                    value={tramitacaoFormData.observacoes}
                    onChange={(e) => setTramitacaoFormData({ ...tramitacaoFormData, observacoes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCloseTramitacao}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Lei Referenciada */}
      {modalLeiAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Adicionar Lei Referenciada</CardTitle>
              <CardDescription>Selecione uma lei e o tipo de relação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Lei</Label>
                <Select value={leiSelecionada} onValueChange={setLeiSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma lei" />
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
                <Label>Tipo de Relação</Label>
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
                <Label>Dispositivo Específico (Opcional)</Label>
                <Input
                  value={dispositivo}
                  onChange={(e) => setDispositivo(e.target.value)}
                  placeholder="Ex: Art. 15, § 2º"
                />
              </div>
              <div>
                <Label>Justificativa (Opcional)</Label>
                <Textarea
                  value={justificativaLei}
                  onChange={(e) => setJustificativaLei(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalLeiAberto(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleAdicionarLei}>
                  Adicionar Lei
                </Button>
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
