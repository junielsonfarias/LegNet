# Capítulo 02 — Protocolo de Documentos

O módulo **Protocolo** é a porta de entrada de documentos oficiais na Câmara. Tudo que chega de fora (ofícios, requerimentos, solicitações, denúncias) passa por aqui antes de virar proposição ou tramitar para outra unidade.

Neste capítulo você vai aprender a:

- Registrar um novo protocolo
- Consultar e filtrar protocolos existentes
- Tramitar um protocolo para outra unidade
- Converter um protocolo em proposição
- Arquivar protocolos

> 🔒 **Requer permissão**: `protocolo.manage` (Administrador e Secretaria Legislativa). Auxiliar Legislativo e Editor têm apenas leitura.

---

## 2.1 — Conceitos básicos

| Termo | Significado |
|---|---|
| **Protocolo** | Registro formal de entrada, saída ou trâmite interno de um documento |
| **Tipo** | Classificação: **Entrada** (vindo de fora), **Saída** (enviado pela Câmara), **Interno** (entre setores da Câmara) |
| **Remetente** | Quem enviou o documento (pode ser Pessoa Física, Pessoa Jurídica, Órgão Público, Parlamentar ou Executivo) |
| **Situação** | Estado atual: Aberto → Em Tramitação → Respondido / Arquivado (ou Devolvido/Cancelado) |
| **Prioridade** | Baixa, Normal, Alta ou Urgente — afeta a ordem de atendimento |
| **Prazo** | Data limite para resposta (opcional, mas recomendado) |
| **Código QR** | Gerado automaticamente para rastreamento físico |

### Fluxo resumido

```
[Documento chega] → [Protocolo Entrada] → [Tramitação interna]
                                                 ↓
                              ┌──────────────────┴──────────────┐
                              ↓                                 ↓
                   [Converter em Proposição]           [Responder / Arquivar]
                              ↓
                         [Tramitação legislativa]
```

---

## 2.2 — Acessar o módulo Protocolo

### Passo 1: abrir o menu Legislativo

Na sidebar esquerda, clique na categoria **Legislativo** para expandir.

### Passo 2: clicar em Protocolo

No submenu, clique em ***Protocolo***. Você cairá na lista de protocolos em `/admin/protocolo`.

![Menu Legislativo → Protocolo](./images/02-01-menu-protocolo.png)

---

## 2.3 — Tela principal — Lista de protocolos

![Tela de listagem](./images/02-02-lista-protocolos.png)

### 2.3.1 — Cards de estatísticas (topo)

No topo da tela, 4 cards mostram os totais do ano corrente:

- **Total do ano** — número total de protocolos registrados em 2026
- **Abertos** — aguardando tramitação
- **Em Tramitação** — já foram encaminhados a alguma unidade
- **Arquivados** — finalizados

Clique em qualquer card para filtrar a lista pela situação correspondente.

### 2.3.2 — Filtros

Logo abaixo dos cards, barra de filtros:

| Filtro | Opções |
|---|---|
| **Busca** (campo de texto) | Busca em assunto, remetente ou código de etiqueta. Debounce de 300 ms (começa a buscar após você parar de digitar). |
| **Tipo** | Todos, Entrada, Saída, Interno |
| **Situação** | Todos, Aberto, Em Tramitação, Respondido, Arquivado |
| **Prioridade** | Todos, Baixa, Normal, Alta, Urgente |

Botão **Limpar filtros** (cinza) reseta todos os campos.

> 💡 **Dica**: para buscar um protocolo específico por número, digite só o número (ex: `00125`) — o sistema busca no campo código de etiqueta.

### 2.3.3 — Tabela de protocolos

Colunas, da esquerda para a direita:

| Coluna | Conteúdo |
|---|---|
| **Protocolo** | Número no formato `XXXXX/YYYY` (ex: `00125/2026`) + código QR em miniatura |
| **Tipo** | Badge: Entrada (azul), Saída (verde), Interno (cinza) |
| **Remetente** | Nome de quem enviou (texto truncado se longo) |
| **Assunto** | Descrição breve do documento (texto truncado) |
| **Situação** | Badge colorida — Aberto (azul), Em Tramitação (amarelo), Respondido (verde), Arquivado (cinza), Devolvido (laranja), Cancelado (vermelho) |
| **Prioridade** | Badge — Baixa (cinza), Normal (azul), Alta (laranja), Urgente (vermelho) |
| **Prazo** | Data `dd/MM/yyyy`. Se vencida, aparece em **vermelho com ícone de alerta** ⚠ |
| **Ações** | Botão **Ver** para abrir detalhes |

Clique na linha ou no botão **Ver** para abrir a ficha completa do protocolo.

### 2.3.4 — Paginação

20 itens por página. No rodapé da tabela:

- **Anterior** / **Próxima** (setas)
- Contador: "Página 1 de 8 • 153 resultados"

---

## 2.4 — Registrar um novo protocolo

### Passo 1: clicar em **+ Novo Protocolo**

No canto superior direito da lista, botão **+ Novo Protocolo** (azul). Clique.

![Botão Novo Protocolo](./images/02-03-botao-novo.png)

Você cairá em `/admin/protocolo/novo`.

### Passo 2: preencher a Classificação

![Formulário novo protocolo — seção classificação](./images/02-04-novo-classificacao.png)

| Campo | Obrigatório? | Como preencher |
|---|---|---|
| **Tipo de Protocolo** * | Sim | Selecione Entrada (documento vindo de fora), Saída (enviado pela Câmara) ou Interno (movimento interno) |
| **Prioridade** | Não | Padrão **Normal**. Use **Alta** para casos que requerem atenção rápida, **Urgente** para emergências |
| **Documento sigiloso** | Não | Toggle — marque se o conteúdo for confidencial (reduz visibilidade na transparência) |

> ⚠️ **Atenção**: sigilo deve ser usado apenas quando a lei ampara (LAI Art. 23). Uso indevido viola o princípio da publicidade.

### Passo 3: preencher os Dados do Remetente

![Formulário novo protocolo — seção remetente](./images/02-05-novo-remetente.png)

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Tipo de Remetente** | Recomendado | Pessoa Física / Pessoa Jurídica / Órgão Público / Parlamentar / Executivo |
| **Nome / Razão Social** * | Sim | Mín. 2 caracteres. Para PF digite nome completo; para PJ, razão social conforme contrato social |
| **CPF / CNPJ** | Recomendado | Formato: `000.000.000-00` (PF) ou `00.000.000/0000-00` (PJ). Use este campo para evitar cadastros duplicados |
| **E-mail** | Recomendado | Permite notificar o remetente automaticamente quando o protocolo for respondido |
| **Telefone** | Opcional | Formato: `(00) 00000-0000` |
| **Endereço** | Opcional | Rua, número, bairro, cidade |

> 💡 **Dica**: se o remetente é um parlamentar da casa ou servidor do Executivo, preencher o **Tipo de Remetente** corretamente acelera a identificação em relatórios.

### Passo 4: preencher o Conteúdo do Documento

![Formulário novo protocolo — seção conteúdo](./images/02-06-novo-conteudo.png)

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Tipo de Documento** | Recomendado | Ofício, Requerimento, Solicitação, Denúncia, Reclamação, Sugestão, Pedido de Informação, Convite, Comunicação, Outro |
| **Número do Documento de Origem** | Opcional | Ex: `OF. 123/2026-GAB` — número fornecido pelo remetente (não é o número de protocolo interno) |
| **Assunto** * | Sim | Mín. 5 caracteres. Resumo em 1-2 linhas do que se trata |
| **Descrição / Conteúdo** | Recomendado | Texto detalhado. Use para facilitar buscas futuras |
| **Prazo para Resposta** | Recomendado | Data no formato `dd/mm/aaaa`. Não pode ser no passado |

### Passo 5: anexar o documento físico digitalizado (opcional)

Se tiver o PDF do documento original, há área de upload na parte inferior:

- Arraste o arquivo para a área pontilhada, ou
- Clique em **Selecionar arquivo** para escolher pelo explorador

Formatos aceitos: PDF, JPG, PNG, DOCX.
Tamanho máximo: **10 MB por arquivo**.

### Passo 6: salvar

Clique em **Registrar Protocolo** (azul, inferior direito).

![Botão registrar](./images/02-07-botao-registrar.png)

Se estiver tudo certo:

- Toast verde no topo: "Protocolo 00126/2026 criado com sucesso!"
- Você é redirecionado para a ficha do protocolo criado
- Um código QR é gerado automaticamente

Se houver erro (campo obrigatório vazio, e-mail inválido, etc.), o campo fica destacado em vermelho com a mensagem específica.

> 💡 **Dica**: para registrar vários protocolos em sequência, após salvar você pode voltar em *Protocolo* e clicar em **+ Novo Protocolo** novamente. A tela limpa os campos automaticamente.

---

## 2.5 — Consultar os detalhes de um protocolo

Da lista, clique em qualquer linha ou no botão **Ver** para abrir.

### 2.5.1 — Cabeçalho

![Cabeçalho da ficha](./images/02-08-ficha-cabecalho.png)

Exibe:

- Número do protocolo em destaque (`00125/2026`)
- Badge de **Situação**
- Badge de **Prioridade**
- Botões de ação no canto direito: **Tramitar**, **Arquivar**, e (se aplicável) **Converter em Proposição**

### 2.5.2 — Cards informativos

Quatro cards abaixo do cabeçalho:

- **Código QR** (clique para imprimir em etiqueta adesiva)
- **Data de Recebimento**
- **Prazo** (vermelho se vencido)
- **Total de Tramitações**

### 2.5.3 — Abas

A ficha tem 4 abas:

#### Aba **Dados**

Dados gerais do protocolo. Campos editáveis (Tipo, Situação, Prioridade, Assunto, Descrição, Prazo). Clique **Salvar** após editar.

#### Aba **Remetente**

Dados do remetente (Nome, CPF/CNPJ, Endereço, Telefone, E-mail). Editáveis.

#### Aba **Tramitações**

![Aba Tramitações — timeline](./images/02-09-ficha-tramitacoes.png)

Timeline visual com o histórico completo:

- Cada tramitação aparece como um card com:
  - Ícone + nome da ação (Encaminhado, Para Análise, Devolvido, etc.)
  - Data e hora
  - **De:** unidade de origem → **Para:** unidade de destino
  - **Despacho:** texto da observação (se houver)
  - **Servidor:** quem fez a tramitação

Itens ordenados do mais recente ao mais antigo.

#### Aba **Anexos**

Lista os arquivos anexados. Cada linha mostra:

- Ícone (PDF/imagem/documento)
- Nome do arquivo
- Tipo MIME (ex: `application/pdf`)
- Tamanho
- Botão **Baixar**

---

## 2.6 — Tramitar um protocolo

Tramitar significa **encaminhar** o protocolo para outra unidade interna (ex: da Secretaria Legislativa para a Assessoria Jurídica).

### Passo 1: abrir a ficha e clicar em **Tramitar**

Botão **Tramitar** (azul) no cabeçalho da ficha.

### Passo 2: preencher o diálogo

![Diálogo de tramitação](./images/02-10-dialogo-tramitar.png)

| Campo | Como preencher |
|---|---|
| **Unidade de Destino** | Digite o nome da unidade (ex: "Assessoria Jurídica"). Autocompletar sugere unidades cadastradas. |
| **Ação** | Selecione: Encaminhado, Para Análise, Para Providências, Para Resposta, Devolvido |
| **Despacho** | Texto livre. Ex: "Encaminho para parecer jurídico quanto à legalidade da solicitação." |

### Passo 3: confirmar

Clique em **Tramitar** (botão azul no diálogo).

Resultado:

- Toast verde: "Protocolo tramitado com sucesso"
- A aba **Tramitações** ganha uma nova entrada
- A **Situação** muda para "Em Tramitação" se estava "Aberto"

> ⚠️ **Atenção**: após tramitar, você ainda pode consultar o protocolo, mas a responsabilidade passa para a unidade destino. Tramitar para a unidade errada é comum — sempre confirme antes.

> 💡 **Dica**: quem recebe um protocolo tramitado vê uma notificação no sino 🔔 do header.

---

## 2.7 — Converter protocolo em proposição

Se o protocolo é um **projeto de lei**, **moção**, **requerimento** ou similar que vai tramitar na Câmara, você pode converter para proposição diretamente.

### Passo 1: abrir a ficha e clicar em **Converter em Proposição**

Botão verde no cabeçalho (só aparece se o tipo de protocolo for compatível, geralmente **Entrada** com tipo de documento Requerimento/Solicitação/Ofício).

### Passo 2: escolher o tipo de proposição

![Diálogo converter em proposição](./images/02-11-converter-proposicao.png)

| Campo | Como preencher |
|---|---|
| **Tipo de Proposição** * | Projeto de Lei, Projeto de Resolução, Projeto de Decreto Legislativo, Moção, Indicação, Requerimento, etc. |
| **Autor** * | Parlamentar ou ente que apresenta a proposição (autocompletar) |

### Passo 3: confirmar

Clique em **Converter**.

O sistema:

1. Cria uma nova proposição com número sequencial (ex: `PL 030/2026`)
2. Copia o **Assunto** do protocolo para o **Título** da proposição
3. Copia a **Descrição** para a **Ementa**
4. Muda a situação do protocolo para **Respondido**
5. Adiciona anotação na descrição do protocolo com o número da proposição gerada
6. Redireciona você para a ficha da nova proposição

> ⚠️ **Atenção**: a conversão é **irreversível** em termos de numeração. Se criar a proposição errada, você pode **Arquivar** a proposição em seguida, mas o número fica reservado (gap na sequência).

> ℹ️ **Nota**: nem todos os protocolos precisam virar proposição. Ofícios de comunicação, convites, denúncias simples e pedidos de informação podem ser respondidos sem virar proposição.

---

## 2.8 — Arquivar um protocolo

Use quando o protocolo foi **respondido**, **resolvido** ou não requer mais ação.

### Passo 1: clicar em **Arquivar**

Botão cinza no cabeçalho da ficha.

### Passo 2: confirmar

![Diálogo de arquivamento](./images/02-12-dialogo-arquivar.png)

Confirme clicando em **Arquivar** no diálogo.

Resultado:

- Situação muda para **Arquivado**
- O protocolo deixa de aparecer nas listas "Abertos" / "Em Tramitação"
- Ainda pode ser consultado no filtro **Arquivados**

> 💡 **Dica**: antes de arquivar, verifique se há prazo para resposta e se o remetente já foi notificado. Arquivar sem responder pode gerar reclamação.

### Desarquivar

Para reabrir um protocolo arquivado:

1. Filtre a lista por **Situação = Arquivado**
2. Abra a ficha
3. Na aba **Dados**, mude a **Situação** para **Aberto** ou **Em Tramitação**
4. Clique em **Salvar**

---

## 2.9 — Relatórios de protocolo

Em **Relatórios** (menu lateral, categoria *Visão Geral*), você pode extrair:

- **Protocolos por período** (CSV ou PDF)
- **Protocolos por tipo de remetente**
- **Protocolos vencidos** (prazo excedido sem resposta)
- **Tempo médio de resposta**

> 🔒 **Requer permissão**: `relatorio.view` (todos os perfis administrativos têm, exceto Operador).

---

## 2.10 — Boas práticas

1. **Protocole na chegada, não depois.** Documentos sem protocolo não existem oficialmente.
2. **Assunto curto e claro.** Pense no servidor que vai buscar daqui a 6 meses.
3. **Sempre preencha o remetente completo.** CPF/CNPJ + e-mail evitam duplicação e permitem notificações.
4. **Use prioridade corretamente.** "Urgente" deve ser exceção, não regra. Se tudo é urgente, nada é.
5. **Anexe o PDF original.** Nunca confie apenas na descrição textual — o original pode ser necessário em juízo.
6. **Tramite explicando o motivo.** Um despacho "Para análise" é menos útil que "Analisar quanto à legalidade do pedido de isenção (art. 150 CF)".
7. **Arquive com parcimônia.** Arquivar antes de responder é má-prática. Se não há resposta formal, pelo menos documente a justificativa.

---

## 2.11 — Perguntas frequentes deste capítulo

**P: Posso editar um protocolo depois de criado?**
R: Sim, na aba **Dados** da ficha. Porém, cada edição fica registrada na auditoria. Mudanças no assunto ou remetente são raras após criação.

**P: Posso excluir um protocolo?**
R: Não. Por integridade e auditabilidade, protocolos não são excluídos — apenas **cancelados** (mudando situação para Cancelado). A numeração fica reservada.

**P: Dois usuários podem editar a mesma ficha ao mesmo tempo?**
R: Tecnicamente sim, mas a última edição salva sobrescreve. Recomendação: se souber que um colega está no mesmo protocolo, espere ou combine quem vai editar.

**P: O remetente consegue ver o andamento do protocolo?**
R: Se o remetente tem e-mail cadastrado, ele pode acompanhar via o portal público (`/institucional/protocolo/acompanhar` — se disponível) usando número + CPF/CNPJ.

**P: Como emito a etiqueta com código QR?**
R: Na ficha → card **Código QR** → clique → escolha **Imprimir**. Cole na capa do documento físico.

**P: Qual a diferença entre Tramitar e Converter em Proposição?**
R: **Tramitar** encaminha dentro da Câmara para análise (unidade → unidade). **Converter em Proposição** transforma o protocolo em ato legislativo (PL, Moção, etc.) que vai para CLJ, comissões, plenário.

---

**Próximo capítulo:** 03 — Proposições (em produção)

**Capítulo anterior:** [01 — Primeiros Passos](./01-primeiros-passos.md)
