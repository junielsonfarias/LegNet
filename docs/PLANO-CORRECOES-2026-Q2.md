# Plano de Correcoes 2026 Q2 — Sistema Legislativo Municipal

> **Data**: 2026-05-04
> **Origem**: Analise consolidada dos 3 eixos (legislativo / administrativo / transparencia)
> **Estrategia**: 5 fases com gate de revisao entre elas. **Nao avancar para a fase seguinte sem fechar o checklist da fase atual.**

---

## Sumario

| Fase | Tema | Itens | Severidade dominante | Estimativa |
|------|------|-------|----------------------|------------|
| 1 | Seguranca e LGPD | C1, C2, C3, C4, A1, A7, A8 | CRITICO | 5-7 dias |
| 2 | Conformidade legal (LAI / PNTP) | C7, A2, M9, M11 | CRITICO/ALTO | 4-6 dias |
| 3 | Governanca do processo legislativo | C5, C6, C8, A4, A5, A6, M1, M2 | CRITICO/ALTO | 6-8 dias |
| 4 | Acessibilidade e cidadao | A3, A9, A10, M7, M8 | ALTO | 8-10 dias |
| 5 | Polish e divida tecnica | M3, M4, M5, M6, M10, M12 | MEDIO | 3-5 dias |

> **Total estimado**: 26-36 dias de trabalho efetivo (~5-7 sprints de 1 semana). Estimativas conservadoras incluem testes e validacao em VPS.

---

## Pre-requisitos transversais

Antes de iniciar a Fase 1, garantir:

- [ ] **Branch dedicada**: criar `release/2026-q2-correcoes` a partir de `main`. PRs por fase merge nessa branch; merge final na `main` apos a Fase 5.
- [ ] **Migrations Supabase aplicadas**: pendencia ja conhecida (`project_pendente_pntp_migrations`). Aplicar antes de qualquer mudanca de schema nesta agenda.
- [ ] **Snapshot Postgres VPS** (`pg_dump`) e snapshot Supabase (Dashboard) salvos em local seguro.
- [ ] **Suite de testes verde**: `npm test` baseline. Toda fase obriga adicionar testes para os itens cobertos.
- [ ] **CHANGELOG atualizado por fase**: cada fase encerra com entrada em `ESTADO-ATUAL.md` + atualizacao da skill correspondente (DOC-001 a DOC-007).

---

## FASE 1 — Seguranca e LGPD

> **Objetivo**: fechar lacunas que expoem dados pessoais e enfraquecem auditoria. Tudo aqui e pre-requisito para auditoria externa LGPD.

### Itens

| ID | Tema | Onde | Esforco |
|----|------|------|---------|
| C1 | Criptografar `twoFactorSecret` e `twoFactorBackupCodes` | `prisma/schema/models.prisma:14-15`, novo `src/lib/encryption.ts` (verificar se ja existe) | 1d |
| C2 | Hash + mascaramento de CPF de Servidor + RLS para salarios | `prisma/schema/models.prisma:1749`, todos endpoints publicos de Servidor | 1.5d |
| C3 | AuditLog imutavel via trigger PostgreSQL | nova migration `block_audit_log_mutations` | 0.5d |
| C4 | 2FA obrigatorio para ADMIN e SECRETARIA | `src/lib/auth.ts:93`, novo middleware `force2faEnrollment` | 1d |
| A1 | Uniformizar mascaramento LGPD em `/api/publico/*` | `src/app/api/publico/servidores/route.ts`, demais publicas | 0.5d |
| A7 | Decompor `financeiro.view` em escopos granulares | `src/lib/auth/permissions.ts:47-48` + adapt em endpoints | 1d |
| A8 | Secrets 2FA fora do estado React (download + delete) | `src/app/admin/configuracoes/seguranca/page.tsx:77,158-175` | 0.5d |

### Deliverables

- Migrations idempotentes para C1, C2, C3 (com plano de rotacao de secrets existentes em produc)
- Endpoint `/api/admin/auth/2fa/setup` reescrito sem expor secret no JSON
- Testes em `src/tests/security/` cobrindo: rotacao de secret, tentativa de DELETE em audit_logs, hash CPF round-trip, mascaramento por permissao

### Checklist de revisao (gate Fase 1 -> Fase 2)

- [ ] `psql -c "DELETE FROM audit_logs LIMIT 1"` retorna erro de trigger
- [ ] `SELECT twoFactorSecret FROM users LIMIT 1` retorna texto cifrado, nao plaintext
- [ ] `SELECT cpf FROM servidores LIMIT 1` retorna hash (ou coluna nao existe se renomeada para `cpfHash`)
- [ ] Login com role ADMIN sem 2FA configurado e redirecionado para `/admin/perfil/2fa-setup`
- [ ] `/api/publico/servidores` mascarado igual a `/api/dados-abertos/servidores`
- [ ] `npm test` verde, novos testes de seguranca passam
- [ ] `ESTADO-ATUAL.md` + `skill-admin.md` atualizados
- [ ] Smoke test em VPS apos deploy: login com 2FA, criacao de auditlog, tentativa de DELETE manual no DB

---

## FASE 2 — Conformidade legal (LAI / PNTP)

> **Objetivo**: garantir que prazos legais (LAI 20 dias, RN-122/123/124) sejam monitorados e reportados ao cidadao.

### Itens

| ID | Tema | Onde | Esforco |
|----|------|------|---------|
| C7 | Cron `verificarPrazosESIC` + estados de recurso | `src/lib/jobs/prazos-legais.ts`, novo enum `StatusESIC` (RECURSO_*, PRORROGADO) | 1.5d |
| A2 | Endpoints publicos `/api/publico/e-sic/stats` + `/api/publico/e-sic/acompanhar` + `/api/publico/ouvidoria/stats` | novos arquivos | 1.5d |
| M9 | Refinar validacao de prazos PNTP nos crons | `prazos-legais.ts:264-349` (RN-122/123): pauta vazia nao conta como publicada; ata sem texto nao conta como aprovada | 1d |
| M11 | Cron de prazo de parecer CLJ (alerta 3d antes) | novo job em `prazos-legais.ts` | 0.5d |

### Deliverables

- Migration adicionando estados de recurso + `dataProrrogacao` + `motivoProrrogacao` em `solicitacaoESIC`
- Pagina cidadao `/institucional/e-sic/acompanhar/[protocolo]` (validacao por email do solicitante)
- Pagina cidadao `/institucional/ouvidoria/estatisticas` com KPIs (volume, tempo medio, % resolvido)
- Atualizacao do dashboard `/admin/conformidade-pntp` com KPI de e-SIC no prazo

### Checklist de revisao (gate Fase 2 -> Fase 3)

- [ ] Cron `daily` executa `verificarPrazosESIC` e cria notificacoes para solicitacoes com `prazoResposta < now()` e status diferente de RESPONDIDA
- [ ] `/api/publico/e-sic/acompanhar?protocolo=X&email=Y` retorna status sem login
- [ ] Estatisticas publicas de Ouvidoria nao vazam dados pessoais (PII)
- [ ] Validacao RN-122 rejeita pauta com 0 itens
- [ ] Validacao RN-123 rejeita ata sem `arquivoAtaAssinada` ou `dataPublicacaoAta`
- [ ] Score PNTP no dashboard sobe (esperado: 98% -> 99%+)
- [ ] `ESTADO-ATUAL.md` + `skill-transparencia.md` + `REGRAS-DE-NEGOCIO.md` atualizados
- [ ] Smoke test em producao: criar e-SIC fictico, esperar alerta apos prazo

---

## FASE 3 — Governanca do processo legislativo

> **Objetivo**: completar a maquina de estados de Sessao e o fluxo de tramitacao, fechando RNs frageis ou ausentes. Aqui entra a feature ja planejada de **proposicao retroativa**.

### Itens

| ID | Tema | Onde | Esforco |
|----|------|------|---------|
| C5 | Adicionar `CONVOCADA` em `StatusSessao` + transicoes | `prisma/schema/enums.prisma:53-59`, `_handlers/update-sessao.ts:170-220` | 1d |
| C6 | Validar `FluxoTramitacao.habilitaPauta` antes de incluir item em pauta | `src/lib/services/automacao-pautas-service.ts:565` | 1d |
| C8 | Proposicao retroativa pulando CLJ (feature ja em `project_pendente_proposicao_retroativa.md`) | nova rota, modal, schema | 2d |
| A4 | Campo `requerParecerCLJ` em `TipoProposicaoConfig`; substituir busca por sigla hardcoded | `proposicao-validacao-service.ts:593-616` | 0.5d |
| A5 | Lock de pauta apos publicacao (snapshot imutavel ou flag `pautaFinalizada`) | `automacao-pautas-service.ts:632-646` | 0.5d |
| A6 | Adicionar `dataPautaPublicada` em Sessao + validar interstício 48h em RN-122 | schema + cron | 0.5d |
| M1 | Validar interstício de turno 2 em `iniciarSegundoTurno` | `src/lib/services/sessao-controle/turnos.ts:286-325` | 0.5d |
| M2 | Adicionar `textoFinal` + `dataRedacaoFinal` em Proposicao | schema + UI redacao final | 1d |

### Deliverables

- Migration unica para schema (CONVOCADA, requerParecerCLJ, pautaFinalizada, dataPautaPublicada, textoFinal, dataRedacaoFinal)
- UI atualizada: badge "RETROATIVA" em Proposicao, novo botao "Adicionar proposicao ja votada" em `/lancamento-retroativo`
- Tabela de transicoes de estado revisada e documentada em `skill-operador.md`
- Atualizacao de `REGRAS-DE-NEGOCIO.md`: nova RN para "entrada retroativa" como excecao a RN-030

### Checklist de revisao (gate Fase 3 -> Fase 4)

- [ ] Sessao consegue transitar AGENDADA -> CONVOCADA -> EM_ANDAMENTO sem erro
- [ ] PL nao vinculado a fluxo CLJ -> CFO -> Plenario nao entra em pauta (erro de validacao)
- [ ] Proposicao retroativa cria item de pauta com status final ja decidido + audit log com `motivo`
- [ ] Tipo de proposicao customizado com `requerParecerCLJ=true` exige parecer; `=false` nao exige
- [ ] Apos publicar pauta, tentativa de adicionar/remover item retorna erro
- [ ] Cron RN-122 considera 48h a partir de `dataPautaPublicada`
- [ ] Tentativa de iniciar turno 2 antes de `dataVotacaoTurno1 + intersticioDias` retorna erro
- [ ] `npm test` verde com novos testes de fluxo
- [ ] `skill-legislativo.md`, `skill-operador.md`, `skill-secretaria.md` atualizadas
- [ ] Smoke test em producao: criar sessao retroativa com proposicao retroativa, validar exibicao publica

---

## FASE 4 — Acessibilidade e cidadao

> **Objetivo**: tornar o portal usavel por toda a populacao (Lei 13.146/2015 + WCAG 2.2 AA + PWA + busca eficiente). Fase mais longa porque envolve componentes UI em massa.

### Itens

| ID | Tema | Onde | Esforco |
|----|------|------|---------|
| A3 | Auditoria WCAG 2.2 AA + integracao VLibras + revisao de contraste/ARIA/keyboard nav | todo `/transparencia`, `/parlamentares`, `/legislativo`, `/institucional` | 4d |
| A9 | PWA + service worker + cache offline para rotas publicas | novo `public/manifest.json`, integracao `next-pwa` | 1.5d |
| A10 | Busca textual no portal (FTS PostgreSQL) | nova tabela materializada, endpoint `/api/transparencia/busca`, UI de busca em `/transparencia` | 2d |
| M7 | Integracao streaming YouTube/RTMP + legendas | configuravel via admin, fallback para link manual | 1.5d |
| M8 | Dicionario de dados em `/api/dados-abertos/schema/[recurso]` | gerar JSONSchema dos modelos publicos | 1d |

### Deliverables

- Relatorio de auditoria WCAG (axe-core / Lighthouse) antes/depois com score >= 95
- Manifesto PWA + icones em multiplos tamanhos
- Service worker com estrategia stale-while-revalidate em `/api/dados-abertos/*` e `/transparencia/*`
- Endpoint `/api/transparencia/busca?q=termo` com paginacao + score de relevancia
- VLibras visivel em todas paginas publicas
- Pagina `/transparencia/dados-abertos` linkando dicionarios

### Checklist de revisao (gate Fase 4 -> Fase 5)

- [ ] Lighthouse Acessibilidade >= 95 em 5 paginas amostrais (`/`, `/transparencia`, `/parlamentares`, `/legislativo/sessoes`, `/institucional/e-sic`)
- [ ] Navegacao por teclado completa (Tab/Enter/Esc) sem rato
- [ ] Leitor de tela (NVDA ou VoiceOver) anuncia conteudo de tabelas e formularios
- [ ] PWA instalavel em Chrome desktop e Android
- [ ] Cache offline serve `/transparencia` apos primeira visita
- [ ] Busca por "contratos saude" retorna resultados de todas categorias relevantes
- [ ] Dicionario de dados acessivel para os 15 endpoints `/api/dados-abertos`
- [ ] `skill-transparencia.md` documenta padroes WCAG aplicados
- [ ] Smoke test em producao com usuario real (servidor da Camara) navegando so com teclado

---

## FASE 5 — Polish e divida tecnica

> **Objetivo**: limpar pontas soltas, eliminar `any` em pontos sensiveis, refinar UX de seguranca.

### Itens

| ID | Tema | Onde | Esforco |
|----|------|------|---------|
| M3 | Tipar consolidacao de votos (remover `any` de filtragem secreta) | `src/app/api/sessoes/[id]/votacao/route.ts:52,93,112` | 0.5d |
| M4 | Captcha progressivo + unlock por email apos rate limit de login | `src/middleware.ts:23,61-68` | 1d |
| M5 | Versionamento de configuracoes com diff e rollback | `src/app/api/configuracoes/backup,restore/route.ts` | 1d |
| M6 | TTL/rotacao automatica de tokens de integracao | `src/lib/api/integration-tokens-api.ts` | 0.5d |
| M10 | Classificacao automatica de Ouvidoria (regex/heuristica) | `src/app/api/ouvidoria/route.ts` | 0.5d |
| M12 | Auditar `skipCsrf: true` em GETs com side-effects | `src/app/api/favoritos/[id]/route.ts`, `src/app/api/parlamentar/status/route.ts`, `src/app/api/analytics/route.ts` | 0.5d |

### Deliverables

- Tipagem completa em rota de votacao (sem `any`)
- Captcha (hCaptcha ou Turnstile) integrado apos 3 tentativas
- UI admin de configuracoes mostra diff entre versoes antes do rollback
- Tokens com `expiresAt` + alerta proximo ao vencimento
- Classificacao automatica de manifesto em RECLAMACAO/SUGESTAO/ELOGIO/DENUNCIA com confianca

### Checklist de revisao (gate Fase 5 -> merge final)

- [ ] `npx tsc --noEmit` sem `any` nas rotas tocadas
- [ ] Captcha aparece apos 3 tentativas falhas; unlock por email funciona
- [ ] Diff de configuracoes legivel; rollback restaura estado anterior
- [ ] Token expirado retorna 401; alerta enviado 7d antes do `expiresAt`
- [ ] Classificacao de ouvidoria preenche tipo automaticamente, com botao "corrigir" para o operador
- [ ] `npm test` verde, cobertura nao caiu
- [ ] `ESTADO-ATUAL.md` consolidado com todas as 5 fases
- [ ] PR final `release/2026-q2-correcoes` -> `main` com revisao por outro humano

---

## Pos-merge

- [ ] Aplicar migrations da branch em **Supabase** (memoria `project_pendente_pntp_migrations` reforca o cuidado)
- [ ] Aplicar em VPS via `scripts/update.sh`
- [ ] Validar score PNTP: alvo final 100% nivel Diamante
- [ ] Comunicar usuarios sobre 2FA obrigatorio com 14d de antecedencia
- [ ] Auditoria externa LGPD opcional (recomendada 30d apos merge)
- [ ] Atualizar memoria do projeto: remover `project_pendente_proposicao_retroativa.md` e `project_pendente_pntp_migrations.md`

---

## Riscos e mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Rotacao de secrets 2FA quebra logins ativos (Fase 1) | Media | Alto | Migration mantem coluna antiga ate confirmacao; comunicar usuarios para refazer setup em janela |
| Trigger de imutabilidade audit_logs bloqueia restore de backup | Baixa | Medio | Trigger pode ser desabilitado por superuser; documentar procedimento de restore |
| Hash de CPF quebra busca por CPF parcial em UI | Alta | Medio | Manter `cpfBuscaIndex` com hash de prefixos; ou mover busca para `nomeCompleto + matricula` |
| WCAG audit revela problemas em componentes de terceiros (Radix) | Media | Baixo | Radix ja e WCAG-friendly; problemas tipicamente sao nossos ARIA |
| PWA cache antigo serve dados desatualizados | Media | Medio | Estrategia stale-while-revalidate + invalidate por versao |
| Migration grande na Fase 3 quebra schema validators existentes | Baixa | Alto | Schema em folder (`prisma/schema/`) facilita revisao; testes de integracao cobrem regressao |

---

## Como acompanhar

- Cada fase abre uma issue no GitHub com checklist desta secao
- Commits seguem padrao `<prefix>(scope): <desc>` (ver `git log`)
- Memoria do projeto recebe entrada `project_fase_N_em_andamento.md` durante execucao, removida ao fechar gate
- ESTADO-ATUAL.md ganha bloco `## Fase N - <data>` ao concluir cada gate

---

> **Lembrete**: este plano e vivo. Se durante a Fase X surgir um achado critico que nao estava listado, abrir nova entrada e decidir se entra na fase atual ou cria Fase X.5. Nao acumular silenciosamente.
