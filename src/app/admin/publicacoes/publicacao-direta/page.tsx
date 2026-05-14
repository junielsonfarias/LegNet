'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { ArrowLeft, FileCheck, Loader2, Plus, Trash2, Upload, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

/**
 * RN-169 — Publicacao Direta de Documentos Administrativos.
 *
 * Formulario enxuto para publicar atos da Mesa/Presidencia, portarias,
 * oficios, editais, erratas, convocacoes, comunicados, agendas, atas e
 * pautas avulsas. Reaproveita o modelo Publicacao.
 */

// RN-170/RN-171: ATA_SESSAO e PAUTA_SESSAO removidas — ambas tem fluxo
// dedicado em /admin/sessoes/publicar-ata e /admin/sessoes/publicar-pauta
// (vinculo obrigatorio com Sessao).
const TIPOS_ADMINISTRATIVOS = [
  { codigo: 'PORTARIA', nome: 'Portaria' },
  { codigo: 'DECRETO', nome: 'Decreto' },
  { codigo: 'RESOLUCAO', nome: 'Resolução' },
  { codigo: 'ATO_MESA', nome: 'Ato da Mesa Diretora' },
  { codigo: 'ATO_PRESIDENCIA', nome: 'Ato da Presidência' },
  { codigo: 'OFICIO', nome: 'Ofício' },
  { codigo: 'EDITAL', nome: 'Edital' },
  { codigo: 'ERRATA', nome: 'Errata' },
  { codigo: 'CONVOCACAO', nome: 'Convocação' },
  { codigo: 'COMUNICADO', nome: 'Comunicado' },
  { codigo: 'AGENDA', nome: 'Agenda' },
  { codigo: 'RELATORIO', nome: 'Relatório' },
  { codigo: 'PLANEJAMENTO', nome: 'Planejamento' },
  { codigo: 'OUTRO', nome: 'Outro' },
] as const

type TipoAdmin = (typeof TIPOS_ADMINISTRATIVOS)[number]['codigo']

interface DocumentoForm {
  nome: string
  url: string
}

export default function PublicacaoDocumentosPage() {
  const router = useRouter()

  const [tipo, setTipo] = useState<TipoAdmin | ''>('')
  const [titulo, setTitulo] = useState('')
  const [numero, setNumero] = useState('')
  const [ano, setAno] = useState<number>(new Date().getFullYear())
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [ementa, setEmenta] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [urlExterna, setUrlExterna] = useState('')
  const [autorNome, setAutorNome] = useState('')

  const [documentos, setDocumentos] = useState<DocumentoForm[]>([])
  const [novoDocNome, setNovoDocNome] = useState('')
  const [novoDocUrl, setNovoDocUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [submitting, setSubmitting] = useState(false)

  async function handleUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'publicacoes-atos')
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await r.json()
    if (j.success) {
      setDocumentos((prev) => [...prev, { nome: file.name, url: j.url }])
      toast.success(`${file.name} adicionado`)
    } else {
      toast.error(j.error || 'Erro no upload')
    }
  }

  function handleAddLink() {
    if (!novoDocNome.trim() || !novoDocUrl.trim()) {
      toast.error('Informe nome e URL do documento')
      return
    }
    try {
      new URL(novoDocUrl)
    } catch {
      toast.error('URL invalida')
      return
    }
    setDocumentos((prev) => [...prev, { nome: novoDocNome.trim(), url: novoDocUrl.trim() }])
    setNovoDocNome('')
    setNovoDocUrl('')
  }

  function handleRemoveDoc(idx: number) {
    setDocumentos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tipo) {
      toast.error('Selecione o tipo de documento')
      return
    }
    if (!titulo.trim() || titulo.length < 3) {
      toast.error('Titulo eh obrigatorio (min 3 caracteres)')
      return
    }
    if (!data) {
      toast.error('Data de publicacao eh obrigatoria')
      return
    }
    if (documentos.length === 0 && !urlExterna.trim() && !conteudo.trim()) {
      toast.error('Adicione pelo menos um documento, URL externa ou conteudo')
      return
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/publicacoes/publicacao-direta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          titulo: titulo.trim(),
          numero: numero.trim() || undefined,
          ano,
          data,
          ementa: ementa.trim() || undefined,
          conteudo: conteudo.trim() || undefined,
          url: urlExterna.trim() || undefined,
          documentos: documentos.length > 0 ? documentos : undefined,
          autorNome: autorNome.trim() || undefined,
        }),
      })
      const j = await r.json()
      if (j.success) {
        toast.success('Documento publicado!')
        router.push('/admin/publicacoes')
      } else {
        toast.error(j.error || 'Erro ao publicar')
      }
    } catch {
      toast.error('Erro de conexao')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/publicacoes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-camara-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Publicações
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="h-7 w-7 text-camara-primary" />
          Publicação Direta de Documento
        </h1>
        <p className="text-gray-600 mt-1">
          Publique portarias, atos administrativos, ofícios, editais, erratas, convocações,
          comunicados, agendas, atas e pautas avulsas. Reaproveite anexos em PDF/imagem.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificacao */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de documento *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoAdmin)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ADMINISTRATIVOS.map((t) => (
                      <SelectItem key={t.codigo} value={t.codigo}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Portaria nº 005/2025 - Designação de relator"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 005" />
              </div>
              <div className="space-y-2">
                <Label>Ano *</Label>
                <Input
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(parseInt(e.target.value) || new Date().getFullYear())}
                  min={1900}
                  max={2100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Órgão/Autor</Label>
                <Input
                  value={autorNome}
                  onChange={(e) => setAutorNome(e.target.value)}
                  placeholder="Ex: Mesa Diretora"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteudo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Conteúdo (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ementa / Resumo</Label>
              <Textarea
                value={ementa}
                onChange={(e) => setEmenta(e.target.value)}
                rows={2}
                placeholder="Resumo curto do documento"
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo (texto completo, opcional)</Label>
              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={4}
                placeholder="Se o documento eh apenas PDF, deixe vazio."
              />
            </div>
            <div className="space-y-2">
              <Label>URL externa (opcional)</Label>
              <Input
                value={urlExterna}
                onChange={(e) => setUrlExterna(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500">
                Link para o documento em outro sistema (Google Drive, diário oficial externo, etc).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Anexos ({documentos.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleUpload(f)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Upload PDF/Imagem
              </Button>
              <div className="flex flex-1 gap-2">
                <Input
                  value={novoDocNome}
                  onChange={(e) => setNovoDocNome(e.target.value)}
                  placeholder="Nome"
                  className="flex-1"
                />
                <Input
                  value={novoDocUrl}
                  onChange={(e) => setNovoDocUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddLink}>
                  <Plus className="h-4 w-4 mr-1" /> Link
                </Button>
              </div>
            </div>

            {documentos.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum anexo. Pode usar apenas URL externa ou conteúdo textual.</p>
            ) : (
              <ul className="space-y-2">
                {documentos.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-camara-primary hover:underline truncate"
                    >
                      {doc.nome}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDoc(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/publicacoes">Cancelar</Link>
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
                Publicar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
