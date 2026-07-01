import Link from 'next/link'
import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  FileQuestion,
  LifeBuoy,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Central de Ajuda',
  description: 'Guia rápido, perguntas frequentes e canais de atendimento da Câmara Municipal.',
}

interface Recurso {
  icon: typeof HelpCircle
  titulo: string
  descricao: string
  href: string
  cta: string
}

const recursos: Recurso[] = [
  {
    icon: FileQuestion,
    titulo: 'Perguntas Frequentes',
    descricao: 'Respostas para as dúvidas mais comuns de cidadãos e servidores sobre o portal.',
    href: '/transparencia/faq',
    cta: 'Ver perguntas frequentes',
  },
  {
    icon: MessageSquare,
    titulo: 'Ouvidoria',
    descricao: 'Registre elogios, sugestões, reclamações ou denúncias e acompanhe o andamento.',
    href: '/institucional/ouvidoria',
    cta: 'Acessar a Ouvidoria',
  },
  {
    icon: BookOpen,
    titulo: 'e-SIC — Acesso à Informação',
    descricao: 'Solicite informações públicas com base na Lei de Acesso à Informação (LAI).',
    href: '/institucional/e-sic',
    cta: 'Solicitar informação',
  },
  {
    icon: LifeBuoy,
    titulo: 'Portal da Transparência',
    descricao: 'Consulte despesas, contratos, licitações, folha de pagamento e demais dados abertos.',
    href: '/transparencia',
    cta: 'Abrir o Portal',
  },
]

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Cabeçalho */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-camara-primary/10 rounded-xl">
              <HelpCircle className="h-10 w-10 text-camara-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Central de Ajuda</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Encontre orientações de uso do portal e os canais oficiais de atendimento da
            Câmara Municipal. Escolha abaixo o recurso que melhor atende à sua necessidade.
          </p>
        </div>

        {/* Recursos */}
        <div className="grid gap-4 sm:grid-cols-2">
          {recursos.map((r) => {
            const Icon = r.icon
            return (
              <Card key={r.href} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                    <Icon className="h-5 w-5 text-camara-primary" />
                    {r.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{r.descricao}</p>
                  <Link
                    href={r.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-camara-primary hover:underline"
                  >
                    {r.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Guia rápido */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">Guia rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>
                <strong>Buscar matérias legislativas:</strong> use a{' '}
                <Link href="/legislativo/proposicoes" className="text-camara-primary hover:underline">
                  lista de proposições
                </Link>{' '}
                e o filtro de ano para localizar projetos por período.
              </li>
              <li>
                <strong>Consultar sessões e atas:</strong> acesse{' '}
                <Link href="/legislativo/sessoes" className="text-camara-primary hover:underline">
                  Sessões
                </Link>{' '}
                e{' '}
                <Link href="/legislativo/atas" className="text-camara-primary hover:underline">
                  Atas
                </Link>{' '}
                para acompanhar os trabalhos do plenário.
              </li>
              <li>
                <strong>Conhecer os vereadores:</strong> veja a página de{' '}
                <Link href="/parlamentares" className="text-camara-primary hover:underline">
                  Parlamentares
                </Link>{' '}
                com produção legislativa, votações e presença.
              </li>
              <li>
                <strong>Legislação municipal:</strong> pesquise leis e resoluções em{' '}
                <Link href="/legislativo/normas" className="text-camara-primary hover:underline">
                  Normas
                </Link>
                .
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
