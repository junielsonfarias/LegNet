import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { NotificationProvider } from '@/components/providers/notification-provider'
import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { MunicipalThemeProvider } from '@/components/providers/theme-provider-municipal'
import { PwaRegister } from '@/components/pwa-register'
import { prisma } from '@/lib/prisma'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap'
})

// Dados dinâmicos via variáveis de ambiente (configurável por tenant)
const siteName = process.env.SITE_NAME || 'Câmara Municipal'
const siteUrl = process.env.SITE_URL || 'https://camara.gov.br'
const siteDescription = process.env.SITE_DESCRIPTION || `Portal Institucional da ${siteName} - Transparência, Democracia e Cidadania. Acesse leis, decretos, sessões, licitações e muito mais.`

export const metadata: Metadata = {
  other: {
    'google': 'notranslate',
  },
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
  // Fase 4 / A9: PWA — manifest gerado em src/app/manifest.ts; icones em
  // src/app/icon.tsx e src/app/apple-icon.tsx (Next.js Metadata API).
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteName
  }
}

export const viewport = {
  themeColor: process.env.SITE_THEME_COLOR || '#374151',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
}

// Busca cores do tema no servidor para injetar no HTML (evita flash de cor errada)
async function getThemeColors() {
  try {
    const config = await prisma.configuracaoInstitucional.findFirst({
      select: { corPrimaria: true, corSecundaria: true, corAcento: true }
    })
    if (config?.corPrimaria) return config
  } catch {
    // Fallback silencioso se banco não disponível
  }
  return null
}

// Valida que o valor é um hex color válido (previne CSS injection)
function isValidHexColor(value: string): boolean {
  return /^#[a-f\d]{6}$/i.test(value)
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '55 65 81'
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

function darken(hex: string, amount: number = 0.3): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = Math.max(0, Math.floor(parseInt(result[1], 16) * (1 - amount)))
  const g = Math.max(0, Math.floor(parseInt(result[2], 16) * (1 - amount)))
  const b = Math.max(0, Math.floor(parseInt(result[3], 16) * (1 - amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function lighten(hex: string, amount: number = 0.3): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = Math.min(255, Math.floor(parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * amount))
  const g = Math.min(255, Math.floor(parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * amount))
  const b = Math.min(255, Math.floor(parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const colors = await getThemeColors()

  // CSS injetado server-side para cores corretas no primeiro paint
  // Validação de hex color para prevenir CSS injection
  const pri = (colors?.corPrimaria && isValidHexColor(colors.corPrimaria)) ? colors.corPrimaria : '#374151'
  const sec = (colors?.corSecundaria && isValidHexColor(colors.corSecundaria)) ? colors.corSecundaria : '#6b7280'
  const acc = (colors?.corAcento && isValidHexColor(colors.corAcento)) ? colors.corAcento : '#059669'

  const themeCSS = colors ? `:root {
    --tenant-primary: ${pri};
    --tenant-secondary: ${sec};
    --tenant-primary-rgb: ${hexToRgb(pri)};
    --tenant-secondary-rgb: ${hexToRgb(sec)};
    --municipal-primary: ${pri};
    --municipal-secondary: ${sec};
    --municipal-accent: ${acc};
    --municipal-primary-dark: ${darken(pri, 0.3)};
    --municipal-primary-darker: ${darken(pri, 0.5)};
    --municipal-primary-light: ${lighten(pri, 0.3)};
    --municipal-primary-lighter: ${lighten(pri, 0.8)};
    --municipal-secondary-dark: ${darken(sec, 0.3)};
    --municipal-secondary-light: ${lighten(sec, 0.3)};
    --municipal-primary-rgb: ${hexToRgb(pri)};
    --municipal-secondary-rgb: ${hexToRgb(sec)};
  }` : ''

  return (
    <html lang="pt-BR" translate="no" suppressHydrationWarning>
      <head>
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <MunicipalThemeProvider>
            <NotificationProvider />
            <PwaRegister />
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </MunicipalThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
