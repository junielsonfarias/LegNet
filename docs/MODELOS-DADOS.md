# Modelos de Dados (Prisma)

> Referencia completa dos modelos de dados do projeto.
> Documento separado do CLAUDE.md principal.

---

## Autenticacao e Usuarios

- **User**: Usuarios do sistema com roles (ADMIN, EDITOR, USER, PARLAMENTAR, OPERADOR, SECRETARIA)
- **Account, Session, VerificationToken**: NextAuth.js

---

## Legislativo

- **Legislatura**: Mandatos legislativos (anoInicio, anoFim, ativa)
- **PeriodoLegislatura**: Periodos dentro de uma legislatura
- **Parlamentar**: Vereadores com foto, biografia, partido, cargo
- **Mandato**: Mandatos de parlamentares por legislatura
- **Filiacao**: Historico de filiacoes partidarias

---

## Sessoes

- **Sessao**: Sessoes legislativas (ORDINARIA, EXTRAORDINARIA, SOLENE, ESPECIAL)
- **PresencaSessao**: Controle de presenca
- **PautaSessao**: Pauta da sessao com itens
- **PautaItem**: Itens da pauta (proposicoes, comunicacoes, etc)

---

## Proposicoes

- **Proposicao**: Projetos de lei, requerimentos, mocoes, etc
- **TipoProposicao**: PROJETO_LEI, PROJETO_RESOLUCAO, INDICACAO, REQUERIMENTO, MOCAO, etc
- **StatusProposicao**: APRESENTADA, EM_TRAMITACAO, APROVADA, REJEITADA, ARQUIVADA
- **Votacao**: Votos individuais (SIM, NAO, ABSTENCAO, AUSENTE)

---

## Comissoes

- **Comissao**: Comissoes (PERMANENTE, TEMPORARIA, ESPECIAL, INQUERITO)
- **MembroComissao**: Membros com cargos (PRESIDENTE, VICE_PRESIDENTE, RELATOR, MEMBRO)

---

## Mesa Diretora

- **MesaDiretora**: Mesa diretora de um periodo
- **MembroMesaDiretora**: Membros da mesa
- **CargoMesaDiretora**: Cargos da mesa diretora
- **HistoricoParticipacao**: Historico de participacoes

---

## Tramitacao

- **Tramitacao**: Tramitacao de proposicoes
- **TramitacaoTipo**: Tipos de tramitacao com prazos
- **TramitacaoUnidade**: Unidades (COMISSAO, MESA_DIRETORA, PLENARIO, PREFEITURA)
- **TramitacaoHistorico**: Historico de movimentacoes
- **RegraTramitacao**: Regras automaticas de tramitacao

---

## Publicacoes

- **Publicacao**: Leis, decretos, portarias, resolucoes
- **CategoriaPublicacao**: Categorias dinamicas
- **Noticia**: Noticias do portal

---

## Controle

- **Configuracao**: Configuracoes do sistema
- **ConfiguracaoInstitucional**: Dados da casa legislativa
- **AuditLog**: Log de auditoria de acoes
- **ApiToken**: Tokens para integracao externa

---

## Regras de Negocio dos Modelos

### Sessoes Legislativas

1. **Tipos de Sessao**:
   - ORDINARIA: Sessoes regulares conforme calendario
   - EXTRAORDINARIA: Convocadas para assuntos urgentes
   - SOLENE: Homenagens e datas comemorativas
   - ESPECIAL: Eventos especiais

2. **Status de Sessao**:
   - AGENDADA -> EM_ANDAMENTO -> CONCLUIDA
   - AGENDADA -> CANCELADA (se necessario)

3. **Pauta de Sessao**:
   - Secoes: EXPEDIENTE, ORDEM_DO_DIA, COMUNICACOES, HONRAS, OUTROS
   - Status dos itens: PENDENTE, EM_DISCUSSAO, EM_VOTACAO, APROVADO, REJEITADO, RETIRADO, ADIADO

### Proposicoes

1. **Fluxo de Tramitacao**:
   - APRESENTADA -> EM_TRAMITACAO -> APROVADA/REJEITADA/ARQUIVADA
   - Pode passar por comissoes antes do plenario

2. **Numeracao**:
   - Formato: NUMERO/ANO (ex: 001/2024)
   - Sequencial por tipo e ano

3. **Tipos de Votacao**:
   - SIM, NAO, ABSTENCAO, AUSENTE
   - Resultado: APROVADA, REJEITADA, EMPATE

### Mesa Diretora

1. **Composicao**: Presidente, Vice-Presidente, Secretarios
2. **Mandato**: Vinculado ao periodo da legislatura
3. **Apenas um membro ativo por cargo por vez

### Comissoes

1. **Tipos**: PERMANENTE, TEMPORARIA, ESPECIAL, INQUERITO
2. **Cargos**: PRESIDENTE, VICE_PRESIDENTE, RELATOR, MEMBRO
3. **Membro pode participar de multiplas comissoes

---

## Roles do Sistema

```typescript
enum UserRole {
  ADMIN       // Acesso total ao sistema
  EDITOR      // Pode editar conteudo (noticias, publicacoes)
  USER        // Acesso basico de leitura
  PARLAMENTAR // Acesso a area do parlamentar
  OPERADOR    // Opera painel eletronico
  SECRETARIA  // Acesso administrativo limitado
}
```

### Protecao de Rotas

- **Publicas**: /, /parlamentares, /transparencia, /legislativo, /noticias
- **Autenticadas**: /admin/*, /api/* (maioria)
- **Publicas API**: /api/integracoes/public/*, /api/publico/*
