'use client'

/**
 * Revisão/classificação manual de proposições históricas (entrada retroativa)
 * que ficaram APRESENTADA — tipicamente as do acervo WordPress sem carimbo de
 * aprovação legível por OCR. Fluxo um-a-um: mostra o PDF + dados e o revisor
 * define o status (Aprovar / Rejeitar / Arquivar / Pular).
 *
 * Usa GET /api/proposicoes?entradaRetroativa=true&status=APRESENTADA e
 * PUT /api/proposicoes/[id] { status }.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, XCircle, Archive, SkipForward, ChevronLeft,
  FileText, ExternalLink, Loader2,
} from 'lucide-react'

interface Doc { nome: string; url: string }
interface Proposicao {
  id: string
  tipo: string
  numero: string
  ano: number
  titulo: string
  ementa: string
  status: string
  documentos: Doc[] | null
  urlDocumento: string | null
  dataApresentacao: string
}

const TIPO_LABEL: Record<string, string> = {
  REQUERIMENTO: 'Requerimento', PROJETO_LEI: 'Projeto de Lei', INDICACAO: 'Indicação',
  PROJETO_RESOLUCAO: 'Projeto de Resolução', PROJETO_INDICACAO: 'Projeto de Indicação', MOCAO: 'Moção',
}

export default function RevisaoAprovacaoPage() {
  const [lista, setLista] = useState<Proposicao[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [revisados, setRevisados] = useState(0)
  const [erro, setErro] = useState(false)

  const carregar = useCallback(() => {
    setLoading(true)
    setErro(false)
    fetch('/api/proposicoes?entradaRetroativa=true&status=APRESENTADA&limit=500')
      .then((r) => {
        if (!r.ok) throw new Error('http ' + r.status)
        return r.json()
      })
      .then((d) => setLista(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {
        setErro(true)
        toast.error('Falha ao carregar proposições')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const atual = lista[idx]
  const pdfUrl = useMemo(() => {
    if (!atual) return null
    const docs = Array.isArray(atual.documentos) ? atual.documentos : []
    const local = docs.find((d) => d?.url?.startsWith('/uploads/'))
    return local?.url ?? docs[0]?.url ?? atual.urlDocumento ?? null
  }, [atual])

  const avancar = useCallback(() => setIdx((i) => i + 1), [])

  const definirStatus = useCallback(
    async (status: string) => {
      if (!atual) return
      setSaving(true)
      try {
        const res = await fetch(`/api/proposicoes/${atual.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) throw new Error()
        setRevisados((n) => n + 1)
        toast.success(`${TIPO_LABEL[atual.tipo] ?? atual.tipo} ${atual.numero}/${atual.ano} → ${status}`)
        avancar()
      } catch {
        toast.error('Erro ao salvar — tente novamente')
      } finally {
        setSaving(false)
      }
    },
    [atual, avancar]
  )

  // Atalhos de teclado: A=aprovar, R=rejeitar, X=arquivar, Espaço/S=pular
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (saving || !atual) return
      const k = e.key.toLowerCase()
      if (k === 'a') definirStatus('APROVADA')
      else if (k === 'r') definirStatus('REJEITADA')
      else if (k === 'x') definirStatus('ARQUIVADA')
      else if (k === 's' || e.key === ' ') { e.preventDefault(); avancar() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saving, atual, definirStatus, avancar])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando proposições…
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted-foreground">Não foi possível carregar as proposições.</p>
        <Button onClick={carregar} variant="outline">Tentar novamente</Button>
      </div>
    )
  }

  const restantes = lista.length - idx
  const concluido = idx >= lista.length

  return (
    <div className="mx-auto max-w-7xl p-4">
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/admin/proposicoes" className="mb-1 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Voltar para Proposições
          </Link>
          <h1 className="text-xl font-bold">Revisão de Aprovação — Proposições Históricas</h1>
          <p className="text-sm text-muted-foreground">
            Classifique manualmente as proposições sem carimbo de aprovação legível.
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{revisados} revisadas nesta sessão</div>
          <div className="text-muted-foreground">{restantes} restantes de {lista.length}</div>
        </div>
      </div>

      {concluido ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-lg border bg-muted/30 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <h2 className="text-lg font-semibold">Tudo revisado!</h2>
          <p className="text-muted-foreground">Você classificou {revisados} proposições.</p>
          <Link href="/admin/proposicoes"><Button>Ir para Proposições</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* Visualizador do PDF */}
          <div className="rounded-lg border bg-card">
            {pdfUrl ? (
              <iframe src={pdfUrl} title="Documento" className="h-[72vh] w-full rounded-lg" />
            ) : (
              <div className="flex h-[72vh] flex-col items-center justify-center text-muted-foreground">
                <FileText className="mb-2 h-10 w-10" />
                Sem documento anexo para esta proposição.
              </div>
            )}
          </div>

          {/* Painel de decisão */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">{TIPO_LABEL[atual.tipo] ?? atual.tipo}</Badge>
                <span className="font-mono text-sm">{atual.numero}/{atual.ano}</span>
              </div>
              <h2 className="text-base font-semibold leading-snug">{atual.titulo}</h2>
              {atual.ementa && atual.ementa !== atual.titulo && (
                <p className="mt-2 text-sm text-muted-foreground">{atual.ementa}</p>
              )}
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                   className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir PDF em nova aba
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => definirStatus('APROVADA')} disabled={saving}
                className="justify-start bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar <span className="ml-auto opacity-70">[A]</span>
              </Button>
              <Button onClick={() => definirStatus('REJEITADA')} disabled={saving} variant="destructive"
                className="justify-start">
                <XCircle className="mr-2 h-4 w-4" /> Rejeitar <span className="ml-auto opacity-70">[R]</span>
              </Button>
              <Button onClick={() => definirStatus('ARQUIVADA')} disabled={saving} variant="outline"
                className="justify-start">
                <Archive className="mr-2 h-4 w-4" /> Arquivar <span className="ml-auto opacity-70">[X]</span>
              </Button>
              <Button onClick={avancar} disabled={saving} variant="ghost"
                className="justify-start text-muted-foreground">
                <SkipForward className="mr-2 h-4 w-4" /> Pular <span className="ml-auto opacity-70">[S / Espaço]</span>
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Item {idx + 1} de {lista.length} · atalhos: A / R / X / S
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
