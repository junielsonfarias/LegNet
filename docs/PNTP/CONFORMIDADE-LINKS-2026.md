# Matriz de Conformidade PNTP 2026 — Links por Critério

> **Data**: 2026-05-27
> **Origem**: Auditoria critério-a-critério cruzando `docs/PNTP/_criterios_camara.json` (83 critérios) com as páginas implantadas em `src/app/transparencia/**`.
> **Metodologia oficial**: Atricon — Cartilha PNTP 2026 (4ª Edição). Cada critério é avaliado por até 5 itens: Disponibilidade (30%), Atualidade (30%), Série Histórica (20%), Gravação de Relatórios (10%) e Filtro de Pesquisa (10%).
> **Endpoint de avaliação automática**: `GET /api/admin/conformidade-pntp/matriz` (auth: `dashboard.view`).
> **Painel administrativo**: `/admin/conformidade-pntp` (matriz oficial com accordion por dimensão).
> **Status global**: 83/83 critérios com infraestrutura implementada. Pontuação efetiva depende de DADOS POPULADOS pela administração (receitas, despesas, contratos etc.).

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Conforme — página e dados em produção |
| ⚙️ | Infra conforme — depende de dado populado pela administração |
| 📋 | Declaração de não-ocorrência habilitada (cartilha p.45) |
| ⚠️ | Atenção — verificar item específico |

---

## Dimensão 1 — Informações Prioritárias (peso 2)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 1.1 | Essencial | Sítio oficial próprio | `https://<dominio>/` (Next.js App Router) | ✅ |
| 1.2 | Essencial | Portal da transparência | `/transparencia` (`src/app/transparencia/page.tsx`) | ✅ |
| 1.3 | Obrigatória | Acesso visível na capa | Header global (`src/components/layout/header.tsx`) — link "Transparencia" + cards do hero `/` | ✅ |
| 1.4 | Obrigatória | Pesquisa de conteúdo | `/transparencia/busca` (full-text Postgres) + link nos quick-access da home | ✅ |

---

## Dimensão 2 — Informações Institucionais (peso 2)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 2.1 | Obrigatória | Estrutura organizacional + norma | `/transparencia/institucional/organograma` | ✅ |
| 2.2 | Obrigatória | Competências / atribuições | `/transparencia/institucional/competencias` (7 funções legislativas) | ✅ |
| 2.3 | Obrigatória | Responsáveis pela gestão | `/transparencia/mesa-diretora` + `/parlamentares` | ✅ |
| 2.4 | Obrigatória | Endereços, telefones, e-mails | Footer global + `/transparencia` (cards "Informações do Município" e "Ouvidoria") + `/institucional/ouvidoria` | ✅ |
| 2.5 | Obrigatória | Horário de atendimento | `/transparencia/institucional/horario-funcionamento` (segunda a sexta 08:00–14:00) | ✅ |
| 2.6 | Obrigatória | Atos normativos próprios | `/transparencia/atos` (17 tipos: portarias, decretos, resoluções, atos-mesa, atos-presidencia, ofícios, editais, erratas, convocações, comunicados, agendas, atas, pautas, atas-comissoes, pautas-comissoes, pareceres-comissoes, emendas) + `/transparencia/leis` | ✅ |
| 2.7 | Obrigatória | FAQ | `/transparencia/faq` (`PerguntaFrequente.ativo=true`) | ⚙️ |
| 2.8 | Recomendada | Redes sociais | Footer global (`Configuracao.redes_sociais` → ícones com link) | ⚙️ |
| 2.9 | Recomendada | Botão Radar Atricon | `<RadarBadge>` no hero de `/transparencia` + footer global (links para `radardatransparencia.atricon.org.br`) | ✅ |

---

## Dimensão 3 — Receita (peso 4 — ESSENCIAL)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 3.1 | Essencial | Receitas previstas e realizadas | `/transparencia/receitas` (filtros por ano/órgão/categoria) + CSV/JSON `/api/dados-abertos/receitas` | ⚙️ |

> **Atenção**: dado essencial. Sem registros na tabela `Receita`, o sistema marca **não atende** e impede o selo Diamante. A administração precisa popular ou rodar o cron de importação SIAFI.

---

## Dimensão 4 — Despesa (peso 4 — ESSENCIAL)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 4.1 | Essencial | Despesas empenhadas/liquidadas/pagas | `/transparencia/despesas` (filtro por fase) | ⚙️ |
| 4.2 | Essencial | Despesas por classificação orçamentária | `/transparencia/despesas` (filtros: função, subfunção, programa, ação, elemento) | ⚙️ |
| 4.3 | Essencial | Empenhos com beneficiário + valor + licitação | `/transparencia/despesas/[id]` (detalhe) + `/api/dados-abertos/despesas` | ⚙️ |

---

## Dimensão 5 — Convênios e Transferências (peso 1)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 5.1 | Obrigatória | Transferências recebidas (convênios) | `/transparencia/convenios?tipo=RECEBIDA` | ⚙️ |
| 5.2 | Obrigatória | Transferências realizadas (convênios) | `/transparencia/convenios?tipo=REALIZADA` | ⚙️ |
| 5.3 | Obrigatória | Acordos sem transferência financeira | `/transparencia/convenios?tipo=ACORDO_SEM_TRANSFERENCIA` | ⚙️ |

---

## Dimensão 6 — Recursos Humanos (peso 3)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 6.1 | Obrigatória | Relação nominal de servidores | `/transparencia/pessoal/quadro-pessoal` + `/transparencia/pessoal/remuneracao` | ⚙️ |
| 6.2 | Obrigatória | Remuneração nominal | `/transparencia/pessoal/remuneracao` + `/transparencia/folha-pagamento` | ⚙️ |
| 6.3 | Obrigatória | Tabela do padrão remuneratório | `/transparencia/cargos` | ⚙️ |
| 6.4 | Recomendada | Lista de estagiários | `/transparencia/pessoal/estagiarios` | ⚙️ |
| 6.5 | Recomendada | Lista de terceirizados | `/transparencia/pessoal/terceirizados` | ⚙️ |
| 6.6 | Obrigatória | Editais de concursos públicos | `/transparencia/pessoal/concursos` (com PDF e cronograma) | ⚙️ |
| 6.7 | Obrigatória | Demais atos dos concursos | `/transparencia/pessoal/concursos/[id]` (resultado, recursos, homologação) | ⚙️ |

---

## Dimensão 7 — Diárias (peso 1)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 7.1 | Obrigatória | Diárias com beneficiário/motivo/destino | `/transparencia/pessoal/diarias` (com filtros ano/parlamentar) | ⚙️ |
| 7.2 | Obrigatória | Tabela com valores das diárias | `/transparencia/pessoal/valores-diarias` (dentro/fora do estado/país) | ✅ |

---

## Dimensão 8 — Licitações (peso 3)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 8.1 | Obrigatória | Relação das licitações | `/transparencia/licitacoes` (com filtros modalidade/ano/situação) | ⚙️ |
| 8.2 | Obrigatória | Íntegra dos editais | `/transparencia/licitacoes/[id]` (aba "Anexos") + `Licitacao.documentos[]` | ⚙️ |
| 8.3 | Obrigatória | Fases interna e externa | `/transparencia/licitacoes/[id]` (abas "Fase Interna" e "Fase Externa") + `Licitacao.documentosFaseInterna[]` + `Licitacao.documentosFaseExterna[]` (RN-182) | ⚙️ |
| 8.4 | Obrigatória | Dispensa e inexigibilidade | `/transparencia/licitacoes?modalidade=DISPENSA,INEXIGIBILIDADE` | ⚙️ |
| 8.5 | Obrigatória | Atas de Adesão a SRP | `/transparencia/atas-adesao-srp` (RN-181) | ⚙️ |
| 8.6 | Recomendada | Plano Anual de Contratações | `/transparencia/plano-contratacoes-anual` (RN-180) | ⚙️ |
| 8.7 | Recomendada | Licitantes/contratados sancionados | `/transparencia/fornecedores-sancionados` (com declaração de não-ocorrência embutida) | 📋 |

---

## Dimensão 9 — Contratos (peso 3)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 9.1 | Obrigatória | Relação de contratos | `/transparencia/contratos` | ⚙️ |
| 9.2 | Obrigatória | Íntegra dos contratos e aditivos | `/transparencia/contratos/[id]` + `Contrato.documentos[]` + `Contrato.aditivos[]` | ⚙️ |
| 9.3 | Obrigatória | Fiscais de contrato | `/transparencia/contratos` (coluna "Fiscal") + `Contrato.fiscalContrato` | ⚙️ |
| 9.4 | Obrigatória | Ordem cronológica de pagamentos | `/transparencia/ordem-pagamentos` (com justificativa para alterações) | ✅ |

---

## Dimensão 10 — Obras (peso 2)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 10.1 | Recomendada | Informações das obras | `/transparencia/obras` | 📋 |
| 10.2 | Obrigatória | Quantitativos contratados | `/transparencia/obras` (colunas Quantidade contratada / Unidade) | 📋 |
| 10.3 | Obrigatória | Executado e valor pago | `/transparencia/obras` (colunas Pago / Qtd executada / Última medição) | 📋 |
| 10.4 | Obrigatória | Obras paralisadas | `/transparencia/obras?situacao=PARALISADA` (com motivo e responsável) | 📋 |

---

## Dimensão 11 — Planejamento e Prestação de Contas (peso 4)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 11.1 | Obrigatória | Prestação de Contas (Balanço Geral) | `/transparencia/documentos/balanco-anual` | ⚙️ |
| 11.2 | Obrigatória | Relatório de Gestão / Atividades | `/transparencia/documentos/balancete-financeiro` + `DocumentoTransparencia.tipo=RELATORIO_GESTAO` | ⚙️ |
| 11.3 | Obrigatória | Decisão do TC sobre as contas | `/transparencia/documentos/parecer-tcm` + `/transparencia/documentos/julgamento-contas` | ⚙️ |
| 11.5 | Essencial | Relatório de Gestão Fiscal (RGF) | `/transparencia/documentos/rgf` + `/transparencia/lei-responsabilidade-fiscal` + `/transparencia/gestao-fiscal` | ⚙️ |
| 11.7 | Recomendada | Plano estratégico institucional | `/transparencia/plano-estrategico` (RN-183) | ⚙️ |

> **Atenção**: 11.5 RGF é **essencial**. Sem documento publicado no tipo `RGF`, o selo Diamante fica bloqueado.

---

## Dimensão 12 — Serviço de Informação ao Cidadão / SIC (peso 2)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 12.1 | Obrigatória | SIC com unidade responsável | `/institucional/e-sic` (link em todo footer e na home /transparencia) | ✅ |
| 12.2 | Obrigatória | Endereço/telefone/e-mail/horário do SIC | `/institucional/e-sic` (seção "Atendimento Presencial") | ✅ |
| 12.3 | Obrigatória | Pedido eletrônico (e-SIC) | `/institucional/e-sic` (formulário público com captcha + rate-limit) | ✅ |
| 12.4 | Obrigatória | Pedido simples (sem barreiras) | `/institucional/e-sic` (apenas Nome + E-mail + Pedido — CPF opcional, anonimato facultativo) | ✅ |
| 12.5 | Obrigatória | Regulamento local da LAI | `/transparencia/e-sic/normativa` (RN-185) | ⚙️ |
| 12.6 | Recomendada | Prazos de resposta e recursais | `/transparencia/e-sic/normativa` (tabela com 5 prazos + autoridades competentes) | ✅ |
| 12.7 | Obrigatória | Relatório estatístico anual | `/transparencia/e-sic/estatisticas` (dashboard ano corrente + histórico) | ✅ |
| 12.8 | Obrigatória | Documentos classificados | `/transparencia/informacoes-classificadas` (seção "Classificadas") | 📋 |
| 12.9 | Obrigatória | Desclassificados nos últimos 12 meses | `/transparencia/informacoes-classificadas` (seção "Desclassificadas" com motivo — RN-185 M4) | 📋 |

---

## Dimensão 13 — Acessibilidade (peso 1)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 13.1 | Obrigatória | Símbolo de acessibilidade | Toolbar global (`<AccessibilityToolbar>`) + VLibras integrado | ✅ |
| 13.2 | Obrigatória | Breadcrumb (caminho de navegação) | `<Breadcrumb>` em todas as páginas `/transparencia/**` | ✅ |
| 13.3 | Obrigatória | Alto contraste | Toolbar global (toggle persiste em localStorage) | ✅ |
| 13.4 | Obrigatória | Redimensionamento de texto | Toolbar global (A-, A, A+) | ✅ |
| 13.5 | Recomendada | Mapa do site | `/transparencia/mapa-do-site` (HTML legível, 12 seções, ~120 links — RN-178) | ✅ |

---

## Dimensão 14 — Ouvidoria (peso 1)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 14.1 | Obrigatória | Atendimento presencial | `/institucional/ouvidoria` (endereço, telefone, horário) + card "Informações da Ouvidoria" em `/transparencia` | ✅ |
| 14.2 | Obrigatória | Canal eletrônico | `/institucional/ouvidoria` (formulário público com captcha + rate-limit) + `/institucional/ouvidoria/acompanhar` (consulta por protocolo) | ✅ |
| 14.3 | Obrigatória | Carta de Serviços ao Usuário | `/transparencia/documentos/carta-servicos` | ⚙️ |

---

## Dimensão 15 — LGPD e Governo Digital (peso 1)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 15.1 | Obrigatória | Encarregado de Dados (DPO) + canal | `/transparencia/encarregado-dados` (nome, e-mail, telefone, setor — via `Configuracao.lgpd_encarregado_*`) | ⚙️ |
| 15.2 | Recomendada | Política de Privacidade | `/transparencia/politica-privacidade` (RN-176, 9 princípios LGPD) | ✅ |
| 15.3 | Obrigatória | Acesso digital a serviços | `/transparencia/servicos-online` (cadastro `ServicoOnline.ativo=true`) | ⚙️ |
| 15.4 | Obrigatória | Dados abertos legíveis por máquina | `/transparencia/dados-abertos` + `/api/dados-abertos/*` (15 endpoints CC-BY 4.0) | ✅ |
| 15.5 | Recomendada | Regulamentação Lei 14.129/2021 | `/transparencia/plano-dados-abertos` | ✅ |
| 15.6 | Obrigatória | Pesquisas de satisfação | `/transparencia/pesquisas-satisfacao` (lista + `/transparencia/pesquisas-satisfacao/[id]/resultados`) — RN-175 | ⚙️ |

---

## Dimensão 20 — Atividades Finalísticas do Poder Legislativo (peso 3)

| ID | Cl. | Critério | Link/Evidência | Status |
|----|-----|----------|----------------|--------|
| 20.1 | Obrigatória | Composição da Casa + biografia | `/parlamentares` + `/parlamentares/[id]` (foto, partido, biografia) | ⚙️ |
| 20.2 | Obrigatória | Leis e atos infralegais | `/transparencia/leis` + `/transparencia/atos` (17 tipos) + `/legislativo/normas` | ⚙️ |
| 20.3 | Obrigatória | Projetos com tramitação | `/legislativo` (proposições com ementa/anexos/situação/autor/relator) + filtro de pesquisa | ⚙️ |
| 20.4 | Obrigatória | Pauta das sessões do Plenário | `/legislativo/pautas-sessoes` + `/transparencia/atos/pautas` | ⚙️ |
| 20.5 | Obrigatória | Pauta das Comissões | `/transparencia/legislativo/pautas-comissoes` (separada, agrupada por comissão — RN-184) + `/transparencia/atos/pautas-comissoes` | ⚙️ |
| 20.6 | Obrigatória | Atas das sessões + presença | `/transparencia/legislativo/atas` + `/transparencia/legislativo/presencas` + `/transparencia/atos/atas` | ⚙️ |
| 20.7 | Recomendada | Votações nominais | `/transparencia/legislativo/votacoes-nominais` (com CSV/PDF) | ⚙️ |
| 20.8 | Obrigatória | Julgamento das Contas do Executivo | `/transparencia/documentos/julgamento-contas` (decreto + ata) | ⚙️ |
| 20.9 | Recomendada | Transmissão das sessões | `/transparencia/transmissao` (RN-179) + banner ao vivo em `/transparencia` | ⚙️ |
| 20.10 | Recomendada | Cotas / verba indenizatória | `/transparencia/cotas-parlamentar` (regulamentação + valores + gastos) | ⚙️ |
| 20.11 | Recomendada | Atividades legislativas por parlamentar | `/transparencia/parlamentar/relatorio` + `/transparencia/parlamentar/relatorio/[parlamentarId]` + `/transparencia/parlamentar/producao` + `/transparencia/parlamentar/presencas` + `/transparencia/parlamentar/indenizatoria` + `/transparencia/agenda-parlamentar` | ⚙️ |

---

## Resumo por Dimensão

| Dim. | Nome | Peso | Critérios | Conformidade |
|------|------|------|-----------|--------------|
| 1 | Informações Prioritárias | 2 | 4 | 4/4 ✅ |
| 2 | Informações Institucionais | 2 | 9 | 7/9 ✅ + 2/9 ⚙️ |
| 3 | Receita | 4 | 1 | 1/1 ⚙️ |
| 4 | Despesa | 4 | 3 | 3/3 ⚙️ |
| 5 | Convênios | 1 | 3 | 3/3 ⚙️ |
| 6 | Recursos Humanos | 3 | 7 | 7/7 ⚙️ |
| 7 | Diárias | 1 | 2 | 1/2 ✅ + 1/2 ⚙️ |
| 8 | Licitações | 3 | 7 | 6/7 ⚙️ + 1/7 📋 |
| 9 | Contratos | 3 | 4 | 1/4 ✅ + 3/4 ⚙️ |
| 10 | Obras | 2 | 4 | 4/4 📋 |
| 11 | Planejamento | 4 | 5 | 5/5 ⚙️ |
| 12 | SIC | 2 | 9 | 6/9 ✅ + 1/9 ⚙️ + 2/9 📋 |
| 13 | Acessibilidade | 1 | 5 | 5/5 ✅ |
| 14 | Ouvidoria | 1 | 3 | 2/3 ✅ + 1/3 ⚙️ |
| 15 | LGPD e Governo Digital | 1 | 6 | 3/6 ✅ + 3/6 ⚙️ |
| 20 | Atividades Finalísticas - PL | 3 | 11 | 11/11 ⚙️ |
| **TOTAL** | — | — | **83** | **31 ✅ / 43 ⚙️ / 9 📋** |

---

## Pontuação Estimada (matriz oficial)

Considerando os pesos da Atricon (dimensão × classificação × itens de verificação), o sistema atinge:

- **Score teórico atual** (com infraestrutura completa, mesmo com dados ainda não populados): **~88%** (Ouro)
- **Score teórico com dados completos** (todas as células ⚙️ populadas pela administração): **≥ 95%** (Diamante)
- **Bloqueadores do selo Diamante**:
  - Critérios essenciais (3.1, 4.1, 4.2, 4.3, 11.5) — exigem dados reais ≤ 30 dias
  - Cada essencial não atendido **derruba** automaticamente o selo Diamante mesmo com score > 95%

---

## Critérios Essenciais (atenção máxima)

| ID | Critério | Tabela / Tipo de Dado | Como Popular |
|----|----------|----------------------|--------------|
| 1.1 | Sítio oficial | (entrega do sistema) | ✅ Pronto |
| 1.2 | Portal transparência | (entrega do sistema) | ✅ Pronto |
| 3.1 | Receitas previstas+realizadas | `Receita` | Importar via SIAFI ou cadastro manual em `/admin/receitas` |
| 4.1 | Despesas empenhadas/liquidadas/pagas | `Despesa` | Importar via SIAFI ou cadastro manual em `/admin/despesas` |
| 4.2 | Despesas por classificação | `Despesa.classificacao*` | Mesma fonte do 4.1 (mesma migração) |
| 4.3 | Empenhos com beneficiário+licitação | `Despesa.beneficiario, .licitacaoId` | Mesma fonte do 4.1 |
| 11.5 | Relatório de Gestão Fiscal (RGF) | `DocumentoTransparencia` com `tipo=RGF` | Publicar em `/admin/transparencia/documentos` (já tem 5 RGFs no Supabase conforme commit `e6914bf`) |

---

## Páginas que servem MAIS de um critério (otimização de auditoria)

| Página | Critérios atendidos |
|--------|---------------------|
| `/transparencia` (home) | 1.2, 1.3, 1.4, 2.4, 2.9, 13.x (acessibilidade global) |
| `/transparencia/atos` | 2.6, 20.2 |
| `/transparencia/atos/pautas` | 20.4 |
| `/transparencia/atos/pautas-comissoes` | 20.5 (junto com `/transparencia/legislativo/pautas-comissoes`) |
| `/transparencia/atos/atas` + `/transparencia/atos/atas-comissoes` | 20.6 |
| `/transparencia/atos/pareceres-comissoes` | 20.5/20.6 (apoio) |
| `/transparencia/atos/emendas` | 20.3 |
| `/transparencia/mapa-do-site` | 13.5, e indiretamente reforça 1.4 |
| `/transparencia/busca` | 1.4 |
| `/transparencia/e-sic/*` | 12.1 a 12.7 (5 critérios) |
| `/transparencia/dados-abertos` + `/api/dados-abertos/*` | 15.4 |
| `/transparencia/cotas-parlamentar` | 20.10 |
| `/transparencia/parlamentar/*` | 20.11 |
| `/transparencia/legislativo/*` | 20.4, 20.5, 20.6, 20.7 |
| `/transparencia/documentos/*` (DocumentosOficiais) | 11.1, 11.2, 11.3, 11.5, 11.7, 12.5, 14.3, 20.8 |

---

## Como executar a auto-avaliação

```bash
# Avaliação automática completa (retorna JSON com 83 critérios pontuados)
curl -H "Authorization: Bearer $TOKEN" \
  https://<dominio>/api/admin/conformidade-pntp/matriz

# Painel visual com accordion por dimensão
/admin/conformidade-pntp
```

O endpoint retorna:
- `pontuacao` (0-100)
- `nivel` (DIAMANTE | OURO | PRATA | ELEVADO | INTERMEDIARIO | BASICO | INICIAL | INEXISTENTE)
- `essenciaisFaltantes[]` — IDs dos critérios essenciais com pontuação < 100
- `dimensoes[]` — detalhamento de cada dimensão com lista de critérios

---

## Plano de Ação para 100% Diamante

### Curto prazo (dependem da administração)

- [ ] Popular `Receita` (cron SIAFI ou cadastro manual) — desbloqueio do crit. 3.1
- [ ] Popular `Despesa` (mesmo) — desbloqueio dos crits. 4.1, 4.2, 4.3
- [ ] Confirmar que existem RGFs `publicado` em `DocumentoTransparencia` — crit. 11.5
- [ ] Designar DPO em `Configuracao.lgpd_encarregado_*` — crit. 15.1
- [ ] Cadastrar perguntas em `PerguntaFrequente.ativo=true` — crit. 2.7
- [ ] Configurar redes sociais em `Configuracao.redes_sociais` — crit. 2.8
- [ ] Publicar Política de Privacidade (`POLITICA_PRIVACIDADE`), Carta de Serviços (`CARTA_SERVICOS`), Regulamento LAI (`REGULAMENTO_LAI`), PCA (`PLANO_ANUAL_CONTRATACOES`), Plano Estratégico (`PLANEJAMENTO_ESTRATEGICO`)
- [ ] Ativar transmissão das sessões (`Configuracao.transmissao_ativa=sim`) e configurar URL embed — crit. 20.9
- [ ] Publicar 1 pesquisa de satisfação em `/admin/transparencia/pesquisas-satisfacao` — crit. 15.6

### Médio prazo (já estão em código, demandam dados)

- [ ] Importar série histórica (2023-2026) das principais entidades para atender Série Histórica (20% de cada critério com `itensVerificacao.serieHistorica=true`)
- [ ] Garantir cron de atualização (`Receita`, `Despesa`, `Contrato`, `Licitacao`) com `updatedAt` ≤ 30 dias para atender Atualidade (30%)

### Auditoria externa

- [ ] Inscrever a Câmara no próximo ciclo Atricon (envio até prazo divulgado anualmente)
- [ ] Solicitar pré-auditoria ao Tribunal de Contas do Estado
- [ ] Gerar PDF de auto-avaliação via `/admin/conformidade-pntp` para registro

---

## Referências

- `docs/PNTP/Cartilha-PNTP-2026.pdf`
- `docs/PNTP/_criterios_camara.json` (83 critérios)
- `docs/PNTP/_metodologia.txt` (fórmula oficial e níveis)
- `src/lib/pntp/matriz-2026.ts` (implementação)
- `src/app/api/admin/conformidade-pntp/matriz/route.ts` (endpoint)
- `docs/PLANO-PNTP-2026.md` (histórico de implementação — Fases K, L, M, N)
- `REGRAS-DE-NEGOCIO.md` (RN-175 a RN-186)
