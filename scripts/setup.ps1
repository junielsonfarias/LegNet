# Script de configuração do projeto Câmara Municipal de Mojuí dos Campos
# Desenvolvido para fins educacionais

Write-Host "🏛️  Configurando o Portal da Câmara Municipal de Mojuí dos Campos" -ForegroundColor Blue
Write-Host "==================================================================" -ForegroundColor Blue

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro." -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar se o PostgreSQL está instalado
try {
    $psqlVersion = psql --version
    Write-Host "✅ PostgreSQL encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL não encontrado. Por favor, instale o PostgreSQL 14+ primeiro." -ForegroundColor Red
    Write-Host "   Download: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

# Verificar se o arquivo .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "⚙️  Criando arquivo de configuração..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env.local"
    Write-Host "📝 Por favor, edite o arquivo .env.local com suas configurações de banco de dados" -ForegroundColor Cyan
    Write-Host "   Especialmente a variável DATABASE_URL" -ForegroundColor Cyan
    Read-Host "Pressione Enter quando terminar de configurar o .env.local"
}

# Configurar banco de dados
Write-Host "🗄️  Configurando banco de dados..." -ForegroundColor Yellow

# Gerar cliente Prisma
Write-Host "   Gerando cliente Prisma..." -ForegroundColor Yellow
npm run db:generate

# Executar migrações
Write-Host "   Executando migrações..." -ForegroundColor Yellow
npm run db:push

# Popular banco com dados iniciais
Write-Host "   Populando banco com dados iniciais..." -ForegroundColor Yellow
npm run db:seed

Write-Host ""
Write-Host "🎉 Configuração concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: npm run dev" -ForegroundColor White
Write-Host "   2. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Painel Admin: http://localhost:3000/admin" -ForegroundColor White
Write-Host "   4. Login: admin@camaramojui.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação completa no README.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🏛️  Portal da Câmara Municipal de Mojuí dos Campos" -ForegroundColor Blue
Write-Host "   Desenvolvido para fins educacionais e transparência pública" -ForegroundColor Blue
