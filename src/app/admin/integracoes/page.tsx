"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Key,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  ShieldCheck,
  Zap
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useIntegrationTokens } from "@/lib/hooks/use-integration-tokens"

const PERMISSOES_LABEL: Record<string, string> = {
  'sessoes.read': 'Sessões (leitura)',
  'proposicoes.read': 'Proposições (leitura)'
}

interface TokenFormState {
  nome: string
  descricao: string
  permissoes: Record<string, boolean>
  ativo: boolean
}

const createInitialFormState = (): TokenFormState => ({
  nome: '',
  descricao: '',
  permissoes: {
    'sessoes.read': true,
    'proposicoes.read': false
  },
  ativo: true
})

export default function IntegracoesPage() {
  const {
    tokens,
    loading,
    error,
    create,
    update,
    remove,
    rotate,
    lastPlainToken,
    refetch
  } = useIntegrationTokens()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<TokenFormState>(createInitialFormState())
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null)

  const permissoesSelecionadas = useMemo(() => {
    return Object.entries(formData.permissoes)
      .filter(([, value]) => value)
      .map(([key]) => key)
  }, [formData.permissoes])

  const openCreateModal = () => {
    setEditingTokenId(null)
    setFormData(createInitialFormState())
    setIsModalOpen(true)
  }

  const openEditModal = (tokenId: string) => {
    const token = tokens.find(item => item.id === tokenId)
    if (!token) {
      toast.error('Token não encontrado')
      return
    }

    setEditingTokenId(tokenId)
    const permissoesMap: Record<string, boolean> = {}
    Object.keys(PERMISSOES_LABEL).forEach((key) => {
      permissoesMap[key] = token.permissoes.includes(key)
    })

    setFormData({
      nome: token.nome,
      descricao: token.descricao || '',
      permissoes: permissoesMap,
      ativo: token.ativo
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTokenId(null)
    setFormData(createInitialFormState())
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (permissoesSelecionadas.length === 0) {
      toast.error('Selecione ao menos uma permissão para o token')
      return
    }

    const payload = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || undefined,
      permissoes: permissoesSelecionadas,
      ativo: formData.ativo
    }

    if (editingTokenId) {
      await update(editingTokenId, payload)
    } else {
      await create(payload)
    }

    closeModal()
  }

  const handleCopyToken = async (token?: string | null) => {
    if (!token) {
      toast.error('Nenhum token disponível para copiar')
      return
    }
    await navigator.clipboard.writeText(token)
    toast.success('Token copiado para a área de transferência')
  }

  const handleToggleAtivo = async (tokenId: string, ativoAtual: boolean) => {
    await update(tokenId, { ativo: !ativoAtual })
  }

  const handleRotate = async (tokenId: string) => {
    await rotate(tokenId)
  }

  const handleDelete = async (tokenId: string) => {
    if (confirm('Tem certeza que deseja excluir este token de integração?')) {
      await remove(tokenId)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Tokens de Integração
          </h1>
          <p className="text-gray-600">
            Gere tokens para integrar sistemas externos. Os tokens permitem acesso seguro às APIs públicas.
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} aria-label="Atualizar tokens">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={openCreateModal} className="flex items-center gap-2" aria-label="Criar novo token">
            <Plus className="h-4 w-4" /> Novo Token
          </Button>
        </div>
      </div>

      {lastPlainToken && (
        <Card className="border-green-200 bg-green-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Key className="h-5 w-5" /> Token gerado com sucesso
            </CardTitle>
            <CardDescription className="text-green-800">
              Este token é exibido apenas uma vez. Copie e armazene com segurança.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <code className="rounded-md bg-green-900/90 px-3 py-2 text-sm text-green-100 break-all">
              {lastPlainToken}
            </code>
            <Button variant="outline" size="sm" onClick={() => handleCopyToken(lastPlainToken)}>
              <Copy className="h-4 w-4" /> Copiar token
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tokens configurados</CardTitle>
          <CardDescription>
            Utilize os tokens abaixo para autenticar requisições às APIs públicas de integração. Atenção: tokens ativos concedem acesso aos dados especificados nas permissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" /> Carregando tokens...
            </div>
          ) : tokens.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              Nenhum token cadastrado. Clique em &quot;Novo Token&quot; para gerar o primeiro.
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <Card key={token.id} className="border border-gray-200">
                  <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{token.nome}</h3>
                        <Badge className={token.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}>
                          {token.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {token.descricao && <p className="text-sm text-gray-600 max-w-2xl">{token.descricao}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>Criado em {new Date(token.createdAt).toLocaleString('pt-BR')}</span>
                        <span>•</span>
                        <span>Permissões:</span>
                        {token.permissoes.map((permissao) => (
                          <Badge key={permissao} variant="secondary">
                            {PERMISSOES_LABEL[permissao] ?? permissao}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>
                          Último uso:{' '}
                          {token.lastUsedAt
                            ? formatDistanceToNow(new Date(token.lastUsedAt), { locale: ptBR, addSuffix: true })
                            : 'Nunca'}
                        </span>
                        {token.lastUsedIp && <span>IP {token.lastUsedIp}</span>}
                        {token.lastUsedAgent && <span>Agente {token.lastUsedAgent}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAtivo(token.id, token.ativo)}
                        aria-label={token.ativo ? 'Desativar token' : 'Ativar token'}
                      >
                        {token.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate(token.id)}
                        aria-label="Regenerar token"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Regenerar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(token.id)}
                        aria-label="Editar token"
                      >
                        <Zap className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(token.id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Excluir token"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingTokenId ? 'Editar token de integração' : 'Novo token de integração'}</CardTitle>
                <Button variant="outline" size="sm" onClick={closeModal}>
                  Fechar
                </Button>
              </div>
              <CardDescription>
                Defina um nome e selecione as permissões que este token terá ao acessar as APIs públicas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="nome-token">Nome *</Label>
                    <Input
                      id="nome-token"
                      value={formData.nome}
                      onChange={(event) => setFormData(prev => ({ ...prev, nome: event.target.value }))}
                      required
                    />
                  </div>
                  <label className="mt-6 flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(event) => setFormData(prev => ({ ...prev, ativo: event.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Token ativo
                  </label>
                </div>

                <div>
                  <Label htmlFor="descricao-token">Descrição</Label>
                  <Textarea
                    id="descricao-token"
                    value={formData.descricao}
                    onChange={(event) => setFormData(prev => ({ ...prev, descricao: event.target.value }))}
                    placeholder="Descreva para que este token será utilizado"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Permissões *</Label>
                  <div className="grid gap-2">
                    {Object.entries(PERMISSOES_LABEL).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.permissoes[key] ?? false}
                          onChange={(event) =>
                            setFormData(prev => ({
                              ...prev,
                              permissoes: {
                                ...prev.permissoes,
                                [key]: event.target.checked
                              }
                            }))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTokenId ? 'Salvar alterações' : 'Gerar token'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


