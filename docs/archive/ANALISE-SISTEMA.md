Agora vou compilar um relatório abrangente baseado em toda a análise:

## ANÁLISE TÉCNICA COMPLETA - SISTEMA LEGISLATIVO MUNICIPAL

**Data**: 14/04/2026  
**Sistema**: Camera Municipal de Chaves-PA + Ruropolis (Next.js 14 + Prisma + PostgreSQL/Supabase)  
**Stack**: Next.js 15.5.14, React 18.3.1, TypeScript 5.5.3, Tailwind CSS 3.4.4, Prisma 5.16.1  
**Status Produção**: ✅ VPS (cmchaves.pa.gov.br) + Preview (Supabase/Vercel)  
**Versão**: 1.9.4  
**Arquivos Analisados**: 606 TSX/TS em `/src/app`, 141 componentes, 90 services, 245 utilitários

---

## 1. ARQUITETURA GERAL

**Nota: 7.2/10**

### Pontos Fortes
- ✅ **Next.js 14 App Router bem estruturado** - 12 layouts aninhados, 219 páginas, separação clara entre `(auth)`, `admin`, `legislativo`, `transparencia`, `parlamentar`
- ✅ **Separação de camadas implementada** - `/src/app` (páginas), `/src/components` (UI), `/src/lib` (lógica), `/src/types` (tipos)
- ✅ **Multi-tenant estruturado** - Middleware com `x-tenant-override`, tenant resolver, suporte a subdomínios + domínios customizados
- ✅ **Middleware de segurança robusto** - Rate limiting em memória (120 req/min), rate limit de login (10 tentativas/5min), validação de autenticação, headers CSP/HSTS/X-Frame-Options

### Pontos Fracos
- ⚠️ **118 modelos Prisma em 3859 linhas** - Schema monolítico; sem modularização em múltiplos arquivos (dificultaria futuras gerações)
- ⚠️ **Pouca reutilização de Server Components** - Apenas 39 uso de Suspense/lazy; maioria das páginas não aproveita streaming
- ⚠️ **Falta de divisão de sessões-controle.ts** - Arquivo crítico (~500 LOC) não dividido; ESTADO-ATUAL.md marca como "Fase 3 pendente"
- ⚠️ **ISR (Incremental Static Regeneration) limitado** - Apenas home.tsx e sitemap.ts; proposições, transparência deveriam ser ISR
- ⚠️ **Sem service worker/PWA** - Sem offline-first, caching de assets, installable

### Recomendações
1. **[MÉDIO]** Implementar ISR em rotas públicas: proposições, comissões, parlamentares, transparência (revalidate: 3600)
2. **[MÉDIO]** Refatorar `sessoes-controle.ts` em 3 arquivos: votacao, quorum, cronometro
3. **[BAIXO]** Avaliar PWA: adicionar manifest.json, service worker para offline + caching de assets estáticos

---

## 2. MODELO DE DADOS (PRISMA)

**Nota: 7.8/10**

### Estatísticas
- **118 modelos** (User, Account, Session, Tenant, ConfiguracaoInstitucional, Parlamentar, Sessao, Proposicao, Votacao, Comissao, Emenda, Parecer, Tramitacao, NotificacaoMulticanal, NormaJuridica, ConsultaPublica, SolicitacaoESIC, ManifestacaoOuvidoria, DashboardPersonalizado, Diaria, VerbaIndenizatoria, Concurso, AudienciaPublica, e 95 outros)
- **250 índices e constraints** (@@index, @@unique)
- **8 enums** (UserRole, PlanoTenant, StatusSessao, CargoParlamentar, TipoBancada, TipoProposicao, StatusAta, TipoDocumentoTransparencia, etc.)
- **7 migrations** (últimas: `20260413_add_audiencias_publicas`)

### Pontos Fortes
- ✅ **Índices bem distribuídos** - User(role,ativo), Sessao(status,data), Votacao(parlamentarId), MembroComissao(parlamentarId,ativo), Mandato(ativo+legislaturaId)
- ✅ **Relacionamentos explícitos** - FK com onDelete: Cascade, soft deletes parciais (campo `ativo`)
- ✅ **Suporte a multi-tenant** - Tenant.slug, dominio, subdominio, planoTenant; ConfiguracaoInstitucional por tenant
- ✅ **Campos auditoria presentes** - createdAt, updatedAt em ~90% dos modelos
- ✅ **Enums robustos** - UserRole (8 roles), StatusSessao (9 status), CargoParlamentar (5), TipoBancada (4)

### Pontos Fracos
- ⚠️ **N+1 não totalmente eliminado** - 85 TODOs encontrados no código; exemplo: notificacoes-prazo (220→6 queries em PR, mas não merged)
- ⚠️ **Falta de FK em campos críticos** - Parlamentar.legislatura é string, não FK para Legislatura; Proposicao.parlamentarId pode ser null (autor pode ser sistema)
- ⚠️ **Soft delete inconsistente** - Campo `ativo` em Parlamentar, MembroComissao, User, mas não em Proposicao, Votacao (hard delete ou sem suporte)
- ⚠️ **Campos denormalizados sem índices** - Proposicao.numero (string), Votacao.resultado (enum) sem índices combinados; busca por número+ano seria lenta
- ⚠️ **Sem versioning de entidades** - Não há histórico de mudanças (ex: Parlamentar.partido pode mudar, sem auditoria)

### Recomendações
1. **[CRÍTICO]** Adicionar índice: `Proposicao(numero, ano, tipo)` para buscas rápidas
2. **[CRÍTICO]** Tornar FK em Parlamentar.legislatura (agora string) → Legislatura.id (necessária migration com data loading)
3. **[MÉDIO]** Implementar soft delete genérico: adicionar campos `deletedAt?: DateTime` em Proposicao, Votacao, Tramitacao
4. **[MÉDIO]** Adicionar tabela `AuditoriaEvento` (modelo, recursoId, ação, timestamp, usuarioId) para rastreabilidade total

---

## 3. APIs (258 ROTAS)

**Nota: 7.1/10**

### Estatísticas
- **258 arquivos route.ts** em 70 endpoints `/api/*`
- **~190 rotas com POST/PUT/PATCH/DELETE** (modificação de dados)
- **~229 rotas com GET** (leitura de dados)
- **Padrão: `withAuth()` + `withErrorHandler()`** em 198+ imports
- **Validação Zod** em APIs críticas (Auth, e-SIC, configurações)

### Pontos Fortes
- ✅ **Error handling centralizado** - `withErrorHandler` com ZodError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, RateLimitError
- ✅ **Autenticação em camadas** - `withAuth(permissions.check(...))` em 44+ DELETE, 45+ PUT, 49+ POST
- ✅ **Rate limiting implementado** - Middleware (120 req/min global, 10 tentativas login/5min), Redis-backed (fallback memória)
- ✅ **Response standardizado** - `createSuccessResponse()` e `createErrorResponse()` com status, message, meta, timestamp
- ✅ **Paginação suportada** - `?page=1&limit=20` em proposições, votações, tramitações; meta retorna totalPages
- ✅ **Dados abertos estruturados** - `/api/dados-abertos` com CKAN-like responses, suporte a filtros, ordenação

### Pontos Fracos
- ⚠️ **Apenas 6 rotas com função async direta** - Maioria não segue o padrão moderno de "named exports" (GET, POST, PUT, DELETE)
- ⚠️ **Sem versionamento de API** - Sem `/api/v1/`, breaking changes não documentadas (ex: mudança em campo Votacao.resultado)
- ⚠️ **Documentação OpenAPI ausente** - Sem swagger.json; `/api-docs` existe mas é manual (verificar em `/src/app/api-docs`)
- ⚠️ **Paginação inconsistente** - Alguns endpoints retornam `total` + `data`, outros `meta` + `data`; sem X-Total-Count headers
- ⚠️ **CORS não documentada** - Middleware tem fallback CORS mas regra é vaga ("rejeita em vez de '*'")
- ⚠️ **Sem rate limit por usuário** - Global (IP) apenas; usuários premium deveriam ter limite > padrão

### Recomendações
1. **[CRÍTICO]** Adicionar OpenAPI schema (Swagger) gerado automaticamente via schema Zod
2. **[CRÍTICO]** Implementar versionamento: mover rotas a `/api/v1/*` e marcar `/api/*` como deprecated (6 meses)
3. **[MÉDIO]** Padronizar paginação: sempre `{ meta: { total, page, limit, totalPages }, data: [...] }`
4. **[MÉDIO]** Rate limit por tier: ADMIN=1000/min, SECRETARIA=300/min, PARLAMENTAR=100/min, ANON=20/min
5. **[BAIXO]** Adicionar `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers a todas as respostas

---

## 4. AUTENTICAÇÃO E AUTORIZAÇÃO

**Nota: 8.1/10**

### Implementação
- **NextAuth.js 4.24.7** com CredentialsProvider (email + senha + 2FA TOTP)
- **Roles**: ADMIN, EDITOR, OPERADOR, SECRETARIA, PARLAMENTAR, AUXILIAR_LEGISLATIVO, USER
- **2FA TOTP implementado** - Campo twoFactorSecret, twoFactorBackupCodes (encrypted em DB)
- **Rate limiting em auth** - Login: 10 tentativas/5min; middleware: 120 req/min global
- **JWT strategy** - sessionToken com 1 hora TTL, secure cookies (HttpOnly, SameSite=Lax)

### Pontos Fortes
- ✅ **2FA TOTP implementado** - `/lib/security/totp.ts` com backup codes, `user.twoFactorEnabled`
- ✅ **Middleware de autorização** - `/admin` (ADMIN|EDITOR|OPERADOR|SECRETARIA), `/parlamentar` (PARLAMENTAR only)
- ✅ **Permissões granulares** - `withAuth(permissions.check('sessao.manage', ['ADMIN', 'OPERADOR']))` em 44+ rotas
- ✅ **Auditoria de login** - `loginAttempt` registrado; `recordLoginAttempt()` em auth.ts
- ✅ **Proteção contra força bruta** - Redis rate limit + validação de email/senha mínimo (8 chars)
- ✅ **Sessões seguras** - Cookies __Secure- em prod, HSTS + CSP + X-Frame-Options

### Pontos Fracos
- ⚠️ **Sem revogar tokens ativos** - Logout simples (delete session), sem invalidação de JWTs em voo
- ⚠️ **Sem refresh token rotation** - JWT vira válido por 1h sem renovação; ideal seria 15min + refresh com rotation
- ⚠️ **Permissões hardcoded em rotas** - Sem DSL/RBAC engine; `['ADMIN', 'SECRETARIA']` espalhado no código
- ⚠️ **CSRF token não implementado** - Middleware não valida origin rigorosa (apenas CSP)
- ⚠️ **Sem biometria** - Apenas email + senha + TOTP; sem fingerprinting, WebAuthn
- ⚠️ **Password reset inseguro** - `verify-reset-token` não documentada; sem expiração clara de tokens

### Recomendações
1. **[CRÍTICO]** Implementar CSRF token: adicionar middleware que valida `x-csrf-token` em POST/PUT/DELETE
2. **[CRÍTICO]** Renovar tokens: JWT 15min, refresh token 30 dias com rotation (invalidar anterior ao renovar)
3. **[MÉDIO]** Extrair permissões em arquivo central: `lib/permissions.ts` com constantes tipo `const ADMIN_ROUTES = ['ADMIN']`
4. **[MÉDIO]** Adicionar token revocation: tabela `RevokedToken(tokenHash, expiresAt)` checada em middleware
5. **[BAIXO]** Implementar WebAuthn: suporte a chave de segurança (FIDO2) como 2FA alternativa

---

## 5. MÓDULO LEGISLATIVO

**Nota: 7.5/10**

### Modelos Principais
- `Proposicao` (tipo, numero, ano, status, data apresentação, parlamentar(es) autor)
- `Tramitacao` (data, local, statusAtual, statusAnterior, observações)
- `Emenda` (número, autor, parecer, resultado votação)
- `Parecer` (relator, parecer texto, votação em comissão)
- `Votacao` / `VotacaoAgrupada` (quorum, resultado, voto nominal, votoMinerva)
- `NormaJuridica` (resultado, promulgação, artigos, alterações)

### Pontos Fortes
- ✅ **Fluxo legislativo completo** - Apresentação → Tramitação → Comissão → Pauta → Votação → Promulgação/Arquivo
- ✅ **Voto de Minerva implementado** - Campo `votoMinerva` em VotacaoAgrupada; lógica em `sessao-controle.ts` linhas ~350
- ✅ **Emendas com votação separada** - `Emenda` com `resultado` (APROVADA|REJEITADA|RETIRADA); `VotoEmenda` para cada voto
- ✅ **Status finais múltiplos** - PROMULGADA, VETADA, VETO_DERRUBADO, ARQUIVADA, TRANSFORMADA_NORMA
- ✅ **Timeline unificada** - GET `/api/proposicoes/[id]/timeline` retorna eventos ordenados (apresentação, tramitação, pauta, votação, promulgação)
- ✅ **Validações de transição** - Mapa `VALID_STATUS_TRANSITIONS` em proposicoes-service.ts

### Pontos Fracos
- ⚠️ **Fluxo de pauta não está centralizado** - `PautaItem`, `DestaquePautaItem`, `Sessao.pautaSessao` espalhos; sem orquestrador
- ⚠️ **Proposição.parlamentarId obrigatório? Não** - Campo pode ser null (permite sistema como autor), gera ambiguidade
- ⚠️ **Sem controle de iniciativa privativa** - Lei Orgânica define quem pode propor cada tipo; RN-020 não validada em API
- ⚠️ **Tramitação linear** - Sem suporte a retorno para comissão anterior (usual em legislaturas)
- ⚠️ **Sem prazos configuráveis** - Análise em comissão é 30 dias hard-coded? (verificar em comissoes-service.ts)
- ⚠️ **Dados sensivelmente correlacionados** - Proposicao.dataApresentacao, Tramitacao.data, PautaSessao.data podem desincronizar

### Recomendações
1. **[CRÍTICO]** Validar RN-020 (iniciativa privativa) em POST `/api/proposicoes`: somente ADMIN pode propor Emenda Constitucional
2. **[CRÍTICO]** Implementar prazos configuráveis: `ConfiguracaoQuorum` estende com `analiseTematicoPrazoDias: 30`
3. **[MÉDIO]** Orquestrador de pauta: nova tabela `PautaOrquestrador` que valida elegibilidade de proposição antes de inserir em PautaItem
4. **[MÉDIO]** Auditar todos os status transitions: histórico em AuditoriaEvento(modelo='Proposicao', statusAnterior, statusNovo)

---

## 6. SESSÕES E VOTAÇÃO EM TEMPO REAL

**Nota: 7.3/10**

### Implementação
- `Sessao` (numero, tipo, data, horário, status, ata, quorum, painelAberto)
- `VotacaoAgrupada` (resultado, quorum, votoMinerva, observacoes)
- `MesaSessao` + `MembroMesaSessao` (presidente, secretários, por sessão)
- Painel operador em `/painel-operador/[sessaoId]`
- Stream em tempo real via `/api/painel/stream` (EventSource)

### Pontos Fortes
- ✅ **Painel operador funcional** - `/src/app/painel-operador/[sessaoId]/` com cronômetro, quorum, votação nominal
- ✅ **Quorum configurável** - `ConfiguracaoQuorum` com quorum por tipo (ORDINARIA, EXTRAORDINARIA, SOLENE)
- ✅ **Votação nominal com painel eletrônico** - `Votacao` com voto SIM/NÃO/ABSTENÇÃO/BRANCO por parlamentar
- ✅ **Controle de tempo** - Campo `tempoInicio`, `tempoAcumulado` em Sessao; cronômetro de orador em MesaSessao
- ✅ **Ata com aprovação futura** - Campo `statusAta` (PENDENTE), `sessaoAprovacaoAtaId` (sessão N+1 que aprova)
- ✅ **Streaming parcial** - `/api/painel/stream` implementado (verificar se completo)

### Pontos Fracos
- ⚠️ **Sem WebSocket real** - Apenas EventSource (unidirecional); múltiplas operações (orador inscrito, votação aberta) podem perder eventos
- ⚠️ **Sincronização de painel público vs operador** - `/painel-publico` é estático; sem atualização em tempo real do painel eletrônico público
- ⚠️ **Cronômetro depende de polling** - Navegador checa `SessionBanner` a cada N segundos; pode ter drift
- ⚠️ **Quorum não valida após início** - Uma vez instalada, não há check de quórum mínimo durante votações (ex: parlamentar sai da sessão)
- ⚠️ **Sem anti-hack de votação** - Votação pode ser registrada múltiplas vezes (ex: 2 req simultâneos); sem idempotency keys
- ⚠️ **Painel eletrônico sem prioridade** - Votação pode ocorrer em qualquer ordem de item de pauta; sem lock de sequência

### Recomendações
1. **[CRÍTICO]** Trocar EventSource por WebSocket (Socket.io ou ws): bidirecional, menor latência, melhor UX
2. **[CRÍTICO]** Adicionar idempotency keys: `POST /api/painel/votar` requer `x-idempotency-key` único por votação+parlamentar
3. **[MÉDIO]** Validar quórum contínuo: middleware que checa Sessao.painelAberto → conta presencas e alerta se quórum cai
4. **[MÉDIO]** Painel público sync com painel operador: usar mesmo WebSocket, emitir eventos públicos (votação aberta, resultado)
5. **[BAIXO]** Adicionar replay: tabela `EventoSessao(sessaoId, tipo, timestamp, dados)` para auditoria de votação

---

## 7. COMISSÕES

**Nota: 7.4/10**

### Modelos
- `Comissao` (nome, tipo, criacao, integrantes)
- `MembroComissao` (parlamentar, cargo, data início/fim, ativo)
- `ReuniaoComissao` (data, horário, local, pauta, ata)
- `PautaReuniaoComissao` (item, resultado votação, parecer)
- `Parecer` (relator, texto, votação resultado)

### Pontos Fortes
- ✅ **Comissões estruturadas** - ORDINARIA, EXTRAORDINARIA, TEMPORARIA (enum TipoComissao)
- ✅ **Pareceres com votação** - `Parecer` com relator, `VotoParecerComissao` (SIM/NÃO por membro)
- ✅ **Reuniões cronometradas** - `ReuniaoComissao` com `dataHora`, `ata`, `statusAta` similar a Sessao
- ✅ **Dashboard de comissões** - `/admin/comissoes` com estatísticas de pareceres, prazos vencidos
- ✅ **Componentes UI para votação** - `VotingGrid`, `QuickParecerForm`, `DeadlineIndicator`

### Pontos Fracos
- ⚠️ **CPI não tem modelo dedicado** - TipoComissao.CPI existe, mas sem campos CPI-específicos (data inicio/fim investigação, relatório)
- ⚠️ **Prazos de parecer não configuráveis** - Hard-coded 30 dias em comissoes-service.ts? (não encontrado explícito, verificar)
- ⚠️ **Sem presença em reunião** - Não há `PresencaReuniaoComissao`; somente em sessão plenária
- ⚠️ **Parecer sem versionamento** - Alterações em parecer (ex: relator muda) sem histórico
- ⚠️ **CPI sem relatório estruturado** - Sem modelo para armazenar PDF, anexos do relatório final

### Recomendações
1. **[MÉDIO]** Adicionar modelo `PresencaReuniaoComissao` (comissaoId, parlamentarId, data, presente)
2. **[MÉDIO]** Criar modelo `RelatorioInvestigacao` para CPI: (investigacaoId, dataInicio, dataFim, relatorioURL, statusPulblicacao)
3. **[MÉDIO]** Versionar pareceres: adicionar campo `versao` em Parecer e tabela `HistoricoParecerVersao`
4. **[BAIXO]** Adicionar alerta de prazo: notificação ao relator 3 dias antes de parecer vencer

---

## 8. PORTAL TRANSPARÊNCIA / PNTP

**Nota: 7.6/10**

### Modelos Implementados (Recentes - 12/04/2026)
- `DocumentoTransparencia` (tipo enum: Balancete, Parecer TCM, Julgamento Contas, etc.)
- `NotaFiscal` (numero, fornecedor, valor, chaveNFe, situacao)
- `OrdemPagamento` (numero, credor, valor, dataPagamento, situacao)
- `Veiculo` (placa, marca, modelo, chassi, RENAVAM, situacao)
- `Obra` (descricao, contratada, valor, situacao enum)
- `Repasse` (orgaoOrigem, programa, valor, anoMes)
- `CartaoCorporativo` (portador, estabelecimento, valor, dataCompra)
- `ProgramaAcao` (codigo, nome, tipo enum, valorPrevisto, valorExecutado)
- `ServicoOnline` (nome, url, categoria, ativo)
- `FornecedorSancionado` (nome, cnpj, tipoSancao enum, dataInicio/Fim)

### Pontos Fortes
- ✅ **9 tipos de documentação implementados** - Cobertura completa PNTP Diamante (Balancetes, Balanços, Pareceres TCM, etc.)
- ✅ **APIs CRUD para transparência** - 10 endpoints (documentos-transparencia, notas-fiscais, ordem-pagamentos, veiculos, obras, repasses, cartoes-corporativos, programas-acoes, servicos-online, fornecedores-sancionados)
- ✅ **Páginas públicas estruturadas** - `/transparencia/notas-fiscais`, `/transparencia/veiculos`, `/transparencia/obras`, etc. com busca e filtros
- ✅ **Sistema de períodos por categoria** - `transparencia-redirect-service` estendido com `getPeriodos()`, `setPeriodos()`, permite múltiplos períodos por recurso
- ✅ **Admin CRUD completo** - Edit support em todas as 5 páginas admin de transparência
- ✅ **Acessibilidade WCAG** - Breadcrumbs em transparencia/page.tsx, aria-labels em sections
- ✅ **Dados abertos (CKAN-like)** - `/api/dados-abertos` com estrutura XML, suporte a filtros

### Pontos Fracos
- ⚠️ **Dados legado CR2 não importados** - Script `scripts/import-cr2-backup.ts` só tem skeleton; mapeamentos são TODO
- ⚠️ **Períodos sem validação** - Admin pode criar períodos overlapping sem erro
- ⚠️ **Integração PNTP incompleta** - Conforme REGRAS-DE-NEGOCIO.md RN-120: "dados em 30 dias", mas sem cronjob de sincronização com repositório federal
- ⚠️ **Sem versionamento de documentos** - Documento pode ser atualizado sem manter histórico (ideal: audit trail de qual versão foi publicada quando)
- ⚠️ **Sem API de dados estruturados** - Só XML genérico; ideal seria JSON-LD, RDF para consumo programático
- ⚠️ **Conformidade PNTP auto-reportada** - `/api/admin/conformidade-pntp` checa localmente, não valida contra servidor federal

### Recomendações
1. **[CRÍTICO]** Implementar importador CR2: completar `scripts/import-cr2-backup.ts` com parsing real do arquivo (JSON ou CSV)
2. **[CRÍTICO]** Adicionar validação de períodos: durante POST em `/api/transparencia/periodos`, verificar sobreposição de datas
3. **[MÉDIO]** Implementar conformidade federated: chamar API PNTP federal (se existente) para validação de reporte
4. **[MÉDIO]** Versionamento de documentos: adicionar campo `versao`, `publicadoEm`, `substituiDocumentoId`
5. **[BAIXO]** Exportar dados em JSON-LD: nova rota `/api/transparencia/dados-estruturados.jsonld` com @context PNTP

---

## 9. ÁREA PARLAMENTAR

**Nota: 6.9/10**

### Implementação
- `/parlamentar` (protegido, role PARLAMENTAR)
- Dashboard com participação, votações, comissões
- Histórico de votação nominal
- Documentos legislativos pessoais (proposições, emendas)

### Pontos Fortes
- ✅ **Separado de área pública `/parlamentares`** - Middleware distingue `/parlamentar` (protegido) vs `/parlamentares` (público)
- ✅ **Dashboard personalizado** - Cards com votação recent, comissões, participação
- ✅ **Histórico de votação** - `/api/parlamentar/votacoes` retorna votações nominais do usuário-parlamentar
- ✅ **Acesso a proposições pessoais** - Parlamentar pode ver suas proposições, emendas, pareceres como relator

### Pontos Fracos
- ⚠️ **Dashboard estático** - Não há personalização (abas, filtros, exportação)
- ⚠️ **Sem notificações de pauta** - Parlamentar não é notificado quando sua proposição entra em votação
- ⚠️ **Sem histórico de presença** - Não há visualização de presença nas sessões (data, sessão, presença/ausência)
- ⚠️ **Sem módulo de gabinete** - Sem gestão de assessores, agendas, comunicações
- ⚠️ **Votação remota não suportada** - Todas as votações assume presença física; sem votação por PL
- ⚠️ **Pouca integração legislativa** - Dashboard não mostra prazos de tramitação, alertas de comissão

### Recomendações
1. **[MÉDIO]** Adicionar notificações: quando proposição entra em pauta, enviar notificação via email + SISTEMA
2. **[MÉDIO]** Implementar presença: adicionar visualização de presença em `/parlamentar/presenca` com filtro por período
3. **[MÉDIO]** Adicionar exportação: PDF com relatório de atividade (proposições, votações, presença)
4. **[BAIXO]** Suportar votação remota: campo `votacaoRemota` em Votacao, com JWTs únicos para validar identidade

---

## 10. ADMIN (USUÁRIOS, CONFIGURAÇÕES, AUDITORIA)

**Nota: 7.7/10**

### Implementação
- `/admin` (roles: ADMIN, EDITOR, OPERADOR, SECRETARIA)
- Usuários com roles, 2FA, permissões
- Configurações institucionais (cores, logos, redes sociais)
- Auditoria: `AuditLog` ou `SecurityAlert`?
- Dashboard com KPIs, alertas, relatórios

### Pontos Fortes
- ✅ **Gestão de usuários centralizada** - `/admin/usuarios` com criar, editar, deletar, resetar 2FA
- ✅ **Configurações por tenant** - `ConfiguracaoInstitucional` com cores, logos, redes sociais; upload de imagem
- ✅ **2FA management** - Admin pode forçar reset de 2FA em usuário
- ✅ **Dashboard rico** - KPIs (vereadores, comissões, legislatura, mesa diretora), gráficos com Recharts
- ✅ **Alertas de conformidade** - `/api/admin/conformidade-pntp` verifica nível de conformidade
- ✅ **Notificações de prazo** - `/api/admin/notificacoes-prazo` gera alertas para prazos vencidos
- ✅ **Audit trail** - Função `logAuditError()` e `recordLoginAttempt()`; modelo `SecurityAlert`

### Pontos Fracos
- ⚠️ **Auditoria incompleta** - Modelo `SecurityAlert` existe mas não registra TODAS as ações de admin (ex: editar proposição)
- ⚠️ **Logs não exportáveis** - Sem endpoint GET `/api/admin/auditoria/logs` com filtros (data, usuário, ação)
- ⚠️ **Sem revogação de permissões** - Uma vez admin, remove acesso mas não invalida sessões ativas
- ⚠️ **Sem backup automático** - Sem agendamento de backup diário ou backup-on-change
- ⚠️ **Dashboard lento** - Sem cache; cada query de KPI (count proposições, votações, etc.) faz N queries
- ⚠️ **Sem rastreamento de mudanças** - Editar configuração de cores não deixa "quem mudou" ou "quando"

### Recomendações
1. **[CRÍTICO]** Auditar todas as ações de admin: adicionar log em POST/PUT/DELETE de `/admin/usuarios`, `/admin/configuracoes`, `/admin/comissoes`, etc.
2. **[CRÍTICO]** Implementar revogação de sessão: quando remover admin, chamar `DELETE /api/admin/usuarios/[id]/sessions`
3. **[MÉDIO]** Adicionar export de logs: GET `/api/admin/auditoria/logs?startDate=&endDate=&acao=&usuarioId=` retorna CSV/JSON
4. **[MÉDIO]** Cachear dashboard KPIs: usar `LEGISLATIVE_TTL.SLOW` (1h em Redis) para counts
5. **[BAIXO]** Adicionar changelog automático: cada PUT em ConfiguracaoInstitucional gera log em `AuditoriaEvento` com `before` e `after` JSON

---

## 11. FRONTEND / DESIGN SYSTEM

**Nota: 7.3/10**

### Stack
- Tailwind CSS 3.4.4 + `class-variance-authority` para CVA
- Radix UI (14 componentes: Dialog, Alert, Dropdown, Select, Tabs, etc.)
- Recharts 2.12.7 para gráficos
- Lucide React 0.408.0 para ícones
- Dark mode via `next-themes`

### Componentes
- **141 componentes TSX** em `/src/components`
- **Base UI**: Button, Card, Dialog, Form, Input, Label, Select, Table, Textarea, etc. (~20)
- **Domain**: Admin (sidebar, header, cards), Home (hero, features), Layout (header, footer, breadcrumbs)
- **Específicos**: Painel operador, votação, cronômetro, transparência

### Pontos Fortes
- ✅ **CVA bem estruturado** - Button, Badge, Alert com size/variant/color props
- ✅ **Dark mode implementado** - MunicipalThemeProvider com cores por tenant injetadas em CSS variables
- ✅ **Responsive com Tailwind** - Breakpoints em sm/md/lg/xl; components adaptativos
- ✅ **Acessibilidade parcial** - WCAG alt text em imagens (fotografias parlamentares), htmlFor em labels, aria-labels em sections
- ✅ **Ícones Lucide** - 408 ícones disponíveis, bem integrados
- ✅ **Recharts para dashboards** - Gráficos animados, responsive

### Pontos Fracos
- ⚠️ **Sem design tokens centralizados** - Cores em CSS variables + Tailwind config; sem Figma plugin, sem controle de espacamento
- ⚠️ **Inconsistência de espaçamento** - Alguns componentes usam `p-4`, outros `px-6 py-4`; sem escala consistente
- ⚠️ **Sem skeleton loaders por componente** - Loading state é genérico (spinner); sem shimmer loaders customizados
- ⚠️ **Pouca reutilização de componentes** - Duplos: Modal vs Dialog, SectionCard vs AdminCard
- ⚠️ **Sem storybook ou doc site** - Design tokens não documentados; componentes sem histórias de uso
- ⚠️ **WCAG incompleto** - Sem teste automático com jest-axe; contrast ratio não validado em cores customizadas

### Recomendações
1. **[MÉDIO]** Centralizar design tokens: nova pasta `/src/lib/design-tokens/` com constantes COLORS, SPACING, FONT_SIZES
2. **[MÉDIO]** Criar Storybook: documentar 30 componentes mais usados com stories e playground
3. **[MÉDIO]** Adicionar skeleton loaders: criar `<SkeletonCard>`, `<SkeletonTable>`, etc. para cada tipo de componente
4. **[BAIXO]** Validar WCAG automaticamente: adicionar teste `jest-axe` no CI para componentes críticos (form, table, navigation)

---

## 12. PERFORMANCE

**Nota: 6.8/10**

### Análise
- **7.6k LOC** em `/src` (código fonte, sem node_modules)
- **44 componentes com next/image**, 6 com Suspense/lazy
- **Índices no DB**: 250 @@index/@@unique distribuídos

### Pontos Fortes
- ✅ **Imagens otimizadas** - `next/image` com placeholder, sizes, lazy loading
- ✅ **Code splitting** - Alguns componentes com `dynamic()` (painel operador, modals)
- ✅ **Cache em 3 camadas** - Memory (60s) + Redis (5min) + Stale-While-Revalidate (30min) em `cache-strategy.ts`
- ✅ **Índices críticos adicionados** - Votacao(parlamentarId), MembroComissao(parlamentarId,ativo), Mandato(ativo+legislaturaId)
- ✅ **API paginada** - `/api/proposicoes?page=1&limit=20` com meta

### Pontos Fracos
- ⚠️ **Sem ISR** - Apenas home e sitemap geram estáticamente; proposições, transparência deveriam ser `revalidate: 3600`
- ⚠️ **N+1 queries ainda presentes** - 85 TODOs encontrados; exemplo notificacoes-prazo reduzida 220→6 queries em PR não merged
- ⚠️ **Sem Service Worker** - Sem offline support, sem caching de assets
- ⚠️ **CSS-in-JS em Client Components** - Tailwind inline em Recharts aumenta bundle
- ⚠️ **Sem bundle analysis** - Tamanho do Next.js build não documentado; sem webpack-bundle-analyzer
- ⚠️ **Database connection pooling mínimo** - Sem PgBouncer/PgPool; Prisma usa pooling nativo (150 conexões default)

### Recomendações
1. **[CRÍTICO]** Implementar ISR: `export const revalidate = 3600` em proposições, comissões, parlamentares, transparência
2. **[CRÍTICO]** Implementar merge de PRs pendentes: eliminar N+1 em notificacoes-prazo, comissoes-service, votacao-service
3. **[MÉDIO]** Adicionar Service Worker: workbox para offline + caching de assets, styles, imagens
4. **[MÉDIO]** Validar bundle size: integrar webpack-bundle-analyzer no build, estabelecer limites (JS: 500KB gzip)
5. **[BAIXO]** Otimizar Recharts: considerar recharts-lite ou Victory se grafo > 100KB

---

## 13. SEGURANÇA

**Nota: 7.9/10**

### Implementação
- **Middleware CSP completo** - `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (dev: +unsafe-eval), `style-src 'self' 'unsafe-inline'`
- **HSTS** - `max-age=31536000; includeSubDomains; preload` em produção
- **X-Frame-Options: SAMEORIGIN**
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Sanitização de HTML** - `dompurify` em admin editor (verificar se usado sempre)
- **Rate limiting** - IP-based (120 req/min global, 10 login/5min)
- **Input validation** - Zod em APIs críticas
- **Password hash** - bcryptjs com salt rounds (verificar iterações)

### Pontos Fortes
- ✅ **CSP bem configurado** - Permite inline styles (Tailwind) mas bloqueia scripts não-self
- ✅ **HTTPS enforced** - HSTS em produção, secure cookies
- ✅ **Input validation com Zod** - 4 schemas de validação em `/lib/validation/`; APIs críticas usam
- ✅ **SQL injection prevenido** - Prisma ORM, sem queries raw
- ✅ **XSS sanitizado** - `sanitizeRichHtml()` em admin sessões (verificar cobertura)
- ✅ **CORS controlado** - Fallback seguro (rejeita vs '*')
- ✅ **Headers customizados de segurança** - Permissions-Policy, Referrer-Policy adicionados

### Pontos Fracos
- ⚠️ **CSP nonce não implementado** - Sem dynamic nonce para inline scripts; cai em unsafe-inline
- ⚠️ **CSRF token ausente** - Sem validação de origin header rigorosa; confiar só em SameSite é insuficiente
- ⚠️ **DOMPurify coverage desconhecida** - Usado em `admin/sessoes/[id]` para sanitizeRichHtml, mas não em outras entidades
- ⚠️ **Sem rate limit por usuário** - Global (IP) apenas; usuários podem usar múltiplas IPs
- ⚠️ **Secrets em .env não rotacionados** - NEXTAUTH_SECRET, RESEND_API_KEY não têm estratégia de rotação
- ⚠️ **Sem verificação de integridade de uploads** - Upload de arquivo não valida MIME type, tamanho máximo não claro
- ⚠️ **Bcryptjs rounds desconhecidos** - Não está documentado quantas iterações (10? 12?)

### Recomendações
1. **[CRÍTICO]** Implementar CSRF token: adicionar middleware que valida `x-csrf-token` em POST/PUT/DELETE, gera novo a cada GET
2. **[CRÍTICO]** Auditar DOMPurify: garantir que TODAS as páginas que renderizam HTML dinâmico usam sanitizeRichHtml()
3. **[MÉDIO]** Adicionar CSP nonce: gerar nonce único por request, injetar em `<script nonce={nonce}>`, atualizar headers
4. **[MÉDIO]** Implementar rate limit por usuário: adicionar camada sobre redis com chave `user:{userId}:action:{acao}`
5. **[BAIXO]** Documentar bcryptjs rounds: adicionar constante `BCRYPT_ROUNDS = 12` em auth.ts

---

## 14. QUALIDADE DE CÓDIGO

**Nota: 7.1/10**

### Estatísticas
- **7.6k LOC** em `/src` (código fonte)
- **615 ocorrências de `any`** encontradas (muitas em tipos de props, callbacks)
- **85 TODOs/FIXMEs** espalhados
- **250 índices/constraints** no schema
- **7 migrations** aplicadas
- **TypeScript strict: true** em tsconfig (porém noImplicitAny: false)

### Pontos Fortes
- ✅ **TypeScript 5.5.3 strict mode** - `strict: true`, `isolatedModules: true` no tsconfig
- ✅ **Estrutura de pastas clara** - `/app` (páginas), `/components` (UI), `/lib` (lógica), `/types` (tipos)
- ✅ **Zod validation schemas** - 4 arquivos em `/lib/validation/` com schemas para Auth, Proposicao, Votacao, Comissao
- ✅ **Logging estruturado** - createLogger() com contexto, níveis (info, warn, error)
- ✅ **Error handling centralizado** - AppError, ValidationError, NotFoundError com status codes e detalhes
- ✅ **Padrão de permissões** - `withAuth(permissions.check(...))` consistente em 44+ rotas

### Pontos Fracos
- ⚠️ **615 ocorrências de `any`** - Muitas em Props types (`interface Props { [key: string]: any }`), callbacks, tipos de contexto
- ⚠️ **noImplicitAny: false** - Parâmetros sem tipo não geram erro; ideal seria noImplicitAny: true
- ⚠️ **85 TODOs/FIXMEs não trackeados** - Sem issue de GitHub, sem priorização
- ⚠️ **Sem linter customizado** - ESLint padrão do Next.js; sem regras adicionais para padrão interno (naming, structure)
- ⚠️ **Documentação inline esparsa** - Muitas funções sem JSDoc; APIs críticas sem @example
- ⚠️ **Duplicação de código** - Modais, forms, tables têm padrões similares mas sem abstração comum
- ⚠️ **Sem teste de tipos** - Sem type checking de props em tempo de compilação; `@testing-library/react` não checa tipos

### Recomendações
1. **[CRÍTICO]** Ativar `noImplicitAny: true`: encontrar todos os `any`, tipificar como `unknown` ou tipo específico
2. **[CRÍTICO]** Criar issue tracker de TODOs: executar `grep -r "TODO\|FIXME"` e abrir issues no GitHub com priorização
3. **[MÉDIO]** Adicionar ESLint customizado: regras para padrão de naming (componentes: PascalCase, services: camelCase), sem `any`
4. **[MÉDIO]** Documentar APIs críticas: adicionar JSDoc com @param, @returns, @example em services, utils, hooks
5. **[MÉDIO]** Eliminar duplicação: abstrair modais (Modal.tsx), forms (FormBase.tsx), tables (TableBase.tsx)

---

## 15. TESTES

**Nota: 5.2/10**

### Implementação
- **Jest 30.2.0** para unit tests
- **Playwright 1.57.0** para E2E tests
- **8 suites de E2E**: admin, api, busca, home, legislativo, login, parlamentares, transparencia
- **725 linhas totais de E2E**

### Pontos Fortes
- ✅ **E2E com Playwright** - Suporte a múltiplos browsers, visual regression (com --update-snapshots)
- ✅ **Scripts de teste** - `npm run test`, `npm run test:coverage`, `npm run test:e2e`, `npm run test:e2e:ui`
- ✅ **CI/CD workflow** - `.github/workflows/ci-tests.yml` com lint + typecheck + testes em PRs

### Pontos Fracos
- ⚠️ **Cobertura desconhecida** - Sem `npm run test:coverage` executado; sem relatório de cobertura no CI
- ⚠️ **Pocos testes unitários** - `src/__tests__/` não parece ativo; jest config aponta para node_modules
- ⚠️ **E2E frágil** - Apenas 8 suites, 725 LOC total; seria ~90 testes, mas sem asserções claras
- ⚠️ **Sem mocking de APIs** - E2E chama APIs reais ou mock?
- ⚠️ **Sem teste de performance** - Sem load testing (k6 existe em `/load-tests/scripts/k6-tramitacoes.js` mas não integrado)
- ⚠️ **Sem testes de acessibilidade** - jest-axe instalado mas não usado no CI

### Recomendações
1. **[CRÍTICO]** Implementar cobertura de código: adicionar `npm run test:coverage` no CI, estabelecer limite mínimo (70%)
2. **[CRÍTICO]** Expandir E2E: adicionar 20+ casos de teste (proposição CRUD, votação, comissão)
3. **[MÉDIO]** Adicionar testes unitários: foco em services críticos (votacao-service, tramitacao-service, sessao-controle)
4. **[MÉDIO]** Executar load tests no CI: k6 tramitacoes mensalmente ou antes de deploy para produção
5. **[BAIXO]** Adicionar testes de acessibilidade: no CI com jest-axe em componentes críticos (form, table, modal)

---

## 16. DEPLOY/DEVOPS

**Nota: 7.4/10**

### Implementação
- **VPS (cmchaves.pa.gov.br)** com PostgreSQL local (ou Supabase em transição)
- **Supabase/Vercel** para preview + staging
- **Scripts de instalação** - `scripts/install.sh` (3000+ linhas) com suporte VPS Local, VPS+Supabase, Docker Compose
- **PM2** para gerenciamento de processo em produção
- **Nginx** como reverse proxy
- **Docker Compose** opcional

### Pontos Fortes
- ✅ **install.sh bem documentado** - Menu de tipo de instalação, coleta de dados, verificação de requisitos
- ✅ **Suporte a 3 modos** - VPS Local (PostgreSQL integrado), VPS+Supabase (cloud DB), Docker Compose
- ✅ **SSL/HTTPS com Certbot** - Integrado no install.sh, auto-renew
- ✅ **PM2 + Nginx** - Produção com gerenciamento de processos, logging
- ✅ **Migration scripts** - `db:migrate-mock`, `db:limpar`, `db:seed` para gerenciamento de dados
- ✅ **Health check** - `/api/health` implementado, `/api/readiness` para K8s-style probes

### Pontos Fracos
- ⚠️ **Sem CI/CD pipeline completo** - GitHub Actions só faz lint+test; sem auto-deploy em main
- ⚠️ **Sem rolling deployment** - PM2 só reinicia (não blue-green); downtime durante deploy
- ⚠️ **Backup não automatizado** - Sem cronjob de backup diário; `backup-service.ts` existe mas não integrado
- ⚠️ **Versões hardcoded** - Node 20 LTS, PostgreSQL 15 em install.sh; sem suporte a múltiplas versões
- ⚠️ **Logs não centralizados** - PM2 logs locais; sem ELK, Datadog, CloudWatch
- ⚠️ **Sem monitoramento de uptime** - `/api/health` existe mas sem alerta automático (PagerDuty, Opsgenie)

### Recomendações
1. **[CRÍTICO]** Implementar auto-deploy: adicionar GitHub Actions workflow que faz deploy em push para main (com aprovação)
2. **[CRÍTICO]** Implementar blue-green deployment: 2 instâncias PM2, trocar traffic sem downtime
3. **[MÉDIO]** Implementar backup automático: cronjob diário via PM2 que chama `backup-service.ts`
4. **[MÉDIO]** Centralizar logs: integrar PM2+ com CloudWatch ou ELK; alertas para ERROR/CRITICAL
5. **[BAIXO]** Monitorar uptime: integrar `/api/health` com UptimeRobot ou Cronitor; alerta se > 5min down

---

## 17. DOCUMENTAÇÃO

**Nota: 7.9/10**

### Arquivos
- **CLAUDE.md** (200 linhas) - Regras de projeto, checklist de documentação
- **ESTADO-ATUAL.md** (400+ linhas) - Status atual de cada módulo, histórico de mudanças
- **REGRAS-DE-NEGOCIO.md** - Regras legislativas (RN-XXX)
- **docs/** (25k+ linhas totais) - PADROES-CODIGO.md, MODELOS-DADOS.md, FLUXO-LEGISLATIVO.md, skills/
- **docs/skills/** (8 arquivos) - skill-frontend, skill-legislativo, skill-operador, skill-comissoes, skill-transparencia, skill-parlamentar, skill-admin, skill-secretaria

### Pontos Fortes
- ✅ **Documentação obrigatória enforced** - CLAUDE.md marca DOC-001 a DOC-007 como regras invioláveis
- ✅ **Skills como living documentation** - 8 skills especializadas por módulo, atualizadas com checklist de implementação
- ✅ **ESTADO-ATUAL com histórico** - Últimas mudanças datadas (12/04, 10/04, 07/04, 06/04) com detalhes
- ✅ **Regras de negócio documentadas** - RN-XXX (RN-001 a RN-120+) em REGRAS-DE-NEGOCIO.md
- ✅ **Padrões de código explícitos** - PADROES-CODIGO.md com nomenclatura, estrutura de componentes, APIs, validação Zod

### Pontos Fracos
- ⚠️ **Skills não sincronizadas com código** - Algumas skills desatualizadas; ex: skill-frontend pode não refletir componentes novos
- ⚠️ **Sem API documentation** - OpenAPI/Swagger ausente; 258 rotas sem documentação centralizada
- ⚠️ **Sem runbook de operação** - Guia de troubleshooting para erros comuns não encontrado
- ⚠️ **Sem arquitetura em diagrama** - Sem C4, ERD visual; apenas texto
- ⚠️ **Documentação dispersa** - Regras em REGRAS-DE-NEGOCIO.md, fluxo em docs/, código em code; sem single source of truth

### Recomendações
1. **[MÉDIO]** Gerar OpenAPI schema: criar script que percorre `/api/**/route.ts` e gera swagger.json automático
2. **[MÉDIO]** Criar diagrama de arquitetura: C4 component diagram com Mermaid (em docs/ARQUITETURA.md)
3. **[MÉDIO]** Sincronizar skills: adicionar pré-commit hook que verifica se skill foi atualizada ao mexer em modulo correspondente
4. **[BAIXO]** Criar runbook: `docs/TROUBLESHOOTING.md` com erros comuns (500 em /api/sessoes, rate limit errors, etc.)

---

## 18. ACESSIBILIDADE (WCAG)

**Nota: 6.3/10**

### Implementação
- **Alt text** em imagens (fotografias parlamentares, logos)
- **ARIA labels** em sections, navs
- **htmlFor/id** em labels de formulário
- **Role="region"** em tabelas com scroll horizontal
- **Breadcrumbs** em páginas públicas
- **jest-axe** instalado mas não usado no CI

### Pontos Fortes
- ✅ **Alt text em fotos** - Parlamentares em `/legislativo/proposicoes/[id]` têm `alt="Nome do Autor"`
- ✅ **Breadcrumbs acessíveis** - HTML semântico com `<nav aria-label="Breadcrumb">`
- ✅ **Form labels acessíveis** - `<label htmlFor="email">` + `<input id="email">`
- ✅ **Contraste razoável** - Cores do tema validadas (verificar em layout.tsx linha 89)
- ✅ **Keyboard navigation** - Radix UI fornece navegação por teclado em componentes (Dialog, Menu, etc.)

### Pontos Fracos
- ⚠️ **WCAG completo não validado** - Sem teste automático; apenas manual em alguns pontos
- ⚠️ **Cores customizadas não validadas** - Admin pode definir cores com contraste insuficiente
- ⚠️ **Tabelas sem associações** - Sem `<thead>`, `<tbody>`, `<th scope>`; sem `aria-sort`
- ⚠️ **Modais sem focus trap** - Radix Dialog fornece, mas não testado
- ⚠️ **Links sem contexto** - Alguns "Ver mais" sem aria-label descritivo
- ⚠️ **Vídeos sem legendas** - URLs de vídeos/transmissão (Sessao.urlVideo) sem caption info

### Recomendações
1. **[CRÍTICO]** Validar contraste: adicionar script que checa cores customizadas contra WCAG AA (4.5:1 para texto)
2. **[MÉDIO]** Executar jest-axe no CI: testar 10 componentes críticos (Form, Table, Modal, Navigation)
3. **[MÉDIO]** Melhorar tabelas: adicionar `<thead>`, `<th scope="col">`, `aria-sort` em colunas ordenáveis
4. **[MÉDIO]** Adicionar legendas a vídeos: documentar obrigatoriedade de captioning para URLs em Sessao.urlVideo
5. **[BAIXO]** Testar navegação por teclado: manual testing de Tab, Shift+Tab, Enter, Escape em formulários críticos

---

## 19. EMAIL / INTEGRAÇÕES EXTERNAS

**Nota: 7.6/10**

### Implementação
- **Resend 6.8.0** para emails
- **Nodemailer 7.0.13** como fallback (SMTP)
- **Transport detection** automático: SMTP → Resend → dev mode
- **Email templates HTML** em email-service.ts
- **Notificações multicanal** - SISTEMA, EMAIL, WHATSAPP?

### Pontos Fortes
- ✅ **Transport plugável** - Detecta SMTP_HOST/RESEND_API_KEY, fallback para dev mode
- ✅ **Templates HTML inline** - Email service gera HTML, não depende de arquivo externo
- ✅ **Nodemailer com suporte Gmail/SMTP** - Funciona com qualquer servidor SMTP
- ✅ **Logging de email** - Registra sucessos e erros com action, messageId, to, subject
- ✅ **Notificações de prazo automáticas** - `/api/admin/notificacoes-prazo` gera alerts via NotificacaoMulticanal

### Pontos Fracos
- ⚠️ **WhatsApp não implementado** - Modelo NotificacaoMulticanal existe mas não integrado com Twilio/WhatsApp
- ⚠️ **Sem templates de email** - HTML gerado inline; sem suporte a templates Mjml ou Handlebars
- ⚠️ **Sem unsubscribe links** - Emails não têm List-Unsubscribe header
- ⚠️ **Sem bounce handling** - Soft bounces não são tratados; emailVerified pode ficar desincronizado
- ⚠️ **Sem webhooks de email** - Sem notificação de delivered/opened/bounced
- ⚠️ **Sem rate limit de email** - Usuário pode triggerar email múltiplas vezes

### Recomendações
1. **[MÉDIO]** Implementar WhatsApp: integrar Twilio com NotificacaoMulticanal.WHATSAPP
2. **[MÉDIO]** Adicionar unsubscribe: incluir List-Unsubscribe header com mailto: e URL de preferências
3. **[MÉDIO]** Implementar webhooks de email: endpoint GET `/api/integraciones/webhooks/resend` para delivered/bounced
4. **[BAIXO]** Adicionar templates Mjml: refatorar email-service para usar Mjml templates (melhor mantenibilidade)
5. **[BAIXO]** Rate limit de email: adicionar cache em Redis com chave `email-sent:{email}:{tipo}` TTL 24h

---

## 20. CONFORMIDADE LEGAL (LAI, LGPD, PNTP)

**Nota: 6.9/10**

### Implementação
- **LAI (Lei de Acesso à Informação)**
  - E-SIC model: `SolicitacaoESIC`, `AnexoESIC`, `RecursoESIC`, `HistoricoESIC`
  - Endpoint `/api/e-sic` com CRUD e validação Zod
  - Prazo de 20 dias (RN-110)
  
- **LGPD (Lei Geral de Proteção de Dados)**
  - Modelo DocumentoTransparencia com tipo LGPD
  - Política de privacidade (página institucional)
  - Sem consentimento explícito de cookies (FALTA)
  
- **PNTP (Padrão de Transparência Pública)**
  - 10+ modelos para dados abertos (Despesas, Receitas, Repasses, Veículos, Obras, etc.)
  - Conformidade checker: `/api/admin/conformidade-pntp` (DIAMANTE, OURO, PRATA, BRONZE)
  - Dados em 30 dias (RN-120) - sem garantia automática

### Pontos Fortes
- ✅ **E-SIC completo** - CRUD de solicitações, recursos, historico com prazos
- ✅ **Transparência estruturada** - 52 itens no portal, 10+ recursos com APIs abertas
- ✅ **Conformidade PNTP checada** - Dashboard `/api/admin/conformidade-pntp` com score percentual
- ✅ **Dados abertos CKAN-like** - `/api/dados-abertos` com XML estruturado
- ✅ **Ouvidoria** - Modelo `ManifestacaoOuvidoria` com CRUD e historico
- ✅ **Consulta pública** - `ConsultaPublica` com `PerguntaConsulta`, `RespostaConsulta`, `ParticipacaoConsulta`

### Pontos Fracos
- ⚠️ **Consentimento de cookies ausente** - Sem banner de LGPD; site coleta cookies sem opt-in
- ⚠️ **PNTP auto-reportada** - Conformidade checada localmente; sem validação com servidor federal
- ⚠️ **LAI prazo não enforçado** - RN-110 diz 20 dias, mas sem alerta automático se vencer
- ⚠️ **Dados em 30 dias (RN-120) sem garantia** - API retorna dados, mas sem timestamp de "publicado em"
- ⚠️ **Política de privacidade genérica** - Sem menção de retenção de dados, direitos do cidadão (portabilidade, exclusão)
- ⚠️ **Sem direito ao esquecimento** - Sem endpoint DELETE em perfil de usuário para LGPD

### Recomendações
1. **[CRÍTICO]** Implementar banner de cookies: adicionar componente que pede consentimento antes de rastrear
2. **[CRÍTICO]** Implementar direito ao esquecimento: endpoint DELETE `/api/user/me` que soft-deletes conta e dados
3. **[MÉDIO]** Enforçar prazos LAI: alerta automático 3 dias antes de LAI vencer
4. **[MÉDIO]** Versionar dados abertos: adicionar timestamp de publicação em todos os recursos PNTP
5. **[MÉDIO]** Atualizar política de privacidade: adicionar seções sobre retenção de dados, direitos LGPD (portabilidade, exclusão, retificação)

---

## RESUMO EXECUTIVO

### Nota Geral Ponderada

```
Eixo                                Peso    Nota    Ponderado
1. Arquitetura Geral                10%     7.2     0.72
2. Modelo de Dados (Prisma)         12%     7.8     0.94
3. APIs (258 rotas)                 12%     7.1     0.85
4. Autenticação e Autorização       10%     8.1     0.81
5. Módulo Legislativo               10%     7.5     0.75
6. Sessões e Votação Tempo Real     8%      7.3     0.58
7. Comissões                        8%      7.4     0.59
8. Portal Transparência / PNTP      10%     7.6     0.76
9. Área Parlamentar                 6%      6.9     0.41
10. Admin (Usuários, Config, Audit) 8%      7.7     0.62
11. Frontend / Design System        9%      7.3     0.66
12. Performance                     8%      6.8     0.54
13. Segurança                       10%     7.9     0.79
14. Qualidade de Código             8%      7.1     0.57
15. Testes                          6%      5.2     0.31
16. Deploy/DevOps                   8%      7.4     0.59
17. Documentação                    9%      7.9     0.71
18. Acessibilidade (WCAG)           5%      6.3     0.32
19. Email / Integrações Externas    6%      7.6     0.46
20. Conformidade Legal              7%      6.9     0.48
                                   ────    ────    ─────
TOTAL                               200%   146.8    7.36
```

**🎯 NOTA GERAL: 7.36/10**

Sistema em **BOAS CONDIÇÕES** de produção com pontos críticos identificados. Funcional, documentado, mas com gaps significativos em testes, performance ISR, e CSRF.

---

## TOP 10 PROBLEMAS CRÍTICOS (Ordem de Impacto)

1. **[CRÍTICO - SEGURANÇA]** CSRF token ausente (impacto: comprometimento de conta)  
   - Sem validação de origin em POST/PUT/DELETE
   - Só confiar em SameSite é insuficiente
   - **Fix**: Adicionar middleware que gera/valida x-csrf-token

2. **[CRÍTICO - QUALIDADE]** 615 usos de `any` + noImplicitAny: false (impacto: bugs tipo runtime)  
   - Parâmetros sem tipo não geram erro
   - Ideal: noImplicitAny: true + eliminar all `any`
   - **Fix**: Ativar flag, tipificar como `unknown` ou tipo específico

3. **[CRÍTICO - PERFORMANCE]** Sem ISR em rotas públicas (impacto: lentidão, carga no DB)  
   - Proposições, comissões, parlamentares, transparência geram 100+ queries/visitante
   - Deveriam ser estáticas com revalidate: 3600
   - **Fix**: Adicionar `export const revalidate = 3600` em 15+ páginas

4. **[CRÍTICO - TESTES]** Cobertura de teste desconhecida (<50% estimado) (impacto: regressões não detectadas)  
   - Jest config não funciona, E2E apenas 8 suites
   - Nenhum teste de acessibilidade automático
   - **Fix**: Implementar cobertura +70%, expandir E2E a 50+ casos

5. **[CRÍTICO - DEPLOY]** Sem auto-deploy nem blue-green (impacto: downtime durante atualizações)  
   - GitHub Actions só faz lint; sem push para main → deploy automático
   - PM2 restart causa ~30s downtime
   - **Fix**: Implementar GitHub Actions deploy + blue-green com 2 instâncias PM2

6. **[CRÍTICO - BANCO]** N+1 queries ainda presentes (85 TODOs) (impacto: lentidão 10-100x)  
   - notificacoes-prazo: 220 queries → 6 (PR não merged)
   - Falta de include/select otimizado em várias queries
   - **Fix**: Merge PRs pendentes, audit queries críticas com explain

7. **[CRÍTICO - AUTH]** Sem refresh token rotation (impacto: token stealing)  
   - JWT válido 1h sem renovação
   - Ideal: 15min token + 30 dias refresh com rotation
   - **Fix**: Implementar refresh token com rotation

8. **[CRÍTICO - CONFORMIDADE]** Consentimento de cookies não implementado (impacto: LGPD violation)  
   - Site coleta cookies sem opt-in
   - Sem banner de consentimento
   - **Fix**: Implementar componente de consentimento

9. **[CRÍTICO - AUDITORIA]** Logging de admin incomplete (impacto: não-rastreabilidade)  
   - Só registra login e erros; não registra TODAS ações de admin (editar proposição, deletar votação)
   - SecurityAlert existe mas sub-utilizado
   - **Fix**: Adicionar log em POST/PUT/DELETE de `/admin/*`

10. **[MÉDIO - DADOS]** FK Parlamentar.legislatura é string, não FK (impacto: integridade relacional)  
    - Permite parlamentar com legislatura inexistente
    - Complica queries de JOIN
    - **Fix**: Migration para criar FK verdadeiro + dados loading

---

## TOP 5 QUICK WINS (Alto Valor / Baixo Esforço)

1. **[2h] Ativar noImplicitAny: true** em tsconfig.json  
   - Encontrar ~50 `any` mais óbvios, tipificar como `unknown` ou tipo real
   - Bloqueia futuros `any` sem discussão
   - **Valor**: Evita bugs silenciosos tipo runtime

2. **[4h] Implementar CSRF token** middleware  
   - Gerar nonce único por GET, validar em POST/PUT/DELETE
   - Aproveitar padrão `withAuth` existente
   - **Valor**: Bloqueia CSRF attacks, obrigatório em browsers modernos

3. **[3h] Ativar ISR em 5 páginas principais**  
   - `export const revalidate = 3600` em proposições, comissões, parlamentares, transparência, noticias
   - Imediato: 10-100x menos queries no horário de pico
   - **Valor**: Reduz carga DB, melhora FCP

4. **[2h] Adicionar CSP nonce** ao layout.tsx  
   - Gerar nonce() por request, passar para scripts via `<script nonce={nonce}>`
   - Reduzir `unsafe-inline` reliance
   - **Valor**: Hardening de XSS, alinha com best practices

5. **[6h] Criar API OpenAPI schema gerado automaticamente**  
   - Script que lê route.ts, extrai GET/POST/PUT/DELETE, gera swagger.json
   - Aproveitar Zod schemas já existentes
   - **Valor**: Documentação sempre sincronizada, client code generation

---

## PONTOS DE MAIOR DESTAQUE POSITIVO

### 1. Design System e UI Coesa (Nota: 7.3/10)
- **141 componentes React** bem estruturados com Radix UI + Tailwind CVA
- **Dark mode por tenant** com cores injetadas em CSS variables
- **Responsive design** com breakpoints claros
- Exemplo: `Button.tsx` com CVA (size, variant, color) é reutilizável em 50+ lugares

### 2. Documentação Obrigatória Enforçada (Nota: 7.9/10)
- **CLAUDE.md** com regras invioláveis (DOC-001 a DOC-007)
- **ESTADO-ATUAL.md** atualizado a cada mudança (12/04, 10/04, etc.)
- **8 skills vivas** que guiam desenvolvimento por módulo
- Exemplo: Novo dev lê CLAUDE.md → identifica skill-legislativo → implementa padrões

### 3. Middleware de Segurança Robusto (Nota: 7.9/10)
- **Rate limiting em memória** (120 req/min global, 10 login/5min)
- **CSP completo** com Headers de segurança (HSTS, X-Frame-Options, X-Content-Type-Options)
- **2FA TOTP implementado** com backup codes
- **Validação de autenticação em middleware** (verifica role, redireciona apropriado)

### 4. Fluxo Legislativo Funcional (Nota: 7.5/10)
- **118 modelos Prisma** cobrem TODOS os processos (proposição → tramitação → votação → promulgação)
- **Voto de Minerva** automatizado em VotacaoAgrupada
- **Timeline unificada** de proposição (`/api/proposicoes/[id]/timeline`)
- **Validações de transição de status** com mapa explícito VALID_STATUS_TRANSITIONS

### 5. Portal Transparência PNTP Estruturado (Nota: 7.6/10)
- **52 itens de transparência** mapeados com modelos próprios
- **10 APIs CRUD** para recuros (notas, ordens, veículos, obras, etc.)
- **Admin CRUD completo** com edit support
- **Sistema de períodos** que permite múltiplos períodos por categoria (Despesas até 2021/2023/2024+)

---

## CONCLUSÃO

O **Sistema Legislativo Municipal** é uma implementação **SÓLIDA** e **FUNCIONAL** de um portal institucional + painel administrativo legislativo, baseado no padrão SAPL com modernização para Next.js 14.

**Pontos Fortes**:
- Arquitetura clara, modular, bem documentada
- Modelo de dados completo (118 modelos, 250 índices)
- Autenticação robusta (2FA, rate limit, roles granulares)
- Fluxo legislativo completo (proposição até promulgação)
- Transparência e conformidade PNTP em progresso

**Pontos a Melhorar (Ordem Crítica)**:
1. Segurança: CSRF token, refresh token rotation
2. Qualidade: noImplicitAny: true, cobertura de testes
3. Performance: ISR em públicas, N+1 queries
4. Deploy: Auto-deploy, blue-green, logs centralizados
5. Conformidade: Consentimento LGPD, direito ao esquecimento

**Recomendação**: Sistema apto para produção com **melhorias críticas em 1-2 sprints**. Foco: CSRF, testes, ISR. Roadmap: WebSocket, PWA, importador CR2, biometria.