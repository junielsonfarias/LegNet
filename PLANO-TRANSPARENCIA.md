# Plano de Implementacao - Area de Transparencia

> **Data de Criacao**: 2026-01-19
> **Objetivo**: Tornar 100% da area de transparencia funcional com dados reais do banco de dados
> **Status**: EM EXECUCAO

---

## Resumo do Plano

| Fase | Descricao | Estimativa | Status |
|------|-----------|------------|--------|
| 1 | Criar Modelos no Prisma | - | [x] CONCLUIDA |
| 2 | Criar APIs CRUD | - | [ ] EM ANDAMENTO |
| 3 | Criar Paineis Admin | - | [ ] Pendente |
| 4 | Atualizar Paginas do Portal | - | [ ] Pendente |
| 5 | Revisao e Testes | - | [ ] Pendente |

---

## FASE 1: Criar Modelos no Prisma

### 1.1 Modelo Licitacao
- [x] Criar modelo `Licitacao` no schema.prisma
- [x] Criar modelo `LicitacaoDocumento` para anexos
- [x] Criar enums: `ModalidadeLicitacao`, `SituacaoLicitacao`, `TipoLicitacao`
- [x] Executar `db:push`

**Campos do modelo Licitacao:**
```
- id, numero, ano, modalidade, tipo, objeto
- valorEstimado, dataAbertura, horaAbertura
- dataPublicacao, dataEntregaPropostas
- situacao, unidadeGestora, linkEdital
- observacoes, createdAt, updatedAt
```

### 1.2 Modelo Contrato
- [x] Criar modelo `Contrato` no schema.prisma
- [x] Criar modelo `ContratoAditivo` para aditivos (via auto-relacao)
- [x] Criar enums: `ModalidadeContrato`, `SituacaoContrato`
- [x] Executar `db:push`

**Campos do modelo Contrato:**
```
- id, numero, ano, modalidade, objeto
- contratado, cnpjCpf, valorTotal
- dataAssinatura, vigenciaInicio, vigenciaFim
- fiscalContrato, situacao, licitacaoId
- arquivo, observacoes, createdAt, updatedAt
```

### 1.3 Modelo Convenio
- [x] Criar modelo `Convenio` no schema.prisma
- [x] Criar enums: `SituacaoConvenio`
- [x] Executar `db:push`

**Campos do modelo Convenio:**
```
- id, numero, ano, convenente, cnpjConvenente
- orgaoConcedente, objeto, programa, acao
- valorTotal, valorRepasse, valorContrapartida
- dataCelebracao, vigenciaInicio, vigenciaFim
- responsavelTecnico, situacao, fonteRecurso
- arquivo, observacoes, createdAt, updatedAt
```

### 1.4 Modelo Receita
- [x] Criar modelo `Receita` no schema.prisma
- [x] Criar enums: `CategoriaReceita`, `OrigemReceita`, `SituacaoReceita`
- [x] Executar `db:push`

**Campos do modelo Receita:**
```
- id, numero, ano, mes, data
- contribuinte, cnpjCpf, unidade
- categoria, origem, especie, rubrica
- valorPrevisto, valorArrecadado
- situacao, fonteRecurso
- observacoes, createdAt, updatedAt
```

### 1.5 Modelo Despesa
- [x] Criar modelo `Despesa` no schema.prisma
- [x] Criar enums: `SituacaoDespesa`
- [x] Executar `db:push`

**Campos do modelo Despesa:**
```
- id, numeroEmpenho, ano, mes, data
- credor, cnpjCpf, unidade
- elemento, funcao, subfuncao, programa, acao
- valorEmpenhado, valorLiquidado, valorPago
- situacao, fonteRecurso, modalidade
- licitacaoId, contratoId, convenioId
- observacoes, createdAt, updatedAt
```

### 1.6 Modelo Servidor e FolhaPagamento
- [x] Criar modelo `Servidor` no schema.prisma
- [x] Criar modelo `FolhaPagamento` no schema.prisma
- [x] Criar enums: `SituacaoServidor`, `VinculoServidor`
- [x] Executar `db:push`

**Campos do modelo Servidor:**
```
- id, nome, cpf, matricula
- cargo, funcao, unidade, lotacao
- vinculo, dataAdmissao, dataDesligamento
- salarioBruto, situacao
- observacoes, createdAt, updatedAt
```

**Campos do modelo FolhaPagamento:**
```
- id, competencia, mes, ano
- totalServidores, totalBruto, totalDeducoes, totalLiquido
- dataProcessamento, situacao
- observacoes, createdAt, updatedAt
```

### 1.7 Modelo BemPatrimonial
- [x] Criar modelo `BemPatrimonial` no schema.prisma
- [x] Criar enums: `TipoBem`, `SituacaoBem`
- [x] Executar `db:push`

**Campos do modelo BemPatrimonial:**
```
- id, tipo (MOVEL, IMOVEL), tombamento
- descricao, especificacao
- dataAquisicao, valorAquisicao, valorAtual
- localizacao, responsavel, situacao
- matriculaImovel, enderecoImovel, areaImovel (para imoveis)
- observacoes, createdAt, updatedAt
```

---

## FASE 2: Criar APIs CRUD

### 2.1 API de Licitacoes
- [ ] Criar `src/app/api/licitacoes/route.ts` (GET, POST)
- [ ] Criar `src/app/api/licitacoes/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Adicionar validacao Zod
- [ ] Testar endpoints

### 2.2 API de Contratos
- [ ] Criar `src/app/api/contratos/route.ts` (GET, POST)
- [ ] Criar `src/app/api/contratos/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Adicionar validacao Zod
- [ ] Testar endpoints

### 2.3 API de Convenios
- [ ] Criar `src/app/api/convenios/route.ts` (GET, POST)
- [ ] Criar `src/app/api/convenios/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Adicionar validacao Zod
- [ ] Testar endpoints

### 2.4 API de Receitas
- [ ] Criar `src/app/api/receitas/route.ts` (GET, POST)
- [ ] Criar `src/app/api/receitas/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Adicionar validacao Zod
- [ ] Testar endpoints

### 2.5 API de Despesas
- [ ] Criar `src/app/api/despesas/route.ts` (GET, POST)
- [ ] Criar `src/app/api/despesas/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Adicionar validacao Zod
- [ ] Testar endpoints

### 2.6 API de Servidores e Folha
- [ ] Criar `src/app/api/servidores/route.ts` (GET, POST)
- [ ] Criar `src/app/api/servidores/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Criar `src/app/api/folha-pagamento/route.ts` (GET, POST)
- [ ] Criar `src/app/api/folha-pagamento/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Adicionar validacao Zod
- [ ] Testar endpoints

### 2.7 API de Bens Patrimoniais
- [ ] Criar `src/app/api/bens-patrimoniais/route.ts` (GET, POST)
- [ ] Criar `src/app/api/bens-patrimoniais/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Adicionar validacao Zod
- [ ] Testar endpoints

---

## FASE 3: Criar Paineis Admin

### 3.1 Admin de Licitacoes
- [ ] Criar `src/app/admin/licitacoes/page.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar formulario de criacao/edicao
- [ ] Implementar exclusao com confirmacao
- [ ] Criar hook `use-licitacoes.ts`

### 3.2 Admin de Contratos
- [ ] Criar `src/app/admin/contratos/page.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar formulario de criacao/edicao
- [ ] Implementar exclusao com confirmacao
- [ ] Criar hook `use-contratos.ts`

### 3.3 Admin de Convenios
- [ ] Criar `src/app/admin/convenios/page.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar formulario de criacao/edicao
- [ ] Implementar exclusao com confirmacao
- [ ] Criar hook `use-convenios.ts`

### 3.4 Admin de Receitas
- [ ] Criar `src/app/admin/receitas/page.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar formulario de criacao/edicao
- [ ] Implementar exclusao com confirmacao
- [ ] Criar hook `use-receitas.ts`

### 3.5 Admin de Despesas
- [ ] Criar `src/app/admin/despesas/page.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar formulario de criacao/edicao
- [ ] Implementar exclusao com confirmacao
- [ ] Criar hook `use-despesas.ts`

### 3.6 Admin de Servidores/Folha
- [ ] Criar `src/app/admin/servidores/page.tsx`
- [ ] Criar `src/app/admin/folha-pagamento/page.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar formularios
- [ ] Criar hooks `use-servidores.ts` e `use-folha-pagamento.ts`

### 3.7 Admin de Bens Patrimoniais
- [ ] Criar `src/app/admin/bens-patrimoniais/page.tsx`
- [ ] Implementar listagem com filtros (moveis e imoveis)
- [ ] Implementar formulario de criacao/edicao
- [ ] Criar hook `use-bens-patrimoniais.ts`

---

## FASE 4: Atualizar Paginas do Portal

### 4.1 Pagina de Licitacoes
- [ ] Remover dados mockados de `src/app/transparencia/licitacoes/page.tsx`
- [ ] Integrar com API `/api/licitacoes`
- [ ] Manter filtros funcionais
- [ ] Testar exibicao de dados

### 4.2 Pagina de Contratos
- [ ] Remover dados mockados de `src/app/transparencia/contratos/page.tsx`
- [ ] Integrar com API `/api/contratos`
- [ ] Manter filtros funcionais
- [ ] Testar exibicao de dados

### 4.3 Pagina de Convenios
- [ ] Remover dados mockados de `src/app/transparencia/convenios/page.tsx`
- [ ] Integrar com API `/api/convenios`
- [ ] Manter filtros funcionais
- [ ] Testar exibicao de dados

### 4.4 Pagina de Receitas
- [ ] Remover dados mockados de `src/app/transparencia/receitas/page.tsx`
- [ ] Integrar com API `/api/receitas`
- [ ] Manter filtros e estatisticas funcionais
- [ ] Testar exibicao de dados

### 4.5 Pagina de Despesas
- [ ] Remover dados mockados de `src/app/transparencia/despesas/page.tsx`
- [ ] Integrar com API `/api/despesas`
- [ ] Manter filtros e estatisticas funcionais
- [ ] Testar exibicao de dados

### 4.6 Pagina de Folha de Pagamento
- [ ] Remover dados mockados de `src/app/transparencia/folha-pagamento/page.tsx`
- [ ] Integrar com APIs `/api/servidores` e `/api/folha-pagamento`
- [ ] Manter abas (Servidores e Folhas)
- [ ] Testar exibicao de dados

### 4.7 Paginas de Bens Moveis e Imoveis
- [ ] Atualizar `src/app/transparencia/bens-moveis/page.tsx`
- [ ] Atualizar `src/app/transparencia/bens-imoveis/page.tsx`
- [ ] Integrar com API `/api/bens-patrimoniais`
- [ ] Testar exibicao de dados

---

## FASE 5: Revisao e Testes

### 5.1 Verificacao de Build
- [ ] Executar `npm run build`
- [ ] Corrigir erros de compilacao
- [ ] Verificar warnings

### 5.2 Testes Funcionais
- [ ] Testar CRUD de Licitacoes (criar, listar, editar, excluir)
- [ ] Testar CRUD de Contratos
- [ ] Testar CRUD de Convenios
- [ ] Testar CRUD de Receitas
- [ ] Testar CRUD de Despesas
- [ ] Testar CRUD de Servidores/Folha
- [ ] Testar CRUD de Bens Patrimoniais

### 5.3 Verificacao Portal
- [ ] Verificar `/transparencia/licitacoes` exibe dados do banco
- [ ] Verificar `/transparencia/contratos` exibe dados do banco
- [ ] Verificar `/transparencia/convenios` exibe dados do banco
- [ ] Verificar `/transparencia/receitas` exibe dados do banco
- [ ] Verificar `/transparencia/despesas` exibe dados do banco
- [ ] Verificar `/transparencia/folha-pagamento` exibe dados do banco
- [ ] Verificar `/transparencia/bens-moveis` exibe dados do banco
- [ ] Verificar `/transparencia/bens-imoveis` exibe dados do banco

### 5.4 Documentacao
- [ ] Atualizar ESTADO-ATUAL.md
- [ ] Marcar todas as tarefas como concluidas neste arquivo
- [ ] Fazer commit final

---

## Arquivos a Criar

### Schema Prisma (1 arquivo)
- `prisma/schema.prisma` (modificar)

### APIs (14 arquivos)
- `src/app/api/licitacoes/route.ts`
- `src/app/api/licitacoes/[id]/route.ts`
- `src/app/api/contratos/route.ts`
- `src/app/api/contratos/[id]/route.ts`
- `src/app/api/convenios/route.ts`
- `src/app/api/convenios/[id]/route.ts`
- `src/app/api/receitas/route.ts`
- `src/app/api/receitas/[id]/route.ts`
- `src/app/api/despesas/route.ts`
- `src/app/api/despesas/[id]/route.ts`
- `src/app/api/servidores/route.ts`
- `src/app/api/servidores/[id]/route.ts`
- `src/app/api/folha-pagamento/route.ts`
- `src/app/api/folha-pagamento/[id]/route.ts`
- `src/app/api/bens-patrimoniais/route.ts`
- `src/app/api/bens-patrimoniais/[id]/route.ts`

### Hooks (7 arquivos)
- `src/lib/hooks/use-licitacoes.ts`
- `src/lib/hooks/use-contratos.ts`
- `src/lib/hooks/use-convenios.ts`
- `src/lib/hooks/use-receitas.ts`
- `src/lib/hooks/use-despesas.ts`
- `src/lib/hooks/use-servidores.ts`
- `src/lib/hooks/use-folha-pagamento.ts`
- `src/lib/hooks/use-bens-patrimoniais.ts`

### Admin Pages (7 arquivos)
- `src/app/admin/licitacoes/page.tsx` (modificar existente)
- `src/app/admin/contratos/page.tsx`
- `src/app/admin/convenios/page.tsx`
- `src/app/admin/receitas/page.tsx`
- `src/app/admin/despesas/page.tsx`
- `src/app/admin/servidores/page.tsx`
- `src/app/admin/folha-pagamento/page.tsx`
- `src/app/admin/bens-patrimoniais/page.tsx`

### Portal Pages (7 arquivos a modificar)
- `src/app/transparencia/licitacoes/page.tsx`
- `src/app/transparencia/contratos/page.tsx`
- `src/app/transparencia/convenios/page.tsx`
- `src/app/transparencia/receitas/page.tsx`
- `src/app/transparencia/despesas/page.tsx`
- `src/app/transparencia/folha-pagamento/page.tsx`
- `src/app/transparencia/bens-moveis/page.tsx`
- `src/app/transparencia/bens-imoveis/page.tsx`

---

## Historico de Execucao

### 2026-01-19 - Inicio da Implementacao
- [ ] Plano criado
- [ ] Iniciando FASE 1...

