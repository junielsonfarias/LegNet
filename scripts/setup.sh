#!/bin/bash

# Script de configuração do Sistema Legislativo Municipal
# Desenvolvido para fins educacionais

echo "🏛️  Configurando o Sistema Legislativo Municipal"
echo "=================================================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

# Verificar se o PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado. Por favor, instale o PostgreSQL 14+ primeiro."
    echo "   Download: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ Node.js e PostgreSQL encontrados"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o arquivo .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚙️  Criando arquivo de configuração..."
    cp env.example .env.local
    echo "📝 Por favor, edite o arquivo .env.local com suas configurações de banco de dados"
    echo "   Especialmente a variável DATABASE_URL"
    read -p "Pressione Enter quando terminar de configurar o .env.local..."
fi

# Configurar banco de dados
echo "🗄️  Configurando banco de dados..."

# Gerar cliente Prisma
echo "   Gerando cliente Prisma..."
npm run db:generate

# Executar migrações
echo "   Executando migrações..."
npm run db:push

# Popular banco com dados iniciais
echo "   Populando banco com dados iniciais..."
npm run db:seed

echo ""
echo "🎉 Configuração concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Acesse: http://localhost:3000"
echo "   3. Painel Admin: http://localhost:3000/admin"
echo "   4. Login: admin@camara.gov.br / admin123"
echo ""
echo "📚 Documentação completa no README.md"
echo ""
echo "🏛️  Sistema Legislativo Municipal"
echo "   Desenvolvido para transparência pública e gestão legislativa"
