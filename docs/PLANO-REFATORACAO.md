# PLANO DE REFATORACAO - Sistema Portal Institucional

> **Data**: 2026-01-30
> **Baseado em**: `docs/skills/skill_refatoracao.md`
> **Status**: PLANEJAMENTO

---

## 1. DIAGNOSTICO INICIAL

### 1.1 Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Arquivos TSX | 271 |
| Arquivos TS | 382 |
| APIs | 158 |
| Modelos Prisma | 84 |
| Servicos | 61 |
| Hooks | 40 |
| Linhas com Problemas | ~15.000 |
| Codigo Duplicado | ~5.200 linhas |

### 1.2 Problemas Criticos Identificados

| Problema | Arquivos | Linhas | Impacto |
|----------|----------|--------|---------|
| Duplicacao de Servicos | 4 pares | 5.200 | Alto - Manutencao dificil |
| Pages Monoliticas | 10+ | 12.000 | Alto - Violacao SRP |
| Dados Mockados Legados | 5 | 3.700 | Medio - Confusao |
| Hooks Duplicados | 40 | 2.500 | Medio - Retrabalho |
| @ts-nocheck | 11 | 8.000 | Alto - Sem type safety |

---

## 2. FASES DE REFATORACAO

### FASE 1: Eliminacao de Duplicacoes (Prioridade Critica)

**Objetivo**: Consolidar codigo duplicado em modulos unicos

#### 1.1 Consolidar Servicos de Tramitacao

**Situacao Atual**:
```
src/lib/tramitacao-service.ts (876 linhas)
src/lib/services/tramitacao-service.ts (1.129 linhas)
```

**Acao**:
- [ ] Analisar diferencas entre os dois arquivos
- [ ] Mesclar funcionalidades unicas em `src/lib/services/tramitacao-service.ts`
- [ ] Atualizar imports em todo o projeto
- [ ] Remover `src/lib/tramitacao-service.ts`
- [ ] Testar fluxos de tramitacao

**Arquivos Afetados**: ~15 arquivos com imports

---

#### 1.2 Consolidar Servicos de Transparencia

**Situacao Atual**:
```
src/lib/transparencia-service.ts (943 linhas)
src/lib/services/transparencia-service.ts (920 linhas)
```

**Acao**:
- [ ] Comparar implementacoes
- [ ] Unificar em `src/lib/services/transparencia-service.ts`
- [ ] Atualizar referencias
- [ ] Remover arquivo duplicado

---

#### 1.3 Consolidar Dados de Parlamentares

**Situacao Atual**:
```
src/lib/parlamentares-data.ts (1.865 linhas) - @deprecated
src/lib/parlamentares-data-fixed.ts (422 linhas) - nao integrado
```

**Acao**:
- [ ] Verificar se dados mockados ainda sao necessarios
- [ ] Se sim: consolidar em arquivo unico
- [ ] Se nao: remover ambos e usar apenas Prisma
- [ ] Atualizar `src/lib/database-service.ts`

---

### FASE 2: Decomposicao de Componentes (Prioridade Alta)

**Objetivo**: Quebrar componentes monoliticos em unidades menores

#### 2.1 Refatorar /admin/painel-eletronico/page.tsx

**Situacao Atual**: 2.091 linhas, 69 estados, @ts-nocheck

**Decomposicao Proposta**:
```
src/app/admin/painel-eletronico/
  page.tsx (300 linhas - orquestracao)
  _components/
    painel-header.tsx
    painel-sessao-info.tsx
    painel-quorum.tsx
    painel-pauta-list.tsx
    painel-votacao-atual.tsx
    painel-presenca.tsx
    painel-timer.tsx
    painel-controles.tsx
  _hooks/
    use-painel-state.ts
    use-painel-votacao.ts
    use-painel-timer.ts
  _types/
    painel-types.ts
```

**Tarefas**:
- [x] Extrair tipos para arquivo separado (_types/index.ts - 210 linhas)
- [x] Criar hook `usePainelState` para gerenciar estados (_hooks/use-painel-state.ts - 538 linhas)
- [x] Extrair componentes de UI (_components/ - PainelControles, PainelHeader - 311 linhas)
- [x] Manter page.tsx como orquestrador (700 linhas - redução de 66%)
- [x] Remover @ts-nocheck
**Status**: CONCLUÍDO em 2026-01-30

---

#### 2.2 Refatorar /admin/proposicoes/page.tsx

**Situacao Atual**: 1.972 linhas

**Decomposicao Proposta**:
```
src/app/admin/proposicoes/
  page.tsx (200 linhas)
  _components/
    proposicoes-table.tsx
    proposicoes-filters.tsx
    proposicao-form-modal.tsx
    proposicao-details.tsx
  _hooks/
    use-proposicoes-filters.ts
```

**Progresso**:
- [x] Criar _types/index.ts (279 linhas)
- [x] Criar _hooks/use-proposicoes-state.ts (684 linhas)
- [x] Criar _components/proposicoes-filters.tsx (84 linhas)
- [x] Criar _components/proposicao-card.tsx (134 linhas)
- [x] Integrar hook e componentes no page.tsx (1.972 → 875 linhas, -55%)
- [ ] Extrair modais para componentes separados (opcional - futuro)
**Status**: CONCLUÍDO em 2026-01-30

---

#### 2.3 Refatorar /admin/sessoes-legislativas/page.tsx

**Situacao Atual**: 1.556 linhas

**Progresso**:
- [x] Criar _types/index.ts (150 linhas)
- [x] Criar _hooks/use-sessoes-state.ts (582 linhas)
- [x] Criar _components/sessoes-filters.tsx (88 linhas)
- [x] Criar _components/sessao-card.tsx (148 linhas)
- [x] Integrar hook e componentes no page.tsx (1.556 → 620 linhas, -60%)
**Status**: CONCLUÍDO em 2026-01-30

**Decomposicao Similar**

---

### FASE 3: Criacao de Abstracoes (Prioridade Alta)

**Objetivo**: Criar padroes reutilizaveis

#### 3.1 Factory de Hooks CRUD

**Problema**: 40 hooks com logica similar de fetch/error/loading

**Solucao**: Hook generico reutilizavel

```typescript
// src/lib/hooks/use-crud-resource.ts

interface UseCrudOptions<T> {
  endpoint: string
  queryKey: string
  transformResponse?: (data: any) => T[]
}

function useCrudResource<T>(options: UseCrudOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Metodos CRUD genericos
  const fetchAll = async (filters?: Record<string, any>) => {...}
  const create = async (item: Partial<T>) => {...}
  const update = async (id: string, item: Partial<T>) => {...}
  const remove = async (id: string) => {...}

  return { data, loading, error, fetchAll, create, update, remove }
}
```

**Tarefas**:
- [ ] Criar hook generico `useCrudResource`
- [ ] Migrar hooks existentes para usar factory
- [ ] Manter hooks especializados apenas com logica especifica

---

#### 3.2 Padronizar Validacoes

**Problema**: Validacoes espalhadas em multiplos services

**Solucao**: Strategy Pattern para validacoes

```typescript
// src/lib/validation/validation-strategy.ts

interface ValidationRule<T> {
  name: string
  validate: (data: T) => ValidationResult
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

class Validator<T> {
  private rules: ValidationRule<T>[] = []

  addRule(rule: ValidationRule<T>) {
    this.rules.push(rule)
    return this
  }

  validate(data: T): ValidationResult {
    // Executa todas as regras
  }
}
```

---

#### 3.3 Repository Pattern para Acesso a Dados

**Problema**: Prisma usado diretamente em services e APIs

**Solucao**: Camada de repositorio

```typescript
// src/lib/repositories/proposicao-repository.ts

interface ProposicaoRepository {
  findById(id: string): Promise<Proposicao | null>
  findAll(filters: ProposicaoFilters): Promise<Proposicao[]>
  create(data: CreateProposicaoInput): Promise<Proposicao>
  update(id: string, data: UpdateProposicaoInput): Promise<Proposicao>
  delete(id: string): Promise<void>
}

class PrismaProposicaoRepository implements ProposicaoRepository {
  // Implementacao com Prisma
}
```

---

### FASE 4: Limpeza de Codigo Legado (Prioridade Media)

**Objetivo**: Remover codigo morto e dados mockados

#### 4.1 Remover Arquivos Deprecados

**Arquivos para Remocao** (apos verificacao de uso):
- [ ] `src/lib/database-service.ts` (519 linhas)
- [ ] `src/lib/painel-eletronico-service.ts` (499 linhas) - se duplicado
- [ ] `src/lib/painel-integracao-service.ts` (405 linhas) - se duplicado
- [ ] `src/lib/parlamentares-data.ts` (1.865 linhas) - @deprecated

**Processo**:
1. Buscar todos os imports do arquivo
2. Verificar se funcionalidade existe em outro lugar
3. Migrar usos restantes
4. Remover arquivo
5. Testar aplicacao

---

#### 4.2 Remover @ts-nocheck

**Arquivos Afetados**: 11 arquivos

**Processo por arquivo**:
1. Remover diretiva @ts-nocheck
2. Corrigir erros TypeScript
3. Adicionar tipos faltantes
4. Validar build

---

### FASE 5: Melhorias de Arquitetura (Prioridade Media)

#### 5.1 Refatorar API Routes

**Padrao Atual**: Routes com 300+ linhas misturando responsabilidades

**Padrao Proposto**:
```
src/app/api/sessoes/[id]/
  route.ts (50 linhas - roteador)
  handlers/
    get-sessao.ts
    update-sessao.ts
    delete-sessao.ts
  validators/
    sessao-validator.ts
```

---

#### 5.2 Segregar Interfaces

**Problema**: Interfaces muito grandes (50+ propriedades)

**Solucao**: Dividir por contexto de uso

```typescript
// Antes
interface PainelSessao {
  // 50 propriedades
}

// Depois
interface SessaoBase { id, numero, tipo, status }
interface SessaoComPauta extends SessaoBase { pauta: PautaItem[] }
interface SessaoComPresenca extends SessaoBase { presencas: Presenca[] }
interface SessaoCompleta extends SessaoComPauta, SessaoComPresenca {}
```

---

### FASE 6: Testes e Documentacao (Prioridade Baixa)

#### 6.1 Adicionar Testes

**Cobertura Alvo**:
- [ ] Servicos de validacao: 80%
- [ ] APIs criticas: 70%
- [ ] Hooks principais: 60%

---

#### 6.2 Documentar Arquitetura

- [ ] Diagrama de dependencias
- [ ] Guia de padroes
- [ ] Documentacao de APIs internas

---

## 3. CRONOGRAMA SUGERIDO

| Fase | Descricao | Estimativa | Dependencias |
|------|-----------|------------|--------------|
| 1.1 | Consolidar Tramitacao | 1 dia | - |
| 1.2 | Consolidar Transparencia | 1 dia | - |
| 1.3 | Consolidar Parlamentares | 0.5 dia | - |
| 2.1 | Refatorar Painel Eletronico | 2 dias | - |
| 2.2 | Refatorar Proposicoes | 1.5 dias | - |
| 2.3 | Refatorar Sessoes | 1 dia | - |
| 3.1 | Factory de Hooks | 1 dia | - |
| 3.2 | Padronizar Validacoes | 1 dia | - |
| 3.3 | Repository Pattern | 2 dias | - |
| 4.1 | Remover Legados | 1 dia | 1.x |
| 4.2 | Remover @ts-nocheck | 2 dias | 2.x |
| 5.1 | Refatorar APIs | 2 dias | 3.x |
| 5.2 | Segregar Interfaces | 1 dia | - |
| 6.1 | Adicionar Testes | 3 dias | 1-5 |
| 6.2 | Documentar | 1 dia | 1-5 |

**Total Estimado**: ~20 dias de trabalho

---

## 4. REGRAS DE SEGURANCA

Conforme `skill_refatoracao.md`:

- [ ] NAO remover funcionalidade existente
- [ ] NAO alterar regras de negocio (RN-XXX)
- [ ] NAO modificar contratos de API publica
- [ ] NAO introduzir dependencias sem justificativa
- [ ] Manter compatibilidade com ambiente atual
- [ ] Executar em passos incrementais
- [ ] Validar cada mudanca antes de prosseguir

---

## 5. METRICAS DE SUCESSO

| Metrica | Antes | Meta |
|---------|-------|------|
| Linhas duplicadas | 5.200 | < 500 |
| Arquivos > 1000 linhas | 10 | 0 |
| @ts-nocheck | 11 | 0 |
| Cobertura de testes | ~2% | > 50% |
| Hooks duplicados | 40 | 10 + factory |

---

## 6. PROXIMOS PASSOS

1. **Aprovar plano** com stakeholders
2. **Priorizar** fases conforme necessidade
3. **Iniciar Fase 1** - Eliminacao de duplicacoes
4. **Atualizar** ESTADO-ATUAL.md apos cada fase
5. **Commitar** em pequenos incrementos

---

## 7. ANEXOS

### A. Arquivos Criticos (> 1000 linhas)

```
src/lib/db.ts                                    5238 linhas
src/app/admin/painel-eletronico/page.tsx         2091 linhas
src/app/admin/proposicoes/page.tsx               1972 linhas
src/lib/parlamentares-data.ts                    1865 linhas
src/app/admin/sessoes-legislativas/page.tsx      1556 linhas
src/app/admin/painel-eletronico/[sessaoId]/page.tsx 1296 linhas
src/lib/services/sessao-controle.ts              1235 linhas
src/lib/api/tramitacoes-api.ts                   1190 linhas
src/lib/services/tramitacao-service.ts           1129 linhas
src/app/admin/audiencias-publicas/page.tsx       1124 linhas
```

### B. Arquivos com @ts-nocheck

```
src/lib/db.ts
src/app/admin/painel-eletronico/page.tsx
src/lib/painel-eletronico-service.ts
src/lib/parlamentares-data.ts
src/lib/proposicoes-service.ts
+ 6 outros
```

### C. Duplicacoes Identificadas

| Original | Duplicado | Acao |
|----------|-----------|------|
| services/tramitacao-service.ts | tramitacao-service.ts | Mesclar |
| services/transparencia-service.ts | transparencia-service.ts | Mesclar |
| parlamentares-data.ts | parlamentares-data-fixed.ts | Consolidar |

---

> **Documento gerado automaticamente**
> **Referencia**: skill_refatoracao.md
> **Proxima revisao**: Apos conclusao de cada fase
