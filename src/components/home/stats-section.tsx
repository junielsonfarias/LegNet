import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, FileText, TrendingUp } from 'lucide-react'

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      title: 'Vereadores Ativos',
      value: '11',
      description: 'Parlamentares eleitos para a legislatura 2025/2028',
      color: 'text-blue-600'
    },
    {
      icon: Calendar,
      title: 'Sessões Realizadas',
      value: '27',
      description: 'Sessões ordinárias e extraordinárias neste ano',
      color: 'text-green-600'
    },
    {
      icon: FileText,
      title: 'Matérias Processadas',
      value: '294',
      description: 'Proposições, leis e decretos em tramitação',
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Transparência',
      value: '100%',
      description: 'Conformidade com a Lei de Acesso à Informação',
      color: 'text-orange-600'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Números da Câmara
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Acompanhe os principais indicadores de atividade legislativa 
            e transparência da Câmara Municipal de Mojuí dos Campos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="camara-card hover:scale-105 transition-transform duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-camara-primary mb-2">
                  {stat.value}
                </div>
                <p className="text-sm text-gray-600">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
