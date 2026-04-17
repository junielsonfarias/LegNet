# Capítulo 07 — Painel Operador e Votações

Este é o capítulo mais importante para o perfil **Operador**. O Painel Operador é a tela utilizada durante a sessão ao vivo — você controla o andamento da pauta, abre votações, registra resultados e interage com os painéis públicos (TV e portal).

Neste capítulo você vai aprender a:

- Abrir e conduzir uma sessão em tempo real
- Iniciar, pausar, retomar e finalizar itens de pauta
- Abrir e encerrar votações (nominal, simbólica, secreta)
- Registrar votos individuais e em lote
- Operar pedido de vista, adiamento e retirada de pauta
- Usar os painéis **TV** (sala) e **Público** (site)
- Cronometrar oradores e gerenciar questões de ordem

> 🔒 **Requer permissão**: `painel.manage` (Operador e Administrador). Outros perfis podem visualizar (`painel.view`) mas não operar.

---

## 7.1 — Abrindo o painel

### 7.1.1 — Acessar

Três caminhos:

1. **Sidebar** → ***Legislativo*** → ***Painel Eletrônico*** → escolher sessão da lista
2. **Ficha da sessão** → botão **Iniciar Sessão** ou **Acessar Painel**
3. **Atalho direto** → URL: `/painel-operador/[sessaoId]`

> 💡 **Dica**: **Operadores caem direto no Painel** após login. Marque a URL da sessão atual nos favoritos para acesso rápido.

### 7.1.2 — Requisitos

Antes de abrir o painel, confirme que:

- ✅ A sessão está com status **AGENDADA** ou **EM_ANDAMENTO**
- ✅ A **pauta está publicada** (ou pelo menos em rascunho com itens)
- ✅ A **mesa diretora da sessão** está configurada (principalmente o Presidente, para voto de minerva)
- ✅ Você sabe quantos vereadores têm mandato ativo (para calcular quorum)

---

## 7.2 — Layout do Painel Operador

![Layout do painel operador](./images/07-01-layout-painel-operador.png)

### 7.2.1 — Áreas da tela

A tela é dividida em 4 áreas principais:

```
┌─ CABEÇALHO ───────────────────────────────────────────────────────┐
│ 5ª Sessão Ordinária │ 17/04/2026 17:00 │ ⚙ │ 📺 TV │ 🌐 Público │
└──────────────────────────────────────────────────────────────────┘
┌─ BARRA DE STATUS ────────────────────────────────────────────────┐
│ [Agendada ▼]  ⏱ 00:00:00  │  Item: -  │  Pauta: 12 | 0 | 0 | 12 │
└──────────────────────────────────────────────────────────────────┘
┌─ ÁREA CENTRAL (pauta) ─────────────────┐┌─ SIDEBAR (presença)───┐
│ ▼ EXPEDIENTE (3 itens)                  ││  PRESENÇA             │
│ ┌─────────────────────────────────────┐ ││   ✅ 18 presentes      │
│ │ Pendente │ LEITURA │ Leitura Ofício │ ││   ❌ 2 ausentes        │
│ │ [ Iniciar Leitura ]                  │ ││   📊 86% quorum        │
│ └─────────────────────────────────────┘ ││                       │
│ ▼ ORDEM DO DIA (9 itens)               ││  VOTAÇÃO ATIVA         │
│ ┌─────────────────────────────────────┐ ││  PL 045/2026           │
│ │ EM_DISCUSSAO │ VOTAÇÃO │ PL 045/26   │ ││  SIM: 7 │ NÃO: 2      │
│ │ [Pausar] [Abrir Votação] [Retirar] │ ││  [Abrir Painel Votos] │
│ └─────────────────────────────────────┘ ││                       │
└─────────────────────────────────────────┘└───────────────────────┘
```

### 7.2.2 — Cabeçalho

- **Título**: número + tipo da sessão, data e horário
- ⚙ **Configurações**: volta para ficha da sessão
- 📺 **Painel TV**: abre nova aba com painel da sala de sessões (TV/projetor)
- 🌐 **Painel Público**: abre nova aba com painel do site

### 7.2.3 — Barra de status

- **Dropdown de status da sessão** — como mudar status (ver §7.3)
- **Cronômetro da sessão** — tempo desde abertura (pausa se SUSPENSA)
- **Item atual** — qual item está EM_DISCUSSAO ou EM_VOTACAO
- **Cronômetro do item** — quanto tempo o item está em andamento
- **Pauta**: total | aprovados | rejeitados | pendentes

---

## 7.3 — Ciclo de status da sessão

### 7.3.1 — Iniciar sessão

Sessão está em **AGENDADA**. Confira presenças antes (quorum). Depois:

1. Clique no dropdown de status (barra de status)
2. Escolha **EM_ANDAMENTO** — ou clique no botão grande **Iniciar Sessão** (verde)
3. Cronômetro da sessão começa a contar

> ⚠️ **Atenção**: o sistema verifica **quorum de instalação** ao iniciar. Se não atingido, modal bloqueia com mensagem "Quorum insuficiente: X presentes de Y necessários".

### 7.3.2 — Suspender sessão

Para intervalo, recesso ou debate informal:

1. Dropdown de status → **SUSPENSA**
2. Cronômetro congela (não é zerado)
3. Item em andamento **não** é pausado automaticamente — pause manualmente se necessário

Use **Suspender** em vez de Concluir para que você possa retomar depois.

### 7.3.3 — Retomar sessão

Dropdown → **EM_ANDAMENTO** novamente. Cronômetro volta a contar.

### 7.3.4 — Concluir sessão

Ao final da pauta:

1. Dropdown → **CONCLUÍDA** — ou botão grande **Finalizar Sessão**
2. Sistema consolida resultados
3. Item em andamento (se houver) é automaticamente finalizado com status CONCLUIDO

> 💡 **Dica**: após concluir, você ainda pode acessar a ficha da sessão para **gerar ata**, ajustar oradores, incluir links de transmissão. Apenas não pode mais mudar status de itens.

### 7.3.5 — Cancelar sessão

Só use se a sessão **não ocorreu**. Dropdown → **CANCELADA**. Documente o motivo na descrição da sessão.

---

## 7.4 — Controlar itens de pauta

Cada item exibe **badge de status** e **badge de tipo de ação**. Os botões que aparecem **dependem do tipo de ação e do status atual**.

### 7.4.1 — Tabela de ações por tipo

| Tipo | PENDENTE → | EM_DISCUSSÃO → | EM_VOTAÇÃO → | Final |
|---|---|---|---|---|
| **LEITURA** | Iniciar Leitura | Pausar / Concluir Leitura | — | CONCLUÍDO |
| **LEITURA_OFÍCIO** | Iniciar Leitura | Pausar / Concluir Leitura | — | CONCLUÍDO |
| **LEITURA_ATA** | Iniciar Leitura | Abrir Votação (aprovação da ata) | Encerrar | APROVADO/REJEITADO |
| **LEITURA_VOTAÇÃO** | Iniciar Leitura | Pausar / Abrir Votação | Encerrar | APROVADO/REJEITADO/ADIADO |
| **VOTAÇÃO** | Iniciar Leitura | Pausar / Abrir Votação | Encerrar | APROVADO/REJEITADO/ADIADO |
| **DISCUSSÃO** | Iniciar Discussão | Pausar / Concluir | — | CONCLUÍDO |
| **DISCUSSÃO_VOTAÇÃO** | Iniciar Discussão | Pausar / Abrir Votação | Encerrar | APROVADO/REJEITADO/ADIADO |
| **COMUNICADO** | Iniciar | Pausar / Concluir | — | CONCLUÍDO |
| **HOMENAGEM** | Iniciar | Pausar / Concluir | — | CONCLUÍDO |

### 7.4.2 — Botões principais

![Botões de ação em item](./images/07-02-botoes-item.png)

- 📖 **Iniciar** (azul) — muda status para EM_DISCUSSÃO, inicia cronômetro do item
- ⏸ **Pausar** (amarelo) — para cronômetro, mantém status
- 🔄 **Retomar** (azul claro) — para itens ADIADO, volta a contar
- 🗳 **Abrir Votação** (roxo) — muda status para EM_VOTAÇÃO, abre modal de votação automaticamente
- ✅ **Concluir** / **Encerrar Votação** (verde) — abre modal para escolher resultado
- ❌ **Retirar de Pauta** (laranja) — abre modal solicitando motivo

### 7.4.3 — Fluxo de uma leitura simples

Exemplo: item tipo LEITURA, pauta do Expediente.

1. **Status PENDENTE** — clique **Iniciar Leitura**
2. Operador (ou 1º Secretário) lê o conteúdo para os vereadores
3. **Status EM_DISCUSSÃO** — clique **Concluir Leitura**
4. Modal pede resultado: CONCLUÍDO (padrão)
5. Salvar → **Status CONCLUÍDO**

Cronômetro do item fica visível na barra de status durante todo o processo.

### 7.4.4 — Fluxo de discussão e votação de um projeto

Exemplo: item tipo DISCUSSÃO_VOTAÇÃO, ordem do dia.

1. **Status PENDENTE** — clique **Iniciar Discussão**
2. Parlamentares se inscrevem e discutem (você gerencia oradores — ver §7.10)
3. Encerrou a discussão? Clique **Abrir Votação**
4. Modal de votação abre automaticamente (ver §7.5)
5. Conduza a votação
6. Finalizar → modal pede resultado (APROVADO / REJEITADO / ADIADO)
7. Salvar → item muda para status final

### 7.4.5 — Pedido de vista

Durante a **discussão** de um item, se algum parlamentar pedir **vista** (tempo para estudar melhor):

1. Clique **Pausar** no item em discussão
2. Anote o pedido de vista no sistema (via aba **Questões de Ordem** da ficha da sessão)
3. O item permanece na pauta mas congelado. Próximas sessões devem ter o item **com vista** até o parlamentar se manifestar

> ℹ️ **Nota**: o sistema não força fluxo de vista automaticamente. Registre nas **Questões de Ordem** para histórico.

### 7.4.6 — Adiamento

Se votação é adiada (por falta de quorum qualificado, por pedido da maioria, etc.):

1. **Abrir Votação** → **Encerrar Votação**
2. Modal de resultado → escolha **ADIADO**
3. Item volta para PENDENTE na próxima sessão (sistema sugere inclusão automática)

### 7.4.7 — Retirada de pauta

Se o autor decide retirar a proposição antes de votar:

1. Clique **Retirar de Pauta** (laranja)
2. Modal **RetirarPautaModal** abre

![Modal retirar de pauta](./images/07-03-modal-retirar.png)

3. Preencha:
   - **Motivo** (textarea) — obrigatório, fica no histórico
   - Confirme com **Retirar**
4. Item muda para **RETIRADA_PAUTA**
5. Proposição volta para status **AGUARDANDO_PAUTA** — pode ser re-incluída em sessão futura
6. Tramitação automática é registrada com o motivo

> ⚠️ **Atenção**: retirada de pauta é **reversível** (proposição volta para aguardando). Não confunda com retirada definitiva (autor desiste — use **Retirar** na ficha da proposição).

---

## 7.5 — Votação em tempo real

### 7.5.1 — Abrir votação

No item em EM_DISCUSSÃO, clique **Abrir Votação**. Duas coisas acontecem:

1. Status do item muda para **EM_VOTAÇÃO**
2. **Modal de Votação** (VotacaoModal) abre automaticamente

![Modal de votação](./images/07-04-modal-votacao.png)

### 7.5.2 — Layout do modal

- **Cabeçalho**: tipo + número da proposição (ex: "PL 045/2026")
- **Resumo inline** (atualiza a cada 5 segundos):
  - Votos registrados: `X / Y presentes`
  - Contadores: **SIM** (verde) | **NÃO** (vermelho) | **ABSTENÇÃO** (cinza)
- **Grade de parlamentares** — cada parlamentar presente aparece como card:
  - Foto + nome (ou apelido)
  - 3 botões de voto: **SIM** (verde), **NÃO** (vermelho), **ABSTENÇÃO** (cinza)

### 7.5.3 — Registrar votos

#### Método 1 — Individual (nominal)

Clique no botão correspondente ao voto de cada parlamentar:

- **SIM** → fundo verde aparece no card
- **NÃO** → fundo vermelho
- **ABSTENÇÃO** → fundo cinza

Parlamentar pode mudar o voto antes do encerramento — basta clicar em outro botão.

#### Método 2 — Em lote

Botão **Marcar Todos SIM** (topo do modal) — útil para simbólica quando todos aprovam.

#### Método 3 — Parlamentar vota pelo seu painel

Se parlamentares têm acesso à área própria (`/parlamentar/votacao`), eles podem votar a partir do próprio celular/tablet. Os votos chegam no painel do operador em tempo real.

![Parlamentar votando no celular](./images/07-05-parlamentar-votando.png)

### 7.5.4 — Tipos de votação

| Tipo | Quando usar |
|---|---|
| **NOMINAL** | Padrão para projetos de lei, resoluções. Voto de cada um registrado e publicado. **OBRIGATÓRIA para votação qualificada e derrubada de veto** (RN-062) |
| **SIMBÓLICA** | Requerimentos simples, moções, votos de pesar/aplauso. Contagem acelerada por "Todos SIM" |
| **SECRETA** | Raro — apenas casos expressamente previstos no regimento (ex: cassação de mandato) |

O tipo é configurado no item da pauta (ver capítulo 6, §6.7.1).

### 7.5.5 — Quorum e apuração automática

O sistema calcula em tempo real:

- **Quorum atingido**: sim/não conforme tipo de matéria
- **Resultado**: APROVADO se `SIM > (presentes / 2)`; REJEITADO caso contrário; **EMPATE** se `SIM = NÃO` (trata voto de minerva do Presidente)

Tipos de quorum configuráveis (ver capítulo 13):

| Tipo | Base | Uso típico |
|---|---|---|
| **MAIORIA_SIMPLES** | Maioria dos presentes | Requerimentos, indicações |
| **MAIORIA_ABSOLUTA** | 50% + 1 do total de membros | Projetos de Lei Ordinária |
| **DOIS_TERCOS** | 2/3 dos membros | Emendas à Lei Orgânica |
| **TRÊS_QUINTOS** | 3/5 dos membros | Regimento Interno |
| **UNANIMIDADE** | Todos os presentes | Casos excepcionais |

### 7.5.6 — Voto de minerva

Se a votação termina em **empate** (SIM = NÃO) e o **Presidente da sessão** ainda não votou:

1. Sistema destaca visualmente: "⚠️ Empate — Voto de minerva do Presidente"
2. Presidente clica SIM ou NÃO no próprio cartão
3. Esse voto desempata
4. Campo `votoMinerva: true` é registrado na votação consolidada

> ℹ️ **Nota**: voto de minerva só se aplica a votações em que o Presidente se absteve intencionalmente para desempatar. Se o Presidente já votou normalmente antes, é voto comum.

### 7.5.7 — Encerrar votação

Quando todos votaram (ou tempo limite atingido):

1. No modal de votação, clique **Encerrar Votação** (ou, no item, clique **Encerrar** no card)
2. **Modal FinalizarItemModal** abre:

![Modal finalizar](./images/07-06-modal-finalizar.png)

3. Escolha o resultado:
   - **APROVADO** — se SIM atingiu quorum
   - **REJEITADO** — se NÃO atingiu maioria
   - **ADIADO** — se a discussão precisa continuar em outra sessão
4. (Opcional) adicione observações
5. Clique **Confirmar Finalização**

### 7.5.8 — Dupla votação (turnos 1 e 2)

Certas proposições exigem **dois turnos** (ex: Emendas à Lei Orgânica — 10 dias de interstício entre turnos, RN-021).

No 2º turno:
1. Item volta à pauta em sessão subsequente (após interstício)
2. Repete-se o fluxo discussão → votação
3. Campo `turnoAtual` = 2 é preenchido automaticamente
4. Sistema registra `resultadoTurno1` e `resultadoTurno2` separadamente

Se turno 2 for REJEITADO, proposição final é REJEITADA (mesmo que turno 1 tenha sido APROVADO).

---

## 7.6 — Votação em lote (retroativa)

Se a sessão já **terminou** mas votos não foram lançados em tempo real (sistema caiu, operador esqueceu, etc.):

### Passo 1: acessar lançamento retroativo

Ficha da sessão (com status CONCLUÍDA) → botão **Lançar Votações** (âmbar) ou URL `/admin/sessoes/[id]/lancamento-retroativo`.

![Tela de lançamento retroativo](./images/07-07-lancamento-retroativo.png)

### Passo 2: selecionar proposição

Lista todas as proposições que tiveram item de pauta nesta sessão. Escolha uma.

### Passo 3: registrar votos em lote

Interface similar ao modal de votação, mas com **checkbox "Finalizar votação"** no rodapé.

1. Marque o voto de cada parlamentar presente
2. Marque **Finalizar votação**
3. Clique **Salvar votos em lote**

Sistema executa em transação atômica:
- Registra todos os votos
- Atualiza status do item e da proposição
- Cria registro consolidado em VotacaoAgrupada

> ℹ️ **Nota**: lançamento retroativo **respeita as mesmas regras de quorum**. Se o resultado calculado for diferente do informado, sistema avisa mas deixa você decidir.

---

## 7.7 — Painel TV (sala de sessões)

Painel separado, otimizado para **projetor ou TV grande** na sala onde ocorre a sessão.

### 7.7.1 — Abrir

No cabeçalho do Painel Operador → botão **📺 Painel TV** → abre nova aba.

URL: `/painel-tv/[sessaoId]`.

### 7.7.2 — Modos de exibição

Via query string:

| URL | O que mostra |
|---|---|
| `/painel-tv/[id]?modo=completo` (padrão) | Item atual + votação + cronômetro + presença |
| `/painel-tv/[id]?modo=votacao` | Apenas votação (para destacar resultado) |
| `/painel-tv/[id]?modo=placar` | Apuração final (aprovado/rejeitado) |
| `/painel-tv/[id]?modo=presenca` | Apenas quorum em tempo real |

### 7.7.3 — Chroma key

Para sobrepor em transmissão com fundo transparente:

`/painel-tv/[id]?transparent=true`

Ideal para transmitir com cenário atrás (logo da câmara, bandeira).

### 7.7.4 — Atualização em tempo real

Painel TV conecta via **SSE (Server-Sent Events)** ao servidor. Com fallback de polling a cada 2 segundos caso SSE falhe. Indicador de status no canto superior direito:

- 🟢 verde = conectado em tempo real
- 🟡 amarelo = polling (SSE caiu)
- 🔴 vermelho = desconectado

### 7.7.5 — Quando usar cada modo

- **Sessão ordinária**: `modo=completo` em TV/projetor
- **Momento de votação crítica**: `modo=votacao` em tela destacada
- **Momento de declarar resultado**: `modo=placar` (Presidente pede "Apurado... APROVADO")
- **Antes de iniciar**: `modo=presenca` mostrando chegada dos parlamentares

---

## 7.8 — Painel Público (site)

Versão simplificada para cidadãos acompanharem pelo portal.

### 7.8.1 — Acessar

URL: `/painel-publico` (ou `/painel-publico?sessaoId=X` para sessão específica).

### 7.8.2 — Estados

| Estado da sessão | O que o cidadão vê |
|---|---|
| AGENDADA | Countdown até horário de início (ex: "Sessão começa em 2h 15min") |
| EM_ANDAMENTO | Item atual + votação em andamento + presença (sem dados nominais se votação secreta) |
| CONCLUÍDA | Resumo final (total aprovado/rejeitado/adiado) |
| Sem sessão | Mensagem "Nenhuma sessão disponível" (atualiza a cada 30s) |

### 7.8.3 — Atualização automática

Polling a cada 10 segundos (mais leve que TV para aguentar carga de muitos visitantes).

---

## 7.9 — Parlamentar votando (área própria)

Parlamentares podem votar pelo celular/tablet em `/parlamentar/votacao`.

### 7.9.1 — Visão do parlamentar

![Tela de votação do parlamentar](./images/07-08-parlamentar-votacao.png)

- **Nenhuma votação ativa** → mensagem "Aguardando próxima votação"
- **Votação ativa** → proposição + ementa + 3 botões (SIM/NÃO/ABSTENÇÃO) + cronômetro
- **Votou** → confirmação "Seu voto foi registrado: SIM" + countdown até votação fechar
- **Votação fechada** → resultado consolidado

### 7.9.2 — Como interage com o Painel Operador

- Voto clicado pelo parlamentar aparece no painel do operador em segundos (polling 5s)
- Operador **não precisa** clicar no card — voto já vem marcado
- Se parlamentar não tiver acesso (celular sem internet), operador registra manualmente

### 7.9.3 — Segurança

- Parlamentar precisa estar **autenticado** com sua conta
- **Mandato ativo** é verificado
- Só pode votar em votações **EM_VOTAÇÃO** (não após encerramento)
- Logs registram IP e timestamp de cada voto

---

## 7.10 — Oradores (cronômetro)

Se a sessão tem oradores inscritos (aba **Oradores** da ficha da sessão), você pode cronometrá-los.

### 7.10.1 — Chamar orador

1. No Painel Operador, abra a seção **Oradores** (toggle ou aba interna)
2. Lista de inscritos aparece em ordem de inscrição
3. Clique em **Iniciar Fala** no orador da vez
4. Status muda para FALANDO, cronômetro começa

### 7.10.2 — Tempo limite

Cada tipo de orador tem tempo padrão (ver capítulo 6, §6.10). Sistema:

- Mostra cronômetro contando
- Se passar do limite: destaque em vermelho
- Você pode conceder prorrogação (5 min adicionais, marcar no sistema)

### 7.10.3 — Concluir fala

Clique **Concluir**. Status vai para CONCLUIDO. Tempo real usado é registrado.

---

## 7.11 — Questões de ordem

Quando parlamentar pede palavra para questão de ordem (contestar procedimento, pedir esclarecimento):

### 7.11.1 — Registrar

1. Na ficha da sessão (pode ser em outra aba do navegador), aba **Questões de Ordem**
2. Botão **+ Nova Questão**
3. Preencha: parlamentar, assunto, texto da questão
4. Salvar

### 7.11.2 — Responder

1. Na mesma aba, localize a questão
2. Botão **Responder** → abre textarea
3. Escreva a resposta do Presidente
4. Status muda para RESPONDIDA

---

## 7.12 — Encerrando a sessão

### Checklist de encerramento

- [ ] Todos os itens de pauta têm status final (APROVADO, REJEITADO, CONCLUÍDO, RETIRADO)
- [ ] Oradores inscritos foram chamados ou justificadamente desistiram
- [ ] Questões de ordem pendentes foram respondidas
- [ ] Presenças registradas (tanto expediente quanto ordem do dia)

### Concluir

1. Dropdown de status → **CONCLUÍDA** (ou botão **Finalizar Sessão**)
2. Sistema consolida tudo
3. Volte para ficha da sessão → aba **Info** → **Gerar Ata**

---

## 7.13 — Atalhos de teclado (Painel Operador)

| Tecla | Ação |
|---|---|
| `Espaço` | Pausar/retomar cronômetro do item |
| `V` | Abrir modal de votação do item atual |
| `Esc` | Fechar modais abertos |
| `Ctrl+K` / `Cmd+K` | Busca rápida (navegar rapidamente) |

---

## 7.14 — Boas práticas

1. **Teste o Painel TV antes da sessão**. Abra em outra aba, confirme se a projeção está correta.
2. **Valide quorum na primeira votação**. Quorum válido no início não garante no fim — sessão pode perder quorum.
3. **Não deixe item em EM_VOTAÇÃO por muito tempo**. Cronômetro avançando gera dúvida sobre quando começou.
4. **Use "Retirar de Pauta" com motivo claro**. "Retirada a pedido do autor" é mínimo aceitável.
5. **Se sistema travar, use lançamento retroativo**. Nunca deixe de registrar votações — a ata oficial depende delas.
6. **Tenha backup de navegador aberto**. Se uma aba travar, a outra continua funcionando.
7. **Monitore o indicador de conexão do Painel TV**. Verde = OK. Se ficar amarelo/vermelho, avise a TI.

---

## 7.15 — Perguntas frequentes deste capítulo

**P: Meu painel perdeu conexão durante a sessão. Meus votos foram salvos?**
R: Votos individuais são salvos no momento do clique (um por vez). Se conexão caiu antes do clique, aquele voto não foi registrado. Use **Atualizar** no modal para resincronizar e verifique quais parlamentares estão faltando voto.

**P: Parlamentar diz que votou pelo celular mas não aparece no painel. O que faço?**
R: 1) Clique **Atualizar** no modal. 2) Se ainda não aparece, parlamentar tente votar de novo. 3) Se persistir, registre manualmente no cartão dele.

**P: Posso abrir votação sem quorum de instalação?**
R: **Não** — sistema bloqueia com mensagem. Espere mais parlamentares chegarem ou cancele a sessão.

**P: Como desfaço um voto registrado errado?**
R: Se votação ainda EM_VOTAÇÃO, clique em outro botão para sobrescrever. Se já encerrou, use **Lançamento Retroativo** para corrigir.

**P: O que é "Aberto Painel de Votos" vs "Modal de Votação"?**
R: **Modal** é a interface completa com grade de parlamentares (operador usa). **Painel de Votos** (atalho no sidebar) reabre o modal se você fechou por acidente.

**P: Posso conduzir duas sessões ao mesmo tempo em abas diferentes?**
R: Tecnicamente sim, mas **não recomendado**. Confusão aumenta risco de registrar voto na sessão errada.

**P: O Painel TV parou de atualizar no meio da sessão. E agora?**
R: Indicador amarelo/vermelho. Tente: (1) Recarregar a aba (F5); (2) Verificar internet da sala; (3) Usar como fallback o próprio Painel Operador projetado.

**P: Como voto de minerva aparece na ata?**
R: Quando há empate, a ata automática inclui: "Aplicado voto de minerva do Presidente [Nome], resultando em APROVAÇÃO/REJEIÇÃO". O voto do Presidente também é registrado nominalmente.

**P: Posso cancelar uma votação em andamento?**
R: Sim — **Encerrar Votação** → escolher **ADIADO**. Votos registrados até o momento ficam salvos mas não são computados como resultado final.

**P: Parlamentar chegou atrasado após abertura de votação. Ele pode votar?**
R: Regimento da sua câmara define. Tecnicamente, o sistema permite registrar voto enquanto votação está EM_VOTAÇÃO. Se regimento exige presença desde a abertura, bloqueie manualmente.

---

**Próximo capítulo:** 08 — Publicações, Normas e Notícias (em produção)

**Capítulo anterior:** [06 — Sessões Legislativas](./06-sessoes.md)
