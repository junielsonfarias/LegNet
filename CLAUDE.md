# CLAUDE.md - Regras e Diretrizes do Projeto

---

## ⚠️ REGRA SUPREMA: DOCUMENTACAO OBRIGATORIA

> **ESTA REGRA E INVIOLAVEL E DEVE SER SEGUIDA EM TODAS AS INTERACOES**

### Arquivos que DEVEM ser Atualizados

O Claude DEVE manter atualizados os seguintes arquivos **SEMPRE** que realizar qualquer alteracao no projeto:

| Arquivo | Quando Atualizar | O que Registrar |
|---------|------------------|-----------------|
| `REGRAS-DE-NEGOCIO.md` | Ao criar/modificar regras de negocio | Novas regras RN-XXX, alteracoes em fluxos |
| `PLANO-EXECUCAO.md` | Ao concluir etapas/fases | Marcar checkboxes, atualizar status, datas |
| `ESTADO-ATUAL.md` | **SEMPRE** apos qualquer mudanca | Modulos alterados, funcionalidades, historico |
| `docs/ERROS-E-SOLUCOES.md` | Ao encontrar/corrigir erros | Novos erros, solucoes aplicadas, status |
| `docs/MELHORIAS-PROPOSTAS.md` | Ao identificar/implementar melhorias | Novas ideias, melhorias concluidas |

### Regras de Atualizacao

```
REGRA DOC-001: ATUALIZACAO IMEDIATA
Apos QUALQUER alteracao de codigo, o Claude DEVE atualizar
o arquivo ESTADO-ATUAL.md antes de encerrar a tarefa.

REGRA DOC-002: RASTREABILIDADE
Toda mudanca DEVE ser registrada no historico com:
- Data da alteracao
- Descricao do que foi feito
- Arquivos afetados

REGRA DOC-003: PLANO DE EXECUCAO
Ao trabalhar em uma fase/etapa do plano:
- Marcar etapa como "em andamento" [~] ao iniciar
- Marcar etapa como "concluida" [x] ao finalizar
- Atualizar tabela de status das fases

REGRA DOC-004: ERROS E MELHORIAS
- Erros encontrados DEVEM ser adicionados em ERROS-E-SOLUCOES.md
- Erros corrigidos DEVEM ter status atualizado para "Corrigido"
- Melhorias implementadas DEVEM ser marcadas em MELHORIAS-PROPOSTAS.md

REGRA DOC-005: REGRAS DE NEGOCIO
Ao implementar funcionalidades legislativas:
- Verificar se regra ja existe em REGRAS-DE-NEGOCIO.md
- Adicionar nova regra se necessario (proximo RN-XXX)
- Referenciar regra no codigo com comentario
```

### Template de Atualizacao do ESTADO-ATUAL.md

```markdown
### [DATA] - [Titulo da Alteracao]
- Descricao do que foi feito
- Arquivos criados/modificados
- Funcionalidades implementadas/corrigidas
- Proximos passos (se aplicavel)
```

### Checklist Obrigatorio ao Finalizar Tarefa

Antes de encerrar QUALQUER tarefa, verificar:

- [ ] ESTADO-ATUAL.md atualizado com mudancas?
- [ ] PLANO-EXECUCAO.md com etapas marcadas (se aplicavel)?
- [ ] Novos erros registrados em ERROS-E-SOLUCOES.md?
- [ ] Melhorias implementadas marcadas em MELHORIAS-PROPOSTAS.md?
- [ ] Novas regras de negocio adicionadas em REGRAS-DE-NEGOCIO.md?

**SE ALGUM ITEM NAO ESTIVER MARCADO, A TAREFA NAO ESTA COMPLETA!**

---

## REGRAS OBRIGATORIAS - CONSULTA MANDATORIA

> **ATENCAO**: Antes de qualquer implementacao relacionada ao sistema legislativo,
> o Claude DEVE consultar o arquivo `REGRAS-DE-NEGOCIO.md` para garantir conformidade
> com as regras de negocio, processo legislativo e requisitos PNTP.

### Documentos de Referencia Obrigatoria

| Documento | Caminho | Quando Consultar |
|-----------|---------|------------------|
| **Regras de Negocio** | `REGRAS-DE-NEGOCIO.md` | **SEMPRE** antes de implementar funcionalidades legislativas |
| **Plano de Execucao** | `PLANO-EXECUCAO.md` | **SEMPRE** para seguir fases e etapas do desenvolvimento |
| **Estado Atual** | `ESTADO-ATUAL.md` | Verificar status e atualizar apos mudancas |
| **Erros e Solucoes** | `docs/ERROS-E-SOLUCOES.md` | Ao encontrar bugs ou implementar correcoes |
| **Melhorias Propostas** | `docs/MELHORIAS-PROPOSTAS.md` | Ao planejar novas features |

### Validacoes Obrigatorias

Antes de implementar qualquer funcionalidade, o Claude DEVE verificar:

1. **Proposicoes**
   - Iniciativa privativa do Executivo (RN-020)
   - Requisitos minimos de conteudo (RN-022)
   - Materia analoga rejeitada (RN-023)

2. **Sessoes**
   - Quorum de instalacao (RN-040)
   - Ordem dos trabalhos (RN-043)
   - Controle de presenca (RN-044)

3. **Votacoes**
   - Quorum para cada tipo (Simples, Absoluta, Qualificada)
   - Votacao nominal quando obrigatoria (RN-061)
   - Impedimentos de parlamentares (RN-063)

4. **Tramitacao**
   - Passagem obrigatoria pela CLJ (RN-030)
   - Prazos regimentais (RN-032)
   - Parecer obrigatorio antes de pauta (RN-033)

5. **Transparencia PNTP**
   - Dados atualizados em 30 dias (RN-120)
   - Pautas publicadas 48h antes
   - Votacoes nominais publicadas

### Principios Fundamentais

```
RN-001: PUBLICIDADE - Todo ato legislativo DEVE ser publico
RN-002: LEGALIDADE - Respeitar Lei Organica e Regimento
RN-003: RASTREABILIDADE - Todo ato registrado com data, hora, usuario
RN-004: INTEGRIDADE - Documentos oficiais NAO alterados apos publicacao
```

---

## Informacoes do Projeto

**Nome**: Sistema Portal Institucional - Camara Municipal de Mojui dos Campos
**Versao**: 1.0.0
**Stack Principal**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Prisma + PostgreSQL
**Baseado em**: SAPL (Sistema de Apoio ao Processo Legislativo) do Interlegis

---

## Estrutura do Projeto

```
D:\Camara\
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Painel Administrativo (15+ modulos)
│   │   ├── api/                # API Routes (68 endpoints)
│   │   ├── institucional/      # Paginas institucionais publicas
│   │   ├── legislativo/        # Sistema legislativo publico
│   │   ├── parlamentares/      # Informacoes de parlamentares
│   │   ├── transparencia/      # Portal da Transparencia
│   │   ├── painel-publico/     # Painel eletronico publico
│   │   └── parlamentar/        # Area do parlamentar
│   ├── components/             # Componentes React (51+)
│   │   ├── ui/                 # Componentes base (Radix UI)
│   │   ├── home/               # Componentes da home
│   │   ├── layout/             # Header, Footer, layouts
│   │   ├── admin/              # Componentes do admin
│   │   └── skeletons/          # Loading skeletons
│   └── lib/                    # Utilitarios e servicos
│       ├── api/                # Clientes de API (15+)
│       ├── hooks/              # React hooks customizados (21)
│       ├── services/           # Servicos de negocio (24)
│       ├── types/              # Definicoes de tipos TypeScript
│       ├── utils/              # Utilitarios gerais
│       ├── validation/         # Schemas Zod
│       └── mock-data/          # Dados mock para desenvolvimento
├── prisma/
│   ├── schema.prisma           # Schema do banco (34 modelos)
│   └── seed.ts                 # Script de seed inicial
├── docs/                       # Documentacao do projeto
└── public/                     # Arquivos estaticos
```

---

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev                 # Servidor de desenvolvimento (localhost:3000)
npm run build               # Build de producao
npm run start               # Servidor de producao
npm run lint                # ESLint

# Banco de Dados
npm run db:generate         # Gerar cliente Prisma
npm run db:push             # Aplicar schema ao banco
npm run db:studio           # Interface visual Prisma Studio
npm run db:seed             # Popular banco com dados iniciais

# Testes
npm test                    # Executar testes Jest
npm run test:watch          # Testes em modo watch
npm run test:coverage       # Cobertura de testes

# CI/CD
npm run ci:verify           # Lint + testes
npm run ci:readiness        # Verificacao de readiness
```

---

## Modelos de Dados Principais (Prisma)

### Autenticacao e Usuarios
- **User**: Usuarios do sistema com roles (ADMIN, EDITOR, USER, PARLAMENTAR, OPERADOR, SECRETARIA)
- **Account, Session, VerificationToken**: NextAuth.js

### Legislativo
- **Legislatura**: Mandatos legislativos (anoInicio, anoFim, ativa)
- **PeriodoLegislatura**: Periodos dentro de uma legislatura
- **Parlamentar**: Vereadores com foto, biografia, partido, cargo
- **Mandato**: Mandatos de parlamentares por legislatura
- **Filiacao**: Historico de filiacoes partidarias

### Sessoes
- **Sessao**: Sessoes legislativas (ORDINARIA, EXTRAORDINARIA, SOLENE, ESPECIAL)
- **PresencaSessao**: Controle de presenca
- **PautaSessao**: Pauta da sessao com itens
- **PautaItem**: Itens da pauta (proposicoes, comunicacoes, etc)

### Proposicoes
- **Proposicao**: Projetos de lei, requerimentos, mocoes, etc
- **TipoProposicao**: PROJETO_LEI, PROJETO_RESOLUCAO, INDICACAO, REQUERIMENTO, MOCAO, etc
- **StatusProposicao**: APRESENTADA, EM_TRAMITACAO, APROVADA, REJEITADA, ARQUIVADA
- **Votacao**: Votos individuais (SIM, NAO, ABSTENCAO, AUSENTE)

### Comissoes
- **Comissao**: Comissoes (PERMANENTE, TEMPORARIA, ESPECIAL, INQUERITO)
- **MembroComissao**: Membros com cargos (PRESIDENTE, VICE_PRESIDENTE, RELATOR, MEMBRO)

### Mesa Diretora
- **MesaDiretora**: Mesa diretora de um periodo
- **MembroMesaDiretora**: Membros da mesa
- **CargoMesaDiretora**: Cargos da mesa diretora
- **HistoricoParticipacao**: Historico de participacoes

### Tramitacao
- **Tramitacao**: Tramitacao de proposicoes
- **TramitacaoTipo**: Tipos de tramitacao com prazos
- **TramitacaoUnidade**: Unidades (COMISSAO, MESA_DIRETORA, PLENARIO, PREFEITURA)
- **TramitacaoHistorico**: Historico de movimentacoes
- **RegraTramitacao**: Regras automaticas de tramitacao

### Publicacoes
- **Publicacao**: Leis, decretos, portarias, resolucoes
- **CategoriaPublicacao**: Categorias dinamicas
- **Noticia**: Noticias do portal

### Controle
- **Configuracao**: Configuracoes do sistema
- **ConfiguracaoInstitucional**: Dados da casa legislativa
- **AuditLog**: Log de auditoria de acoes
- **ApiToken**: Tokens para integracao externa

---

## Padroes de Codigo

### Nomenclatura de Arquivos
- **Componentes**: PascalCase (`UserCard.tsx`)
- **Hooks**: useXxx (`use-parlamentares.ts`)
- **Services**: xxxService.ts (`proposicoes-service.ts`)
- **APIs**: xxxApi.ts (`parlamentares-api.ts`)
- **Tipos**: types.ts ou domain.ts
- **Arquivos gerais**: kebab-case (`admin-sidebar.tsx`)

### Estrutura de Componentes React
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

### Estrutura de API Routes
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

### Estrutura de Servicos
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

### Validacao com Zod
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

## Regras de Negocio Legislativo

### Sessoes Legislativas
1. **Tipos de Sessao**:
   - ORDINARIA: Sessoes regulares conforme calendario
   - EXTRAORDINARIA: Convocadas para assuntos urgentes
   - SOLENE: Homenagens e datas comemorativas
   - ESPECIAL: Eventos especiais

2. **Status de Sessao**:
   - AGENDADA -> EM_ANDAMENTO -> CONCLUIDA
   - AGENDADA -> CANCELADA (se necessario)

3. **Pauta de Sessao**:
   - Secoes: EXPEDIENTE, ORDEM_DO_DIA, COMUNICACOES, HONRAS, OUTROS
   - Status dos itens: PENDENTE, EM_DISCUSSAO, EM_VOTACAO, APROVADO, REJEITADO, RETIRADO, ADIADO

### Proposicoes
1. **Fluxo de Tramitacao**:
   - APRESENTADA -> EM_TRAMITACAO -> APROVADA/REJEITADA/ARQUIVADA
   - Pode passar por comissoes antes do plenario

2. **Numeracao**:
   - Formato: NUMERO/ANO (ex: 001/2024)
   - Sequencial por tipo e ano

3. **Tipos de Votacao**:
   - SIM, NAO, ABSTENCAO, AUSENTE
   - Resultado: APROVADA, REJEITADA, EMPATE

### Mesa Diretora
1. **Composicao**: Presidente, Vice-Presidente, Secretarios
2. **Mandato**: Vinculado ao periodo da legislatura
3. **Apenas um membro ativo por cargo por vez

### Comissoes
1. **Tipos**: PERMANENTE, TEMPORARIA, ESPECIAL, INQUERITO
2. **Cargos**: PRESIDENTE, VICE_PRESIDENTE, RELATOR, MEMBRO
3. **Membro pode participar de multiplas comissoes

---

## Autenticacao e Autorizacao

### Roles do Sistema
```typescript
enum UserRole {
  ADMIN       // Acesso total ao sistema
  EDITOR      // Pode editar conteudo (noticias, publicacoes)
  USER        // Acesso basico de leitura
  PARLAMENTAR // Acesso a area do parlamentar
  OPERADOR    // Opera painel eletronico
  SECRETARIA  // Acesso administrativo limitado
}
```

### Protecao de Rotas
- **Publicas**: /, /parlamentares, /transparencia, /legislativo, /noticias
- **Autenticadas**: /admin/*, /api/* (maioria)
- **Publicas API**: /api/integracoes/public/*, /api/publico/*

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

## Integracao com SAPL

Este projeto foi desenvolvido com base nas melhores praticas do SAPL (Sistema de Apoio ao Processo Legislativo) do Interlegis:

1. **Estrutura de Pautas**: Hierarquia Sessao -> Expediente -> Ordem do Dia
2. **Tramitacao**: Fluxo configuravel com prazos regimentais
3. **Votacao**: Sistema de votacao nominal com registro
4. **Transparencia**: Portal publico com acesso a todos os documentos
5. **Participacao Cidada**: Sugestoes, consultas publicas, enquetes

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

---

## Atualizacao do Estado

Apos qualquer modificacao significativa no projeto, **SEMPRE** atualize o arquivo `ESTADO-ATUAL.md` com:
- Novas funcionalidades implementadas
- Bugs corrigidos
- Mudancas no schema do banco
- Novas APIs criadas
- Componentes adicionados

---

## Documentacao Completa

### Arquivos de Referencia

| Arquivo | Descricao | Obrigatorio |
|---------|-----------|-------------|
| `REGRAS-DE-NEGOCIO.md` | Regras completas do processo legislativo e PNTP | **SIM** |
| `ESTADO-ATUAL.md` | Status atual de cada modulo do sistema | SIM |
| `docs/ERROS-E-SOLUCOES.md` | Erros identificados e solucoes propostas | Quando relevante |
| `docs/MELHORIAS-PROPOSTAS.md` | Roadmap de melhorias planejadas | Quando relevante |
| `docs/analise-sapl-sugestoes-melhorias.md` | Analise baseada no SAPL | Referencia |
| `docs/caderno-de-exercicios-do-sapl.pdf` | Manual oficial do SAPL | Referencia |

### Referencias Externas

- **SAPL**: [Sistema de Apoio ao Processo Legislativo](https://www12.senado.leg.br/interlegis/produtos/sapl)
- **PNTP**: [Programa Nacional de Transparencia Publica](https://radardatransparencia.com/)
- **LAI**: Lei 12.527/2011 - Lei de Acesso a Informacao
- **Interlegis**: Portal do Senado para casas legislativas

---

## Fluxo de Trabalho do Claude

### Antes de Implementar

```
1. CONSULTAR REGRAS-DE-NEGOCIO.md
   - Identificar regras aplicaveis (RN-XXX)
   - Verificar validacoes obrigatorias
   - Confirmar requisitos PNTP

2. VERIFICAR ESTADO-ATUAL.md
   - Status do modulo relacionado
   - Dependencias existentes
   - Erros conhecidos

3. PLANEJAR IMPLEMENTACAO
   - Respeitar padroes de codigo
   - Seguir estrutura de pastas
   - Usar validacao Zod
```

### Apos Implementar

```
1. ATUALIZAR ESTADO-ATUAL.md
   - Marcar funcionalidade como implementada
   - Documentar mudancas no schema
   - Registrar novas APIs

2. VERIFICAR CONFORMIDADE
   - Validacoes de negocio aplicadas?
   - Dados publicos no portal?
   - Auditoria implementada?

3. TESTAR
   - Fluxo completo funciona?
   - Regras de quorum respeitadas?
   - Prazos calculados corretamente?
```

---

## Resumo de Regras Criticas

### Processo Legislativo
- Toda proposicao DEVE passar pela CLJ (exceto excecoes regimentais)
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

> **LEMBRETE FINAL**: Este sistema e a base digital para o funcionamento
> democratico da Camara Municipal. Toda implementacao deve priorizar
> transparencia, legalidade e acessibilidade ao cidadao.
