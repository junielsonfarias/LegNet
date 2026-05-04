'use client'

import { useEffect, useState, useCallback } from 'react'
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
  ShieldAlert
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

const CORES_NIVEL: Record<ConformidadeResponse['nivel'], string> = {
  DIAMANTE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  OURO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  PRATA: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  BRONZE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
}

export default function ConformidadePntpPage() {
  const [dados, setDados] = useState<ConformidadeResponse | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch('/api/admin/conformidade-pntp', { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const json = await r.json()
      setDados(json.data || json)
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
