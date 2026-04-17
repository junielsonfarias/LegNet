# Capítulo 13 — Configurações Administrativas

Este capítulo é destinado ao **Administrador do sistema**. Aqui você configura o sistema inteiro: dados da instituição, identidade visual, usuários, perfis de acesso, regras de quorum, tipos de proposição, fluxos de tramitação, segurança e auditoria.

Neste capítulo você vai aprender a:

- Configurar dados institucionais e identidade visual
- Cadastrar e gerenciar usuários/servidores
- Configurar regras de quorum conforme regimento
- Criar tipos de proposição e tipos de tramitação
- Definir fluxos de tramitação customizados
- Auditar ações do sistema
- Gerenciar backups

> 🔒 **Requer permissão**: `config.manage` (Administrador; algumas áreas também Secretaria). Este capítulo assume perfil **Administrador**.

---

## 13.1 — Menu Configurações

Sidebar → ***Configurações*** (última categoria). Contém 15+ sub-itens.

![Menu Configurações](./images/13-01-menu-configuracoes.png)

Organizado em grupos:

| Grupo | Itens |
|---|---|
| **Institucional** | Geral, Identidade Visual |
| **Acesso** | Usuários, Segurança |
| **Legislativo** | Quorum, Tipos de Proposição, Tipos de Tramitação, Unidades, Fluxos, Tipos de Expediente, Autores |
| **Transparência** | Conteúdo, Links, Períodos (ver capítulo 9) |
| **Infraestrutura** | Backups, Monitoramento, Integrações, Auditoria |
| **Produtividade** | Templates de Sessão (ver capítulo 6) |

---

## 13.2 — Configurações Gerais

URL: `/admin/configuracoes`.

### 13.2.1 — Seção Institucional

![Configurações gerais](./images/13-02-geral-institucional.png)

| Campo | Observações |
|---|---|
| **Nome da Casa Legislativa** * | "Câmara Municipal de [Cidade]" |
| **Sigla** | Identificador curto (ex: "CMC") |
| **CNPJ** | Formato `00.000.000/0000-00` |
| **Logotipo** | Upload ou URL (SVG recomendado, máx 5 MB) |
| **Brasão** | Imagem do brasão oficial |
| **Endereço completo** | Logradouro, número, bairro, cidade, estado, CEP |
| **Telefone** | Geral da câmara |
| **E-mail** | Institucional |
| **Site** | URL oficial |
| **Facebook, Instagram, YouTube** | URLs das redes sociais |
| **Fuso Horário** | Padrão: America/Belem |
| **Legislatura atual** | Ex: "2025-2028" |

> 💡 **Dica**: esses dados aparecem no portal público (header, footer, páginas institucionais). Preencha **todos** para conformidade PNTP.

### 13.2.2 — Seção Sistema

Parâmetros técnicos:

| Parâmetro | Uso |
|---|---|
| **Tema padrão** | Claro / Escuro / Automático |
| **Idioma** | Português (BR) |
| **Timezone** | Para registro de datas/horas |
| **Formato de data** | dd/MM/yyyy padrão |
| **Moeda** | BRL |

### 13.2.3 — Exportar / Importar

- Botão **Exportar Configurações** — download JSON com tudo
- Botão **Importar** — restaura de arquivo JSON

> ⚠️ **Atenção**: importação sobrescreve configurações atuais. Exporte antes de testar nova config.

---

## 13.3 — Identidade Visual

URL: `/admin/configuracoes/identidade-visual`.

![Identidade visual](./images/13-03-identidade-visual.png)

### 13.3.1 — Cores

- **Cor Primária** — botões, links principais (picker + hex)
- **Cor Secundária** — badges, acentos
- **Cor de Acento** — destaques positivos

### 13.3.2 — Paletas predefinidas

8 paletas prontas:
- Azul Institucional (padrão)
- Verde Bandeira
- Vermelho Rubro
- Roxo Real
- Laranja Energia
- Turquesa Moderno
- Marinho Executivo
- Cinza Corporativo

Clique para aplicar imediatamente.

### 13.3.3 — Preview ao vivo

Miniatura no canto mostra como header, botões, cards ficarão.

### 13.3.4 — Upload de logos

- **Logo principal** (header do portal)
- **Logo alternativa** (header mobile)
- **Favicon** (aba do navegador)

Formatos aceitos: PNG, JPG, SVG. Tamanho ideal: SVG (vetorial, escala bem).

---

## 13.4 — Usuários

URL: `/admin/configuracoes/usuarios` (ou `/admin/usuarios`).

![Lista de usuários](./images/13-04-usuarios.png)

### 13.4.1 — Lista

Colunas: Nome, E-mail, Role, Status, Último acesso, Ações.

Filtros: busca por nome/e-mail, por role.

### 13.4.2 — Criar novo usuário

Botão **+ Novo Usuário**.

| Campo | Observações |
|---|---|
| **Nome completo** * | |
| **E-mail** * | Será usado para login. Único no sistema |
| **Role** * | Ver tabela de roles abaixo |
| **Parlamentar vinculado** | **Apenas se role = PARLAMENTAR** — select de parlamentares ativos |
| **Senha temporária** | Gerada automaticamente ou definida por você |
| **Forçar troca no primeiro acesso** | Padrão: sim (recomendado) |
| **Ativo** | Padrão: sim |

Clique **Criar**.

### 13.4.3 — Roles

| Role | Acesso |
|---|---|
| **ADMIN** | Tudo. Único que configura o sistema |
| **SECRETARIA** | Gestão legislativa completa (proposições, sessões, comissões, protocolo) |
| **AUXILIAR_LEGISLATIVO** | Apoio à Secretaria (proposições, tramitação, comissões) |
| **EDITOR** | Conteúdo público (notícias, publicações, transparência) |
| **OPERADOR** | Painel eletrônico durante sessões |
| **PARLAMENTAR** | Área própria (vota, consulta suas proposições) |
| **USER** | Leitura básica (pouco uso) |

### 13.4.4 — Editar usuário

Na lista, ícone ✏.

Permite:
- Mudar role (**atenção** — altera permissões imediatamente)
- Ativar/inativar
- Resetar senha (gera nova temporária)
- Desativar 2FA (se usuário perdeu o celular e não tem backup codes)

### 13.4.5 — Notificar usuário

Ao criar, o sistema envia e-mail automático com:
- Link de acesso
- Usuário (e-mail)
- Senha temporária
- Instrução para troca na primeira vez

---

## 13.5 — Segurança

URL: `/admin/configuracoes/seguranca`.

![Configurações de segurança](./images/13-05-seguranca.png)

### 13.5.1 — Políticas de senha

- **Comprimento mínimo** (padrão: 8)
- **Exigir letra maiúscula** (checkbox)
- **Exigir número** (checkbox)
- **Exigir caractere especial** (checkbox)
- **Validade (dias)** — força troca após X dias
- **Histórico de senhas** — não permite reutilizar últimas N senhas

### 13.5.2 — Rate limiting

- **Login**: 10 tentativas em 5 minutos
- **API**: 120 requisições por minuto
- Valores são **recomendados** — ajustar só se necessário

### 13.5.3 — 2FA

- **2FA obrigatório para ADMIN** (checkbox)
- **2FA obrigatório para SECRETARIA** (checkbox)
- **Permitir desabilitar** pelo próprio usuário (checkbox)

> 💡 **Dica**: torne 2FA obrigatório ao menos para ADMIN. É sua camada de proteção contra acesso não autorizado.

### 13.5.4 — Sessões

- **Timeout de inatividade** (padrão: 30 min)
- **Aviso antes de expirar** (padrão: 5 min antes)
- **Sincronizar entre abas** (padrão: sim)

---

## 13.6 — Quorum

URL: `/admin/configuracoes/quorum`.

![Configurações de quorum](./images/13-06-quorum.png)

### 13.6.1 — Tipos de quorum cadastráveis

| Tipo | Definição |
|---|---|
| **MAIORIA_SIMPLES** | Mais votos favoráveis que contrários |
| **MAIORIA_ABSOLUTA** | 50% + 1 do total de membros |
| **DOIS_TERCOS** | 2/3 dos membros |
| **TRÊS_QUINTOS** | 3/5 dos membros |
| **UNANIMIDADE** | Todos presentes votam sim |

### 13.6.2 — Aplicações (quando cada quorum se aplica)

| Aplicação | Quorum típico | Base |
|---|---|---|
| **Instalação de sessão** | Maioria Absoluta | Total de membros |
| **Votação Simples** | Maioria Simples | Presentes |
| **Votação Absoluta** | Maioria Absoluta | Total de membros |
| **Votação Qualificada** | 2/3 | Total de membros |
| **Urgência** | Maioria Absoluta | Total de membros |
| **Comissão** | Maioria dos membros | Membros da comissão |
| **Derrubada de Veto** | Maioria Absoluta | Total de membros |

### 13.6.3 — Configurações avançadas por regra

| Campo | Observações |
|---|---|
| **Percentual mínimo** | Ex: 50% |
| **Número mínimo de votos** | Ex: 6 votos (útil em câmaras pequenas) |
| **Abstenção conta como** | SIM / NÃO / NEUTRO |
| **Exige votação nominal** | Sim para qualificada e derrubada de veto (RN-062) |

### 13.6.4 — Mensagens customizadas

- Mensagem de aprovação: "Aprovado com maioria simples"
- Mensagem de rejeição: "Rejeitado por falta de maioria absoluta"

---

## 13.7 — Tipos de Proposição

URL: `/admin/configuracoes/tipos-proposicoes`.

Define cada tipo que a câmara usa (PL, PR, PDL, Moção, etc.) com suas regras.

### 13.7.1 — Cadastrar tipo

Botão **+ Novo Tipo**.

| Campo | Observações |
|---|---|
| **Código** * | Único, maiúsculo (PROJETO_LEI, HOMENAGEM) |
| **Nome** * | "Projeto de Lei" |
| **Sigla** * | "PL" |
| **Descrição** | Uso e contexto |
| **Prefixo de Numeração** | "PL" (usado na numeração: PL 045/2026) |
| **Ordem** | Para ordenação em selects |
| **Cor do Badge** | Picker |
| **Requer Votação** | Sim/não |
| **Requer Sanção** | Sim se vira lei; não para indicações/requerimentos |
| **Numeração Anual** | Reseta a cada ano (1/2026, 2/2026... 1/2027) |
| **Ativo** | Toggle |

### 13.7.2 — Configurações de turnos

- **Número de turnos**: 1 (padrão) ou 2 (Emendas à Lei Orgânica)
- **Interstício entre turnos**: dias (padrão: 10 para Lei Orgânica)
- **Quorum por turno**: configurável separadamente

### 13.7.3 — Popular padrão

Botão **Popular Tipos Padrão** — cria 8 tipos comuns:

- PROJETO_LEI (PL)
- PROJETO_RESOLUCAO (PR)
- PROJETO_DECRETO_LEGISLATIVO (PDL)
- INDICACAO (IND)
- REQUERIMENTO (REQ)
- MOCAO (MOC)
- VOTO_PESAR (VP)
- VOTO_APLAUSO (VA)

Útil em instalação inicial.

---

## 13.8 — Unidades de Tramitação

URL: `/admin/configuracoes/unidades-tramitacao`.

Cadastro dos órgãos que recebem proposições.

| Campo | Observações |
|---|---|
| **Nome** * | "Secretaria Legislativa", "CLJ", "Comissão de Finanças" |
| **Sigla** * | "SL", "CLJ", "CF" |
| **Tipo** * | SECRETARIA, COMISSAO, PLENARIO, PROTOCOLO |
| **Responsável** | Usuário ou parlamentar gestor |
| **Habilita Pauta** | Se unidade pode liberar proposição para pauta |
| **Ativa** | Toggle |

Unidades padrão recomendadas: Secretaria Legislativa, CLJ, Plenário. Adicione comissões específicas conforme existirem.

---

## 13.9 — Tipos de Tramitação

URL: `/admin/configuracoes/tipos-tramitacao`.

Tipos de movimentação entre unidades.

| Campo | Observações |
|---|---|
| **Nome** * | "Análise Jurídica", "Emissão de Parecer", "Redação Final" |
| **Descrição** | Quando se usa |
| **Prazo Regimental** | Dias conforme regimento |
| **Prazo Legal** | Dias conforme lei superior |
| **Ordem** | Em selects |
| **Ativo** | Toggle |

---

## 13.10 — Fluxos de Tramitação

URL: `/admin/configuracoes/fluxos-tramitacao` ou `/admin/tramitacoes/regras`.

Define a **sequência de etapas** que cada tipo de proposição percorre.

![Editor de fluxo](./images/13-07-fluxo-tramitacao.png)

### 13.10.1 — Criar fluxo

1. Botão **+ Novo Fluxo**
2. **Nome**: "Fluxo Padrão PL"
3. **Tipo de Proposição**: associe ao(s) tipo(s) que usarão este fluxo
4. Adicione **etapas** em sequência

### 13.10.2 — Etapas

Para cada etapa:

| Campo | Observações |
|---|---|
| **Nome da Etapa** | "Análise na CLJ" |
| **Unidade** | Unidade que recebe |
| **Tipo de Tramitação** | Análise / Parecer / Redação |
| **Prazo** | Dias |
| **Habilita Pauta** | Se após esta etapa a proposição pode ir a pauta |
| **Condicional** | Se só se aplica em casos específicos |

### 13.10.3 — Exemplo de fluxo PL

1. **Protocolo → Secretaria Legislativa** (recebimento, 2 dias)
2. **Secretaria → CLJ** (análise jurídica, 15 dias)
3. **CLJ → Comissão Temática** (análise de mérito, 15 dias) — condicional ao tema
4. **Comissão → Secretaria** (habilita pauta, 1 dia)
5. **Secretaria → Plenário** (na próxima sessão com pauta)
6. **Plenário aprovou → Redação Final** (5 dias)
7. **Redação Final → Executivo** (envio para sanção)
8. **Sanção → Promulgação → Publicação**

---

## 13.11 — Auditoria

URL: `/admin/auditoria`.

![Tela de auditoria](./images/13-08-auditoria.png)

### 13.11.1 — O que é registrado

Toda ação **modificadora** (criar/editar/excluir) gera log com:

- **Usuário** (quem)
- **Ação** (o que)
- **Entidade** (sobre o quê — ex: Proposição PL 045/2026)
- **Dados anteriores** (como estava)
- **Dados novos** (como ficou)
- **IP de origem**
- **Timestamp**

### 13.11.2 — Consultar

- Filtros: usuário, tipo de ação, entidade, intervalo de datas
- Export CSV para análise em planilha
- Busca textual em metadata

### 13.11.3 — Quando usar

- Auditoria externa (Tribunal de Contas, CGU)
- Investigação de incidente ("quem alterou proposição X em Y?")
- Verificação de ações suspeitas

> ℹ️ **Nota**: logs de auditoria **não podem ser excluídos** por design — integridade de auditabilidade.

---

## 13.12 — Backups

URL: `/admin/configuracoes/backups`.

### 13.12.1 — Backups automáticos

Sistema faz backup diariamente às 3h:
- PostgreSQL dump completo
- Pasta `public/uploads` (tar.gz)

Retenção: 7 diários / 4 semanais / 3 mensais.

Localização (VPS): `/var/backups/camara/`.

### 13.12.2 — Baixar backup

Lista de backups disponíveis. Clique **Download** para baixar o dump.

> ⚠️ **Atenção**: backups contêm dados sensíveis. Baixe apenas para máquina segura e apague após uso.

### 13.12.3 — Restaurar

Não fazer pela interface web — operação sensível. Use comando direto na VPS:

```bash
gunzip < backup.sql.gz | pg_restore -d camara_legislativo
```

Contate equipe de TI da Câmara.

---

## 13.13 — Monitoramento

URL: `/admin/monitoramento`.

![Dashboard de monitoramento](./images/13-09-monitoramento.png)

### 13.13.1 — Indicadores

- **Status API**: Online / Offline / Degradado
- **Banco de dados**: conectado, latência
- **Redis**: (se usado) status
- **Últimos jobs cron**: backup, health check, notificações
- **Usuários online** agora
- **Requisições últimas 24h**
- **Erros últimas 24h**

### 13.13.2 — Alertas

Dashboard exibe alertas ativos (erros recentes, jobs falhando, disco cheio, etc.).

---

## 13.14 — Integrações

URL: `/admin/integracoes`.

### 13.14.1 — Tokens de API

Para sistemas externos consumirem a API pública:

1. Botão **+ Novo Token**
2. Dê um nome descritivo (ex: "Integração TC")
3. Escolha escopo de permissões (leitura, escrita, quais módulos)
4. Sistema gera token aleatório — **anote imediatamente** (não é possível ver depois)
5. Forneça ao sistema externo

Tokens podem ser **revogados** quando não precisar mais.

### 13.14.2 — Webhooks

Configure URLs que recebem notificações quando eventos ocorrem:

- Nova proposição apresentada
- Sessão iniciada/concluída
- Resultado de votação

---

## 13.15 — Fluxo típico de instalação inicial

Ao configurar um sistema novo:

1. **Configurações Gerais** — dados institucionais (logo, nome, contato, endereço)
2. **Identidade Visual** — cores, brasão
3. **Usuários** — crie contas do Administrador, Secretaria, Operador, Editor
4. **Tipos de Proposição** — use **Popular Padrão** e ajuste
5. **Tipos de Tramitação** — crie padrões (Análise, Parecer, Redação)
6. **Unidades de Tramitação** — cadastre Secretaria, CLJ, Plenário + comissões existentes
7. **Fluxos de Tramitação** — conecte tipos → sequência de etapas
8. **Quorum** — configure conforme regimento da sua casa
9. **Segurança** — defina políticas de senha, 2FA, timeout
10. **Templates de Sessão** — padrão para ordinárias
11. **Parlamentares** — cadastre os vereadores ativos (módulo Parlamentares)
12. **Comissões** — cadastre + adicione membros
13. **Transparência** (conteúdo, links, períodos) — configure portal público
14. **Exportar configurações** — backup inicial

---

## 13.16 — Boas práticas

1. **Exporte configurações antes de mudanças grandes.** Permite rollback se algo quebrar.
2. **Teste novas regras de quorum em sessão simulada.** Antes de aplicar em real.
3. **Nunca desative auditoria.** Mesmo que o sistema sugira (não sugere), **jamais**.
4. **Reveja lista de usuários trimestralmente.** Servidores que saíram devem ser inativados.
5. **Torne 2FA obrigatório para ADMIN**.
6. **Monitore logs de auditoria regularmente.** Anomalias indicam problemas.
7. **Tokens de API só com escopo mínimo necessário.** Menos permissões = menos risco.
8. **Faça download manual de backup** antes de updates grandes.

---

## 13.17 — FAQ

**P: Posso ter 2 administradores?**
R: Sim. Recomenda-se ter **pelo menos 2** (evita lockout se um perder acesso). Mas não mais que 3-4.

**P: Como recupero um sistema sem nenhum admin ativo?**
R: Contate equipe de TI. Acesso direto ao banco permite marcar usuário como ADMIN via SQL. Não fazer isso por interface (não existe esse caminho para evitar abuso).

**P: Mudei cor primária e portal quebrou. E agora?**
R: Volte para paleta predefinida (Azul Institucional padrão). Se persistir, limpe cache do navegador (Ctrl+Shift+R).

**P: Parlamentar não consegue logar. Como ajudo?**
R: 1) Verifique se usuário existe e está **Ativo**. 2) Verifique se tem role PARLAMENTAR. 3) Resete senha. 4) Se tem 2FA e perdeu celular, desative 2FA e peça para reconfigurar.

**P: Quanto tempo demora o backup diário?**
R: Depende do tamanho. Para câmara média (50GB de dados), ~3-5 minutos. Cron roda às 3h da manhã para não afetar uso.

**P: Posso customizar e-mails automáticos?**
R: Ainda não pela interface. Edição dos templates via código (contate TI).

**P: Como vejo quem mudou uma configuração específica?**
R: Auditoria → filtro **Entidade = Configuração** → busque pelo campo. Logs registram autor e diff.

**P: Token de API vazou. O que faço?**
R: **Integrações → Revogar** imediatamente. Gere novo com escopo idealmente mais restrito.

**P: Sistema muito lento. O que verificar?**
R: 1) Dashboard Monitoramento (banco saudável?). 2) Logs de erro. 3) Tamanho do banco (muitos logs de auditoria?). Contate TI se persistir.

---

**Próximo capítulo:** 14 — Glossário e FAQ geral (em produção)

**Capítulo anterior:** 12 — Relatórios e Analytics (em produção)
