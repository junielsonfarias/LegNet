# Erros Identificados e Solucoes Propostas

> **Data da Analise**: 2026-01-16
> **Ultima Atualizacao**: 2026-01-16
> **Versao Analisada**: 1.0.0

---

## Sumario de Erros

| Severidade | Quantidade | Status |
|------------|------------|--------|
| Critica | 3 | Corrigidos |
| Alta | 3 | Pendente |
| Media | 10 | 7 Corrigidos / 3 Pendente |
| Baixa | 6 | Pendente |

---

## Erros Criticos (Corrigidos em 2026-01-16)

### ERR-018: Codigo Duplicado em route.ts (CORRIGIDO)

**Localizacao**:
- `src/app/api/sessoes/[id]/pauta/route.ts`
- `src/app/api/pauta/[itemId]/route.ts`
- `src/app/admin/configuracoes/page.tsx`

**Descricao**: Arquivos continham codigo duplicado (arquivo inteiro repetido 2-3x), causando erros de webpack "export redefined".

**Status**: CORRIGIDO - Codigo duplicado removido

---

### ERR-019: Mock DB Incompativel com Prisma Real (PENDENTE)

**Localizacao**: `src/lib/db.ts`

**Descricao**: O mock database tem tipagens incompativeis com o Prisma real:
- IDs tipados como `number` quando deveriam ser `string | number`
- Propriedade `mandatos` ausente no tipo de parlamentar
- Funcao `findFirst` ausente em varios modelos

**Impacto**:
- Build falha com erros de tipo
- Desenvolvimento dependente do mock nao funciona

**Solucao Proposta**:
1. Corrigir tipagens no `db.ts` para aceitar `string | number` em IDs
2. Adicionar propriedades faltantes (mandatos, filiacoes) ao mock de parlamentar
3. Implementar `findFirst` nos modelos que faltam
4. Ou: configurar banco PostgreSQL real para desenvolvimento

**Status**: PENDENTE - Requer correcao do mock ou migracao para banco real

---

### ERR-020: Tipagem Restritiva em Formularios (CORRIGIDO)

**Localizacao**:
- `src/app/admin/sessoes-legislativas/page.tsx`
- `src/app/admin/usuarios/page.tsx`
- `src/app/admin/templates-sessao/page.tsx`

**Descricao**: Estados de formulario usando `as const` criavam tipos literais muito restritivos, impedindo atribuicao de outros valores validos.

**Status**: CORRIGIDO - Tipos expandidos para incluir todas as opcoes validas

---

## Erros de Alta Prioridade

### ERR-001: Falta de Tratamento de Erros Consistente nas APIs

**Localizacao**: `src/app/api/**/route.ts`

**Descricao**: Algumas rotas de API nao possuem tratamento de erros adequado, podendo retornar erros genericos ou expor informacoes sensiveis.

**Impacto**:
- Erros nao tratados podem derrubar requisicoes
- Mensagens de erro podem expor detalhes internos
- Dificuldade de debugging em producao

**Solucao Proposta**:
```typescript
// Criar middleware de tratamento de erros
// src/lib/middleware/error-handler.ts

import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, context: string) {
  console.error(`[${context}] Error:`, error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: error.errors },
      { status: 400 }
    )
  }

  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Registro duplicado' },
        { status: 409 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Registro nao encontrado' },
        { status: 404 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  )
}
```

**Arquivos Afetados**:
- `src/app/api/parlamentares/route.ts`
- `src/app/api/sessoes/route.ts`
- `src/app/api/proposicoes/route.ts`
- E outros endpoints

**Estimativa de Correcao**: 4-6 horas

---

### ERR-002: Validacao Incompleta de Dados de Entrada

**Localizacao**: `src/app/api/**/route.ts`, `src/lib/validation/schemas.ts`

**Descricao**: Nem todos os endpoints possuem validacao Zod completa, permitindo dados malformados ou incompletos.

**Impacto**:
- Dados inconsistentes no banco
- Erros de runtime
- Potenciais vulnerabilidades de seguranca

**Solucao Proposta**:
```typescript
// Completar schemas de validacao
// src/lib/validation/schemas.ts

export const parlamentarSchema = z.object({
  nome: z.string().min(3).max(100),
  email: z.string().email().optional().nullable(),
  telefone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/).optional().nullable(),
  partido: z.string().max(50).optional().nullable(),
  biografia: z.string().max(5000).optional().nullable(),
  foto: z.string().url().optional().nullable(),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  legislatura: z.string().min(1),
  ativo: z.boolean().default(true),
})

export const sessaoSchema = z.object({
  numero: z.number().int().positive(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']),
  data: z.string().datetime(),
  horario: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  local: z.string().max(200).optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).default('AGENDADA'),
  descricao: z.string().max(2000).optional(),
  legislaturaId: z.string().cuid().optional(),
  periodoId: z.string().cuid().optional(),
})

// Adicionar schemas para todos os modelos
```

**Estimativa de Correcao**: 6-8 horas

---

### ERR-003: Ausencia de Rate Limiting Global

**Localizacao**: API Routes

**Descricao**: Nao ha limitacao de taxa de requisicoes em todas as rotas, expondo o sistema a ataques de forca bruta ou DDoS.

**Impacto**:
- Vulnerabilidade a ataques
- Sobrecarga do servidor
- Custos elevados de infraestrutura

**Solucao Proposta**:
```typescript
// Criar middleware de rate limiting
// src/lib/middleware/rate-limit.ts

import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

const RATE_LIMIT = {
  PUBLIC: { requests: 60, window: 60000 },     // 60 req/min
  AUTHENTICATED: { requests: 120, window: 60000 }, // 120 req/min
  AUTH: { requests: 10, window: 300000 },      // 10 req/5min para login
}

export function rateLimit(request: NextRequest, type: keyof typeof RATE_LIMIT = 'PUBLIC') {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()
  const limit = RATE_LIMIT[type]

  const record = rateLimitMap.get(key)

  if (!record || now - record.timestamp > limit.window) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return null
  }

  if (record.count >= limit.requests) {
    return NextResponse.json(
      { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.window - (now - record.timestamp)) / 1000)) } }
    )
  }

  record.count++
  return null
}
```

**Estimativa de Correcao**: 3-4 horas

---

## Erros de Media Prioridade

### ERR-004: Falta de Indices no Banco de Dados

**Localizacao**: `prisma/schema.prisma`

**Descricao**: Algumas tabelas carecem de indices adequados para consultas frequentes, impactando performance.

**Solucao Proposta**:
```prisma
// Adicionar indices ao schema

model Proposicao {
  // ... campos existentes

  @@index([status, dataApresentacao])
  @@index([autorId, ano])
  @@index([tipo, status])
}

model Sessao {
  // ... campos existentes

  @@index([status, data])
  @@index([legislaturaId, tipo])
}

model Tramitacao {
  // ... campos existentes

  @@index([status, prazoVencimento])
  @@index([unidadeId, status])
}

model Publicacao {
  // ... campos existentes

  @@index([tipo, publicada, data])
  @@index([ano, tipo])
}
```

**Estimativa de Correcao**: 2-3 horas

---

### ERR-005: Queries N+1 em Listagens

**Localizacao**: `src/app/api/**/route.ts`

**Descricao**: Algumas consultas fazem multiplas requisicoes ao banco quando poderiam usar includes/joins.

**Exemplo do Problema**:
```typescript
// ERRADO - N+1 queries
const parlamentares = await prisma.parlamentar.findMany()
for (const p of parlamentares) {
  p.mandatos = await prisma.mandato.findMany({ where: { parlamentarId: p.id } })
}
```

**Solucao Proposta**:
```typescript
// CORRETO - Uma query com include
const parlamentares = await prisma.parlamentar.findMany({
  include: {
    mandatos: true,
    filiacoes: { where: { ativa: true } },
    comissoes: { where: { ativo: true } },
  }
})
```

**Arquivos para Revisar**:
- `src/app/api/parlamentares/route.ts`
- `src/app/api/sessoes/route.ts`
- `src/app/api/comissoes/route.ts`

**Estimativa de Correcao**: 4-6 horas

---

### ERR-006: Falta de Paginacao em Listagens

**Localizacao**: Varios endpoints de API

**Descricao**: Algumas listagens retornam todos os registros sem paginacao, podendo causar problemas de performance.

**Solucao Proposta**:
```typescript
// Padronizar paginacao
// src/lib/utils/pagination.ts

export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20)),
    orderBy: searchParams.get('orderBy') || 'createdAt',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
  }
}

export function getPrismaParams(params: PaginationParams) {
  return {
    skip: (params.page! - 1) * params.limit!,
    take: params.limit,
    orderBy: { [params.orderBy!]: params.order },
  }
}

// Uso em API route
export async function GET(request: NextRequest) {
  const params = getPaginationParams(request.nextUrl.searchParams)

  const [items, total] = await Promise.all([
    prisma.model.findMany({
      ...getPrismaParams(params),
      where: { /* filtros */ },
    }),
    prisma.model.count({ where: { /* filtros */ } }),
  ])

  return NextResponse.json({
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit!),
    },
  })
}
```

**Estimativa de Correcao**: 4-6 horas

---

### ERR-007: Inconsistencia no Formato de Datas

**Localizacao**: Frontend e Backend

**Descricao**: Datas sao formatadas de formas diferentes em varias partes do sistema.

**Solucao Proposta**:
```typescript
// Centralizar formatacao de datas
// src/lib/utils/date.ts

import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: "dd 'de' MMMM 'de' yyyy",
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
}

export function formatDate(date: Date | string | null | undefined, formatStr: keyof typeof DATE_FORMATS = 'SHORT'): string {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return '-'

  return format(dateObj, DATE_FORMATS[formatStr], { locale: ptBR })
}

export function formatDateRange(start: Date | string, end: Date | string | null): string {
  const startStr = formatDate(start)
  const endStr = end ? formatDate(end) : 'Atual'
  return `${startStr} - ${endStr}`
}
```

**Estimativa de Correcao**: 2-3 horas

---

### ERR-008: Falta de Loading States em Componentes

**Localizacao**: `src/components/**/*.tsx`

**Descricao**: Alguns componentes nao mostram estado de carregamento durante operacoes async.

**Solucao Proposta**:
```tsx
// Usar Suspense e loading states
// Exemplo de componente com loading

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onSave()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Salvando...' : 'Salvar'}
    </Button>
  )
}
```

**Estimativa de Correcao**: 4-6 horas

---

### ERR-009: Falta de Confirmacao em Acoes Destrutivas

**Localizacao**: Componentes de admin

**Descricao**: Algumas acoes de exclusao nao pedem confirmacao do usuario.

**Solucao Proposta**:
```tsx
// Criar componente de confirmacao reutilizavel
// src/components/ui/confirm-dialog.tsx

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Estimativa de Correcao**: 3-4 horas

---

### ERR-010: Logs Inconsistentes

**Localizacao**: Todo o projeto

**Descricao**: Logs usam console.log/error de forma inconsistente sem estrutura padronizada.

**Solucao Proposta**:
```typescript
// Criar sistema de logging estruturado
// src/lib/logging/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  metadata?: Record<string, unknown>
  timestamp: string
}

class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      metadata,
      timestamp: new Date().toISOString(),
    }

    if (process.env.NODE_ENV === 'production') {
      // Em producao, enviar para servico de logging
      console[level](JSON.stringify(entry))
    } else {
      // Em desenvolvimento, formato legivel
      console[level](`[${entry.timestamp}] [${this.context}] ${message}`, metadata || '')
    }
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.log('debug', message, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.log('error', message, metadata)
  }
}

export function createLogger(context: string) {
  return new Logger(context)
}

// Uso
const logger = createLogger('ParlamentaresAPI')
logger.info('Parlamentar criado', { id: parlamentar.id })
logger.error('Falha ao criar parlamentar', { error: err.message })
```

**Estimativa de Correcao**: 4-6 horas

---

### ERR-011: Falta de Cache em Consultas Frequentes

**Localizacao**: APIs e Frontend

**Descricao**: Dados que raramente mudam sao buscados do banco a cada requisicao.

**Solucao Proposta**:
```typescript
// Implementar cache simples em memoria
// src/lib/cache/memory-cache.ts

interface CacheEntry<T> {
  data: T
  expiry: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new MemoryCache()

// Uso
const CACHE_KEY = 'legislaturas:ativas'
let legislaturas = cache.get<Legislatura[]>(CACHE_KEY)
if (!legislaturas) {
  legislaturas = await prisma.legislatura.findMany({ where: { ativa: true } })
  cache.set(CACHE_KEY, legislaturas, 3600) // 1 hora
}
```

**Estimativa de Correcao**: 4-6 horas

---

## Erros de Baixa Prioridade

### ERR-012: Componentes sem Memoizacao

**Descricao**: Componentes que recebem props complexas re-renderizam desnecessariamente.

**Solucao**: Usar `React.memo()`, `useMemo()`, `useCallback()` onde apropriado.

**Estimativa**: 2-3 horas

---

### ERR-013: Imagens sem Otimizacao

**Descricao**: Algumas imagens nao usam `next/image` para otimizacao automatica.

**Solucao**: Substituir `<img>` por `<Image>` do Next.js.

**Estimativa**: 1-2 horas

---

### ERR-014: Falta de Testes Unitarios

**Descricao**: Cobertura de testes baixa (~30%).

**Solucao**: Escrever testes para servicos e hooks principais.

**Estimativa**: 8-12 horas

---

### ERR-015: Acessibilidade Incompleta

**Descricao**: Alguns elementos carecem de aria-labels e navegacao por teclado.

**Solucao**: Auditar com ferramentas como axe-core e corrigir.

**Estimativa**: 4-6 horas

---

### ERR-016: Falta de SEO em Paginas Publicas

**Descricao**: Metadados SEO incompletos em algumas paginas.

**Solucao**: Adicionar metadata completo a todas as paginas publicas.

**Estimativa**: 2-3 horas

---

### ERR-017: Console Warnings em Dependencias

**Descricao**: Algumas dependencias geram warnings no console.

**Solucao**: Atualizar dependencias ou suprimir warnings especificos.

**Estimativa**: 1-2 horas

---

## Resumo de Esforco

| Prioridade | Quantidade | Horas Estimadas |
|------------|------------|-----------------|
| Alta | 3 | 13-18 horas |
| Media | 8 | 27-40 horas |
| Baixa | 6 | 18-28 horas |
| **Total** | **17** | **58-86 horas** |

---

## Proximos Passos Recomendados

1. **Imediato**: Corrigir ERR-001, ERR-002, ERR-003 (seguranca)
2. **Curto Prazo**: ERR-004, ERR-005, ERR-006 (performance)
3. **Medio Prazo**: ERR-007 a ERR-011 (qualidade)
4. **Longo Prazo**: ERR-012 a ERR-017 (polimento)
