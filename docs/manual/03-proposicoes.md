# Capítulo 03 — Proposições

Proposições são os atos legislativos que vão a plenário: **Projetos de Lei (PL)**, **Projetos de Resolução (PR)**, **Projetos de Decreto Legislativo (PDL)**, **Moções**, **Indicações**, **Requerimentos**, **Votos de Pesar** e **Votos de Aplauso**. Este é o módulo central do sistema — é por aqui que o trabalho legislativo acontece.

Neste capítulo você vai aprender a:

- Consultar e filtrar a lista de proposições
- Cadastrar uma nova proposição
- Editar dados, acompanhar histórico e gerenciar anexos
- Tramitar entre unidades
- Apresentar e gerenciar emendas
- Acompanhar o fluxo pós-aprovação (redação final, autógrafo, sanção)

> 🔒 **Requer permissão**: `proposicao.manage` (Administrador, Secretaria, Auxiliar Legislativo, Editor). Demais perfis têm apenas leitura.

---

## 3.1 — Conceitos-chave

| Termo | Significado |
|---|---|
| **Proposição** | Documento legislativo submetido à apreciação do plenário |
| **Tipo** | Classificação: PL, PR, PDL, IND, REQ, MOC, VP, VA (configurável em *Tipos de Proposição*) |
| **Ementa** | Resumo da proposição em uma frase (equivalente ao "assunto") |
| **Autor** | Parlamentar(es) que apresentam a proposição (pode ter coautores) |
| **Tramitação** | Movimentação da proposição entre unidades (CLJ, comissões, plenário) |
| **Emenda** | Alteração proposta ao texto da proposição |
| **Parecer** | Análise emitida por comissão recomendando aprovação/rejeição |
| **Regime** | NORMAL, PRIORIDADE, URGÊNCIA, URGÊNCIA_URGENTÍSSIMA — afeta prazos |

### Fluxo legislativo resumido

```
[Apresentação] → [Secretaria recebe] → [CLJ parecer jurídico]
                                            ↓
                          [Comissões temáticas (se aplicável)]
                                            ↓
                           [Ordem do Dia — discussão e votação]
                                            ↓
                                ┌───────────┴───────────┐
                                ↓                       ↓
                          [APROVADA]              [REJEITADA]
                                ↓
                    [Redação Final → Autógrafo]
                                ↓
                           [Envio ao Executivo]
                                ↓
                    ┌───────────┴───────────┐
                    ↓                       ↓
              [SANCIONADA]              [VETADA]
                    ↓                       ↓
              [Promulgação]      [Apreciação do veto em 30d]
```

> ℹ️ **Nota**: nem toda proposição segue todo o fluxo. Moções, Indicações, Requerimentos não viram lei — vão direto para votação em plenário após publicação em pauta.

---

## 3.2 — Acessar o módulo

Sidebar → categoria ***Legislativo*** → item ***Proposições***.

Você cai em `/admin/proposicoes` com a lista completa.

![Menu Legislativo → Proposições](./images/03-01-menu-proposicoes.png)

---

## 3.3 — Lista de proposições

### 3.3.1 — Layout da tela

![Tela de listagem](./images/03-02-lista-proposicoes.png)

**Cabeçalho**:
- Título: **Proposições**
- Subtítulo: "Gerencie as proposições legislativas"
- Botão **+ Nova Proposição** (azul, canto superior direito)

**Barra de filtros**:

| Filtro | Opções |
|---|---|
| **Busca** | Campo "Buscar por título, ementa, número ou autor..." — debounce 300 ms |
| **Status** | Apresentada, Em Tramitação, Aguardando Pauta, Em Pauta, Aprovada, Rejeitada, Arquivada, Vetada, Sancionada, Promulgada |
| **Tipo** | PL, PR, PDL, IND, REQ, MOC, VP, VA (dinâmico conforme cadastro) |
| **Ano** | Lista de anos com proposições (ordenada do mais recente) |
| **Autor** | Lista alfabética de parlamentares |
| **Limpar Filtros** | Botão cinza que reseta todos |

### 3.3.2 — Cards de proposição

Cada linha é um card com:

![Card de proposição](./images/03-03-card-proposicao.png)

- **Badge de tipo + número/ano** — ex: `PL 045/2026` (cor configurada por tipo)
- **Badge de status** — cores: APRESENTADA (azul), EM_TRAMITACAO (amarelo), APROVADA (verde), REJEITADA (vermelho), ARQUIVADA (cinza), VETADA (laranja escuro), SANCIONADA (verde escuro), PROMULGADA (roxo)
- **Badge de unidade atual** (se em tramitação) — ex: "CLJ", "Comissão de Finanças"
- **Título** da proposição (truncado se longo)
- **Ementa** (máx. 2 linhas visíveis)
- **Autor** — ícone 👤 + nome
- **Data de apresentação** — ícone 📅 + `dd/MM/yyyy`

### 3.3.3 — Botões de ação por linha

No canto superior direito do card:

| Ícone | Ação | Resultado |
|---|---|---|
| 👁 (Olho) | **Visualizar** | Abre a ficha completa em `/admin/proposicoes/[slug]` |
| ✏ (Lápis) | **Editar** | Abre modal de edição |
| → (Seta direita) | **Tramitar** | Abre modal de tramitação (ver §3.6) |
| 🗑 (Lixeira) | **Excluir** | Pede confirmação |

> ⚠️ **Atenção**: **excluir** é irreversível. Use apenas para erros de cadastro em proposições que nunca tramitaram. Proposições com tramitação devem ser **arquivadas**, não excluídas.

### 3.3.4 — Paginação

50 proposições por página. Rodapé:

- Contador: "Mostrando 1–50 de 234 proposições"
- Botões: **Anterior** / números de página / **Próxima**

Se nenhum resultado corresponder aos filtros: mensagem "Nenhuma proposição encontrada" com sugestão para limpar filtros.

---

## 3.4 — Cadastrar nova proposição

O formulário de cadastro é um **modal largo** (4XL) com 6 seções em scroll interno. Cada campo é detalhado abaixo — **quando houver dúvida, use esta referência como fonte da verdade**.

### Passo 1: abrir o formulário

Na lista de proposições, clique em **+ Nova Proposição** (botão azul, canto superior direito). O modal abre sobre a tela.

Para **fechar sem salvar**: clique no X do modal, em **Cancelar** (rodapé) ou pressione `Esc`.

![Modal nova proposição — identificação](./images/03-04-nova-identificacao.png)

### Passo 2: Seção 1 — Identificação

| Campo | Label exato | Tipo | Obrig. | Placeholder / Opções | Validação |
|---|---|---|---|---|---|
| 1 | **Tipo de Proposição** | select | ✅ | "Selecione o tipo" | Mín. 1 caractere, máx. 50 |
| 2 | **Número** | text | ✅ | "001" (auto) | **Desabilitado se "Numeração automática" marcada** |
| 3 | **Ano** | number | ✅ | Padrão: ano atual | Mín. 1900 |
| 4 | **Data de Apresentação** | date | ✅ | Padrão: hoje | ISO `dd/mm/aaaa` |
| 5 | **Numeração automática sequencial** | checkbox | — | Padrão: ✅ marcado | — |
| 6 | **Identificador** (preview) | badge read-only | — | Ex: `PL 001/2026` | Atualiza automaticamente |

**Detalhes importantes:**

- O select de **Tipo** é populado com os tipos ativos cadastrados em *Configurações → Tipos de Proposição* (capítulo 13). Cada opção mostra o nome completo + badge colorido com a sigla.
- Quando **Numeração automática** está marcada (recomendado), o campo **Número** fica desabilitado e o sistema calcula o próximo número disponível para o tipo+ano escolhidos. O preview aparece como badge azul logo abaixo: `PL 001/2026`.
- Se você **desmarcar** a numeração automática e digitar um número já usado, o campo fica com borda vermelha e mensagem:

  > *"Este número já existe para este tipo no ano selecionado."*

  O erro HTTP retornado pela API é `409 Conflict`: *"Já existe uma proposição deste tipo com este número e ano"*.

> 💡 **Dica**: deixe **Numeração automática** sempre marcada. Evita gaps na sequência e duplicatas. Use número manual **apenas** para importar proposições históricas de sistemas antigos.

### Passo 3: Seção 2 — Conteúdo

| Campo | Label exato | Tipo | Obrig. | Placeholder | Validação |
|---|---|---|---|---|---|
| 1 | **Título** | text | ✅ | "Título da proposição" | Mín. **5 caracteres** |
| 2 | **Ementa** | textarea (2 linhas) | ✅ | "Resumo da proposição..." | Mín. **10 caracteres** |
| 3 | **Texto Completo** | textarea (4 linhas) | — | "Texto integral..." | Recomendado mín. 100 caracteres para projetos (contém "art." ou "artigo") |
| 4 | **URL do Documento** | url | — | "https://drive.google.com/..." | Deve ser URL válida (ou vazio) |

**Detalhes:**

- O **Título** é apresentação curta. Use linguagem clara: "Denomina 'Rua João Silva' o logradouro do Bairro Centro" — melhor que "Sobre nomes de ruas".
- A **Ementa** é o resumo oficial que aparece em atas, pautas e no portal público. Seja direto: começa com verbo imperativo ("Denomina", "Autoriza", "Dispõe").
- O **Texto Completo** é o articulado. Para PL/PR/PDL é **fortemente recomendado** preencher porque a validação RN-022 bloqueia projetos sem conteúdo articulado (texto deve ter pelo menos 100 caracteres e conter "art." ou "artigo").
- A **URL do Documento** é alternativa quando o texto é muito longo para colar. Use Google Drive, OneDrive ou o Diário Oficial. Precisa começar com `https://` e passar validação de URL (`z.string().url()`).

### Passo 4: Seção 3 — Autoria

| Campo | Label exato | Tipo | Obrig. | Observações |
|---|---|---|---|---|
| 1 | **Autor Principal** | select com busca | ✅ | Carrega parlamentares ativos |
| 2 | **Coautores** | select + chips | — | Sem limite; remove individual com X |

**Detalhes:**

- O **Autor Principal** é um select com autocomplete dos parlamentares ativos da legislatura atual. Valida `z.string().min(1, 'ID do autor é obrigatório')`.
- Ao adicionar **Coautor**, o select oculta o autor principal já escolhido (não pode ser coautor de si mesmo). Cada coautor aparece como chip cinza com o nome + botão X para remover.
- Para matérias de **iniciativa privativa do Executivo** (ver §3.4.7), o autor parlamentar é bloqueado automaticamente com mensagem RN-020.

### Passo 5: Seção 4 — Tramitação inicial (só em novo cadastro)

| Campo | Label exato | Tipo | Obrig. | Padrão |
|---|---|---|---|---|
| 1 | **Unidade Responsável** | select | — | "Secretaria Legislativa (padrão)" |
| 2 | **Regime** (se visível) | select | — | NORMAL |

**Unidade Responsável** tem estas opções:

- `__auto__` → "Secretaria Legislativa (padrão)" — **recomendado**, deixa o sistema escolher via fluxo configurado
- Demais unidades cadastradas em *Configurações → Unidades de Tramitação* (CLJ, Comissões, Plenário etc.)

**Regime de tramitação** (quando configurado como opção no form):

| Valor | Significado | Uso típico |
|---|---|---|
| **NORMAL** | Prazo padrão | Maioria dos casos |
| **PRIORIDADE** | Tramitação acelerada | Matérias do Executivo em regime de prioridade |
| **URGENCIA** | Prazo reduzido significativamente | Com aprovação de maioria para regime |
| **URGENCIA_URGENTISSIMA** | Prazo mínimo, votação imediata | Requer 2/3 dos parlamentares |

> ℹ️ **Fluxo automático (RN-038)** — ao salvar, o sistema decide onde enviar nesta ordem:
>
> 1. Se você preencheu **Unidade Responsável** → vai para ela imediatamente
> 2. Se existe **Fluxo configurado** para o tipo → segue a primeira etapa do fluxo (ver capítulo 13)
> 3. **Fallback**: envia para a Secretaria Legislativa

### Passo 6: Seção 5 — Anexos

A zona de upload é uma área tracejada abaixo do formulário.

| Item | Detalhe |
|---|---|
| **Formatos aceitos** | PDF, DOC, DOCX |
| **Tamanho máximo por arquivo** | **10 MB** |
| **Quantidade máxima** | Sem limite na UI |
| **Como adicionar** | Clique na área ou arraste arquivos |
| **Texto da área** | "Clique para anexar arquivos" + "PDF, DOC, DOCX (max. 10MB)" |
| **Lista após upload** | Badge com nome do arquivo + tamanho formatado (ex: `edital.pdf · 2,3 MB`) + botão X para remover |

> ⚠️ **Atenção**: se o arquivo tiver dados sensíveis (CPF, assinatura, chave PIX), **borre antes** de anexar. Anexos de proposição são públicos no portal.

### Passo 7: Seção 6 — Leis Referenciadas

Clique em **+ Adicionar Lei** para abrir o sub-modal.

![Sub-modal Lei Referenciada](./images/03-09-lei-referenciada.png)

| Campo do sub-modal | Obrigatório | Opções / Placeholder |
|---|---|---|
| **Lei** | ✅ | Select "Selecione uma lei" — formato `Nº/ANO - Título` |
| **Tipo de Relação** | ✅ | Select "Selecione o tipo de relação" — ver tabela abaixo |
| **Dispositivo Específico** | — | Text "Ex: Art. 15, § 2º" |
| **Justificativa** | — | Textarea (3 linhas) |

**Tipos de relação (enum):**

| Valor | Significado | Quando usar |
|---|---|---|
| **altera** | Muda texto de dispositivo existente | "Art. 2º fica com a seguinte redação..." |
| **revoga** | Retira dispositivo do ordenamento | "Revoga-se o Art. 5º da Lei 100/2020" |
| **inclui** | Acrescenta dispositivo novo | "Acrescenta §3º ao Art. 8º" |
| **exclui** | Remove item de lista existente | "Exclui o inciso III do Art. 10" |
| **regulamenta** | Detalha aplicação de lei superior | Decreto regulamentando Lei Ordinária |
| **complementa** | Adiciona ao texto existente sem alterar | Adiciona parágrafo complementar |

Leis adicionadas aparecem como chips: `Lei 150/2024 - altera (Art. 3º)` com botão X para remover. Sem limite de leis referenciadas.

### Passo 8: Salvar

Role até o rodapé e clique em **Criar Proposição** (azul, largura total em mobile).

**Se tudo válido:**

1. Toast verde: *"Proposição PL 046/2026 criada com sucesso"*
2. Modal fecha
3. Lista é atualizada
4. Auto-tramitação é iniciada (ver §3.4.Passo 5)

**Se houver erro:** o campo em falha recebe borda vermelha com mensagem específica. A lista completa de validações está em §3.4.9.

### 3.4.9 — Referência completa das validações (schema Zod)

A API `POST /api/proposicoes/route.ts` valida o payload com este schema:

```typescript
const ProposicaoSchema = z.object({
  numero: z.string().min(1, 'Número da proposição é obrigatório'),
  ano: z.number().min(1900, 'Ano deve ser válido'),
  tipo: z.string()
    .min(1, 'Tipo da proposição é obrigatório')
    .max(50, 'Código do tipo deve ter no máximo 50 caracteres'),
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  ementa: z.string().min(10, 'Ementa deve ter pelo menos 10 caracteres'),
  texto: z.string().nullish().transform(v => v ?? undefined),
  urlDocumento: z.string().url('URL deve ser válida')
    .optional().or(z.literal('')),
  status: z.enum([
    'APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA',
    'EM_DISCUSSAO', 'EM_VOTACAO', 'APROVADA', 'REJEITADA',
    'ARQUIVADA', 'VETADA', 'SANCIONADA', 'PROMULGADA'
  ]).default('APRESENTADA'),
  dataApresentacao: z.string().min(1, 'Data de apresentação é obrigatória'),
  dataVotacao: z.string().nullish().transform(v => v ?? undefined),
  resultado: z.enum(['APROVADA', 'REJEITADA', 'EMPATE'])
    .nullish().transform(v => v ?? undefined),
  sessaoId: z.string().nullish().transform(v => v ?? undefined),
  autorId: z.string().min(1, 'ID do autor é obrigatório'),
  regime: z.enum(['NORMAL', 'PRIORIDADE', 'URGENCIA', 'URGENCIA_URGENTISSIMA'])
    .nullish().transform(v => v ?? undefined),
  unidadeInicialId: z.string().nullish().transform(v => v ?? undefined)
})
```

**Além disso**, o endpoint aplica as validações regimentais RN-020, RN-022 e RN-023 via `validarProposicaoCompleta()`. Se alguma falhar, retorna HTTP 400 com mensagem detalhada (ver §3.4.10).

### 3.4.10 — Validações regimentais que podem bloquear o salvar

Se o sistema detectar violação regimental, o cadastro é **bloqueado** com HTTP 400 e mensagem específica no topo do modal:

| Regra | Situação que bloqueia | Mensagem exibida | O que fazer |
|---|---|---|---|
| **RN-020** | Tipo é PL/PLC/PDL **e** ementa/texto contém termos como "criação de cargo", "aumento salarial", "estrutura administrativa", "orçamento anual", "subsídio", "benefício tributário" | *"RN-020: Matéria de iniciativa privativa do Executivo detectada: 'criação de cargo'. Projetos sobre criação de cargos, aumento de remuneração, organização administrativa, orçamento e benefícios fiscais são de iniciativa exclusiva do Prefeito."* | Se é realmente iniciativa parlamentar → reescreva ementa/texto. Se é Executivo → pedir para Executivo protocolar |
| **RN-022 (ementa)** | Ementa com menos de 10 caracteres | *"Ementa deve ter pelo menos 10 caracteres"* | Expandir a ementa |
| **RN-022 (justificativa)** | Projeto sem justificativa mín. 50 chars | *"Justificativa obrigatória com pelo menos 50 caracteres para PROJETO_LEI"* | Adicionar justificativa |
| **RN-022 (articulado)** | Projeto sem texto articulado mín. 100 chars ou sem "art."/"artigo" | *"Texto articulado obrigatório: mín. 100 caracteres, contendo 'Art.' ou 'Artigo'"* | Preencher o campo Texto Completo |
| **RN-023** | Matéria similar (similaridade >70%) já rejeitada/vetada/arquivada no mesmo ano | *"Já existe proposição similar (PL 020/2026) REJEITADA este ano"* | Reescrever reformulando o escopo ou aglutinar como emenda |
| **Duplicata** | Mesmo tipo+número+ano já cadastrado | HTTP 409: *"Já existe uma proposição deste tipo com este número e ano"* | Marcar numeração automática ou escolher outro número |

> 💡 **Dica para driblar RN-023**: se o tema é o mesmo mas a solução é diferente, **escreva a ementa destacando a distinção**. Ex: em vez de "Dispõe sobre denominação de vias", use "Denomina a Rua João Silva — novo trecho entre Av. X e Y, não abrangido pelo PL 020/2026".

Resultado se tudo OK:
- Toast verde: "Proposição PL 046/2026 criada com sucesso"
- Modal fecha
- Lista é atualizada e nova proposição aparece no topo
- **Tramitação automática é iniciada** conforme unidade escolhida

### Validações regimentais que podem bloquear (RN-020, RN-022, RN-023)

> ⚠️ **Atenção**: o sistema tem **safeguards legais** ativos que impedem salvar se detectar violação regimental:

| Situação | Mensagem | O que fazer |
|---|---|---|
| **Matéria privativa do Executivo** (RN-020): PL contém termos como "criação de cargo", "aumento salarial", "orçamento anual" | "Proposição viola regras regimentais: RN-020: Matéria de iniciativa privativa do Executivo detectada: 'criação de cargo'..." | Se é realmente iniciativa parlamentar, reescreva a ementa/texto. Se é Executivo, pedir para o Executivo protocolar. |
| **Ementa muito curta** (RN-022) | "Ementa deve ter pelo menos 10 caracteres" | Expandir a ementa |
| **Matéria análoga no ano** (RN-023) | "Já existe proposição similar (PL 020/2026) apresentada este ano" | Reescrever ou aglutinar emenda na existente |

---

## 3.5 — Ficha completa da proposição

Da lista, clique no 👁 para abrir a ficha em `/admin/proposicoes/[slug]`.

### 3.5.1 — Cabeçalho

![Cabeçalho da ficha](./images/03-05-ficha-cabecalho.png)

- Breadcrumb: Proposições › PL 045/2026
- Título grande: **"PL 045/2026 — Denomina 'Rua João Silva'..."**
- Badge de status (lado direito)
- Botões de ação:
  - **Tramitar** (azul) — abre modal
  - **Editar** (cinza) — reabre modal de formulário
  - **Arquivar** (laranja) — muda status para ARQUIVADA
  - **Duplicar** (cinza) — cria cópia com novo número
  - **Excluir** (vermelho, apenas se sem tramitação)

### 3.5.2 — Abas

A ficha tem abas para organizar conteúdo:

#### Aba **Dados Gerais**
Mostra tipo, número, ano, autor(es), ementa, texto completo, URL do documento, anexos, leis referenciadas. Campos editáveis.

#### Aba **Histórico de Tramitação** (timeline)

![Timeline de tramitação](./images/03-06-timeline-tramitacao.png)

Cada tramitação aparece como card vertical com:
- Data/hora de entrada
- Unidade/órgão responsável (ex: "Comissão de Legislação e Justiça")
- Tipo de tramitação (ex: "Análise Jurídica")
- Status: RECEBIDA / EM_ANDAMENTO / CONCLUÍDA / CANCELADA
- Resultado (se concluída): APROVADO / REJEITADO / APROVADO_COM_EMENDAS / ARQUIVADO
- Observações e parecer (texto livre)
- Quem executou a ação

#### Aba **Pareceres**
Lista pareceres emitidos por comissões (ver capítulo 4).

#### Aba **Emendas** (ver §3.7)
Botão **+ Emenda** que leva para `/admin/proposicoes/[id]/emendas`.

---

## 3.6 — Tramitar uma proposição

### Quando tramitar?

- CLJ terminou análise jurídica → tramitar para Comissão temática
- Comissão aprovou com parecer → tramitar para Secretaria (incluir em pauta)
- Secretaria recebe parecer → tramitar para plenário
- Plenário aprovou → tramitar para Executivo (sanção)

### Passo 1: abrir o modal

Na ficha, botão **Tramitar** (ou na lista, ícone →).

![Modal de tramitação](./images/03-07-modal-tramitar.png)

### 3.6.1 — Layout do modal

O modal tem 2 colunas:

**Coluna esquerda — Status Atual**:
- Box cinza mostrando:
  - Ícone 🕐 + unidade atual (ex: "CLJ")
  - Ícone 📅 + prazo de vencimento
  - Badge do tipo de tramitação atual
- **Ações da etapa atual** (botões conforme status):
  - **Avançar** — habilitado se status é EM_ANDAMENTO; move para próxima etapa do fluxo
  - **Finalizar** — conclui a tramitação atual; requer selecionar resultado
  - **Reabrir** — habilitado se status é CONCLUÍDA
  - **Enviar para Pauta** — sempre habilitado (se aprovado em comissão)
- Campos:
  - **Comentário** (textarea) — observação da ação
  - **Resultado** (select) — APROVADO, REJEITADO, APROVADO_COM_EMENDAS, ARQUIVADO
- **Notificações** — lista de notificações enviadas automaticamente

**Coluna direita — Nova Tramitação Manual**:
- **Tipo de Tramitação** (select obrigatório)
- **Unidade de Destino** (select — "Automática" ou unidade específica)
- **Observações** (textarea)
- Botão **Salvar Tramitação** (verde)

### Passo 2: escolher a ação

#### Para ações do fluxo padrão

Use a coluna esquerda. Selecione o botão correspondente ao que vai fazer:

- **Finalizar com resultado APROVADO**: a tramitação atual vira CONCLUÍDA e a próxima etapa é iniciada automaticamente
- **Finalizar com REJEITADO**: proposição vai para status REJEITADA
- **Reabrir**: volta tramitação concluída para EM_ANDAMENTO

#### Para enviar manualmente para unidade específica

Use a coluna direita:
1. Selecione **Tipo de Tramitação** (ex: "Análise Técnica")
2. Selecione **Unidade de Destino** (ex: "Comissão de Finanças")
3. Escreva observação explicando o motivo
4. Clique **Salvar Tramitação**

### Passo 3: confirmar

Resultado:
- Toast verde: "Tramitação registrada"
- Timeline da aba **Histórico** ganha nova entrada
- Unidade responsável muda
- Notificação é enviada ao parlamentar responsável da unidade destino (se configurado)

> 💡 **Dica**: sempre preencha o **Comentário/Observações**. Despachos em branco dificultam o entendimento de quem recebe a próxima etapa.

---

## 3.7 — Emendas

Emendas são propostas de alteração ao texto da proposição, apresentadas por qualquer parlamentar durante o período aberto para isso.

### 3.7.1 — Acessar emendas

Da ficha da proposição → aba **Emendas**, ou clique no link **+ Emenda** (redireciona para `/admin/proposicoes/[id]/emendas`).

![Tela de emendas](./images/03-08-lista-emendas.png)

### 3.7.2 — Lista de emendas

Tabela com:

| Coluna | Conteúdo |
|---|---|
| **Número** | Ex: `E-01/2026` |
| **Tipo** | Aditiva, Modificativa, Supressiva, Substitutiva, de Redação, Aglutinativa |
| **Autor** | Parlamentar proponente |
| **Status** | Apresentada (azul), Em Análise (amarelo), Parecer Emitido (ciano), Em Votação (âmbar), Aprovada (verde), Rejeitada (vermelho), Prejudicada (cinza), Retirada (laranja), Incorporada (roxo) |
| **Data** | Apresentação |
| **Ações** | 👁 Ver, ✏ Editar, 🗑 Excluir |

**Filtros**: por tipo e por status.

### 3.7.3 — Cadastrar emenda

Botão **+ Nova Emenda** → abre modal.

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Tipo** * | Sim | Aditiva (acrescenta), Modificativa (altera), Supressiva (retira), Substitutiva (substitui todo artigo), de Redação (ajusta forma), Aglutinativa (combina várias) |
| **Autor** * | Sim | Select de parlamentares |
| **Texto Original** | Recomendado | Texto atual do dispositivo que será modificado |
| **Texto Novo** * | Sim | Proposta de redação |
| **Justificativa** * | Sim | Porque a emenda deve ser aprovada |
| **Localização do Dispositivo** | Recomendado | Artigo, Parágrafo, Inciso, Alínea |

Clique **Salvar Emenda**. Status inicial: APRESENTADA.

### 3.7.4 — Aglutinar emendas

Quando várias emendas tocam o mesmo ponto, podem ser **aglutinadas** em uma emenda única:

1. Na lista de emendas, marque os checkboxes das emendas a combinar
2. Clique **Aglutinar selecionadas** (botão acima da tabela)
3. No modal, escreva o **texto aglutinado** (texto combinado final) e **justificativa**
4. Informe o **autor** da emenda aglutinadora
5. Salvar

Resultado:
- Nova emenda criada com tipo **Aglutinativa**
- Emendas originais ficam com status **Incorporada**

---

## 3.8 — Fluxo pós-aprovação

Quando uma proposição é aprovada em plenário (status APROVADA), há passos adicionais:

### 3.8.1 — Redação Final

Após aprovação, pode haver ajustes finais de redação (correções ortográficas, consolidação de emendas aprovadas).

1. Na ficha da proposição aprovada, clique em **Redação Final**
2. Edite o texto final consolidado (texto + emendas incorporadas)
3. Clique **Salvar Redação Final**

### 3.8.2 — Autógrafo

Autógrafo é o documento oficial assinado pelo Presidente da Câmara, enviado ao Executivo.

1. Na ficha, clique em **Gerar Autógrafo**
2. Sistema gera PDF com formatação oficial (cabeçalho da câmara, texto, assinaturas)
3. Baixar PDF, imprimir, colher assinatura física OU usar assinatura digital se configurada
4. Enviar ao Executivo (presencial ou por ofício)

### 3.8.3 — Envio ao Executivo (RN-080)

Após gerar autógrafo:
1. Clique **Registrar Envio ao Executivo**
2. Informe **data de envio** e **número do ofício**
3. A partir daqui, começa a contagem dos **15 dias úteis** para sanção (RN-081)

> ℹ️ **Nota**: o sistema tem **cron diário** que automaticamente aplica **sanção tácita** se passarem 15 dias úteis sem resposta do Executivo (RN-081). Ver memória do projeto — a primeira execução em produção sancionou REQUERIMENTO 1/2025 automaticamente.

### 3.8.4 — Sanção ou Veto

Quando o Executivo responde:

**Sanção**:
1. Ficha → **Registrar Sanção**
2. Informe número da lei sancionada, data, link do DOM
3. Status muda para SANCIONADA → depois PROMULGADA após publicação

**Veto** (total ou parcial):
1. Ficha → **Registrar Veto**
2. Informe tipo (TOTAL ou PARCIAL), dispositivos vetados (se parcial), motivos
3. Status muda para VETADA
4. A partir daqui, **30 dias** para apreciação do veto pela Câmara (RN-084)
5. Sistema envia **alertas automáticos** aos administradores 7 dias antes do prazo

### 3.8.5 — Conversão em norma jurídica

Após sanção + promulgação, a proposição aprovada vira oficialmente uma norma (Lei, Decreto, Resolução).

1. Ficha → **Converter em Norma**
2. Informe número da norma (ex: "Lei Ordinária nº 123/2026")
3. Sistema cria entrada automática no módulo **Normas Jurídicas** (capítulo 8)
4. Proposição fica vinculada à norma criada

---

## 3.9 — Boas práticas

1. **Ementa clara e específica.** Evite ementas genéricas como "Dispõe sobre questões urbanas". Prefira "Denomina 'Rua João Silva' o logradouro X no bairro Y".
2. **Texto completo sempre.** Mesmo que haja URL externa, cole o texto no campo — facilita buscas e backups.
3. **Anexos em PDF.** Imagens (JPG/PNG) perdem qualidade. Se tem assinatura, use PDF.
4. **Numeração automática.** Confie no sistema. Números manuais geram conflitos.
5. **Coautoria real.** Inclua coautores apenas se concordaram formalmente.
6. **Justifique tramitações manuais.** Despachos "Encaminho" ou "Para análise" são vagos. Escreva o motivo.
7. **Use emendas parcimoniosamente.** Muitas emendas podem ser sinal de que a proposição precisa ser reescrita antes de votar.
8. **Não exclua — arquive.** Salvo erro flagrante de cadastro, sempre use **Arquivar** para preservar histórico.

---

## 3.10 — Perguntas frequentes deste capítulo

**P: Posso editar a ementa de uma proposição que já está em pauta?**
R: Tecnicamente sim, mas **não deveria**. Uma vez publicada em pauta, a ementa foi divulgada aos parlamentares. Edições geram risco de questionamento. Se precisar corrigir erro, registre no histórico com justificativa.

**P: Um parlamentar pediu para retirar a proposição. Como fazer?**
R: Existe ação específica **Retirar** no botão de ações. Status muda para RETIRADA. Proposição não pode mais tramitar, mas fica registrada para histórico.

**P: O que acontece se eu arquivar uma proposição em tramitação?**
R: Status vira ARQUIVADA, tramitações em andamento são canceladas. Um Administrador pode desarquivar (voltar para EM_TRAMITACAO), mas é preciso avaliar implicações regimentais antes.

**P: Como vincular a proposição a um protocolo recebido?**
R: No protocolo → **Converter em Proposição** (ver capítulo 2, §2.7). Dados são copiados automaticamente.

**P: Dois parlamentares apresentaram proposições idênticas. Como aglutinar?**
R: Não há aglutinação de proposições distintas — só de emendas. Uma das duas deve ser **Arquivada** e seu autor indicado como coautor da que permanecerá.

**P: É possível cadastrar proposição retroativa (anos anteriores)?**
R: Sim. Para importação de proposições históricas, **desmarque** a numeração automática e informe número + ano manualmente. Use data de apresentação original.

**P: Autor de proposição não consta na lista. O que fazer?**
R: Parlamentar precisa estar cadastrado no módulo **Parlamentares** com status ativo e mandato vigente. Se é ex-vereador, use o parlamentar ativo correspondente (ex: Presidente da época).

**P: Como saber se o fluxo de tramitação está configurado para um tipo?**
R: Configurações → Fluxos de Tramitação → ver se há fluxo associado ao tipo. Se não, o sistema usa o fluxo padrão (Secretaria Legislativa → CLJ → Comissões → Plenário).

---

**Próximo capítulo:** 04 — Pareceres de Comissão (em produção)

**Capítulo anterior:** [02 — Protocolo de Documentos](./02-protocolo.md)
