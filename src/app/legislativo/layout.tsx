import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Legislativo',
    default: 'Legislativo',
  },
  description: 'Sistema legislativo da Câmara Municipal. Acompanhe proposições, sessões, votações, comissões e normas jurídicas.',
  openGraph: {
    title: 'Legislativo | Câmara Municipal',
    description: 'Acompanhe proposições, sessões, votações, comissões e normas jurídicas da Câmara Municipal.',
  },
}

export default function LegislativoLayout({ children }: { children: React.ReactNode }) {
  return children
}
