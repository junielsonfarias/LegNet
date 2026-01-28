# CLAUDE.md - Regras e Diretrizes do Projeto

---

## REGRA SUPREMA: DOCUMENTACAO OBRIGATORIA

> **ESTA REGRA E INVIOLAVEL E DEVE SER SEGUIDA EM TODAS AS INTERACOES**

### Arquivos que DEVEM ser Atualizados

| Arquivo | Quando Atualizar | O que Registrar |
|---------|------------------|-----------------|
| `REGRAS-DE-NEGOCIO.md` | Ao criar/modificar regras de negocio | Novas regras RN-XXX |
| `PLANO-EXECUCAO.md` | Ao concluir etapas/fases | Marcar checkboxes, status |
| `ESTADO-ATUAL.md` | **SEMPRE** apos qualquer mudanca | Modulos alterados, historico |
| `docs/ERROS-E-SOLUCOES.md` | Ao encontrar/corrigir erros | Erros, solucoes, status |
| `docs/MELHORIAS-PROPOSTAS.md` | Ao identificar/implementar melhorias | Novas ideias |
| `docs/skills/skill-*.md` | **Ao modificar modulo correspondente** | APIs, servicos, componentes, regras |

### Regras de Atualizacao

- **DOC-001**: Apos QUALQUER alteracao de codigo, atualizar ESTADO-ATUAL.md
- **DOC-002**: Toda mudanca registrada com data, descricao, arquivos afetados
- **DOC-003**: Marcar etapas como [~] em andamento ou [x] concluida
- **DOC-004**: Erros encontrados DEVEM ir para ERROS-E-SOLUCOES.md
- **DOC-005**: Verificar REGRAS-DE-NEGOCIO.md antes de implementar
- **DOC-006**: ANTES de implementar, consultar a SKILL correspondente ao modulo
- **DOC-007**: APOS implementar, ATUALIZAR a SKILL com as mudancas realizadas

### Checklist ao Finalizar Tarefa

- [ ] ESTADO-ATUAL.md atualizado?
- [ ] PLANO-EXECUCAO.md com etapas marcadas?
- [ ] Novos erros registrados?
- [ ] Melhorias marcadas?
- [ ] Novas regras de negocio adicionadas?
- [ ] **SKILL do modulo atualizada?**

### Manutencao de Skills (OBRIGATORIO)

> As skills em `docs/skills/` sao documentacao VIVA e devem refletir o estado atual do sistema

#### Antes de Implementar

1. Identificar qual(is) skill(s) corresponde(m) ao modulo afetado
2. LER a skill para entender:
   - Arquivos existentes e suas funcoes
   - APIs e endpoints disponiveis
   - Regras de negocio aplicaveis
   - Fluxos e validacoes obrigatorias
3. Seguir os padroes documentados na skill

#### Apos Implementar

1. ATUALIZAR a skill correspondente com:
   - Novos arquivos criados (tabela "Arquivos Principais")
   - Novas APIs/endpoints (tabela "APIs e Endpoints")
   - Novos campos em modelos Prisma
   - Novas funcoes em servicos
   - Novas regras de negocio (RN-XXX)
   - Novos componentes React
   - Atualizar exemplos de codigo se necessario
   - Marcar itens no checklist de implementacao

#### Mapeamento Skill x Modulo

| Se mexer em... | Atualizar skill... |
|----------------|-------------------|
| Componentes UI, hooks, design tokens, Tailwind | `skill-frontend.md` |
| Proposicoes, emendas, tramitacao | `skill-legislativo.md` |
| Painel operador, votacao tempo real | `skill-operador.md` |
| Comissoes, reunioes, pareceres | `skill-comissoes.md` |
| Portal transparencia, dados abertos | `skill-transparencia.md` |
| Area /parlamentar, votacao parlamentar | `skill-parlamentar.md` |
| Usuarios, roles, configuracoes | `skill-admin.md` |
| Protocolo, pautas, atas | `skill-secretaria.md` |
| APIs publicas, webhooks | `skill-integracoes.md` |

---

## CONSULTA MANDATORIA

> Antes de implementar funcionalidades legislativas, CONSULTAR:
> - `REGRAS-DE-NEGOCIO.md` - Regras RN-XXX e requisitos PNTP
> - `docs/FLUXO-LEGISLATIVO.md` - Fluxo completo de documentos

### Validacoes Obrigatorias

1. **Proposicoes**: Iniciativa privativa (RN-020), requisitos (RN-022)
2. **Sessoes**: Quorum de instalacao (RN-040), ordem dos trabalhos (RN-043)
3. **Votacoes**: Quorum por tipo, votacao nominal (RN-061)
4. **Tramitacao**: Passagem pela CLJ (RN-030), prazos (RN-032)
5. **Transparencia**: Dados em 30 dias (RN-120), pautas 48h antes

### Principios Fundamentais

- **RN-001**: PUBLICIDADE - Todo ato legislativo DEVE ser publico
- **RN-002**: LEGALIDADE - Respeitar Lei Organica e Regimento
- **RN-003**: RASTREABILIDADE - Todo ato com data, hora, usuario
- **RN-004**: INTEGRIDADE - Documentos oficiais NAO alterados apos publicacao

---

## Informacoes do Projeto

**Nome**: Sistema Portal Institucional - Camara Municipal de Mojui dos Campos
**Stack**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Prisma + PostgreSQL
**Baseado em**: SAPL (Sistema de Apoio ao Processo Legislativo) do Interlegis

---

## Estrutura do Projeto

```
D:\Camara\
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Painel Administrativo
│   │   ├── api/                # API Routes
│   │   ├── institucional/      # Paginas institucionais
│   │   ├── legislativo/        # Sistema legislativo
│   │   ├── parlamentares/      # Informacoes de parlamentares
│   │   ├── transparencia/      # Portal da Transparencia
│   │   └── parlamentar/        # Area do parlamentar
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes base (Radix UI)
│   │   ├── home/               # Componentes da home
│   │   ├── layout/             # Header, Footer, layouts
│   │   └── admin/              # Componentes do admin
│   └── lib/                    # Utilitarios e servicos
│       ├── api/                # Clientes de API
│       ├── hooks/              # React hooks customizados
│       ├── services/           # Servicos de negocio
│       ├── types/              # Tipos TypeScript
│       ├── utils/              # Utilitarios gerais
│       └── validation/         # Schemas Zod
├── prisma/
│   ├── schema.prisma           # Schema do banco
│   └── seed.ts                 # Script de seed
└── docs/                       # Documentacao detalhada
```

---

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev                 # Servidor localhost:3000
npm run build               # Build de producao
npm run lint                # ESLint

# Banco de Dados
npm run db:generate         # Gerar cliente Prisma
npm run db:push             # Aplicar schema ao banco
npm run db:studio           # Interface visual Prisma Studio
npm run db:seed             # Popular banco com dados iniciais
```

---

## Documentacao Detalhada

> Para manter o CLAUDE.md compacto, a documentacao detalhada foi separada:

| Documento | Conteudo |
|-----------|----------|
| `docs/PADROES-CODIGO.md` | Nomenclatura, estrutura de componentes, APIs, servicos, Zod, boas praticas |
| `docs/MODELOS-DADOS.md` | Modelos Prisma, relacionamentos, regras de negocio dos modelos |
| `docs/FLUXO-LEGISLATIVO.md` | **IMPORTANTE** - Fluxo completo de tramitacao, sessoes, votacoes, comissoes |
| `REGRAS-DE-NEGOCIO.md` | Regras RN-XXX completas do processo legislativo e PNTP |
| `ESTADO-ATUAL.md` | Status atual de cada modulo do sistema |

---

## Skills de Referencia

> **IMPORTANTE**: As skills sao DOCUMENTACAO VIVA. Consulte ANTES de implementar e ATUALIZE APOS modificar:

| Skill | Arquivo | Consultar Quando |
|-------|---------|------------------|
| **Frontend** | `docs/skills/skill-frontend.md` | Componentes, hooks, design tokens, acessibilidade, Tailwind |
| **Legislativo** | `docs/skills/skill-legislativo.md` | Proposicoes, votacoes, tramitacao, emendas, pareceres |
| **Operador** | `docs/skills/skill-operador.md` | Painel eletronico, sessao em tempo real, quorum |
| **Comissoes** | `docs/skills/skill-comissoes.md` | Comissoes, reunioes, pareceres, CPI |
| **Transparencia** | `docs/skills/skill-transparencia.md` | Portal PNTP, dados abertos, acessibilidade |
| **Parlamentar** | `docs/skills/skill-parlamentar.md` | Area do parlamentar, votacao, dashboard |
| **Admin** | `docs/skills/skill-admin.md` | Configuracoes, usuarios, auditoria, permissoes |
| **Secretaria** | `docs/skills/skill-secretaria.md` | Protocolo, pautas, tramitacao, atas |
| **Integracoes** | `docs/skills/skill-integracoes.md` | APIs publicas, webhooks, sistemas externos |

### Conteudo das Skills

Cada skill contem:
- Visao geral do modulo
- Arquivos principais
- Modelos de dados (Prisma)
- APIs e endpoints
- Servicos de negocio
- Regras de negocio (RN-XXX)
- Fluxos em ASCII
- Validacoes obrigatorias
- Componentes React
- Exemplos de codigo
- Checklist de implementacao

---

## Padroes de Codigo (Resumo)

### Nomenclatura
- **Componentes**: PascalCase (`UserCard.tsx`)
- **Hooks**: useXxx (`use-parlamentares.ts`)
- **Services**: xxxService.ts
- **Arquivos gerais**: kebab-case

### Estrutura Basica de Componente
```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Parlamentar } from '@prisma/client'

interface Props { data: Parlamentar }

export function Component({ data }: Props) {
  const [state, setState] = useState(false)
  return <div>...</div>
}
```

### Estrutura Basica de API
```tsx
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const data = await prisma.model.findMany()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

> **Detalhes completos em**: `docs/PADROES-CODIGO.md`

---

## Roles do Sistema

```typescript
enum UserRole {
  ADMIN       // Acesso total
  EDITOR      // Edita conteudo
  USER        // Leitura basica
  PARLAMENTAR // Area do parlamentar
  OPERADOR    // Opera painel eletronico
  SECRETARIA  // Administrativo limitado
}
```

### Rotas
- **Publicas**: /, /parlamentares, /transparencia, /legislativo
- **Autenticadas**: /admin/*, /api/*
- **Publicas API**: /api/integracoes/public/*, /api/publico/*

---

## Fluxo de Trabalho

### Antes de Implementar

1. Consultar `REGRAS-DE-NEGOCIO.md` - Identificar regras RN-XXX
2. Consultar `docs/FLUXO-LEGISLATIVO.md` - Se envolver tramitacao/sessoes
3. Verificar `ESTADO-ATUAL.md` - Status e dependencias

### Apos Implementar

1. Atualizar `ESTADO-ATUAL.md` - Funcionalidade, APIs, schema
2. Verificar conformidade - Validacoes, dados publicos, auditoria
3. Testar fluxo completo

---

## Resumo de Regras Criticas

### Processo Legislativo
- Toda proposicao DEVE passar pela CLJ
- Votacao DEVE ter quorum verificado ANTES de iniciar
- Vetos DEVEM ser apreciados em 30 dias
- Leis so entram em vigor apos publicacao

### Transparencia PNTP (Nivel Diamante)
- Votacoes nominais: atualizadas em 30 dias
- Presenca em sessoes: atualizadas em 30 dias
- Pautas: publicadas 48h antes da sessao
- Atas: publicadas em 15 dias apos aprovacao
- Contratos: publicados em 24h apos assinatura

### Seguranca e Auditoria
- Todo ato registrado com usuario, data, hora, IP
- Documentos oficiais NAO podem ser alterados
- Logs de auditoria NAO podem ser excluidos
- Votacao so por parlamentar autenticado com mandato ativo

---

## Referencias

- **SAPL**: Sistema de Apoio ao Processo Legislativo (Interlegis)
- **PNTP**: Programa Nacional de Transparencia Publica
- **LAI**: Lei 12.527/2011 - Lei de Acesso a Informacao

---

> **LEMBRETE**: Este sistema e a base digital para o funcionamento democratico
> da Camara Municipal. Toda implementacao deve priorizar transparencia,
> legalidade e acessibilidade ao cidadao.
