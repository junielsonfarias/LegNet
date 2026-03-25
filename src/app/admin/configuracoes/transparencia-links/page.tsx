'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Globe,
  ExternalLink,
  Monitor,
  Save,
  Loader2,
  CheckCircle2,
  Settings2
} from 'lucide-react'
import { toast } from 'sonner'

interface CategoriaConfig {
  slug: string
  nome: string
  icone: string
  modo: 'interno' | 'externo'
  url?: string
  label?: string
}

export default function TransparenciaLinksPage() {
  const [categorias, setCategorias] = useState<CategoriaConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Carregar configurações
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/transparencia/redirecionamentos')
        if (res.ok) {
          const data = await res.json()
          setCategorias(data.data || [])
        }
      } catch {
        toast.error('Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  // Salvar configuração de uma categoria
  const handleSave = async (cat: CategoriaConfig) => {
    setSaving(cat.slug)
    try {
      const res = await fetch('/api/transparencia/redirecionamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: cat.slug,
          enabled: cat.modo === 'externo',
          url: cat.url || '',
          label: cat.label || ''
        })
      })

      if (res.ok) {
        toast.success(`${cat.nome} atualizado com sucesso`)
      } else {
        toast.error('Erro ao salvar')
      }
    } catch {
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(null)
    }
  }

  // Atualizar estado local
  const updateCategoria = (slug: string, updates: Partial<CategoriaConfig>) => {
    setCategorias(prev =>
      prev.map(c => c.slug === slug ? { ...c, ...updates } : c)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="h-6 w-6" />
          Transparência - Links e Redirecionamentos
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure cada categoria para usar o sistema interno ou redirecionar para um site externo.
          Quando configurado como externo, o visitante será direcionado automaticamente para a URL informada.
        </p>
      </div>

      <div className="grid gap-4">
        {categorias.map(cat => (
          <Card key={cat.slug} className={cat.modo === 'externo' ? 'border-blue-200 bg-blue-50/30' : ''}>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Nome e toggle */}
                <div className="flex items-center gap-4 lg:w-80 shrink-0">
                  <div className="flex items-center gap-3 flex-1">
                    {cat.modo === 'externo' ? (
                      <ExternalLink className="h-5 w-5 text-blue-600 shrink-0" />
                    ) : (
                      <Monitor className="h-5 w-5 text-green-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{cat.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        /transparencia/{cat.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Label htmlFor={`modo-${cat.slug}`} className="text-xs text-muted-foreground whitespace-nowrap">
                      {cat.modo === 'externo' ? 'Externo' : 'Interno'}
                    </Label>
                    <Switch
                      id={`modo-${cat.slug}`}
                      checked={cat.modo === 'externo'}
                      onCheckedChange={(checked) => {
                        updateCategoria(cat.slug, {
                          modo: checked ? 'externo' : 'interno'
                        })
                      }}
                    />
                  </div>
                </div>

                {/* URL (só aparece se externo) */}
                {cat.modo === 'externo' && (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="https://portal.exemplo.gov.br/folha-pagamento"
                        value={cat.url || ''}
                        onChange={(e) => updateCategoria(cat.slug, { url: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="sm:w-48">
                      <Input
                        placeholder="Descrição (opcional)"
                        value={cat.label || ''}
                        onChange={(e) => updateCategoria(cat.slug, { label: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Botão salvar */}
                <Button
                  size="sm"
                  variant={cat.modo === 'externo' ? 'default' : 'outline'}
                  onClick={() => handleSave(cat)}
                  disabled={saving === cat.slug || (cat.modo === 'externo' && !cat.url)}
                  className="shrink-0"
                >
                  {saving === cat.slug ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="ml-1.5">Salvar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <Monitor className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <p><strong>Interno:</strong> Usa a página do sistema. Os dados são gerenciados diretamente no painel administrativo.</p>
          </div>
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p><strong>Externo:</strong> Ao clicar, o visitante é redirecionado para a URL informada (abre em nova aba). Útil quando a informação já está publicada em outro portal.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
