# Revisão Final — Catálogo Unificado /transparencia + PNTP 2026

> **Data**: 2026-05-27
> **Escopo**: Auditoria completa do refactor do portal `/transparencia` (catálogo unificado + admin com 3 modos).
> **Resultado**: ✅ Aprovado. Atende PNTP 2026 e melhora Série Histórica (20% do score por critério).

---

## 1. Problemas encontrados na revisão e corrigidos

| # | Problema | Severidade | Correção aplicada |
|---|----------|------------|--------------------|
| 1 | Tipos `MenuResolvido`, `ItemResolvido`, etc. importados de `app/api/.../route.ts` em client component | Média (fragilidade) | Movidos para `src/lib/transparencia/itens-catalogo.ts` (camada compartilhada). Endpoint re-exporta apenas referências de tipo |
| 2 | Slug `lgpd` em item conflitando semanticamente com `SecaoSlug` `'lgpd'` | Baixa (legibilidade) | Item renomeado para `lgpd-info` (rota mantida: `/transparencia/documentos/lgpd`) |
| 3 | Slugs `leis` e `gestao-fiscal` em uso por `TransparenciaPageWrapper` nas páginas internas, mas ausentes do novo catálogo → admin novo não os via | **Alta** (regresso funcional) | Adicionados ao catálogo com `ocultoNoMenu: true` (não aparecem na home, mas configuráveis no admin) |
| 4 | Configs salvas no banco para slugs legados (`decretos`, `portarias`, `lei-responsabilidade-fiscal`, `publicacoes`, `pesquisas`, `portal-da-transparencia`, `documentos-oficiais`, `conformidade`) ficariam invisíveis no admin novo | Média (retrocompat) | 8 slugs adicionais como `ocultoNoMenu: true` |
| 5 | Admin não resetava `slug` ao mudar filtro de seção (slug podia ficar fora do escopo visível) | Baixa (UX) | `useEffect` auto-seleciona primeiro item da seção ao trocar filtro |
| 6 | Itens ocultos não eram sinalizados visualmente no select | Baixa (UX) | Prefixo `○` no select + aviso amarelo quando item oculto é selecionado |
| 7 | Save sem validação client → server retornava 400 para URL vazia em modo redirect | Baixa (UX) | Validação client antes do submit: URL obrigatória, formato válido (`new URL()`), períodos com label e URL/rota |

---

## 2. Validação técnica

### 2.1 Slugs do catálogo (verificação de unicidade)

- **Total de itens**: 70 visíveis + 10 ocultos = **80 slugs**
- **Slugs únicos**: ✅ Verificado por grep (zero duplicatas em `ITENS_TRANSPARENCIA`)
- **Cobertura de páginas internas**: ✅ Todos os 21 slugs usados em `<TransparenciaPageWrapper>` estão no catálogo

### 2.2 Endpoint `/api/transparencia/menu`

- **Prioridade de resolução**: `redirect > periodos > interno` ✅
- **Edge cases**:
  - `redirect.enabled=true, url=''` → cai em periodos ou interno (falsy guard) ✅
  - `periodos.enabled=true, periodos=[]` → cai em interno (`length > 0` guard) ✅
  - `periodos.periodos=[{ativo:false}]` → cai em interno (filter ativos=[]) ✅
  - Item `comissoes` sem `hrefInterno` mas com `subItensPadrao` → modo interno renderiza sub-itens ✅
- **Cache**: TTL `MEDIUM` (5min), invalidação em POST de redirect ou periodos ✅
- **Itens ocultos**: presentes em `itens` (para o wrapper) mas NÃO em `secoes` (para a home) ✅
- **Performance**: 2 round trips ao DB por refresh de cache (~80 registros) — aceitável ✅

### 2.3 Home `/transparencia/page.tsx`

- **Loading state**: spinner enquanto menu chega ✅
- **3 modos renderizados corretamente**:
  - `redirect`: `<a target="_blank" rel="noopener">` com ícone `ExternalLink` ✅
  - `periodos`: `<details>` expansível com sub-itens (interno OU externo) ✅
  - `interno`: `<Link>` interno com `ChevronRight` ou `<details>` se houver sub-itens padrão ✅
- **TypeScript**: `tsc --noEmit` clean ✅

### 2.4 Admin `/admin/configuracoes/transparencia-periodos`

- **Filtro por seção**: 9 opções + "todas" ✅
- **Select de item**: enumera 80 slugs, ocultos marcados com `○` ✅
- **Auto-reset de slug ao mudar seção** ✅
- **Cards de modo** com seleção visual (border + ring) ✅
- **Validação client** antes do submit ✅
- **Salva em paralelo** nos 2 endpoints (`redirecionamentos` + `periodos`) com toast unificado ✅

---

## 3. Conformidade PNTP 2026

### 3.1 Critérios diretamente afetados pela mudança

| Crit. | Categoria | Como a nova arquitetura atende |
|-------|-----------|-------------------------------|
| **1.2** | Portal próprio | `/transparencia` continua único e próprio — refactor não muda o domínio |
| **1.3** | Visível na capa | Header global (`<Header>`) não foi tocado — top-bar com "Transparencia" e card no hero |
| **1.4** | Ferramenta de pesquisa | Item `busca` no catálogo aponta para `/transparencia/busca` (full-text Postgres) |
| **2.6** | Atos normativos | Item `documentos-administrativos` → `/transparencia/atos` (17 tipos consolidados) |
| **Cartilha p.44** | Fácil acesso, seções intuitivas | Catálogo organiza 80 itens em 9 seções com ícones e labels claros |
| **Cartilha p.45** | Declaração de não-ocorrência | Mantida nas páginas individuais (fornecedores-sancionados, obras paralisadas, classificadas) |
| **Cartilha p.47** | Migração de portais | Coberto por **2 modos** complementares: <br>· `redirect` → sistema atual aponta para portal antigo<br>· `periodos` → sub-itens "Até 2025" (externo) + "2026+" (interno) |

### 3.2 Itens de verificação PNTP (% de cada critério)

| Item | % | Impacto da nova arquitetura |
|------|---|------------------------------|
| **Disponibilidade** | 30% | Nenhum — páginas continuam acessíveis |
| **Atualidade** | 30% | Nenhum — `updatedAt` das tabelas continua governando |
| **Série Histórica** | **20%** | **GANHO PRINCIPAL** — qualquer item pode receber sub-itens com 3+ anos de referência, cada um interno ou externo (sistema antigo) |
| **Gravação de Relatórios** | 10% | Nenhum — botões CSV/PDF mantidos nas páginas individuais |
| **Filtro de Pesquisa** | 10% | Nenhum — filtros das páginas internas mantidos |

### 3.3 Antes vs depois — comparativo

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Itens configuráveis no admin | 14 hardcoded | **80** (do catálogo, sempre sincronizados) |
| Modo "URL externa direta" disponível para | Todos via página separada `/admin/transparencia/redirecionamentos` (UI legada) | TODOS no mesmo painel `/admin/configuracoes/transparencia-periodos`, com 3 cards de modo |
| Sub-itens por período | Só p/ 14 itens | TODOS os 80 itens |
| Slugs em código duplicados | `SECOES_TRANSPARENCIA` (home) + `CATEGORIAS_DISPONIVEIS` (admin) | Fonte única: `itens-catalogo.ts` |
| Tipos compartilhados | Espalhados | Centralizados no catálogo |
| Páginas internas legadas (`leis`, `gestao-fiscal`) | Sem entrada no admin | Configuráveis (`ocultoNoMenu: true`) |

---

## 4. Riscos remanescentes e mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Admin salva ambos endpoints em paralelo. Se um falha e outro sucede, estado fica parcial. | Baixa | Toast unificado avisa se houve falha. Próxima abertura mostra estado real do banco. |
| Cache memory pode ficar stale em deploy multi-instância (Vercel) | Baixa | TTL 5min limita o estrago. Invalidação acontece em qualquer instância via POST. Aceitável. |
| Slug `mesa-diretora` está no catálogo MAS página `/transparencia/mesa-diretora` não usa `TransparenciaPageWrapper` | Baixa | Configuração admin para `mesa-diretora` afeta apenas o link no menu da home. Aceitável pois a página em si é uma listagem fixa. |
| Configs antigas para slugs nunca usados (ex: salvas via API direta) podem existir | Muito Baixa | Não afetam o sistema; ficam órfãs no banco. Limpeza manual via SQL se necessário. |

---

## 5. Conclusão

✅ **A refatoração está completa, correta e atende PNTP 2026.**

Ganhos principais:
1. **Cobertura administrativa total** — admin configura QUALQUER item do portal (antes: 14, agora: 80)
2. **Série Histórica endereçada** — gain de até 20% do score PNTP por critério via configuração de períodos
3. **Migração de portais habilitada** — modo redirect direto resolve a transição entre sistemas
4. **Fonte única da verdade** — catálogo centralizado elimina divergência entre home e admin
5. **Retrocompatibilidade** — 10 slugs legados como `ocultoNoMenu` preservam configs antigas

Nenhum critério PNTP foi prejudicado. O critério de Série Histórica passa de "depende de cada página implementar isoladamente" para "qualquer item pode ser configurado pelo admin com poucos cliques".

---

## 6. Arquivos da revisão

### Criados nesta revisão
- `src/lib/transparencia/itens-catalogo.ts` (tipos `MenuResolvido` etc. agora aqui)
- `src/lib/transparencia/itens-icones.tsx`
- `src/app/api/transparencia/menu/route.ts`
- `docs/TRANSPARENCIA-CONFIG-ITENS.md`
- `docs/TRANSPARENCIA-REVISAO-2026-05-27.md` (este arquivo)

### Modificados nesta revisão
- `src/app/transparencia/page.tsx` (import de tipos vindo do catálogo)
- `src/app/admin/configuracoes/transparencia-periodos/page.tsx` (auto-reset slug + validação client + aviso oculto)
- `src/lib/cache/memory-cache.ts` (TRANSPARENCIA_MENU + invalidação)
- `src/app/api/transparencia/periodos/route.ts` (invalida menu cache)
- `ESTADO-ATUAL.md`

### Mantidos sem alteração (verificados OK)
- `src/components/layout/header.tsx` (link top-bar para `/transparencia`)
- `src/components/layout/footer.tsx` (RadarBadge + links)
- `src/lib/services/transparencia-redirect-service.ts` (TRANSPARENCIA_CATEGORIAS legado mantido p/ compat)
- `src/components/transparencia/transparencia-page-wrapper.tsx` (continua consultando os mesmos endpoints)
- `src/lib/hooks/use-transparencia-periodos.ts` (continua funcional para wrapper)
