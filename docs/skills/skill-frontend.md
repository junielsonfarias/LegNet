# Skill: Frontend

## Visao Geral

O frontend do sistema e construido com Next.js 14 (App Router), React 18, TypeScript e Tailwind CSS. Utiliza componentes Radix UI com estilizacao shadcn/ui, sistema de design tokens centralizado, suporte a multi-tenant e conformidade WCAG 2.1 AA para acessibilidade.

---

## Stack Tecnologica

### Core

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| Next.js | 14.2.5 | Framework React com App Router |
| React | 18.3.1 | Biblioteca UI |
| TypeScript | 5.5.3 | Tipagem estatica |
| Tailwind CSS | 3.4.4 | Estilizacao utility-first |

### UI e Componentes

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| Radix UI | varios | Componentes headless acessiveis |
| class-variance-authority | 0.7.0 | Variantes de componentes |
| clsx | 2.1.1 | Concatenacao de classes |
| tailwind-merge | 2.4.0 | Merge inteligente de classes |
| Lucide React | 0.408.0 | Icones |

### Formularios e Validacao

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| React Hook Form | 7.51.3 | Gerenciamento de formularios |
| @hookform/resolvers | 3.6.0 | Resolvers para validacao |
| Zod | 3.25.76 | Validacao de schemas |

### Estado e Dados

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| next-auth | 4.24.7 | Autenticacao |
| next-themes | 0.4.6 | Tema claro/escuro |
| sonner | 2.0.7 | Toasts/notificacoes |

### Visualizacao

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| Recharts | 2.12.7 | Graficos |
| react-day-picker | 9.11.0 | Calendario |
| React Quill | 2.0.0 | Editor rich text |

### Exportacao

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| jsPDF | 4.0.0 | Geracao de PDF |
| jspdf-autotable | 5.0.7 | Tabelas em PDF |
| ExcelJS | 4.4.0 | Exportacao Excel |

### Testes

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| Jest | 30.2.0 | Testes unitarios |
| Testing Library | 16.3.0 | Testes de componentes |
| Playwright | 1.57.0 | Testes E2E |

---

## Estrutura de Pastas

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rotas autenticadas
│   │   └── login/
│   ├── admin/                    # Painel administrativo
│   │   ├── layout.tsx            # Layout admin com sidebar
│   │   ├── page.tsx              # Dashboard admin
│   │   ├── parlamentares/
│   │   ├── proposicoes/
│   │   ├── sessoes/
│   │   └── ...
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── parlamentares/
│   │   └── ...
│   ├── parlamentares/            # Paginas publicas parlamentares
│   ├── legislativo/              # Paginas publicas legislativo
│   ├── transparencia/            # Portal da transparencia
│   ├── parlamentar/              # Area do parlamentar
│   ├── painel-operador/          # Painel eletronico
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/
│   ├── ui/                       # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── admin/                    # Componentes do admin
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   └── ...
│   ├── painel/                   # Componentes do painel eletronico
│   │   ├── votacao-display.tsx
│   │   ├── presenca-display.tsx
│   │   └── ...
│   ├── home/                     # Componentes da home
│   │   ├── hero.tsx
│   │   ├── stats-section.tsx
│   │   └── ...
│   ├── layout/                   # Componentes de layout
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── ...
│   ├── accessibility/            # Componentes de acessibilidade
│   │   ├── accessibility-toolbar.tsx
│   │   └── ...
│   ├── skeletons/                # Skeletons de loading
│   │   ├── card-skeleton.tsx
│   │   ├── table-skeleton.tsx
│   │   └── ...
│   └── providers.tsx             # Providers globais
│
├── lib/
│   ├── api/                      # Clientes de API
│   │   ├── parlamentares-api.ts
│   │   ├── proposicoes-api.ts
│   │   └── ...
│   ├── hooks/                    # Hooks customizados
│   │   ├── use-parlamentares.ts
│   │   ├── use-proposicoes.ts
│   │   ├── use-debounce.ts
│   │   └── ...
│   ├── services/                 # Servicos de negocio
│   ├── types/                    # Tipos TypeScript
│   ├── utils/                    # Utilitarios
│   │   ├── cn.ts                 # Merge de classes
│   │   └── ...
│   ├── validation/               # Schemas Zod
│   ├── design-tokens/            # Tokens de design
│   │   └── portal-tokens.ts
│   └── tenant/                   # Multi-tenant
│       └── tenant-context.tsx
│
└── styles/                       # Estilos adicionais (se necessario)
```

---

## Design Tokens

### Arquivo Principal

`src/lib/design-tokens/portal-tokens.ts`

### Espacamento

```typescript
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
}

// Classes Tailwind: portal-xs, portal-sm, portal-md, etc.
```

### Tipografia Responsiva

```typescript
export const typography = {
  fontSize: {
    xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',      // 12-14px
    sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',        // 14-16px
    base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',        // 16-18px
    lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',       // 18-20px
    xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',        // 20-24px
    '2xl': 'clamp(1.5rem, 1.25rem + 1.25vw, 2rem)',       // 24-32px
    '3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)',   // 30-40px
    '4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 3rem)',       // 36-48px
    '5xl': 'clamp(3rem, 2.25rem + 3.75vw, 4rem)',         // 48-64px
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
}

// Classes Tailwind: text-portal-xs, text-portal-base, etc.
```

### Cores Institucionais

```typescript
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',  // Cor principal
    900: '#1e3a8a',
  },
  // Cores do tenant (dinamicas)
  tenant: {
    primary: 'var(--tenant-primary, #1e40af)',
    secondary: 'var(--tenant-secondary, #3b82f6)',
  },
}
```

### Alto Contraste

```typescript
export const highContrastColors = {
  background: '#000000',
  foreground: '#ffffff',
  primary: '#ffff00',      // Amarelo para links/botoes
  secondary: '#00ffff',    // Ciano
  accent: '#ff00ff',       // Magenta
  focus: '#ffff00',
  border: '#ffffff',
}

// Classes Tailwind: hc-bg, hc-fg, hc-primary, etc.
```

### Touch Targets (WCAG)

```typescript
export const touchTargets = {
  min: '44px',           // Minimo WCAG
  comfortable: '48px',
  large: '56px',
}

// Classes Tailwind: min-h-touch, min-w-touch
```

### Z-Index

```typescript
export const zIndex = {
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
}
```

---

## Componentes UI (shadcn/ui)

### Padrao de Componente

```typescript
// src/components/ui/button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Definir variantes com CVA
const buttonVariants = cva(
  // Classes base
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Interface do componente
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Componente com forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Componentes Disponiveis

| Componente | Arquivo | Radix UI |
|------------|---------|----------|
| Button | `ui/button.tsx` | Slot |
| Card | `ui/card.tsx` | - |
| Dialog | `ui/dialog.tsx` | Dialog |
| Dropdown Menu | `ui/dropdown-menu.tsx` | DropdownMenu |
| Input | `ui/input.tsx` | - |
| Label | `ui/label.tsx` | Label |
| Select | `ui/select.tsx` | Select |
| Table | `ui/table.tsx` | - |
| Tabs | `ui/tabs.tsx` | Tabs |
| Checkbox | `ui/checkbox.tsx` | Checkbox |
| Radio Group | `ui/radio-group.tsx` | RadioGroup |
| Switch | `ui/switch.tsx` | Switch |
| Popover | `ui/popover.tsx` | Popover |
| Tooltip | `ui/tooltip.tsx` | Tooltip |
| Alert Dialog | `ui/alert-dialog.tsx` | AlertDialog |
| Avatar | `ui/avatar.tsx` | Avatar |
| Badge | `ui/badge.tsx` | - |
| Calendar | `ui/calendar.tsx` | - |
| Progress | `ui/progress.tsx` | Progress |
| Skeleton | `ui/skeleton.tsx` | - |
| Separator | `ui/separator.tsx` | Separator |
| Sheet | `ui/sheet.tsx` | Dialog |
| Textarea | `ui/textarea.tsx` | - |
| Navigation Menu | `ui/navigation-menu.tsx` | NavigationMenu |
| Breadcrumb | `ui/breadcrumb.tsx` | - |
| Accordion | `ui/accordion.tsx` | Accordion |

---

## Hooks Customizados

### Padrao de Hook CRUD

```typescript
// src/lib/hooks/use-parlamentares.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { parlamentaresApi, ParlamentarApi, ParlamentarFilters } from '@/lib/api/parlamentares-api'
import { toast } from 'sonner'
import { withRetry } from '@/lib/utils/retry'

interface UseParlamentaresReturn {
  parlamentares: ParlamentarApi[]
  loading: boolean
  error: string | null
  meta?: any
  refetch: () => Promise<void>
  create: (data: ParlamentarCreate) => Promise<ParlamentarApi | null>
  update: (id: string, data: ParlamentarUpdate) => Promise<ParlamentarApi | null>
  remove: (id: string) => Promise<boolean>
}

export function useParlamentares(filters?: ParlamentarFilters): UseParlamentaresReturn {
  const [parlamentares, setParlamentares] = useState<ParlamentarApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<any>(null)

  const fetchParlamentares = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await withRetry(() => parlamentaresApi.getAll(filters), 3, 1000)
      setParlamentares(result.data)
      setMeta(result.meta)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchParlamentares()
  }, [fetchParlamentares])

  // ... create, update, remove

  return {
    parlamentares,
    loading,
    error,
    meta,
    refetch: fetchParlamentares,
    create,
    update,
    remove,
  }
}
```

### Hooks Disponiveis

| Hook | Arquivo | Funcao |
|------|---------|--------|
| `useParlamentares` | `use-parlamentares.ts` | CRUD parlamentares |
| `useProposicoes` | `use-proposicoes.ts` | CRUD proposicoes |
| `useSessoes` | `use-sessoes.ts` | CRUD sessoes |
| `useComissoes` | `use-comissoes.ts` | CRUD comissoes |
| `useTramitacoes` | `use-tramitacoes.ts` | CRUD tramitacoes |
| `useLegislaturas` | `use-legislaturas.ts` | CRUD legislaturas |
| `useMesaDiretora` | `use-mesa-diretora.ts` | CRUD mesa |
| `useNoticias` | `use-noticias.ts` | CRUD noticias |
| `usePauta` | `use-pauta.ts` | Gestao de pauta |
| `useQuorum` | `use-quorum.ts` | Calculo de quorum |
| `usePareceres` | `use-pareceres.ts` | CRUD pareceres |
| `usePainelTempoReal` | `use-painel-tempo-real.ts` | Estado do painel |
| `usePainelSSE` | `use-painel-sse.ts` | Server-Sent Events |
| `useCronometroSincronizado` | `use-cronometro-sincronizado.ts` | Cronometro orador |
| `useKeyboardShortcuts` | `use-keyboard-shortcuts.ts` | Atalhos teclado |
| `useDebounce` | `use-debounce.ts` | Debounce de valores |
| `useSearch` | `use-search.ts` | Busca global |
| `useFavoritos` | `use-favoritos.ts` | Sistema favoritos |
| `useTenant` | `use-tenant.ts` | Contexto multi-tenant |
| `useNotifications` | `use-notifications.ts` | Sistema notificacoes |
| `useBreadcrumbs` | `use-breadcrumbs.ts` | Breadcrumbs dinamicos |
| `useConfiguracaoInstitucional` | `use-configuracao-institucional.ts` | Config tenant |
| `useDespesas` | `use-despesas.ts` | Dados despesas |
| `useReceitas` | `use-receitas.ts` | Dados receitas |
| `useContratos` | `use-contratos.ts` | Dados contratos |
| `useLicitacoes` | `use-licitacoes.ts` | Dados licitacoes |
| `useServidores` | `use-servidores.ts` | Dados servidores |
| `useBackup` | `use-backup.ts` | Sistema backup |

---

## Providers

### Estrutura de Providers

```typescript
// src/components/providers.tsx

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
```

### Ordem dos Providers

1. **SessionProvider** - Autenticacao NextAuth
2. **ThemeProvider** - Tema claro/escuro
3. **TenantProvider** - Multi-tenant
4. **TenantStyles** - CSS variaveis do tenant

---

## Acessibilidade (WCAG 2.1 AA)

### Componentes de Acessibilidade

| Componente | Arquivo | Funcao |
|------------|---------|--------|
| SkipLink | `ui/skip-link.tsx` | Pular navegacao |
| AccessibilityToolbar | `accessibility/accessibility-toolbar.tsx` | Barra de ferramentas |
| AccessibleTable | `ui/accessible-table.tsx` | Tabela acessivel |

### Skip Links

```typescript
// Skip para conteudo, navegacao e rodape
<SkipLink href="#main-content">Pular para conteudo</SkipLink>
<SkipLink href="#main-nav">Ir para navegacao</SkipLink>
<SkipLink href="#footer">Ir para rodape</SkipLink>
```

### Alto Contraste

```css
/* globals.css */
.high-contrast {
  --hc-bg: #000000;
  --hc-fg: #ffffff;
  --hc-primary: #ffff00;
  --hc-secondary: #00ffff;
  --hc-focus: #ffff00;
}

.high-contrast * {
  border-color: var(--hc-border) !important;
}

.high-contrast a,
.high-contrast button {
  color: var(--hc-primary) !important;
}
```

### Focus Visible

```css
/* Focus ring padrao */
.focus-visible:focus {
  outline: none;
  ring: 2px;
  ring-offset: 2px;
  ring-color: rgb(59 130 246 / 0.5);
}

/* Focus ring alto contraste */
.high-contrast .focus-visible:focus {
  ring-color: #ffff00;
}
```

### Touch Targets

```css
/* Minimo 44x44px para WCAG */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Multi-Tenant

### Contexto do Tenant

```typescript
// src/lib/tenant/tenant-context.tsx

interface TenantConfig {
  nome: string
  sigla: string
  corPrimaria: string
  corSecundaria: string
  logo: string
  brasao: string
}

const TenantContext = createContext<TenantConfig | null>(null)

export function useTenant() {
  return useContext(TenantContext)
}
```

### CSS Variaveis Dinamicas

```typescript
// src/components/tenant/tenant-styles.tsx

export function TenantStyles() {
  const tenant = useTenant()

  return (
    <style jsx global>{`
      :root {
        --tenant-primary: ${tenant?.corPrimaria || '#1e40af'};
        --tenant-secondary: ${tenant?.corSecundaria || '#3b82f6'};
      }
    `}</style>
  )
}
```

### Uso no Tailwind

```html
<div className="bg-tenant-primary text-white">
  Cor do tenant
</div>
```

---

## Animacoes

### Keyframes Disponiveis

```typescript
// tailwind.config.js

keyframes: {
  "accordion-down": {
    from: { height: 0 },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "fade-in": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  "slide-in-up": {
    from: { opacity: 0, transform: "translateY(10px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "scale-in": {
    from: { opacity: 0, transform: "scale(0.95)" },
    to: { opacity: 1, transform: "scale(1)" },
  },
  "pulse-soft": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.85 },
  },
  "confetti": {
    "0%": { transform: "translateY(0) rotate(0deg)", opacity: 1 },
    "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: 0 },
  },
}
```

### Classes de Animacao

```html
<div className="animate-fade-in">Fade in</div>
<div className="animate-slide-in-up">Slide up</div>
<div className="animate-scale-in">Scale in</div>
<div className="animate-pulse-soft">Pulse suave</div>
```

---

## Padroes de Codigo

### Nomenclatura

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `UserCard.tsx` |
| Hooks | camelCase com use | `use-parlamentares.ts` |
| Utilitarios | kebab-case | `format-date.ts` |
| Tipos | PascalCase | `ParlamentarApi` |
| Constantes | UPPER_SNAKE | `MAX_ITEMS` |

### Estrutura de Componente

```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Parlamentar } from '@prisma/client'

// 2. Tipos/Interfaces
interface ParlamentarCardProps {
  parlamentar: Parlamentar
  onClick?: () => void
  className?: string
}

// 3. Componente
export function ParlamentarCard({
  parlamentar,
  onClick,
  className
}: ParlamentarCardProps) {
  // 4. Estado
  const [loading, setLoading] = useState(false)

  // 5. Handlers
  const handleClick = () => {
    setLoading(true)
    onClick?.()
  }

  // 6. Render
  return (
    <div className={cn("p-4 rounded-lg", className)}>
      <h3>{parlamentar.nome}</h3>
      <Button onClick={handleClick} disabled={loading}>
        Ver perfil
      </Button>
    </div>
  )
}
```

### Estrutura de Hook

```typescript
// 1. Imports
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

// 2. Tipos
interface UseExemploReturn {
  data: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 3. Hook
export function useExemplo(filtros?: any): UseExemploReturn {
  // 4. Estado
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 5. Fetch com useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // ... fetch
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
      toast.error('Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  // 6. Effect
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 7. Return
  return { data, loading, error, refetch: fetchData }
}
```

### Utilitario cn()

```typescript
// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Uso
<div className={cn(
  "base-classes",
  condition && "conditional-class",
  className // prop externa
)}>
```

---

## Validacao com Zod

### Schema de Formulario

```typescript
// src/lib/validation/parlamentar.ts

import { z } from 'zod'

export const parlamentarSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no minimo 3 caracteres')
    .max(100, 'Nome deve ter no maximo 100 caracteres'),
  email: z.string()
    .email('Email invalido')
    .optional()
    .or(z.literal('')),
  cpf: z.string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 digitos')
    .optional(),
  partido: z.string()
    .min(2, 'Sigla do partido obrigatoria'),
  ativo: z.boolean().default(true),
})

export type ParlamentarFormData = z.infer<typeof parlamentarSchema>
```

### Uso com React Hook Form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { parlamentarSchema, ParlamentarFormData } from '@/lib/validation/parlamentar'

export function ParlamentarForm() {
  const form = useForm<ParlamentarFormData>({
    resolver: zodResolver(parlamentarSchema),
    defaultValues: {
      nome: '',
      email: '',
      partido: '',
      ativo: true,
    },
  })

  const onSubmit = async (data: ParlamentarFormData) => {
    // ...
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('nome')} />
      {form.formState.errors.nome && (
        <span>{form.formState.errors.nome.message}</span>
      )}
    </form>
  )
}
```

---

## Loading States

### Skeleton Components

```typescript
// src/components/skeletons/card-skeleton.tsx

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-lg border animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

// Uso
{loading ? <CardSkeleton /> : <Card data={data} />}
```

### Loading Spinner

```typescript
// src/components/ui/loading.tsx

import { Loader2 } from 'lucide-react'

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}
```

---

## Exportacao de Dados

### PDF com jsPDF

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToPDF(data: any[], filename: string) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('Relatorio', 14, 20)

  autoTable(doc, {
    head: [['Coluna 1', 'Coluna 2']],
    body: data.map(item => [item.col1, item.col2]),
    startY: 30,
  })

  doc.save(`${filename}.pdf`)
}
```

### Excel com ExcelJS

```typescript
import ExcelJS from 'exceljs'

export async function exportToExcel(data: any[], filename: string) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Dados')

  // Headers
  sheet.columns = [
    { header: 'Coluna 1', key: 'col1', width: 20 },
    { header: 'Coluna 2', key: 'col2', width: 30 },
  ]

  // Data
  data.forEach(item => sheet.addRow(item))

  // Download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xlsx`
  a.click()
}
```

---

## Checklist de Implementacao

### Componente Novo

- [ ] Usar TypeScript com tipos explicitos
- [ ] Usar `cn()` para merge de classes
- [ ] Implementar variantes com CVA se necessario
- [ ] Usar `forwardRef` se precisar de ref
- [ ] Adicionar props `className` e `...rest`
- [ ] Testar acessibilidade (tab, screen reader)
- [ ] Testar responsividade
- [ ] Adicionar skeleton se tiver loading

### Hook Novo

- [ ] Marcar com `'use client'`
- [ ] Definir interface de retorno
- [ ] Usar `useCallback` para funcoes
- [ ] Tratar erros com toast
- [ ] Retornar `loading` e `error`
- [ ] Documentar parametros

### Pagina Nova

- [ ] Usar layout apropriado
- [ ] Implementar loading state
- [ ] Implementar error state
- [ ] Adicionar metadata (SEO)
- [ ] Testar em mobile
- [ ] Verificar acessibilidade

---

## Integracao com Outros Modulos

### skill-admin.md
- Componentes do painel admin
- Sidebar e navegacao

### skill-operador.md
- Componentes do painel eletronico
- Votacao e presenca display

### skill-parlamentar.md
- Tela de votacao do parlamentar
- Dashboard

### skill-transparencia.md
- Componentes do portal
- Tabelas de dados abertos
- Graficos e visualizacoes
