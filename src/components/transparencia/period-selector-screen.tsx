'use client'

import Link from 'next/link'
import { Calendar, ExternalLink, ChevronRight } from 'lucide-react'
import type { PeriodoTransparencia } from '@/lib/services/transparencia-redirect-service'

interface Props {
  titulo?: string
  descricao?: string
  categoriaNome: string
  periodos: PeriodoTransparencia[]
}

/**
 * Tela de selecao de periodo. Exibida quando uma categoria de transparencia
 * tem multiplos periodos cadastrados (ex: Despesas ate 2021 / ate 2023 / 2024+).
 * Cada card representa um periodo e pode ser interno (rota local) ou externo.
 */
export function PeriodSelectorScreen({ titulo, descricao, categoriaNome, periodos }: Props) {
  const ativos = periodos
    .filter(p => p.ativo)
    .sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <Calendar className="h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {titulo || `Selecione o periodo - ${categoriaNome}`}
          </h1>
          {descricao && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{descricao}</p>
          )}
          {!descricao && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Os dados desta categoria estao organizados por periodo. Selecione abaixo para visualizar.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ativos.map(periodo => (
            <PeriodoCard key={periodo.id} periodo={periodo} />
          ))}
        </div>

        {ativos.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            Nenhum periodo configurado.
          </div>
        )}
      </div>
    </div>
  )
}

function PeriodoCard({ periodo }: { periodo: PeriodoTransparencia }) {
  const isExterno = Boolean(periodo.url) && !periodo.hrefInterno
  const Icon = isExterno ? ExternalLink : ChevronRight

  const cardClass =
    'group flex flex-col gap-3 p-5 bg-white rounded-xl border-2 border-gray-100 hover:border-[var(--municipal-primary-light)] shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5'

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--municipal-primary-lighter)' }}>
          <Calendar className="h-5 w-5" style={{ color: 'var(--municipal-primary)' }} />
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isExterno
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isExterno ? 'Externo' : 'Interno'}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-base text-gray-900 group-hover:text-[var(--municipal-primary-dark)]">
          {periodo.label}
        </h3>
        {periodo.ano && (
          <p className="text-xs text-gray-500 mt-1">Ano: {periodo.ano}</p>
        )}
      </div>
      <div className="flex items-center justify-end text-sm text-gray-400 group-hover:text-gray-600">
        <span className="mr-1">Acessar</span>
        <Icon className="h-4 w-4" />
      </div>
    </>
  )

  if (isExterno && periodo.url) {
    return (
      <a href={periodo.url} target="_blank" rel="noopener noreferrer" className={cardClass}>
        {inner}
      </a>
    )
  }

  const href = periodo.hrefInterno || '#'
  return (
    <Link href={href} className={cardClass}>
      {inner}
    </Link>
  )
}
