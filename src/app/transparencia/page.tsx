'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Users,
  Building2,
  DollarSign,
  Shield,
  BookOpen,
  Scale,
  CheckCircle2,
  FileCheck,
  FolderOpen,
  MessageSquare,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  BarChart3,
  Activity,
  Globe,
  Briefcase,
  ChevronRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface ConfiguracaoInstitucional {
  nome: string;
  sigla: string | null;
  cnpj: string | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
  };
  telefone: string | null;
  email: string | null;
  site: string | null;
}

interface DadosInstitucionais {
  configuracao: ConfiguracaoInstitucional | null;
}

export default function TransparenciaPage() {
  const [dados, setDados] = useState<DadosInstitucionais | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const response = await fetch('/api/institucional');
        const result = await response.json();
        if (result.dados) {
          setDados(result.dados);
        }
      } catch (err) {
        console.error('Erro ao buscar dados institucionais:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  const config = dados?.configuracao;
  const nomeCasa = config?.nome || 'Câmara Municipal de Mojuí dos Campos';
  const endereco = config?.endereco;
  const enderecoCompleto = endereco?.logradouro
    ? `${endereco.logradouro}${endereco.numero ? `, ${endereco.numero}` : ', s/nº'}${endereco.bairro ? ` - ${endereco.bairro}` : ''}`
    : 'Rua Deputado José Macêdo, s/nº - Centro';
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Hero Section - Visual Melhorado */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white overflow-hidden">
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
        
        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-5xl mx-auto space-y-6">
            <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4 animate-bounce">
              <Shield className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              Bem vindo ao Portal da Transparência
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-blue-100">
              {nomeCasa}
            </h2>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20 shadow-2xl">
              <p className="text-base mb-2 text-blue-50">
                Em atendimento a resolução administrativa nº 007/2016/TCMPA, de 18 de fevereiro de 2016
              </p>
              <p className="text-base text-blue-100">
                Última atualização: Instrução normativa nº11/2021/TCMPA, de 28 de abril de 2021
              </p>
            </div>
            
            {/* Botões de Informações Melhorados */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="group bg-white text-blue-800 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-blue-300"
              >
                <Building2 className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Clique aqui para informações da Câmara
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                className="group bg-white text-blue-800 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-blue-300"
              >
                <MessageSquare className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Clique aqui para informações da ouvidoria
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* §1o. Do portal da transparência */}
        <div className="mb-12 animate-fade-in">
          <Card className="border-t-4 border-t-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 relative">
              <CardTitle className="text-2xl flex items-center text-blue-900 font-bold">
                <div className="p-2 bg-blue-600 rounded-lg mr-3 shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                Portal da transparência
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                §1o. Do portal da transparência:
              </p>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/transparencia/mesa-diretora" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <Users className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Mesa Diretora e Vereadores
                    </h3>
                  </div>
                </Link>
                
                <Link href="#" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <FileCheck className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Estrutura Organizacional - Lei Municipal
                    </h3>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <MapPin className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Endereço e Horário de Atendimento
                    </h3>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <Activity className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Organograma
                    </h3>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <FileCheck className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Agenda Externa do Presidente
                    </h3>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <Briefcase className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Competências Organizacionais
                    </h3>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <BookOpen className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Carta de Serviços ao Usuário
                    </h3>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-600 transition-colors">
                      <HelpCircle className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      Perguntas Frequentes FAQ
                    </h3>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §2o. Lei de Responsabilidade Fiscal */}
        <div className="mb-12 animate-fade-in">
          <Card className="border-t-4 border-t-green-600 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100/50 relative">
              <CardTitle className="text-2xl flex items-center text-green-900 font-bold">
                <div className="p-2 bg-green-600 rounded-lg mr-3 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                Lei de Responsabilidade Fiscal
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                §2o. Das publicações vinculadas aos instrumentos de planejamento e gestão fiscal:
              </p>
            </CardHeader>
            <CardContent className="p-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/transparencia/loa" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-green-100 rounded-lg w-fit mb-3 group-hover:bg-green-600 transition-colors">
                      <FileText className="h-7 w-7 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors leading-tight text-lg">
                      LOA
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Lei Orçamentária Anual</p>
                  </div>
                </Link>

                <Link href="/transparencia/ldo" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-green-100 rounded-lg w-fit mb-3 group-hover:bg-green-600 transition-colors">
                      <FileText className="h-7 w-7 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors leading-tight text-lg">
                      LDO
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Lei de Diretrizes Orçamentárias</p>
                  </div>
                </Link>

                <Link href="/transparencia/ppa" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-green-100 rounded-lg w-fit mb-3 group-hover:bg-green-600 transition-colors">
                      <FileText className="h-7 w-7 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors leading-tight text-lg">
                      PPA
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Plano Plurianual</p>
                  </div>
                </Link>

                <Link href="/transparencia/rgf" className="group">
                  <div className="p-5 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="p-2 bg-green-100 rounded-lg w-fit mb-3 group-hover:bg-green-600 transition-colors">
                      <FileText className="h-7 w-7 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors leading-tight text-lg">
                      RGF
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Relatório de Gestão Fiscal</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §3o. Receitas, despesas, convênios, folhas, licitações e contratos */}
        <div className="mb-12">
          <Card className="border-t-4 border-t-purple-600">
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-xl flex items-center text-purple-900">
                <TrendingUp className="mr-3 h-6 w-6" />
                Receitas, despesas, convênios, folhas, licitações e contratos
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                §3o. Das publicações vinculadas ao acompanhamento de receitas e despesas:
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Receitas */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
                    Receitas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-7">
                    <Link href="/transparencia/receitas" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      RECEITAS ATÉ 2022
                    </Link>
                    <Link href="/transparencia/receitas" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      RECEITAS 2023
                    </Link>
                  </div>
                </div>

                {/* Despesas */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                    Despesas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-7">
                    <Link href="/transparencia/despesas" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      DESPESAS ATÉ 2022
                    </Link>
                    <Link href="/transparencia/despesas" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                      <ChevronRight className="h-4 w-4 mr-1" />
                      DESPESAS 2023
                    </Link>
                  </div>
                </div>

                {/* Outros itens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/transparencia/licitacoes" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Licitações
                  </Link>
                  <Link href="/transparencia/contratos" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Contratos
                  </Link>
                  <Link href="/transparencia/convenios" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Convênios
                  </Link>
                  <Link href="/transparencia/folha-pagamento" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Pessoal - Folha
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Cargos e Funções
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Diárias
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Balancete Financeiro
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Notas Fiscais
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Estagiários
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Terceirizados
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Plano de Contratação
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Inidôneas/Suspensas
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Cronograma de Pagamentos
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Contas de Governo
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Contas de Gestão
                  </Link>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Balanço Geral
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §4o. Ouvidoria e e-Sic */}
        <div className="mb-12">
          <Card className="border-t-4 border-t-orange-600">
            <CardHeader className="bg-orange-50">
              <CardTitle className="text-xl flex items-center text-orange-900">
                <MessageSquare className="mr-3 h-6 w-6" />
                Ouvidoria e e-Sic
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                §4o. Do serviço de atendimento ao cidadão:
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="#" className="group">
                  <div className="p-4 border rounded-lg hover:border-orange-500 hover:shadow-md transition-all">
                    <HelpCircle className="h-8 w-8 text-orange-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      Perguntas e Respostas
                    </h3>
                  </div>
                </Link>

                <Link href="/institucional/e-sic" className="group">
                  <div className="p-4 border rounded-lg hover:border-orange-500 hover:shadow-md transition-all">
                    <FileCheck className="h-8 w-8 text-orange-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      E-SIC
                    </h3>
                  </div>
                </Link>

                <Link href="/institucional/ouvidoria" className="group">
                  <div className="p-4 border rounded-lg hover:border-orange-500 hover:shadow-md transition-all">
                    <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      Ouvidoria
                    </h3>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="p-4 border rounded-lg hover:border-orange-500 hover:shadow-md transition-all">
                    <Mail className="h-8 w-8 text-orange-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      Fale Conosco
                    </h3>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* §5o. Publicações */}
        <div className="mb-12">
          <Card className="border-t-4 border-t-indigo-600">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="text-xl flex items-center text-indigo-900">
                <FolderOpen className="mr-3 h-6 w-6" />
                Publicações
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                §5o. Atos e normativos legais:
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/institucional/lei-organica" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Lei Orgânica
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Regulamentação da LAI
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Pautas das Sessões
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Atas das Sessões
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Decretos Legislativos
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Resoluções vigentes
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Atos de Julgamentos
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Regime Jurídico
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Plano de Cargos
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Normativo sobre Diárias
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Relatório Controle Interno
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Projetos de Lei
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Bens Móveis
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Bens Imóveis
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Programas e Ações
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Projetos e Atividades
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Comissão Patrimônio
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Dispensa e Inexigibilidade
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Concursos/Processo Seletivo
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Relatório de Gestão ou Atividades
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Objetivos Estratégicos da Instituição
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Pautas das Comissões
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Lista de Votação Nominal
                </Link>
                <Link href="/transparencia/leis" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Leis Municipais
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Regulamentação e Cotas Parlamentares
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* VII. Boas práticas de transparência pública */}
        <div className="mb-12">
          <Card className="border-t-4 border-t-emerald-600">
            <CardHeader className="bg-emerald-50">
              <CardTitle className="text-xl flex items-center text-emerald-900">
                <CheckCircle2 className="mr-3 h-6 w-6" />
                Boas práticas de transparência pública
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Boas práticas de transparência:
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Mapa do Site
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Dados Abertos
                </Link>
                <Link href="/institucional/dicionario" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Glossário
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Contatos
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Pesquisa de Satisfação
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Informações da LGPD
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Obras
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legislação vigente */}
        <div className="mb-12">
          <Card className="border-t-4 border-t-cyan-600">
            <CardHeader className="bg-cyan-50">
              <CardTitle className="text-xl flex items-center text-cyan-900">
                <Scale className="mr-3 h-6 w-6" />
                Legislação vigente
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Legislação vigente:
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  TAG-Termo de Ajustamento de Gestão
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Lei de Acesso a Informações nº 12.527
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Lei Complementar nº 101
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Lei da Transparência nº 131
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Decreto de Gestão Fiscal nº 7.185
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  IN Nº11/2021/TCMPA
                </Link>
                <Link href="#" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Normativa Lei Federal 14.129/2021
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais do Município */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="relative overflow-hidden border-2 border-blue-200 hover:border-blue-400 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="bg-gradient-to-br from-blue-100 to-blue-50 relative">
              <CardTitle className="flex items-center text-blue-900 text-xl font-bold">
                <div className="p-2 bg-blue-600 rounded-lg mr-3 shadow-lg group-hover:scale-110 transition-transform">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                Informações do município
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Carregando...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">{nomeCasa}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Activity className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Mesorregião:</strong> <span className="text-gray-900">Baixo Amazonas</span></p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Award className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Código do IBGE:</strong> <span className="text-gray-900">1504752</span></p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Globe className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Sítio Eletrônico:</strong> <span className="text-blue-600">{config?.site || 'www.camaramojuidoscampos.pa.gov.br'}</span></p>
                    </div>
                  </div>
                  <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Endereço:</strong> <span className="text-gray-900">{enderecoCompleto}</span></p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-orange-200 hover:border-orange-400 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="bg-gradient-to-br from-orange-100 to-orange-50 relative">
              <CardTitle className="flex items-center text-orange-900 text-xl font-bold">
                <div className="p-2 bg-orange-600 rounded-lg mr-3 shadow-lg group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                Informações da ouvidoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  <span className="ml-2 text-gray-500">Carregando...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <MapPin className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Presencial:</strong> <span className="text-gray-900">{enderecoCompleto}</span></p>
                    </div>
                  </div>
                  <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Activity className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Horário:</strong> <span className="text-gray-900">De 08:00h às 14:00h, Segunda à Sexta</span></p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Phone className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Telefones:</strong> <span className="text-gray-900">{config?.telefone || '(93) 991388426'}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Mail className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">E-mail:</strong> <span className="text-orange-600">{config?.email || 'camaramojui@hotmail.com'}</span></p>
                    </div>
                  </div>
                  <div className="flex items-start p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Users className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm"><strong className="text-gray-700">Ouvidor(a):</strong> <span className="text-gray-900">A definir</span></p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
