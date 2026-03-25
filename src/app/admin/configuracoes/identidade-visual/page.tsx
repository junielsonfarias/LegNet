'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Palette,
  Upload,
  Save,
  Loader2,
  Eye,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface IdentidadeVisual {
  corPrimaria: string
  corSecundaria: string
  corAcento: string
  brasaoUrl: string
  logoUrl: string
}

const CORES_PREDEFINIDAS = [
  { nome: 'Azul Institucional', primaria: '#1e40af', secundaria: '#3b82f6' },
  { nome: 'Verde Bandeira', primaria: '#15803d', secundaria: '#22c55e' },
  { nome: 'Vermelho', primaria: '#b91c1c', secundaria: '#ef4444' },
  { nome: 'Roxo', primaria: '#7c3aed', secundaria: '#a78bfa' },
  { nome: 'Laranja', primaria: '#c2410c', secundaria: '#f97316' },
  { nome: 'Azul Marinho', primaria: '#1e3a5f', secundaria: '#2563eb' },
  { nome: 'Verde Escuro', primaria: '#064e3b', secundaria: '#10b981' },
  { nome: 'Bordô', primaria: '#881337', secundaria: '#e11d48' },
]

export default function IdentidadeVisualPage() {
  const [config, setConfig] = useState<IdentidadeVisual>({
    corPrimaria: '#1e40af',
    corSecundaria: '#3b82f6',
    corAcento: '#059669',
    brasaoUrl: '',
    logoUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/institucional')
        if (res.ok) {
          const data = await res.json()
          const c = data.dados?.configuracao
          if (c) {
            setConfig({
              corPrimaria: c.corPrimaria || '#1e40af',
              corSecundaria: c.corSecundaria || '#3b82f6',
              corAcento: c.corAcento || '#059669',
              brasaoUrl: c.brasaoUrl || '',
              logoUrl: c.logoUrl || '',
            })
          }
        }
      } catch { /* usa defaults */ }
      finally { setLoading(false) }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/institucional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corPrimaria: config.corPrimaria,
          corSecundaria: config.corSecundaria,
          corAcento: config.corAcento,
          brasaoUrl: config.brasaoUrl || null,
          logoUrl: config.logoUrl || null,
        })
      })

      if (res.ok) {
        toast.success('Identidade visual atualizada! Aplicando cores...')
        // Aplicar cores imediatamente sem recarregar
        const root = document.documentElement
        root.style.setProperty('--tenant-primary', config.corPrimaria)
        root.style.setProperty('--tenant-secondary', config.corSecundaria)
        root.style.setProperty('--municipal-primary', config.corPrimaria)
        root.style.setProperty('--municipal-secondary', config.corSecundaria)
        root.style.setProperty('--municipal-accent', config.corAcento)
        // Recarregar após 1s para aplicar em todos os componentes
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(`Erro ao salvar: ${errorData.error || res.statusText}`)
      }
    } catch {
      toast.error('Erro ao salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (preset: typeof CORES_PREDEFINIDAS[0]) => {
    setConfig(prev => ({
      ...prev,
      corPrimaria: preset.primaria,
      corSecundaria: preset.secundaria,
    }))
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
          <Palette className="h-6 w-6" />
          Identidade Visual
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure as cores e o brasao do municipio. As mudancas sao aplicadas em todo o portal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Cores */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cores do Municipio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primaria</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.corPrimaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, corPrimaria: e.target.value }))}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.corPrimaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, corPrimaria: e.target.value }))}
                      className="font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Header, botoes, links</p>
                </div>

                <div className="space-y-2">
                  <Label>Cor Secundaria</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.corSecundaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, corSecundaria: e.target.value }))}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.corSecundaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, corSecundaria: e.target.value }))}
                      className="font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Destaques, badges</p>
                </div>

                <div className="space-y-2">
                  <Label>Cor de Acento</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.corAcento}
                      onChange={(e) => setConfig(prev => ({ ...prev, corAcento: e.target.value }))}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.corAcento}
                      onChange={(e) => setConfig(prev => ({ ...prev, corAcento: e.target.value }))}
                      className="font-mono text-sm"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Sucesso, indicadores</p>
                </div>
              </div>

              {/* Presets */}
              <div>
                <Label className="mb-3 block">Paletas Predefinidas</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CORES_PREDEFINIDAS.map((preset) => (
                    <button
                      key={preset.nome}
                      onClick={() => applyPreset(preset)}
                      className="flex items-center gap-2 p-2 rounded-lg border hover:border-gray-400 transition-colors text-left"
                    >
                      <div className="flex shrink-0">
                        <div className="w-5 h-5 rounded-l" style={{ backgroundColor: preset.primaria }} />
                        <div className="w-5 h-5 rounded-r" style={{ backgroundColor: preset.secundaria }} />
                      </div>
                      <span className="text-xs truncate">{preset.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brasão e Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Brasao e Logotipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL do Brasao</Label>
                  <Input
                    placeholder="https://exemplo.com/brasao.png"
                    value={config.brasaoUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, brasaoUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Imagem PNG ou SVG com fundo transparente. Aparece no header e hero.
                  </p>
                  {config.brasaoUrl && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-center">
                      <img
                        src={config.brasaoUrl}
                        alt="Preview brasao"
                        className="h-20 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>URL do Logotipo</Label>
                  <Input
                    placeholder="https://exemplo.com/logo.png"
                    value={config.logoUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Logo alternativo para o header. Se vazio, usa o brasao.
                  </p>
                  {config.logoUrl && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-center">
                      <img
                        src={config.logoUrl}
                        alt="Preview logo"
                        className="h-20 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mini preview do header */}
              <div className="rounded-lg overflow-hidden border shadow-sm">
                <div
                  className="p-3 text-white text-xs"
                  style={{ backgroundColor: config.corPrimaria }}
                >
                  <div className="flex items-center gap-2">
                    {config.brasaoUrl ? (
                      <img src={config.brasaoUrl} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: config.corSecundaria }}
                      >
                        CM
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[11px]">Camara Municipal</div>
                      <div className="text-[9px] opacity-75">Portal Institucional</div>
                    </div>
                  </div>
                </div>

                {/* Mini hero */}
                <div
                  className="p-4 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${config.corPrimaria}, ${config.corSecundaria})`
                  }}
                >
                  <div className="text-xs font-bold mb-1">Camara Municipal</div>
                  <div className="text-[9px] opacity-75">Transparencia e Cidadania</div>
                  <div className="flex gap-1 mt-2">
                    <div className="px-2 py-0.5 bg-white/20 rounded text-[8px]">Vereadores</div>
                    <div className="px-2 py-0.5 border border-white/40 rounded text-[8px]">Transparencia</div>
                  </div>
                </div>

                {/* Mini content */}
                <div className="p-3 bg-white">
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: config.corPrimaria }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: config.corSecundaria }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: config.corAcento }} />
                  </div>
                </div>

                {/* Mini footer */}
                <div className="p-2 text-[8px] text-white/70 text-center"
                  style={{ backgroundColor: config.corPrimaria, filter: 'brightness(0.4)' }}
                >
                  Rodape do Portal
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão salvar */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Identidade Visual
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setConfig({
              corPrimaria: '#1e40af',
              corSecundaria: '#3b82f6',
              corAcento: '#059669',
              brasaoUrl: config.brasaoUrl,
              logoUrl: config.logoUrl,
            })}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Cores Padrao
          </Button>
        </div>
      </div>
    </div>
  )
}
