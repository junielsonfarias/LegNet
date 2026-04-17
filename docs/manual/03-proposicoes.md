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

### Passo 1: clicar em **+ Nova Proposição**

Abre um modal (4XL de largura, 90% de altura, com scroll interno).

### Passo 2: Identificação

![Modal nova proposição — identificação](./images/03-04-nova-identificacao.png)

| Campo | Obrigatório? | Como preencher |
|---|---|---|
| **Tipo de Proposição** * | Sim | Select — cada tipo tem badge colorido e sigla entre parênteses, ex: "Projeto de Lei (PL)" |
| **Número** * | Sim (ou automático) | Input de 3 caracteres. Se "Numeração automática" estiver ativo, fica **desabilitado** |
| **Ano** * | Sim | Input numérico. Padrão: ano atual |
| **Data de Apresentação** * | Sim | Calendário `dd/mm/aaaa`. Padrão: hoje |
| **Numeração automática sequencial** | ✅ Recomendado | Checkbox — se marcado, sistema atribui o próximo número disponível. Preview aparece em badge azul abaixo |

> 💡 **Dica**: deixe **Numeração automática** sempre marcado. Evita gaps e duplicatas. Use número manual apenas para importação de proposições históricas.

> ⚠️ **Atenção**: se o número já existir para o tipo+ano, o sistema exibe erro em vermelho no campo: "Já existe proposição PL 045/2026".

### Passo 3: Conteúdo

| Campo | Obrigatório? | Como preencher |
|---|---|---|
| **Título** * | Sim | Título descritivo. Ex: "Denomina 'Rua João Silva' o logradouro público atual" |
| **Ementa** * | Sim | Mín. 10 caracteres. Resumo oficial. Textarea 2 linhas |
| **Texto Completo** | Recomendado | Textarea 4 linhas. Cole o texto integral da proposição (artigos, incisos) |
| **URL do Documento** | Opcional | Link externo (Google Drive, etc.) se o texto for muito longo |

### Passo 4: Autoria

| Campo | Obrigatório? | Como preencher |
|---|---|---|
| **Autor Principal** * | Sim | Select com busca — parlamentares ativos |
| **Coautores** | Opcional | Botão **+ Adicionar coautor**. Aparecem como chips cinzas com X para remover |

### Passo 5: Tramitação inicial

| Campo | Obrigatório? | Como preencher |
|---|---|---|
| **Unidade Responsável** | Opcional | Select — padrão "Secretaria Legislativa". Outras opções: CLJ, Comissões |

> ℹ️ **Nota**: se deixar em branco, sistema envia automaticamente para a unidade configurada no **Fluxo de Tramitação** do tipo escolhido. Ver capítulo 13 (Administrador) para configurar fluxos.

### Passo 6: Anexos e Leis Referenciadas

**Anexos** (coluna esquerda):
- Zona de upload pontilhada. Clique ou arraste arquivos
- Formatos: PDF, DOC, DOCX
- Tamanho máx: **10 MB por arquivo**
- Lista mostra nome + tamanho + botão X para remover

**Leis Referenciadas** (coluna direita):
- Botão **+ Adicionar**. Abre sub-modal.
- Selecione a lei e o tipo de relação:

| Tipo de relação | Significado |
|---|---|
| Altera | Muda texto da lei existente |
| Revoga | Torna lei existente sem efeito |
| Inclui | Acrescenta artigo/dispositivo |
| Exclui | Remove artigo/dispositivo |
| Regulamenta | Detalha aplicação de lei superior |
| Complementa | Adiciona ao texto existente |

### Passo 7: Salvar

Clique em **Criar Proposição** (azul, rodapé).

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
