# Arquitetura Atual do Sistema

## Visão Geral
- Aplicação **Next.js 14 (App Router)** integrando frontend e backend.
- UI construída com **React 18**, **TypeScript**, **TailwindCSS**, **Shadcn/Radix**.
- Backend via **API Routes** (`src/app/api`) com **Prisma ORM** comunicando-se com PostgreSQL.
- **Mock DB** em `src/lib/db.ts` imita Prisma quando `DATABASE_URL` não está configurada.
- Autenticação com **NextAuth** (credenciais) trazendo RBAC via `src/lib/auth/permissions.ts`.
- Serviços críticos centralizados em `src/lib/services` (ex.: `sessao-controle.ts`).

## Fluxos Principais
### Sessões Legislativas
1. Admin cria sessão em `src/app/admin/sessoes-legislativas` → chama `POST /api/sessoes`.
2. API aplica validações (legislatura/período, pauta, ata) e usa `sessao-controle`.
3. Painel eletrônico (`src/app/admin/painel-eletronico`) consome `GET /api/sessoes/[id]` e rotas de presença/votação.
4. Portal público (`src/app/legislativo/sessoes/[numero]`) exibe dados agregados, transmissão embutida e repositório multimídia calculado via `STREAMING_MOCK`.

### Mesa Diretora & Parlamentares
1. Cadastro de legislatura/períodos (`src/app/admin/legislaturas`).
2. Mesa diretora (`src/app/admin/mesa-diretora`) vincula cargos e parlamentares.
3. `HistoricoParticipacao` (Prisma + mock) mantém rastreabilidade automática.
4. Perfis parlamentares (`src/app/admin/parlamentares/*`) exibem histórico via `useParlamentarHistorico`.

### Pautas e Templates
1. `SessaoTemplate` define estrutura padrão (`src/app/admin/templates-sessao`).
2. `PautaSessao` e `PautaItem` persistem agenda real; drag-and-drop e cálculos de tempo.
3. Integração com proposições e votações em `src/app/api/sessoes/*`.

### Tramitações Públicas
1. API pública em `/api/publico/tramitacoes` (listagem e detalhe) encapsula `tramitacoesService` com filtros, paginação e fallback mock.
2. Client-side em `src/lib/api/public-tramitacoes-api.ts` oferece `list`/`getById` com tratamento de `401` → mock.
3. Hooks `usePublicTramitacoes` e `usePublicTramitacao` alimentam `/tramitacoes` (filtros avançados) e `/tramitacoes/[id]` (linha do tempo).
4. Testes em `src/tests/tramitacao/public-tramitacoes-api.test.ts` garantem a resiliência do fallback.

### Participação Cidadã
1. `publicParticipacaoApi` consome `/api/participacao-cidada` (REST) e fallback mock (`participacaoCidadaService`).
2. Hook `usePublicParticipacao` combina sugestões, consultas, petições e estatísticas com atualização otimista.
3. Portal `/participacao` expõe cards de engajamento, votos (consultas), apoios (sugestões) e assinaturas (petições).
4. Testes em `src/tests/participacao/public-participacao-api.test.ts` cobrem votos/assinaturas em modo offline.

## Estrutura de Código
- `src/app`: páginas Admin, Portal público e rotas API.
- `src/components`: componentes reutilizáveis (UI, layouts, painel, público).
- `src/lib`: utilitários (auth, db mock, serviços, hooks, formatações).
- `prisma/schema.prisma`: modelagem completa (sessões, mesa diretora, histórico, painel, tokens, logs, etc.).
- `docs/`: base documental (SAPL, análises, cronograma, arquitetura).

## Observações
- Rotas protegidas usam `withAuth` para validar permissões.
- Mock DB simula `.findMany`, `.create`, `.update` e `$transaction` para alinhamento com Prisma.
- Testes: unidade em `src/tests` (datas, sessão-controle) e base para ampliar.
- Auditoria (`src/lib/audit.ts`) registra ações chave conforme Plano em produção.

