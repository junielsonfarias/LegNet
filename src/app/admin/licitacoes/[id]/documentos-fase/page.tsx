'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText, ArrowLeft, Plus, Trash2, Save, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface DocItem {
  nome: string
  url: string
  tipo?: string
}

interface LicitData {
  id: string
  numero: string
  ano: number
  objeto: string
  documentosFaseInterna: DocItem[]
  documentosFaseExterna: DocItem[]
}

export default function DocumentosFaseLicitacaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [data, setData] = useState<LicitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [interna, setInterna] = useState<DocItem[]>([])
  const [externa, setExterna] = useState<DocItem[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/licitacoes/${id}/documentos`)
      const j = await r.json()
      const d = j?.data
      if (d) {
        setData(d)
        setInterna(Array.isArray(d.documentosFaseInterna) ? d.documentosFaseInterna : [])
        setExterna(Array.isArray(d.documentosFaseExterna) ? d.documentosFaseExterna : [])
      }
    } catch {
      toast.error('Erro ao carregar licitacao')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const cleanInterna = interna.filter((d) => d.nome && d.url)
      const cleanExterna = externa.filter((d) => d.nome && d.url)
      const r = await fetch(`/api/licitacoes/${id}/documentos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentosFaseInterna: cleanInterna,
          documentosFaseExterna: cleanExterna,
        }),
      })
      if (r.ok) {
        toast.success('Documentos atualizados')
        load()
      } else {
        toast.error('Erro ao salvar')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Licitacao nao encontrada.</p>
        <Link href="/admin/licitacoes" className="text-camara-primary hover:underline mt-2 inline-block">
          Voltar
        </Link>
      </div>
    )
  }

  const renderFase = (
    titulo: string,
    descricao: string,
    docs: DocItem[],
    setDocs: (d: DocItem[]) => void,
    sugestoes: string[],
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {titulo}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDocs([...docs, { nome: '', url: '', tipo: '' }])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {docs.length === 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Nenhum documento. Sugestoes desta fase:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sugestoes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDocs([...docs, { nome: s, url: '', tipo: s }])}
                  className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          docs.map((d, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start border rounded-md p-2">
              <Input
                placeholder="Nome (ex.: Edital)"
                value={d.nome}
                onChange={(e) => {
                  const next = [...docs]
                  next[idx] = { ...next[idx], nome: e.target.value }
                  setDocs(next)
                }}
              />
              <Input
                placeholder="URL do documento"
                value={d.url}
                onChange={(e) => {
                  const next = [...docs]
                  next[idx] = { ...next[idx], url: e.target.value }
                  setDocs(next)
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDocs(docs.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/licitacoes`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Licitacoes
        </Link>
        <h1 className="text-2xl font-bold">
          Documentos da licitacao {data.numero}/{data.ano}
        </h1>
        <p className="text-sm text-muted-foreground">{data.objeto}</p>
      </div>

      {renderFase(
        'Fase Interna',
        'Parecer juridico, termo de referencia, estudo tecnico preliminar, minuta de edital e demais atos de planejamento.',
        interna,
        setInterna,
        [
          'Estudo Tecnico Preliminar',
          'Termo de Referencia',
          'Parecer Juridico',
          'Minuta de Edital',
          'Pesquisa de Mercado',
          'Autorizacao da Autoridade Competente',
        ],
      )}

      {renderFase(
        'Fase Externa',
        'Edital publicado, propostas, atas de julgamento, recursos, adjudicacao e homologacao.',
        externa,
        setExterna,
        [
          'Edital Publicado',
          'Ata de Abertura',
          'Ata de Julgamento',
          'Resultado de Habilitacao',
          'Recursos e Contrarrazoes',
          'Adjudicacao',
          'Homologacao',
        ],
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar documentos
        </Button>
      </div>

      <Card className="border-l-4 border-l-camara-primary">
        <CardContent className="p-4">
          <p className="text-sm">
            Os documentos sao exibidos publicamente em{' '}
            <Link
              href={`/transparencia/licitacoes/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-camara-primary hover:underline font-medium"
            >
              /transparencia/licitacoes/{id}
            </Link>
            . Critérios PNTP 8.3 e 8.4 atendidos quando ha pelo menos 1 documento em cada fase.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
