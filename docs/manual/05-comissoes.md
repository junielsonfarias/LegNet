# Capítulo 05 — Comissões e Reuniões

As comissões são órgãos técnicos da Câmara que analisam proposições antes do plenário. Existem comissões **permanentes** (funcionam todo o mandato) e **temporárias** (criadas para fins específicos, como CPIs).

Neste capítulo você vai aprender a:

- Consultar e cadastrar comissões
- Gerenciar membros (presidente, vice, relator, membros, suplentes)
- Agendar e conduzir reuniões de comissão
- Registrar presenças, votações e atas em reuniões
- Vincular pareceres às reuniões

> 🔒 **Requer permissão**: `comissao.manage` (Administrador, Secretaria, Auxiliar Legislativo).

---

## 5.1 — Conceitos-chave

| Termo | Significado |
|---|---|
| **Comissão Permanente** | Criada no início da legislatura, dura todo o mandato (ex: CLJ, Finanças, Educação) |
| **Comissão Temporária** | Criada para estudar matéria específica, dissolve-se ao concluir |
| **Comissão Especial** | Temporária com propósito definido (ex: elaboração da LOA) |
| **CPI (Inquérito)** | Comissão Parlamentar de Inquérito — investigativa, poderes reforçados |
| **Reunião** | Sessão da comissão para deliberar sobre proposições |
| **Pauta da reunião** | Itens a tratar (proposições, pareceres, comunicados) |

---

## 5.2 — Lista de comissões

Sidebar → ***Parlamentares*** → ***Comissões***. URL `/admin/comissoes`.

![Lista de comissões](./images/05-01-lista-comissoes.png)

### 5.2.1 — Colunas

| Coluna | Conteúdo |
|---|---|
| **Nome** | Nome completo (ex: "Comissão de Legislação, Justiça e Redação") |
| **Sigla** | Identificador curto (ex: "CLJ") |
| **Tipo** | Badge: Permanente (verde), Temporária (amarelo), Especial (azul), Inquérito/CPI (vermelho) |
| **Membros** | Total de membros ativos |
| **Status** | Ativa (verde), Inativa (cinza), Dissolvida (preto) |
| **Ações** | 👁 Dashboard, ✏ Editar, ➕ Adicionar membro, 🗑 Excluir |

### 5.2.2 — Criar comissão

Botão **+ Nova Comissão**.

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Nome** * | Sim | Ex: "Comissão de Saúde e Assistência Social" |
| **Sigla** * | Sim | Ex: "CSAS" |
| **Tipo** * | Sim | Permanente / Temporária / Especial / Inquérito |
| **Descrição** | Recomendado | Competências da comissão |
| **Data de instalação** | Opcional | Quando foi formada |
| **Data de dissolução** | Se Temporária/Especial | Quando termina |
| **Ativa** | Padrão: sim | Toggle |

Clique **Criar Comissão**.

---

## 5.3 — Dashboard da comissão

Da lista, botão **Dashboard** ou clique na linha → abre `/admin/comissoes/[id]`.

![Dashboard da comissão](./images/05-02-dashboard-comissao.png)

Mostra:

- Cards de estatística: membros ativos, proposições pendentes, reuniões do mês, pareceres emitidos
- Lista de **membros atuais** com cargos
- Lista de **proposições pendentes de parecer** (com semáforo de prazo)
- Próximas reuniões agendadas
- Atalhos: **+ Nova Reunião**, **Novo Parecer**, **Adicionar Membro**

---

## 5.4 — Gerenciar membros

### 5.4.1 — Adicionar parlamentar

Botão **Adicionar Membro à Comissão** (no dashboard da comissão).

![Modal adicionar membro](./images/05-03-adicionar-membro.png)

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Parlamentar** * | Sim | Select — parlamentares ativos |
| **Cargo** * | Sim | Presidente / Vice-Presidente / Relator / Membro |
| **Data de Início** * | Sim | Quando assumiu a comissão |
| **Data de Fim** | Opcional | Se souber quando sai (fim do mandato, etc.) |
| **Ativo** | Padrão: sim | Toggle — permite inativar sem excluir |
| **Suplente de** | Se for suplente | Parlamentar titular a quem substitui |
| **Observações** | Opcional | Ex: "Interino enquanto vereador X em licença" |

Clique **Adicionar**.

### 5.4.2 — Cargos importantes

| Cargo | Responsabilidade |
|---|---|
| **Presidente** | Conduz reuniões, assina pareceres, representa comissão |
| **Vice-Presidente** | Substitui Presidente em ausência |
| **Relator** | Elabora pareceres designados. Cada proposição pode ter relator diferente |
| **Membro** | Vota nas deliberações da comissão |

### 5.4.3 — Editar/remover membro

Na lista de membros:

- **Toggle verde/cinza** — ativa ou inativa membro
- ✏ **Editar** — modifica cargo, datas, observações
- 🗑 **Remover** — exclui vínculo (com confirmação)

> ⚠️ **Atenção**: remover membro não apaga **pareceres** ou **votos** que ele tenha dado. Para afastamento sem perda de histórico, use **Inativar**.

### 5.4.4 — Suplentes

Suplentes entram em ação quando titular falta:
1. Suplente é cadastrado com campo **Suplente de** apontando para titular
2. Se titular AUSENTE em uma reunião, suplente pode votar no lugar dele
3. Sistema marca voto como "voto do suplente X (suplente de Y)"

---

## 5.5 — Reuniões de comissão

### 5.5.1 — Acessar reuniões

Duas formas:

1. **Global**: Sidebar → ***Parlamentares*** → ***Reuniões*** → `/admin/comissoes/reunioes`
2. **Da comissão**: dashboard da comissão → botão **+ Nova Reunião** ou lista de reuniões

### 5.5.2 — Agendar nova reunião

Botão **+ Nova Reunião**.

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Comissão** * | Sim | Se já está no dashboard da comissão, vem preenchida |
| **Data** * | Sim | Data da reunião |
| **Horário** | Recomendado | Hora de início |
| **Tipo** * | Sim | Ordinária, Extraordinária, Especial, Audiência Pública |
| **Local** | Opcional | Sala ou endereço |
| **Motivo da Convocação** | Se Extraordinária | Justificativa (obrigatória para extraordinárias) |

Clique **Agendar Reunião**. Status inicial: **AGENDADA**.

### 5.5.3 — Detalhes da reunião

![Ficha da reunião](./images/05-04-ficha-reuniao.png)

Ficha com abas:

#### Aba **Pauta**
Lista itens a discutir.

- Botão **+ Adicionar Item**
- Tipos: Análise de Proposição, Votação de Parecer, Designação de Relator, Comunicação, Outros
- Durante reunião: cada item pode ser marcado como **Em Discussão** → **Aprovado** / **Rejeitado**

#### Aba **Presença** (Lista de Chamada)
- Checkbox por membro (incluindo suplentes disponíveis)
- Sistema calcula **quorum mínimo** (geralmente maioria dos membros)
- Registra hora de chegada automaticamente quando marcado
- Bloqueada após reunião CONCLUÍDA

#### Aba **Pareceres**
- Pareceres vinculados à reunião (agendados para votação)
- Durante reunião EM_ANDAMENTO: botão **Votar** em cada parecer (ver capítulo 4, §4.5)

#### Aba **Ata**
- Campo grande de texto (15 linhas) para escrever resumo
- Botão **Salvar Rascunho** (enquanto redige)
- Botão **Aprovar Ata** (após reunião concluída e revisada)

---

## 5.6 — Conduzir reunião em tempo real

### 5.6.1 — Iniciar reunião

Status AGENDADA → botão **Iniciar** (verde).

Sistema:
- Verifica **quorum mínimo** (maioria dos membros presentes)
- Muda status para **EM_ANDAMENTO**
- Inicia cronômetro

> ⚠️ **Atenção**: sem quorum, o botão **Iniciar** fica desabilitado. Aguarde membros ou remarque a reunião.

### 5.6.2 — Durante a reunião

Botões disponíveis:

| Botão | Uso |
|---|---|
| **Suspender** | Pausar temporariamente (intervalo) |
| **Retomar** | Voltar após suspensão |
| **Encerrar** | Finalizar reunião |
| **Cancelar** | Anular (abre dialog pedindo motivo) |

Na aba **Pauta**:
- Marcar item como **Em Discussão**
- Após discussão, marcar como **Aprovado** / **Rejeitado**

Na aba **Pareceres**:
- Votar parecer (ver capítulo 4, §4.5)

### 5.6.3 — Encerrar

Quando todos os itens da pauta forem tratados:

1. Botão **Encerrar**
2. Status muda para **CONCLUÍDA**
3. Redação da ata é habilitada

---

## 5.7 — Gerar e aprovar ata

### 5.7.1 — Redigir rascunho

Aba **Ata** → campo de texto.

Estruture a ata com:

- **Cabeçalho** (nome comissão, data, horário, local, tipo)
- **Membros presentes e ausentes**
- **Pauta** (cada item com resultado)
- **Pareceres votados** (resultado e quorum)
- **Discussões relevantes** (resumo)
- **Encerramento** (horário)

Clique **Salvar Rascunho** sempre que parar.

### 5.7.2 — Aprovar ata

Após revisão:

1. Na próxima reunião da mesma comissão, adicione item tipo **Aprovação de Ata**
2. Membros votam (simbolicamente)
3. Aprovado → botão **Aprovar Ata** na ficha da reunião original
4. Status da ata: **APROVADA**

---

## 5.8 — Proposições pendentes de parecer

No dashboard da comissão, card **Proposições Pendentes**:

- Lista proposições em tramitação pela comissão sem parecer emitido
- Semáforo de prazo:
  - 🟢 Verde: mais de 7 dias até prazo
  - 🟡 Amarelo: 3-7 dias
  - 🔴 Vermelho: vencido ou vencendo em 3 dias

Clique em cada proposição para:
- Ver detalhes
- Designar relator
- Criar parecer (atalho)

---

## 5.9 — Boas práticas

1. **Agende reuniões ordinárias com periodicidade fixa.** Ex: toda segunda-feira, 14h. Facilita cobrar presença.
2. **Designe relator na mesma semana.** Proposição sem relator para dormindo.
3. **Publique pauta 48h antes.** Dá tempo de relatores se prepararem.
4. **Use **Audiência Pública** para matérias polêmicas.** Fortalece transparência.
5. **Redija ata enquanto a memória está fresca.** Máx 3 dias após reunião.
6. **Mantenha membros atualizados.** Mudança de titularidade deve ser cadastrada imediatamente.

---

## 5.10 — FAQ

**P: Parlamentar pode ser membro de quantas comissões?**
R: O regimento interno de cada câmara define. Geralmente parlamentar é titular em 2-3 comissões permanentes + suplente em outras.

**P: CPI tem regras diferentes?**
R: Sim. CPI tem poderes investigativos (pode convocar depoimentos), prazo de funcionamento limitado e quorum específico para conclusões. O sistema trata como tipo "Inquérito".

**P: Reunião extraordinária — precisa de prazo?**
R: Regimento local define. Normalmente 24h de antecedência com motivo justificado. O campo **Motivo da Convocação** é obrigatório para extraordinárias.

**P: Audiência Pública é reunião ou sessão?**
R: Audiência Pública é um **tipo de reunião** (pode ser da comissão inteira ou de um tema). Segue fluxo de reunião mas abre participação do público. Ver módulo **Audiências Públicas** no menu.

**P: Posso transferir membros de uma comissão para outra?**
R: Não automaticamente. **Remova** da comissão origem e **Adicione** na destino. Crie uma observação explicando a transferência.

**P: Comissão dissolvida (temporária concluiu) — o que fazer?**
R: Edite a comissão, marque **Status = Dissolvida** e preencha **Data de Dissolução**. Histórico permanece para consultas.

---

**Próximo capítulo:** [06 — Sessões Legislativas](./06-sessoes.md)

**Capítulo anterior:** [04 — Pareceres de Comissão](./04-pareceres.md)
