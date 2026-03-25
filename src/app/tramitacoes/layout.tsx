import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tramitações',
  description: 'Acompanhe a tramitação de proposições legislativas. Consulte status, prazos e movimentações.',
  openGraph: {
    title: 'Tramitações | Câmara Municipal',
    description: 'Acompanhe a tramitação de proposições legislativas da Câmara Municipal.',
  },
}

export default function TramitacoesLayout({ children }: { children: React.ReactNode }) {
  return children
}
