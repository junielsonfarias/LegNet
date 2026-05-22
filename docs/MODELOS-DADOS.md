# Modelos de Dados (Prisma)

> Referencia consolidada dos modelos Prisma do projeto. **127 modelos** ativos
> (`prisma/schema/models.prisma`). Documento referenciado pelo CLAUDE.md.

> **Ultima atualizacao**: 2026-05-22 (Commits C/E/F — gaps CR2/PNTP, +7 modelos). Atualizado quando schema muda.

---

## Multi-tenant

- **Tenant**: tenant raiz (multi-tenant via slug/host). Identificado em
  middleware via `tenant-resolver.ts`.

---

## Autenticacao e Usuarios

- **User**: usuarios do sistema com roles (ADMIN, EDITOR, USER, PARLAMENTAR,
  OPERADOR, SECRETARIA, AUXILIAR_LEGISLATIVO). Campos `twoFactorSecret` e
  `twoFactorBackupCodes` criptografados (RN-156). 2FA condicional via
  `Configuracao.seguranca.2fa.enabled` (RN-144).
- **Account, Session, VerificationToken**: NextAuth.js.
- **ApiToken**: tokens para integracao externa, com `expiresAt`.
- **SecurityAlert**: registro de incidentes de seguranca (login suspeito,
  brute-force, etc).

---

## Legislativo — Estrutura politica

- **Legislatura**: mandatos legislativos (anoInicio, anoFim, ativa).
- **PeriodoLegislatura**: periodos (anos) dentro de uma legislatura.
- **Parlamentar**: vereadores. Inclui `bensDeclarados Json?`,
  `incompatibilidades Json?`, `suplenteDeId?` (Sprint 4 PNTP).
- **Mandato**: vinculo Parlamentar x Legislatura, com `numeroVotos`, `cargo`,
  `dataInicio/Fim`.
- **Filiacao**: historico de filiacoes partidarias.
- **Bancada**: bancada partidaria com lider e vice-lider.

---

## Legislativo — Sessoes

- **Sessao**: sessoes legislativas (ORDINARIA, EXTRAORDINARIA, SOLENE,
  ESPECIAL, CONVOCADA). Inclui `urlAudio/Video/Transmissao`, `arquivoPauta`,
  `arquivoAta`, `statusAta`, `sessaoAprovacaoAtaId` (Sprint 4 PNTP).
- **PresencaSessao**: controle de presenca em plenario.
- **PresencaOrdemDia**: presenca especifica para ordem do dia.
- **MesaSessao**, **MembroMesaSessao**: mesa que presidiu uma sessao
  especifica (separada da Mesa Diretora).
- **OradorSessao**: oradores inscritos (tipo, ordem, tempo).
- **QuestaoOrdem**: questoes de ordem levantadas em sessao.
- **ExpedienteSessao**, **TipoExpediente**: conteudo do expediente.

---

## Legislativo — Pauta

- **PautaSessao**: pauta da sessao (status, `dataPublicacao` RN-122).
- **PautaItem**: itens da pauta com `secao`, `ordem`, `tipoAcao`
  (LEITURA/VOTACAO/etc), turnos (1 e 2), pedido de vista,
  `sessaoAtaOrigemId`, `oficioId`, `parecerId`, `relatorId`.
- **DestaquePautaItem**: destaques (artigo, emenda) votados em separado.
- **SessaoTemplate**, **TemplateItem**: templates de sessao para auto-gerar
  pauta.

---

## Legislativo — Proposicoes

- **Proposicao**: PL/PLC/PDL/PR/IND/REQ/MOC/PI. Inclui `textoFinal`,
  `entradaRetroativa` (RN-159), `dataApresentacao`, `dataVotacao`.
- **TipoProposicaoConfig**: configuracao por tipo (`requerVotacao`,
  `requerSancao`, `requerParecerCLJ`, `quorumAplicacao`, `totalTurnos`,
  `intersticioDias`).
- **Votacao**: votos individuais (SIM, NAO, ABSTENCAO, AUSENTE).
- **VotacaoAgrupada**: agregacao por turno (votosSim/Nao/Abstencao/Ausente,
  quorum, `votoMinerva`).
- **Emenda**, **VotoEmenda**: emendas e votacoes correspondentes.
- **Parecer**, **VotoParecerComissao**: pareceres de comissao.

---

## Legislativo — Comissoes

- **Comissao**: PERMANENTE, TEMPORARIA, ESPECIAL, INQUERITO (CPI).
- **MembroComissao**: membros com cargos (PRESIDENTE, VICE, RELATOR, MEMBRO).
- **ReuniaoComissao**, **PautaReuniaoComissao**, **PresencaReuniaoComissao**:
  reunioes de comissao com sua propria pauta e presenca.
- **HistoricoParticipacao**: trilha auditavel de quem participou de qual
  comissao em qual periodo.

---

## Legislativo — Mesa Diretora

- **MesaDiretora**: mesa de um periodo (composicao oficial).
- **MembroMesaDiretora**: vinculo Parlamentar x CargoMesa x periodo.
- **CargoMesaDiretora**: cargos (PRESIDENTE, VICE, 1o/2o SECRETARIO, etc).

---

## Legislativo — Tramitacao

- **Tramitacao**: movimentacao da proposicao entre unidades.
- **TramitacaoTipo**: tipos com prazos.
- **TramitacaoUnidade**: COMISSAO, MESA_DIRETORA, PLENARIO, PREFEITURA, etc.
- **TramitacaoHistorico**: trilha completa.
- **TramitacaoNotificacao**: notificacoes automaticas por etapa.
- **TramitacaoTipoProposicao**: mapeamento tipo proposicao x fluxo padrao.
- **FluxoTramitacao**, **FluxoTramitacaoEtapa**: fluxos configuraveis.
- **RegraTramitacao**, **RegraTramitacaoEtapa**: regras automaticas
  (condicoes -> acoes -> notificacoes).
- **ConfiguracaoTramitacao**: configuracoes globais.

---

## Legislativo — Normas Juridicas

- **NormaJuridica**: leis, decretos, resolucoes, regimento interno,
  CODIGO_ETICA (Sprint 6). Campos: `orgaoEmissor`, `aplicavelA`,
  `diarioOficial Json?`.
- **ArtigoNorma**, **ParagrafoNorma**: estrutura hierarquica.
- **AlteracaoNorma**, **VersaoNorma**: historico de alteracoes.
- **Publicacao**, **CategoriaPublicacao**: publicacoes derivadas (leis,
  decretos publicados no diario oficial municipal).
- **Oficio**: oficios expedidos/recebidos.

---

## Protocolo

- **Protocolo**: protocolo unico do sistema (numerador anual).
- **ProtocoloProposicao**: vinculo protocolo x proposicao.
- **ProtocoloTramitacao**: trilha de tramitacao do protocolo.
- **ProtocoloAnexo**: documentos anexados ao protocolo.

---

## Autores (proposicoes)

- **Autor**: pessoas/entidades que podem apresentar proposicao
  (parlamentar, comissao, prefeito, cidadao, etc).
- **TipoAutor**: classificacao do autor.

---

## Transparencia (PNTP)

- **TransparenciaConteudo**: conteudo textual customizavel por categoria.
- **DocumentoTransparencia**: documentos para transparencia (rota dinamica
  `/transparencia/documentos/[tipo]`).
- **RedirectConfig**: toggle por slug para apontar pagina publica para URL
  externa (commit d29c602).
- **Contrato**, **Convenio**, **Licitacao**, **LicitacaoDocumento**:
  contratacao publica.
- **Despesa**, **Receita**, **OrdemPagamento**, **NotaFiscal**: financeiro.
  Despesa tem FK para `licitacaoId`, `contratoId`, `convenioId`.
- **BemPatrimonial**: bens (MOVEL/IMOVEL) com tombamento.
- **Veiculo**: frota.
- **Servidor**: quadro de pessoal. **CPF criptografado** (AES-256-GCM,
  RN-156) + `cpfHash` (SHA-256, unique).
- **FolhaPagamento**, **Diaria**: folha e diarias.
- **Concurso**: concursos publicos.
- **AudienciaPublica**: audiencias (`participantes/documentos/atas/
  transcricoes/cronograma` em campos JSON).
- **CotaParlamentar**: cotas para exercicio da atividade parlamentar
  (commit ddae949). `mes Int?` (null = "Ano Inteiro" — declaracao anual),
  `tipo` (DECLARACAO|GASTO), `documentos Json?`.
- **VerbaIndenizatoria**: verbas indenizatorias parlamentares (legado).
- **Repasse**, **CartaoCorporativo**, **ProgramaAcao**, **ServicoOnline**,
  **FornecedorSancionado**: outros itens PNTP.
- **Obra**: obras publicas (com filtro `?situacao=PARALISADA`).
- **UnidadeOrganizacional**: organograma hierarquico.
- **PlanoCargos**, **Cargo**: plano de cargos e relacao de cargos com
  remuneracao base (gaps CR2, Commit C). `Cargo` tem FK opcional para
  `PlanoCargos` (`onDelete: SetNull`); `tipo` String
  (EFETIVO|COMISSIONADO|FUNCAO_GRATIFICADA|ELETIVO).
- **ValorDiariaTabela**: tabela de valores de diaria por categoria e
  abrangencia (Commit C).
- **Fornecedor**: cadastro de fornecedores habilitados (Commit C). GET
  da API protegido; CPF de pessoa fisica mascarado na pagina publica
  via `maskCpfOrCnpj` (Commit D).
- **DocumentoClassificado**: rol de informacoes classificadas e
  desclassificadas (LAI Art. 30, Commit E). `grau`
  (RESERVADA|SECRETA|ULTRASSECRETA), `situacao`
  (CLASSIFICADA|DESCLASSIFICADA), prazos de sigilo.
- **PerguntaFrequente**: perguntas frequentes (FAQ) do portal (Commit F).
- **AgendaParlamentar**: agenda externa de parlamentares (Commit F).
  Padrao snapshot `parlamentarId` + `parlamentarNome`, sem FK formal
  (como `CotaParlamentar`).

---

## Cidadao (LAI + Participacao)

- **SolicitacaoESIC**: pedido de acesso a informacao. **CPF criptografado**
  (RN-166) + `cpfHash`. Status granular por instancia
  (RECURSO_PRIMEIRA_INSTANCIA, RECURSO_SEGUNDA_INSTANCIA).
- **AnexoESIC**, **RecursoESIC** (com `instancia`), **HistoricoESIC**.
- **ManifestacaoOuvidoria**: reclamacao/elogio/sugestao/denuncia.
  **CPF criptografado** (RN-166) + `cpfHash`. Suporta anonimo.
- **AnexoOuvidoria**, **HistoricoOuvidoria**.
- **ConsultaPublica**, **ParticipacaoConsulta**, **PerguntaConsulta**,
  **RespostaConsulta**: consultas publicas.
- **SugestaoLegislativa**, **ApoioSugestao**: sugestoes do cidadao.
- **ConteudoEducativo**: textos da "Camara Explica".

---

## Configuracao & Sistema

- **Configuracao**: configuracoes chave/valor do sistema.
- **ConfiguracaoInstitucional**: dados da casa (nome, CNPJ, endereco,
  contato, cores `corPrimaria/Secundaria/Acento`).
- **ConfiguracaoSnapshot**: snapshots para rollback de configuracao.
- **ConfiguracaoQuorum**: quorum por tipo de proposicao.
- **Noticia**: noticias do portal.

---

## Notificacoes

- **NotificacaoMulticanal**: notificacoes por canal (email, SMS, push, etc).
- **Favorito**: favoritos do usuario.

---

## Auditoria & Logs

- **AuditLog**: trilha imutavel (RN-154). Trigger PostgreSQL bloqueia
  UPDATE/DELETE.
- **DashboardPersonalizado**: dashboards customizados.
- **ExecucaoRelatorio**, **RelatorioAgendado**: relatorios.

---

## Regras de Negocio dos Modelos

### Sessoes
- Tipos: ORDINARIA, EXTRAORDINARIA, SOLENE, ESPECIAL, CONVOCADA.
- Status: AGENDADA -> EM_ANDAMENTO -> CONCLUIDA (ou CANCELADA).
- Ata: CONCLUIDA -> PENDENTE (statusAta) -> APROVADA na sessao N+1.

### Proposicoes
- Fluxo: APRESENTADA -> EM_TRAMITACAO -> APROVADA/REJEITADA/ARQUIVADA.
- Numeracao: NUMERO/ANO (ex: 001/2026), sequencial por tipo e ano.
- Retroativa: RN-159 permite registro pos-sessao com `entradaRetroativa=true`.

### Votacao
- Tipos de voto: SIM, NAO, ABSTENCAO, AUSENTE.
- Resultado: APROVADA, REJEITADA, EMPATE (votoMinerva permite desempate).

### Mesa Diretora
- Apenas um membro ativo por cargo (`@@unique([mesaDiretoraId, cargoId, ativo])`).
- Substituicao via dataFim na entrada antiga e nova entrada com ativo=true.

### Comissoes
- Membro pode participar de multiplas comissoes.
- Pareceres registrados antes da pauta plenaria (RN-030 quando aplicavel).

### LGPD (Servidor/SolicitacaoESIC/ManifestacaoOuvidoria)
- CPF NUNCA armazenado em claro: AES-256-GCM (`encryption.ts`) + `cpfHash`
  para busca/uniqueness (RN-156, RN-166).
- Decriptografar exige permissao explicita; listagens usam mascaramento
  (`maskEncryptedCpf`).

---

## Roles do Sistema

```typescript
enum UserRole {
  ADMIN                // Acesso total ao sistema
  SECRETARIA           // Gestao legislativa completa
  AUXILIAR_LEGISLATIVO // Proposicoes, tramitacao, comissoes
  EDITOR               // Edita conteudo (noticias, publicacoes)
  OPERADOR             // Opera painel eletronico
  PARLAMENTAR          // Area do parlamentar
  USER                 // Leitura basica
}
```

### Protecao de Rotas

- **Publicas**: /, /parlamentares, /transparencia, /legislativo, /noticias,
  /institucional, /participacao-cidada
- **Autenticadas**: /admin/*, /api/* (maioria)
- **Publicas API**: /api/dados-abertos/*, /api/publico/*
