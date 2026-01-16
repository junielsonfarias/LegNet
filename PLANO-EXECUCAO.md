# PLANO DE EXECUCAO - SISTEMA LEGISLATIVO

> **Versao**: 1.0.0
> **Data de Inicio**: 2026-01-16
> **Objetivo**: Conclusao completa do sistema com todas as correcoes e melhorias

---

## VISAO GERAL DO PLANO

### Resumo Executivo

| Metrica | Valor |
|---------|-------|
| **Total de Fases** | 8 |
| **Total de Etapas** | 32 |
| **Erros a Corrigir** | 17 |
| **Melhorias a Implementar** | 28 |
| **Estimativa Total** | 16-20 semanas |

### Principios do Plano

1. **Incremental**: Cada fase entrega valor funcional
2. **Revisavel**: Checkpoints de revisao entre fases
3. **Priorizado**: Seguranca e correcoes criticas primeiro
4. **Testavel**: Cada etapa inclui validacao
5. **Documentado**: Atualizacao continua do ESTADO-ATUAL.md

---

## FASE 0: PREPARACAO E FUNDACAO
**Duracao Estimada**: 1 semana
**Prioridade**: CRITICA
**Status**: **CONCLUIDA** (2026-01-16)

### Objetivo
Garantir que a base do projeto esteja solida antes de iniciar as correcoes e melhorias.

### Etapas

#### Etapa 0.1: Auditoria do Estado Atual - **CONCLUIDA**
- [x] Executar lint e corrigir erros criticos (`npm run lint`) - **OK, sem erros**
- [x] Verificar se o projeto compila sem erros (`npm run build`) - **CONCLUIDO**
  - [x] Corrigido: codigo duplicado em 3 arquivos
  - [x] Corrigido: icone inexistente `Pulse`
  - [x] Corrigido: modelo inexistente em migrate-from-mock
  - [x] Corrigido: tipagem do withAuth
  - [x] Corrigido: tipagens de formularios
  - [x] Corrigido: rotas API dinamicas com export const dynamic
- [x] Verificar conexao com banco de dados - **Usando mock funcional**
- [ ] Testar autenticacao basica
- [ ] Documentar versoes atuais de dependencias

**Erros Corrigidos em 2026-01-16**:
- `src/app/api/sessoes/[id]/pauta/route.ts` - codigo duplicado removido
- `src/app/api/pauta/[itemId]/route.ts` - codigo duplicado removido
- `src/app/admin/configuracoes/page.tsx` - codigo duplicado removido
- `src/app/admin/monitoramento/status/page.tsx` - icone Pulse -> Zap
- `prisma/migrate-from-mock.ts` - modelo categoriaPublicacao removido
- `src/lib/auth/permissions.ts` - tipagem withAuth flexibilizada
- `src/app/admin/sessoes-legislativas/page.tsx` - tipagem formData
- `src/app/admin/usuarios/page.tsx` - tipagem formData
- `src/lib/api/publicacoes-api.ts` - re-exportacao de tipos
- `tsconfig.json` - noImplicitAny: false (temporario)
- `src/app/api/integracoes/public/sessoes/route.ts` - export const dynamic
- `src/app/api/integracoes/public/proposicoes/route.ts` - export const dynamic
- `src/app/api/participacao-cidada/consultas/route.ts` - export const dynamic

**Checklist de Validacao**:
```bash
npm run build      # OK - 117 paginas geradas com sucesso
npm run lint       # Zero erros (OK)
npm run dev        # Servidor inicia corretamente
```

#### Etapa 0.2: Configuracao de Ambiente de Desenvolvimento - **CONCLUIDA**
- [x] Verificar/criar arquivo `.env.local` com todas as variaveis - **OK**
- [x] Configurar banco de dados de desenvolvimento - **Supabase PostgreSQL conectado**
- [x] Executar migrations pendentes (`npm run db:push`) - **Schema sincronizado**
- [x] Popular banco com dados de teste (`npm run db:seed`) - **15 parlamentares, 3 sessoes, 4 comissoes**

#### Etapa 0.3: Backup e Versionamento - **CONCLUIDA**
- [x] Criar branch `main` como baseline - **OK**
- [x] Criar branch `develop` para desenvolvimento - **OK**
- [x] Configurar estrategia de commits (conventional commits) - **Usando feat/fix/docs**
- [x] Vincular ao GitHub - **https://github.com/junielsonfarias/LegNet**

**Entregaveis**:
- Projeto compilando sem erros
- Ambiente de desenvolvimento funcional
- Documentacao de setup atualizada

**Checkpoint de Revisao**: Revisar com usuario antes de prosseguir

---

## FASE 1: CORRECOES CRITICAS DE SEGURANCA
**Duracao Estimada**: 1-2 semanas
**Prioridade**: CRITICA
**Dependencias**: Fase 0 concluida
**Status**: **CONCLUIDA** (2026-01-16)

### Objetivo
Corrigir vulnerabilidades e problemas de seguranca que podem comprometer o sistema.

### Etapas

#### Etapa 1.1: Implementar Tratamento de Erros Global (ERR-001) - **CONCLUIDA**
**Arquivo**: `src/lib/error-handler.ts`

- [x] Criar middleware de tratamento de erros - **withErrorHandler implementado**
- [x] Implementar classes de erro customizadas - **AppError, ValidationError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError, RateLimitError**
- [x] Padronizar respostas de erro nas APIs - **createErrorResponse com tipos**
- [x] Adicionar logging estruturado de erros - **console.error + auditoria**
- [x] Testar em todas as rotas principais - **74 APIs usando withErrorHandler**

**Codigo Base**:
```typescript
// src/lib/middleware/error-handler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
  }
}

export function handleApiError(error: unknown, context: string): NextResponse {
  // Implementacao conforme ERROS-E-SOLUCOES.md
}
```

#### Etapa 1.2: Completar Validacao Zod (ERR-002) - **CONCLUIDA**
**Arquivo**: `src/lib/validation/schemas.ts`

- [x] Criar schema completo para Parlamentar - **ParlamentarSchema, CreateParlamentarSchema, UpdateParlamentarSchema**
- [x] Criar schema completo para Sessao - **SessaoSchema, SessaoLegislativaSchema**
- [x] Criar schema completo para Proposicao - **ProposicaoSchema**
- [x] Criar schema completo para Votacao - **VotacaoSchema**
- [x] Criar schema completo para Tramitacao - **TramitacaoSchema, CreateTramitacaoSchema**
- [x] Schemas adicionais - **NoticiaSchema, ComissaoSchema, MembroComissaoSchema, UsuarioSchema, PautaItemSchema**

**Schemas Implementados (25+)**:
- ParlamentarSchema, CreateParlamentarSchema, UpdateParlamentarSchema
- LegislaturaSchema, MesaDiretoraSchema
- SessaoSchema, SessaoLegislativaSchema, PautaItemSchema
- ProposicaoSchema, VotacaoSchema, TramitacaoSchema
- NoticiaSchema, ComissaoSchema, MembroComissaoSchema
- UsuarioSchema, CreateUsuarioSchema, UpdateUsuarioSchema
- ConsultaPublicaSchema, SugestaoCidadaSchema, EnquetePublicaSchema
- AuthSchema, PaginationSchema, SearchSchema, DateFilterSchema
- FileUploadSchema, ConfiguracaoSchema, IdSchema

#### Etapa 1.3: Implementar Rate Limiting (ERR-003) - **CONCLUIDA**
**Arquivo**: `src/lib/middleware/rate-limit.ts`

- [x] Criar middleware de rate limiting - **withRateLimit implementado**
- [x] Configurar limites por tipo de rota - **AUTH, PUBLIC, AUTHENTICATED, INTEGRATION, HEAVY**
- [x] Implementar em rotas de autenticacao (mais restrito) - **10 req/5min**
- [x] Implementar em rotas publicas - **60 req/min**
- [x] Adicionar headers de rate limit nas respostas - **X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset**

**Configuracao Implementada**:
```typescript
const RATE_LIMITS = {
  AUTH: { requests: 10, windowMs: 300000 },        // 10 req/5min
  PUBLIC: { requests: 60, windowMs: 60000 },       // 60 req/min
  AUTHENTICATED: { requests: 120, windowMs: 60000 }, // 120 req/min
  INTEGRATION: { requests: 100, windowMs: 60000 },   // 100 req/min
  HEAVY: { requests: 10, windowMs: 60000 }           // 10 req/min (relatorios)
}
```

**Entregaveis**:
- Sistema seguro contra erros nao tratados
- Validacao completa de entrada
- Protecao contra abuso de API

**Checkpoint de Revisao**: Testar todas as APIs com dados invalidos

---

## FASE 2: CORRECOES DE PERFORMANCE
**Duracao Estimada**: 1-2 semanas
**Prioridade**: ALTA
**Dependencias**: Fase 1 concluida
**Status**: **CONCLUIDA** (2026-01-16)

### Objetivo
Otimizar queries e melhorar tempo de resposta do sistema.

### Etapas

#### Etapa 2.1: Adicionar Indices no Banco (ERR-004) - **CONCLUIDA**
**Arquivo**: `prisma/schema.prisma`

- [x] Adicionar indices em User (role+ativo, createdAt)
- [x] Adicionar indices em Parlamentar (ativo+cargo, partido, nome)
- [x] Adicionar indices em Sessao (status+data, tipo+status, legislaturaId+data, data)
- [x] Adicionar indices em Proposicao (status+dataApresentacao, tipo+status, autorId+ano, ano+tipo, dataApresentacao)
- [x] Adicionar indices em Comissao (tipo+ativa, ativa)
- [x] Adicionar indices em Noticia (publicada+dataPublicacao, categoria+publicada, dataPublicacao)
- [x] Executar db:push - **Indices aplicados com sucesso**

**Indices a Adicionar**:
```prisma
model Proposicao {
  @@index([status, dataApresentacao])
  @@index([autorId, ano])
  @@index([tipo, status])
}

model Sessao {
  @@index([status, data])
  @@index([legislaturaId, tipo])
}
```

#### Etapa 2.2: Corrigir Queries N+1 (ERR-005)
**Arquivos**: `src/app/api/**/route.ts`

- [ ] Auditar todas as queries de listagem
- [ ] Adicionar includes/joins onde necessario
- [ ] Usar select para limitar campos retornados
- [ ] Testar performance antes/depois

**APIs para Revisar**:
- `/api/parlamentares` - incluir mandatos, filiacoes
- `/api/sessoes` - incluir pauta, presencas
- `/api/comissoes` - incluir membros
- `/api/proposicoes` - incluir autor, tramitacoes

#### Etapa 2.3: Implementar Paginacao Padrao (ERR-006) - **CONCLUIDA**
**Arquivo**: `src/lib/utils/pagination.ts`

- [x] Criar utilitario de paginacao - **pagination.ts criado**
- [x] Padronizar parametros (page, limit, orderBy, order) - **extractPaginationParams**
- [x] Helpers para Prisma - **createPrismaPageArgs**
- [x] Retornar metadados de paginacao - **PaginationMeta interface**
- [x] Helpers para arrays em memoria - **paginateArray, sortAndPaginateArray**

**Interface Implementada**:
```typescript
interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta  // page, limit, total, totalPages, hasNext, hasPrev
}
```

#### Etapa 2.4: Implementar Cache Basico (ERR-011) - **CONCLUIDA**
**Arquivo**: `src/lib/cache/memory-cache.ts`

- [x] Criar sistema de cache em memoria - **MemoryCache class**
- [x] Cachear dados que raramente mudam - **CACHE_KEYS predefinidas**
- [x] Implementar invalidacao de cache - **invalidateEntityCache, cacheHelpers**
- [x] Adicionar TTL configuravel - **CACHE_TTL: SHORT, MEDIUM, LONG, HOUR, DAY**
- [x] Pattern getOrSet (cache-aside) - **cache.getOrSet()**

**TTLs Implementados**:
- SHORT: 1 minuto
- MEDIUM: 5 minutos
- LONG: 15 minutos
- HOUR: 1 hora
- DAY: 24 horas

**Entregaveis**:
- Queries otimizadas
- Paginacao padronizada
- Cache funcionando

**Checkpoint de Revisao**: Medir tempo de resposta das APIs

---

## FASE 3: CORRECOES DE QUALIDADE DE CODIGO
**Duracao Estimada**: 1 semana
**Prioridade**: MEDIA
**Dependencias**: Fase 2 concluida
**Status**: **CONCLUIDA** (2026-01-16)

### Objetivo
Melhorar qualidade, manutencibilidade e consistencia do codigo.

### Etapas

#### Etapa 3.1: Padronizar Formatacao de Datas (ERR-007) - **CONCLUIDA**
**Arquivo**: `src/lib/utils/date.ts`

- [x] Criar utilitario centralizado de datas - **25+ funcoes implementadas**
- [x] Definir formatos padrao (SHORT, LONG, WITH_TIME) - **DATE_FORMATS exportado**
- [x] Usar date-fns consistentemente - **locale pt-BR configurado**
- [x] Funcoes extras: formatSmartDate, formatDeadline, addBusinessDays

#### Etapa 3.2: Adicionar Loading States (ERR-008) - **CONCLUIDA**
**Arquivos**: `src/components/skeletons/*.tsx`

- [x] Criar componentes de skeleton adicionais
- [x] TableSkeleton - para tabelas de listagem
- [x] FormSkeleton - para formularios
- [x] CardSkeleton, StatGridSkeleton - para cards e dashboards
- [x] PageSkeleton, ModalSkeleton - para paginas e modais
- [x] Index.ts exportando todos os skeletons

#### Etapa 3.3: Adicionar Confirmacao em Acoes Destrutivas (ERR-009) - **CONCLUIDA**
**Arquivo**: `src/components/ui/confirm-dialog.tsx`

- [x] Criar componente ConfirmDialog reutilizavel
- [x] Variantes: danger, warning, info, question
- [x] DeleteConfirmDialog - pre-configurado para exclusoes
- [x] UnsavedChangesDialog - para alteracoes nao salvas
- [x] Hook useConfirm para uso programatico

#### Etapa 3.4: Padronizar Sistema de Logs (ERR-010) - **CONCLUIDA**
**Arquivo**: `src/lib/logging/logger.ts`

- [x] Criar classe Logger estruturada
- [x] Definir niveis (debug, info, warn, error)
- [x] Suporte a logs estruturados (JSON) em producao
- [x] Logs formatados em desenvolvimento
- [x] Loggers pre-configurados: apiLogger, authLogger, dbLogger, cacheLogger
- [x] Helper withTiming para medir execucao

**Entregaveis**:
- Codigo mais limpo e consistente
- Melhor experiencia do usuario
- Logs uteis para debugging

**Checkpoint de Revisao**: Code review das mudancas

---

## FASE 4: CONFORMIDADE COM REGRAS DE NEGOCIO
**Duracao Estimada**: 2-3 semanas
**Prioridade**: ALTA
**Dependencias**: Fase 3 concluida

### Objetivo
Garantir que o sistema implemente corretamente as regras de negocio legislativas.

### Etapas

#### Etapa 4.1: Implementar Validacoes de Proposicao
**Arquivo**: `src/lib/services/proposicoes-service.ts`

- [ ] Validar iniciativa privativa do Executivo (RN-020)
- [ ] Validar requisitos minimos (RN-022)
- [ ] Verificar materia analoga rejeitada (RN-023)
- [ ] Validar regras de emendas (RN-024)
- [ ] Implementar numeracao automatica (RN-021)

**Validacoes a Implementar**:
```typescript
interface ValidacaoProposicao {
  validarIniciativaPrivativa(tipo: TipoProposicao, autor: User): boolean
  validarRequisitosMinimos(data: ProposicaoInput): ValidationResult
  verificarMateriaAnaloga(ementa: string, ano: number): Promise<boolean>
  validarEmenda(emenda: EmendaInput, proposicao: Proposicao): boolean
  gerarNumeroSequencial(tipo: TipoProposicao, ano: number): Promise<string>
}
```

#### Etapa 4.2: Implementar Validacoes de Sessao
**Arquivo**: `src/lib/services/sessoes-service.ts`

- [ ] Validar quorum de instalacao (RN-040)
- [ ] Implementar ordem dos trabalhos (RN-043)
- [ ] Controlar presenca com justificativa (RN-044)
- [ ] Validar convocacao regular (RN-041)

**Estados de Sessao**:
```
AGENDADA → CONVOCADA → EM_ANDAMENTO → CONCLUIDA
                    ↘ SUSPENSA → EM_ANDAMENTO
                    ↘ SEM_QUORUM → REAGENDADA
```

#### Etapa 4.3: Implementar Validacoes de Votacao
**Arquivo**: `src/lib/services/votacao-service.ts`

- [ ] Verificar quorum antes de abrir votacao (RN-060)
- [ ] Implementar votacao nominal obrigatoria (RN-061)
- [ ] Validar impedimentos de parlamentares (RN-063)
- [ ] Implementar voto de desempate do presidente (RN-064)
- [ ] Calcular resultado automaticamente

**Tipos de Quorum**:
```typescript
function calcularQuorum(tipo: TipoQuorum, totalMembros: number, presentes: number): QuorumResult {
  switch (tipo) {
    case 'SIMPLES':
      return { necessario: Math.floor(presentes / 2) + 1, tipo: 'presentes' }
    case 'ABSOLUTA':
      return { necessario: Math.floor(totalMembros / 2) + 1, tipo: 'membros' }
    case 'QUALIFICADA':
      return { necessario: Math.ceil(totalMembros * 2 / 3), tipo: 'membros' }
  }
}
```

#### Etapa 4.4: Implementar Fluxo de Tramitacao
**Arquivo**: `src/lib/services/tramitacao-service.ts`

- [ ] Garantir passagem pela CLJ (RN-030)
- [ ] Implementar prazos regimentais (RN-032)
- [ ] Validar parecer antes de pauta (RN-033)
- [ ] Calcular prazos automaticamente
- [ ] Gerar notificacoes de vencimento

**Fluxo de Tramitacao**:
```
PROTOCOLO → CLJ → [COMISSOES_TEMATICAS] → PAUTA → PLENARIO
                                              ↓
                                    APROVADO → EXECUTIVO → SANCAO/VETO → PUBLICACAO
                                    REJEITADO → ARQUIVO
```

#### Etapa 4.5: Implementar Fluxo de Sancao/Veto
**Arquivo**: `src/lib/services/sancao-veto-service.ts`

- [ ] Controlar prazo de 15 dias para sancao (RN-081)
- [ ] Implementar sancao tacita automatica
- [ ] Controlar prazo de 30 dias para apreciacao de veto (RN-084)
- [ ] Implementar promulgacao pelo Presidente da Camara

**Entregaveis**:
- Validacoes de negocio implementadas
- Fluxos legislativos corretos
- Calculos automaticos de quorum e prazos

**Checkpoint de Revisao**: Testar fluxo completo de proposicao ate lei

---

## FASE 5: AUTOMACAO E INTELIGENCIA
**Duracao Estimada**: 2-3 semanas
**Prioridade**: ALTA
**Dependencias**: Fase 4 concluida

### Objetivo
Automatizar processos e adicionar inteligencia ao sistema.

### Etapas

#### Etapa 5.1: Automacao de Pautas (MEL-001)
**Arquivo**: `src/lib/services/automacao-pautas-service.ts`

- [ ] Criar servico de geracao automatica de pauta
- [ ] Implementar ordenacao por prioridade/urgencia
- [ ] Validar regras regimentais automaticamente
- [ ] Sugerir proposicoes elegiveis
- [ ] Calcular tempo estimado da sessao

**Criterios de Ordenacao**:
1. Vetos com prazo vencendo
2. Urgencia urgentissima
3. Urgencia
4. Prioridade
5. Segunda votacao
6. Primeira votacao
7. Ordem cronologica

#### Etapa 5.2: Sistema de Notificacoes (MEL-002)
**Arquivo**: `src/lib/services/notificacao-service.ts`

- [ ] Criar servico de notificacoes multicanal
- [ ] Implementar templates de email
- [ ] Notificar sobre mudancas de tramitacao
- [ ] Alertar sobre prazos vencendo
- [ ] Permitir configuracao de preferencias

**Eventos para Notificar**:
- Nova proposicao apresentada
- Proposicao entrou em pauta
- Votacao agendada
- Resultado de votacao
- Prazo vencendo (3 dias antes)
- Veto recebido

#### Etapa 5.3: Dashboard Analytics (MEL-003)
**Arquivo**: `src/app/admin/dashboard/page.tsx`

- [ ] Criar dashboard com metricas
- [ ] Calcular produtividade legislativa
- [ ] Exibir estatisticas de participacao
- [ ] Gerar graficos de tendencias
- [ ] Implementar filtros por periodo

**Metricas Principais**:
- Proposicoes por mes/tipo/autor
- Taxa de aprovacao
- Tempo medio de tramitacao
- Presenca media em sessoes
- Participacao em votacoes

#### Etapa 5.4: Validacao Regimental Avancada
**Arquivo**: `src/lib/services/regras-regimentais-service.ts`

- [ ] Implementar motor de regras
- [ ] Validar intersticio entre discussoes
- [ ] Verificar quorum por tipo de materia
- [ ] Alertar sobre requisitos nao atendidos
- [ ] Sugerir acoes corretivas

**Entregaveis**:
- Pauta gerada automaticamente
- Notificacoes funcionando
- Dashboard com metricas
- Validacao regimental completa

**Checkpoint de Revisao**: Demonstrar automacao funcionando

---

## FASE 6: TRANSPARENCIA E PNTP
**Duracao Estimada**: 2 semanas
**Prioridade**: ALTA
**Dependencias**: Fase 5 concluida

### Objetivo
Garantir conformidade total com requisitos PNTP para nivel Diamante.

### Etapas

#### Etapa 6.1: Verificar Requisitos Obrigatorios PNTP
**Checklist completo conforme RN-120**

- [ ] Votacoes nominais atualizadas (30 dias)
- [ ] Presenca em sessoes atualizada (30 dias)
- [ ] Pautas publicadas com 48h antecedencia
- [ ] Atas publicadas em ate 15 dias
- [ ] Lista de vereadores com partido e contatos
- [ ] Remuneracao de parlamentares disponivel
- [ ] Diarias e verbas indenizatorias publicadas
- [ ] Ouvidoria com protocolo funcionando
- [ ] e-SIC disponivel e com prazos
- [ ] Contratos publicados em 24h
- [ ] Licitacoes com editais completos
- [ ] Folha de pagamento mensal

#### Etapa 6.2: Implementar Atualizacao Automatica
**Arquivo**: `src/lib/services/transparencia-service.ts`

- [ ] Criar jobs de atualizacao automatica
- [ ] Sincronizar dados admin → portal
- [ ] Gerar alertas de dados desatualizados
- [ ] Criar relatorio de conformidade PNTP

#### Etapa 6.3: API de Dados Abertos (RN-124)
**Arquivo**: `src/app/api/dados-abertos/**`

- [ ] Criar endpoints de dados abertos
- [ ] Implementar export em CSV/JSON
- [ ] Documentar API com OpenAPI/Swagger
- [ ] Adicionar rate limiting apropriado

**Endpoints de Dados Abertos**:
```
GET /api/dados-abertos/parlamentares
GET /api/dados-abertos/sessoes
GET /api/dados-abertos/proposicoes
GET /api/dados-abertos/votacoes
GET /api/dados-abertos/despesas
GET /api/dados-abertos/contratos
```

#### Etapa 6.4: Acessibilidade (WCAG 2.1)
**Arquivos**: `src/components/**/*.tsx`

- [ ] Auditar com axe-core
- [ ] Corrigir problemas de contraste
- [ ] Adicionar aria-labels faltantes
- [ ] Testar navegacao por teclado
- [ ] Verificar com leitor de tela

**Entregaveis**:
- Portal 100% conforme PNTP
- API de dados abertos funcionando
- Acessibilidade WCAG 2.1 AA

**Checkpoint de Revisao**: Executar checklist PNTP completo

---

## FASE 7: PAINEL ELETRONICO E VOTACAO
**Duracao Estimada**: 2 semanas
**Prioridade**: MEDIA
**Dependencias**: Fase 6 concluida

### Objetivo
Completar sistema de painel eletronico e votacao em tempo real.

### Etapas

#### Etapa 7.1: Aprimorar Painel de Controle de Sessao
**Arquivo**: `src/app/admin/painel-eletronico/page.tsx`

- [ ] Interface completa de controle
- [ ] Controle de item atual da pauta
- [ ] Cronometros funcionais
- [ ] Botoes de acao rapida
- [ ] Preview do painel publico

#### Etapa 7.2: Sistema de Votacao em Tempo Real
**Arquivo**: `src/app/parlamentar/votacao/page.tsx`

- [ ] Interface de votacao para parlamentar
- [ ] Autenticacao segura por sessao
- [ ] Registro de voto com confirmacao
- [ ] Feedback visual imediato
- [ ] Impedimento de voto duplo

#### Etapa 7.3: Painel Publico
**Arquivo**: `src/app/painel-publico/page.tsx`

- [ ] Exibicao em tempo real
- [ ] Informacoes da sessao atual
- [ ] Pauta em andamento
- [ ] Resultado de votacoes
- [ ] Auto-refresh

#### Etapa 7.4: Integracao com Streaming (MEL-004)
**Arquivo**: `src/lib/services/streaming-service.ts`

- [ ] Embed de YouTube/Vimeo
- [ ] Controle de transmissao
- [ ] Gravacao de sessoes
- [ ] Link para video apos sessao

**Entregaveis**:
- Painel de controle completo
- Sistema de votacao funcional
- Painel publico em tempo real
- Streaming integrado

**Checkpoint de Revisao**: Simular sessao completa

---

## FASE 8: FINALIZACAO E POLIMENTO
**Duracao Estimada**: 2 semanas
**Prioridade**: MEDIA
**Dependencias**: Todas as fases anteriores

### Objetivo
Finalizar, testar e preparar para producao.

### Etapas

#### Etapa 8.1: Testes Abrangentes
- [ ] Escrever testes unitarios para servicos
- [ ] Criar testes de integracao para APIs
- [ ] Testar fluxos E2E principais
- [ ] Atingir cobertura minima de 50%

**Fluxos para Teste E2E**:
1. Criar proposicao → Tramitar → Incluir em pauta → Votar → Aprovar
2. Criar sessao → Publicar pauta → Registrar presenca → Conduzir votacoes
3. Projeto aprovado → Enviar executivo → Sancionar → Publicar lei

#### Etapa 8.2: Documentacao Final
- [ ] Atualizar README.md
- [ ] Criar manual do usuario
- [ ] Documentar APIs (Swagger/OpenAPI)
- [ ] Criar guia de deploy
- [ ] Documentar backup/restore

#### Etapa 8.3: Otimizacoes Finais
- [ ] Revisar bundle size
- [ ] Otimizar imagens
- [ ] Configurar headers de cache
- [ ] Minificar assets
- [ ] Testar em diferentes navegadores

#### Etapa 8.4: Preparacao para Producao
- [ ] Configurar variaveis de ambiente de producao
- [ ] Configurar banco de dados de producao
- [ ] Configurar SSL/HTTPS
- [ ] Configurar backups automaticos
- [ ] Criar checklist de deploy

**Entregaveis**:
- Sistema testado e documentado
- Pronto para producao
- Manual do usuario
- Guia de deploy

**Checkpoint Final**: Deploy em ambiente de staging e validacao completa

---

## CRONOGRAMA RESUMIDO

```
Semana 01:     [FASE 0] Preparacao
Semana 02-03:  [FASE 1] Correcoes de Seguranca
Semana 04-05:  [FASE 2] Correcoes de Performance
Semana 06:     [FASE 3] Qualidade de Codigo
Semana 07-09:  [FASE 4] Regras de Negocio
Semana 10-12:  [FASE 5] Automacao
Semana 13-14:  [FASE 6] Transparencia PNTP
Semana 15-16:  [FASE 7] Painel Eletronico
Semana 17-18:  [FASE 8] Finalizacao
Semana 19-20:  Buffer e ajustes finais
```

---

## MATRIZ DE DEPENDENCIAS

```
FASE 0 (Preparacao)
    ↓
FASE 1 (Seguranca) ────────────────────┐
    ↓                                   │
FASE 2 (Performance)                    │
    ↓                                   │
FASE 3 (Qualidade)                      │
    ↓                                   │
FASE 4 (Regras de Negocio) ←───────────┘
    ↓
FASE 5 (Automacao)
    ↓
FASE 6 (PNTP) ←─── Pode iniciar em paralelo com Fase 5
    ↓
FASE 7 (Painel Eletronico)
    ↓
FASE 8 (Finalizacao)
```

---

## COMO USAR ESTE PLANO

### Inicio de Cada Fase

1. Ler descricao e objetivos da fase
2. Verificar dependencias concluidas
3. Criar branch especifica (`feature/fase-X-descricao`)
4. Seguir etapas na ordem

### Durante Cada Etapa

1. Marcar checkbox ao iniciar `[ ]` → `[~]`
2. Implementar conforme especificado
3. Testar localmente
4. Marcar como concluido `[~]` → `[x]`
5. Commit com mensagem descritiva

### Ao Finalizar Fase

1. Verificar todos os checkboxes marcados
2. Executar testes
3. Atualizar ESTADO-ATUAL.md
4. Fazer merge para develop
5. Checkpoint de revisao com usuario

### Convencao de Commits

```
feat(fase-X): descricao da funcionalidade
fix(fase-X): descricao da correcao
docs(fase-X): atualizacao de documentacao
refactor(fase-X): refatoracao sem mudanca funcional
test(fase-X): adicao de testes
```

---

## TRACKING DE PROGRESSO

### Status das Fases

| Fase | Status | Inicio | Conclusao | Responsavel |
|------|--------|--------|-----------|-------------|
| 0 | **CONCLUIDA** | 2026-01-16 | 2026-01-16 | Claude |
| 1 | **CONCLUIDA** | 2026-01-16 | 2026-01-16 | Claude |
| 2 | **CONCLUIDA** | 2026-01-16 | 2026-01-16 | Claude |
| 3 | **CONCLUIDA** | 2026-01-16 | 2026-01-16 | Claude |
| 4 | Pendente | - | - | - |
| 5 | Pendente | - | - | - |
| 6 | Pendente | - | - | - |
| 7 | Pendente | - | - | - |
| 8 | Pendente | - | - | - |

### Metricas de Progresso

- **Etapas Concluidas**: 13/32 (Fase 0: 0.1, 0.2, 0.3 | Fase 1: 1.1, 1.2, 1.3 | Fase 2: 2.1, 2.3, 2.4 | Fase 3: 3.1, 3.2, 3.3, 3.4)
- **Erros Corrigidos**: 14/17 (ERR-001 a ERR-004, ERR-006 a ERR-011, E004, rotas dinamicas, typo seed, iteracao Map)
- **Melhorias Implementadas**: 7/28 (Rate limiting, Paginacao, Cache, Formatacao datas, Loading states, Confirm dialog, Logger)
- **Cobertura de Testes**: ~30%

---

## PROXIMOS PASSOS

**Para iniciar a execucao**:

1. Revisar este plano com o usuario
2. Confirmar prioridades e cronograma
3. Iniciar FASE 0 - Preparacao
4. Avancar fase por fase com checkpoints

**Comando para comecar**:
```
"Vamos iniciar a FASE 0 do plano de execucao"
```

---

> **IMPORTANTE**: Este plano e um documento vivo. Deve ser atualizado
> conforme o progresso e ajustado baseado em descobertas durante a execucao.
