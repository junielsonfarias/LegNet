/**
 * Transparency Section - Cards de acesso rapido + dados de transparencia
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Eye,
  FileText,
  Scale,
  DollarSign,
  Building2,
  ArrowRight,
  Download,
  ExternalLink,
  BarChart3,
  ShieldCheck
} from 'lucide-react'

interface Publicacao {
  id: string
  titulo: string
  tipo: string
  dataPublicacao: string
}

const transparencyLinks = [
  {
    icon: DollarSign,
    title: 'Receitas e Despesas',
    description: 'Acompanhe a execucao orcamentaria',
    href: '/transparencia/receitas-despesas-convenios-folhas-licitacoes-contratos',
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    icon: Building2,
    title: 'Licitacoes e Contratos',
    description: 'Processos e contratos firmados',
    href: '/transparencia/licitacoes',
    color: 'bg-blue-50 text-blue-600'
  },
  {
    icon: Scale,
    title: 'Legislacao Municipal',
    description: 'Leis, decretos e normas vigentes',
    href: '/legislativo/normas',
    color: 'bg-violet-50 text-violet-600'
  },
  {
    icon: BarChart3,
    title: 'Dados Abertos',
    description: 'Acesse dados em formato aberto',
    href: '/transparencia/dados-abertos',
    color: 'bg-amber-50 text-amber-600'
  },
]

export function TransparencySection() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/dados-abertos/publicacoes?limit=5')
        const data = await res.json()
        setPublicacoes(data.dados || [])
      } catch {}
    }
    fetch_()
  }, [])

  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Transparencia</h2>
            <p className="text-gray-500 mt-1">Acesso a informacoes publicas do municipio</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/transparencia">
              Portal completo <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cards de acesso */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {transparencyLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all h-full">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-camara-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Publicacoes recentes */}
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-gray-400" />
                <h3 className="font-semibold text-gray-800 text-sm">Publicacoes Recentes</h3>
              </div>
              {publicacoes.length > 0 ? (
                <div className="space-y-3">
                  {publicacoes.map((pub) => (
                    <div key={pub.id} className="flex items-start gap-3">
                      <div className="w-1 h-8 rounded-full bg-gray-200 shrink-0 mt-0.5" style={{ backgroundColor: 'var(--municipal-primary-light, #93c5fd)' }} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 line-clamp-1">{pub.titulo}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(pub.dataPublicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Nenhuma publicacao recente</p>
              )}

              <Button asChild variant="ghost" size="sm" className="w-full mt-4 text-xs">
                <Link href="/transparencia/publicacoes">
                  Ver todas as publicacoes <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PNTP Badge */}
        <div className="mt-8 flex items-center justify-center gap-3 py-4 px-6 bg-emerald-50 rounded-xl border border-emerald-100">
          <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Programa Nacional de Transparencia Publica</p>
            <p className="text-xs text-emerald-600">Compromisso com a transparencia e o acesso a informacao - Nivel Diamante</p>
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
