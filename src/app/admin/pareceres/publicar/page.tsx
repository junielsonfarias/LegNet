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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * RN-173 — Publicacao de Parecer de Comissao.
 *
 * Dois modos:
 *  - Existente: anexa o PDF a um parecer ja cadastrado.
 *  - Criar: cria parecer + anexa PDF (caso retroativo). Find-or-create
 *    por (proposicaoId, comissaoId) cobre ambos.
 */

type TipoParecer =
  | 'FAVORAVEL'
  | 'FAVORAVEL_COM_EMENDAS'
  | 'CONTRARIO'
  | 'PELA_INCONSTITUCIONALIDADE'
  | 'PELA_ILEGALIDADE'
  | 'PELA_PREJUDICIALIDADE'
  | 'PELA_RETIRADA'

interface ComissaoItem {
  id: string
  nome: string
  sigla: string | null
}

interface ParlamentarItem {
  id: string
  nome: string
  apelido: string | null
  partido: string | null
}

interface ProposicaoItem {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa: string
}

interface ParecerListItem {
  id: string
  tipo: TipoParecer
  status: string
  numero: string | null
  ano: number
  proposicao: { numero: string; ano: number; tipo: string } | null
  comissao: { nome: string; sigla: string | null } | null
}

const TIPOS_PARECER: { codigo: TipoParecer; nome: string }[] = [
  { codigo: 'FAVORAVEL', nome: 'Favorável' },
  { codigo: 'FAVORAVEL_COM_EMENDAS', nome: 'Favorável com Emendas' },
  { codigo: 'CONTRARIO', nome: 'Contrário' },
  { codigo: 'PELA_INCONSTITUCIONALIDADE', nome: 'Pela Inconstitucionalidade' },
  { codigo: 'PELA_ILEGALIDADE', nome: 'Pela Ilegalidade' },
  { codigo: 'PELA_PREJUDICIALIDADE', nome: 'Pela Prejudicialidade' },
  { codigo: 'PELA_RETIRADA', nome: 'Pela Retirada' },
]

export default function PublicarParecerPage() {
  const router = useRouter()

  const [modo, setModo] = useState<'existente' | 'criar'>('criar')

  // Listas
  const [comissoes, setComissoes] = useState<ComissaoItem[]>([])
  const [parlamentares, setParlamentares] = useState<ParlamentarItem[]>([])
  const [proposicoes, setProposicoes] = useState<ProposicaoItem[]>([])
  const [pareceres, setPareceres] = useState<ParecerListItem[]>([])
  const [loadingListas, setLoadingListas] = useState(false)

  // Selecoes
  const [parecerId, setParecerId] = useState('')
  const [comissaoId, setComissaoId] = useState('')
  const [proposicaoId, setProposicaoId] = useState('')
  const [relatorId, setRelatorId] = useState('')
  const [tipo, setTipo] = useState<TipoParecer | ''>('')
  const [numero, setNumero] = useState('')
  const [ano, setAno] = useState<number>(new Date().getFullYear())
  const [fundamentacao, setFundamentacao] = useState('')
  const [ementa, setEmenta] = useState('')
  const [conclusao, setConclusao] = useState('')

  // Arquivo
  const [arquivoUrl, setArquivoUrl] = useState('')
  const [arquivoNome, setArquivoNome] = useState('')
  const [arquivoTamanho, setArquivoTamanho] = useState<number | null>(null)
  const [dataEmissao, setDataEmissao] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [observacoes, setObservacoes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setLoadingListas(true)
    Promise.all([
      fetch('/api/comissoes?ativa=true&limit=100').then((r) => r.json()),
      fetch('/api/parlamentares?ativo=true&limit=100').then((r) => r.json()),
    ])
      .then(([cJ, pJ]) => {
        const cArr = Array.isArray(cJ?.data) ? cJ.data : Array.isArray(cJ) ? cJ : []
        const pArr = Array.isArray(pJ?.data) ? pJ.data : Array.isArray(pJ) ? pJ : []
        setComissoes(cArr.map((c: any) => ({ id: c.id, nome: c.nome, sigla: c.sigla ?? null })))
        setParlamentares(
          pArr.map((p: any) => ({
            id: p.id,
            nome: p.nome,
            apelido: p.apelido ?? null,
            partido: p.partido ?? null,
          })),
        )
      })
      .catch(() => toast.error('Erro ao carregar comissões/parlamentares'))
      .finally(() => setLoadingListas(false))
  }, [])

  // Carrega proposicoes (modo criar) ou pareceres (modo existente)
  useEffect(() => {
    if (modo === 'criar') {
      fetch('/api/proposicoes?limit=200')
        .then((r) => r.json())
        .then((j) => {
          const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []
          setProposicoes(
            arr.map((p: any) => ({
              id: p.id,
              numero: p.numero,
              ano: p.ano,
              tipo: p.tipo,
              titulo: p.titulo,
              ementa: p.ementa,
            })),
          )
        })
        .catch(() => toast.error('Erro ao carregar proposições'))
    } else {
      const qs = new URLSearchParams()
      if (comissaoId) qs.set('comissaoId', comissaoId)
      qs.set('limit', '100')
      fetch(`/api/pareceres?${qs.toString()}`)
        .then((r) => r.json())
        .then((j) => {
          const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : []
          setPareceres(
            arr.map((p: any) => ({
              id: p.id,
              tipo: p.tipo,
              status: p.status,
              numero: p.numero ?? null,
              ano: p.ano,
              proposicao: p.proposicao
                ? { numero: p.proposicao.numero, ano: p.proposicao.ano, tipo: p.proposicao.tipo }
                : null,
              comissao: p.comissao
                ? { nome: p.comissao.nome, sigla: p.comissao.sigla ?? null }
                : null,
            })),
          )
        })
        .catch(() => toast.error('Erro ao carregar pareceres'))
    }
  }, [modo, comissaoId])

  async function handleUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'pareceres-publicacao')
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await r.json()
    if (j.success) {
      setArquivoUrl(j.url)
      setArquivoNome(file.name)
      setArquivoTamanho(file.size)
      toast.success(`${file.name} carregado`)
    } else {
      toast.error(j.error || 'Erro no upload')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!arquivoUrl) {
      toast.error('Faça o upload do PDF do parecer')
      return
    }

    const body: Record<string, unknown> = {
      arquivoUrl,
      arquivoNome: arquivoNome || undefined,
      arquivoTamanho: arquivoTamanho ?? undefined,
      dataEmissao,
      observacoes: observacoes.trim() || undefined,
    }

    if (modo === 'existente') {
      if (!parecerId) {
        toast.error('Selecione um parecer')
        return
      }
      body.parecerId = parecerId
    } else {
      if (
        !comissaoId ||
        !proposicaoId ||
        !relatorId ||
        !tipo ||
        !fundamentacao.trim()
      ) {
        toast.error('Comissão, proposição, relator, tipo e fundamentação são obrigatórios')
        return
      }
      body.comissaoId = comissaoId
      body.proposicaoId = proposicaoId
      body.relatorId = relatorId
      body.tipo = tipo
      body.fundamentacao = fundamentacao.trim()
      body.ano = Number(ano)
      if (numero.trim()) body.numero = numero.trim()
      if (ementa.trim()) body.ementa = ementa.trim()
      if (conclusao.trim()) body.conclusao = conclusao.trim()
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/pareceres/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json()
      if (j.success) {
        toast.success(j.message || 'Parecer publicado com sucesso')
        router.push('/admin/pareceres')
      } else {
        toast.error(j.error || 'Erro ao publicar parecer')
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

  function formatComissaoLabel(c: ComissaoItem): string {
    return c.sigla ? `${c.sigla} — ${c.nome}` : c.nome
  }

  function formatParecerLabel(p: ParecerListItem): string {
    const propLabel = p.proposicao
      ? `${p.proposicao.tipo} ${p.proposicao.numero}/${p.proposicao.ano}`
      : 'Sem proposição'
    const comLabel = p.comissao?.sigla || p.comissao?.nome || ''
    const tipoLabel = TIPOS_PARECER.find((t) => t.codigo === p.tipo)?.nome || p.tipo
    return `${propLabel} — ${comLabel} — ${tipoLabel} [${p.status}]`
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/pareceres"
          className="inline-flex items-center text-sm text-gray-600 hover:text-camara-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Pareceres
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="h-7 w-7 text-camara-primary" />
          Publicar Parecer de Comissão
        </h1>
        <p className="text-gray-600 mt-1">
          Anexe o PDF assinado a um parecer. Se o parecer ainda não existe, ele será
          criado com status “Emitido” usando find-or-create por proposição+comissão.
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
                Criar parecer novo
              </Button>
              <Button
                type="button"
                variant={modo === 'existente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModo('existente')}
              >
                Anexar a parecer existente
              </Button>
            </div>
          </CardContent>
        </Card>

        {modo === 'existente' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Parecer existente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Filtrar por comissão (opcional)</Label>
                <Select value={comissaoId} onValueChange={setComissaoId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingListas ? 'Carregando...' : 'Todas as comissões'}
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
              <div className="space-y-2">
                <Label>Parecer *</Label>
                <Select value={parecerId} onValueChange={setParecerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um parecer" />
                  </SelectTrigger>
                  <SelectContent>
                    {pareceres.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {formatParecerLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Vínculos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Comissão *</Label>
                  <Select value={comissaoId} onValueChange={setComissaoId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={loadingListas ? 'Carregando...' : 'Escolha uma comissão'}
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
                <div className="space-y-2">
                  <Label>Proposição *</Label>
                  <Select value={proposicaoId} onValueChange={setProposicaoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma proposição" />
                    </SelectTrigger>
                    <SelectContent>
                      {proposicoes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {formatProposicaoLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Relator (parlamentar) *</Label>
                  <Select value={relatorId} onValueChange={setRelatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o relator" />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as TipoParecer)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_PARECER.map((t) => (
                          <SelectItem key={t.codigo} value={t.codigo}>
                            {t.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Número (opcional)</Label>
                    <Input
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="001/2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Input
                      type="number"
                      min={1900}
                      max={2100}
                      value={ano}
                      onChange={(e) => setAno(Number(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ementa (opcional)</Label>
                  <Input
                    value={ementa}
                    onChange={(e) => setEmenta(e.target.value)}
                    placeholder="Resumo curto do parecer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fundamentação *</Label>
                  <Textarea
                    value={fundamentacao}
                    onChange={(e) => setFundamentacao(e.target.value)}
                    rows={5}
                    placeholder="Texto da fundamentação (mínimo 10 caracteres)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conclusão (opcional)</Label>
                  <Textarea
                    value={conclusao}
                    onChange={(e) => setConclusao(e.target.value)}
                    rows={2}
                    placeholder="Conclusão / recomendação final"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {modo === 'criar' ? '4' : '3'}. Arquivo
            </CardTitle>
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
                      setArquivoTamanho(null)
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
              <Label>Data de emissão *</Label>
              <Input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
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
            <Link href="/admin/pareceres">Cancelar</Link>
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
                Publicar Parecer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
