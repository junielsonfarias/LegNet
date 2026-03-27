/**
 * Citizen Participation Section - Secao de participacao cidada
 * Inspirado na Camara dos Deputados
 */

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  Shield,
  Vote,
  ArrowRight,
} from 'lucide-react'

const participationCards = [
  {
    icon: MessageCircle,
    title: 'Ouvidoria',
    description: 'Registre reclamacoes, sugestoes ou elogios',
    buttonText: 'Acessar Ouvidoria',
    href: '/institucional/ouvidoria',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderHover: 'hover:border-emerald-200',
  },
  {
    icon: Shield,
    title: 'e-SIC',
    description: 'Solicite informacoes publicas (Lei de Acesso)',
    buttonText: 'Acessar e-SIC',
    href: '/institucional/e-sic',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderHover: 'hover:border-blue-200',
  },
  {
    icon: Vote,
    title: 'Consultas Publicas',
    description: 'Participe das consultas e enquetes abertas',
    buttonText: 'Participar',
    href: '/participacao',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderHover: 'hover:border-violet-200',
  },
]

export function CitizenParticipationSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Participacao Cidada
          </h2>
          <p className="text-gray-500 mt-2 text-lg">
            Sua voz e importante para a democracia
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {participationCards.map((card) => (
            <Card
              key={card.href}
              className={`border border-gray-200 ${card.borderHover} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <CardContent className="p-6 text-center flex flex-col items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${card.bgColor} flex items-center justify-center`}
                >
                  <card.icon className={`h-7 w-7 ${card.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{card.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-auto"
                  size="sm"
                >
                  <Link href={card.href}>
                    {card.buttonText} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CitizenParticipationSection
