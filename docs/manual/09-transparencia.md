# Capítulo 09 — Transparência (PNTP)

O módulo de Transparência cumpre obrigações da **Lei de Acesso à Informação (LAI)**, da **Lei de Responsabilidade Fiscal (LRF)** e do **Programa Nacional de Transparência Pública (PNTP)**. É o que mantém o portal público alimentado com dados de despesas, receitas, contratos, folha de pagamento, licitações e documentos oficiais.

Neste capítulo você vai aprender a:

- Cadastrar despesas, receitas, contratos, convênios, licitações
- Cadastrar folha de pagamento mensal
- Gerenciar diárias e verbas indenizatórias
- Publicar documentos oficiais (leis, decretos, portarias, RGF, RREO)
- Configurar categorias e links do portal
- Monitorar conformidade PNTP
- Gerenciar cartões corporativos, bens, veículos, obras

> 🔒 **Requer permissão**: `transparencia.manage` (Editor, Administrador). Demais perfis têm leitura.

---

## 9.1 — Visão geral

### 9.1.1 — Obrigações legais

| Lei/Programa | Exigência | Prazo de publicação |
|---|---|---|
| **LAI** (Lei 12.527/2011) | Dados gerais atualizados | Sempre que alterado |
| **LRF** (Lei Complementar 101/2000) | RGF, RREO, demonstrativos | Quadrimestral / semestral |
| **Lei 4.320/1964** | Execução orçamentária | Diária (desejável) |
| **PNTP** (Nível Diamante) | Conformidade em 100+ itens | 30 dias para maioria |

### 9.1.2 — Módulos do Transparência

O menu lateral ***Transparência*** (16 itens) agrupa:

| Categoria | Itens |
|---|---|
| **Financeiro** | Despesas, Receitas, Notas Fiscais, Ordem de Pagamentos, Repasses, Cartão Corporativo, Programas e Ações |
| **Licitações e Contratos** | Licitações, Contratos, Convênios, Fornecedores Sancionados |
| **Pessoal** (categoria separada) | Servidores, Folha de Pagamento, Diárias, Verbas Indenizatórias, Concursos |
| **Patrimônio** | Obras, Veículos, Bens Patrimoniais |
| **Institucional** | Documentos Oficiais, Serviços Online, Organograma |
| **Configuração** | Conteúdo, Links, Períodos, Conformidade |

---

## 9.2 — Configuração geral do portal

Antes de alimentar dados, configure **o que aparece** no portal público.

### 9.2.1 — Conteúdo do portal

URL: `/admin/configuracoes/transparencia-conteudo`

![Configuração de conteúdo](./images/09-01-config-conteudo.png)

**Passo 1**: criar categorias

Botão **+ Nova Categoria**.

| Campo | Observações |
|---|---|
| **Nome** | Ex: "Receitas e Despesas" |
| **Ícone** | Seleção de ícones Lucide |
| **Ordem** | Posição no menu |
| **Ativa** | Toggle — se inativa, não aparece no portal |

**Passo 2**: adicionar itens à categoria

Dentro da categoria, botão **+ Item**.

| Campo | Observações |
|---|---|
| **Nome** | Ex: "Despesas Detalhadas" |
| **Tipo** | Página do sistema / Link externo / Documento |
| **URL** | Caminho interno (`/transparencia/despesas`) ou URL externa |
| **Ativo** | Toggle |

### 9.2.2 — Períodos

URL: `/admin/configuracoes/transparencia-periodos`

Útil quando há dados **em dois sistemas** (ex: dados até 2021 no portal antigo, 2022+ no novo).

1. Selecione categoria (Despesas, Receitas, etc.)
2. Habilite **Tela de seleção de período**
3. Adicione períodos:
   - **Rótulo** (ex: "Até 2021")
   - **URL externa** (portal antigo)
   - **Rota interna** (para novo sistema)
   - **Ano** (para filtro)
4. Reordene conforme cronologia

No portal público, aparece dropdown de período ao abrir a categoria.

### 9.2.3 — Links externos

URL: `/admin/configuracoes/transparencia-links`

Para redirecionar para portais externos complementares (ex: Tribunal de Contas, Portal Nacional).

---

## 9.3 — Cadastrar Despesas

Sidebar → ***Transparência*** → ***Despesas*** (ou ***Pessoal*** → Despesas). URL `/admin/despesas`.

![Lista de despesas](./images/09-02-despesas.png)

### 9.3.1 — Campos obrigatórios

| Campo | Observações |
|---|---|
| **Número do Empenho** * | Formato local (ex: `2026NE000123`) |
| **Data do Empenho** * | Data da emissão |
| **Credor** * | Nome/razão social |
| **Valor Empenhado** * | Em reais |
| **Situação** | EMPENHADO → LIQUIDADO → PAGO |
| **Valor Liquidado** | Quando liquidado |
| **Valor Pago** | Quando pago |
| **Data de Pagamento** | Data efetiva |
| **Função** | Código da função programática |
| **Subfunção** | Código |
| **Programa** | Código e nome |
| **Ação** | Código e nome |
| **Elemento de despesa** | Ex: "339039 - Outros Serviços de Terceiros" |

### 9.3.2 — Vínculos opcionais

- **Licitação origem** (se a despesa decorre de licitação)
- **Contrato origem** (aditivos herdam do contrato base)
- **Convênio origem**
- **Ordem de Pagamento** (se já foi paga)

### 9.3.3 — Importação em lote

Há opção de **Importar CSV/Excel** para cadastro em massa:

1. Botão **Importar**
2. Baixe o **template** (.xlsx) com colunas corretas
3. Preencha no Excel
4. Faça upload
5. Sistema valida e importa em transação (ou reverte tudo se houver erro)

> 💡 **Dica**: faça backup antes de importações grandes. Se importar 1000 despesas com erro, o rollback pode levar minutos.

---

## 9.4 — Cadastrar Receitas

Similar a Despesas. Campos principais:

| Campo | Observações |
|---|---|
| **Categoria** | CORRENTE ou CAPITAL |
| **Origem** | TRIBUTÁRIA / TRANSFERÊNCIAS / PATRIMONIAL / etc. |
| **Espécie** | Impostos, Taxas, Contribuições, Multas |
| **Valor Previsto** | Orçamento |
| **Valor Arrecadado** | Realizado |
| **Rubrica** | Classificação detalhada |
| **Contribuinte** | Opcional (pessoa/órgão) |

---

## 9.5 — Cadastrar Contratos

URL: `/admin/contratos`.

![Tela de contratos](./images/09-03-contratos.png)

### 9.5.1 — Dados essenciais

| Campo | Observações |
|---|---|
| **Número** * | Ex: "CONTR 012/2026" |
| **Objeto** * | Descrição do que foi contratado |
| **Contratado** * | Nome/CNPJ |
| **Valor Total** * | Em reais |
| **Data de Assinatura** * | |
| **Vigência Início** * | |
| **Vigência Fim** * | |
| **Modalidade** | Pregão Eletrônico, Dispensa, Inexigibilidade, Licitação |
| **Licitação Origem** | Vincula ao processo licitatório |
| **Situação** | Vigente, Encerrado, Rescindido, Suspenso |

### 9.5.2 — Aditivos

Se o contrato tiver aditivo (prazo/valor):

1. Cadastre **novo contrato** marcando **Contrato de Origem** apontando para o original
2. Informe tipo de aditivo (prazo, valor, objeto)
3. Sistema exibe histórico consolidado no contrato original

### 9.5.3 — Upload do PDF

Botão **Anexar Contrato** → selecione PDF.

> ⚠️ **Atenção**: contratos são documentos públicos. Se houver dados sensíveis (CPF, chaves PIX), **borre** antes de fazer upload (ferramentas gratuitas: PDF-Redact, LibreOffice).

---

## 9.6 — Licitações

URL: `/admin/licitacoes`.

### 9.6.1 — Cadastro

| Campo | Observações |
|---|---|
| **Número** * | |
| **Objeto** * | |
| **Modalidade** * | Pregão Eletrônico / Concorrência / Tomada de Preços / Convite / Dispensa / Inexigibilidade |
| **Tipo** | Menor Preço / Melhor Técnica / Técnica e Preço |
| **Data de Abertura** * | |
| **Valor Estimado** | |
| **Status** | EM_ANDAMENTO / HOMOLOGADA / DESERTA / FRACASSADA / ANULADA / REVOGADA |

### 9.6.2 — Documentos da licitação

- **Edital** (PDF ou URL externa)
- **Ata** (PDF ou URL)
- **Resultado** (quando homologada)

---

## 9.7 — Folha de Pagamento

URL: `/admin/folha-pagamento`.

### 9.7.1 — Cadastro mensal

Boa prática: uma **folha por mês** (competência).

1. Botão **+ Nova Folha**
2. Preencha:
   - **Mês/Ano** (competência) — ex: 2026/04
   - **Tipo** (Ordinária, 13º, Férias, Complementar)
3. Sistema gera entrada "Folha 2026/04"

### 9.7.2 — Adicionar servidores

Dentro da folha:
- Botão **+ Adicionar Servidor** individual
- OU **Importar planilha** (recomendado para folhas com muitos servidores)

Campos por servidor:
- Nome, Matrícula, Cargo
- **Vencimento Base**
- **Gratificações** (lista de tipos e valores)
- **Deduções** (INSS, IR, Previdência, outros)
- **Valor Líquido** (calculado automaticamente)

### 9.7.3 — Totalizadores

Sistema calcula automaticamente:
- Total Bruto
- Total Deduções
- Total Líquido
- Quantidade de servidores

### 9.7.4 — Status

| Status | Significado |
|---|---|
| PENDENTE | Em processamento |
| PROCESSADA | Fechada (disponível no portal) |
| CANCELADA | Anulada |

> ⚠️ **Atenção**: após PROCESSADA, a folha fica visível publicamente. Confira todos os valores antes de marcar como processada.

### 9.7.5 — PDF oficial

Gere **PDF consolidado** da folha (botão **Gerar PDF**). Assine digitalmente se exigido pelo Tribunal de Contas.

---

## 9.8 — Diárias

URL: `/admin/diarias`.

Cadastro de diárias pagas a servidores e parlamentares em viagens oficiais.

| Campo | Observações |
|---|---|
| **Beneficiário** * | Servidor ou parlamentar |
| **Período** * | Data início / fim |
| **Destino** * | Cidade/estado |
| **Motivo** * | Justificativa da viagem |
| **Valor Diário** * | |
| **Número de Diárias** * | |
| **Valor Total** | Calculado |
| **Empenho** | Vincular ao empenho da despesa |
| **Comprovantes** | Upload de bilhetes, notas |

---

## 9.9 — Verbas Indenizatórias

URL: `/admin/verbas-indenizatorias`.

Verbas recebidas por parlamentares (combustível, material de escritório, telefone, etc.).

Campos similares a diárias + **Tipo de verba** (combustível, material, comunicação, etc.) + comprovantes obrigatórios.

---

## 9.10 — Servidores

URL: `/admin/servidores`.

Cadastro de servidores (funcionários da câmara).

| Campo | Observações |
|---|---|
| **Nome** * | |
| **Matrícula** * | |
| **Cargo** * | |
| **Função** | Se diferente do cargo |
| **Vínculo** | Efetivo, Comissionado, Terceirizado, Estagiário |
| **Situação** | Ativo, Aposentado, Afastado, Exonerado |
| **Data de Admissão** | |
| **Vencimento Base** | |

Exibido no portal (sem CPF, endereço ou dados sensíveis).

---

## 9.11 — Concursos

URL: `/admin/concursos`.

| Campo | Observações |
|---|---|
| **Número do Edital** * | |
| **Ano** * | |
| **Cargos ofertados** | Lista |
| **Número de vagas** | |
| **Banca** | Organização responsável |
| **Data da prova** | |
| **Status** | EM_PREPARACAO / ABERTO / EM_AVALIACAO / HOMOLOGADO / CANCELADO |
| **Edital** | PDF ou URL |

---

## 9.12 — Gestão Fiscal (LRF — RGF e RREO)

URL: `/admin/gestao-fiscal`.

### 9.12.1 — RGF (Relatório de Gestão Fiscal)

Periodicidade: quadrimestral (4 meses).

Upload de:
- PDF do relatório
- Anexos (demonstrativos de gastos com pessoal, dívida, etc.)
- Data de apuração
- Competência (ex: "1º quadrimestre/2026")

### 9.12.2 — RREO (Relatório Resumido da Execução Orçamentária)

Periodicidade: bimestral.

Mesma estrutura do RGF.

### 9.12.3 — Dashboard

Dashboard com:
- Total de receitas previstas vs arrecadadas (%)
- Total de despesas autorizadas vs empenhadas vs pagas
- Saldo
- Alertas de LRF (limite prudencial de pessoal, etc.)

---

## 9.13 — Documentos Oficiais

URL: `/admin/transparencia` (seção de documentos).

### 9.13.1 — Tipos

Portaria, Decreto, Lei, Resolução, Ato da Mesa, Relatório, Informativo.

### 9.13.2 — Cadastrar

1. Botão **+ Novo Documento**
2. Preencha:
   - **Tipo** *
   - **Número** (opcional — nem todo documento tem número)
   - **Ano** *
   - **Ementa** * — descrição do conteúdo
   - **Data de publicação** *
   - **PDF** (upload) **OU** **Link externo**
   - **Status** (Publicado / Rascunho)
3. **Publicar**

Título gerado automaticamente: "Portaria nº 015/2026".

### 9.13.3 — Categorização

Associe o documento a **uma ou mais categorias** do portal público (ex: "Documentos Administrativos", "Atos Oficiais", "Transparência Ativa").

---

## 9.14 — Outros módulos

### Notas Fiscais (`/admin/transparencia/notas-fiscais`)
Cadastro: número, data, emitente, valor, contrato vinculado, PDF da NF.

### Ordem de Pagamentos (`/admin/transparencia/ordem-pagamentos`)
Ordens emitidas. Valor, credor, data, bancos, número OP.

### Repasses (`/admin/transparencia/repasses`)
Repasses financeiros recebidos do Executivo ou concedidos.

### Cartões Corporativos (`/admin/transparencia/cartoes-corporativos`)
Gastos com cartão corporativo. Cada transação: estabelecimento, valor, data, comprovante.

### Programas e Ações (`/admin/transparencia/programas-acoes`)
Programas do PPA em execução.

### Fornecedores Sancionados (`/admin/transparencia/fornecedores-sancionados`)
Fornecedores impedidos de contratar (cruzamento com CEIS/CNEP).

### Obras (`/admin/transparencia/obras`)
Obras em andamento. Nome, local, valor, percentual concluído, fotos.

### Veículos (`/admin/transparencia/veiculos`)
Frota da câmara. Placa, modelo, ano, condutor, controle de quilometragem.

### Bens Patrimoniais (`/admin/bens-patrimoniais`)
Imóveis e móveis. Número patrimonial, descrição, valor, localização, estado de conservação.

### Serviços Online (`/admin/transparencia/servicos-online`)
Serviços digitais oferecidos (pedidos LAI, ouvidoria, participação, etc.).

### Organograma (`/admin/organograma`)
Estrutura organizacional. Unidades, cargos, hierarquia.

---

## 9.15 — Conformidade PNTP

URL: `/admin/transparencia/conformidade`.

Dashboard que mede nível de conformidade com PNTP.

### 9.15.1 — Níveis

| Nível | Pontuação | Cor |
|---|---|---|
| **Diamante** | 90-100% | 💎 |
| **Ouro** | 75-89% | 🥇 |
| **Prata** | 50-74% | 🥈 |
| **Bronze** | < 50% | 🥉 |

### 9.15.2 — Categorias avaliadas

- **Institucional**: contato, endereço, regimento, lei orgânica
- **Legislativo**: pautas, atas, votações, proposições
- **Financeiro**: receitas, despesas, contratos, folha
- **Pessoal**: servidores, concursos, salários
- **Dados Abertos**: API pública, formatos CSV/JSON

### 9.15.3 — Como melhorar

Dashboard mostra **itens não conformes** com recomendações específicas (ex: "Folha de pagamento de 03/2026 não publicada").

Botão **Atualizar** recalcula após você corrigir.

---

## 9.16 — Boas práticas

1. **Cadastre em **dia** ou **semanal**.** Atrasos de meses viram multa em auditoria.
2. **Use templates de importação.** Reduz erros.
3. **Revise folha antes de PROCESSAR.** Erros em folha publicada geram cálculos errados no dashboard LRF.
4. **Anexe PDFs sempre.** Só texto não basta — Tribunal de Contas pede documento.
5. **Borre dados sensíveis.** CPF, RG, endereço de pessoa física não podem vazar.
6. **Monitore Conformidade semanalmente.** 5 min podem evitar alerta público embaraçoso.
7. **Categorias e links do portal** — revise trimestralmente. Links quebrados prejudicam cidadão.

---

## 9.17 — FAQ

**P: Qual prazo para publicar uma despesa?**
R: PNTP exige **30 dias** para dados financeiros (RN-120). Ideal: diariamente ou semanalmente.

**P: Posso editar uma folha de pagamento já PROCESSADA?**
R: Tecnicamente sim (Editor com permissão), mas gera alertas na auditoria. Prefira cadastrar **folha complementar** corrigindo a diferença.

**P: Documento sem número (ex: ato informal) — como cadastrar?**
R: Deixe campo **Número** vazio. Sistema aceita. Título vira "Ato de DD/MM/AAAA".

**P: Como exportar dados de despesas para o Tribunal de Contas?**
R: Em **Dados Abertos** (menu público), há endpoint `/api/dados-abertos/despesas` que retorna CSV/JSON. Passe o link para a equipe do TC.

**P: Sistema antigo tem dados que não migrei. Como manter acesso?**
R: Use **Períodos** (ver §9.2.2). Cadastre período "Até 2021" apontando URL do sistema antigo.

**P: Posso ocultar dados sensíveis de certos contratos?**
R: Sim, marque **Sigiloso** nas configurações do contrato. Ele aparece na lista pública mas com dados sensíveis mascarados. Use apenas quando amparado por LAI Art. 23.

**P: Fornecedores Sancionados — de onde tiro a lista?**
R: Baixe do CEIS (Cadastro Nacional de Empresas Inidôneas e Suspensas) ou CNEP. Cadastre manualmente ou use importação CSV.

**P: Conformidade PNTP está em Bronze. Por onde começar?**
R: Dashboard lista itens em vermelho. Ataque primeiro os **Financeiros** (despesas, folha) — geralmente 60% do peso.

---

**Próximo capítulo:** 10 — E-SIC e Ouvidoria (em produção)

**Capítulo anterior:** 08 — Publicações, Normas e Notícias (em produção)
