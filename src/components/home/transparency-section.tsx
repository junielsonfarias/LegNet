/**
 * Transparency Section - Cards organizados por categorias PNTP
 */

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
} from 'lucide-react'

const transparencyCategories = [
  {
    icon: Scale,
    title: 'Legislativo',
    items: ['Votacoes nominais', 'Presencas em sessoes', 'Proposicoes'],
    href: '/transparencia/legislativo/votacoes-nominais',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderHover: 'hover:border-blue-200',
  },
  {
    icon: DollarSign,
    title: 'Financeiro',
    items: ['Receitas e despesas', 'Contratos', 'Licitacoes'],
    href: '/transparencia/receitas-despesas-convenios-folhas-licitacoes-contratos',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderHover: 'hover:border-emerald-200',
  },
  {
    icon: Users,
    title: 'Pessoal',
    items: ['Servidores', 'Folha de pagamento', 'Diarias'],
    href: '/transparencia/pessoal',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderHover: 'hover:border-violet-200',
  },
  {
    icon: UserCheck,
    title: 'Parlamentar',
    items: ['Relatorios', 'Presencas', 'Verbas'],
    href: '/transparencia/parlamentar',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderHover: 'hover:border-rose-200',
  },
  {
    icon: Database,
    title: 'Dados Abertos',
    items: ['APIs', 'Downloads', 'Formatos abertos'],
    href: '/transparencia/dados-abertos',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderHover: 'hover:border-amber-200',
  },
]

export function TransparencySection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Portal da Transparencia
            </h2>
            <p className="text-gray-500 mt-1">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {transparencyCategories.map((cat) => (
            <Link key={cat.href} href={cat.href} className="group">
              <Card
                className={`border border-gray-100 ${cat.borderHover} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full`}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <div
                    className={`w-11 h-11 rounded-xl ${cat.bgColor} flex items-center justify-center mb-3`}
                  >
                    <cat.icon className={`h-5 w-5 ${cat.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-camara-primary transition-colors">
                    {cat.title}
                  </h3>
                  <ul className="space-y-1 mb-4 flex-1">
                    {cat.items.map((item) => (
                      <li key={item} className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all" style={{ color: 'var(--municipal-primary)' }}>
                    Acessar <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* PNTP Badge */}
        <div className="mt-8 flex items-center justify-between gap-4 py-4 px-6 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Programa Nacional de Transparencia Publica
              </p>
              <p className="text-xs text-emerald-600">
                Compromisso com a transparencia e o acesso a informacao
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-100 rounded-lg px-3 py-1.5">
            <Award className="h-4 w-4 text-emerald-700" />
            <span className="text-sm font-bold text-emerald-700">Nivel Diamante</span>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center md:hidden">
          <Button asChild variant="outline">
            <Link href="/transparencia">
              Portal da Transparencia <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default TransparencySection
