# Deploy em produção (VPS) já com os dados migrados

> Objetivo: instalar o sistema num VPS novo, com PostgreSQL **local**, e popular o
> banco com **todos os dados** da Câmara de Chaves (extraídos do backup CR2 +
> correções) — sem precisar transferir os 5,1 GB do backup bruto nem rodar OCR.

## Estratégia

Em vez de reprocessar os importadores no VPS, **clonamos o banco DEV** (26 MB) via
`pg_dump` data-only. O artefato `deploy/camara-seed.sql.gz` (~2 MB) contém o estado
final já corrigido (apelidos, normalização de números, folhas de presença, votações,
etc.). O `install.sh` cria o schema; o `restore-dados-producao.sh` popula os dados.

Validação: o restore foi testado end-to-end (schema + data) com **0 erros** e
contagens idênticas (676 proposições · 36 parlamentares · 271 sessões · 2726
presenças · 36 votações).

## Pré-requisitos

- VPS Ubuntu/Debian com acesso root/sudo.
- Domínio apontando para o IP do VPS (para o SSL do install.sh).
- O arquivo `deploy/camara-seed.sql.gz` gerado na máquina DEV (ver "Regerar o seed").

## ⚡ Instalação AUTOMÁTICA (um comando faz tudo)

Pré-flight + install + restore do seed + admin + restart, **sem interação**.

**1) Envie o seed** (da máquina DEV):
```bash
scp deploy/camara-seed.sql.gz root@<IP-do-VPS>:/root/camara-seed.sql.gz
```
**2) No VPS (root)**, rode com as 3 variáveis obrigatórias:
```bash
export ADMIN_EMAIL="voce@dominio.gov.br" \
       ADMIN_PASSWORD="SuaSenhaForte123" \
       ENCRYPTION_KEY="<mesma chave do .env DEV>"
# opcionais: SITE_DOMAIN (padrão siscam.vps-kinghost.net), CAMARA_NOME, SSL_EMAIL
curl -fsSL https://raw.githubusercontent.com/junielsonfarias/LegNet/main/scripts/instalar-producao.sh | bash
```
Ao final: site em `https://$SITE_DOMAIN`, login `$ADMIN_EMAIL`. O `install.sh` roda
não-interativo (`CAMARA_UNATTENDED=1`); o fluxo manual abaixo segue funcionando
normalmente **sem** essas variáveis.

### Rodar de novo numa VPS que já tem o sistema

O `install.sh` **detecta instalação existente** (`/opt/camara`) sozinho. No fluxo
automático você escolhe o comportamento pela variável `AUTO_INSTALL_MODE`:

| `AUTO_INSTALL_MODE` | O que faz | Dados |
|---------------------|-----------|-------|
| `update` (**padrão**) | `git pull` + rebuild + migrações de schema | **Preserva** banco/config/dados. **Não** recarrega o seed nem mexe no admin. |
| `reinstall` | Backup de emergência do banco, apaga `/opt/camara` e instala do zero | **Apaga tudo** e repopula com o seed; redefine o admin. |

```bash
# Atualizar o código, mantendo os dados de produção (padrão):
curl -fsSL .../instalar-producao.sh | bash

# Reinstalar do ZERO (apaga tudo e recarrega o seed):
export AUTO_INSTALL_MODE=reinstall
curl -fsSL .../instalar-producao.sh | bash

# Atualizar mas forçar recarga do seed por cima (sobrescreve os dados atuais):
export RESTORE_SEED=1
curl -fsSL .../instalar-producao.sh | bash
```
> No modo **interativo** (`sudo bash install.sh` direto), ele mostra o menu
> `1) Atualizar · 2) Reinstalar · 3) Cancelar` e a reinstalação pede digitar `SIM`.

---

## Passo a passo MANUAL (alternativa)

### 1. Código no VPS

O `install.sh`/`setup-app.sh` já usa **`git clone --depth 1`** (shallow — sem
histórico, sem os 22 MB de PDFs antigos que não estão mais no HEAD):
```bash
sudo git clone --depth 1 <repo> /opt/camara
cd /opt/camara
```

**Deploy enxuto (opcional, ainda menor):** o `.gitattributes` marca `docs/`,
testes, `prisma/importers/`, `.github/`, `.claude/` etc. como `export-ignore`.
Para levar só o necessário (sem docs, sem `.git`), use `git archive`:
```bash
git -C <repo-local> archive --format=tar main | sudo tar -x -C /opt/camara
# (ou, no servidor:  git archive --remote=<repo> main | tar -x -C /opt/camara)
```
> O app **não lê `docs/` em runtime nem em build** — é seguro não enviá-lo.

### 2. Configurar o `.env`
```bash
cp .env.example .env
# Edite: DATABASE_URL/DIRECT_URL apontando para o Postgres LOCAL do VPS,
# NEXTAUTH_SECRET, INTERNAL_API_SECRET, ENCRYPTION_KEY, domínio, etc.
```
> **ENCRYPTION_KEY**: use a MESMA chave do DEV, senão os CPFs criptografados
> (ouvidoria/e-SIC/protocolo) não poderão ser descriptografados.

### 3. Instalar (provisiona tudo + cria o schema)
```bash
sudo bash install.sh
```
O install.sh instala Node/PM2/nginx/PostgreSQL, roda `prisma db push` (schema),
aplica as migrações SQL, gera o cliente e sobe o app com SSL.

### 4. Enviar o seed para o VPS
Na máquina **DEV**:
```bash
scp deploy/camara-seed.sql.gz root@<IP-do-VPS>:/opt/camara/deploy/
```

### 5. Restaurar os dados
No **VPS**:
```bash
cd /opt/camara
bash scripts/restore-dados-producao.sh
```
(usa `/opt/camara/deploy/camara-seed.sql.gz` por padrão; idempotente — pode reexecutar.)

### 6. Reiniciar e validar
```bash
pm2 restart camara-legislativo
curl -s https://SEU-DOMINIO/api/health
```
Abra o site e confira `/parlamentares`, `/legislativo/proposicoes`, `/transparencia`.

### 7. Pós-instalação
- **Troque a senha do admin** (os usuários vieram do DEV).
- Confira o cron de backup (`scripts/backup-cron.sh`).

## Regerar o seed (quando o DEV mudar)

Na máquina **DEV** (container `camara_postgres`, porta 5433):
```bash
docker exec camara_postgres pg_dump -U postgres -d camara_legislativo_db \
  --data-only --no-owner --no-acl | gzip > deploy/camara-seed.sql.gz
```

## Notas técnicas

- **Data-only** (não full): o schema vem do `prisma db push` do install.sh, garantindo
  compatibilidade com a versão atual dos models. O restore usa
  `session_replication_role = replica` para contornar as FKs circulares
  (`parlamentares`/`sessoes`/`emendas`) — exige superuser `postgres`.
- **Sequências**: incluídas no dump data-only (`setval`).
- **Segurança**: `deploy/camara-seed.sql.gz` contém dados reais (a maioria pública, mas
  também hashes de senha e CPFs criptografados) — por isso é **git-ignored** e
  transferido por `scp`, nunca commitado.

## Alternativa (não recomendada): reprocessar no VPS
Copiar `docs/backup antigo/` (5,1 GB) + instalar OCR (tesseract/poppler + por.traineddata)
e rodar `npm run db:import-antigos:apply`. Mais lento e pode não reproduzir as correções
manuais idênticas. Use apenas se precisar reconstruir do zero.
