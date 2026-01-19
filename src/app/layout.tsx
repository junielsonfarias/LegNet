import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { ConditionalLayout } from '@/components/layout/conditional-layout'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: 'Câmara Municipal de Mojuí dos Campos',
    template: '%s | Câmara Municipal de Mojuí dos Campos'
  },
  description: 'Portal Institucional da Câmara Municipal de Mojuí dos Campos - Transparência, Democracia e Cidadania. Acesse leis, decretos, sessões, licitações e muito mais.',
  keywords: [
    'Câmara Municipal',
    'Mojuí dos Campos',
    'Vereadores',
    'Legislativo',
    'Transparência',
    'Leis Municipais',
    'Sessões Legislativas',
    'Licitações',
    'Portal da Transparência',
    'Democracia',
    'Cidadania'
  ],
  authors: [{ name: 'Câmara Municipal de Mojuí dos Campos' }],
  creator: 'Câmara Municipal de Mojuí dos Campos',
  publisher: 'Câmara Municipal de Mojuí dos Campos',
  openGraph: {
    title: 'Câmara Municipal de Mojuí dos Campos',
    description: 'Portal Institucional da Câmara Municipal de Mojuí dos Campos - Transparência, Democracia e Cidadania',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Câmara Municipal de Mojuí dos Campos'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Câmara Municipal de Mojuí dos Campos',
    description: 'Portal Institucional da Câmara Municipal de Mojuí dos Campos'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
  alternates: {
    canonical: 'https://camaramojuidoscampos.pa.gov.br',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <NotificationProvider />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  )
}
