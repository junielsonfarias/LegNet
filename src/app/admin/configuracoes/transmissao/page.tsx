'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Radio, Loader2, Save, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const PLATAFORMAS = [
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'TWITCH', label: 'Twitch' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'CUSTOM', label: 'Outro (embed customizado)' },
]

const CAMPOS = [
  {
    chave: 'transmissao_ativa',
    label: 'Transmissao ativa',
    descricao: 'Marque "sim" para exibir o banner de transmissao no portal',
    placeholder: 'sim | nao',
    tipo: 'select' as const,
    opcoes: [
      { value: 'sim', label: 'Sim' },
      { value: 'nao', label: 'Nao' },
    ],
  },
  {
    chave: 'transmissao_url',
    label: 'URL principal',
    descricao: 'Link publico da transmissao (canal/playlist/sessao)',
    placeholder: 'https://www.youtube.com/@camara/live',
    tipo: 'text' as const,
  },
  {
    chave: 'transmissao_plataforma',
    label: 'Plataforma',
    descricao: 'Plataforma usada para a transmissao',
    placeholder: '',
    tipo: 'select' as const,
    opcoes: PLATAFORMAS,
  },
  {
    chave: 'transmissao_embed_html',
    label: 'Codigo de incorporacao (iframe)',
    descricao: 'Tag <iframe> oficial da plataforma. Tem prioridade sobre a URL.',
    placeholder: '<iframe src="https://www.youtube.com/embed/..." ...></iframe>',
    tipo: 'textarea' as const,
  },
  {
    chave: 'transmissao_titulo',
    label: 'Titulo / Identificacao',
    descricao: 'Texto exibido junto ao player (ex.: "Sessao Ordinaria de 26/05")',
    placeholder: 'Sessao Ordinaria - Plenario da Camara',
    tipo: 'text' as const,
  },
  {
    chave: 'transmissao_aviso',
    label: 'Aviso adicional',
    descricao: 'Mensagem auxiliar exibida abaixo do player',
    placeholder: 'A transmissao ao vivo ocorre as tercas-feiras a partir das 09h.',
    tipo: 'textarea' as const,
  },
]

export default function AdminTransmissaoPage() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/configuracoes/sistema?prefix=transmissao_')
      const j = await r.json()
      const mapa: Record<string, string> = {}
      for (const c of j?.data || []) {
        mapa[c.chave] = typeof c.valor === 'string' ? c.valor : String(c.valor ?? '')
      }
      setForm(mapa)
    } catch {
      toast.error('Erro ao carregar configuracao de transmissao')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        configuracoes: CAMPOS.map((campo) => ({
          chave: campo.chave,
          valor: (form[campo.chave] ?? '').trim(),
          tipo: 'string' as const,
          descricao: campo.descricao,
          categoria: 'Transmissao',
        })),
      }
      const r = await fetch('/api/configuracoes/sistema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) {
        toast.success('Configuracao de transmissao atualizada')
        load()
      } else {
        const e = await r.json().catch(() => ({}))
        toast.error(e?.message || e?.error || 'Erro ao salvar')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/configuracoes"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Configuracoes
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="h-6 w-6" /> Transmissao de Sessoes
        </h1>
        <p className="text-sm text-muted-foreground">
          Configuracao da transmissao ao vivo das sessoes plenarias e audiencias
          publicas (PNTP 2026 - criterio 20.9).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parametros da transmissao</CardTitle>
          <CardDescription>
            Estes dados aparecem publicamente em{' '}
            <Link
              href="/transparencia/transmissao"
              target="_blank"
              rel="noopener noreferrer"
              className="text-camara-primary hover:underline inline-flex items-center gap-1"
            >
              /transparencia/transmissao
              <ExternalLink className="h-3 w-3" />
            </Link>{' '}
            e no banner do portal da transparencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {CAMPOS.map((campo) => (
                <div key={campo.chave}>
                  <Label htmlFor={campo.chave}>{campo.label}</Label>
                  {campo.tipo === 'textarea' ? (
                    <Textarea
                      id={campo.chave}
                      value={form[campo.chave] ?? ''}
                      onChange={(e) => setForm({ ...form, [campo.chave]: e.target.value })}
                      placeholder={campo.placeholder}
                      rows={4}
                    />
                  ) : campo.tipo === 'select' ? (
                    <select
                      id={campo.chave}
                      value={form[campo.chave] ?? ''}
                      onChange={(e) => setForm({ ...form, [campo.chave]: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {campo.opcoes?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={campo.chave}
                      value={form[campo.chave] ?? ''}
                      onChange={(e) => setForm({ ...form, [campo.chave]: e.target.value })}
                      placeholder={campo.placeholder}
                    />
                  )}
                  {campo.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">{campo.descricao}</p>
                  )}
                </div>
              ))}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Salvar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
