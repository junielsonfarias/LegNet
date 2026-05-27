'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  ChevronRight,
  FileText,
  FileSignature,
  Gavel,
  ScrollText,
  Users,
  UserCheck,
  Mail,
  Megaphone,
  AlertTriangle,
  Bell,
  MessageSquare,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  FileCheck,
  FilePen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs'
import {
  ATOS_TIPOS_MAP,
  ATOS_TIPOS_ORDEM,
  GRUPO_LABEL,
  type AtoTipoConfig,
} from '@/lib/transparencia/atos-tipos'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

/**
 * Indice /transparencia/atos — hub que consolida os 17 tipos de atos
 * normativos e documentos administrativos atendendo o criterio PNTP 2.6.
 *
 * Substitui a antiga lista de 13 sub-itens "Documentos Administrativos"
 * no menu da home. Permite filtrar por nome/descricao e oferece cards
 * agrupados por categoria (normativo, sessao, comissao, proposicao).
 */

const ICONES_POR_SLUG: Record<string, LucideIcon> = {
  portarias: FileSignature,
  decretos: Gavel,
  resolucoes: ScrollText,
  'atos-mesa': Users,
  'atos-presidencia': UserCheck,
  oficios: Mail,
  editais: Megaphone,
  erratas: AlertTriangle,
  convocacoes: Bell,
  comunicados: MessageSquare,
  agendas: Calendar,
  atas: ClipboardCheck,
  pautas: ClipboardList,
  'atas-comissoes': ClipboardCheck,
  'pautas-comissoes': ListChecks,
  'pareceres-comissoes': FileCheck,
  emendas: FilePen,
}

const GRUPO_ORDEM: ReadonlyArray<AtoTipoConfig['grupo']> = [
  'normativo',
  'sessao',
  'comissao',
  'proposicao',
]

type TipoEntry = {
  slug: string
  config: AtoTipoConfig
  icon: LucideIcon
}

function normaliza(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export default function AtosIndexPage() {
  const breadcrumbs = useBreadcrumbs()
  const [busca, setBusca] = useState('')

  const todosTipos: TipoEntry[] = useMemo(
    () =>
      ATOS_TIPOS_ORDEM.map((slug) => ({
        slug,
        config: ATOS_TIPOS_MAP[slug],
        icon: ICONES_POR_SLUG[slug] ?? FileText,
      })),
    [],
  )

  const filtrados = useMemo(() => {
    const termo = normaliza(busca)
    if (!termo) return todosTipos
    return todosTipos.filter(({ config }) => {
      return (
        normaliza(config.titulo).includes(termo) ||
        normaliza(config.descricao).includes(termo)
      )
    })
  }, [busca, todosTipos])

  const grupos = useMemo(() => {
    return GRUPO_ORDEM.map((grupo) => ({
      grupo,
      titulo: GRUPO_LABEL[grupo],
      tipos: filtrados.filter((t) => t.config.grupo === grupo),
    })).filter((g) => g.tipos.length > 0)
  }, [filtrados])

  return (
    <TransparenciaPageWrapper slug="documentos-administrativos" nome="Documentos Administrativos">
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumb items={breadcrumbs} />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparência
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="h-7 w-7" style={{ color: 'var(--municipal-primary)' }} />
            Documentos Administrativos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
            Consulte os atos normativos e documentos oficiais da Câmara
            Municipal por tipo. Cada categoria abre uma página com busca por
            número, ano e palavra-chave (critério PNTP 2.6).
          </p>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar tipo (ex: portaria, ata, edital)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
              aria-label="Filtrar tipos de documento"
            />
          </div>
          {busca && (
            <p className="text-xs text-muted-foreground mt-2">
              {filtrados.length} {filtrados.length === 1 ? 'tipo' : 'tipos'}{' '}
              correspondendo a &ldquo;{busca}&rdquo;
            </p>
          )}
        </div>

        {/* Grupos */}
        {grupos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum tipo de documento corresponde à busca.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {grupos.map(({ grupo, titulo, tipos }) => (
              <section key={grupo} aria-labelledby={`grupo-${grupo}`}>
                <h2
                  id={`grupo-${grupo}`}
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3"
                >
                  {titulo}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tipos.map(({ slug, config, icon: Icon }) => (
                    <Link
                      key={slug}
                      href={`/transparencia/atos/${slug}`}
                      className="group bg-white rounded-lg border border-gray-200 hover:border-[var(--municipal-primary-light)] hover:shadow-md transition-all p-4 flex items-start gap-3"
                    >
                      <div
                        className="p-2 rounded-md flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: 'var(--municipal-primary-lighter)' }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: 'var(--municipal-primary)' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[var(--municipal-primary-dark)] mb-0.5">
                          {config.titulo}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {config.descricao}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Nota PNTP */}
        <Card className="mt-8 border-l-4 border-l-[var(--municipal-primary)]">
          <CardContent className="p-5">
            <h2 className="font-semibold mb-2 text-sm">Sobre esta seção</h2>
            <p className="text-sm text-gray-700">
              Esta página atende ao critério <strong>2.6</strong> da Matriz PNTP
              2026 (Atricon) — &ldquo;Divulga atos normativos próprios?&rdquo;.
              Cada categoria abre uma listagem com filtros por ano e palavra-chave,
              link para o documento oficial em PDF e dados estruturados via API
              em <Link href="/transparencia/dados-abertos" className="text-[var(--municipal-primary)] hover:underline">/transparencia/dados-abertos</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
    </TransparenciaPageWrapper>
  )
}
