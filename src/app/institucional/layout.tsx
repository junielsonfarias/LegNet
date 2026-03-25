import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Institucional',
    default: 'Institucional',
  },
  description: 'Informações institucionais da Câmara Municipal. Lei Orgânica, Regimento Interno, ouvidoria e canal e-SIC.',
  openGraph: {
    title: 'Institucional | Câmara Municipal',
    description: 'Informações institucionais da Câmara Municipal.',
  },
}

export default function InstitucionalLayout({ children }: { children: React.ReactNode }) {
  return children
}
