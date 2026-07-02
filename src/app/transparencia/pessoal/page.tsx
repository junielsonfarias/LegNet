import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, FileText, Plane, GraduationCap } from 'lucide-react'
import Link from 'next/link'

const secoes = [
  {
    icon: Users,
    title: 'Quadro de Pessoal',
    description: 'Consulte os servidores da Camara Municipal, cargos e lotacoes.',
    href: '/transparencia/pessoal/quadro-pessoal',
    color: 'text-camara-primary',
    bgColor: 'bg-camara-primary/10',
  },
  {
    icon: DollarSign,
    title: 'Remuneracao',
    description: 'Faixas de remuneracao por cargo e funcao.',
    href: '/transparencia/pessoal/remuneracao',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: FileText,
    title: 'Folha de Pagamento',
    description: 'Consulte a folha de pagamento mensal da Camara.',
    href: '/transparencia/folha-pagamento',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: Plane,
    title: 'Diarias e Passagens',
    description: 'Valores de diarias e passagens concedidas a servidores e parlamentares.',
    href: '/transparencia/pessoal/diarias',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    icon: GraduationCap,
    title: 'Concursos Publicos',
    description: 'Editais, resultados e informacoes sobre concursos publicos.',
    href: '/transparencia/pessoal/concursos',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
]

export default function PessoalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Informacoes de Pessoal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transparencia sobre o quadro de servidores, remuneracoes e gastos com pessoal
            da Camara Municipal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
