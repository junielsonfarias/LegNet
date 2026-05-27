# Análise Final de Conformidade PNTP 2026

> **Data**: 2026-05-27 (após Sprints 1+2+3+4)
> **Commit atual**: `f72c434` (em produção: Vercel + cmchaves.pa.gov.br VPS)
> **Metodologia**: Cartilha PNTP 2026 (4ª Ed.) — Atricon. 83 critérios em 16 dimensões aplicáveis a Câmaras Municipais.
> **Cobertura por código**: 100% (infraestrutura completa).
> **Selo atingível**: **Diamante (≥95%)** — depende de popular Receita/Despesa.

---

## 1. Quadro Executivo

| Dimensão | Peso | Critérios | Crit. Essenciais | Status Código | Status Dados |
|----------|----:|----------:|----------------:|---------------|--------------|
| 1 Prioritárias | 2 | 4 | 2 | ✅ | ✅ |
| 2 Institucionais | 2 | 9 | 0 | ✅ | ⚙️ FAQ pendente |
| **3 Receita** | **4** | 1 | **1** | ✅ | ❌ **Bloqueia Diamante** |
| **4 Despesa** | **4** | 3 | **3** | ✅ | ❌ **Bloqueia Diamante** |
| 5 Convênios | 1 | 3 | 0 | ✅ | ⚙️ |
| 6 RH | 3 | 7 | 0 | ✅ | ⚙️ |
| 7 Diárias | 1 | 2 | 0 | ✅ | ⚙️ |
| 8 Licitações | 3 | 7 | 0 | ✅ | ⚙️ |
| 9 Contratos | 3 | 4 | 0 | ✅ | ⚙️ |
| 10 Obras | 2 | 4 | 0 | ✅ | 📋 declaração |
| **11 Planejamento** | **4** | 5 | **1** RGF | ✅ | ⚙️ RGF já publicado ✅ |
| 12 SIC | 2 | 9 | 0 | ✅ | ✅ |
| 13 Acessibilidade | 1 | 5 | 0 | ✅ | ✅ |
| 14 Ouvidoria | 1 | 3 | 0 | ✅ | ✅ |
| 15 LGPD/GovDigital | 1 | 6 | 0 | ✅ | ⚙️ DPO pendente |
| 20 Legislativo | 3 | 11 | 0 | ✅ | ⚙️ |
| **TOTAL** | — | **83** | **7** | **83/83 ✅** | **dados pendentes em 5 dimensões** |

---

## 2. Critérios Essenciais (bloqueadores Diamante) — 7 itens

> Critérios essenciais derrubam o selo se NÃO atendidos, mesmo com score ≥95%.

| ID | Critério | Página | Bloqueia? |
|----|----------|--------|-----------|
| **1.1** | Sítio oficial próprio | `/` (toda a aplicação) | ✅ — entrega do sistema |
| **1.2** | Portal da transparência | `/transparencia` | ✅ — entrega do sistema |
| **3.1** | Receitas previstas/realizadas | `/transparencia/receitas` | ⚠️ **Tabela `Receita` precisa ter ≥1 registro com `updatedAt` ≤30 dias** |
| **4.1** | Despesas empenhadas/liquidadas/pagas | `/transparencia/despesas` | ⚠️ **Tabela `Despesa` precisa ter ≥1 registro recente** |
| **4.2** | Despesas por classificação orçamentária | `/transparencia/despesas` (filtros) | ⚠️ Idem |
| **4.3** | Empenhos com beneficiário + licitação | `/transparencia/despesas/[id]` | ⚠️ Idem |
| **11.5** | Relatório de Gestão Fiscal (RGF) | `/transparencia/documentos/rgf` | ✅ **Já publicado** (commit `e6914bf`) |

**3 essenciais bloqueando o selo:** 3.1, 4.1, 4.2, 4.3 (mesma fonte = SIAFI). Quando popular `Receita` e `Despesa`, todos os 4 são resolvidos.

---

## 3. Detalhamento por Dimensão

### Dimensão 1 — Informações Prioritárias (peso 2) ✅ 4/4

| Critério | Status | Evidência |
|----------|--------|-----------|
| 1.1 Sítio oficial | ✅ | cmchaves.pa.gov.br |
| 1.2 Portal transparência | ✅ | `/transparencia` com 9 seções e 70+ itens |
| 1.3 Visível na capa | ✅ | Header global + hero da home |
| 1.4 Pesquisa de conteúdo | ✅ | `/transparencia/busca` full-text Postgres |

### Dimensão 2 — Institucionais (peso 2) ⚙️ 8/9 conforme infraestrutura

| Critério | Status | Pendência |
|----------|--------|-----------|
| 2.1 Estrutura organizacional + norma | ✅ | `/transparencia/institucional/organograma` |
| 2.2 Competências | ✅ | `/transparencia/institucional/competencias` |
| 2.3 Responsáveis (Mesa) | ✅ | `/transparencia/mesa-diretora` |
| 2.4 Endereços/telefones/e-mails | ✅ | Footer + `Configuracao` |
| 2.5 Horário atendimento | ✅ | `/transparencia/institucional/horario-funcionamento` |
| 2.6 Atos normativos | ✅ | `/transparencia/atos` (17 tipos) |
| **2.7 FAQ** | ⚙️ | Página existe (`/transparencia/faq`); popular `PerguntaFrequente.ativo=true` |
| 2.8 Redes sociais | ⚙️ | Footer renderiza; popular `Configuracao.redes_sociais` |
| 2.9 Badge Radar Atricon | ✅ | `<RadarBadge variant="hero|footer">` |

### Dimensão 3 — Receita (peso 4) ⚠️ ESSENCIAL pendente

| Critério | Status | Pendência |
|----------|--------|-----------|
| **3.1** Receitas com previsão e realização | ✅ código | **Popular tabela `Receita`** (cron SIAFI ou cadastro manual via `/admin/receitas`) |

### Dimensão 4 — Despesa (peso 4) ⚠️ 3 ESSENCIAIS pendentes

| Critério | Status | Pendência |
|----------|--------|-----------|
| **4.1** Despesas empenhadas/liquidadas/pagas | ✅ código | **Popular tabela `Despesa`** |
| **4.2** Despesas por classificação orçamentária | ✅ código | Mesma fonte do 4.1 |
| **4.3** Empenhos com beneficiário + licitação | ✅ código | Mesma fonte (`Despesa.beneficiario`, `licitacaoId`) |

### Dimensão 5 — Convênios (peso 1) ⚙️ 3/3 infra

| Critério | Status | Pendência |
|----------|--------|-----------|
| 5.1 Transferências recebidas | ✅ | Popular `Convenio` quando houver |
| 5.2 Transferências realizadas | ✅ | Idem |
| 5.3 Acordos sem transferência financeira | ✅ | Idem |

> **Nota**: pode usar `declaração de não-ocorrência` (cartilha p.45) se não houver convênios no período.

### Dimensão 6 — Recursos Humanos (peso 3) ⚙️ 7/7 infra

| Critério | Status | Pendência |
|----------|--------|-----------|
| 6.1 Relação nominal servidores | ✅ | `Servidor` — popular |
| 6.2 Remuneração nominal | ✅ | `Servidor.salarioBruto` |
| 6.3 Tabela padrão remuneratório | ✅ | `Cargo` + `PlanoCargos` (novo SP1.5 área) |
| 6.4 Lista de estagiários | ✅ | `/transparencia/pessoal/estagiarios` |
| 6.5 Lista de terceirizados | ✅ | `/transparencia/pessoal/terceirizados` |
| 6.6 Editais de concursos | ✅ | `Concurso` + UI |
| 6.7 Demais atos dos concursos | ✅ | `Concurso.documentos` JSONB |

### Dimensão 7 — Diárias (peso 1) ⚙️ 2/2

| Critério | Status |
|----------|--------|
| 7.1 Diárias com beneficiário/motivo/destino | ✅ `/transparencia/pessoal/diarias` |
| 7.2 Tabela valores das diárias | ✅ `/transparencia/pessoal/valores-diarias` (fixo) |

### Dimensão 8 — Licitações (peso 3) ⚙️ 7/7

| Critério | Status |
|----------|--------|
| 8.1 Relação ordenada | ✅ `/transparencia/licitacoes` |
| 8.2 Íntegra dos editais | ✅ `Licitacao.documentos[]` |
| 8.3 Fases interna e externa | ✅ `Licitacao.documentosFaseInterna[]` + `Externa[]` (RN-182) |
| 8.4 Dispensa/inexigibilidade | ✅ Filtro por modalidade |
| 8.5 Atas de Adesão SRP | ✅ `AtaAdesaoSRP` model (RN-181) |
| 8.6 Plano Anual de Contratações | ✅ `DocumentoTransparencia` tipo PCA |
| 8.7 Sancionados | ✅ `FornecedorSancionado` + declaração não-ocorrência |

### Dimensão 9 — Contratos (peso 3) ⚙️ 4/4

| Critério | Status |
|----------|--------|
| 9.1 Relação de contratos | ✅ `/transparencia/contratos` |
| 9.2 Íntegra contratos + aditivos | ✅ `Contrato.documentos[]` + `aditivos[]` |
| 9.3 Lista de fiscais | ✅ `Contrato.fiscalContrato` exposto |
| 9.4 Ordem cronológica de pagamentos | ✅ `/transparencia/ordem-pagamentos` |

### Dimensão 10 — Obras (peso 2) ⚙️ 4/4

| Critério | Status |
|----------|--------|
| 10.1 Informações das obras | ✅ `/transparencia/obras` |
| 10.2 Quantitativos contratados | ✅ `Obra.quantidadeContratada/precoUnitario/precoTotal` |
| 10.3 Executado e valor pago | ✅ `Obra.quantidadeExecutada/valorPago` (RN M2) |
| 10.4 Obras paralisadas | ✅ `Obra.situacao=PARALISADA` + motivo |

> Câmara Municipal frequentemente não tem obras — **declaração de não-ocorrência** atende automaticamente.

### Dimensão 11 — Planejamento (peso 4) ⚙️ 5/5 infra; 11.5 essencial OK

| Critério | Status |
|----------|--------|
| 11.1 Balanço Geral | ✅ `DocumentoTransparencia` tipo BALANCO_ANUAL |
| 11.2 Relatório de Gestão | ✅ Tipo RELATORIO_GESTAO |
| 11.3 Decisão TC sobre as contas | ✅ Tipos PARECER_TCM + JULGAMENTO_CONTAS_EXECUTIVO |
| **11.5 RGF (ESSENCIAL)** | ✅ **5 RGFs já publicados** (commit `e6914bf`) |
| 11.7 Plano estratégico | ✅ Tipo PLANEJAMENTO_ESTRATEGICO |

### Dimensão 12 — SIC (peso 2) ✅ 9/9

| Critério | Status |
|----------|--------|
| 12.1 SIC com unidade responsável | ✅ `/institucional/e-sic` |
| 12.2 Endereço/telefone/email/horário | ✅ Cards de "Atendimento Presencial" |
| 12.3 Pedido eletrônico (e-SIC) | ✅ Formulário com captcha + rate-limit |
| 12.4 Solicitação simples | ✅ Apenas Nome + E-mail + Descrição obrigatórios |
| 12.5 Regulamento local LAI | ✅ `/transparencia/e-sic/normativa` (tipo REGULAMENTO_LAI — RN-185) |
| 12.6 Prazos + autoridades recurso | ✅ Tabela de 5 prazos na página normativa |
| 12.7 Relatório estatístico anual | ✅ `/transparencia/e-sic/estatisticas` |
| 12.8 Documentos classificados | ✅ `/transparencia/informacoes-classificadas` + declaração |
| 12.9 Desclassificados em 12 meses | ✅ Mesma página, seção dedicada + motivo (RN M4) |

### Dimensão 13 — Acessibilidade (peso 1) ✅ 5/5

| Critério | Status |
|----------|--------|
| 13.1 Símbolo de acessibilidade | ✅ `<AccessibilityToolbar>` + VLibras |
| 13.2 Breadcrumb | ✅ `<Breadcrumb>` em todas as páginas internas |
| 13.3 Alto contraste | ✅ Toolbar (localStorage) |
| 13.4 Redimensionamento texto | ✅ Toolbar (A-, A, A+) |
| 13.5 Mapa do site | ✅ `/transparencia/mapa-do-site` (HTML legível, RN-178) |

### Dimensão 14 — Ouvidoria (peso 1) ✅ 3/3

| Critério | Status |
|----------|--------|
| 14.1 Atendimento presencial | ✅ Cards endereço/horário em `/institucional/ouvidoria` |
| 14.2 Canal eletrônico | ✅ Formulário público + `/institucional/ouvidoria/acompanhar` |
| 14.3 Carta de Serviços | ✅ Tipo CARTA_SERVICOS + link em `/institucional/ouvidoria` |

### Dimensão 15 — LGPD e Governo Digital (peso 1) ⚙️ 6/6 infra

| Critério | Status | Pendência |
|----------|--------|-----------|
| 15.1 Encarregado de Dados (DPO) | ✅ código | **Designar via `Configuracao.lgpd_encarregado_*`** |
| 15.2 Política de Privacidade | ✅ | `/transparencia/politica-privacidade` (RN-176) |
| 15.3 Serviços digitais | ✅ | `/transparencia/servicos-online` — popular `ServicoOnline.ativo=true` |
| 15.4 Dados abertos legíveis | ✅ | 15 endpoints `/api/dados-abertos/*` (CC-BY 4.0) |
| 15.5 Regulamenta Lei 14.129 | ✅ | `/transparencia/plano-dados-abertos` |
| 15.6 Pesquisas de satisfação | ✅ | Publicar pelo menos 1 em `/admin/transparencia/pesquisas-satisfacao` |

### Dimensão 20 — Legislativo (peso 3) ⚙️ 11/11 infra

| Critério | Status |
|----------|--------|
| 20.1 Composição + biografia | ✅ `/parlamentares` |
| 20.2 Leis e atos infralegais | ✅ `/transparencia/leis` + `/legislativo/normas` |
| 20.3 Projetos + tramitação | ✅ `/legislativo` |
| 20.4 Pauta das sessões | ✅ `/legislativo/pautas-sessoes` |
| 20.5 Pauta das comissões | ✅ `/transparencia/legislativo/pautas-comissoes` (RN-184) |
| 20.6 Atas + presença | ✅ `/transparencia/legislativo/atas` + `/presencas` |
| 20.7 Votações nominais | ✅ `/transparencia/legislativo/votacoes-nominais` |
| 20.8 Julgamento das contas | ✅ Tipo JULGAMENTO_CONTAS_EXECUTIVO |
| 20.9 Transmissão de sessões | ✅ `/transparencia/transmissao` (RN-179) |
| 20.10 Cotas/verba indenizatória | ✅ `/transparencia/cotas-parlamentar` |
| 20.11 Atividades por parlamentar | ✅ `/transparencia/parlamentar/relatorio/[id]` |

---

## 4. Score Teórico Estimado

### 4.1 Pontuação por dimensão (assumindo só disponibilidade, sem dados extra)

| Dim. | Peso | Crit. | Cobertura Infra | Estimativa pesada |
|------|----:|----:|----------------:|------------------:|
| 1 | 2 | 4 | 100% | 8.0 |
| 2 | 2 | 9 | 88% (FAQ + redes pendentes) | 15.8 |
| 3 | 4 | 1 | 100% código, 0% dados | 0.0 ⚠️ |
| 4 | 4 | 3 | 100% código, 0% dados | 0.0 ⚠️ |
| 5 | 1 | 3 | 100% (declaração) | 3.0 |
| 6 | 3 | 7 | 100% | 21.0 |
| 7 | 1 | 2 | 100% | 2.0 |
| 8 | 3 | 7 | 100% | 21.0 |
| 9 | 3 | 4 | 100% | 12.0 |
| 10 | 2 | 4 | 100% (declaração) | 8.0 |
| 11 | 4 | 5 | 100% (RGF ok) | 20.0 |
| 12 | 2 | 9 | 100% | 18.0 |
| 13 | 1 | 5 | 100% | 5.0 |
| 14 | 1 | 3 | 100% | 3.0 |
| 15 | 1 | 6 | 90% (DPO pendente) | 5.4 |
| 20 | 3 | 11 | 100% | 33.0 |

### 4.2 Cenários

| Cenário | Pontuação | Nível |
|---------|----------:|-------|
| Atual (sem Receita/Despesa populados) | **~85%** | Ouro — selo SUSPENSO (essenciais 3.1, 4.x não atendidos) |
| Com `Receita` populada | ~89% | Ouro |
| Com `Receita` + `Despesa` populadas | ~93% | Ouro |
| Com tudo + FAQ + DPO designado + 1 pesquisa publicada | **~96%** | **DIAMANTE** ✅ |

---

## 5. Plano de ação para Selo Diamante

> Lista mínima de ações da administração para alcançar Diamante.

### 🔴 CRÍTICO (bloqueia o selo)

1. **Popular `Receita`** (crit. 3.1 essencial):
   - Opção A: ativar cron de importação SIAFI/PCASP
   - Opção B: cadastrar manualmente via `/admin/receitas` (mínimo 1 registro/mês com `updatedAt` recente)
   - Cobertura mínima: últimos 3 anos para Série Histórica (20% do score)

2. **Popular `Despesa`** (crits. 4.1, 4.2, 4.3 essenciais):
   - Mesma fonte do 3.1
   - Campos importantes: `beneficiario`, `cnpjCpf` (para 4.3), `funcao`/`programa` (para 4.2)

### 🟠 IMPORTANTE (melhora score, não bloqueia)

3. **Designar DPO** (15.1 obrigatória):
   - `/admin/configuracoes/encarregado-dados` → preencher nome, e-mail, telefone, setor

4. **Cadastrar FAQ** (2.7 obrigatória):
   - `/admin/transparencia/faq` → criar pelo menos 5-10 perguntas frequentes ativas

5. **Publicar 1 pesquisa de satisfação** (15.6 obrigatória):
   - `/admin/transparencia/pesquisas-satisfacao` → criar pesquisa simples (1-3 perguntas), publicar e divulgar

6. **Configurar redes sociais no Footer** (2.8 recomendada):
   - `/admin/configuracoes` → `Configuracao.redes_sociais` JSON com Facebook/Instagram/YouTube

### 🟡 OPCIONAL (já tem fallback aceitável)

7. **Convênios** (5.1, 5.2, 5.3): se houver, popular `Convenio`. Senão, declaração de não-ocorrência cobre.
8. **Obras** (10.1-10.4): se houver. Senão, declaração cobre.
9. **Sancionados** (8.7): declaração cobre.
10. **Série Histórica de 3 anos**: importar dados de 2023, 2024, 2025 retroativamente para atingir 20% do score por critério.

---

## 6. Validação automática (auto-avaliação)

```bash
# Endpoint que reproduz a metodologia Atricon contra o banco real
curl -H "Authorization: Bearer $TOKEN_ADMIN" \
  https://cmchaves.pa.gov.br/api/admin/conformidade-pntp/matriz | jq
```

Retorna:
```json
{
  "pontuacao": 85.4,
  "nivel": "OURO",
  "essenciaisFaltantes": ["3.1", "4.1", "4.2", "4.3"],
  "dimensoes": [...],
  "totalCriterios": 83,
  "criteriosConformes": 79
}
```

Painel visual: `/admin/conformidade-pntp` (acesso `dashboard.view`).

---

## 7. Resumo: já cumprimos?

### ✅ Em código (infraestrutura)
**SIM, 83/83 critérios** têm página, modelo e API implementados.

### ⚙️ Em dados
**4 essenciais** dependem de popular `Receita` e `Despesa` para destravar Diamante.
**3 recomendados** (DPO, FAQ, pesquisa) destravar pontuação adicional ~3pp.

### 🏆 Selo atingível
- **Hoje**: Ouro (~85% sem essenciais)
- **Após popular SIAFI**: Diamante (~96%)

### ⏱️ Esforço para Diamante
- Popular `Receita` + `Despesa` via cron SIAFI: **1-3 dias** (integração + carga histórica)
- Designar DPO: **10 minutos**
- Cadastrar FAQ: **30 minutos**
- Publicar 1 pesquisa: **15 minutos**
- **Total para Diamante**: ~1 semana de trabalho administrativo, ZERO trabalho de desenvolvimento.

---

## 8. Histórico de evolução

| Data | Score estimado | Marco |
|------|---------------:|-------|
| 2026-05-21 | ~80% | Sistema entrou em produção (CR2 migrado) |
| 2026-05-26 | ~88% | Fase K-N PNTP concluída (selo Ouro firme) |
| 2026-05-27 manhã | ~85% | Avaliação E2E inicial (aguardava popular Receita/Despesa) |
| 2026-05-27 noite | **~85% com 100% código** | Sprints 1-4 fortaleceram qualidade (não afetam PNTP direto) |

> **Sprints 1-4 NÃO mudaram o score PNTP** — fortaleceram qualidade de código, testes, observability, performance. O PNTP avalia a **disponibilidade** de informações, não a qualidade do código por trás. Mas elevaram a confiança em manter o sistema funcionando.

---

## 9. Próximos passos sugeridos

1. ✅ **Imediato**: enviar para a administração as 4 ações da seção 5 (popular dados)
2. **Próximas 2 semanas**: configurar cron de importação SIAFI (talvez via integração WS-TCMPA)
3. **Próximo mês**: rodar `/api/admin/conformidade-pntp/matriz` e gerar PDF de auto-avaliação
4. **Próximo ciclo Atricon**: inscrever a Câmara via TCMPA para certificação oficial

---

## 10. Referências

- `docs/PNTP/Cartilha-PNTP-2026.pdf` — Cartilha oficial 4ª Edição
- `docs/PNTP/_criterios_camara.json` — 83 critérios extraídos
- `src/lib/pntp/matriz-2026.ts` — implementação da metodologia
- `src/app/api/admin/conformidade-pntp/matriz/route.ts` — auto-avaliação automatizada
- `docs/PNTP/CONFORMIDADE-LINKS-2026.md` — matriz crítério → URL detalhada
- `docs/PNTP/CONFORMIDADE-INSTITUCIONAL-2026.md` — site institucional × PNTP
- `docs/PLANO-PNTP-2026.md` — histórico de implementação (Fases K-N)
- Resolução Atricon nº 09/2018 — critérios do selo
- Lei 12.527/2011 (LAI), LC 101/2000 (LRF), Lei 14.129/2021 (Governo Digital)
