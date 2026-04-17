# Capítulo 04 — Pareceres de Comissão

Parecer é a **opinião formal** de uma comissão sobre uma proposição. É o que determina se ela pode avançar, voltar com emendas ou ser arquivada. Pareceres da **Comissão de Legislação e Justiça (CLJ)** são **bloqueantes** — sem eles, a proposição não vai a pauta (RN-030).

Neste capítulo você vai aprender a:

- Listar e filtrar pareceres
- Cadastrar novo parecer (com relator, fundamentação, conclusão)
- Votar parecer em reunião de comissão
- Emitir parecer aprovado
- Entender a diferença entre CLJ e comissões temáticas
- Monitorar prazos

> 🔒 **Requer permissão**: `proposicao.manage` (Administrador, Secretaria, Auxiliar Legislativo). Parlamentares membros da comissão votam mas não editam.

---

## 4.1 — Conceitos-chave

| Termo | Significado |
|---|---|
| **Parecer** | Manifestação formal da comissão sobre uma proposição |
| **Relator** | Parlamentar membro da comissão designado para elaborar o parecer |
| **Tipo de parecer** | Favorável, Contrário, Favorável com Emendas, Pela Inconstitucionalidade, Pela Ilegalidade, Pela Prejudicialidade, Pela Retirada |
| **CLJ** | Comissão de Legislação e Justiça — emite parecer **obrigatório** para PL/PR/PDL antes de ir a pauta |
| **Parecer bloqueante** | Parecer contrário da CLJ (por inconstitucionalidade/ilegalidade) que impede tramitação até reversão |

### Fluxo do parecer

```
[Proposição chega à comissão] → [Designar relator] → [Relator redige parecer]
                                                              ↓
                               [Parecer RASCUNHO] → [Comissão agenda reunião]
                                                              ↓
                               [Reunião vota parecer] → [APROVADO ou REJEITADO]
                                                              ↓
                               [Parecer EMITIDO] → [Proposição avança na tramitação]
```

---

## 4.2 — Lista de pareceres

Sidebar → ***Legislativo*** → ***Pareceres***. URL `/admin/pareceres`.

![Lista de pareceres](./images/04-01-lista-pareceres.png)

### 4.2.1 — Colunas e status

| Coluna | Conteúdo |
|---|---|
| **Número** | Formato `NNN/AAAA-SGL` (ex: `005/2026-CLJ`) |
| **Comissão** | Nome + sigla |
| **Proposição** | Link para ficha da proposição (ex: `PL 045/2026`) |
| **Relator** | Parlamentar designado |
| **Tipo** | Badge colorido conforme tipo |
| **Status** | Rascunho, Aguardando Pauta, Aguardando Votação, Aprovado, Rejeitado, Emitido, Arquivado |
| **Prazo** | Data limite (vermelho se vencido) |
| **Ações** | 👁 Ver, ✏ Editar, 🗑 Excluir (rascunhos) |

### 4.2.2 — Filtros

- **Busca** por número, proposição ou relator
- **Comissão** (dropdown)
- **Status**
- **Tipo**

---

## 4.3 — Cadastrar parecer

### Passo 1: iniciar

Botão **+ Novo Parecer** na lista.

### Passo 2: preencher o formulário

![Formulário novo parecer](./images/04-02-novo-parecer.png)

| Campo | Obrigatório? | Observações |
|---|---|---|
| **Comissão** * | Sim | Dropdown — apenas comissões em que você tem acesso. Ao selecionar, carrega membros |
| **Proposição em tramitação** * | Sim | Dropdown — filtra proposições em tramitação naquela comissão, que ainda não têm parecer dela |
| **Relator** * | Sim | Dropdown — **obrigatório ser membro ativo** da comissão selecionada |
| **Tipo** * | Sim | 7 tipos conforme RN-034 (ver tabela abaixo) |
| **Fundamentação** * | Sim, mín 10 caracteres | Análise técnica/jurídica detalhada |
| **Conclusão** | Recomendado | Texto objetivo do voto do relator |
| **Ementa** | Opcional | Resumo em uma frase |
| **Emendas propostas** | Se tipo = Favorável com Emendas | Lista de emendas do relator |
| **Prazo de emissão** | Recomendado | Data limite. Sistema gera alerta 3 dias antes |
| **Observações** | Opcional | Notas internas |
| **Upload PDF** | Opcional | Arquivo com parecer formatado (máx 10 MB) |
| **Link externo** | Opcional | Google Drive / OneDrive (alternativa ao upload) |

#### Tipos de parecer

| Tipo | Significado | Impacto |
|---|---|---|
| **FAVORAVEL** | Recomenda aprovação | Libera tramitação |
| **FAVORAVEL_COM_EMENDAS** | Aprovação com alterações sugeridas | Libera + registra emendas do relator |
| **CONTRARIO** | Recomenda rejeição | Proposição pode ser rejeitada sem votação |
| **PELA_INCONSTITUCIONALIDADE** | Viola Constituição | **BLOQUEIA** tramitação (apenas CLJ) |
| **PELA_ILEGALIDADE** | Viola lei | **BLOQUEIA** tramitação (apenas CLJ) |
| **PELA_PREJUDICIALIDADE** | Proposição prejudicada (matéria já decidida) | Arquivamento |
| **PELA_RETIRADA** | Recomenda que o autor retire | Comunicação ao autor |

### Passo 3: numeração automática

O número do parecer é **gerado automaticamente** ao salvar: `NNN/AAAA-SGL` sequencial por comissão + ano.

### Passo 4: salvar

Clique **Salvar Rascunho**. Status inicial: **RASCUNHO**.

> ℹ️ **Nota**: enquanto RASCUNHO, o parecer pode ser editado livremente. Após **enviar para votação** não permite mais edição de fundamentação/conclusão.

---

## 4.4 — Enviar parecer para votação

Quando relator termina a fundamentação:

1. Abrir o parecer (ícone 👁 na lista)
2. Botão **Enviar para Votação**
3. Confirmação
4. Status muda para **AGUARDANDO_VOTACAO**

Parecer aparece em reunião da comissão — item de pauta automaticamente gerado.

---

## 4.5 — Votar parecer em reunião

Durante uma reunião da comissão (ver capítulo 5):

### 4.5.1 — Aba Pareceres

![Aba pareceres da reunião](./images/04-03-aba-pareceres-reuniao.png)

Na ficha da reunião, aba **Pareceres** lista pareceres pendentes de votação.

### 4.5.2 — Registrar votos

1. Clique **Votar** no parecer
2. Dialog mostra membros da comissão com 3 botões cada: **A Favor**, **Contra**, **Abstenção**
3. Marque o voto de cada membro presente
4. Sistema calcula quorum e resultado automaticamente

> ⚠️ **Atenção**: apenas **membros ativos da comissão** podem votar. Suplentes só se estiverem substituindo titular ausente.

### 4.5.3 — Encerrar votação

1. Botão **Encerrar Votação**
2. Sistema determina resultado:
   - **APROVADO_COMISSAO** — maioria de votos A Favor
   - **REJEITADO_COMISSAO** — maioria Contra
3. Se aprovado, status final do parecer: **EMITIDO**

---

## 4.6 — CLJ vs Comissões Temáticas

### CLJ (Comissão de Legislação e Justiça)

- **Obrigatório** para Projetos de Lei, Resolução, Decreto Legislativo (RN-030)
- Analisa: constitucionalidade, legalidade, juridicidade, redação
- Parecer **PELA_INCONSTITUCIONALIDADE** ou **PELA_ILEGALIDADE** é **bloqueante** — proposição não vai a pauta até:
  - Autor reformular a proposição para corrigir, OU
  - Comissão emitir novo parecer favorável, OU
  - Plenário (2/3) rejeitar o parecer negativo

### Comissões Temáticas

- Analisam mérito: Educação, Saúde, Urbanismo, Finanças, etc.
- Parecer é **consultivo** (não bloqueante)
- Proposição pode ir a pauta mesmo com parecer contrário (mas Plenário tende a rejeitar)

### Qual parecer vem primeiro?

**Fluxo típico**:
1. CLJ (análise jurídica)
2. Comissão(ões) temática(s) conforme matéria
3. Plenário

Se a ordem estiver configurada corretamente no **Fluxo de Tramitação** (ver capítulo 13), o sistema encaminha automaticamente após cada parecer aprovado.

---

## 4.7 — Monitorar prazos

### 4.7.1 — Prazos padrão

Configuráveis por tipo de proposição:

| Tipo | Prazo de parecer |
|---|---|
| Projeto de Lei | 15 dias úteis |
| Urgência | 5 dias úteis |
| Pareceres conjuntos | 30 dias |

### 4.7.2 — Alertas automáticos

Sistema envia notificações:

- **3 dias antes do prazo**: aviso ao relator e presidente da comissão
- **1 dia antes**: aviso urgente
- **Prazo vencido**: badge vermelho na lista + alerta no dashboard

> 💡 **Dica**: visualize todos os prazos vencendo em *Relatórios* → *Pareceres Pendentes*.

---

## 4.8 — Boas práticas

1. **Designe o relator imediatamente ao receber proposição.** Não deixar proposição sem relator por mais de 3 dias.
2. **Fundamentação clara e objetiva.** Parecer não é opinião — é análise técnica. Use linguagem formal mas direta.
3. **Cite artigos/leis referenciadas.** Facilita defesa em plenário.
4. **Prefira PDF com template oficial.** Parecer é documento público — apresentação importa.
5. **Não confundir "Contrário" com "Pela Inconstitucionalidade".** O primeiro é juízo de mérito. O segundo é juízo jurídico (bloqueia tramitação).
6. **Registre voto divergente.** Se relator tem opinião diferente da maioria, registre em "Observações" ou anexo.

---

## 4.9 — FAQ

**P: Um parlamentar não-membro da comissão pode ser relator?**
R: Não. O relator **deve** ser membro ativo da comissão. Se precisar de especialista externo, convide para opinar mas a relatoria fica com membro.

**P: Posso alterar o relator depois do parecer iniciado?**
R: Sim, enquanto status é RASCUNHO. Após enviar para votação, não permite mais mudança — crie novo parecer se necessário.

**P: E se a comissão não votar o parecer no prazo?**
R: Proposição pode ser incluída em pauta com **pedido de urgência** (aprovado em plenário) ou pode ser **arquivada** por inércia após prazo máximo regimental.

**P: Dois pareceres diferentes da mesma comissão?**
R: Não permitido. Uma comissão emite **um parecer por proposição**. Se houver divergência interna, consta em "Voto Divergente" dentro do parecer único.

**P: Posso baixar o PDF do parecer depois?**
R: Sim, na ficha do parecer, botão **Download PDF** (se foi enviado) ou **Abrir Link** (se foi vinculado Google Drive).

**P: Parecer rejeitado pela comissão significa proposição rejeitada?**
R: Não. Parecer REJEITADO_COMISSAO significa que a comissão não aprovou o texto do parecer. A proposição ainda pode ir a plenário (geralmente com parecer contrário anexado).

---

**Próximo capítulo:** [05 — Comissões e Reuniões](./05-comissoes.md)

**Capítulo anterior:** [03 — Proposições](./03-proposicoes.md)
