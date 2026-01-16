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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Desabilitar React DevTools
              window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };
              
              (function() {
                var originalError = console.error;
                var originalWarn = console.warn;
                
                var shouldSuppress = function(message) {
                  if (typeof message === 'string') {
                    return message.includes('Extra attributes from the server') ||
                           message.includes('Warning: Extra attributes') ||
                           message.includes('class,style') ||
                           message.includes('hydration') ||
                           message.includes('Prop className did not match') ||
                           message.includes('Server: "__className_') ||
                           message.includes('Client: "__className_') ||
                           message.includes('app-index.tsx') ||
                           message.includes('hydration-error-info.ts') ||
                           message.includes('Download the React DevTools') ||
                           message.includes('react-devtools');
                  }
                  return false;
                };
                
                console.error = function() {
                  if (!shouldSuppress(arguments[0])) {
                    originalError.apply(console, arguments);
                  }
                };
                
                console.warn = function() {
                  if (!shouldSuppress(arguments[0])) {
                    originalWarn.apply(console, arguments);
                  }
                };
              })();
            `,
          }}
        />
      </head>
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
