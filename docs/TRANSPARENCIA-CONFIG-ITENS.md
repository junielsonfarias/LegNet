# Configuração dos Itens do Portal /transparencia

> Sistema unificado para configurar cada item do portal `/transparencia`. O administrador pode escolher, **para cada um dos ~80 itens**, entre 3 modos de exibição.

---

## Arquitetura

### Catálogo único — fonte da verdade

Arquivo: `src/lib/transparencia/itens-catalogo.ts`

Define os 9 **seções** e os **80+ itens** do portal. Cada item tem:
- `slug` (único globalmente — chave de configuração)
- `label`, `secao`, `hrefInterno` (rota padrão)
- `icone` (nome do ícone lucide-react)
- `subItensPadrao?` (sub-itens default quando admin não configurou nada)
- `pntp?` (critérios PNTP 2026 atendidos, informativo)

### 3 modos por item

| Modo | Como funciona | Storage |
|------|---------------|---------|
| `interno` (default) | Usa `hrefInterno` do catálogo + subItensPadrao se houver | — |
| `redirect` | Item vira link externo direto (sem sub-itens) | `Configuracao.chave = transparencia.redirect.<slug>` |
| `periodos` | Item expande em sub-itens configuráveis (cada um interno OU externo) | `Configuracao.chave = transparencia.periodos.<slug>` |

### Prioridade de resolução

O endpoint `/api/transparencia/menu` aplica as sobreposições nessa ordem:

1. **Redirect ativo** → sobrepõe tudo (item vira link externo)
2. **Períodos ativos** com pelo menos 1 período → substitui sub-itens padrão
3. **Fallback** → catálogo padrão (`hrefInterno` + `subItensPadrao` se houver)

---

## Fluxo do administrador

### Passo 1 — Acessar
`/admin/configuracoes/transparencia-periodos`

### Passo 2 — Selecionar item
- Filtrar por seção (9 opções) ou ver todos os 80+ itens
- Selecionar o item específico (ex: "Relação de Estagiários")
- O painel mostra a rota padrão do catálogo + os critérios PNTP atendidos

### Passo 3 — Escolher modo

#### Modo 1: Rota interna padrão
Sem nenhuma configuração extra. O item usa `hrefInterno` do catálogo.

#### Modo 2: URL externa direta
Para itens que apontam para outro sistema (Portal da Prefeitura, sistema legado, etc.):
- Campo "URL externa" (obrigatório)
- Campo "Rótulo auxiliar" (opcional — para identificar internamente)
- Salva em `transparencia.redirect.<slug>` com `enabled=true`

Exemplo prático:
```
Item: Folha de Pagamento
Modo: URL externa direta
URL: https://portal.prefeitura.exemplo.gov.br/folha-pagamento
```

Resultado: ao clicar em "Folha de Pagamento" no portal, abre o link externo em nova aba.

#### Modo 3: Sub-itens por período
Para PNTP Série Histórica — o item raiz vira um expansível com múltiplos períodos:
- Campos opcionais "Título" + "Descrição" (texto auxiliar)
- Lista de períodos (cada um com):
  - `Rótulo` (ex: "Consulte as informações até 2025")
  - `URL externa` (link para sistema antigo)
  - `Rota interna` (alternativa: rota do próprio sistema com filtro)
  - `Ano` (opcional — para ordenação)
  - `Ativo` (toggle)
- Reordenação por setas (↑ ↓)

Exemplo prático:
```
Item: Relação de Estagiários
Modo: Sub-itens por período
Período 1: "Consulte até 2025" → URL externa: https://sistema-antigo.gov.br/estagiarios/2025
Período 2: "2026 em diante" → Rota interna: /transparencia/pessoal/estagiarios?ano=2026
```

Resultado: ao clicar em "Relação de Estagiários", o item expande mostrando os 2 sub-itens.

---

## API

### `GET /api/transparencia/menu`
- Público (cacheado 5 minutos)
- Retorna o catálogo COMPLETO já resolvido (com modo aplicado)
- Usado pela home `/transparencia/page.tsx`

### `GET /api/transparencia/redirecionamentos?slug=X`
- Público
- Retorna config de redirect específica
- Usado pelo admin para carregar estado atual

### `POST /api/transparencia/redirecionamentos`
- Requer `config.manage`
- Body: `{slug, enabled, url, label?}`
- Invalida cache do menu

### `GET /api/transparencia/periodos?slug=X`
- Público
- Retorna config de períodos específica

### `POST /api/transparencia/periodos`
- Requer `config.manage`
- Body: `{slug, enabled, titulo?, descricao?, periodos: Periodo[]}`
- Invalida cache do menu

---

## Adicionando novos itens

Para adicionar um novo item ao portal:

1. Editar `src/lib/transparencia/itens-catalogo.ts`
2. Adicionar entrada em `ITENS_TRANSPARENCIA` com slug único
3. Se o ícone for novo, adicionar em `LucideIconName` e em `src/lib/transparencia/itens-icones.tsx`
4. O item passa a aparecer automaticamente:
   - Na home `/transparencia` (via `/api/transparencia/menu`)
   - No admin `/admin/configuracoes/transparencia-periodos` (select)

---

## Conformidade PNTP

Este sistema atende a metodologia PNTP 2026 em vários pontos:

- **Cartilha p.44 — "fácil acesso, seções intuitivas"**: o menu agora é configurável e centralizado.
- **Critério 1.4 — pesquisa de conteúdo**: o catálogo é a fonte para a página `/transparencia/mapa-do-site` e `/transparencia/busca`.
- **Série histórica (20% do score de cada critério)**: o modo "Períodos" permite que cada item tenha múltiplas referências históricas com links externos para sistemas antigos.
- **Migração de portais (Cartilha p.47)**: "o portal anterior deve manter aviso claro e visível informando a descontinuidade [...] link de acesso ao novo portal". O modo "URL externa direta" cobre o caso inverso (sistema atual aponta para histórico no antigo).

---

## Referências

- `src/lib/transparencia/itens-catalogo.ts` — catálogo
- `src/lib/transparencia/itens-icones.tsx` — mapa de ícones
- `src/app/api/transparencia/menu/route.ts` — endpoint resolvido
- `src/app/transparencia/page.tsx` — home pública
- `src/app/admin/configuracoes/transparencia-periodos/page.tsx` — admin
- `src/lib/services/transparencia-redirect-service.ts` — service de persistência
- `docs/PNTP/CONFORMIDADE-LINKS-2026.md` — matriz PNTP geral
