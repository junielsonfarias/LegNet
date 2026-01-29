# Skill: Teste do Processo Legislativo

> **Objetivo**: Validar todo o fluxo do processo legislativo, testando permissoes por tipo de usuario, regras de negocio e integridade dos dados.

---

## Visao Geral

Esta skill documenta o processo de teste completo do sistema legislativo, incluindo:

- Teste de permissoes por tipo de usuario
- Simulacao do fluxo legislativo completo
- Validacao de regras de negocio (RN-XXX)
- Verificacao de conformidade com PNTP
- Registro de erros e geracao de relatorios

---

## Script de Teste

### Executar Teste Completo

```bash
npx ts-node scripts/teste-processo-legislativo-completo.ts
```

### O que o teste valida

| Etapa | Descricao | Regras Validadas |
|-------|-----------|------------------|
| 1. Permissoes | Verifica estrutura de roles | Todos os 7 tipos de usuario |
| 2. Dados Base | Parlamentares, comissoes, legislatura | RN-001, RN-030 |
| 3. Proposicao | Criacao e auto-numeracao | RN-020, RN-021 |
| 4. Tramitacao | Encaminhamento para CLJ | RN-030, RN-003 |
| 5. Reuniao/Parecer | Votacao em comissao | RN-031, RN-032, RN-040 |
| 6. Pauta | Inclusao na ordem do dia | RN-043, RN-120 |
| 7. Votacao | Presenca, quorum, votos | RN-040, RN-061, RN-062 |
| 8. Distribuicao | Resultados para parlamentares | RN-120 |
| 9. Regras | Validacao geral | RN-001, RN-003, RN-004 |

---

## Fluxo Testado

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DO PROCESSO LEGISLATIVO                        │
└─────────────────────────────────────────────────────────────────────────┘

  [1] CRIAR PROPOSICAO
       │
       │  Autor: Parlamentar
       │  Tipo: Projeto de Lei
       │  Status: APRESENTADA
       ▼
  [2] TRAMITAR PARA CLJ
       │
       │  Unidade: Comissao de Legislacao e Justica
       │  Status Proposicao: EM_TRAMITACAO
       │  Historico: Registrado
       ▼
  [3] REUNIAO DE COMISSAO
       │
       │  Quorum: Verificado
       │  Presencas: Registradas
       │  Status Reuniao: EM_ANDAMENTO
       ▼
  [4] ELABORAR PARECER
       │
       │  Relator: Designado
       │  Tipo: FAVORAVEL/CONTRARIO
       │  Status: RASCUNHO -> VOTADO -> EMITIDO
       ▼
  [5] VOTAR PARECER NA COMISSAO
       │
       │  Votos: Registrados
       │  Resultado: APROVADO/REJEITADO
       │  Status Proposicao: AGUARDANDO_PAUTA
       ▼
  [6] INCLUIR NA PAUTA DA SESSAO
       │
       │  Secao: ORDEM_DO_DIA
       │  Tipo Acao: VOTACAO
       │  PNTP: 48h antes (verificado)
       │  Status Proposicao: EM_PAUTA
       ▼
  [7] ABRIR SESSAO PLENARIA
       │
       │  Registrar presencas
       │  Verificar quorum (50% + 1)
       │  Status Sessao: EM_ANDAMENTO
       ▼
  [8] VOTACAO NOMINAL
       │
       │  Item: EM_VOTACAO
       │  Cada parlamentar vota: SIM/NAO/ABSTENCAO
       │  Calculo automatico do resultado
       ▼
  [9] RESULTADO FINAL
       │
       │  Status Proposicao: APROVADA ou REJEITADA
       │  VotacaoAgrupada: Consolidado
       │  Dados Abertos: Disponivel
       ▼
  [10] VERIFICAR DISTRIBUICAO

       Votos nominais disponiveis
       API publica atualizada
       PNTP: Dados em ate 30 dias
```

---

## Permissoes por Tipo de Usuario

### Matriz de Permissoes Testadas

| Funcionalidade | ADMIN | SECRETARIA | AUX_LEG | EDITOR | OPERADOR | PARLAMENTAR | USER |
|---------------|:-----:|:----------:|:-------:|:------:|:--------:|:-----------:|:----:|
| Criar Proposicao | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Tramitar | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Gerenciar Comissao | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Criar Parecer | ✓ | ✓ | ✓ | ✓ | - | - | - |
| Gerenciar Pauta | ✓ | ✓ | - | ✓ | - | - | - |
| Operar Sessao | ✓ | - | - | - | ✓ | - | - |
| Registrar Presenca | ✓ | - | - | ✓ | ✓ | - | - |
| Registrar Votacao | ✓ | - | - | ✓ | ✓ | - | - |
| Votar (Parlamentar) | - | - | - | - | - | ✓ | - |
| Visualizar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Teste de Usuario Especifico

```typescript
// Testar permissoes do AUXILIAR_LEGISLATIVO
const permissoesAuxiliar = [
  'tramitacao.view',
  'tramitacao.manage',
  'comissao.view',
  'comissao.manage',
  'parlamentar.view',
  'sessao.view',
  'painel.view',
  'relatorio.view',
  'publicacao.view'
]
```

---

## Regras de Negocio Validadas

### RN-001 a RN-004: Principios Fundamentais

| Codigo | Regra | Validacao |
|--------|-------|-----------|
| RN-001 | PUBLICIDADE - Todo ato publico | Dados disponiveis via API |
| RN-002 | LEGALIDADE - Respeitar normas | Fluxo conforme regimento |
| RN-003 | RASTREABILIDADE - Registrar acoes | Historico de tramitacao |
| RN-004 | INTEGRIDADE - Nao alterar atos | Votos imutaveis |

### RN-020 a RN-032: Proposicoes

| Codigo | Regra | Validacao |
|--------|-------|-----------|
| RN-020 | Iniciativa privativa | Autor valido |
| RN-021 | Numeracao sequencial | Auto-numeracao |
| RN-022 | Requisitos formais | Campos obrigatorios |
| RN-030 | Passagem pela CLJ | Tramitacao inicial |
| RN-031 | Relator designado | Parecer com relator |
| RN-032 | Prazo de parecer | Data limite |

### RN-040 a RN-062: Sessoes e Votacoes

| Codigo | Regra | Validacao |
|--------|-------|-----------|
| RN-040 | Quorum de instalacao | 50% + 1 verificado |
| RN-043 | Ordem dos trabalhos | Secoes respeitadas |
| RN-061 | Votacao nominal | Votos individuais |
| RN-062 | Calculo de resultado | Maioria simples |

### RN-120: Transparencia (PNTP)

| Codigo | Regra | Validacao |
|--------|-------|-----------|
| RN-120 | Pauta 48h antes | Data de publicacao |
| RN-120 | Votacoes em 30 dias | API dados-abertos |
| RN-120 | Presencas em 30 dias | API dados-abertos |

---

## APIs Testadas

### Processo Legislativo

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/proposicoes` | POST | Criar proposicao |
| `/api/proposicoes/{id}` | PUT | Atualizar status |
| `/api/tramitacoes` | POST | Criar tramitacao |
| `/api/comissoes/{id}/membros` | GET | Listar membros |
| `/api/reunioes-comissao` | POST | Criar reuniao |
| `/api/pareceres` | POST | Criar parecer |
| `/api/sessoes` | POST/PUT | Gerenciar sessao |
| `/api/sessoes/{id}/pauta` | POST | Adicionar item |
| `/api/sessoes/{id}/presenca` | POST | Registrar presenca |
| `/api/sessoes/{id}/votacao` | POST | Registrar voto |

### Dados Publicos

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/dados-abertos/proposicoes` | GET | Proposicoes publicas |
| `/api/dados-abertos/votacoes` | GET | Votacoes nominais |
| `/api/dados-abertos/presencas` | GET | Presencas publicas |
| `/api/dados-abertos/sessoes` | GET | Sessoes publicas |

---

## Erros Comuns e Solucoes

### Erro: "Quorum nao atingido"

**Causa**: Menos de 50% + 1 parlamentares presentes

**Solucao**:
1. Verificar se parlamentares estao cadastrados
2. Verificar mandatos ativos
3. Registrar mais presencas

### Erro: "CLJ nao encontrada"

**Causa**: Comissao de Legislacao e Justica nao cadastrada

**Solucao**:
1. Criar comissao com sigla "CLJ"
2. Adicionar membros a comissao
3. Definir presidente

### Erro: "Parecer obrigatorio"

**Causa**: Tentativa de incluir na pauta sem parecer

**Solucao**:
1. Tramitar para CLJ
2. Elaborar parecer
3. Votar parecer na comissao

### Erro: "Proposicao ja votada"

**Causa**: Tentativa de votar novamente

**Solucao**:
1. Verificar status da proposicao
2. Para reabrir, criar novo turno
3. Para emendas, votar separadamente

---

## Relatorio de Teste

### Formato do Relatorio

```
╔══════════════════════════════════════════════════════════════╗
║           TESTE COMPLETO DO PROCESSO LEGISLATIVO             ║
╚══════════════════════════════════════════════════════════════╝

ESTATISTICAS GERAIS
-------------------
Total de etapas: 25
Sucessos:        22 (88.0%)
Falhas:          1 (4.0%)
Avisos:          2 (8.0%)
Duracao:         3.45s

REGRAS VALIDADAS COM SUCESSO:
[✓] RN-001: PUBLICIDADE - Ato legislativo publico
[✓] RN-003: RASTREABILIDADE - Acoes registradas
[✓] RN-020: Proposicao criada com autor valido
[✓] RN-030: Tramitacao obrigatoria pela CLJ
[✓] RN-040: Quorum de instalacao atingido
[✓] RN-061: Votacao nominal registrada

REGRAS VIOLADAS:
[✗] RN-120: Pauta publicada 24h antes (esperado 48h)

ERROS CRITICOS:
[!] Nenhum erro critico

======================================================================
  TODOS OS TESTES PASSARAM COM SUCESSO!
======================================================================
```

---

## Checklist de Teste Manual

### Antes de Testar

- [ ] Banco de dados configurado
- [ ] Parlamentares cadastrados (minimo 5)
- [ ] CLJ criada com membros
- [ ] Legislatura ativa
- [ ] Usuario admin logado

### Durante o Teste

- [ ] Criar proposicao
- [ ] Verificar numeracao automatica
- [ ] Tramitar para CLJ
- [ ] Verificar historico
- [ ] Criar reuniao de comissao
- [ ] Registrar presencas
- [ ] Elaborar parecer
- [ ] Votar parecer
- [ ] Incluir na pauta
- [ ] Abrir sessao
- [ ] Registrar presencas
- [ ] Verificar quorum
- [ ] Iniciar votacao
- [ ] Registrar votos
- [ ] Verificar resultado

### Apos o Teste

- [ ] Verificar dados no banco
- [ ] Verificar APIs publicas
- [ ] Verificar logs de auditoria
- [ ] Documentar erros encontrados
- [ ] Atualizar ERROS-E-SOLUCOES.md

---

## Integracao com Outras Skills

| Skill | Integracao |
|-------|------------|
| skill-legislativo.md | Regras de proposicoes e votacoes |
| skill-operador.md | Painel eletronico e sessao |
| skill-comissoes.md | Reunioes e pareceres |
| skill-secretaria.md | Tramitacao e pauta |
| skill-transparencia.md | Dados publicos PNTP |

---

## Historico de Atualizacoes

| Data | Alteracao |
|------|-----------|
| 2026-01-29 | Criacao da skill de teste |
| 2026-01-29 | Script teste-processo-legislativo-completo.ts |
| 2026-01-29 | Validacao de 7 tipos de usuario |
| 2026-01-29 | Teste de 15+ regras de negocio |
