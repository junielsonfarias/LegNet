'use client'

/**
 * Central de Revisão da Migração.
 * Lista o material que a migração automática não conseguiu identificar/preencher
 * e permite ao revisor completar manualmente — preenchendo os CAMPOS REAIS
 * (autor, resultado, votos) + uma observação. Nada se perde.
 */
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Save, FileText, UserPlus, CheckCircle2, HelpCircle, Vote } from 'lucide-react'

type Categoria = 'sem-autor' | 'sem-resultado' | 'votacao-nominal' | 'nao-identificados'
interface Parlamentar { id: string; nome: string; ativo: boolean }
interface PropItem {
  id: string; tipo: string; numero: string; ano: number; titulo: string; ementa: string
  autorId: string | null; resultado: string | null; documentos: { nome: string; url: string }[] | null
  revisaoObservacao: string | null; revisadoEm: string | null
}
interface NominalItem { documentoId: string; documentoTitulo: string; arquivo: string | null; proposicao: { id: string; numero: string; ano: number; titulo: string }; votosRegistrados: number }
interface PubItem { id: string; tipo: string; titulo: string; arquivo: string | null; revisaoObservacao: string | null; revisadoEm: string | null }

const RESULTADOS = ['APROVADA', 'REJEITADA', 'EMPATE']
const VOTOS = ['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE']

function pdfUrl(docs: PropItem['documentos']): string | null {
  const d = Array.isArray(docs) ? docs.find((x) => x?.url) : null
  return d?.url || null
}

export default function RevisaoMigracaoPage() {
  const [tab, setTab] = useState<Categoria>('sem-autor')
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [contadores, setContadores] = useState<Record<string, number>>({})
  const [items, setItems] = useState<(PropItem | NominalItem | PubItem)[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/parlamentares?limit=100')
      .then((r) => r.json())
      .then((j) => setParlamentares((j.data || []).map((p: any) => ({ id: p.id, nome: p.nome, ativo: p.ativo }))))
      .catch(() => {})
  }, [])

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/revisao-migracao?categoria=${tab}&page=${page}&q=${encodeURIComponent(q)}`)
      const j = await r.json()
      const d = j.data || j
      setItems(d.items || [])
      setTotal(d.total || 0)
      if (d.contadores) setContadores(d.contadores)
    } finally {
      setLoading(false)
    }
  }, [tab, page, q])

  useEffect(() => { carregar() }, [carregar])

  async function salvarProp(id: string, campos: { autorId?: string | null; resultado?: string | null; revisaoObservacao?: string | null }) {
    setSavingId(id)
    try {
      await fetch('/api/admin/revisao-migracao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'proposicao', id, ...campos }) })
      await carregar()
    } finally { setSavingId(null) }
  }
  async function salvarPub(id: string, revisaoObservacao: string) {
    setSavingId(id)
    try {
      await fetch('/api/admin/revisao-migracao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'publicacao', id, revisaoObservacao }) })
      await carregar()
    } finally { setSavingId(null) }
  }
  async function salvarVotos(proposicaoId: string, votos: { parlamentarId: string; voto: string }[]) {
    setSavingId(proposicaoId)
    try {
      await fetch('/api/admin/revisao-migracao/votacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposicaoId, votos }) })
      await carregar()
    } finally { setSavingId(null) }
  }

  const totalPaginas = Math.ceil(total / 20) || 1

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-camara-primary" /> Central de Revisão da Migração
        </h1>
        <p className="text-gray-500 mt-1">Complete manualmente o que a migração automática não identificou. Os campos preenchidos aparecem no portal público.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as Categoria); setPage(1) }}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sem-autor" className="gap-1.5"><UserPlus className="h-4 w-4" /> Sem autor {contadores['sem-autor'] != null && <Badge variant="secondary">{contadores['sem-autor']}</Badge>}</TabsTrigger>
          <TabsTrigger value="sem-resultado" className="gap-1.5"><Vote className="h-4 w-4" /> Sem resultado {contadores['sem-resultado'] != null && <Badge variant="secondary">{contadores['sem-resultado']}</Badge>}</TabsTrigger>
          <TabsTrigger value="votacao-nominal" className="gap-1.5"><FileText className="h-4 w-4" /> Votação nominal</TabsTrigger>
          <TabsTrigger value="nao-identificados" className="gap-1.5"><HelpCircle className="h-4 w-4" /> Não identificados {contadores['nao-identificados'] != null && <Badge variant="secondary">{contadores['nao-identificados']}</Badge>}</TabsTrigger>
        </TabsList>

        {tab !== 'votacao-nominal' && (
          <div className="mt-4">
            <Input placeholder="Buscar por título ou ementa..." value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} className="max-w-md" />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-camara-primary" /></div>
        ) : (
          <>
            <TabsContent value="sem-autor" className="space-y-3 mt-4">
              {(items as PropItem[]).map((p) => (
                <RevisaoPropCard key={p.id} p={p} parlamentares={parlamentares} saving={savingId === p.id} modo="autor" onSalvar={salvarProp} />
              ))}
            </TabsContent>
            <TabsContent value="sem-resultado" className="space-y-3 mt-4">
              {(items as PropItem[]).map((p) => (
                <RevisaoPropCard key={p.id} p={p} parlamentares={parlamentares} saving={savingId === p.id} modo="resultado" onSalvar={salvarProp} />
              ))}
            </TabsContent>
            <TabsContent value="votacao-nominal" className="space-y-3 mt-4">
              {(items as NominalItem[]).map((it) => (
                <VotacaoNominalCard key={it.documentoId} it={it} parlamentares={parlamentares} saving={savingId === it.proposicao.id} onSalvar={salvarVotos} />
              ))}
              {items.length === 0 && <p className="text-gray-500 py-8 text-center">Nenhum documento de votação nominal pendente.</p>}
            </TabsContent>
            <TabsContent value="nao-identificados" className="space-y-3 mt-4">
              {(items as PubItem[]).map((p) => (
                <NaoIdentificadoCard key={p.id} p={p} saving={savingId === p.id} onSalvar={salvarPub} />
              ))}
            </TabsContent>

            {tab !== 'votacao-nominal' && total > 20 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span className="text-sm text-gray-500">Página {page} de {totalPaginas} ({total} itens)</span>
                <Button variant="outline" size="sm" disabled={page >= totalPaginas} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}

function RevisaoPropCard({ p, parlamentares, saving, modo, onSalvar }: { p: PropItem; parlamentares: Parlamentar[]; saving: boolean; modo: 'autor' | 'resultado'; onSalvar: (id: string, c: any) => void }) {
  const [autorId, setAutorId] = useState(p.autorId || '')
  const [resultado, setResultado] = useState(p.resultado || '')
  const [obs, setObs] = useState(p.revisaoObservacao || '')
  const url = pdfUrl(p.documentos)
  return (
    <Card className={p.revisadoEm ? 'border-green-200' : ''}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{p.tipo.replace(/_/g, ' ')} {p.numero}/{p.ano}</Badge>
              {p.revisadoEm && <Badge className="bg-green-100 text-green-700">Revisado</Badge>}
            </div>
            <p className="text-sm text-gray-700 mt-1">{p.ementa?.slice(0, 220)}</p>
          </div>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-camara-primary hover:underline flex items-center gap-1"><FileText className="h-4 w-4" /> PDF</a>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {modo === 'autor' ? (
            <label className="text-sm">Autor
              <select value={autorId} onChange={(e) => setAutorId(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">— selecione o parlamentar —</option>
                {parlamentares.map((x) => <option key={x.id} value={x.id}>{x.nome}{x.ativo ? '' : ' (histórico)'}</option>)}
              </select>
            </label>
          ) : (
            <label className="text-sm">Resultado
              <select value={resultado} onChange={(e) => setResultado(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">— selecione —</option>
                {RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          )}
          <label className="text-sm">Observação da revisão
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Anote o que identificou no documento..." className="mt-1" />
          </label>
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={saving} onClick={() => onSalvar(p.id, modo === 'autor' ? { autorId: autorId || null, revisaoObservacao: obs } : { resultado: resultado || null, revisaoObservacao: obs })}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function VotacaoNominalCard({ it, parlamentares, saving, onSalvar }: { it: NominalItem; parlamentares: Parlamentar[]; saving: boolean; onSalvar: (propId: string, v: { parlamentarId: string; voto: string }[]) => void }) {
  const [votos, setVotos] = useState<Record<string, string>>({})
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>{it.proposicao.titulo || `${it.proposicao.numero}/${it.proposicao.ano}`}</span>
          <span className="flex items-center gap-2">
            {it.votosRegistrados > 0 && <Badge className="bg-green-100 text-green-700">{it.votosRegistrados} votos</Badge>}
            {it.arquivo && <a href={it.arquivo} target="_blank" rel="noopener noreferrer" className="text-sm text-camara-primary hover:underline">Ver documento</a>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-gray-500">Marque o voto de cada vereador conforme o documento de apuração (marca manuscrita).</p>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
          {[...parlamentares].sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome)).map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-2 text-sm border-b border-gray-100 py-1">
              <span className="truncate">{x.nome}{x.ativo ? '' : ' (hist.)'}</span>
              <select value={votos[x.id] || ''} onChange={(e) => setVotos((v) => ({ ...v, [x.id]: e.target.value }))} className="rounded border border-gray-300 px-2 py-1 text-xs">
                <option value="">—</option>
                {VOTOS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={saving} onClick={() => onSalvar(it.proposicao.id, Object.entries(votos).filter(([, v]) => v).map(([parlamentarId, voto]) => ({ parlamentarId, voto })))}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registrar votação
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NaoIdentificadoCard({ p, saving, onSalvar }: { p: PubItem; saving: boolean; onSalvar: (id: string, obs: string) => void }) {
  const [obs, setObs] = useState(p.revisaoObservacao || '')
  return (
    <Card className={p.revisadoEm ? 'border-green-200' : ''}>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{p.tipo?.replace(/_/g, ' ')}</Badge>
            <span className="text-sm font-medium text-gray-800">{p.titulo?.slice(0, 70)}</span>
          </div>
          {p.arquivo && <a href={p.arquivo} target="_blank" rel="noopener noreferrer" className="text-sm text-camara-primary hover:underline">Arquivo</a>}
        </div>
        <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} placeholder="Identifique este registro: do que se trata, categoria correta, etc." />
        <div className="flex justify-end">
          <Button size="sm" disabled={saving} onClick={() => onSalvar(p.id, obs)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar identificação
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
