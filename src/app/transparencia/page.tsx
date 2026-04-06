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
      cor: 'blue',
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
      cor: 'green',
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
      cor: 'purple',
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
      cor: 'orange',
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
      cor: 'indigo',
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
      cor: 'teal',
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
      cor: 'amber',
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
      cor: 'rose',
      itens: [
        { nome: 'Bens Imoveis', href: '/transparencia/bens-imoveis', icon: Building2 },
        { nome: 'Bens Moveis', href: '/transparencia/bens-moveis', icon: Briefcase },
      ]
    },
  ];

  // Mapa de cores para classes Tailwind
  const corClasses: Record<string, { border: string; bg: string; bgLight: string; text: string; iconBg: string; hoverBorder: string }> = {
    blue:   { border: 'border-blue-500', bg: 'bg-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', hoverBorder: 'hover:border-blue-400' },
    green:  { border: 'border-green-500', bg: 'bg-green-600', bgLight: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', hoverBorder: 'hover:border-green-400' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100', hoverBorder: 'hover:border-purple-400' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-600', bgLight: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-100', hoverBorder: 'hover:border-orange-400' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-600', bgLight: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100', hoverBorder: 'hover:border-indigo-400' },
    teal:   { border: 'border-teal-500', bg: 'bg-teal-600', bgLight: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100', hoverBorder: 'hover:border-teal-400' },
    amber:  { border: 'border-amber-500', bg: 'bg-amber-600', bgLight: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', hoverBorder: 'hover:border-amber-400' },
    rose:   { border: 'border-rose-500', bg: 'bg-rose-600', bgLight: 'bg-rose-50', text: 'text-rose-700', iconBg: 'bg-rose-100', hoverBorder: 'hover:border-rose-400' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
            { nome: 'E-SIC', desc: 'Acesso a Informacao', href: '/institucional/e-sic', icon: FileSearch, cor: 'bg-blue-600' },
            { nome: 'Ouvidoria', desc: 'Fale conosco', href: '/institucional/ouvidoria', icon: MessageSquare, cor: 'bg-orange-600' },
            { nome: 'Dados Abertos', desc: 'APIs e downloads', href: '/transparencia/dados-abertos', icon: Globe, cor: 'bg-green-600' },
            { nome: 'Publicacoes', desc: 'Diario e atos oficiais', href: '/transparencia/publicacoes', icon: FolderOpen, cor: 'bg-indigo-600' },
          ].map((item) => (
            <Link
              key={item.nome}
              href={item.href}
              className="group bg-white rounded-xl shadow-lg hover:shadow-xl border border-gray-100 hover:border-gray-200 p-4 md:p-5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`${item.cor} p-2.5 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
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
          {secoes.map((secao) => {
            const cores = corClasses[secao.cor] || corClasses.blue;
            return (
              <div
                key={secao.titulo}
                className={`bg-white rounded-xl border-2 border-gray-100 ${cores.hoverBorder} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group`}
              >
                {/* Header do card */}
                <div className={`${cores.bgLight} px-5 py-4 border-b border-gray-100`}>
                  <div className="flex items-center gap-3">
                    <div className={`${cores.bg} p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>
                      <secao.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${cores.text} text-base`}>{secao.titulo}</h3>
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
                      <div className={`${cores.iconBg} p-1.5 rounded-md flex-shrink-0`}>
                        <item.icon className={`h-4 w-4 ${cores.text}`} />
                      </div>
                      <span className="text-sm text-gray-700 group-hover/item:text-gray-900 flex-1">
                        {item.nome}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-gray-500 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legislacao Vigente - Barra horizontal */}
      <div className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-cyan-600 p-2.5 rounded-lg shadow-sm">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-cyan-700 text-lg">Legislacao Vigente</h3>
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
                <div className="bg-cyan-50 p-1.5 rounded-md flex-shrink-0 mt-0.5">
                  <lei.icon className="h-4 w-4 text-cyan-600" />
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
          <div className="bg-emerald-600 p-2.5 rounded-lg shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-700 text-lg">Boas Praticas de Transparencia</h3>
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
              className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all text-center group"
            >
              <div className="bg-emerald-50 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <item.icon className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">{item.nome}</span>
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
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-blue-700">Informacoes do Municipio</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <>
                    <InfoRow icon={Building2} label={nomeCasa} color="text-blue-600" bold />
                    <InfoRow icon={Activity} label="Mesoregiao: Baixo Amazonas" color="text-blue-600" />
                    <InfoRow icon={Award} label="Codigo IBGE: 1504752" color="text-blue-600" />
                    <InfoRow icon={Globe} label={`Site: ${config?.site || 'Nao configurado'}`} color="text-blue-600" />
                    <InfoRow icon={MapPin} label={`Endereco: ${enderecoCompleto}`} color="text-blue-600" />
                  </>
                )}
              </div>
            </div>

            {/* Info Ouvidoria */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-600 p-2 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-orange-700">Informacoes da Ouvidoria</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                  </div>
                ) : (
                  <>
                    <InfoRow icon={MapPin} label={`Presencial: ${enderecoCompleto}`} color="text-orange-600" />
                    <InfoRow icon={Clock} label="Horario: 08:00h as 14:00h, Segunda a Sexta" color="text-orange-600" />
                    <InfoRow icon={Phone} label={`Telefone: ${config?.telefone || '(93) 991388426'}`} color="text-orange-600" />
                    <InfoRow icon={Mail} label={`E-mail: ${config?.email || 'Nao configurado'}`} color="text-orange-600" />
                    <InfoRow icon={Users} label="Ouvidor(a): A definir" color="text-orange-600" />
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
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
      <Icon className={`h-4 w-4 ${color} mt-0.5 flex-shrink-0`} />
      <p className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</p>
    </div>
  );
}
