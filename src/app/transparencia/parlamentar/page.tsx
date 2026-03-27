import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ClipboardCheck, FileText, DollarSign } from 'lucide-react'
import Link from 'next/link'

const secoes = [
  {
    icon: Users,
    title: 'Relatorio Individual',
    description: 'Consulte o relatorio detalhado de cada parlamentar: presenca, votacoes, producao legislativa.',
    href: '/transparencia/parlamentar/relatorio',
    color: 'text-camara-primary',
    bgColor: 'bg-camara-primary/10',
  },
  {
    icon: ClipboardCheck,
    title: 'Presenca em Sessoes',
    description: 'Registro de presenca dos parlamentares nas sessoes legislativas.',
    href: '/transparencia/parlamentar/presencas',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: FileText,
    title: 'Producao Legislativa',
    description: 'Proposicoes de autoria de cada parlamentar.',
    href: '/transparencia/parlamentar/producao',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: DollarSign,
    title: 'Verbas Indenizatorias',
    description: 'Gastos com verbas indenizatorias dos parlamentares.',
    href: '/transparencia/parlamentar/indenizatoria',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
]

export default function ParlamentarTransparenciaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transparencia Parlamentar
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe a atuacao dos vereadores: presenca, votacoes, producao legislativa e gastos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {secoes.map((secao) => {
            const Icon = secao.icon
            return (
              <Card key={secao.href} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${secao.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-8 w-8 ${secao.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {secao.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {secao.description}
                  </p>
                  <Link href={secao.href}>
                    <Button className="w-full">Acessar</Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
