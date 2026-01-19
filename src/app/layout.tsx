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

// Dados dinâmicos via variáveis de ambiente (configurável por tenant)
const siteName = process.env.SITE_NAME || 'Câmara Municipal'
const siteUrl = process.env.SITE_URL || 'https://camara.gov.br'
const siteDescription = process.env.SITE_DESCRIPTION || `Portal Institucional da ${siteName} - Transparência, Democracia e Cidadania. Acesse leis, decretos, sessões, licitações e muito mais.`

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription,
  keywords: [
    'Câmara Municipal',
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
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: 'website',
    locale: 'pt_BR',
    siteName: siteName
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription
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
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },
  alternates: {
    canonical: siteUrl,
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
