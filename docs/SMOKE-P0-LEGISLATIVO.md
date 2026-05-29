# Smoke Teste — Sprint P0-Legislativo

> Verificação manual em produção/staging dos 5 fixes do PR #2 após deploy.
> Cada teste é independente. Execute na ordem listada ou pule conforme necessário.

## Pré-requisitos

```bash
export BASE_URL=https://cmchaves.pa.gov.br     # ou staging
export ADMIN_USER=admin@cmchaves.pa.gov.br      # role=ADMIN
export ADMIN_PASS='...'                          # senha admin
export SECRETARIA_USER=secretaria@...           # role=SECRETARIA (sem override CLJ)
```

### Helper: login + cookies

```bash
COOKIES=$(mktemp)

# Login (NextAuth credentials)
curl -sS -c "$COOKIES" -b "$COOKIES" \
  -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/api/auth/callback/credentials" \
  -d "{\"email\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}"

# CSRF token
CSRF=$(curl -sS -c "$COOKIES" -b "$COOKIES" "$BASE_URL/api/auth/csrf" | jq -r .csrfToken)
```

Use `$COOKIES` e `$CSRF` nas chamadas subsequentes:
```bash
curl -b "$COOKIES" -H "x-csrf-token: $CSRF" ...
```

---

## P0-1 — RN-030 enforcement (CLJ obrigatória)

**O que valida**: proposição PL/PR/PDL/PLC/ELO que **não passou pela CLJ** é bloqueada ao tentar avançar para `AGUARDANDO_PAUTA`. Admin pode dispensar com motivo.

### Passo 1.1 — Localizar proposição candidata

```bash
# Lista proposições EM_TRAMITACAO sem parecer CLJ (pelo banco — admin SQL)
curl -b "$COOKIES" "$BASE_URL/api/proposicoes?status=EM_TRAMITACAO&tipo=PROJETO_LEI&limit=5" | jq '.data[] | {id, numero, ano, status}'
```

Escolha um `PROP_ID` que sabidamente ainda não passou pela CLJ.

### Passo 1.2 — Tentar tramitar SEM override (esperado: 422)

```bash
curl -i -b "$COOKIES" -H "x-csrf-token: $CSRF" -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/api/proposicoes/$PROP_ID/tramitar" \
  -d '{"acao":"AGUARDANDO_PAUTA"}'
```

**Esperado:** `HTTP/1.1 422` + `{"error":"RN-030: Proposição PROJETO_LEI deve passar pela CLJ..."}`

### Passo 1.3 — Override admin (esperado: 200 + audit)

```bash
curl -i -b "$COOKIES" -H "x-csrf-token: $CSRF" -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/api/proposicoes/$PROP_ID/tramitar" \
  -d '{"acao":"AGUARDANDO_PAUTA","overrideCLJ":{"motivo":"Pauta extraordinaria autorizada pelo Presidente da Mesa em 2026-05-29"}}'
```

**Esperado:** `HTTP/1.1 200` + verificar em `/admin/auditoria` que aparece `action=RN030_OVERRIDE_CLJ` com o `motivo`.

### Passo 1.4 — Override por NÃO-ADMIN (esperado: 422)

Re-login como SECRETARIA, repetir Passo 1.3.

**Esperado:** `HTTP/1.1 422` + `"Apenas usuarios ADMIN podem dispensar a passagem pela CLJ"`.

---

## P0-2 — Audit log do voto individual

**O que valida**: todo voto persistido gera `AuditLog` com IP, user-agent, `action=VOTO_REGISTRADO`.

### Passo 2.1 — Verificar em AuditLog após voto real

```bash
# Em /admin/auditoria filtrar entity=Votacao e checar:
curl -b "$COOKIES" "$BASE_URL/api/admin/auditoria?entity=Votacao&limit=10" | jq '.data[] | {action, ip, userAgent, metadata}'
```

**Esperado:** votos recentes têm `action=VOTO_REGISTRADO` (ou `VOTO_RETROATIVO`), `ip` e `userAgent` presentes, `metadata` com `{proposicaoId, parlamentarId, voto, turno, sessaoId}`.

### Passo 2.2 — Voto pelo painel (operador)

Abrir `/admin/painel-eletronico/$SESSAO_ID`, iniciar votação, registrar voto, finalizar.

**Esperado:** `AuditLog` tem novo registro `VOTO_REGISTRADO` com IP do operador.

### Passo 2.3 — Voto pelo celular do parlamentar

Logar como parlamentar, abrir `/parlamentar/votacao`, votar.

**Esperado:** `AuditLog` tem novo registro `VOTO_REGISTRADO` com IP do dispositivo móvel.

---

## P0-3 — Advisory lock no Protocolo

**O que valida**: 10 criações concorrentes geram 10 números **únicos sequenciais** sem duplicação.

### Passo 3.1 — Criar 10 protocolos em paralelo

```bash
START_TIME=$(date +%s)

for i in {1..10}; do
  curl -sS -b "$COOKIES" -H "x-csrf-token: $CSRF" -H 'Content-Type: application/json' \
    -X POST "$BASE_URL/api/protocolo" \
    -d "{\"tipo\":\"ENTRADA\",\"nomeRemetente\":\"Smoke Test #$i\",\"assunto\":\"Teste P0-3 concorrencia\"}" \
    | jq -r '.data | "\(.numero)/\(.ano) - \(.etiquetaCodigo)"' &
done
wait
```

**Esperado:** 10 protocolos com números **distintos** e sequenciais (ex.: 142..151). Nenhum duplicado.

### Passo 3.2 — Limpeza

Marcar os 10 protocolos como cancelados via admin, ou excluir do banco com SQL (não há endpoint de exclusão por design — RN-003 imutabilidade).

---

## P0-4 — Validação de mandato ativo no voto

**O que valida**: parlamentar com `Mandato.ativo=false` não consegue votar (RN-061).

### Passo 4.1 — Setup

Identificar (em `/admin/parlamentares`):
- `PARL_INATIVO_ID`: parlamentar com mandato `ativo=false`
- `SESSAO_ID`: sessão EM_ANDAMENTO com votação aberta
- `PROP_ID`: proposição em votação na sessão

### Passo 4.2 — Tentar voto (esperado: erro)

```bash
curl -i -b "$COOKIES" -H "x-csrf-token: $CSRF" -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/api/sessoes/$SESSAO_ID/votacao" \
  -d "{\"proposicaoId\":\"$PROP_ID\",\"parlamentarId\":\"$PARL_INATIVO_ID\",\"voto\":\"SIM\"}"
```

**Esperado:** `HTTP/1.1 422` + `"Parlamentar nao possui mandato ativo na legislatura desta sessao"` (RN-061).

### Passo 4.3 — Voto válido (controle)

Mesmo payload com parlamentar de mandato ativo → 200.

---

## P0-5 — Resultado calculado server-side (anti-tamper)

**O que valida**: PUT `/votacao/turno` **ignora** `resultado` do body — sempre deriva server-side.

### Passo 5.1 — Setup

- `SESSAO_ID`: sessão EM_ANDAMENTO
- `ITEM_ID`: item da pauta com `status=EM_VOTACAO`
- Garantir contagem real: ex. 1 SIM, 10 NAO, 0 ABSTENCAO

### Passo 5.2 — Enviar resultado "APROVADA" no body (esperado: backend ignora)

```bash
curl -i -b "$COOKIES" -H "x-csrf-token: $CSRF" -H 'Content-Type: application/json' \
  -X PUT "$BASE_URL/api/sessoes/$SESSAO_ID/votacao/turno" \
  -d "{\"itemId\":\"$ITEM_ID\",\"turno\":1,\"resultado\":\"APROVADA\"}"
```

**Esperado:** `HTTP/1.1 200`. Resposta deve trazer `resultado: "REJEITADA"` (ignora body, calcula a partir das contagens 1-10-0).

### Passo 5.3 — Verificar persistência

```bash
curl -b "$COOKIES" "$BASE_URL/api/sessoes/$SESSAO_ID" | jq '.data.pautaSessao.itens[] | select(.id=="'$ITEM_ID'") | {resultadoTurno1, status}'
```

**Esperado:** `resultadoTurno1: "REJEITADA"`, NÃO `APROVADA`.

### Passo 5.4 — Flag `adiada` (override administrativo válido)

```bash
curl -i -b "$COOKIES" -H "x-csrf-token: $CSRF" -H 'Content-Type: application/json' \
  -X PUT "$BASE_URL/api/sessoes/$SESSAO_ID/votacao/turno" \
  -d "{\"itemId\":\"$ITEM_ID\",\"turno\":1,\"adiada\":true}"
```

**Esperado:** `HTTP/1.1 200` + resultado `ADIADA`.

### Passo 5.5 — UI: botão "Adiar votação"

Abrir `/admin/painel-eletronico/$SESSAO_ID`, com item EM_VOTACAO clicar em "Adiar votação", confirmar no modal.

**Esperado:** toast de sucesso, item passa para resultado ADIADA, AuditLog gerado.

---

## Checklist consolidado

- [ ] **P0-1.2** PL sem CLJ → 422 ✗
- [ ] **P0-1.3** Override ADMIN → 200 + AuditLog `RN030_OVERRIDE_CLJ`
- [ ] **P0-1.4** Override SECRETARIA → 422 (apenas ADMIN)
- [ ] **P0-2.1** AuditLog tem `VOTO_REGISTRADO` com IP + UA
- [ ] **P0-2.2** Voto pelo painel gera AuditLog
- [ ] **P0-2.3** Voto pelo celular do parlamentar gera AuditLog
- [ ] **P0-3.1** 10 protocolos paralelos → números únicos sequenciais
- [ ] **P0-4.2** Voto parlamentar inativo → 422 (RN-061)
- [ ] **P0-4.3** Voto parlamentar ativo → 200
- [ ] **P0-5.2** body.resultado="APROVADA" ignorado, persiste REJEITADA
- [ ] **P0-5.4** body.adiada=true → resultado ADIADA
- [ ] **P0-5.5** UI "Adiar votação" funcional

## Riscos

- **P0-1.3** cria estado de tramitação real. Use proposição de teste ou reverta.
- **P0-3.1** cria 10 protocolos reais. Em produção, depois marcar como cancelados ou excluir via SQL.
- **P0-4.2/5.2** tentam votar — se item já tem voto do parlamentar, atualiza. Reverter manualmente se necessário.
- Em produção, prefira rodar em horário de baixo tráfego (madrugada) para minimizar impacto na auditoria.
