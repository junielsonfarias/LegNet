'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileCheck, Loader2, Upload, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * RN-172 — Publicacao de Ata de Reuniao de Comissao.
 */

type TipoReuniao = 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL'

interface ComissaoItem {
  id: string
  nome: string
  sigla: string | null
}

interface ReuniaoListItem {
  id: string
  numero: number
  ano: number
  tipo: TipoReuniao
  data: string
}

const TIPOS_REUNIAO: { codigo: TipoReuniao; nome: string }[] = [
  { codigo: 'ORDINARIA', nome: 'Ordinária' },
  { codigo: 'EXTRAORDINARIA', nome: 'Extraordinária' },
  { codigo: 'ESPECIAL', nome: 'Especial' },
]

export default function PublicarAtaReuniaoPage() {
  const router = useRouter()

  const [comissoes, setComissoes] = useState<ComissaoItem[]>([])
  const [comissaoId, setComissaoId] = useState('')
  const [loadingComissoes, setLoadingComissoes] = useState(false)

  const [modo, setModo] = useState<'existente' | 'criar'>('existente')

  const [reunioes, setReunioes] = useState<ReuniaoListItem[]>([])
  const [reuniaoId, setReuniaoId] = useState('')
  const [loadingReunioes, setLoadingReunioes] = useState(false)

  const [numero, setNumero] = useState<number | ''>('')
  const [ano, setAno] = useState<number>(new Date().getFullYear())
  const [tipo, setTipo] = useState<TipoReuniao | ''>('')
  const [data, setData] = useState('')
  const [local, setLocal] = useState('')

  const [arquivoAtaUrl, setArquivoAtaUrl] = useState('')
  const [arquivoNome, setArquivoNome] = useState('')
  const [dataPublicacaoAta, setDataPublicacaoAta] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [observacoes, setObservacoes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setLoadingComissoes(true)
    fetch('/api/comissoes?ativa=true&limit=100')
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []
        setComissoes(
          arr.map((c: any) => ({ id: c.id, nome: c.nome, sigla: c.sigla ?? null })),
        )
      })
      .catch(() => toast.error('Erro ao carregar comissões'))
      .finally(() => setLoadingComissoes(false))
  }, [])

  useEffect(() => {
    if (!comissaoId || modo !== 'existente') return
    setLoadingReunioes(true)
    setReuniaoId('')
    fetch(`/api/reunioes-comissao?comissaoId=${encodeURIComponent(comissaoId)}&limit=100`)
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []
        setReunioes(
          arr.map((r: any) => ({
            id: r.id,
            numero: r.numero,
            ano: r.ano,
            tipo: r.tipo,
            data: r.data,
          })),
        )
      })
      .catch(() => toast.error('Erro ao carregar reuniões'))
      .finally(() => setLoadingReunioes(false))
  }, [comissaoId, modo])

  async function handleUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'atas-reunioes-comissao')
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await r.json()
    if (j.success) {
      setArquivoAtaUrl(j.url)
      setArquivoNome(file.name)
      toast.success(`${file.name} carregado`)
    } else {
      toast.error(j.error || 'Erro no upload')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!comissaoId) {
      toast.error('Selecione a comissão')
      return
    }
    if (!arquivoAtaUrl) {
      toast.error('Faça o upload do PDF da ata')
      return
    }

    const body: Record<string, unknown> = {
      arquivoAtaUrl,
      dataPublicacaoAta,
      observacoes: observacoes.trim() || undefined,
    }

    if (modo === 'existente') {
      if (!reuniaoId) {
        toast.error('Selecione uma reunião')
        return
      }
      body.reuniaoId = reuniaoId
    } else {
      if (!numero || !ano || !tipo || !data) {
        toast.error('Informe número, ano, tipo e data da reunião')
        return
      }
      body.comissaoId = comissaoId
      body.numero = Number(numero)
      body.ano = Number(ano)
      body.tipo = tipo
      body.data = data
      if (local.trim()) body.local = local.trim()
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/reunioes-comissao/publicar-ata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (j.success) {
        toast.success(j.message || 'Ata publicada com sucesso')
        router.push('/admin/comissoes/reunioes')
      } else {
        toast.error(j.error || 'Erro ao publicar ata')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSubmitting(false)
    }
  }

  function formatReuniaoLabel(r: ReuniaoListItem): string {
    const tipoLabel = TIPOS_REUNIAO.find((t) => t.codigo === r.tipo)?.nome || r.tipo
    const dataFmt = new Date(r.data).toLocaleDateString('pt-BR')
    return `${r.numero}ª ${tipoLabel} ${r.ano} — ${dataFmt}`
  }

  function formatComissaoLabel(c: ComissaoItem): string {
    return c.sigla ? `${c.sigla} — ${c.nome}` : c.nome
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/comissoes/reunioes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-camara-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Reuniões
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="h-7 w-7 text-camara-primary" />
          Publicar Ata de Reunião de Comissão
        </h1>
        <p className="text-gray-600 mt-1">
          Anexe o PDF da ata aprovada a uma reunião de comissão. Se a reunião ainda
          não existe, ela será criada automaticamente como concluída.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Comissão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Comissão *</Label>
              <Select value={comissaoId} onValueChange={setComissaoId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingComissoes ? 'Carregando...' : 'Escolha uma comissão'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {comissoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {formatComissaoLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Reunião</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={modo === 'existente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('existente')}
                disabled={!comissaoId}
              >
                Selecionar reunião existente
              </Button>
              <Button
                type="button"
                variant={modo === 'criar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('criar')}
                disabled={!comissaoId}
              >
                Criar reunião automaticamente
              </Button>
            </div>

            {!comissaoId ? (
              <p className="text-sm text-gray-500 italic">Selecione uma comissão primeiro.</p>
            ) : modo === 'existente' ? (
              <div className="space-y-2">
                <Label>Reunião *</Label>
                <Select value={reuniaoId} onValueChange={setReuniaoId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingReunioes ? 'Carregando...' : 'Escolha uma reunião'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {reunioes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {formatReuniaoLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Lista as 100 reuniões mais recentes da comissão. Se não encontrar,
                  use “Criar reunião automaticamente”.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label>Número *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={numero}
                      onChange={(e) => setNumero(e.target.value ? Number(e.target.value) : '')}
                      placeholder="3"
                      required={modo === 'criar'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ano *</Label>
                    <Input
                      type="number"
                      min={1900}
                      max={2100}
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value) || new Date().getFullYear())}
                      required={modo === 'criar'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as TipoReuniao)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_REUNIAO.map((t) => (
                          <SelectItem key={t.codigo} value={t.codigo}>
                            {t.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required={modo === 'criar'}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Local (opcional)</Label>
                  <Input
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Sala da CLJ"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Ata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Arquivo PDF *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleUpload(f)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Selecionar PDF
                </Button>
                {arquivoAtaUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setArquivoAtaUrl('')
                      setArquivoNome('')
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" /> Remover
                  </Button>
                )}
              </div>
              {arquivoAtaUrl && (
                <div className="flex items-center gap-2 p-2 border rounded text-sm">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <a
                    href={arquivoAtaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-camara-primary hover:underline flex-1 truncate"
                  >
                    {arquivoNome || arquivoAtaUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de publicação *</Label>
              <Input
                type="date"
                value={dataPublicacaoAta}
                onChange={(e) => setDataPublicacaoAta(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                RN-123 PNTP exige prazo máximo de 15 dias após a aprovação.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Input
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas internas"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/comissoes/reunioes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4 mr-2" />
                Publicar Ata
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
