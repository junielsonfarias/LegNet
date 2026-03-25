'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  FileCheck,
  FileText,
  Building,
  Users,
  Receipt,
  BarChart3,
  Calendar,
  ArrowLeft,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

const categorias = [
  {
    titulo: 'Receitas',
    descricao: 'Detalhamento das receitas do município por exercício',
    href: '/transparencia/receitas',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-700 border-green-200',
    iconColor: 'text-green-600'
  },
  {
    titulo: 'Despesas',
    descricao: 'Detalhamento das despesas do município por exercício',
    href: '/transparencia/despesas',
    icon: DollarSign,
    color: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-600'
  },
  {
    titulo: 'Licitações',
    descricao: 'Processos licitatórios da Câmara Municipal',
    href: '/transparencia/licitacoes',
    icon: FileCheck,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600'
  },
  {
    titulo: 'Contratos',
    descricao: 'Contratos firmados pela Câmara Municipal',
    href: '/transparencia/contratos',
    icon: FileText,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600'
  },
  {
    titulo: 'Convênios',
    descricao: 'Convênios e parcerias firmadas',
    href: '/transparencia/convenios',
    icon: Building,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600'
  },
  {
    titulo: 'Folha de Pagamento',
    descricao: 'Informações sobre servidores e folha de pagamento',
    href: '/transparencia/folha-pagamento',
    icon: Users,
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    iconColor: 'text-pink-600'
  },
  {
    titulo: 'Gestão Fiscal',
    descricao: 'LOA, LDO, PPA e relatórios de gestão fiscal',
    href: '/transparencia/gestao-fiscal',
    icon: BarChart3,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    iconColor: 'text-cyan-600'
  },
  {
    titulo: 'Bens Patrimoniais',
    descricao: 'Bens imóveis e móveis da Câmara Municipal',
    href: '/transparencia/bens-imoveis',
    icon: Receipt,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600'
  },
  {
    titulo: 'Diárias e Passagens',
    descricao: 'Pagamento de diárias e passagens a servidores',
    href: '/transparencia/despesas',
    icon: Calendar,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    iconColor: 'text-teal-600'
  }
]

export default function ReceitasDespesasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="text-white"
        style={{ background: 'linear-gradient(135deg, var(--municipal-primary) 0%, var(--municipal-primary-dark) 100%)' }}
      >
        <div className="container mx-auto px-4 py-10">
          <Link
            href="/transparencia"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Portal da Transparência
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Receitas, Despesas e Contratos
          </h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Acompanhamento de receitas, despesas, convênios, folhas de pagamento, licitações e contratos da Câmara Municipal.
          </p>
        </div>
      </div>

      {/* Cards de Categorias */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categorias.map((cat) => (
            <Link key={cat.titulo} href={cat.href}>
              <Card className={`h-full border ${cat.color} hover:shadow-lg transition-all duration-200 group cursor-pointer`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-white/80 shrink-0`}>
                      <cat.icon className={`h-6 w-6 ${cat.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 flex items-center justify-between">
                        {cat.titulo}
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {cat.descricao}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Rodapé informativo */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            §3º da Lei de Acesso à Informação — Publicações vinculadas ao acompanhamento de receitas e despesas.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/transparencia">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Portal da Transparência
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
