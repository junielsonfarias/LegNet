# Padroes de Codigo

> Referencia completa de padroes de codigo do projeto.
> Documento separado do CLAUDE.md principal.

---

## Nomenclatura de Arquivos

- **Componentes**: PascalCase (`UserCard.tsx`)
- **Hooks**: useXxx (`use-parlamentares.ts`)
- **Services**: xxxService.ts (`proposicoes-service.ts`)
- **APIs**: xxxApi.ts (`parlamentares-api.ts`)
- **Tipos**: types.ts ou domain.ts
- **Arquivos gerais**: kebab-case (`admin-sidebar.tsx`)

---

## Estrutura de Componentes React

```tsx
// Imports organizados: externos, internos, tipos
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Parlamentar } from '@prisma/client'

// Props tipadas
interface ComponentProps {
  data: Parlamentar
  onSave: (data: Parlamentar) => void
}

// Componente funcional com export nomeado
export function Component({ data, onSave }: ComponentProps) {
  // Hooks primeiro
  const [state, setState] = useState(false)

  // Handlers
  const handleClick = () => {}

  // Render
  return <div>...</div>
}
```

---

## Estrutura de API Routes

```tsx
// src/app/api/[recurso]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticacao se necessario
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    // Logica de negocio
    const data = await prisma.model.findMany()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

---

## Estrutura de Servicos

```tsx
// src/lib/services/xxx-service.ts
import { prisma } from '@/lib/prisma'
import type { Model } from '@prisma/client'

export class XxxService {
  static async findAll(): Promise<Model[]> {
    return prisma.model.findMany()
  }

  static async findById(id: string): Promise<Model | null> {
    return prisma.model.findUnique({ where: { id } })
  }

  static async create(data: Partial<Model>): Promise<Model> {
    return prisma.model.create({ data })
  }
}
```

---

## Validacao com Zod

```tsx
import { z } from 'zod'

export const parlamentarSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email invalido').optional(),
  partido: z.string().optional(),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'VEREADOR']),
  ativo: z.boolean().default(true),
})

export type ParlamentarInput = z.infer<typeof parlamentarSchema>
```

---

## Boas Praticas

### Performance
- Usar `React.memo()` para componentes que recebem as mesmas props
- Usar `useMemo()` e `useCallback()` para calculos pesados
- Lazy loading de componentes grandes com `next/dynamic`
- Otimizar imagens com `next/image`

### Seguranca
- Sempre validar entrada de dados com Zod
- Sanitizar dados antes de exibir (prevenir XSS)
- Usar prepared statements (Prisma faz automaticamente)
- Verificar autorizacao em todas as APIs protegidas
- Nunca expor dados sensiveis no cliente

### Acessibilidade
- Usar componentes Radix UI (acessiveis por padrao)
- Adicionar `aria-labels` quando necessario
- Garantir contraste adequado de cores
- Suportar navegacao por teclado

### Tratamento de Erros
- Try-catch em todas as operacoes async
- Retornar mensagens de erro amigaveis
- Logar erros para debugging
- Usar toast/notifications para feedback ao usuario

---

## Variaveis de Ambiente

```env
# Obrigatorias
DATABASE_URL="postgresql://user:pass@localhost:5432/camara_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="chave-secreta-segura"

# Opcionais
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="email@example.com"
EMAIL_SERVER_PASSWORD="senha"
EMAIL_FROM="noreply@camara.gov.br"

UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=10485760

SITE_NAME="Camara Municipal de Mojui dos Campos"
SITE_URL="http://localhost:3000"
```

---

## Checklist para Novas Features

- [ ] Criar modelo no Prisma (se necessario)
- [ ] Criar/atualizar tipos TypeScript
- [ ] Criar schema de validacao Zod
- [ ] Implementar API routes (GET, POST, PUT, DELETE)
- [ ] Criar servico de negocio
- [ ] Criar hook customizado para o frontend
- [ ] Implementar componentes de UI
- [ ] Adicionar paginas no admin e/ou portal
- [ ] Testar fluxo completo
- [ ] Atualizar documentacao
