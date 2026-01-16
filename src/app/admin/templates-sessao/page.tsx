"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardList,
  Clock,
  Edit,
  FilePlus2,
  Filter,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  useSessaoTemplates,
  type UseSessaoTemplatesOptions,
} from "@/lib/hooks/use-sessao-templates"

const TIPO_SESSAO_OPTIONS: Array<{ value: UseSessaoTemplatesOptions["tipo"] | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Todas" },
  { value: "ORDINARIA", label: "Ordinária" },
  { value: "EXTRAORDINARIA", label: "Extraordinária" },
  { value: "SOLENE", label: "Solene" },
  { value: "ESPECIAL", label: "Especial" },
]

const PAUTA_SECOES = [
  { value: "EXPEDIENTE", label: "Expediente" },
  { value: "ORDEM_DO_DIA", label: "Ordem do Dia" },
  { value: "COMUNICACOES", label: "Comunicações" },
  { value: "HONRAS", label: "Homenagens" },
  { value: "OUTROS", label: "Outros" },
]

const TIPO_PROPOSICAO_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: "PROJETO_LEI", label: "Projeto de Lei" },
  { value: "PROJETO_RESOLUCAO", label: "Projeto de Resolução" },
  { value: "PROJETO_DECRETO", label: "Projeto de Decreto" },
  { value: "INDICACAO", label: "Indicação" },
  { value: "REQUERIMENTO", label: "Requerimento" },
  { value: "MOCAO", label: "Moção" },
  { value: "VOTO_PESAR", label: "Voto de Pesar" },
  { value: "VOTO_APLAUSO", label: "Voto de Aplauso" },
]

interface TemplateItemForm {
  localId: string
  secao: string
  titulo: string
  descricao: string
  tempoEstimado: string
  tipoProposicao: string
  obrigatorio: boolean
}

interface TemplateFormData {
  id?: string
  nome: string
  descricao: string
  tipo: "ORDINARIA" | "EXTRAORDINARIA" | "SOLENE" | "ESPECIAL"
  ativo: boolean
  duracaoEstimativa: string
  itens: TemplateItemForm[]
}

const createEmptyItem = (): TemplateItemForm => ({
  localId: crypto.randomUUID(),
  secao: "EXPEDIENTE",
  titulo: "",
  descricao: "",
  tempoEstimado: "",
  tipoProposicao: "",
  obrigatorio: false,
})

export default function TemplatesSessaoPage() {
  const [tipoFiltro, setTipoFiltro] = useState<UseSessaoTemplatesOptions["tipo"] | "TODOS">("TODOS")
  const [apenasAtivos, setApenasAtivos] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const {
    templates,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
  } = useSessaoTemplates({
    tipo: tipoFiltro === "TODOS" ? undefined : tipoFiltro,
    ativo: apenasAtivos ? true : undefined,
  })

  const initialFormState: TemplateFormData = {
    nome: "",
    descricao: "",
    tipo: "ORDINARIA",
    ativo: true,
    duracaoEstimativa: "",
    itens: [createEmptyItem()],
  }

  const [formData, setFormData] = useState<TemplateFormData>(initialFormState)

  const tempoTotalItensForm = useMemo(() => {
    return formData.itens.reduce((total, item) => {
      const valor = Number.parseInt(item.tempoEstimado, 10)
      return total + (Number.isFinite(valor) ? valor : 0)
    }, 0)
  }, [formData.itens])

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.descricao || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTipo = tipoFiltro === "TODOS" || template.tipo === tipoFiltro
      const matchesAtivo = !apenasAtivos || template.ativo

      return matchesSearch && matchesTipo && matchesAtivo
    })
  }, [templates, searchTerm, tipoFiltro, apenasAtivos])

  const resetForm = () => {
    setFormData(initialFormState)
    setEditingTemplateId(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      toast.error("Template não encontrado")
      return
    }

    const itensOrdenados = [...template.itens].sort((a, b) => a.ordem - b.ordem)

    setFormData({
      id: template.id,
      nome: template.nome,
      descricao: template.descricao || "",
      tipo: template.tipo,
      ativo: template.ativo,
      duracaoEstimativa: template.duracaoEstimativa ? String(template.duracaoEstimativa) : "",
      itens: itensOrdenados.map((item) => ({
        localId: crypto.randomUUID(),
        secao: item.secao,
        titulo: item.titulo,
        descricao: item.descricao || "",
        tempoEstimado: item.tempoEstimado ? String(item.tempoEstimado) : "",
        tipoProposicao: item.tipoProposicao || "",
        obrigatorio: item.obrigatorio,
      })),
    })
    setEditingTemplateId(templateId)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      itens: [...prev.itens, createEmptyItem()],
    }))
  }

  const handleRemoveItem = (localId: string) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((item) => item.localId !== localId),
    }))
  }

  const updateItemField = (localId: string, field: keyof TemplateItemForm, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.map((item) =>
        item.localId === localId
          ? { ...item, [field]: value }
          : item,
      ),
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const ordemPorSecao = new Map<string, number>()
    type SecaoType = 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'HONRAS' | 'COMUNICACOES' | 'OUTROS'

    const itensValidos = formData.itens
      .map((item) => {
        const secao = item.secao as SecaoType
        const titulo = item.titulo.trim()

        if (!titulo) {
          return null
        }

        const valorAtual = ordemPorSecao.get(secao) ?? 0
        const ordemNormalizada = valorAtual + 1
        ordemPorSecao.set(secao, ordemNormalizada)

        return {
          secao,
          ordem: ordemNormalizada,
          titulo,
          descricao: item.descricao.trim() || undefined,
          tempoEstimado: item.tempoEstimado ? Number.parseInt(item.tempoEstimado, 10) : undefined,
          tipoProposicao: item.tipoProposicao || undefined,
          obrigatorio: item.obrigatorio,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    if (itensValidos.length === 0) {
      toast.error("Informe ao menos um item válido no template")
      return
    }

    const payload = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || undefined,
      tipo: formData.tipo,
      ativo: formData.ativo,
      duracaoEstimativa: formData.duracaoEstimativa
        ? Number(formData.duracaoEstimativa)
        : undefined,
      itens: itensValidos,
    }

    try {
      if (editingTemplateId) {
        await update(editingTemplateId, payload)
      } else {
        await create(payload)
      }
      closeModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar template"
      toast.error(message)
    }
  }

  const handleToggleAtivo = async (templateId: string, ativoAtual: boolean) => {
    try {
      await update(templateId, { ativo: !ativoAtual })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar template"
      toast.error(message)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) {
      return
    }
    try {
      await remove(templateId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir template"
      toast.error(message)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Sessão</h1>
          <p className="text-gray-600">Crie estruturas padrão para geração automática de pautas.</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-2"
          aria-label="Criar novo template"
        >
          <FilePlus2 className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>Refine os templates exibidos na listagem.</CardDescription>
          </div>
          <Button variant="outline" onClick={refetch} aria-label="Atualizar lista de templates">
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Pesquisar por nome ou descrição..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                tabIndex={0}
                aria-label="Buscar template"
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo de sessão</Label>
              <select
                id="tipo"
                value={tipoFiltro}
                onChange={(event) =>
                  setTipoFiltro(event.target.value as UseSessaoTemplatesOptions["tipo"] | "TODOS")
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                tabIndex={0}
                aria-label="Filtrar por tipo de sessão"
              >
                {TIPO_SESSAO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={apenasAtivos}
                  onChange={(event) => setApenasAtivos(event.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  tabIndex={0}
                  aria-label="Exibir apenas templates ativos"
                />
                Apenas ativos
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            Carregando templates...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-gray-500">
                Nenhum template encontrado com os filtros selecionados.
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => {
              const tempoTotalItens = template.itens.reduce((total, item) => total + (item.tempoEstimado ?? 0), 0)

              return (
                <Card key={template.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {template.nome}
                      <Badge>{template.tipo}</Badge>
                      <Badge className={template.ativo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}>
                        {template.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardTitle>
                    {template.descricao && (
                      <CardDescription className="mt-1 max-w-3xl text-sm text-gray-600">
                        {template.descricao}
                      </CardDescription>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" />
                        {template.itens.length} itens
                      </span>
                      {template.duracaoEstimativa ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {template.duracaoEstimativa} min estimados
                        </span>
                      ) : null}
                      {tempoTotalItens > 0 ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Clock className="h-4 w-4" />
                          Itens: {tempoTotalItens} min
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAtivo(template.id, template.ativo)}
                      aria-label={template.ativo ? "Desativar template" : "Ativar template"}
                    >
                      {template.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(template.id)}
                      aria-label="Editar template"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-700"
                      aria-label="Excluir template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {PAUTA_SECOES.map((secao) => {
                    const itensSecao = template.itens
                      .filter((item) => item.secao === secao.value)
                      .sort((a, b) => a.ordem - b.ordem)
                    if (itensSecao.length === 0) return null
                    return (
                      <div key={secao.value} className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase text-gray-600">{secao.label}</h3>
                        <div className="grid gap-2">
                          {itensSecao.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-medium text-gray-800">{item.titulo}</p>
                                  {item.descricao && (
                                    <p className="text-sm text-gray-600">{item.descricao}</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <span>Ordem: {item.ordem}</span>
                                  {item.tempoEstimado ? <span>{item.tempoEstimado} min</span> : null}
                                  {item.tipoProposicao ? <span>{item.tipoProposicao.replace(/_/g, " ")}</span> : null}
                                  {item.obrigatorio ? <Badge className="bg-blue-100 text-blue-800">Obrigatório</Badge> : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{editingTemplateId ? "Editar template" : "Novo template"}</CardTitle>
                <CardDescription>
                  Defina os itens padrão que serão sugeridos ao gerar pautas automaticamente.
                </CardDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={closeModal}
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(event) => setFormData((prev) => ({ ...prev, nome: event.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo-template">Tipo de sessão *</Label>
                    <select
                      id="tipo-template"
                      value={formData.tipo}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          tipo: event.target.value as TemplateFormData["tipo"],
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {TIPO_SESSAO_OPTIONS.filter((option) => option.value !== "TODOS").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, descricao: event.target.value }))
                    }
                    className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explique quando este template deve ser utilizado..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="duracao-estimada">Duração estimada (minutos)</Label>
                    <Input
                      id="duracao-estimada"
                      type="number"
                      min={0}
                      value={formData.duracaoEstimativa}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, duracaoEstimativa: event.target.value }))
                      }
                    />
                    {tempoTotalItensForm > 0 ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Soma dos tempos dos itens: {tempoTotalItensForm} min
                      </p>
                    ) : null}
                  </div>
                  <label className="flex items-end gap-2 text-sm font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, ativo: event.target.checked }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Template ativo
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Itens do template *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="h-4 w-4" /> Adicionar item
                    </Button>
                  </div>

                  {formData.itens.length === 0 ? (
                    <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      Nenhum item adicionado. Clique em “Adicionar item” para começar.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {formData.itens.map((item, index) => (
                        <div key={item.localId} className="rounded-lg border border-gray-200 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="font-semibold text-gray-700">Item {index + 1}</span>
                              {item.obrigatorio ? (
                                <Badge className="bg-blue-100 text-blue-800">Obrigatório</Badge>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.localId)}
                              aria-label="Remover item do template"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <Label htmlFor={`secao-${item.localId}`}>Seção *</Label>
                              <select
                                id={`secao-${item.localId}`}
                                value={item.secao}
                                onChange={(event) =>
                                  updateItemField(item.localId, "secao", event.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              >
                                {PAUTA_SECOES.map((secao) => (
                                  <option key={secao.value} value={secao.value}>
                                    {secao.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor={`titulo-${item.localId}`}>Título *</Label>
                              <Input
                                id={`titulo-${item.localId}`}
                                value={item.titulo}
                                onChange={(event) =>
                                  updateItemField(item.localId, "titulo", event.target.value)
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <Label htmlFor={`descricao-${item.localId}`}>Descrição</Label>
                            <textarea
                              id={`descricao-${item.localId}`}
                              value={item.descricao}
                              onChange={(event) =>
                                updateItemField(item.localId, "descricao", event.target.value)
                              }
                              className="min-h-[60px] w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div>
                              <Label htmlFor={`tempo-${item.localId}`}>Tempo estimado (min)</Label>
                              <Input
                                id={`tempo-${item.localId}`}
                                type="number"
                                min={0}
                                value={item.tempoEstimado}
                                onChange={(event) =>
                                  updateItemField(item.localId, "tempoEstimado", event.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`tipo-proposicao-${item.localId}`}>Tipo de proposição sugerida</Label>
                              <select
                                id={`tipo-proposicao-${item.localId}`}
                                value={item.tipoProposicao}
                                onChange={(event) =>
                                  updateItemField(item.localId, "tipoProposicao", event.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {TIPO_PROPOSICAO_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <label className="flex items-end gap-2 text-sm font-medium text-gray-600">
                              <input
                                type="checkbox"
                                checked={item.obrigatorio}
                                onChange={(event) =>
                                  updateItemField(item.localId, "obrigatorio", event.target.checked)
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              Item obrigatório na pauta
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingTemplateId ? "Atualizar" : "Criar"} template</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


