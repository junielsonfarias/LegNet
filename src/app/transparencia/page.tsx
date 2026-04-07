'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Users, Building2, DollarSign, Shield, BookOpen, Scale,
  CheckCircle2, FileCheck, FolderOpen, MessageSquare, HelpCircle,
  Mail, Phone, MapPin, Award, TrendingUp, BarChart3, Activity,
  Globe, Briefcase, ChevronRight, Loader2, Landmark, Receipt,
  Gavel, UserCheck, Clock, Search, Vote, Handshake, ScrollText,
  FileSearch, CreditCard, CalendarDays,
  GraduationCap, ClipboardList, PieChart, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';

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

export default function TransparenciaPage() {
  const [dados, setDados] = useState<{ configuracao: ConfiguracaoInstitucional | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const breadcrumbs = useBreadcrumbs();

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const response = await fetch('/api/institucional');
        const result = await response.json();
        if (result.dados) setDados(result.dados);
      } catch (err) {
        console.error('Erro ao buscar dados institucionais:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  const config = dados?.configuracao;
  const nomeCasa = config?.nome || 'Camara Municipal';
  const endereco = config?.endereco;
  const enderecoCompleto = endereco?.logradouro
    ? `${endereco.logradouro}${endereco.numero ? `, ${endereco.numero}` : ', s/no'}${endereco.bairro ? ` - ${endereco.bairro}` : ''}`
    : 'Rua Deputado Jose Macedo, s/no - Centro';

  // Secoes tematicas organizadas
  const secoes = [
    {
      titulo: 'Portal Institucional',
      subtitulo: '§1o. Do portal da transparencia',
      icon: Building2,
      itens: [
        { nome: 'Mesa Diretora e Vereadores', href: '/transparencia/mesa-diretora', icon: Users },
        { nome: 'Organograma', href: '/transparencia/institucional/organograma', icon: Activity },
        { nome: 'Competencias', href: '/transparencia/institucional/competencias', icon: Briefcase },
        { nome: 'Horario de Atendimento', href: '/transparencia/institucional/horario-funcionamento', icon: Clock },
        { nome: 'Estrutura Organizacional', href: '/institucional/sobre', icon: FileCheck },
      ]
    },
    {
      titulo: 'Gestao Fiscal',
      subtitulo: '§2o. Planejamento e gestao fiscal',
      icon: PieChart,
      itens: [
        { nome: 'LOA - Lei Orcamentaria Anual', href: '/transparencia/loa', icon: FileText },
        { nome: 'LDO - Diretrizes Orcamentarias', href: '/transparencia/ldo', icon: FileText },
        { nome: 'PPA - Plano Plurianual', href: '/transparencia/ppa', icon: FileText },
        { nome: 'RGF - Relatorio de Gestao Fiscal', href: '/transparencia/rgf', icon: BarChart3 },
        { nome: 'Gestao Fiscal', href: '/transparencia/gestao-fiscal', icon: TrendingUp },
      ]
    },
    {
      titulo: 'Financas Publicas',
      subtitulo: '§3o. Receitas, despesas, contratos',
      icon: DollarSign,
      itens: [
        { nome: 'Receitas', href: '/transparencia/receitas', icon: TrendingUp },
        { nome: 'Despesas', href: '/transparencia/despesas', icon: CreditCard },
        { nome: 'Licitacoes', href: '/transparencia/licitacoes', icon: Search },
        { nome: 'Contratos', href: '/transparencia/contratos', icon: FileCheck },
        { nome: 'Convenios', href: '/transparencia/convenios', icon: Handshake },
      ]
    },
    {
      titulo: 'Atendimento ao Cidadao',
      subtitulo: '§4o. Servico de atendimento',
      icon: MessageSquare,
      itens: [
        { nome: 'E-SIC - Acesso a Informacao', href: '/institucional/e-sic', icon: FileSearch },
        { nome: 'Ouvidoria', href: '/institucional/ouvidoria', icon: MessageSquare },
        { nome: 'Perguntas Frequentes', href: '/institucional/sobre', icon: HelpCircle },
        { nome: 'Fale Conosco', href: '/institucional/ouvidoria', icon: Mail },
      ]
    },
    {
      titulo: 'Publicacoes Oficiais',
      subtitulo: '§5o. Atos e normativos legais',
      icon: FolderOpen,
      itens: [
        { nome: 'Leis Municipais', href: '/transparencia/leis', icon: ScrollText },
        { nome: 'Decretos Legislativos', href: '/transparencia/decretos', icon: Gavel },
        { nome: 'Portarias', href: '/transparencia/portarias', icon: FileText },
        { nome: 'Pautas das Sessoes', href: '/legislativo/pautas-sessoes', icon: ClipboardList },
        { nome: 'Atas das Sessoes', href: '/legislativo/atas', icon: BookOpen },
        { nome: 'Normas Juridicas', href: '/legislativo/normas', icon: Scale },
      ]
    },
    {
      titulo: 'Pessoal e RH',
      subtitulo: 'Gestao de pessoal e remuneracao',
      icon: UserCheck,
      itens: [
        { nome: 'Folha de Pagamento', href: '/transparencia/folha-pagamento', icon: Wallet },
        { nome: 'Quadro de Pessoal', href: '/transparencia/pessoal/quadro-pessoal', icon: Users },
        { nome: 'Diarias', href: '/transparencia/pessoal/diarias', icon: CalendarDays },
        { nome: 'Concursos', href: '/transparencia/pessoal/concursos', icon: GraduationCap },
        { nome: 'Servidores', href: '/transparencia/pessoal', icon: UserCheck },
      ]
    },
    {
      titulo: 'Transparencia Parlamentar',
      subtitulo: 'Atuacao e gastos dos vereadores',
      icon: Vote,
      itens: [
        { nome: 'Presencas em Sessoes', href: '/transparencia/parlamentar/presencas', icon: CheckCircle2 },
        { nome: 'Votacoes Nominais', href: '/transparencia/legislativo/votacoes-nominais', icon: Vote },
        { nome: 'Verbas Indenizatorias', href: '/transparencia/parlamentar/indenizatoria', icon: Receipt },
        { nome: 'Producao Legislativa', href: '/transparencia/parlamentar/producao', icon: FileText },
        { nome: 'Relatorio por Parlamentar', href: '/transparencia/parlamentar/relatorio', icon: BarChart3 },
      ]
    },
    {
      titulo: 'Patrimonio Publico',
      subtitulo: 'Bens moveis e imoveis',
      icon: Landmark,
      itens: [
        { nome: 'Bens Imoveis', href: '/transparencia/bens-imoveis', icon: Building2 },
        { nome: 'Bens Moveis', href: '/transparencia/bens-moveis', icon: Briefcase },
      ]
    },
  ];

  // Estilos baseados no tema municipal (CSS variables da instalacao)
  const themeStyles = {
    iconBg: { backgroundColor: 'var(--municipal-primary)' },
    iconBgLight: { backgroundColor: 'var(--municipal-primary-lighter)' },
    sectionBg: { backgroundColor: 'var(--municipal-primary-lighter)' },
    textColor: { color: 'var(--municipal-primary-dark)' },
    iconColor: { color: 'var(--municipal-primary)' },
    borderColor: { borderColor: 'var(--municipal-primary-light)' },
    hoverBorder: { borderColor: 'var(--municipal-primary)' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br gradient-municipal-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-4xl mx-auto space-y-4 md:space-y-6">
            <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold">
              Portal da Transparencia
            </h1>
            <h2 className="text-lg md:text-2xl font-semibold text-white/80">
              {nomeCasa}
            </h2>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 border border-white/20">
              <p className="text-sm md:text-base text-white/90">
                Em atendimento a resolucao administrativa no 007/2016/TCMPA e instrucao normativa no11/2021/TCMPA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acesso Rapido */}
      <div className="container mx-auto px-4 -mt-6 md:-mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { nome: 'E-SIC', desc: 'Acesso a Informacao', href: '/institucional/e-sic', icon: FileSearch },
            { nome: 'Ouvidoria', desc: 'Fale conosco', href: '/institucional/ouvidoria', icon: MessageSquare },
            { nome: 'Dados Abertos', desc: 'APIs e downloads', href: '/transparencia/dados-abertos', icon: Globe },
            { nome: 'Publicacoes', desc: 'Diario e atos oficiais', href: '/transparencia/publicacoes', icon: FolderOpen },
          ].map((item) => (
            <Link
              key={item.nome}
              href={item.href}
              className="group bg-white rounded-xl shadow-lg hover:shadow-xl border border-gray-100 hover:border-gray-200 p-4 md:p-5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-2.5 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform" style={themeStyles.iconBg}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm md:text-base">{item.nome}</h3>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Secoes Tematicas */}
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
          {secoes.map((secao) => (
              <div
                key={secao.titulo}
                className="bg-white rounded-xl border-2 border-gray-100 hover:border-[var(--municipal-primary-light)] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                {/* Header do card */}
                <div className="px-5 py-4 border-b border-gray-100" style={themeStyles.sectionBg}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform" style={themeStyles.iconBg}>
                      <secao.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={themeStyles.textColor}>{secao.titulo}</h3>
                      <p className="text-xs text-gray-500">{secao.subtitulo}</p>
                    </div>
                  </div>
                </div>

                {/* Itens do card */}
                <div className="p-3">
                  {secao.itens.map((item) => (
                    <Link
                      key={item.nome}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group/item"
                    >
                      <div className="p-1.5 rounded-md flex-shrink-0" style={themeStyles.iconBgLight}>
                        <item.icon className="h-4 w-4" style={themeStyles.iconColor} />
                      </div>
                      <span className="text-sm text-gray-700 group-hover/item:text-gray-900 flex-1">
                        {item.nome}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-gray-500 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
          ))}
        </div>
      </div>

      {/* Legislacao Vigente - Barra horizontal */}
      <div className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-lg shadow-sm" style={themeStyles.iconBg}>
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={themeStyles.textColor}>Legislacao Vigente</h3>
              <p className="text-xs text-gray-500">Normas de transparencia e acesso a informacao</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { nome: 'Lei de Acesso a Informacao', desc: 'Lei no 12.527/2011', icon: BookOpen },
              { nome: 'Lei de Responsabilidade Fiscal', desc: 'Lei Complementar no 101/2000', icon: DollarSign },
              { nome: 'Lei da Transparencia', desc: 'Lei Complementar no 131/2009', icon: Shield },
              { nome: 'Decreto de Gestao Fiscal', desc: 'Decreto no 7.185/2010', icon: FileText },
              { nome: 'IN no11/2021/TCMPA', desc: 'Instrucao Normativa TCMPA', icon: Gavel },
              { nome: 'Lei Federal 14.129/2021', desc: 'Governo Digital', icon: Globe },
              { nome: 'Lei Organica Municipal', desc: 'Lei Organica da Camara', icon: ScrollText },
              { nome: 'Regimento Interno', desc: 'Normas internas', icon: ClipboardList },
            ].map((lei) => (
              <div key={lei.nome} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                <div className="p-1.5 rounded-md flex-shrink-0 mt-0.5" style={themeStyles.iconBgLight}>
                  <lei.icon className="h-4 w-4" style={themeStyles.iconColor} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-tight">{lei.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{lei.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Boas Praticas */}
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg shadow-sm" style={themeStyles.iconBg}>
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={themeStyles.textColor}>Boas Praticas de Transparencia</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { nome: 'Dados Abertos', href: '/api-docs', icon: Globe },
            { nome: 'Glossario', href: '/institucional/dicionario', icon: BookOpen },
            { nome: 'Pesquisa Satisfacao', href: '/transparencia/pesquisas', icon: Search },
            { nome: 'LGPD', href: '/transparencia', icon: Shield },
            { nome: 'Mapa do Site', href: '/busca', icon: MapPin },
            { nome: 'Contatos', href: '/institucional/ouvidoria', icon: Phone },
          ].map((item) => (
            <Link
              key={item.nome}
              href={item.href}
              className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border border-gray-100 hover:border-[var(--municipal-primary-light)] hover:shadow-md transition-all text-center group"
            >
              <div className="p-2 rounded-lg transition-colors" style={themeStyles.iconBgLight}>
                <item.icon className="h-5 w-5" style={themeStyles.iconColor} />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-[var(--municipal-primary-dark)]">{item.nome}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Informacoes do Municipio e Ouvidoria */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* Info Municipio */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100" style={themeStyles.sectionBg}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={themeStyles.iconBg}>
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold" style={themeStyles.textColor}>Informacoes do Municipio</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" style={themeStyles.iconColor} />
                  </div>
                ) : (
                  <>
                    <InfoRow icon={Building2} label={nomeCasa} color="municipal" bold />
                    <InfoRow icon={Activity} label={`Tipo: Câmara Municipal`} color="municipal" />
                    <InfoRow icon={Globe} label={`Site: ${config?.site || 'Nao configurado'}`} color="municipal" />
                    <InfoRow icon={MapPin} label={`Endereco: ${enderecoCompleto}`} color="municipal" />
                  </>
                )}
              </div>
            </div>

            {/* Info Ouvidoria */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: 'var(--municipal-secondary-light)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--municipal-secondary)' }}>
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold" style={{ color: 'var(--municipal-secondary-dark)' }}>Informacoes da Ouvidoria</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--municipal-secondary)' }} />
                  </div>
                ) : (
                  <>
                    <InfoRow icon={MapPin} label={`Presencial: ${enderecoCompleto}`} color="secondary" />
                    <InfoRow icon={Clock} label="Horario: 08:00h as 14:00h, Segunda a Sexta" color="secondary" />
                    <InfoRow icon={Phone} label={`Telefone: ${config?.telefone || 'Não configurado'}`} color="secondary" />
                    <InfoRow icon={Mail} label={`E-mail: ${config?.email || 'Nao configurado'}`} color="secondary" />
                    <InfoRow icon={Users} label="Ouvidor(a): A definir" color="secondary" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para linhas de informacao
function InfoRow({ icon: Icon, label, color, bold }: { icon: any; label: string; color: string; bold?: boolean }) {
  const iconStyle = color === 'secondary'
    ? { color: 'var(--municipal-secondary)' }
    : { color: 'var(--municipal-primary)' }

  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={iconStyle} />
      <p className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</p>
    </div>
  );
}
