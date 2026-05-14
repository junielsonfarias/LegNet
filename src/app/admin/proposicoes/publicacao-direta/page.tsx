'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, FileCheck, Loader2, Plus, Trash2, Upload, AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

/**
 * RN-168 — Publicacao Direta de Proposicoes (modo simplificado).
 *
 * Diferente do /admin/proposicoes (modo Completo), aqui o operador adiciona
 * uma proposicao JA com o resultado final (Aprovada/Rejeitada). Nao dispara
 * tramitacao automatica. Votos individuais sao OPCIONAIS.
 */

interface TipoProposicaoOpt {
  id: string
  codigo: string
  nome: string
  sigla: string
}

interface ParlamentarOpt {
  id: string
  nome: string
  apelido?: string | null
  partido?: string | null
  ativo: boolean
}

interface SessaoOpt {
  id: string
  numero: number
  tipo: string
  data: string
}

interface DocumentoForm {
  nome: string
  url: string
}

type VotoTipo = 'SIM' | 'NAO' | 'ABSTENCAO' | 'AUSENTE'

export default function PublicacaoDiretaPage() {
  const router = useRouter()

  // Form state
  const [tipo, setTipo] = useState('')
  const [numero, setNumero] = useState('')
  const [ano, setAno] = useState<number>(new Date().getFullYear())
  const [titulo, setTitulo] = useState('')
  const [ementa, setEmenta] = useState('')
  const [autorId, setAutorId] = useState('')
  const [dataApresentacao, setDataApresentacao] = useState('')
  const [dataVotacao, setDataVotacao] = useState('')
  const [resultado, setResultado] = useState<'APROVADA' | 'REJEITADA'>('APROVADA')
  const [vincularSessao, setVincularSessao] = useState(false)
  const [sessaoVotacaoId, setSessaoVotacaoId] = useState('')
  const [sessaoVotacaoTexto, setSessaoVotacaoTexto] = useState('')
  const [motivoRetroativo, setMotivoRetroativo] = useState('')
  const [documentos, setDocumentos] = useState<DocumentoForm[]>([])
  const [registrarVotos, setRegistrarVotos] = useState(false)
  const [votos, setVotos] = useState<Record<string, VotoTipo>>({})
  const [totaisManuais, setTotaisManuais] = useState({ sim: 0, nao: 0, abstencao: 0, ausente: 0 })

  // Reference data
  const [tipos, setTipos] = useState<TipoProposicaoOpt[]>([])
  const [parlamentares, setParlamentares] = useState<ParlamentarOpt[]>([])
  const [sessoes, setSessoes] = useState<SessaoOpt[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [novoDocUrl, setNovoDocUrl] = useState('')
  const [novoDocNome, setNovoDocNome] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Load reference data
  useEffect(() => {
    void (async () => {
      try {
        const [tiposRes, parlsRes, sessoesRes] = await Promise.all([
          fetch('/api/tipos-proposicao?ativo=true'),
          fetch('/api/parlamentares?ativo=true&limit=100'),
          fetch('/api/sessoes?status=CONCLUIDA&limit=50'),
        ])
        const [tiposJson, parlsJson, sessoesJson] = await Promise.all([
          tiposRes.json(),
          parlsRes.json(),
          sessoesRes.json(),
        ])
        setTipos(Array.isArray(tiposJson?.data) ? tiposJson.data : tiposJson)
        setParlamentares(Array.isArray(parlsJson?.data) ? parlsJson.data : parlsJson)
        setSessoes(Array.isArray(sessoesJson?.data) ? sessoesJson.data : sessoesJson)
      } catch (err) {
        toast.error('Erro ao carregar dados de referencia')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Totais derivados quando registrar individuais esta ligado
  const totaisDerivados = useMemo(() => {
    if (!registrarVotos) return totaisManuais
    const counts = { sim: 0, nao: 0, abstencao: 0, ausente: 0 }
    Object.values(votos).forEach((v) => {
      if (v === 'SIM') counts.sim++
      else if (v === 'NAO') counts.nao++
      else if (v === 'ABSTENCAO') counts.abstencao++
      else if (v === 'AUSENTE') counts.ausente++
    })
    return counts
  }, [registrarVotos, votos, totaisManuais])

  // Aviso quando resultado nao bate com votos
  const resultadoNaoBate = useMemo(() => {
    if (!registrarVotos && totaisManuais.sim === 0 && totaisManuais.nao === 0) return false
    const sim = totaisDerivados.sim
    const nao = totaisDerivados.nao
    if (sim === 0 && nao === 0) return false
    if (resultado === 'APROVADA' && nao > sim) return true
    if (resultado === 'REJEITADA' && sim > nao) return true
    return false
  }, [resultado, totaisDerivados, registrarVotos, totaisManuais])

  // Inicializa todos os parlamentares ativos como AUSENTE quando toggle liga
  useEffect(() => {
    if (registrarVotos && Object.keys(votos).length === 0 && parlamentares.length > 0) {
      const initial: Record<string, VotoTipo> = {}
      parlamentares.filter((p) => p.ativo).forEach((p) => {
        initial[p.id] = 'AUSENTE'
      })
      setVotos(initial)
    }
  }, [registrarVotos, parlamentares, votos])

  // Upload de documento
  async function handleUpload(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'proposicoes-publicacao-direta')
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await r.json()
    if (j.success) {
      setDocumentos((prev) => [...prev, { nome: file.name, url: j.url }])
      toast.success(`Documento ${file.name} adicionado`)
    } else {
      toast.error(j.error || 'Erro no upload')
    }
  }

  function handleAddLink() {
    if (!novoDocUrl.trim() || !novoDocNome.trim()) {
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
    setNovoDocUrl('')
    setNovoDocNome('')
  }

  function handleRemoveDoc(idx: number) {
    setDocumentos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validacoes client-side
    if (!tipo || !numero.trim() || !titulo.trim() || !ementa.trim() || !autorId) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    if (!dataApresentacao || !dataVotacao) {
      toast.error('Datas obrigatorias')
      return
    }
    if (motivoRetroativo.trim().length < 5) {
      toast.error('Motivo retroativo eh obrigatorio (min 5 caracteres)')
      return
    }
    if (vincularSessao && !sessaoVotacaoId) {
      toast.error('Selecione a sessao ou desligue o toggle')
      return
    }

    const totais = totaisDerivados

    let votosIndividuais: { parlamentarId: string; voto: VotoTipo }[] | undefined
    if (registrarVotos) {
      votosIndividuais = Object.entries(votos).map(([parlamentarId, voto]) => ({ parlamentarId, voto }))
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/proposicoes/publicacao-direta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          numero: numero.trim(),
          ano,
          titulo: titulo.trim(),
          ementa: ementa.trim(),
          autorId,
          dataApresentacao,
          dataVotacao,
          resultado,
          documentos: documentos.length > 0 ? documentos : undefined,
          sessaoVotacaoId: vincularSessao ? sessaoVotacaoId : undefined,
          sessaoVotacaoTexto: !vincularSessao ? sessaoVotacaoTexto || undefined : undefined,
          motivoRetroativo: motivoRetroativo.trim(),
          totais,
          votosIndividuais,
        }),
      })
      const j = await r.json()
      if (j.success) {
        toast.success('Proposicao publicada com sucesso!')
        const slug = j.data?.slug || j.data?.id
        router.push(slug ? `/legislativo/proposicoes/${slug}` : '/admin/proposicoes')
      } else {
        toast.error(j.error || 'Erro ao publicar')
      }
    } catch {
      toast.error('Erro de conexao')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  const parlamentaresAtivos = parlamentares.filter((p) => p.ativo)

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/proposicoes"
          className="inline-flex items-center text-sm text-gray-600 hover:text-camara-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Proposicoes
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck className="h-7 w-7 text-camara-primary" />
          Publicacao Direta de Proposicao
        </h1>
        <p className="text-gray-600 mt-1">
          Modo simplificado: registre uma proposicao ja com o resultado final, sem passar pelo
          fluxo de tramitacao. Use quando importar dados historicos ou para casos em que a
          tramitacao foi feita fora do sistema.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Secao 1 — Identificacao */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Identificacao</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.codigo} value={t.codigo}>
                      {t.sigla} - {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Numero *</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="0001" required />
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
              <Label>Autor *</Label>
              <Select value={autorId} onValueChange={setAutorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Parlamentar" />
                </SelectTrigger>
                <SelectContent>
                  {parlamentaresAtivos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.apelido || p.nome} {p.partido ? `(${p.partido})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Secao 2 — Conteudo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Conteudo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Titulo *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Ementa *</Label>
              <Textarea value={ementa} onChange={(e) => setEmenta(e.target.value)} rows={4} required />
            </div>
          </CardContent>
        </Card>

        {/* Secao 3 — Votacao */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Votacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de apresentacao *</Label>
                <Input type="date" value={dataApresentacao} onChange={(e) => setDataApresentacao(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Data da votacao *</Label>
                <Input type="date" value={dataVotacao} onChange={(e) => setDataVotacao(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Resultado *</Label>
                <RadioGroup
                  value={resultado}
                  onValueChange={(v) => setResultado(v as 'APROVADA' | 'REJEITADA')}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-green-50">
                    <RadioGroupItem value="APROVADA" /> Aprovada
                  </Label>
                  <Label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-red-50">
                    <RadioGroupItem value="REJEITADA" /> Rejeitada
                  </Label>
                </RadioGroup>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="vincSessao"
                checked={vincularSessao}
                onCheckedChange={(c) => setVincularSessao(c === true)}
              />
              <Label htmlFor="vincSessao" className="cursor-pointer">
                Vincular a uma sessao existente cadastrada
              </Label>
            </div>

            {vincularSessao ? (
              <div className="space-y-2">
                <Label>Sessao *</Label>
                <Select value={sessaoVotacaoId} onValueChange={setSessaoVotacaoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sessao" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessoes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.numero}ª {s.tipo} - {new Date(s.data).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Identificacao da sessao (texto livre — opcional)</Label>
                <Input
                  value={sessaoVotacaoTexto}
                  onChange={(e) => setSessaoVotacaoTexto(e.target.value)}
                  placeholder="Ex: 5ª Sessao Ordinaria - 15/02/2024"
                />
                <p className="text-xs text-gray-500">
                  Se a sessao nao esta cadastrada, descreva-a aqui — o texto ficara no historico
                  como referencia, sem criar sessao no banco.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo retroativo *</Label>
              <Textarea
                value={motivoRetroativo}
                onChange={(e) => setMotivoRetroativo(e.target.value)}
                rows={2}
                placeholder="Ex: Digitalizacao de proposicao da legislatura anterior"
                required
              />
              <p className="text-xs text-gray-500">
                Obrigatorio para auditoria. Explica por que a proposicao esta sendo inserida fora
                do fluxo normal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Secao 4 — Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Documentos ({documentos.length})</CardTitle>
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
                  placeholder="Nome do documento"
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
              <p className="text-sm text-gray-500 italic">Nenhum documento adicionado.</p>
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

        {/* Secao 5 — Votos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. Votos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="regVotos"
                checked={registrarVotos}
                onCheckedChange={(c) => setRegistrarVotos(c === true)}
              />
              <Label htmlFor="regVotos" className="cursor-pointer">
                Registrar como cada vereador votou (nominal)
              </Label>
            </div>

            {registrarVotos ? (
              <div className="space-y-1 max-h-96 overflow-y-auto border rounded p-2">
                {parlamentaresAtivos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-1 hover:bg-gray-50 rounded">
                    <span className="text-sm flex-1 truncate">
                      {p.apelido || p.nome} {p.partido ? `(${p.partido})` : ''}
                    </span>
                    <RadioGroup
                      value={votos[p.id] || 'AUSENTE'}
                      onValueChange={(v) => setVotos({ ...votos, [p.id]: v as VotoTipo })}
                      className="flex gap-3"
                    >
                      <Label className="flex items-center gap-1 text-xs cursor-pointer">
                        <RadioGroupItem value="SIM" /> Sim
                      </Label>
                      <Label className="flex items-center gap-1 text-xs cursor-pointer">
                        <RadioGroupItem value="NAO" /> Nao
                      </Label>
                      <Label className="flex items-center gap-1 text-xs cursor-pointer">
                        <RadioGroupItem value="ABSTENCAO" /> Abst
                      </Label>
                      <Label className="flex items-center gap-1 text-xs cursor-pointer">
                        <RadioGroupItem value="AUSENTE" /> Aus
                      </Label>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Sim</Label>
                  <Input
                    type="number"
                    min={0}
                    value={totaisManuais.sim}
                    onChange={(e) => setTotaisManuais({ ...totaisManuais, sim: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nao</Label>
                  <Input
                    type="number"
                    min={0}
                    value={totaisManuais.nao}
                    onChange={(e) => setTotaisManuais({ ...totaisManuais, nao: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Abstencao</Label>
                  <Input
                    type="number"
                    min={0}
                    value={totaisManuais.abstencao}
                    onChange={(e) => setTotaisManuais({ ...totaisManuais, abstencao: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ausente</Label>
                  <Input
                    type="number"
                    min={0}
                    value={totaisManuais.ausente}
                    onChange={(e) => setTotaisManuais({ ...totaisManuais, ausente: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded text-sm">
              <span className="font-medium">Totais:</span>
              <span className="text-green-700">Sim: {totaisDerivados.sim}</span>
              <span className="text-red-700">Nao: {totaisDerivados.nao}</span>
              <span className="text-yellow-700">Abst: {totaisDerivados.abstencao}</span>
              <span className="text-gray-500">Aus: {totaisDerivados.ausente}</span>
            </div>

            {resultadoNaoBate && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  O resultado declarado ({resultado}) nao parece compativel com os votos
                  ({totaisDerivados.sim} Sim x {totaisDerivados.nao} Nao). Confira antes de
                  publicar.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/proposicoes">Cancelar</Link>
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
                Publicar Proposicao
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
