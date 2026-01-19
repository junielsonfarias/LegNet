'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { TenantProvider } from '@/lib/tenant/tenant-context'
import { TenantStyles } from '@/components/tenant'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <TenantProvider>
          <TenantStyles />
          {children}
        </TenantProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
