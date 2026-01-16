# Cronograma de Preparação para Produção

> Baseado na análise dos documentos em `docs/` (especialmente `analise-sapl-sugestoes-melhorias.md`, `analise-pautas-sessoes-sapl.md` e `PLANO_EXECUCAO_COMPLETO.md`) e no estado atual do projeto.

## Metodologia

- **Fases quinzenais** (10 dias úteis) com entregáveis revisáveis.
- Cada fase inclui: planejamento detalhado → desenvolvimento → testes automatizados/manual → review → retroalimentação.
- Reuniões de checkpoint ao final de cada fase para aprovar avanço ou ajustar o backlog.

---

## Fase 0 – Preparação (Semana 0)
- **Objetivo**: ajustes rápidos antes da rodada principal.
- Ações:
  - Documentar arquitetura atual (front, APIs, mock/Prisma) e fluxos críticos.
  - Mapear dependências externas (streaming, Kiosks, etc.) e confirmar requisitos.
  - Ajustar pipelines (lint, testes Jest recém-criados) para rodar no CI.

---

## Fase 1 – Configurações e Governança (Semanas 1-2)
- **Meta**: completar painel institucional e governança de acesso.
- Entregas:
  - UI de Configurações Institucionais (tema, timezone, contatos, logo).
  - Backup/restore de configurações e auditoria ampliada (logs de falha).
  - Revisão de RBAC e roles conforme SAPL (Administrador, Secretaria, Parlamentar, Operador, Público).
  - Testes focados: integração API de configurações, snapshot UI painel.

---

## Fase 2 – Parlamentares e Mesa Diretora (Semanas 3-4)
- **Meta**: equiparar gestão de parlamentares ao SAPL.
- Entregas:
  - Dashboard individual do parlamentar (estatísticas, agenda, histórico de votações/comissões).
  - Integração mais profunda com comissões (participações, suplências).
  - Melhorias mesa diretora: interface para status históricos e relatórios.
  - Testes: unidade para cálculos de estatística, e2e cenários CRUD parlamentar/mesa.

---

## Fase 3 – Sessões, Pautas e Painel Eletrônico (Semanas 5-6)
- **Meta**: completar automação de sessões e painel.
- Entregas:
  - Engine de controle de tempo por item (cronômetros, alertas, tempo real vs estimado).
  - Regras de pauta automáticas (prioridade, seções dinâmicas) e sugestões inteligentes refinadas.
  - Painel eletrônico com validações reforçadas (presença/voto) e integração streaming.
  - Testes: mock de painel (serviço `sessao-controle`), e2e da jornada sessão → painel → votação.

---

## Fase 4 – Tramitação e Relatórios (Semanas 7-8)
- **Meta**: implementar workflow legislativo e relatórios executivos.
- Entregas:
  - Modelo `RegraTramitacao` com UI para criar/editar fluxos.
  - Dashboard de tramitação (KPIs de prazos, status, pendências).
  - Relatórios legislativos (presença, produtividade, comparativos entre legislaturas).
  - Testes: unitários engine de regras, geração de relatórios com mocks.

---

## Fase 5 – Portal Público e Participação (Semanas 9-10) — ✅ concluída
- **Meta**: elevar o portal público ao padrão SAPL.
- Entregas:
  - Busca avançada, filtros e acompanhamento de tramitação para cidadãos (`/tramitacoes` e `/tramitacoes/[id]`).
  - Ferramentas de participação (consultas públicas, enquetes, fórum) com portal dedicado (`/participacao`).
  - Streaming de sessões + repositório multimídia (integração com painel público de sessões).
  - Testes: fallback das APIs públicas (`src/tests/tramitacao/public-tramitacoes-api.test.ts`, `src/tests/participacao/public-participacao-api.test.ts`).

---

## Fase 6 – Integrações, Segurança e Preparação (Semanas 11-12)
- **Meta**: finalizar integrações, hardening e readiness.
- Entregas:
  - Webhooks/REST adicionais, notificações multicanal (email, push, SMS).
  - Revisão de segurança (2FA, hardening, backups, disaster recovery).
  - Testes de carga e plano de rollout (migrar do mock para banco real, scripts seed).
  - Go/No-Go checklist para produção (monitoramento, suporte, runbooks).

---

## Plano de Testes Contínuos
- **Unitários**: prioridade para utilidades (datas, serviço de sessão), regras de negócio e mocks.
- **Integração**: rotas críticas (`sessões`, `pauta`, `votação`, `painel`).
- **E2E**: fluxos administrativos e portal público (Playwright/Cypress).
- **Performance & Segurança**: Lighthouse, OWASP ZAP, smoke tests pós-deploy.

---

## Governança e Feedback
- Checkpoints quinzenais com stakeholders.
- Coleta contínua de feedback (operadores de plenário, parlamentares, TI).
- Roadmap vivo: revisitar o cronograma após cada fase conforme indicadores (burndown, bugs, feedback).

---

## Riscos & Mitigações
- **Integração com streaming/dispositivos**: protótipo antecipado na Fase 3.
- **Dados históricos**: planejar migração (mocks → PostgreSQL) com scripts idempotentes.
- **Escopo SAPL completo**: manter backlog priorizado, evitar desvio de escopo; foco nas funcionalidades críticas antes de portais avançados.

---

## Conclusão
Seguindo este cronograma em 6 fases (aprox. 3 meses), alinhamos nossa aplicação às melhores práticas do SAPL, garantindo robustez, transparência e participação cidadã antes da entrada em produção.

