import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  Building, BookOpen, Scale, Shield, FileText, Users, User, MessageSquare,
  Search, Lightbulb, Landmark, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const dynamic = 'force-static'

type SecaoInstitucional = {
  titulo: string
  descricao: string
  icone: LucideIcon
  itens: Array<{
    nome: string
    descricao: string
    href: string
    icone: LucideIcon
    badge?: string
  }>
}

const SECOES: SecaoInstitucional[] = [
  {
    titulo: 'A Casa Legislativa',
    descricao: 'Conheca a Camara Municipal, sua estrutura, missao e atribuicoes.',
    icone: Landmark,
    itens: [
      {
        nome: 'Sobre a Camara',
        descricao: 'Historia, missao, valores, mesa diretora e contato institucional.',
        href: '/institucional/sobre',
        icone: Building,
      },
      {
        nome: 'Papel da Camara',
        descricao: 'Funcoes legislativa, fiscalizadora, julgadora e administrativa.',
        href: '/institucional/papel-camara',
        icone: Scale,
      },
      {
        nome: 'Papel do Vereador',
        descricao: 'Atribuicoes do representante eleito pelo povo.',
        href: '/institucional/papel-vereador',
        icone: User,
      },
    ],
  },
  {
    titulo: 'Marco Regulatorio',
    descricao: 'Documentos normativos que regem o funcionamento da Casa.',
    icone: BookOpen,
    itens: [
      {
        nome: 'Lei Organica',
        descricao: 'Lei fundamental do municipio com a integra disponivel.',
        href: '/institucional/lei-organica',
        icone: FileText,
      },
      {
        nome: 'Regimento Interno',
        descricao: 'Normas internas de funcionamento da Camara.',
        href: '/institucional/regimento',
        icone: BookOpen,
      },
      {
        nome: 'Codigo de Etica',
        descricao: 'Principios eticos que orientam vereadores e servidores.',
        href: '/institucional/codigo-etica',
        icone: Shield,
      },
    ],
  },
  {
    titulo: 'Atendimento ao Cidadao',
    descricao: 'Canais oficiais para acesso a informacao e participacao.',
    icone: MessageSquare,
    itens: [
      {
        nome: 'E-SIC',
        descricao: 'Solicite informacoes publicas conforme a LAI (Lei 12.527/2011).',
        href: '/institucional/e-sic',
        icone: Shield,
      },
      {
        nome: 'Ouvidoria',
        descricao: 'Reclamacoes, sugestoes, denuncias e elogios.',
        href: '/institucional/ouvidoria',
        icone: MessageSquare,
      },
      {
        nome: 'Portal da Transparencia',
        descricao: 'Receitas, despesas, contratos, licitacoes e atos legislativos.',
        href: '/transparencia',
        icone: Search,
      },
    ],
  },
  {
    titulo: 'Conheca o Legislativo',
    descricao: 'Conteudo educativo para entender o processo legislativo.',
    icone: Lightbulb,
    itens: [
      {
        nome: 'Camara Explica',
        descricao: 'Conteudos didaticos sobre o funcionamento da Casa.',
        href: '/institucional/camara-explica',
        icone: Lightbulb,
        badge: 'Novo',
      },
      {
        nome: 'Dicionario Legislativo',
        descricao: 'Glossario de termos legislativos.',
        href: '/institucional/dicionario',
        icone: BookOpen,
      },
      {
        nome: 'Vereadores',
        descricao: 'Composicao atual da Casa, com biografia e contato.',
        href: '/parlamentares',
        icone: Users,
      },
    ],
  },
]

export default function InstitucionalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumb items={[{ label: 'Institucional', current: true }]} />
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden py-12 md:py-16"
        style={{
          background:
            'linear-gradient(135deg, var(--municipal-primary, #1e3a5f) 0%, color-mix(in srgb, var(--municipal-primary, #1e3a5f) 70%, #000) 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm mb-6">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Institucional
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-3xl mx-auto">
            Estrutura organizacional, marco regulatorio, atendimento ao cidadao e conteudo
            educativo da Camara Municipal.
          </p>
        </div>
      </section>

      {/* Secoes */}
      <div className="container mx-auto px-4 py-10 md:py-12 space-y-10">
        {SECOES.map((secao) => (
          <section key={secao.titulo} aria-label={secao.titulo}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-2.5 rounded-lg shadow-sm"
                style={{ backgroundColor: 'var(--municipal-primary)' }}
              >
                <secao.icone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {secao.titulo}
                </h2>
                <p className="text-sm text-gray-500">{secao.descricao}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {secao.itens.map((item) => (
                <Link
                  key={item.nome}
                  href={item.href}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-[var(--municipal-primary-light)] hover:shadow-md p-5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: 'var(--municipal-primary-lighter)' }}
                    >
                      <item.icone
                        className="h-5 w-5"
                        style={{ color: 'var(--municipal-primary)' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[var(--municipal-primary-dark)]">
                          {item.nome}
                        </h3>
                        {item.badge && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: 'var(--municipal-primary)' }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-snug">{item.descricao}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[var(--municipal-primary)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
