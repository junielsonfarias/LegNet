'use client'

import { useState, useEffect, useMemo } from 'react'
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
  CalendarDays,
  Settings2,
  ExternalLink,
  Home,
  Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ITENS_TRANSPARENCIA,
  SECOES,
  type ItemTransparencia,
  type SecaoSlug,
} from '@/lib/transparencia/itens-catalogo'

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

interface RedirectConfig {
  enabled: boolean
  url: string
  label?: string
}

interface LinkRelacionado {
  id: string
  label: string
  url: string
  externo: boolean
  ordem: number
  ativo: boolean
  descricao?: string
}

interface ConfigLinksRelacionados {
  enabled: boolean
  titulo?: string
  descricao?: string
  links: LinkRelacionado[]
}

type Modo = 'interno' | 'redirect' | 'periodos'

const EMPTY_PERIODOS: ConfigPeriodos = {
  enabled: false,
  titulo: '',
  descricao: '',
  periodos: [],
}

const EMPTY_REDIRECT: RedirectConfig = {
  enabled: false,
  url: '',
  label: '',
}

const EMPTY_LINKS: ConfigLinksRelacionados = {
  enabled: false,
  titulo: 'Links Relacionados',
  descricao: '',
  links: [],
}

export default function TransparenciaPeriodosPage() {
  const [secaoFiltro, setSecaoFiltro] = useState<SecaoSlug | 'todos'>('todos')
  const [slug, setSlug] = useState<string>(ITENS_TRANSPARENCIA[0].slug)
  const [modo, setModo] = useState<Modo>('interno')
  const [periodos, setPeriodos] = useState<ConfigPeriodos>(EMPTY_PERIODOS)
  const [redirect, setRedirect] = useState<RedirectConfig>(EMPTY_REDIRECT)
  const [linksRelacionados, setLinksRelacionados] =
    useState<ConfigLinksRelacionados>(EMPTY_LINKS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const itemSelecionado: ItemTransparencia | undefined = useMemo(
    () => ITENS_TRANSPARENCIA.find((i) => i.slug === slug),
    [slug],
  )

  const itensVisiveis: ItemTransparencia[] = useMemo(() => {
    if (secaoFiltro === 'todos') return ITENS_TRANSPARENCIA
    return ITENS_TRANSPARENCIA.filter((i) => i.secao === secaoFiltro)
  }, [secaoFiltro])

  // Auto-reseta o slug ao mudar o filtro de secao quando o slug atual sai do escopo.
  useEffect(() => {
    if (secaoFiltro === 'todos') return
    if (!itensVisiveis.some((i) => i.slug === slug)) {
      const primeiro = itensVisiveis[0]
      if (primeiro) setSlug(primeiro.slug)
    }
  }, [secaoFiltro, slug, itensVisiveis])

  // Carregar config atual quando o slug muda
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true)
      try {
        const [redirectRes, periodosRes, linksRes] = await Promise.all([
          fetch(`/api/transparencia/redirecionamentos?slug=${slug}`),
          fetch(`/api/transparencia/periodos?slug=${slug}`),
          fetch(`/api/transparencia/links-relacionados?slug=${slug}`),
        ])

        const redirectJson = redirectRes.ok ? await redirectRes.json() : null
        const periodosJson = periodosRes.ok ? await periodosRes.json() : null
        const linksJson = linksRes.ok ? await linksRes.json() : null

        const redirectData = redirectJson?.data
        const periodosData = periodosJson?.data
        const linksData = linksJson?.data

        if (redirectData?.enabled && redirectData?.url) {
          setModo('redirect')
          setRedirect({
            enabled: true,
            url: redirectData.url,
            label: redirectData.label || '',
          })
          setPeriodos({ ...EMPTY_PERIODOS })
        } else if (periodosData?.enabled && periodosData?.periodos?.length > 0) {
          setModo('periodos')
          setPeriodos(periodosData)
          setRedirect({ ...EMPTY_REDIRECT })
        } else {
          setModo('interno')
          setPeriodos(periodosData ?? { ...EMPTY_PERIODOS })
          setRedirect(redirectData ?? { ...EMPTY_REDIRECT })
        }

        // Links Relacionados (independente do modo)
        setLinksRelacionados(linksData ?? { ...EMPTY_LINKS })
      } catch {
        setModo('interno')
        setPeriodos({ ...EMPTY_PERIODOS })
        setRedirect({ ...EMPTY_REDIRECT })
        setLinksRelacionados({ ...EMPTY_LINKS })
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [slug])

  const handleSave = async () => {
    // Validacao client-side antes de chamar a API
    if (modo === 'redirect') {
      const url = redirect.url.trim()
      if (!url) {
        toast.error('Informe a URL externa para o modo "URL externa direta".')
        return
      }
      try {
        // eslint-disable-next-line no-new
        new URL(url)
      } catch {
        toast.error('URL externa invalida. Informe uma URL completa (ex: https://...).')
        return
      }
    }
    if (modo === 'periodos') {
      if (periodos.periodos.length === 0) {
        toast.error('Adicione pelo menos 1 periodo para o modo "Sub-itens por periodo".')
        return
      }
      const incompletos = periodos.periodos.filter(
        (p) => !p.label.trim() || (!p.url?.trim() && !p.hrefInterno?.trim()),
      )
      if (incompletos.length > 0) {
        toast.error('Cada periodo precisa de rotulo e URL externa OU rota interna.')
        return
      }
    }

    setSaving(true)
    try {
      // Endpoint atomico — uma chamada, uma transacao Prisma. Sem falha parcial.
      const body: Record<string, unknown> = { slug, modo }
      if (modo === 'redirect') {
        body.redirect = {
          url: redirect.url.trim(),
          label: redirect.label?.trim() || undefined,
        }
      }
      if (modo === 'periodos') {
        body.periodos = {
          titulo: periodos.titulo,
          descricao: periodos.descricao,
          periodos: periodos.periodos,
        }
      }

      const res = await fetch('/api/transparencia/item-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success('Configuracao salva com sucesso')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.message || `Erro ao salvar (status ${res.status})`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const addPeriodo = () => {
    const novoOrdem = periodos.periodos.length
    setPeriodos({
      ...periodos,
      enabled: true,
      periodos: [
        ...periodos.periodos,
        {
          id: `periodo-${Date.now()}`,
          label: '',
          url: '',
          hrefInterno: '',
          ano: null,
          ordem: novoOrdem,
          ativo: true,
        },
      ],
    })
  }

  const updatePeriodo = (idx: number, updates: Partial<Periodo>) => {
    setPeriodos({
      ...periodos,
      periodos: periodos.periodos.map((p, i) => (i === idx ? { ...p, ...updates } : p)),
    })
  }

  const removePeriodo = (idx: number) => {
    setPeriodos({
      ...periodos,
      periodos: periodos.periodos
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, ordem: i })),
    })
  }

  const movePeriodo = (idx: number, direction: -1 | 1) => {
    const novaIdx = idx + direction
    if (novaIdx < 0 || novaIdx >= periodos.periodos.length) return
    const lista = [...periodos.periodos]
    ;[lista[idx], lista[novaIdx]] = [lista[novaIdx], lista[idx]]
    setPeriodos({
      ...periodos,
      periodos: lista.map((p, i) => ({ ...p, ordem: i })),
    })
  }

  // ===== Links Relacionados =====
  const addLink = () => {
    const novoOrdem = linksRelacionados.links.length
    setLinksRelacionados({
      ...linksRelacionados,
      enabled: true,
      links: [
        ...linksRelacionados.links,
        {
          id: `link-${Date.now()}`,
          label: '',
          url: '',
          externo: true,
          ordem: novoOrdem,
          ativo: true,
          descricao: '',
        },
      ],
    })
  }

  const updateLink = (idx: number, updates: Partial<LinkRelacionado>) => {
    setLinksRelacionados({
      ...linksRelacionados,
      links: linksRelacionados.links.map((l, i) => (i === idx ? { ...l, ...updates } : l)),
    })
  }

  const removeLink = (idx: number) => {
    setLinksRelacionados({
      ...linksRelacionados,
      links: linksRelacionados.links
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, ordem: i })),
    })
  }

  const moveLink = (idx: number, direction: -1 | 1) => {
    const novaIdx = idx + direction
    if (novaIdx < 0 || novaIdx >= linksRelacionados.links.length) return
    const lista = [...linksRelacionados.links]
    ;[lista[idx], lista[novaIdx]] = [lista[novaIdx], lista[idx]]
    setLinksRelacionados({
      ...linksRelacionados,
      links: lista.map((l, i) => ({ ...l, ordem: i })),
    })
  }

  const handleSaveLinks = async () => {
    // Valida URLs externas (rotas internas comecam com / e nao precisam de validacao URL)
    const incompletos = linksRelacionados.links.filter((l) => !l.label.trim() || !l.url.trim())
    if (incompletos.length > 0) {
      toast.error('Cada link precisa de rotulo e URL/rota preenchidos.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/transparencia/links-relacionados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          enabled: linksRelacionados.enabled,
          titulo: linksRelacionados.titulo,
          descricao: linksRelacionados.descricao,
          links: linksRelacionados.links,
        }),
      })
      if (res.ok) {
        toast.success('Links relacionados salvos')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.message || `Erro ao salvar (status ${res.status})`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="h-6 w-6" />
          Transparencia — Configuracao de Itens
        </h1>
        <p className="text-muted-foreground mt-1">
          Para CADA item do portal /transparencia voce pode escolher um dos 3 modos: usar a
          rota interna padrao, redirecionar para uma URL externa direta, ou expandir o item
          em sub-itens por periodo (cada sub-item podendo ser interno ou externo).
        </p>
      </div>

      {/* Filtro de secao + selecao de item */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item a configurar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="secao">Filtrar por secao</Label>
              <select
                id="secao"
                value={secaoFiltro}
                onChange={(e) => setSecaoFiltro(e.target.value as SecaoSlug | 'todos')}
                className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm bg-white"
              >
                <option value="todos">Todas as secoes ({ITENS_TRANSPARENCIA.length} itens)</option>
                {SECOES.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="slug">Selecionar item</Label>
              <select
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm bg-white"
              >
                {itensVisiveis.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.ocultoNoMenu ? '○ ' : ''}{item.label} ({item.slug})
                  </option>
                ))}
              </select>
              {itemSelecionado?.ocultoNoMenu && (
                <p className="text-xs text-amber-600 mt-1">
                  ○ Item nao aparece no menu da home /transparencia, mas tem pagina interna
                  propria que respeita a configuracao deste painel.
                </p>
              )}
            </div>
          </div>

          {itemSelecionado && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold">Rota padrao:</span>{' '}
                  <code className="text-xs bg-background px-1.5 py-0.5 rounded">
                    {itemSelecionado.hrefInterno || '— (sem rota padrao, usa sub-itens)'}
                  </code>
                </div>
                {itemSelecionado.pntp && itemSelecionado.pntp.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    PNTP: {itemSelecionado.pntp.join(', ')}
                  </div>
                )}
              </div>
              {itemSelecionado.subItensPadrao && itemSelecionado.subItensPadrao.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Possui {itemSelecionado.subItensPadrao.length} sub-itens padrao no catalogo.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seletor de modo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo de exibicao</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ModoCard
                ativo={modo === 'interno'}
                icone={Home}
                titulo="Rota interna padrao"
                descricao="Usa a pagina interna do sistema (default)."
                onClick={() => setModo('interno')}
              />
              <ModoCard
                ativo={modo === 'redirect'}
                icone={ExternalLink}
                titulo="URL externa direta"
                descricao="Redireciona o item para outro sistema (sem sub-itens)."
                onClick={() => setModo('redirect')}
              />
              <ModoCard
                ativo={modo === 'periodos'}
                icone={CalendarDays}
                titulo="Sub-itens por periodo"
                descricao='Ex: "Consulte ate 2025" + "2026 em diante" (cada um interno ou externo).'
                onClick={() => setModo('periodos')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel especifico do modo */}
      {!loading && modo === 'redirect' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              URL externa direta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="redirect-url">URL externa *</Label>
              <Input
                id="redirect-url"
                type="url"
                placeholder="https://sistema-antigo.exemplo.gov.br/categoria"
                value={redirect.url}
                onChange={(e) => setRedirect({ ...redirect, url: e.target.value })}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ao clicar no item, o cidadao sera direcionado a este endereco (abre em nova aba).
              </p>
            </div>
            <div>
              <Label htmlFor="redirect-label">Rotulo auxiliar (opcional)</Label>
              <Input
                id="redirect-label"
                placeholder="Ex: Sistema da Prefeitura"
                value={redirect.label || ''}
                onChange={(e) => setRedirect({ ...redirect, label: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && modo === 'periodos' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Tela de selecao de periodo (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="titulo">Titulo</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Selecione o periodo"
                    value={periodos.titulo || ''}
                    onChange={(e) => setPeriodos({ ...periodos, titulo: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descricao</Label>
                  <Input
                    id="descricao"
                    placeholder="Texto auxiliar exibido acima dos cards"
                    value={periodos.descricao || ''}
                    onChange={(e) => setPeriodos({ ...periodos, descricao: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Periodos cadastrados ({periodos.periodos.length})
              </CardTitle>
              <Button size="sm" onClick={addPeriodo}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar periodo
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {periodos.periodos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum periodo cadastrado. Clique em &quot;Adicionar periodo&quot; para comecar.
                </p>
              )}

              {periodos.periodos.map((p, idx) => (
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
                          disabled={idx === periodos.periodos.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Rotulo do periodo</Label>
                          <Input
                            placeholder="Ex: Consulte as informacoes ate 2025"
                            value={p.label}
                            onChange={(e) => updatePeriodo(idx, { label: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">URL externa</Label>
                          <Input
                            placeholder="https://portal-antigo.exemplo.gov.br/2025"
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
                                ano: e.target.value ? Number(e.target.value) : null,
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
        </>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Salvar modo de exibicao
        </Button>
      </div>

      {/* =================================================================
            SECAO INDEPENDENTE — Links Relacionados (serie historica /
            sistemas externos correlatos). Aparece DENTRO da pagina alvo,
            funciona em qualquer modo de exibicao.
          ================================================================= */}
      {!loading && (
        <>
          <div className="border-t pt-6 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Links Relacionados — exibidos DENTRO da pagina
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use para serie historica (ex: &quot;Consulte ate 2021&quot; em sistema antigo)
                    ou referencias correlatas. Independe do modo de exibicao escolhido acima.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="links-enabled"
                    checked={linksRelacionados.enabled}
                    onCheckedChange={(checked) =>
                      setLinksRelacionados({ ...linksRelacionados, enabled: checked })
                    }
                  />
                  <Label htmlFor="links-enabled" className="cursor-pointer text-sm">
                    Exibir
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="links-titulo">Titulo da secao</Label>
                    <Input
                      id="links-titulo"
                      placeholder="Links Relacionados"
                      value={linksRelacionados.titulo || ''}
                      onChange={(e) =>
                        setLinksRelacionados({ ...linksRelacionados, titulo: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="links-descricao">Descricao (opcional)</Label>
                    <Input
                      id="links-descricao"
                      placeholder="Ex: Acesse o historico anterior a 2026..."
                      value={linksRelacionados.descricao || ''}
                      onChange={(e) =>
                        setLinksRelacionados({ ...linksRelacionados, descricao: e.target.value })
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {linksRelacionados.links.length} link(s) cadastrado(s)
                  </p>
                  <Button size="sm" onClick={addLink} variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar link
                  </Button>
                </div>

                {linksRelacionados.links.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/30">
                    Nenhum link cadastrado.
                  </p>
                )}

                <div className="space-y-2">
                  {linksRelacionados.links.map((link, idx) => (
                    <Card key={link.id} className={link.ativo ? '' : 'opacity-60'}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => moveLink(idx, -1)}
                              disabled={idx === 0}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => moveLink(idx, 1)}
                              disabled={idx === linksRelacionados.links.length - 1}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <Label className="text-xs">Rotulo</Label>
                              <Input
                                placeholder="Ex: Consulte as informacoes ate 2021"
                                value={link.label}
                                onChange={(e) => updateLink(idx, { label: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs">
                                URL{link.externo ? ' externa' : ' (interna)'}
                              </Label>
                              <Input
                                placeholder={
                                  link.externo
                                    ? 'https://portal-antigo.exemplo.gov.br/2021'
                                    : '/transparencia/algum-recurso'
                                }
                                value={link.url}
                                onChange={(e) => updateLink(idx, { url: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs">Descricao (opcional)</Label>
                              <Input
                                placeholder="Texto auxiliar abaixo do rotulo"
                                value={link.descricao || ''}
                                onChange={(e) => updateLink(idx, { descricao: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch
                                id={`externo-${link.id}`}
                                checked={link.externo}
                                onCheckedChange={(checked) => updateLink(idx, { externo: checked })}
                              />
                              <Label htmlFor={`externo-${link.id}`} className="text-xs cursor-pointer">
                                Link externo (abre em nova aba)
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch
                                id={`ativo-link-${link.id}`}
                                checked={link.ativo}
                                onCheckedChange={(checked) => updateLink(idx, { ativo: checked })}
                              />
                              <Label htmlFor={`ativo-link-${link.id}`} className="text-xs cursor-pointer">
                                Ativo
                              </Label>
                            </div>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLink(idx)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pb-8">
            <Button onClick={handleSaveLinks} disabled={saving || loading} variant="secondary">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Salvar Links Relacionados
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function ModoCard({
  ativo,
  icone: Icone,
  titulo,
  descricao,
  onClick,
}: {
  ativo: boolean
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  descricao: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-4 transition-all hover:shadow-sm ${
        ativo
          ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-md flex-shrink-0 ${ativo ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          <Icone className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{titulo}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">{descricao}</p>
        </div>
      </div>
    </button>
  )
}
