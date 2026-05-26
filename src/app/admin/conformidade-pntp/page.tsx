'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Award,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'

interface ItemConformidade {
  categoria: string
  item: string
  requisito: string
  prazo: string
  conforme: boolean
  regra?: string
  detalhes: string
}

interface ConformidadeResponse {
  nivel: 'DIAMANTE' | 'OURO' | 'PRATA' | 'BRONZE'
  percentual: number
  conformes: number
  totalItens: number
  itens: ItemConformidade[]
  dataVerificacao: string
}

type NivelMatriz =
  | 'DIAMANTE' | 'OURO' | 'PRATA' | 'ELEVADO'
  | 'INTERMEDIARIO' | 'BASICO' | 'INICIAL' | 'INEXISTENTE'

interface MatrizDimensao {
  dimensao: number
  nome: string
  peso: number
  totalCriterios: number
  pontuacao: number
  criterios: Array<{
    id: string
    titulo: string
    classificacao: 'ESSENCIAL' | 'OBRIGATORIA' | 'RECOMENDADA'
    pontuacao: number
    detalhes?: string
  }>
}

interface MatrizResponse {
  pontuacao: number
  nivel: NivelMatriz
  essenciaisFaltantes: string[]
  totalCriterios: number
  criteriosConformes: number
  dimensoes: MatrizDimensao[]
  dataVerificacao: string
}

const CORES_NIVEL_MATRIZ: Record<NivelMatriz, string> = {
  DIAMANTE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  OURO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  PRATA: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  ELEVADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  INTERMEDIARIO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  BASICO: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  INICIAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  INEXISTENTE: 'bg-gray-100 text-gray-800',
}

const CORES_NIVEL: Record<ConformidadeResponse['nivel'], string> = {
  DIAMANTE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  OURO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  PRATA: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  BRONZE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
}

export default function ConformidadePntpPage() {
  const [dados, setDados] = useState<ConformidadeResponse | null>(null)
  const [matriz, setMatriz] = useState<MatrizResponse | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [dimensaoAberta, setDimensaoAberta] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/admin/conformidade-pntp', { cache: 'no-store' }),
        fetch('/api/admin/conformidade-pntp/matriz', { cache: 'no-store' }),
      ])
      if (!r1.ok) throw new Error(`HTTP ${r1.status}`)
      const json = await r1.json()
      setDados(json.data || json)
      if (r2.ok) {
        const j2 = await r2.json()
        setMatriz(j2.data || j2)
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const categorias = dados
    ? Array.from(new Set(dados.itens.map((i) => i.categoria)))
    : []
  const pendencias = dados?.itens.filter((i) => !i.conforme) || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Conformidade PNTP 2026
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Programa Nacional de Transparência Pública — verificação automática diária
          </p>
        </div>
        <Button onClick={carregar} variant="outline" size="sm" disabled={carregando}>
          {carregando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {erro && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Erro ao carregar: {erro}</p>
          </CardContent>
        </Card>
      )}

      {carregando && !dados && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* === Matriz Oficial PNTP 2026 (83 criterios) === */}
      {matriz && (
        <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-700" />
                  Matriz Oficial PNTP 2026 (Atricon) — 83 critérios
                </CardTitle>
                <CardDescription>
                  Avaliação ponderada por dimensão × classificação × itens de verificação
                </CardDescription>
              </div>
              <Badge className={CORES_NIVEL_MATRIZ[matriz.nivel]} variant="secondary">
                <Award className="h-3.5 w-3.5 mr-1" />
                Nivel {matriz.nivel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Pontuação</p>
                <p className="text-3xl font-bold text-cyan-700">{matriz.pontuacao}%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Critérios conformes</p>
                <p className="text-3xl font-bold">{matriz.criteriosConformes}/{matriz.totalCriterios}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Dimensões</p>
                <p className="text-3xl font-bold">{matriz.dimensoes.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Essenciais faltantes</p>
                <p className={`text-3xl font-bold ${matriz.essenciaisFaltantes.length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {matriz.essenciaisFaltantes.length}
                </p>
              </div>
            </div>

            {matriz.essenciaisFaltantes.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
                <strong className="text-red-700">Atenção:</strong>{' '}
                {matriz.essenciaisFaltantes.length} critério(s) essencial(is) abaixo de 100% —
                impede o selo Diamante/Ouro/Prata mesmo com pontuação ≥75%. IDs: {matriz.essenciaisFaltantes.join(', ')}
              </div>
            )}

            <div className="space-y-1">
              {matriz.dimensoes.map((d) => (
                <button
                  key={d.dimensao}
                  type="button"
                  onClick={() =>
                    setDimensaoAberta(dimensaoAberta === d.dimensao ? null : d.dimensao)
                  }
                  className="w-full rounded-md border bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-xs text-muted-foreground w-8 text-center font-mono">
                      {d.dimensao}
                    </span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{d.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.totalCriterios} critérios &middot; peso {d.peso}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full ${d.pontuacao >= 95 ? 'bg-cyan-500' : d.pontuacao >= 75 ? 'bg-green-500' : d.pontuacao >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${d.pontuacao}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{d.pontuacao}%</span>
                    </div>
                    {dimensaoAberta === d.dimensao ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {dimensaoAberta === d.dimensao && (
                    <div className="border-t bg-gray-50 p-3 space-y-1.5">
                      {d.criterios.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-3 text-xs bg-white rounded p-2 border"
                        >
                          <span className="font-mono font-medium w-12 flex-shrink-0">{c.id}</span>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-gray-800 line-clamp-1">{c.titulo}</p>
                            {c.detalhes && (
                              <p className="text-muted-foreground line-clamp-2 mt-0.5">{c.detalhes}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {c.classificacao}
                          </Badge>
                          <span className={`text-xs font-medium w-10 text-right ${c.pontuacao >= 75 ? 'text-green-700' : c.pontuacao >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                            {c.pontuacao}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground border-t pt-3">
              Avaliação automática baseada nos sinais do banco. Para auditoria oficial Atricon,
              cada critério &ldquo;Sim&rdquo; deve ser acompanhado de evidência de URL pública.
              Última verificação: {new Date(matriz.dataVerificacao).toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      )}

      {dados && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Nível de Conformidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <Badge className={CORES_NIVEL[dados.nivel]} variant="secondary">
                    {dados.nivel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Última verificação: {new Date(dados.dataVerificacao).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pontuação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dados.percentual}%</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {dados.conformes} de {dados.totalItens} itens conformes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Itens Conformes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6" />
                  {dados.conformes}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pendências</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6" />
                  {pendencias.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {pendencias.length > 0 && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Pendências ({pendencias.length})
                </CardTitle>
                <CardDescription>Itens que exigem ação para conformidade PNTP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendencias.map((p, i) => (
                  <div
                    key={i}
                    className="border rounded-md p-3 bg-destructive/5 border-destructive/20"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{p.item}</span>
                          {p.regra && (
                            <Badge variant="outline" className="text-xs">
                              {p.regra}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {p.categoria}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{p.requisito}</p>
                        <p className="text-sm mt-2">{p.detalhes}</p>
                      </div>
                      <Badge variant="destructive">Prazo: {p.prazo}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {categorias.map((cat) => {
            const itensCat = dados.itens.filter((i) => i.categoria === cat)
            return (
              <Card key={cat}>
                <CardHeader>
                  <CardTitle className="text-lg">{cat}</CardTitle>
                  <CardDescription>
                    {itensCat.filter((i) => i.conforme).length} de {itensCat.length} itens conformes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {itensCat.map((i, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-md border bg-card"
                    >
                      {i.conforme ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{i.item}</span>
                          {i.regra && (
                            <Badge variant="outline" className="text-xs">
                              {i.regra}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {i.prazo}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{i.requisito}</p>
                        <p className="text-sm mt-1">{i.detalhes}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
