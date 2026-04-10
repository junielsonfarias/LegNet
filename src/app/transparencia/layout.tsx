import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Transparência',
    default: 'Portal da Transparência',
  },
  description: 'Acesse dados públicos da Câmara Municipal: despesas, receitas, contratos, licitações, folha de pagamento e mais. Conformidade com a Lei de Acesso à Informação.',
  openGraph: {
    title: 'Portal da Transparência | Câmara Municipal',
    description: 'Acesse dados públicos da Câmara Municipal: despesas, receitas, contratos, licitações e mais.',
  },
}

export default function TransparenciaLayout({ children }: { children: React.ReactNode }) {
  return children
}
