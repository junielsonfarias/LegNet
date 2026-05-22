'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2, Save, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

// Chaves da tabela Configuracao (categoria LGPD) semeadas pela migration
// add-documentos-classificados.sql. Editadas via /api/configuracoes/sistema.
const CAMPOS = [
  {
    chave: 'lgpd_encarregado_nome',
    label: 'Nome do Encarregado',
    descricao: 'Nome do Encarregado pelo Tratamento de Dados Pessoais (DPO)',
    placeholder: 'Nome completo do Encarregado',
  },
  {
    chave: 'lgpd_encarregado_email',
    label: 'E-mail de contato',
    descricao: 'E-mail de contato do Encarregado de Dados',
    placeholder: 'encarregado@camara.pa.gov.br',
  },
  {
    chave: 'lgpd_encarregado_telefone',
    label: 'Telefone de contato',
    descricao: 'Telefone de contato do Encarregado de Dados',
    placeholder: '(00) 0000-0000',
  },
  {
    chave: 'lgpd_encarregado_setor',
    label: 'Setor responsável',
    descricao: 'Setor responsavel pela protecao de dados pessoais',
    placeholder: 'Ex.: Procuradoria / Diretoria Administrativa',
  },
] as const

export default function AdminEncarregadoDadosPage() {
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/configuracoes/sistema?prefix=lgpd_encarregado')
      const j = await r.json()
      const mapa: Record<string, string> = {}
      for (const c of j?.data || []) {
        mapa[c.chave] = typeof c.valor === 'string' ? c.valor : String(c.valor ?? '')
      }
      setForm(mapa)
    } catch {
      toast.error('Erro ao carregar dados do Encarregado')
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
          categoria: 'LGPD',
        })),
      }
      const r = await fetch('/api/configuracoes/sistema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) {
        toast.success('Dados do Encarregado atualizados')
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
          Voltar para Configurações
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" /> Encarregado de Dados (DPO)
        </h1>
        <p className="text-sm text-muted-foreground">
          Identificação e contato do Encarregado pelo Tratamento de Dados Pessoais
          (LGPD, Lei nº 13.709/2018, Art. 41)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Encarregado</CardTitle>
          <CardDescription>
            Estas informações são exibidas publicamente em{' '}
            <Link
              href="/transparencia/encarregado-dados"
              target="_blank"
              rel="noopener noreferrer"
              className="text-camara-primary hover:underline inline-flex items-center gap-1"
            >
              /transparencia/encarregado-dados
              <ExternalLink className="h-3 w-3" />
            </Link>
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
                  <Input
                    id={campo.chave}
                    value={form[campo.chave] ?? ''}
                    onChange={(e) => setForm({ ...form, [campo.chave]: e.target.value })}
                    placeholder={campo.placeholder}
                  />
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
