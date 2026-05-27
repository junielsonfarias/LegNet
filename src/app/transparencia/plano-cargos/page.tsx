'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  ArrowLeft,
  Loader2,
  FileText,
  Calendar,
  Scale,
  Users,
} from 'lucide-react'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('transparencia/plano-cargos')

interface Plano {
  id: string
  nome: string
  lei: string | null
  ano: number
  descricao: string | null
  ativo: boolean
  _count?: { cargos: number }
}

export default function PlanoCargosPage() {
  return (
    <TransparenciaPageWrapper slug="plano-cargos" nome="Plano de Cargos">
      <PlanoCargosContent />
    </TransparenciaPageWrapper>
  )
}

function PlanoCargosContent() {
  const [data, setData] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAno, setFiltroAno] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const r = await fetch('/api/plano-cargos?limit=200')
        const j = await r.json()
        setData(j?.data || [])
      } catch (err) {
        log.error('Erro ao buscar planos de cargos', err)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const anos = useMemo(
    () => Array.from(new Set(data.map((p) => p.ano))).sort((a, b) => b - a),
    [data],
  )

  const filtrados = useMemo(() => {
    if (filtroAno === 'all') return data
    return data.filter((p) => p.ano === Number(filtroAno))
  }, [data, filtroAno])

  const ativos = filtrados.filter((p) => p.ativo)
  const inativos = filtrados.filter((p) => !p.ativo)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Plano de Cargos, Carreiras e Salarios
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Documentos legais (PCCS) que organizam a estrutura de cargos da Camara
            Municipal, definindo nomenclatura, requisitos, atribuicoes, vencimentos
            base e progressao funcional.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhum Plano de Cargos cadastrado ate o momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filtro por ano */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filtrar por ano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFiltroAno('all')}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      filtroAno === 'all'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    Todos ({data.length})
                  </button>
                  {anos.map((ano) => {
                    const count = data.filter((p) => p.ano === ano).length
                    return (
                      <button
                        key={ano}
                        onClick={() => setFiltroAno(String(ano))}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                          filtroAno === String(ano)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {ano} ({count})
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Planos ativos */}
            {ativos.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Planos Vigentes
                  <Badge variant="default">{ativos.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ativos.map((p) => (
                    <PlanoCard key={p.id} plano={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Planos revogados/inativos (serie historica) */}
            {inativos.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-5 w-5" />
                  Planos Revogados / Historico
                  <Badge variant="secondary">{inativos.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inativos.map((p) => (
                    <PlanoCard key={p.id} plano={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PlanoCard({ plano }: { plano: Plano }) {
  return (
    <Card className={plano.ativo ? '' : 'opacity-75'}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-tight flex-1">
            {plano.nome}
          </CardTitle>
          <Badge variant={plano.ativo ? 'default' : 'secondary'} className="flex-shrink-0">
            {plano.ativo ? 'Vigente' : 'Revogado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Ano: {plano.ano}</span>
        </div>
        {plano.lei && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scale className="h-4 w-4" />
            <span>Lei: {plano.lei}</span>
          </div>
        )}
        {plano._count && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <Link
              href="/transparencia/cargos"
              className="hover:text-primary underline-offset-2 hover:underline"
            >
              {plano._count.cargos} cargo(s) vinculado(s)
            </Link>
          </div>
        )}
        {plano.descricao && (
          <p className="text-muted-foreground pt-2 border-t mt-2 whitespace-pre-wrap">
            {plano.descricao}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
