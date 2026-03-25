'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ExternalLink, Monitor, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RedirectConfigProps {
  /** Slug da categoria de transparência (ex: 'folha-pagamento', 'despesas') */
  slug: string
  /** Label para exibição (ex: 'Folha de Pagamento') */
  label: string
}

/**
 * Componente de configuração de redirecionamento para páginas admin.
 * Permite alternar entre usar o sistema interno ou redirecionar para URL externa.
 * Quando ativado, visitantes do portal são redirecionados ao acessar a categoria.
 */
export function RedirectConfig({ slug, label }: RedirectConfigProps) {
  const [enabled, setEnabled] = useState(false)
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/transparencia/redirecionamentos?slug=${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data?.enabled) {
          setEnabled(true)
          setUrl(data.data.url || '')
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [slug])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/transparencia/redirecionamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, enabled, url, label })
      })
      if (res.ok) toast.success(`${label}: configuração salva!`)
      else toast.error('Erro ao salvar')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  if (!loaded) return null

  return (
    <Card className={enabled ? 'border-blue-200 bg-blue-50/50 mb-6' : 'mb-6'}>
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            {enabled ? (
              <ExternalLink className="h-5 w-5 text-blue-600" />
            ) : (
              <Monitor className="h-5 w-5 text-green-600" />
            )}
            <div>
              <p className="text-sm font-medium">Portal da Transparência</p>
              <p className="text-xs text-muted-foreground">
                {enabled ? 'Redireciona visitante para site externo' : 'Usa os dados cadastrados no sistema'}
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={`https://portal.exemplo.gov.br/${slug}`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={handleSave} disabled={saving || !url}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {!enabled && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
