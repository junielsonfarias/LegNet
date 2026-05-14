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
 * RN-171 — Publicacao de Pauta da Sessao.
 *
 * Espelha o fluxo da Ata: toggle entre "Sessao existente" e "Criar nova".
 * Anexa o PDF a Sessao.arquivoPauta + atualiza PautaSessao.dataPublicacao.
 */

type TipoSessao = 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'

interface SessaoListItem {
  id: string
  numero: number
  tipo: TipoSessao
  data: string
}

const TIPOS_SESSAO: { codigo: TipoSessao; nome: string }[] = [
  { codigo: 'ORDINARIA', nome: 'Ordinária' },
  { codigo: 'EXTRAORDINARIA', nome: 'Extraordinária' },
  { codigo: 'SOLENE', nome: 'Solene' },
  { codigo: 'ESPECIAL', nome: 'Especial' },
]

export default function PublicarPautaPage() {
  const router = useRouter()

  const [modo, setModo] = useState<'existente' | 'criar'>('existente')

  const [sessoes, setSessoes] = useState<SessaoListItem[]>([])
  const [sessaoId, setSessaoId] = useState<string>('')
  const [loadingSessoes, setLoadingSessoes] = useState(false)

  const [numero, setNumero] = useState<number | ''>('')
  const [tipo, setTipo] = useState<TipoSessao | ''>('')
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')
  const [local, setLocal] = useState('')

  const [arquivoPautaUrl, setArquivoPautaUrl] = useState('')
  const [arquivoNome, setArquivoNome] = useState('')
  const [dataPublicacaoPauta, setDataPublicacaoPauta] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [observacoes, setObservacoes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (modo !== 'existente' || sessoes.length > 0) return
    setLoadingSessoes(true)
    fetch('/api/sessoes?limit=200&orderBy=data&order=desc')
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []
        setSessoes(
          arr.map((s: any) => ({
            id: s.id,
            numero: s.numero,
            tipo: s.tipo,
            data: s.data,
          })),
        )
      })
      .catch(() => toast.error('Erro ao carregar sessões'))
      .finally(() => setLoadingSessoes(false))
  }, [modo, sessoes.length])

  async function handleUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'pautas-sessoes')
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await r.json()
    if (j.success) {
      setArquivoPautaUrl(j.url)
      setArquivoNome(file.name)
      toast.success(`${file.name} carregado`)
    } else {
      toast.error(j.error || 'Erro no upload')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!arquivoPautaUrl) {
      toast.error('Faça o upload do PDF da pauta')
      return
    }

    const body: Record<string, unknown> = {
      arquivoPautaUrl,
      dataPublicacaoPauta,
      observacoes: observacoes.trim() || undefined,
    }

    if (modo === 'existente') {
      if (!sessaoId) {
        toast.error('Selecione uma sessão')
        return
      }
      body.sessaoId = sessaoId
    } else {
      if (!numero || !tipo || !data) {
        toast.error('Informe número, tipo e data da sessão')
        return
      }
      body.numero = Number(numero)
      body.tipo = tipo
      body.data = data
      if (horario.trim()) body.horario = horario.trim()
      if (local.trim()) body.local = local.trim()
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/sessoes/publicar-pauta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (j.success) {
        toast.success(j.message || 'Pauta publicada com sucesso')
        const sessId = j?.data?.id
        if (sessId) {
          router.push(`/admin/sessoes/${sessId}`)
        } else {
          router.push('/admin/sessoes')
        }
      } else {
        toast.error(j.error || 'Erro ao publicar pauta')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSubmitting(false)
    }
  }

  function formatSessaoLabel(s: SessaoListItem): string {
    const tipoLabel = TIPOS_SESSAO.find((t) => t.codigo === s.tipo)?.nome || s.tipo
    const dataFmt = new Date(s.data).toLocaleDateString('pt-BR')
    return `${s.numero}ª ${tipoLabel} — ${dataFmt}`
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/sessoes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-camara-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Sessões
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="h-7 w-7 text-camara-primary" />
          Publicar Pauta da Sessão
        </h1>
        <p className="text-gray-600 mt-1">
          Anexe o PDF da pauta a uma sessão. Se a sessão ainda não existe, ela será
          criada automaticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Sessão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={modo === 'existente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('existente')}
              >
                Selecionar sessão existente
              </Button>
              <Button
                type="button"
                variant={modo === 'criar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('criar')}
              >
                Criar sessão automaticamente
              </Button>
            </div>

            {modo === 'existente' ? (
              <div className="space-y-2">
                <Label>Sessão *</Label>
                <Select value={sessaoId} onValueChange={setSessaoId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingSessoes ? 'Carregando...' : 'Escolha uma sessão'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {sessoes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {formatSessaoLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Lista as 200 sessões mais recentes. Se não encontrar, use “Criar
                  sessão automaticamente”.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Número *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={numero}
                      onChange={(e) => setNumero(e.target.value ? Number(e.target.value) : '')}
                      placeholder="37"
                      required={modo === 'criar'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as TipoSessao)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_SESSAO.map((t) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Horário (opcional)</Label>
                    <Input
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      placeholder="14:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Local (opcional)</Label>
                    <Input
                      value={local}
                      onChange={(e) => setLocal(e.target.value)}
                      placeholder="Plenário da Câmara"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  O sistema procura uma sessão com o mesmo número, tipo e ano. Se não
                  encontrar, cria uma nova como Concluída/finalizada.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Pauta</CardTitle>
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
                {arquivoPautaUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setArquivoPautaUrl('')
                      setArquivoNome('')
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" /> Remover
                  </Button>
                )}
              </div>
              {arquivoPautaUrl && (
                <div className="flex items-center gap-2 p-2 border rounded text-sm">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <a
                    href={arquivoPautaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-camara-primary hover:underline flex-1 truncate"
                  >
                    {arquivoNome || arquivoPautaUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de publicação *</Label>
              <Input
                type="date"
                value={dataPublicacaoPauta}
                onChange={(e) => setDataPublicacaoPauta(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                RN-122 PNTP exige publicação 48h antes da sessão. Para pautas
                retroativas, registre a data efetiva de divulgação.
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
            <Link href="/admin/sessoes">Cancelar</Link>
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
                Publicar Pauta
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
