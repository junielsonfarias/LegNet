/**
 * Transparency Section - Cards organizados por categorias PNTP
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Scale,
  DollarSign,
  Users,
  UserCheck,
  Database,
  ArrowRight,
  ShieldCheck,
  Award,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const transparencyCategories = [
  {
    icon: Scale,
    title: 'Legislativo',
    items: ['Votacoes nominais', 'Presencas em sessoes', 'Proposicoes'],
    href: '/transparencia/legislativo/votacoes-nominais',
    gradient: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    accentColor: 'bg-blue-400/20',
  },
  {
    icon: DollarSign,
    title: 'Financeiro',
    items: ['Receitas e despesas', 'Contratos', 'Licitacoes'],
    href: '/transparencia/receitas-despesas-convenios-folhas-licitacoes-contratos',
    gradient: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    accentColor: 'bg-emerald-400/20',
  },
  {
    icon: Users,
    title: 'Pessoal',
    items: ['Servidores', 'Folha de pagamento', 'Diarias'],
    href: '/transparencia/pessoal',
    gradient: 'from-violet-500 to-violet-600',
    lightBg: 'bg-violet-50',
    lightText: 'text-violet-700',
    accentColor: 'bg-violet-400/20',
  },
  {
    icon: UserCheck,
    title: 'Parlamentar',
    items: ['Relatorios', 'Presencas', 'Verbas'],
    href: '/transparencia/parlamentar',
    gradient: 'from-rose-500 to-rose-600',
    lightBg: 'bg-rose-50',
    lightText: 'text-rose-700',
    accentColor: 'bg-rose-400/20',
  },
  {
    icon: Database,
    title: 'Dados Abertos',
    items: ['APIs', 'Downloads', 'Formatos abertos'],
    href: '/transparencia/dados-abertos',
    gradient: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    accentColor: 'bg-amber-400/20',
  },
]

export function TransparencySection() {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-emerald-600 hidden sm:block" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Transparencia Publica
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">
              Portal da Transparencia
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Acesso a informacoes publicas do municipio
            </p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/transparencia">
              Portal completo <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {transparencyCategories.map((cat, index) => (
            <Link key={cat.href} href={cat.href} className={cn('group', index === transparencyCategories.length - 1 && 'hidden sm:block')}>
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 hover:border-gray-200 bg-white">
                {/* Top color bar */}
                <div className={cn('h-1.5 w-full bg-gradient-to-r', cat.gradient)} />

                <div className="p-3 sm:p-4 md:p-5 flex flex-col h-[calc(100%-6px)]">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3',
                    'bg-gradient-to-br shadow-sm',
                    cat.gradient
                  )}>
                    <cat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2 group-hover:text-camara-primary transition-colors leading-tight">
                    {cat.title}
                  </h3>

                  {/* Items */}
                  <ul className="space-y-1 mb-3 sm:mb-4 flex-1">
                    {cat.items.map((item) => (
                      <li key={item} className="text-[11px] sm:text-xs text-gray-500 flex items-start gap-1.5 leading-tight">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-[3px] bg-gradient-to-br', cat.gradient)} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className={cn(
                    'flex items-center gap-1 text-xs sm:text-sm font-semibold transition-all',
                    cat.lightText,
                    'group-hover:gap-2'
                  )}>
                    Acessar
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* PNTP Badge */}
        <div className="mt-6 md:mt-10 relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-teal-50">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjMDU5NjY5IiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-60" />
          <div className="relative flex items-center justify-between gap-3 py-3 md:py-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
                <Award className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-900">
                  Programa Nacional de Transparencia Publica
                </p>
                <p className="text-[11px] sm:text-xs text-emerald-600 mt-0.5">
                  Compromisso com a transparencia e o acesso a informacao
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-600 rounded-full px-4 py-2 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-100" />
              <span className="text-sm font-bold text-white whitespace-nowrap">Nivel Diamante</span>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-4 md:mt-6 text-center md:hidden">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/transparencia">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Portal da Transparencia
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default TransparencySection
