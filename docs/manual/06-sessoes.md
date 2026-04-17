# Capítulo 06 — Sessões Legislativas

As sessões são os eventos em que os parlamentares se reúnem para deliberar. O sistema gerencia todo o ciclo: agendamento, montagem da pauta, registro de presenças, condução em tempo real (ver capítulo 07) e publicação da ata.

Neste capítulo você vai aprender a:

- Consultar o calendário e a lista de sessões
- Criar uma sessão (modo rápido e modo completo com pauta)
- Montar a pauta (adicionar/reordenar itens, aplicar templates)
- Registrar presenças
- Configurar mesa diretora e oradores
- Gerar ata e registrar links de transmissão

> 🔒 **Requer permissão**: `sessao.manage` (Administrador, Secretaria, Editor, Operador). Auxiliar Legislativo tem leitura.

---

## 6.1 — Conceitos-chave

| Termo | Significado |
|---|---|
| **Sessão** | Reunião plenária oficial dos parlamentares |
| **Tipo** | Ordinária (agenda regular), Extraordinária (fora de agenda), Solene (cerimonial), Especial (temas específicos) |
| **Status** | Agendada → Em Andamento → Suspensa → Concluída (ou Cancelada) |
| **Pauta** | Lista de itens a serem apreciados na sessão |
| **Item de pauta** | Um objeto da pauta: proposição, leitura, comunicado, homenagem |
| **Seção da pauta** | Agrupamento lógico: Expediente, Ordem do Dia, Comunicações, Honras, Outros |
| **Mesa Diretora** | Presidente, Vice-Presidente, 1º e 2º Secretários que conduzem a sessão |
| **Ata** | Documento oficial resumindo o que aconteceu na sessão |
| **Template de sessão** | Modelo de pauta reutilizável para sessões recorrentes |

### Fluxo de uma sessão

```
[Agendar] → [Montar pauta] → [Publicar pauta 48h antes (RN-120)]
                                      ↓
                          [Dia da sessão — abrir presenças]
                                      ↓
                          [Iniciar sessão no Painel Operador]
                                      ↓
                          [Conduzir itens em tempo real]
                                      ↓
                          [Concluir sessão → gerar ata]
                                      ↓
                   [Ata apreciada em próxima sessão — LEITURA_ATA]
                                      ↓
                          [Ata aprovada → publicação final]
```

---

## 6.2 — Acessar o módulo

Sidebar → categoria ***Legislativo*** → item ***Sessões***.

Caia em `/admin/sessoes` com a lista.

---

## 6.3 — Lista de sessões

![Lista de sessões](./images/06-01-lista-sessoes.png)

### 6.3.1 — Cards de estatísticas (topo)

4 cards:

- **Total** — sessões registradas em 2026
- **Concluídas** — realizadas com sucesso
- **Agendadas** — ainda não ocorreram
- **Total de Proposições** — soma de itens em todas as pautas

### 6.3.2 — Filtros

- Campo **Buscar sessões...** — pesquisa por tipo, status, descrição ou número
- Não há dropdowns; a busca textual cobre tudo

### 6.3.3 — Visualização de cards

Cada sessão exibe:

- Número e tipo: "5ª Sessão Ordinária"
- Badge de tipo — Ordinária (azul), Extraordinária (laranja), Solene (verde), Especial (roxo)
- Badge de status — Agendada (azul), Em Andamento (amarelo), Concluída (verde), Cancelada (vermelho)
- Data `dd/MM/yyyy` e horário `HH:mm`
- Local
- Descrição (se preenchida)

### 6.3.4 — Botões de ação

**No topo da tela**:
- **Rápido** (outline) — formulário inline para criar sessão mínima, sem pauta
- **Nova Sessão com Pauta** (primário, azul) — wizard completo em `/admin/sessoes/nova`

**Em cada card**:
- 👁 **Ver** — abre ficha detalhada
- ✏ **Editar** — edita campos básicos
- 🗑 **Excluir** — apaga (com confirmação)

> ⚠️ **Atenção**: excluir remove presenças, votos registrados e pauta. Faça apenas se a sessão foi criada por erro. Sessões realizadas devem ficar registradas historicamente.

---

## 6.4 — Criar sessão — modo Rápido

Use quando quiser agendar rapidamente e montar pauta depois.

### Passo 1: clicar em **Rápido**

Botão outline no topo da lista. Um formulário expande logo abaixo da lista.

![Formulário rápido](./images/06-02-sessao-rapido.png)

### Passo 2: preencher

| Campo | Obrigatório? | Observação |
|---|---|---|
| **Número da Sessão** * | Sim | Número manual (não é automático) |
| **Tipo de Sessão** * | Sim | Ordinária, Extraordinária, Especial, Solene |
| **Data e Hora** * | Sim | `dd/mm/aaaa HH:mm` |
| **Local da Sessão** | Recomendado | Ex: "Plenário da Câmara Municipal" |
| **Status** | Padrão Agendada | Raramente muda manualmente aqui |
| **Descrição da Sessão** | Opcional | Observações gerais |

### Passo 3: salvar

Botão **Salvar**. Aparece na lista. Depois edite para montar a pauta.

---

## 6.5 — Criar sessão — modo Completo (com pauta)

Use quando quiser agendar e montar pauta no mesmo fluxo.

### Passo 1: clicar em **Nova Sessão com Pauta**

Abre o wizard em `/admin/sessoes/nova`.

![Wizard nova sessão — passo 1](./images/06-03-wizard-novasessao-1.png)

### Passo 2: dados da sessão

Mesmos campos do modo Rápido + campo para selecionar **Template de Sessão** (opcional).

### Passo 3: aplicar template (opcional)

Se escolher um template, os itens padrão do template são pré-carregados na pauta (leituras obrigatórias, ordem do dia, etc.). Economiza trabalho em sessões ordinárias.

### Passo 4: montar a pauta

Entra no editor de pauta. Ver §6.7 adiante.

### Passo 5: finalizar

Botão **Finalizar criação** → sessão é criada e você é redirecionado para a ficha completa em `/admin/sessoes/[id]`.

---

## 6.6 — Ficha da sessão

Da lista, botão 👁 **Ver** abre `/admin/sessoes/[id]`.

![Ficha da sessão](./images/06-04-ficha-sessao.png)

### 6.6.1 — Cabeçalho

- Título grande: "5ª Sessão Ordinária" + data
- Badges: tipo, status
- Cards de estatística:
  - **Presença**: `18/21 (86%)`
  - **Itens na Pauta**: `12 total (3 pendentes)`
  - **Aprovados**: `7 (2 rejeitados)`
  - **Duração**: `2h 15min real / 3h estimado`

### 6.6.2 — Painel lateral direito — Ações Rápidas

Botões contextuais conforme status:

| Status | Botões disponíveis |
|---|---|
| AGENDADA | **Iniciar Sessão** (verde), **Editar**, **Histórico** |
| EM_ANDAMENTO | **Acessar Painel** (amarelo), **Editar**, **Histórico** |
| CONCLUÍDA | **Lançar Votações** (âmbar), **Editar**, **Histórico** |
| (qualquer) | **Painel do Operador**, **Painel Público**, **Painel TV** |

> 💡 **Dica**: **Painel TV** é para projetor na sala. **Painel Público** é para cidadão no site. **Painel Operador** é onde o operador conduz a sessão.

### 6.6.3 — Abas (7 principais)

#### Aba **Pauta**
Lista itens agrupados por seção.

- Botão **Editar Pauta** — abre editor (ver §6.7)
- Botão **Publicar Pauta** (verde, quando rascunho) — muda status de **RASCUNHO** para **APROVADA**; divulga publicamente
- Botão **Voltar p/ Rascunho** (amarelo, quando publicada) — reverte publicação
- Cada item mostra: número, título, proposição (se houver), status, tempo estimado

> ⚠️ **Atenção**: publique a pauta com **mínimo 48h de antecedência** (RN-120 do PNTP). Pautas publicadas em cima da hora podem gerar questionamentos.

#### Aba **Presença**
Registro de quem compareceu (ver §6.8).

#### Aba **Mesa**
Cargos da mesa diretora na sessão (ver §6.9).

#### Aba **Oradores**
Lista de oradores inscritos (ver §6.10).

#### Aba **Expediente**
Itens de expediente da sessão — leituras obrigatórias, ofícios recebidos, comunicados.

#### Aba **Pres. OD** (Presença Ordem do Dia)
Presenças específicas para votações da ordem do dia (pode diferir da presença geral — parlamentar chegou atrasado, por exemplo).

#### Aba **Info**
- Descrição da sessão
- Botões **Gerar Ata** / **Regerar Ata** — sistema gera ata automaticamente baseada nos eventos
- Botão **Visualizar Ata** — preview HTML
- Botão **Imprimir** — dialog de impressão
- Campo **URL do Arquivo da Ata** — link externo se ata PDF for hospedada em outro lugar
- Seção **Links de Transmissão**:
  - URL transmissão ao vivo (YouTube, etc.)
  - URL vídeo gravado
  - URL áudio

---

## 6.7 — Montar a pauta

Aba **Pauta** → botão **Editar Pauta**.

![Editor de pauta](./images/06-05-editor-pauta.png)

### 6.7.1 — Adicionar item

Botão **+ Adicionar Item**. Abre diálogo.

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Seção** * | Sim | EXPEDIENTE, ORDEM_DO_DIA, COMUNICAÇÕES, HONRAS, OUTROS |
| **Título** * | Sim | Descrição breve |
| **Descrição** | Opcional | Contexto adicional |
| **Tempo Estimado** | Recomendado | Minutos |
| **Tipo de Ação** * | Sim | Ver tabela abaixo |
| **Tipo de Votação** | Se ação inclui votação | NOMINAL, SIMBÓLICA, SECRETA |
| **Proposição** | Se item é baseado em proposição | Autocomplete de proposições |

#### Tipos de ação

| Tipo | O que faz | Quando usar |
|---|---|---|
| **LEITURA** | Leitura simples | Ofícios, comunicados, atas anteriores |
| **LEITURA_OFÍCIO** | Leitura de ofício específico | Quando há ofício anexo |
| **LEITURA_ATA** | Leitura da ata de sessão anterior para aprovação | Primeira sessão após a sessão original |
| **LEITURA_VOTAÇÃO** | Leitura seguida de votação | Item que vai a votação sem discussão |
| **VOTAÇÃO** | Apenas votação (sem leitura) | Item cuja leitura foi em sessão anterior |
| **DISCUSSÃO** | Discussão sem votação | Segundo turno em intervalo |
| **DISCUSSÃO_VOTAÇÃO** | Discussão seguida de votação | Fluxo típico de projetos |
| **COMUNICADO** | Comunicado da presidência | Avisos |
| **HOMENAGEM** | Homenagem/reconhecimento | Sessões solenes |

Clique **Salvar Item**.

### 6.7.2 — Reordenar itens

Duas opções:

1. **Drag and drop** — segure o ícone **⋮⋮** (GripVertical) à esquerda do item e arraste
2. **Setas** — botões **↑** e **↓** para mover item acima/abaixo

A ordem é importante para a sequência de condução na sessão.

### 6.7.3 — Destaques

Durante a sessão, itens recebem destaque visual conforme status:

| Status | Destaque |
|---|---|
| Pendente | Cinza padrão |
| Em Discussão | Fundo azul claro |
| Em Votação | Fundo amarelo |
| Aprovado | Fundo verde claro |
| Rejeitado | Fundo vermelho claro |
| Adiado | Fundo laranja |
| Retirado | Fundo roxo |
| Vista | Fundo índigo |

### 6.7.4 — Sugestões automáticas

Sistema procura proposições com status **EM_PAUTA** ou **AGUARDANDO_PAUTA** e sugere incluí-las na pauta atual (respeitando CLJ e comissões — RN-030/057).

Clique em **Ver sugestões** para listar. Clique em cada sugestão para adicionar com um clique (tipo de ação padrão = DISCUSSÃO_VOTAÇÃO).

### 6.7.5 — Aplicar template

Se a sessão foi criada sem template, você pode aplicar um depois:

1. No editor de pauta, botão **Aplicar Template**
2. Selecione o template (dropdown)
3. Confirme

Itens do template são adicionados à pauta atual (não substituem o que já está lá).

### 6.7.6 — Publicar pauta

Depois de revisar:

1. Volte para a aba **Pauta**
2. Clique em **Publicar Pauta** (verde)
3. Status muda de **RASCUNHO** para **APROVADA**
4. Pauta fica visível no portal público (cidadão pode consultar)

> ⚠️ **Atenção**: alterar pauta após publicação gera histórico. Publique apenas quando tiver certeza. Para adições urgentes, use **Voltar p/ Rascunho** → editar → **Publicar** novamente.

---

## 6.8 — Registrar presenças

Aba **Presença** na ficha da sessão.

> ℹ️ **Nota**: o registro só é liberado **15 minutos antes do horário agendado** da sessão. Antes disso, a aba mostra mensagem informativa.

![Tela de presenças](./images/06-06-presencas.png)

### 6.8.1 — Registro individual

Clique no card do parlamentar para alternar entre:

- ✅ **PRESENTE** (verde)
- ❌ **AUSENTE** (vermelho)
- ⚠️ **JUSTIFICADA** (amarelo) — quando é ausência justificada

### 6.8.2 — Registro em lote

Botões no topo:

- **Marcar Todos Presentes** — útil para começar e depois ajustar os ausentes
- **Marcar Todos Ausentes** — inverso

### 6.8.3 — Justificativa

Ao marcar AUSENTE, abre campo de texto para justificativa (opcional mas recomendado). Ex: "Ausência justificada por representação oficial em Brasília — ofício 015/2026".

### 6.8.4 — Seções

Há duas categorias de presença:

- **Expediente** — chegou a tempo da abertura
- **Ordem do Dia** — presente nas votações principais

Parlamentar que chegou atrasado pode estar AUSENTE no expediente mas PRESENTE na ordem do dia.

### 6.8.5 — Quorum

O sistema calcula automaticamente:

- **% de presença** (presentes / total de vereadores)
- **Quorum de instalação** — mínimo para sessão acontecer (geralmente maioria absoluta)
- **Quorum para votação** — depende do tipo de matéria (ver capítulo 07, §7.4)

> ⚠️ **Atenção**: iniciar sessão sem quorum de instalação gera **violação regimental**. O sistema tem safeguard que bloqueia abertura de votação sem quorum válido.

---

## 6.9 — Mesa diretora da sessão

Aba **Mesa**.

![Mesa da sessão](./images/06-07-mesa.png)

### Cargos

Padrão:
- **Presidente** — conduz a sessão, vota em caso de empate (voto de minerva)
- **Vice-Presidente** — substitui o presidente
- **1º Secretário** — lavra a ata, faz as chamadas
- **2º Secretário** — auxilia o 1º

Cada cargo é preenchido via autocomplete buscando parlamentares ativos.

### Por que importa

- **Voto de Minerva** (desempate) é atribuído ao **Presidente da sessão** — configurar errado leva a apuração incorreta
- **Mesa permanente vs Mesa da sessão**: a câmara tem uma mesa permanente, mas sessões específicas (principalmente solenes) podem ter mesa distinta

> 💡 **Dica**: se a mesa permanente está correta, clique em **Copiar Mesa Permanente** (botão no topo) para importar automaticamente.

---

## 6.10 — Oradores

Aba **Oradores**.

### Tipos de orador

| Tipo | Tempo padrão |
|---|---|
| Pequeno Expediente | 5 min |
| Grande Expediente | 15 min |
| Explicação Pessoal | 3 min |
| Aparte | 1 min |
| Ordem do Dia | 5 min |
| Liderança | 5 min |
| Tribuna Livre | 10 min |
| Comunicação | 3 min |

### Como inscrever

1. Botão **+ Inscrever Orador**
2. Selecione parlamentar
3. Escolha tipo de orador
4. Ajuste tempo se necessário
5. (Opcional) preencha assunto
6. Salvar

Lista mostra ordem de inscrição. Durante a sessão, o operador vai marcando **FALANDO** (inicia cronômetro) e **CONCLUÍDO** (para cronômetro).

---

## 6.11 — Gerar ata

Aba **Info** → botão **Gerar Ata** (ou **Regerar Ata** se já foi gerada).

![Preview da ata](./images/06-08-preview-ata.png)

O sistema gera ata automaticamente baseada em:

- Dados da sessão (número, tipo, data, local)
- Mesa diretora
- Presenças
- Cada item da pauta com resultado
- Oradores
- Questões de ordem
- Votações (nominal com lista de votantes)

### Revisar ata

1. Clique **Visualizar Ata** — preview HTML
2. Revise o conteúdo
3. Se precisar editar, clique em **Editar Ata** (abre textarea rich)
4. Salve

### Aprovar ata (em sessão posterior)

A ata deve ser apreciada pelos parlamentares em **sessão subsequente**. O fluxo é:

1. Na pauta da **próxima sessão**, adicione item tipo **LEITURA_ATA**
2. Selecione a sessão cuja ata será apreciada
3. Na sessão, operador abre o item → aprovação é tratada como votação simbólica
4. Resultado APROVADO → `statusAta` da sessão original muda para APROVADA

### Links de transmissão

Na aba **Info**, seção **Links de Transmissão**:

- **URL transmissão ao vivo** — link do YouTube Live ou similar, durante a sessão
- **URL vídeo gravado** — após a sessão, vídeo permanente
- **URL áudio** — arquivo de áudio para acessibilidade

> 💡 **Dica**: todos esses links aparecem no portal público. Preenchê-los é parte da transparência (PNTP Nível Diamante).

---

## 6.12 — Cancelar sessão

Se a sessão **não for realizar** (ex: falta de quorum, feriado inesperado):

1. Ficha da sessão → botão **Editar**
2. Mude **Status** para **Cancelada**
3. Em **Descrição**, justifique (ex: "Cancelada por falta de quorum — 5 presentes de 11 membros")
4. **Salvar**

A sessão fica registrada como Cancelada. Não é excluída — mantém histórico para transparência.

---

## 6.13 — Templates de sessão

Menu ***Configurações*** → ***Templates de Sessão*** (também em `/admin/templates-sessao`).

Útil para padronizar sessões ordinárias semanais.

### 6.13.1 — Criar template

Botão **+ Novo Template**.

| Campo | Como preencher |
|---|---|
| **Nome** * | Ex: "Sessão Ordinária Padrão" |
| **Descrição** | Finalidade do template |
| **Tipo de Sessão** | Ordinária / Extraordinária / Solene / Especial |
| **Duração Estimada** | Minutos totais |
| **Template ativo** | Checkbox — se desmarcado, template não aparece ao criar sessão |

Em **Itens do Template**:
- Botão **+ Adicionar item**
- Para cada item: Seção, Título, Descrição, Tempo, Tipo de Proposição Sugerida, Obrigatório?

**Salvar Template**.

### 6.13.2 — Aplicar template

Ao criar sessão nova com pauta, selecione o template no wizard. Todos os itens padrão são importados.

---

## 6.14 — Calendário legislativo

Em `/calendario` (rota pública) ou no dashboard admin.

![Calendário legislativo](./images/06-09-calendario.png)

- Visão mensal com eventos marcados
- Tipos de evento: sessões, audiências públicas, reuniões de comissão
- Clique em um evento para abrir detalhes

---

## 6.15 — Boas práticas

1. **Agende com antecedência**. Criar sessão na véspera dificulta cumprir prazos de publicação da pauta (48h — RN-120).
2. **Use templates** para sessões ordinárias. Padroniza e reduz esquecimentos.
3. **Publique a pauta em rascunho primeiro**. Valide com a mesa antes de **Publicar**.
4. **Registre presenças assim que o parlamentar entrar**. Não deixe para o fim da sessão.
5. **Preencha os links de transmissão**. Transparência conta pontos no PNTP.
6. **Gere a ata logo após concluir**. Quanto mais fresco, mais preciso o registro.
7. **Nunca delete uma sessão realizada**. Se algo está errado, **edite** ou **Cancele**.

---

## 6.16 — Perguntas frequentes deste capítulo

**P: Como numero as sessões?**
R: Números são **manuais**, por tipo e por legislatura. Ex: 1ª a 36ª ordinária por ano; 1ª a Nᵉ extraordinária conforme houver necessidade. Siga o padrão do regimento.

**P: Posso alterar a pauta durante a sessão?**
R: Sim — itens podem ser retirados de pauta ou adicionados (ponto facultativo) durante a sessão pelo operador. Mas alterações geram registro e transparência.

**P: Se esquecer de abrir presenças e começar a sessão, o que acontece?**
R: Sem registro de presença, o sistema bloqueia abertura de votações por falta de quorum verificável. Abra as presenças antes de clicar em **Abrir Votação** do primeiro item.

**P: Posso registrar uma sessão retroativa (aconteceu mas não foi lançada)?**
R: Sim, use o botão **Lançar Votações** (âmbar, aparece em sessões CONCLUÍDAS) ou acesse diretamente `/admin/sessoes/[id]/lancamento-retroativo`.

**P: Qual a diferença entre "suspender" e "concluir" uma sessão?**
R: **Suspender** é pausa temporária (intervalo, recesso); cronômetro da sessão congela, pode retomar. **Concluir** finaliza a sessão; resultados são consolidados, ata pode ser gerada.

**P: Ata gerada automaticamente é oficial?**
R: É uma **minuta**. Precisa ser revisada, formatada se necessário, e **aprovada em sessão subsequente** (item tipo LEITURA_ATA). Até lá, `statusAta` é PENDENTE.

**P: Dois operadores podem conduzir uma sessão simultaneamente?**
R: Tecnicamente sim (o painel suporta múltiplos acessos). Mas **é desaconselhável** — o último a clicar sobrescreve estados. Defina quem opera e quem acompanha.

---

**Próximo capítulo:** [07 — Painel Operador e Votações](./07-painel-operador.md)

**Capítulo anterior:** 05 — Comissões (em produção)
