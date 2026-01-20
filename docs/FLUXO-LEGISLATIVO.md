# Fluxo Completo de Documentos da Secretaria Legislativa

> **IMPORTANTE**: Este documento descreve TODO o fluxo processual de documentos
> em uma Camara Municipal. O Claude DEVE consultar este arquivo ao implementar
> funcionalidades relacionadas a tramitacao, proposicoes, sessoes e votacoes.

---

## 1. Tipos de Documentos Legislativos

### 1.1 Proposicoes (Materias Legislativas)

| Tipo | Sigla | Descricao | Requer Votacao | Tramitacao |
|------|-------|-----------|----------------|------------|
| Projeto de Lei | PL | Cria ou altera leis municipais | SIM | Comissoes + Plenario |
| Projeto de Lei Complementar | PLC | Leis que complementam a Lei Organica | SIM (Maioria Absoluta) | Comissoes + Plenario |
| Projeto de Resolucao | PR | Normas internas da Camara | SIM | Comissoes + Plenario |
| Projeto de Decreto Legislativo | PDL | Materias de competencia exclusiva | SIM | Comissoes + Plenario |
| Indicacao | IND | Sugestao ao Executivo | NAO | Leitura + Encaminhamento |
| Requerimento | REQ | Solicitacoes diversas | DEPENDE | Leitura ou Votacao |
| Mocao | MOC | Manifestacoes da Casa | SIM (Simples) | Leitura + Votacao |
| Voto de Pesar | VP | Homenagem postuma | NAO | Leitura |
| Voto de Aplauso | VA | Homenagem/Congratulacao | NAO | Leitura |
| Emenda | EMD | Alteracao de proposicao | SIM | Junto com a proposicao |

### 1.2 Documentos Administrativos

| Tipo | Descricao | Fluxo |
|------|-----------|-------|
| Oficio Recebido | Correspondencia de orgaos externos | Protocolo -> Leitura -> Arquivo |
| Oficio Expedido | Correspondencia enviada pela Camara | Elaboracao -> Assinatura -> Envio |
| Contrato | Acordos com fornecedores | Licitacao -> Assinatura -> Publicacao |
| Convite | Convocacoes e convites | Protocolo -> Leitura -> Arquivo |
| Comunicado | Informes internos | Protocolo -> Leitura -> Arquivo |

---

## 2. Fluxo de Entrada e Protocolo

```
ENTRADA DE DOCUMENTOS

1. RECEBIMENTO
   - Balcao da Secretaria (presencial)
   - Protocolo Digital (sistema)
   - E-mail institucional
   - Correios

2. PROTOCOLO
   - Gerar numero sequencial: AAAA/NUMERO
   - Registrar data/hora de entrada
   - Identificar remetente
   - Classificar tipo de documento
   - Digitalizar (se fisico)

3. TRIAGEM
   - Proposicao de Parlamentar -> Fluxo Legislativo
   - Proposicao do Executivo -> Fluxo Legislativo
   - Oficio/Correspondencia -> Fluxo Administrativo
   - Documento Interno -> Arquivamento direto ou encaminhamento
```

### 2.1 Status do Documento no Protocolo

| Status | Descricao |
|--------|-----------|
| RECEBIDO | Documento protocolado, aguardando triagem |
| EM_ANALISE | Sendo verificado pela Secretaria |
| ENCAMINHADO | Enviado para setor/comissao responsavel |
| DEVOLVIDO | Retornado ao autor para correcao |
| ARQUIVADO | Processo concluido e arquivado |

---

## 3. Fluxo de Proposicoes

### 3.1 Etapas do Fluxo

1. **APRESENTACAO** - Parlamentar ou Executivo apresenta proposicao
2. **PROTOCOLO E NUMERACAO** - Secretaria atribui numero (001/2026)
3. **LEITURA EM PLENARIO** - Proposicao lida no Expediente da sessao
4. **ENCAMINHAMENTO AS COMISSOES** - CLJ (obrigatoria), CFO (se recursos), Tematicas
5. **PARECER DAS COMISSOES** - Relator analisa e emite parecer
6. **AGUARDANDO INCLUSAO NA PAUTA** - Proposicao com pareceres
7. **INCLUSAO NA ORDEM DO DIA** - Publicar 48h antes (PNTP)
8. **DISCUSSAO E VOTACAO EM PLENARIO**
9. **RESULTADO DA VOTACAO** - Aprovada/Rejeitada/Retirada
10. **REDACAO FINAL** - Texto final com emendas aprovadas
11. **AUTOGRAFO** - Documento assinado pelo Presidente
12. **ENCAMINHAMENTO AO EXECUTIVO** - Sancao ou Veto
13. **PUBLICACAO E VIGENCIA** - Lei publicada no Diario Oficial

### 3.2 Status da Proposicao no Sistema

| Status | Descricao | Proxima Acao |
|--------|-----------|--------------|
| APRESENTADA | Recem protocolada | Encaminhar para leitura |
| EM_TRAMITACAO | Em analise nas comissoes | Aguardar pareceres |
| AGUARDANDO_PAUTA | Com pareceres, aguardando sessao | Incluir na pauta |
| EM_PAUTA | Incluida na ordem do dia | Aguardar sessao |
| EM_DISCUSSAO | Sendo discutida em plenario | Iniciar votacao |
| EM_VOTACAO | Votacao em andamento | Registrar votos |
| APROVADA | Aprovada em votacao | Elaborar autografo |
| REJEITADA | Rejeitada em votacao | Arquivar |
| RETIRADA | Retirada pelo autor | Arquivar |
| ARQUIVADA | Processo encerrado | Fim |
| VETADA | Vetada pelo Executivo | Apreciar veto |
| SANCIONADA | Sancionada pelo Prefeito | Publicar |
| VIGENTE | Lei em vigor | Fim |

---

## 4. Fluxo nas Comissoes

### 4.1 Etapas

1. **RECEBIMENTO** - Secretaria envia proposicao
2. **DISTRIBUICAO AO RELATOR** - Presidente designa (2 dias uteis)
3. **ANALISE PELO RELATOR** - Estudo da materia (5 dias uteis)
4. **ELABORACAO DO PARECER** - FAVORAVEL, CONTRARIO, COM_EMENDAS, INCONSTITUCIONAL
5. **VOTACAO NA COMISSAO** - Maioria simples dos presentes
6. **ENCAMINHAMENTO** - Proxima comissao ou Plenario

### 4.2 Ordem de Tramitacao

1. **CLJ (Comissao de Legislacao e Justica)** - SEMPRE PRIMEIRA
   - Analisa constitucionalidade e legalidade
   - Se parecer "INCONSTITUCIONAL", materia arquivada

2. **CFO (Comissao de Financas e Orcamento)** - SE ENVOLVE RECURSOS
   - Analisa impacto financeiro
   - Obrigatoria para projetos com despesas

3. **Comissoes Tematicas** - CONFORME A MATERIA
   - Analisa merito da proposicao

### 4.3 Prazos Regimentais

- CLJ: 10 dias uteis
- CFO: 10 dias uteis
- Demais comissoes: 10 dias uteis
- Regime de urgencia: 48 horas

---

## 5. Fluxo da Pauta e Sessao

### 5.1 Preparacao da Pauta

1. **VERIFICAR MATERIAS PRONTAS** - Com pareceres, vetos pendentes, urgencias
2. **ORGANIZAR ORDEM DO DIA** - Prioridades regimentais
3. **MONTAR PAUTA COMPLETA** - Expediente, Ordem do Dia, Explicacoes
4. **PUBLICAR PAUTA** - 48h antes no Portal da Transparencia (PNTP)

### 5.2 Prioridades na Ordem do Dia

1. Vetos (prazo constitucional de 30 dias)
2. Regime de urgencia
3. Projetos do Executivo em prazo
4. 2o turno de votacao
5. Ordem cronologica de entrada

### 5.3 Eventos Durante a Sessao

| Evento | Descricao | Consequencia |
|--------|-----------|--------------|
| RETIRADA_DE_PAUTA | Autor solicita retirada | Item removido |
| PEDIDO_DE_VISTA | Parlamentar solicita mais tempo | Votacao adiada |
| ADIAMENTO | Decisao do Plenario | Proxima sessao |
| DESTAQUE | Votacao em separado | Votacao em partes |
| PREFERENCIA | Altera ordem | Item votado antes |
| QUESTAO_DE_ORDEM | Duvida sobre procedimento | Presidente decide |

---

## 6. Arquivamento de Materias

### 6.1 Motivos

| Motivo | Descricao |
|--------|-----------|
| REJEITADA | Votacao desfavoravel |
| FIM_LEGISLATURA | Materias nao votadas ao final |
| INCONSTITUCIONAL | Parecer da CLJ |
| RETIRADA_AUTOR | Autor solicita |
| PREJUDICADA | Materia similar ja aprovada |
| PRAZO_EXCEDIDO | Nao atendido prazo |
| VETO_MANTIDO | Plenario manteve veto |

---

## 7. Documentos Especiais

### 7.1 Vetos do Executivo

1. Prefeito VETA (15 dias apos autografo)
2. Secretaria RECEBE e protocola
3. PUBLICAR razoes do veto
4. INCLUIR NA PAUTA (30 dias - OBRIGATORIO)
5. VOTACAO (Maioria Absoluta para derrubar)
6. RESULTADO: Mantido (arquiva) ou Derrubado (Presidente promulga)

### 7.2 Regime de Urgencia

- **URGENCIA SIMPLES**: Prazo de 48h para comissoes
- **URGENCIA URGENTISSIMA**: Votacao na mesma sessao
- **URGENCIA DO EXECUTIVO**: Prazo constitucional de 45 dias

---

## 8. Atribuicoes da Secretaria

| Funcao | Descricao |
|--------|-----------|
| PROTOCOLO | Receber, numerar e registrar documentos |
| DISTRIBUICAO | Encaminhar aos setores competentes |
| CONTROLE_PRAZOS | Monitorar prazos regimentais |
| ELABORACAO_PAUTA | Preparar pauta das sessoes |
| REDACAO_FINAL | Elaborar texto final |
| AUTOGRAFO | Preparar autografos |
| PUBLICACAO | Publicar atos no Diario Oficial |
| ARQUIVO | Manter arquivo organizado |
| CERTIDOES | Emitir certidoes e copias |
| APOIO_SESSAO | Dar suporte durante sessoes |

---

## 9. Validacoes Obrigatorias

### Antes de Incluir na Pauta

- Proposicao tem parecer da CLJ? (obrigatorio)
- Proposicao tem parecer da CFO? (se envolver recursos)
- Todos os pareceres foram votados nas comissoes?
- Proposicao esta com status "AGUARDANDO_PAUTA"?
- Nao existe materia identica ja em pauta?

### Antes de Iniciar Votacao

- Quorum minimo esta presente?
- Item esta na Ordem do Dia da sessao?
- Item ja foi colocado em discussao?
- Nao ha impedimentos pendentes?

### Antes de Encerrar Votacao

- Todos os presentes votaram (ou abstiveram)?
- Quorum de aprovacao foi atingido?
- Resultado foi corretamente calculado?

---

## 10. Campos Obrigatorios

### Proposicao

```typescript
interface Proposicao {
  numero: string           // Obrigatorio - sequencial
  ano: number             // Obrigatorio - ano de apresentacao
  tipo: TipoProposicao    // Obrigatorio
  titulo: string          // Obrigatorio
  ementa: string          // Obrigatorio - resumo da materia
  textoCompleto: string   // Obrigatorio para PL, PR, PDL
  autorId: string         // Obrigatorio - autor principal
  dataApresentacao: Date  // Obrigatorio - data do protocolo
  status: StatusProposicao // Obrigatorio - estado atual
}
```

### Parecer de Comissao

```typescript
interface Parecer {
  comissaoId: string
  proposicaoId: string
  relatorId: string       // Parlamentar relator
  tipo: TipoParecer       // FAVORAVEL, CONTRARIO, COM_EMENDAS, INCONSTITUCIONAL
  texto: string           // Fundamentacao
  dataEmissao: Date
}
```

### Tramitacao

```typescript
interface Tramitacao {
  proposicaoId: string
  origem: string          // De onde veio
  destino: string         // Para onde vai
  dataEnvio: Date
  dataRecebimento?: Date
  prazo?: Date           // Prazo para resposta
  status: StatusTramitacao
}
```

---

## 11. Alertas Automaticos

### Comissoes
- Parecer pendente ha mais de X dias
- Prazo de parecer vencendo em 2 dias
- Prazo de parecer vencido

### Vetos
- Veto recebido: iniciar contagem de 30 dias
- 15 dias para apreciacao do veto
- 5 dias para apreciacao do veto (URGENTE)
- Prazo de veto vencido: PAUTA TRANCADA

### Executivo
- Projeto com prazo de 45 dias
- 30 dias para apreciacao
- 15 dias para apreciacao
- Prazo vencido: aprovacao tacita (se aplicavel)

### Publicacao (PNTP)
- Pauta deve ser publicada em 24h
- Votacao deve ser registrada em 30 dias
- Presenca deve ser publicada em 30 dias
