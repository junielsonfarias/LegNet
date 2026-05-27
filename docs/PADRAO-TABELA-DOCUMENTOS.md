# Padrão Tabela de Documentos (Cotas Parlamentar / RGF)

> **Data**: 2026-05-27
> **Origem**: Padrão visual aplicado em `/transparencia/cotas-parlamentar`, replicado em `/transparencia/documentos/[tipo]` (17 tipos automaticamente).

---

## Estrutura visual padrão

```
┌─────────────────────────────────────────────────────────┐
│ 📄 Título da Página           Home > Portal > Página    │
│ ← Voltar ao Portal da Transparência                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Regulamentação] [Exportar Dados]          │  ← Ações
│                                                         │
├─────────────────────────────────────────────────────────┤
│   Ano inicial  |  Ano final  |  Buscar...               │  ← Filtros
│                  [Limpar] [Pesquisar]                   │
├─────────────────────────────────────────────────────────┤
│ Período | Ano  | Título           | Descrição | 📁     │
│ Jan     | 2026 | RGF 1º quad/2026 | ...       | 📁     │
│ Mai     | 2026 | RGF 2º quad/2026 | ...       | 🌐     │  ← interno/externo
│ ...                                                     │
├─────────────────────────────────────────────────────────┤
│              ← 1 2 3 →                                  │  ← Paginação
└─────────────────────────────────────────────────────────┘
```

Ícones da coluna Documento:
- `📁` (FolderOpen) — documento hospedado internamente (`arquivo`)
- `🌐` (ExternalLink) — documento em sistema externo (`url`)

---

## Onde foi aplicado (2026-05-27)

### `/transparencia/documentos/[tipo]` — refatorado em batch

Os **17 tipos** de `DocumentoTransparencia` compartilham essa página e ganharam o padrão automaticamente:

| Slug do tipo | Label | Regulamentação |
|--------------|-------|----------------|
| `rgf` | Relatório de Gestão Fiscal (RGF) | Lei de Responsabilidade Fiscal |
| `ldo` | LDO - Lei de Diretrizes Orçamentárias | LRF Art. 4 |
| `loa` | LOA - Lei Orçamentária Anual | LRF Art. 5 |
| `ppa` | PPA - Plano Plurianual | Art. 165 CF |
| `plano-anual-contratacoes` | Plano Anual de Contratações | Lei 14.133/2021 |
| `planejamento-estrategico` | Planejamento Estratégico | Página de overview |
| `balancete-financeiro` | Balancete Financeiro | — |
| `balanco-anual` | Balanço e Relatórios Anuais | — |
| `parecer-tcm` | Parecer do Tribunal de Contas | — |
| `julgamento-contas` | Julgamento das Contas do Executivo | — |
| `relatorio-gestao` | Relatório de Gestão | — |
| `carta-servicos` | Carta de Serviços ao Usuário | — |
| `lgpd` | LGPD e Governo Digital | — |
| `plano-dados-abertos` | Plano de Dados Abertos | — |
| `regulamento-ouvidoria` | Regulamento da Ouvidoria | — |
| `politica-privacidade` | Política de Privacidade (LGPD) | — |
| `regulamento-lai` | Regulamento Municipal da LAI | — |

### `/transparencia/cotas-parlamentar` — padrão original mantido

---

## 2 opções por documento individual (admin)

Em `/admin/transparencia/documentos`, ao criar/editar um `DocumentoTransparencia`, o gestor preenche **UM** dos dois campos:

| Campo | Quando usar | Ícone resultante |
|-------|-------------|------------------|
| `arquivo` (URL/path interno) | PDF hospedado em `/uploads/` ou similar | 📁 FolderOpen |
| `url` (URL externa) | Link para PDF em sistema externo (Portal do município, TCMPA etc.) | 🌐 ExternalLink |

Validação: pelo menos 1 dos 2 obrigatório. Não precisa preencher ambos.

---

## Onde mais aplicar (análise por página)

### ✅ Já no padrão tabular adequado
- `/transparencia/cotas-parlamentar`
- `/transparencia/restos-pagar`
- `/transparencia/cargos`
- `/transparencia/contratos`
- `/transparencia/licitacoes`
- `/transparencia/despesas`, `/receitas`, `/repasses`, `/convenios`
- `/transparencia/pessoal/remuneracao`, `/diarias`, `/concursos`
- `/transparencia/obras`, `/veiculos`

### ⚙️ Em formato cards — candidatas a migrar para padrão tabular
| Página | Justificativa | Prioridade |
|--------|--------------|------------|
| `/transparencia/atas-adesao-srp` | Lista atas com ano/número/documento | Média |
| `/transparencia/fornecedores-sancionados` | Lista de fornecedores com período | Baixa |
| `/transparencia/plano-cargos` | Já recém-criado, cards funcionam bem para PCCS | Baixa (manter) |
| `/transparencia/transmissao` | Página tem player único, não é listagem | Não aplicar |
| `/transparencia/legislaturas` | Cronologia visual, cards funcionam melhor | Não aplicar |

### 🚫 Não aplicar (não são listagens de documentos)
- `/transparencia/page.tsx` (home), `/busca`, `/conformidade`, `/mapa-do-site`
- `/transparencia/encarregado-dados` (informativo)
- `/transparencia/politica-privacidade` (página única, conteúdo HTML)
- `/transparencia/dados-abertos`, `/plano-dados-abertos`
- Sub-rotas `[id]` (detalhe de item único)

---

## Próximas iterações sugeridas

1. **Migrar atas-adesao-srp para tabela** (consistência com RGF/PCA, todos da seção Licitações)
2. **Padronizar fornecedores-sancionados em tabela** (atualmente lista simples)
3. **Para todos os tipos novos de DocumentoTransparencia**, o padrão é automático — basta adicionar entrada em `TIPO_CONFIG` em `src/app/transparencia/documentos/[tipo]/page.tsx`

---

## Como adicionar novo tipo de documento ao padrão

```ts
// src/app/transparencia/documentos/[tipo]/page.tsx
const TIPO_CONFIG: Record<string, TipoConfig> = {
  'meu-novo-tipo': {
    label: 'Meu Novo Tipo de Documento',
    enum: 'MEU_NOVO_ENUM_NO_PRISMA',
    regulamentacao: {  // opcional
      href: '/transparencia/lei-aplicavel',
      label: 'Lei Aplicável',
      externo: false,
    },
  },
  // ...outros tipos
}
```

Depois adicionar o enum `MEU_NOVO_ENUM_NO_PRISMA` em `TipoDocumentoTransparencia` (Prisma) via migration idempotente e em `TIPOS` no admin (`/admin/transparencia/documentos`).

---

## Referências

- Página de referência (visual original): `/transparencia/cotas-parlamentar/page.tsx`
- Página refatorada (17 tipos): `/transparencia/documentos/[tipo]/page.tsx`
- Admin de documentos: `/admin/transparencia/documentos/page.tsx`
- Service: `src/lib/services/...` (DocumentoTransparencia via Prisma direto)
