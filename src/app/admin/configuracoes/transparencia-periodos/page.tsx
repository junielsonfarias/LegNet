'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  ArrowUp,
  ArrowDown,
  CalendarDays
} from 'lucide-react'
import { toast } from 'sonner'

interface Periodo {
  id: string
  label: string
  url?: string
  hrefInterno?: string
  ano?: number | null
  ordem: number
  ativo: boolean
}

interface ConfigPeriodos {
  enabled: boolean
  titulo?: string
  descricao?: string
  periodos: Periodo[]
}

// Categorias que podem ter periodos cadastrados
const CATEGORIAS_DISPONIVEIS = [
  { slug: 'despesas', nome: 'Despesas' },
  { slug: 'receitas', nome: 'Receitas' },
  { slug: 'repasses', nome: 'Repasses' },
  { slug: 'cartao-credito', nome: 'Gastos com Cartao de Credito' },
  { slug: 'notas-fiscais', nome: 'Notas Fiscais Liquidadas' },
  { slug: 'ordem-pagamentos', nome: 'Ordem Cronologica de Pagamentos' },
  { slug: 'programas-acoes', nome: 'Programas e Acoes' },
  { slug: 'licitacoes', nome: 'Licitacoes' },
  { slug: 'contratos', nome: 'Contratos' },
  { slug: 'convenios', nome: 'Convenios' },
  { slug: 'folha-pagamento', nome: 'Folha de Pagamento' },
  { slug: 'diarias', nome: 'Diarias' },
  { slug: 'veiculos', nome: 'Veiculos' },
  { slug: 'obras', nome: 'Obras' }
]

const EMPTY_CONFIG: ConfigPeriodos = {
  enabled: false,
  titulo: '',
  descricao: '',
  periodos: []
}

export default function TransparenciaPeriodosPage() {
  const [slug, setSlug] = useState<string>('despesas')
  const [config, setConfig] = useState<ConfigPeriodos>(EMPTY_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/transparencia/periodos?slug=${slug}`)
        if (res.ok) {
          const json = await res.json()
          setConfig(json?.data ?? { ...EMPTY_CONFIG })
        } else {
          setConfig({ ...EMPTY_CONFIG })
        }
      } catch {
        setConfig({ ...EMPTY_CONFIG })
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [slug])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/transparencia/periodos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...config })
      })
      if (res.ok) {
        toast.success('Periodos salvos com sucesso')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.message || 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const addPeriodo = () => {
    const novoOrdem = config.periodos.length
    setConfig({
      ...config,
      periodos: [
        ...config.periodos,
        {
          id: `periodo-${Date.now()}`,
          label: '',
          url: '',
          hrefInterno: '',
          ano: null,
          ordem: novoOrdem,
          ativo: true
        }
      ]
    })
  }

  const updatePeriodo = (idx: number, updates: Partial<Periodo>) => {
    setConfig({
      ...config,
      periodos: config.periodos.map((p, i) => (i === idx ? { ...p, ...updates } : p))
    })
  }

  const removePeriodo = (idx: number) => {
    setConfig({
      ...config,
      periodos: config.periodos
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, ordem: i }))
    })
  }

  const movePeriodo = (idx: number, direction: -1 | 1) => {
    const novaIdx = idx + direction
    if (novaIdx < 0 || novaIdx >= config.periodos.length) return
    const lista = [...config.periodos]
    ;[lista[idx], lista[novaIdx]] = [lista[novaIdx], lista[idx]]
    setConfig({
      ...config,
      periodos: lista.map((p, i) => ({ ...p, ordem: i }))
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Transparencia - Periodos por Categoria
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure subdivisoes por periodo para cada categoria. Quando habilitado, ao clicar
          na categoria o usuario vera uma tela de selecao com cada periodo (ex: &quot;Informacoes
          ate 2021&quot;, &quot;2024 em diante&quot;). Cada periodo pode apontar para um link externo
          (sistema antigo) ou para a rota interna do sistema atual.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="slug">Selecionar categoria</Label>
            <select
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm"
            >
              {CATEGORIAS_DISPONIVEIS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nome} ({c.slug})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                  Habilitar tela de selecao de periodo para esta categoria
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <Label htmlFor="titulo">Titulo (opcional)</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Selecione o periodo"
                    value={config.titulo || ''}
                    onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descricao (opcional)</Label>
                  <Input
                    id="descricao"
                    placeholder="Texto auxiliar exibido acima dos cards"
                    value={config.descricao || ''}
                    onChange={(e) => setConfig({ ...config, descricao: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Periodos cadastrados ({config.periodos.length})
            </CardTitle>
            <Button size="sm" onClick={addPeriodo}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar periodo
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.periodos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum periodo cadastrado. Clique em &quot;Adicionar periodo&quot; para comecar.
              </p>
            )}

            {config.periodos.map((p, idx) => (
              <Card key={p.id} className={p.ativo ? '' : 'opacity-60'}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => movePeriodo(idx, -1)}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => movePeriodo(idx, 1)}
                        disabled={idx === config.periodos.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Rotulo do periodo</Label>
                        <Input
                          placeholder="Ex: Informacoes ate 2021"
                          value={p.label}
                          onChange={(e) => updatePeriodo(idx, { label: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">URL externa</Label>
                        <Input
                          placeholder="https://portal-antigo.exemplo.gov.br/2021"
                          value={p.url || ''}
                          onChange={(e) => updatePeriodo(idx, { url: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Rota interna (alternativa)</Label>
                        <Input
                          placeholder="/transparencia/despesas?ano=2024"
                          value={p.hrefInterno || ''}
                          onChange={(e) => updatePeriodo(idx, { hrefInterno: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Ano (opcional)</Label>
                        <Input
                          type="number"
                          placeholder="2024"
                          value={p.ano ?? ''}
                          onChange={(e) =>
                            updatePeriodo(idx, {
                              ano: e.target.value ? Number(e.target.value) : null
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <Switch
                          id={`ativo-${p.id}`}
                          checked={p.ativo}
                          onCheckedChange={(checked) => updatePeriodo(idx, { ativo: checked })}
                        />
                        <Label htmlFor={`ativo-${p.id}`} className="text-xs cursor-pointer">
                          Ativo
                        </Label>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removePeriodo(idx)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Salvar configuracao
        </Button>
      </div>
    </div>
  )
}
