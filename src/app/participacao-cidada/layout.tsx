import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Participação Cidadã',
  description: 'Participe da vida legislativa. Envie sugestões, participe de consultas públicas e acompanhe audiências.',
  openGraph: {
    title: 'Participação Cidadã | Câmara Municipal',
    description: 'Participe da vida legislativa da Câmara Municipal.',
  },
}

export default function ParticipacaoLayout({ children }: { children: React.ReactNode }) {
  return children
}
