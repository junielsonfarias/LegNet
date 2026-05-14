'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, FileCheck, Loader2, Upload, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * RN-174 — Publicacao de Emenda.
 */

type TipoEmenda =
  | 'ADITIVA'
  | 'MODIFICATIVA'
  | 'SUPRESSIVA'
  | 'SUBSTITUTIVA'
  | 'EMENDA_DE_REDACAO'
  | 'AGLUTINATIVA'

interface ProposicaoItem {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
}

interface ParlamentarItem {
  id: string
  nome: string
  apelido: string | null
  partido: string | null
}

interface EmendaListItem {
  id: string
  numero: number
  tipo: TipoEmenda
  status: string
  autor: { nome: string; apelido: string | null } | null
}

const TIPOS_EMENDA: { codigo: TipoEmenda; nome: string }[] = [
  { codigo: 'ADITIVA', nome: 'Aditiva' },
  { codigo: 'MODIFICATIVA', nome: 'Modificativa' },
  { codigo: 'SUPRESSIVA', nome: 'Supressiva' },
  { codigo: 'SUBSTITUTIVA', nome: 'Substitutiva' },
  { codigo: 'EMENDA_DE_REDACAO', nome: 'De Redação' },
  { codigo: 'AGLUTINATIVA', nome: 'Aglutinativa' },
]

export default function PublicarEmendaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proposicaoIdParam = searchParams?.get('proposicaoId') || ''

  const [modo, setModo] = useState<'existente' | 'criar'>('criar')

  const [proposicoes, setProposicoes] = useState<ProposicaoItem[]>([])
  const [parlamentares, setParlamentares] = useState<ParlamentarItem[]>([])
  const [emendas, setEmendas] = useState<EmendaListItem[]>([])
  const [loadingListas, setLoadingListas] = useState(false)

  const [emendaId, setEmendaId] = useState('')
  const [proposicaoId, setProposicaoId] = useState(proposicaoIdParam)
  const [numero, setNumero] = useState<number | ''>('')
  const [tipo, setTipo] = useState<TipoEmenda | ''>('')
  const [autorId, setAutorId] = useState('')
  const [textoNovo, setTextoNovo] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [textoOriginal, setTextoOriginal] = useState('')
  const [artigo, setArtigo] = useState('')

  const [arquivoUrl, setArquivoUrl] = useState('')
  const [arquivoNome, setArquivoNome] = useState('')
  const [dataPublicacao, setDataPublicacao] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [observacoes, setObservacoes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setLoadingListas(true)
    Promise.all([
      fetch('/api/proposicoes?limit=200').then((r) => r.json()),
      fetch('/api/parlamentares?ativo=true&limit=100').then((r) => r.json()),
    ])
      .then(([pJ, parJ]) => {
        const pArr = Array.isArray(pJ?.data) ? pJ.data : Array.isArray(pJ) ? pJ : []
        const parArr = Array.isArray(parJ?.data) ? parJ.data : Array.isArray(parJ) ? parJ : []
        setProposicoes(
          pArr.map((p: any) => ({
            id: p.id,
            numero: p.numero,
            ano: p.ano,
            tipo: p.tipo,
            titulo: p.titulo,
          })),
        )
        setParlamentares(
          parArr.map((p: any) => ({
            id: p.id,
            nome: p.nome,
            apelido: p.apelido ?? null,
            partido: p.partido ?? null,
          })),
        )
      })
      .catch(() => toast.error('Erro ao carregar proposições/parlamentares'))
      .finally(() => setLoadingListas(false))
  }, [])

  // Carrega emendas existentes quando filtra por proposição
  useEffect(() => {
    if (modo !== 'existente' || !proposicaoId) return
    fetch(`/api/proposicoes/${proposicaoId}/emendas`)
      .then((r) => r.json())
      .then((j) => {
        const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []
        setEmendas(
          arr.map((e: any) => ({
            id: e.id,
            numero: e.numero,
            tipo: e.tipo,
            status: e.status,
            autor: e.autor
              ? { nome: e.autor.nome, apelido: e.autor.apelido ?? null }
              : null,
          })),
        )
      })
      .catch(() => toast.error('Erro ao carregar emendas'))
  }, [modo, proposicaoId])

  async function handleUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'emendas-publicacao')
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await r.json()
    if (j.success) {
      setArquivoUrl(j.url)
      setArquivoNome(file.name)
      toast.success(`${file.name} carregado`)
    } else {
      toast.error(j.error || 'Erro no upload')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!arquivoUrl) {
      toast.error('Faça o upload do PDF da emenda')
      return
    }

    const body: Record<string, unknown> = {
      arquivoUrl,
      arquivoNome: arquivoNome || undefined,
      dataPublicacao,
      observacoes: observacoes.trim() || undefined,
    }

    if (modo === 'existente') {
      if (!emendaId) {
        toast.error('Selecione uma emenda')
        return
      }
      body.emendaId = emendaId
    } else {
      if (!proposicaoId || !numero || !tipo || !autorId || !textoNovo.trim() || !justificativa.trim()) {
        toast.error('Proposição, número, tipo, autor, texto novo e justificativa são obrigatórios')
        return
      }
      body.proposicaoId = proposicaoId
      body.numero = Number(numero)
      body.tipo = tipo
      body.autorId = autorId
      body.textoNovo = textoNovo.trim()
      body.justificativa = justificativa.trim()
      if (textoOriginal.trim()) body.textoOriginal = textoOriginal.trim()
      if (artigo.trim()) body.artigo = artigo.trim()
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/emendas/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (j.success) {
        toast.success(j.message || 'Emenda publicada com sucesso')
        if (proposicaoId) {
          router.push(`/admin/proposicoes/${proposicaoId}/emendas`)
        } else {
          router.push('/admin/proposicoes')
        }
      } else {
        toast.error(j.error || 'Erro ao publicar emenda')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSubmitting(false)
    }
  }

  function formatProposicaoLabel(p: ProposicaoItem): string {
    return `${p.tipo} ${p.numero}/${p.ano} — ${p.titulo.slice(0, 60)}${p.titulo.length > 60 ? '...' : ''}`
  }

  function formatParlamentarLabel(p: ParlamentarItem): string {
    const base = p.apelido || p.nome
    return p.partido ? `${base} (${p.partido})` : base
  }

  function formatEmendaLabel(e: EmendaListItem): string {
    const tipoLabel = TIPOS_EMENDA.find((t) => t.codigo === e.tipo)?.nome || e.tipo
    const autorLabel = e.autor?.apelido || e.autor?.nome || 'Autor'
    return `Emenda nº ${e.numero} — ${tipoLabel} — ${autorLabel} [${e.status}]`
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <Link
          href={proposicaoId ? `/admin/proposicoes/${proposicaoId}/emendas` : '/admin/proposicoes'}
          className="inline-flex items-center text-sm text-gray-600 hover:text-camara-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="h-7 w-7 text-camara-primary" />
          Publicar Emenda
        </h1>
        <p className="text-gray-600 mt-1">
          Anexe o PDF assinado a uma emenda. Se a emenda ainda não existe, ela será
          criada com status "Apresentada" usando find-or-create por proposição+número.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Modo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={modo === 'criar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('criar')}
              >
                Criar emenda nova
              </Button>
              <Button
                type="button"
                variant={modo === 'existente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('existente')}
              >
                Anexar a emenda existente
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Proposição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Proposição *</Label>
            <Select value={proposicaoId} onValueChange={setProposicaoId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingListas ? 'Carregando...' : 'Escolha uma proposição'}
                />
              </SelectTrigger>
              <SelectContent>
                {proposicoes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {formatProposicaoLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {modo === 'existente' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Emenda existente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>Emenda *</Label>
              <Select value={emendaId} onValueChange={setEmendaId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={proposicaoId ? 'Escolha uma emenda' : 'Selecione a proposição primeiro'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {emendas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {formatEmendaLabel(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Conteúdo da emenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={numero}
                    onChange={(e) => setNumero(e.target.value ? Number(e.target.value) : '')}
                    placeholder="1"
                    required={modo === 'criar'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEmenda)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EMENDA.map((t) => (
                        <SelectItem key={t.codigo} value={t.codigo}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Autor *</Label>
                  <Select value={autorId} onValueChange={setAutorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {parlamentares.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {formatParlamentarLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Artigo de incidência (opcional)</Label>
                <Input
                  value={artigo}
                  onChange={(e) => setArtigo(e.target.value)}
                  placeholder="Art. 1º"
                />
              </div>
              <div className="space-y-2">
                <Label>Texto original (opcional)</Label>
                <Textarea
                  value={textoOriginal}
                  onChange={(e) => setTextoOriginal(e.target.value)}
                  rows={2}
                  placeholder="Texto que será alterado/removido"
                />
              </div>
              <div className="space-y-2">
                <Label>Texto novo *</Label>
                <Textarea
                  value={textoNovo}
                  onChange={(e) => setTextoNovo(e.target.value)}
                  rows={4}
                  placeholder="Novo texto proposto"
                />
              </div>
              <div className="space-y-2">
                <Label>Justificativa *</Label>
                <Textarea
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={3}
                  placeholder="Justificativa da emenda"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Arquivo</CardTitle>
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
                {arquivoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setArquivoUrl('')
                      setArquivoNome('')
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-red-500" /> Remover
                  </Button>
                )}
              </div>
              {arquivoUrl && (
                <div className="flex items-center gap-2 p-2 border rounded text-sm">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <a
                    href={arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-camara-primary hover:underline flex-1 truncate"
                  >
                    {arquivoNome || arquivoUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de publicação *</Label>
              <Input
                type="date"
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
                required
              />
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
            <Link href={proposicaoId ? `/admin/proposicoes/${proposicaoId}/emendas` : '/admin/proposicoes'}>
              Cancelar
            </Link>
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
                Publicar Emenda
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
