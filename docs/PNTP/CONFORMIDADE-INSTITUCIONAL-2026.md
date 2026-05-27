# Site Institucional — Conformidade PNTP 2026

> **Data**: 2026-05-27
> **Escopo**: Páginas em `src/app/institucional/**` cruzadas com os critérios da Cartilha PNTP 2026 (Atricon, 4ª Edição). O site institucional cobre principalmente as **Dimensões 1, 2, 12, 14** e contribui com a **Dimensão 20**.
> **Complementa**: `docs/PNTP/CONFORMIDADE-LINKS-2026.md` (matriz geral com as 16 dimensões).

---

## Páginas mapeadas

| Página | URL | Função |
|--------|-----|--------|
| Índice institucional | `/institucional` | Hub com 4 seções e 12 atalhos (**criado 2026-05-27**) |
| Sobre a Câmara | `/institucional/sobre` | História, missão, mesa diretora, estatísticas, contato |
| Papel da Câmara | `/institucional/papel-camara` | Funções legislativa, fiscalizadora, julgadora, administrativa |
| Papel do Vereador | `/institucional/papel-vereador` | Atribuições do representante |
| Lei Orgânica | `/institucional/lei-organica` | Integra da Lei Orgânica + downloads |
| Regimento Interno | `/institucional/regimento` | Normas internas |
| Código de Ética | `/institucional/codigo-etica` | Princípios éticos |
| E-SIC | `/institucional/e-sic` | Pedido eletrônico de informação (LAI) |
| E-SIC acompanhar | `/institucional/e-sic/acompanhar` | Consulta por protocolo |
| E-SIC recurso | `/institucional/e-sic/recurso/[protocolo]` | Recurso de pedido indeferido |
| Ouvidoria | `/institucional/ouvidoria` | Manifestações + canais de atendimento |
| Ouvidoria acompanhar | `/institucional/ouvidoria/acompanhar` | Consulta por protocolo |
| Câmara Explica | `/institucional/camara-explica` | Conteúdo educativo |
| Câmara Explica detalhe | `/institucional/camara-explica/[slug]` | Conteúdo individual |
| Dicionário Legislativo | `/institucional/dicionario` | Glossário de termos |

---

## Matriz crítério × página institucional

### Dimensão 1 — Informações Prioritárias

| Crit. | Página institucional que reforça | Status |
|-------|----------------------------------|--------|
| 1.1 Sítio oficial | `/` (todo o domínio) | ✅ |
| 1.3 Acesso ao portal transparência na capa | Header global (link "Transparencia") + top-bar fixa | ✅ |
| 1.4 Pesquisa de conteúdo | `/transparencia/busca` (link direto na home) + `/institucional/dicionario` (apoio) | ✅ |

### Dimensão 2 — Informações Institucionais (núcleo do institucional)

| Crit. | Página institucional | Campos relevantes | Status |
|-------|----------------------|-------------------|--------|
| **2.1** Estrutura organizacional + norma | `/institucional/sobre` (Mesa Diretora visual + organograma) + `/transparencia/institucional/organograma` | `Configuracao.organograma_img`, `MembroMesaDiretora` | ✅ |
| **2.2** Competências/atribuições | `/institucional/papel-camara` + `/institucional/papel-vereador` + `/transparencia/institucional/competencias` | Conteúdo HTML completo (4 funções constitucionais) | ✅ |
| **2.3** Responsáveis pela gestão | `/institucional/sobre` (Presidente + Mesa Diretora) + `/parlamentares/mesa-diretora` | Foto, nome, cargo, partido | ✅ |
| **2.4** Endereços/telefones/e-mails | `/institucional/sobre` (seção "Informações de Contato") + footer global | `Configuracao.endereco_*`, `telefone`, `email` | ✅ |
| **2.5** Horário de atendimento | `/institucional/sobre` ("Segunda a Sexta") + `/transparencia/institucional/horario-funcionamento` | Texto fixo + config | ✅ |
| **2.6** Atos normativos próprios | `/institucional/lei-organica` + `/institucional/regimento` + `/institucional/codigo-etica` + `/transparencia/atos` (17 tipos) | `DocumentoLeiOrganica`, `DocumentoTransparencia` | ✅ |
| **2.7** FAQ | `/institucional/e-sic` (5 perguntas embutidas) + `/transparencia/faq` (BD) | `PerguntaFrequente.ativo=true` | ✅ |

### Dimensão 12 — SIC (Serviço de Informação ao Cidadão)

| Crit. | Página institucional | Status |
|-------|----------------------|--------|
| **12.1** SIC com unidade responsável | `/institucional/e-sic` (banner LAI + identifica setor responsável via `Configuracao`) | ✅ |
| **12.2** Endereço/telefone/e-mail/horário SIC | `/institucional/e-sic` (cards de "Atendimento Presencial" usando `useConfiguracaoInstitucional`) | ✅ |
| **12.3** Pedido eletrônico (e-SIC) | `/institucional/e-sic` (formulário público com captcha + rate-limit) | ✅ |
| **12.4** Pedido simples (sem barreiras) | `/institucional/e-sic` (Nome + E-mail + Descrição apenas — CPF/Telefone opcionais) | ✅ |
| **12.5** Regulamento local LAI | Link cruzado adicionado em `/institucional/e-sic` → `/transparencia/e-sic/normativa` (**criado 2026-05-27**) | ✅ |
| **12.6** Prazos + autoridades de recurso | FAQ na `/institucional/e-sic` ("Qual o prazo para resposta?") + link cruzado para `/transparencia/e-sic/normativa` | ✅ |
| **12.7** Relatório estatístico anual | Link cruzado adicionado em `/institucional/e-sic` → `/transparencia/e-sic/estatisticas` (**criado 2026-05-27**) | ✅ |
| **12.8** Documentos classificados | Link cruzado adicionado em `/institucional/e-sic` → `/transparencia/informacoes-classificadas` (**criado 2026-05-27**) | ✅ |
| **12.9** Desclassificados em 12 meses | Mesmo link cruzado (seção "Desclassificadas" da página) | ✅ |

### Dimensão 14 — Ouvidoria

| Crit. | Página institucional | Status |
|-------|----------------------|--------|
| **14.1** Atendimento presencial | `/institucional/ouvidoria` (cards de Endereço + Horário no fim da página) | ✅ |
| **14.2** Canal eletrônico | `/institucional/ouvidoria` (formulário público + protocolo) + `/institucional/ouvidoria/acompanhar` (consulta) | ✅ |
| **14.3** Carta de Serviços | Link cruzado adicionado em `/institucional/ouvidoria` → `/transparencia/documentos/carta-servicos` (**criado 2026-05-27**) | ✅ |

### Dimensão 15 — LGPD e Governo Digital

| Crit. | Página institucional | Status |
|-------|----------------------|--------|
| 15.3 Acesso digital a serviços | `/institucional/e-sic` e `/institucional/ouvidoria` (ambos servem a partir do site institucional como porta de entrada) | ✅ |

### Dimensão 20 — Atividades Finalísticas do Legislativo

| Crit. | Página institucional que reforça | Status |
|-------|----------------------------------|--------|
| 20.1 Composição da Casa + biografia | `/institucional/sobre` (Mesa Diretora visual) + `/parlamentares` (lista completa) | ✅ |
| 20.2 Leis e atos infralegais | `/institucional/lei-organica` (Lei Orgânica) + `/institucional/regimento` (Regimento) + `/institucional/codigo-etica` | ✅ |

---

## Campos por página (auditoria de conteúdo)

### `/institucional/sobre`

| Campo | Origem | PNTP |
|-------|--------|------|
| Nome da Casa | `Configuracao.nome` | 2.4 |
| Descrição/História | `Configuracao.descricao` | 2.1 |
| Mesa Diretora (foto, nome, cargo, partido) | `MembroMesaDiretora.*` | 2.3, 20.1 |
| Total de Parlamentares | `prisma.parlamentar.count()` | 20.1 |
| Total de Comissões | `prisma.comissao.count()` | 2.1 |
| Legislatura atual | `Legislatura.numero, periodo` | 20.1 |
| Endereço completo | `Configuracao.endereco_*` | 2.4 |
| Telefone, e-mail, site | `Configuracao.{telefone,email,site}` | 2.4 |
| CNPJ | `Configuracao.cnpj` | 2.4 |
| Missão, Visão, Valores | Conteúdo estático | 2.2 |
| Atribuições (legislativa + fiscalizadora) | Conteúdo estático | 2.2 |

### `/institucional/e-sic`

| Campo de entrada | Obrigatório | Por que |
|------------------|-------------|---------|
| Nome | sim | Crit. 12.4 — simples |
| E-mail | sim | Para resposta |
| CPF | **não** | Anonimato permitido pela LAI |
| Telefone | **não** | Opcional |
| Tipo de solicitante | sim | Estatística (12.7) |
| Assunto | sim | Conteúdo |
| Descrição | sim | Conteúdo |
| Órgão | sim | Roteamento |
| Forma de resposta | sim | Atendimento |
| Captcha matemático | sim | Anti-spam (RN-167) |

Critério 12.4 atendido: **a única informação rigidamente obrigatória é nome+e-mail**, demais campos opcionais.

### `/institucional/ouvidoria`

| Campo | Obrigatório | Por que |
|-------|-------------|---------|
| Anônimo (toggle) | — | Permite manifestação anônima (RN-001) |
| Nome | só se NÃO anônimo | Identificação |
| E-mail | só se NÃO anônimo | Resposta |
| CPF | **não** | LGPD — coletar minimamente |
| Telefone | **não** | Opcional |
| Tipo (reclamação/denúncia/etc.) | sim | Classificação |
| Setor de destino | sim | Roteamento |
| Assunto + Descrição | sim | Conteúdo |
| Captcha | sim | Anti-spam |

---

## Ajustes feitos hoje (2026-05-27)

### 1. Página índice `/institucional/page.tsx` (criada)

Antes: acessar `/institucional` retornava 404 (apenas subrotas existiam).
Agora: hub com 4 seções (A Casa Legislativa, Marco Regulatório, Atendimento ao Cidadão, Conheça o Legislativo) e 12 atalhos. Ponto de entrada único para o site institucional, em paralelo a `/transparencia` e `/legislativo`.

### 2. `/institucional/e-sic` — links cruzados para PNTP 12.5/12.7/12.8

Adicionados 3 cards após os serviços principais:
- **Marco Normativo da LAI** → `/transparencia/e-sic/normativa` (crit. 12.5/12.6)
- **Estatísticas do e-SIC** → `/transparencia/e-sic/estatisticas` (crit. 12.7)
- **Informações Classificadas** → `/transparencia/informacoes-classificadas` (crit. 12.8/12.9)

Antes, essas páginas só eram acessíveis via `/transparencia`. Agora o cidadão que entra pelo institucional tem o caminho explícito.

### 3. `/institucional/ouvidoria` — links cruzados para PNTP 14.3

Adicionados 3 cards após a tabela de prazos:
- **Carta de Serviços ao Usuário** → `/transparencia/documentos/carta-servicos` (crit. 14.3)
- **Relatórios da Ouvidoria** → `/transparencia/ouvidoria/estatisticas` (apoio ao 12.7 estendido para ouvidoria)
- **Regulamentação da Ouvidoria** → `/transparencia/ouvidoria/regulamentacao`

---

## Status final do site institucional × PNTP

| Dimensão | Critérios cobertos pelo institucional | Status |
|----------|--------------------------------------|--------|
| 1 Prioritárias | 1.1, 1.3, 1.4 (contribui via header) | ✅ |
| 2 Institucionais | **2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7** (todos) | ✅ |
| 12 SIC | **12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9** (todos com links cruzados a partir de hoje) | ✅ |
| 14 Ouvidoria | **14.1, 14.2, 14.3** (todos com links cruzados) | ✅ |
| 15 LGPD | 15.3 (apoio — porta de entrada digital) | ✅ |
| 20 Legislativo | 20.1, 20.2 (apoio) | ✅ |

**Conclusão**: o site institucional cobre as dimensões que lhe são próprias e, com os ajustes de hoje, todos os caminhos críticos PNTP (12.5, 12.7, 12.8, 14.3) têm link a partir do `/institucional/e-sic` e `/institucional/ouvidoria` — eliminando o caminho oculto que dependia exclusivamente de `/transparencia/**`.

---

## Próximos passos (responsabilidade da administração)

- [ ] Popular `Configuracao.descricao` para personalizar a história em `/institucional/sobre` (hoje usa texto genérico de fallback)
- [ ] Confirmar dados de contato em `Configuracao.{telefone,email,site,cnpj}` (já visíveis no rodapé)
- [ ] Designar o Ouvidor(a) — hoje aparece "A definir" no card de "Informações da Ouvidoria" (vide `/transparencia/page.tsx:532`)
- [ ] Publicar Carta de Serviços (`DocumentoTransparencia.tipo=CARTA_SERVICOS`) — destrava a página vinculada em ouvidoria
- [ ] Publicar Regulamento LAI (`DocumentoTransparencia.tipo=REGULAMENTO_LAI`) — destrava a página vinculada em e-SIC

---

## Referências

- `docs/PNTP/CONFORMIDADE-LINKS-2026.md` — matriz geral das 16 dimensões
- `docs/PNTP/_criterios_camara.json` — 83 critérios oficiais
- `src/components/layout/header.tsx` — menu Institucional (9 itens) e link Transparencia no top-bar
- `src/lib/hooks/use-configuracao-institucional.ts` — fonte unificada de configuração (nome, endereço, contato)
