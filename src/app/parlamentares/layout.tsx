import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Parlamentares',
    default: 'Parlamentares',
  },
  description: 'Conheça os vereadores da Câmara Municipal. Informações sobre mandatos, partidos, presença em sessões e votações.',
  openGraph: {
    title: 'Parlamentares | Câmara Municipal',
    description: 'Conheça os vereadores da Câmara Municipal. Informações sobre mandatos, partidos, presença em sessões e votações.',
  },
}

export default function ParlamentaresLayout({ children }: { children: React.ReactNode }) {
  return children
}
