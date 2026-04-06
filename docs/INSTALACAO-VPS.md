# Guia de Instalacao em VPS Linux

> Guia completo para instalar o Sistema Legislativo da Camara Municipal em um servidor VPS Linux.
> **Nivel**: Iniciante - nao requer conhecimento avancado em servidores.

---

## 1. Requisitos Minimos

### Servidor (VPS)

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPUs |
| RAM | 1 GB | 2 GB |
| Disco | 20 GB SSD | 40 GB SSD |
| Sistema | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Rede | IPv4 publico | IPv4 + IPv6 |

### Provedores de VPS Recomendados

| Provedor | Preco Aprox. | Observacao |
|----------|--------------|------------|
| Contabo | R$ 25/mes | Bom custo-beneficio |
| DigitalOcean | US$ 6/mes | Interface simples |
| Hetzner | EUR 4/mes | Melhor desempenho |
| Vultr | US$ 6/mes | Servidores no Brasil |
| Oracle Cloud | Gratis | Free tier permanente (ARM) |

### Dominio

Voce precisa de um dominio apontando para o IP do servidor. Exemplos:
- `camara.suacidade.pa.gov.br`
- `legislativo.suacidade.gov.br`
- `camara-suacidade.com.br`

---

## 2. Preparando o Servidor

### 2.1 Acessar o servidor via SSH

No Windows, use o **PowerShell** ou **PuTTY**:

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

No primeiro acesso, digite `yes` quando perguntar sobre a chave SSH.

### 2.2 Apontar o Dominio (DNS)

No painel do seu provedor de dominio, crie um registro **A**:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | IP_DO_SERVIDOR | 3600 |
| A | www | IP_DO_SERVIDOR | 3600 |

> **Importante**: O DNS pode levar de 5 minutos a 24 horas para propagar. Verifique em https://dnschecker.org

---

## 3. Instalacao Automatica (Recomendado)

### 3.1 Baixar o instalador

Conectado ao servidor via SSH, execute:

```bash
# Baixar o script de instalacao
wget https://raw.githubusercontent.com/junielsonfarias/LegNet/main/install.sh

# Dar permissao de execucao
chmod +x install.sh
```

### 3.2 Executar o instalador

```bash
sudo bash install.sh
```

### 3.3 Responder as perguntas

O instalador vai pedir as seguintes informacoes:

1. **Nome da Camara**: Nome completo (ex: `Camara Municipal de [Sua Cidade]`)
2. **Dominio**: Seu dominio (ex: `camara.suacidade.gov.br`)
3. **Email do administrador**: Email de acesso ao sistema
4. **Senha do administrador**: Senha de acesso (minimo 8 caracteres)
5. **Email para SSL**: Email para o certificado HTTPS
6. **Redis**: Se quer instalar Redis (opcional, digite `s` ou `n`)
7. **URL do repositorio**: URL do Git do projeto
8. **Diretorio**: Onde instalar (padrao: `/opt/camara`)

### 3.4 Aguardar a instalacao

A instalacao leva entre **5 a 15 minutos** dependendo do servidor. O script vai:

- Instalar PostgreSQL 15 (banco de dados)
- Instalar Node.js 20 (linguagem de programacao)
- Instalar Nginx (servidor web)
- Configurar SSL/HTTPS (certificado de seguranca)
- Compilar a aplicacao
- Configurar tudo automaticamente

### 3.5 Anotar as credenciais

Ao final, o instalador mostra um resumo com:
- URL de acesso
- Email e senha do administrador
- Dados do banco de dados

> **IMPORTANTE**: Anote estas informacoes em local seguro!

---

## 4. Primeiro Acesso

1. Abra o navegador e acesse: `https://seu-dominio.gov.br`
2. Clique em **Login** (canto superior direito)
3. Use o email e senha definidos na instalacao
4. Voce sera redirecionado ao **Painel Administrativo**

### Primeiras configuracoes:

1. **Configuracoes > Sistema**: Personalize nome, cores e brasao
2. **Parlamentares**: Cadastre os vereadores
3. **Legislaturas**: Configure a legislatura atual
4. **Comissoes**: Crie as comissoes permanentes
5. **Usuarios**: Crie contas para operadores e secretaria

---

## 5. Comandos Uteis

### Gerenciar a aplicacao

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs

# Reiniciar aplicacao
pm2 restart all

# Parar aplicacao
pm2 stop all
```

### Gerenciar o servidor

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar espaco em disco
df -h

# Verificar uso de memoria
free -h
```

### Banco de dados

```bash
# Acessar o banco
sudo -u postgres psql -d camara_legislativo

# Ver tabelas
\dt

# Sair
\q
```

---

## 6. Como Atualizar o Sistema

### Forma mais simples (recomendada):

```bash
sudo bash install.sh
# Escolher opcao 1 (Atualizar)
```

O instalador faz tudo automaticamente:
- Backup do banco e .env
- Baixa atualizacoes (git pull)
- Instala dependencias novas
- Atualiza banco de dados (novos campos)
- Recompila a aplicacao
- Atualiza Nginx se necessario
- Reinicia PM2

### Forma manual (se preferir):

```bash
cd /opt/camara && git pull && npm ci && npx prisma generate && npx prisma db push && npm run build && pm2 restart all
```

### Baixar instalador atualizado:

```bash
wget -O install.sh https://raw.githubusercontent.com/junielsonfarias/LegNet/main/install.sh
chmod +x install.sh
sudo bash install.sh
```

---

## 7. Backup e Restauracao

### 7.1 Fazer backup do banco

```bash
# Backup completo
sudo -u postgres pg_dump camara_legislativo > /opt/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compactado
sudo -u postgres pg_dump camara_legislativo | gzip > /opt/backups/backup_$(date +%Y%m%d).sql.gz
```

### 7.2 Backup automatico (cron)

```bash
# Criar diretorio de backups
sudo mkdir -p /opt/backups

# Abrir crontab
sudo crontab -e

# Adicionar esta linha (backup diario as 3h da manha):
0 3 * * * sudo -u postgres pg_dump camara_legislativo | gzip > /opt/backups/backup_$(date +\%Y\%m\%d).sql.gz && find /opt/backups -name "*.sql.gz" -mtime +30 -delete
```

### 7.3 Restaurar backup

```bash
# Restaurar backup SQL
sudo -u postgres psql -d camara_legislativo < /opt/backups/backup_20260325.sql

# Restaurar backup compactado
gunzip -c /opt/backups/backup_20260325.sql.gz | sudo -u postgres psql -d camara_legislativo
```

### 7.4 Backup dos arquivos

```bash
# Backup do .env e arquivos de upload
tar -czf /opt/backups/files_$(date +%Y%m%d).tar.gz /opt/camara/.env /opt/camara/public/uploads/ 2>/dev/null
```

---

## 8. Resolucao de Problemas

### Problema: Pagina nao carrega (502 Bad Gateway)

```bash
# Verificar se a aplicacao esta rodando
pm2 status

# Se estiver offline, reiniciar
pm2 restart all

# Ver logs de erro
pm2 logs --err
```

### Problema: Erro de conexao com banco

```bash
# Verificar se PostgreSQL esta rodando
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Testar conexao
sudo -u postgres psql -c "SELECT 1;"
```

### Configurar SSL/HTTPS (apos ter dominio)

Se voce instalou com IP e agora tem um dominio, execute:

```bash
# Baixar e executar o configurador de SSL
wget -O ssl-setup.sh https://raw.githubusercontent.com/junielsonfarias/LegNet/main/ssl-setup.sh
chmod +x ssl-setup.sh
sudo bash ssl-setup.sh
```

O script faz tudo automaticamente:
- Instala Certbot
- Atualiza Nginx com o dominio
- Obtem certificado SSL gratuito (Let's Encrypt)
- Atualiza .env para HTTPS
- Recompila e reinicia a aplicacao
- Configura renovacao automatica

### Problema: SSL nao funciona

```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Reconfigurar SSL
sudo certbot --nginx -d seu-dominio.gov.br
```

### Problema: Servidor lento

```bash
# Ver uso de CPU e memoria
htop

# Ver processos Node.js
pm2 monit

# Reiniciar tudo
pm2 restart all
sudo systemctl restart nginx
```

### Problema: Disco cheio

```bash
# Ver uso de disco
df -h

# Limpar logs antigos
pm2 flush

# Limpar cache do npm
npm cache clean --force

# Remover backups antigos (mais de 30 dias)
find /opt/backups -name "*.sql.gz" -mtime +30 -delete
```

### Problema: Porta 3000 ja em uso

```bash
# Ver o que esta usando a porta
sudo lsof -i :3000

# Matar o processo
sudo kill -9 $(sudo lsof -t -i :3000)

# Reiniciar PM2
pm2 restart all
```

---

## 9. Seguranca Adicional

### 9.1 Mudar porta SSH (recomendado)

```bash
# Editar configuracao SSH
sudo nano /etc/ssh/sshd_config

# Alterar a linha Port 22 para:
Port 2222

# Reiniciar SSH
sudo systemctl restart sshd

# Atualizar firewall
sudo ufw allow 2222/tcp
sudo ufw delete allow ssh
```

### 9.2 Desabilitar login root com senha

```bash
# Editar configuracao SSH
sudo nano /etc/ssh/sshd_config

# Adicionar/alterar:
PermitRootLogin prohibit-password
PasswordAuthentication no

# Reiniciar SSH
sudo systemctl restart sshd
```

> **Atencao**: Antes de desabilitar senha, configure chaves SSH!

### 9.3 Atualizacoes automaticas de seguranca

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

---

## 10. Monitoramento

### Ver se tudo esta funcionando

```bash
# Status completo
echo "=== PostgreSQL ===" && sudo systemctl is-active postgresql
echo "=== Nginx ===" && sudo systemctl is-active nginx
echo "=== PM2 ===" && pm2 status
echo "=== Disco ===" && df -h /
echo "=== Memoria ===" && free -h
```

### Verificar a aplicacao

```bash
# Testar se responde
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Deve retornar: 200 ou 302
```

---

## 11. Contato e Suporte

Em caso de problemas com a instalacao:

1. Verifique o log de instalacao: `cat /var/log/camara-install.log`
2. Consulte a secao de **Resolucao de Problemas** acima
3. Abra uma issue no repositorio do projeto

---

> **Lembrete**: Este sistema e a base digital para o funcionamento democratico
> da Camara Municipal. Mantenha-o sempre atualizado e com backups em dia.
