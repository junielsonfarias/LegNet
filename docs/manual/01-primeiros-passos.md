# Capítulo 01 — Primeiros Passos

Neste capítulo você vai aprender a:

- Fazer login no sistema
- Entender a estrutura do painel (sidebar, header, dashboard)
- Ativar autenticação em duas etapas (2FA)
- Recuperar senha esquecida
- Configurar seu perfil e preferências
- Fazer logout com segurança

---

## 1.1 — Acessando o sistema

### Passo 1: abrir o navegador

Abra o navegador e digite na barra de endereço:

```
https://cmchaves.pa.gov.br/admin
```

> 💡 **Dica**: adicione essa URL aos favoritos (Ctrl+D no Windows/Linux, Cmd+D no Mac) para acesso rápido.

Se você ainda não estiver autenticado, será redirecionado automaticamente para a tela de login.

### Passo 2: a tela de login

![Tela de login](./images/01-01-tela-login.png)

A tela é dividida em duas partes:

- **Lado esquerdo** (identificação): mostra o logotipo da Câmara Municipal, o nome da instituição e uma breve descrição do sistema. Os cards "**15+ Módulos disponíveis**" e "**100% Transparência**" indicam o escopo.
- **Lado direito** (formulário): aqui você digita seu e-mail e senha.

> ℹ️ **Nota**: se o seu navegador estiver em modo escuro, a tela se adapta automaticamente.

### Passo 3: preencher credenciais

No formulário à direita, preencha:

| Campo | Como preencher |
|---|---|
| **Email** | Seu e-mail institucional cadastrado pelo Administrador (ex: `secretaria@camara.pa.gov.br`) |
| **Senha** | Sua senha pessoal — mínimo 8 caracteres |

O campo senha tem um ícone de "olho" (👁) à direita — clique para mostrar/ocultar os caracteres digitados. Útil para conferir se digitou certo antes de enviar.

Depois clique no botão **Entrar** (azul, largura total).

![Formulário de login preenchido](./images/01-02-formulario-login.png)

### Passo 4: autenticação em duas etapas (se configurada)

Se você tem 2FA ativado, após clicar em **Entrar** surge uma segunda tela:

![Tela de verificação 2FA](./images/01-03-2fa.png)

1. Abra seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator ou Authy) no celular.
2. Procure a entrada **"Câmara Municipal"** (ou o nome configurado quando você ativou o 2FA).
3. Leia o código de 6 dígitos exibido.
4. Digite o código no campo **Código do autenticador**.
5. Clique em **Verificar código**.

> ⚠️ **Atenção**: o código muda a cada 30 segundos. Se a barra de progresso do app estiver quase zerando, espere o próximo código para evitar erro de tempo.

Se errar o código, aparece a mensagem "Código 2FA inválido. Tente novamente." — apenas digite o novo código e tente novamente. Para voltar, clique em **Voltar ao login**.

### Mensagens de erro no login

| Mensagem | Causa provável | O que fazer |
|---|---|---|
| "Email ou senha incorretos" | Credencial errada | Confira se Caps Lock está desligado e tente novamente |
| "Código 2FA inválido. Tente novamente." | Código expirado (30s) ou digitado errado | Digite o código mais recente do app |
| "Muitas tentativas de login. Aguarde 5 minutos." | Rate limit ativado após 10 tentativas erradas | Espere 5 minutos e tente novamente |
| "Conta desativada. Contate o Administrador." | Seu acesso foi suspenso | Solicite reativação ao Administrador |

> ⚠️ **Atenção**: se errou senha 3 vezes, **pare** e use **Esqueceu sua senha?** ao invés de seguir tentando — evita bloqueio por rate limit.

---

## 1.2 — Recuperação de senha

Se você esqueceu sua senha, **não precisa chamar o Administrador** — você mesmo pode redefinir.

### Passo 1: clicar no link

Na tela de login, clique no link **Esqueceu sua senha?** (azul, canto inferior direito do formulário).

![Link esqueci minha senha](./images/01-04-esqueci-senha-link.png)

### Passo 2: digitar seu e-mail

Digite o mesmo e-mail institucional que você usa para login e clique em **Enviar link de recuperação**.

![Formulário de recuperação](./images/01-05-recuperar-senha.png)

### Passo 3: conferir sua caixa de entrada

Em até 2 minutos você receberá um e-mail do sistema com o assunto "**Recuperação de senha — Câmara Municipal**". Abra o e-mail e clique no botão **Redefinir senha**.

> ℹ️ **Nota**: o link expira em **1 hora**. Se expirar, repita o processo.
>
> Se não chegar o e-mail em 5 minutos:
> - Verifique a pasta de **spam/lixo eletrônico**
> - Confirme se digitou o e-mail correto
> - Contate o Administrador

### Passo 4: criar nova senha

O link leva para uma página onde você define a nova senha. Regras:

- Mínimo **8 caracteres**
- Recomendado: combinar letras maiúsculas, minúsculas, números e um caractere especial
- Não reutilize senhas de outros sistemas (e-mail pessoal, banco, redes sociais)

Digite a nova senha duas vezes (no segundo campo para confirmação) e clique em **Salvar nova senha**.

Você será redirecionado para a tela de login — digite o e-mail e a **nova** senha.

---

## 1.3 — Conhecendo o painel administrativo

Após login bem-sucedido, você cai no **Dashboard** (`/admin`) — ou, se for Operador, diretamente no **Painel Eletrônico** (`/admin/painel-eletronico`).

### 1.3.1 — Estrutura geral da tela

![Layout geral do admin](./images/01-06-layout-geral.png)

O painel tem 3 áreas principais:

1. **Sidebar** (menu lateral esquerdo, 256 px de largura no desktop): navegação principal
2. **Header** (topo, altura fixa): busca, notificações, tema, seu avatar
3. **Conteúdo principal** (centro): mostra a tela do módulo selecionado

Em telas pequenas (tablet/celular), a sidebar fica escondida — clique no ícone ☰ (hamburger) no canto superior esquerdo para abrir.

### 1.3.2 — Sidebar (menu lateral)

A barra lateral agrupa as funcionalidades em **8 categorias**. O cabeçalho mostra um distintivo com o nome do seu perfil:

![Cabeçalho da sidebar colorido por perfil](./images/01-07-sidebar-header.png)

| Categoria | O que contém |
|---|---|
| **Visão Geral** | Dashboard, Relatórios, Analytics |
| **Legislativo** | Sessões, Painel Eletrônico, Pautas, Proposições, Tramitações, Pareceres, Protocolo, Normas Jurídicas, Ofícios |
| **Parlamentares** | Parlamentares, Mesa Diretora, Legislaturas, Comissões, Reuniões |
| **Transparência** | 16 itens (Gestão Fiscal, Receitas, Despesas, Contratos, Licitações, Obras, etc.) |
| **Pessoal** | Servidores, Folha de Pagamento, Diárias, Verbas, Concursos, Bens Patrimoniais |
| **Comunicação** | Notícias, Publicações, Audiências Públicas, Participação Cidadã |
| **Atendimento** | e-SIC, Ouvidoria, Conteúdos Educativos |
| **Configurações** | Geral, Usuários, Quorum, Tipos de Proposição, Auditoria, etc. (acesso restrito a ADMIN) |

> 🔒 **Requer permissão**: cada perfil vê apenas as categorias e itens que tem permissão. Se você não vê um item que acha que deveria ver, fale com o Administrador.

**Como funciona a sidebar**:

- Clique em uma **categoria** para expandir seus itens (seta ⌄ vira ⌃)
- Clique em um **item** para navegar até a tela
- O item **ativo** (em uso agora) fica destacado com a cor do seu perfil + uma barra branca na lateral esquerda
- Alguns itens têm **submenus** (ex: Tramitações → Tramitações / Regras / Dashboard) — identificados por uma seta à direita

### 1.3.3 — Header (barra superior)

![Header completo](./images/01-08-header.png)

Da esquerda para a direita:

1. **Ícone ☰** (apenas mobile): abre a sidebar
2. **Título**: "Painel Administrativo" + nome da Câmara
3. **Busca rápida** (centro ou direita, dependendo da tela): atalho `Ctrl+K` (Windows/Linux) ou `Cmd+K` (Mac) — busca em proposições, sessões, parlamentares, normas, tudo ao mesmo tempo
4. **🌞/🌙 Toggle de tema**: alterna claro/escuro
5. **🔔 Sino de notificações**: avisos de prazos, pendências, aprovações
6. **Avatar do usuário** (foto ou iniciais): clique para abrir menu do usuário

### 1.3.4 — Menu do usuário

Ao clicar no seu avatar (canto superior direito), abre um dropdown com:

![Dropdown do usuário](./images/01-09-menu-usuario.png)

- **Seu nome completo** e **seu e-mail**
- **Badge colorido** indicando seu perfil (ex: "Secretaria", "Editor")
- **Meu Perfil** → ver e editar seus dados, foto, senha
- **Configurações** → preferências (apenas se você tiver permissão)
- **Sair** → encerra a sessão (vermelho, sempre no final)

---

## 1.4 — Tour guiado (primeiro acesso)

Na **sua primeira vez** no sistema, após 1,5 segundo aparece um modal com um tour de 8 passos mostrando as principais funcionalidades:

![Tour guiado passo 1](./images/01-10-tour-passo-1.png)

1. Bem-vindo ao Painel Administrativo
2. Menu Lateral — como navegar
3. Sessões e Pautas — gestão legislativa
4. Proposições e Tramitação — registro e acompanhamento
5. Transparência (PNTP) — dados abertos
6. Busca Rápida — `Ctrl+K` / `Cmd+K`
7. Tema e Acessibilidade
8. Tudo pronto!

### Como navegar no tour

- **Próximo** (botão azul): avança para o passo seguinte
- **Anterior** (botão branco, aparece a partir do passo 2): volta
- **Pular guia**: fecha o tour (pode revisitar depois)
- **Dots** no rodapé: clique para pular direto a um passo específico
- **X** no canto superior direito ou clicar fora do modal: fecha

### Reabrir o tour depois

Vá em *Configurações* (via menu do usuário) → procure por **Rever guia de boas-vindas**.

---

## 1.5 — Dashboard inicial

O Dashboard mostra um resumo do estado do sistema, adaptado ao seu perfil.

### 1.5.1 — Saudação personalizada

No topo, você vê:

- **"Bom dia/tarde/noite, [Seu primeiro nome]!"** — o cumprimento muda conforme a hora
- Subtítulo com seu cargo e o nome da instituição
- Card lateral com o número da legislatura atual e o período

![Cabeçalho do dashboard](./images/01-11-dashboard-header.png)

### 1.5.2 — KPIs (indicadores-chave)

Na faixa abaixo do cabeçalho, há 4 a 6 cards com números importantes. O que aparece depende do seu perfil:

![Cards de KPI](./images/01-12-dashboard-kpis.png)

| Perfil | KPIs exibidos |
|---|---|
| **Administrador** | Parlamentares, Sessões, Proposições, Comissões, Pendentes, Votações Hoje |
| **Secretaria** | Parlamentares, Usuários, Sessões, Publicações |
| **Auxiliar Legislativo** | Proposições, Comissões, Sessões, Pendentes |
| **Editor** | Proposições, Sessões, Notícias, Agendadas |
| **Operador** | Sessão Atual, Presentes, Itens na Pauta, Votações |
| **Parlamentar** | Minhas Proposições, Aprovadas, Em Tramitação, Próxima Sessão |

Cada card mostra um número grande + um texto descritivo. Cards de **Pendentes** (se houver pendências) ficam destacados em amarelo.

### 1.5.3 — Seções do dashboard

Abaixo dos KPIs, você encontra:

- **Ações Rápidas**: botões para criar novos itens (varia por perfil)
- **Atividade Recente**: lista das últimas 10 ações no sistema (quem fez, quando, em que item)
- **Próximos Eventos**: até 5 próximas sessões/reuniões
- **Status do Sistema** (lateral): indica se tudo está OK — banco, API, usuários online

### 1.5.4 — Alertas

Quando há coisas que exigem sua atenção, surge uma faixa amarela no topo com mensagens como:

- "*5 proposições aguardando análise*"
- "*Sessão ordinária em 2 dias — pauta ainda não publicada*"
- "*3 pareceres com prazo vencendo esta semana*"

Clique no alerta para ir direto à lista correspondente.

---

## 1.6 — Configurar seu perfil

### Passo 1: acessar **Meu Perfil**

Clique no seu avatar (canto superior direito) → **Meu Perfil**.

Você cairá em `/admin/perfil`.

### Passo 2: editar dados pessoais

![Tela de perfil](./images/01-13-meu-perfil.png)

Campos editáveis:

- **Nome completo**
- **E-mail** (cuidado — você faz login com ele)
- **Telefone**
- **Foto de perfil** (clique na foto atual para subir uma nova — aceita JPG/PNG até 2 MB)

Clique em **Salvar alterações** para persistir. Mensagem verde de sucesso aparece no topo.

### Passo 3: trocar senha

Em **Segurança**, você vê:

- **Senha atual** (obrigatório)
- **Nova senha** (mín. 8 caracteres)
- **Confirmar nova senha**

Clique em **Trocar senha**.

> 💡 **Dica**: troque sua senha a cada 90 dias. Nunca compartilhe sua senha nem cole em e-mails ou mensagens.

### Passo 4: ativar 2FA (fortemente recomendado)

Ainda em **Segurança**, na seção **Autenticação em Duas Etapas**:

1. Clique em **Gerar código 2FA**. Surge um QR code + campo para código de verificação.

   ![QR Code 2FA](./images/01-14-2fa-qrcode.png)

2. No celular, abra seu app autenticador (baixe **Google Authenticator** ou **Microsoft Authenticator** da loja de apps se não tiver) e toque em **+** → **Escanear QR code**.

3. Aponte a câmera para o QR code na tela. O app adiciona uma entrada "Câmara Municipal" e começa a gerar códigos de 6 dígitos que mudam a cada 30 segundos.

4. Digite o código atual no campo **Código de verificação** e clique em **Ativar 2FA**.

5. Agora aparecem **10 códigos de backup**. **IMPRIMA ou SALVE em local seguro** — eles funcionam uma única vez cada, caso você perca o celular.

   ![Backup codes](./images/01-15-2fa-backup-codes.png)

6. Pronto. A partir do próximo login, você será solicitado a digitar o código do app.

> ⚠️ **Atenção**: sem o 2FA e sem backup codes, se perder seu celular **sua conta pode ficar bloqueada** até um Administrador resetar. Guarde os códigos de backup!

### Desativar 2FA (se necessário)

Em **Segurança** → **Desabilitar 2FA** (botão vermelho). Confirme sua senha atual para desativar.

---

## 1.7 — Preferências do sistema

### Tema claro ou escuro

Clique no ícone 🌞 (sol) ou 🌙 (lua) no header. A escolha fica salva para seu próximo login.

![Toggle de tema](./images/01-16-tema-toggle.png)

> 💡 **Dica**: tema escuro reduz cansaço visual em jornadas longas e economiza bateria em laptops OLED.

### Acessibilidade

Há uma toolbar de acessibilidade disponível (geralmente ícone ♿ no header ou canto inferior). Opções:

- **Aumentar tamanho de fonte** (A-, A, A+)
- **Alto contraste** (preto/amarelo)
- **Espaçamento de linha**
- **Reduzir animações** (para quem tem sensibilidade a movimento)

---

## 1.8 — Encerrar sessão (logout)

Sempre que terminar de usar o sistema, especialmente em **computadores compartilhados**:

1. Clique no seu avatar (canto superior direito)
2. Clique em **Sair** (último item, vermelho)
3. Você volta para a tela de login

> ⚠️ **Atenção**: fechar a aba do navegador **não** garante logout completo. Sempre use o botão **Sair**. A sessão tem expiração automática de **1 hora** de inatividade, mas pode ser aproveitada por quem senta depois no seu computador se você não encerrar.

### Aviso de inatividade

Se você ficar parado por **25 minutos**, surge um modal de aviso:

> "Sua sessão expira em 5 minutos. Clique em 'Continuar conectado' para manter."

Clique em **Continuar conectado** ou o sistema fará logout automático.

---

## 1.9 — Perguntas frequentes deste capítulo

**P: Posso compartilhar minha conta com outro servidor?**
R: **Não**. Todas as ações ficam registradas no seu nome. Se precisar, peça ao Administrador um usuário próprio para o colega.

**P: Consigo usar o sistema pelo celular?**
R: Sim, o painel se adapta a celulares. Mas funções como *Painel Eletrônico* e edição de documentos longos são melhores no desktop.

**P: Esqueci meu código 2FA e perdi os backup codes. E agora?**
R: Somente um Administrador consegue desativar o 2FA da sua conta. Solicite pessoalmente e, se possível, com testemunha.

**P: Posso abrir o sistema em duas abas ao mesmo tempo?**
R: Sim. Útil para consultar uma proposição enquanto edita outra. Mas evite abrir a **mesma** tela de edição em duas abas — pode gerar conflito de versão.

**P: O sistema é lento para carregar. O que fazer?**
R: Normalmente é internet lenta. Teste abrir `https://cmchaves.pa.gov.br/api/health` no navegador — se retorna `{"status":"healthy"}` rápido, o problema é local. Se demora, avise a TI.

---

**Próximo capítulo:** [02 — Protocolo de Documentos](./02-protocolo.md)
