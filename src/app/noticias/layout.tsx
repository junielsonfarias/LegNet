import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notícias',
  description: 'Últimas notícias e comunicados da Câmara Municipal. Fique por dentro das atividades legislativas.',
  openGraph: {
    title: 'Notícias | Câmara Municipal',
    description: 'Últimas notícias e comunicados da Câmara Municipal.',
  },
}

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return children
}
