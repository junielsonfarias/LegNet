'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Users, Building2, DollarSign, Shield, BookOpen, Scale,
  CheckCircle2, FileCheck, FolderOpen, MessageSquare, HelpCircle,
  Mail, Phone, MapPin, TrendingUp, BarChart3, Activity,
  Globe, Briefcase, ChevronRight, Loader2, Landmark, Receipt,
  Gavel, UserCheck, Clock, Search, Vote, Handshake, ScrollText,
  FileSearch, CreditCard, CalendarDays, ExternalLink, Car, HardHat,
  GraduationCap, ClipboardList, PieChart, Wallet, Banknote, FileBarChart,
  Lock, Database, Megaphone, Calendar, FileSignature, UserPlus, FileQuestion,
  Truck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger('transparencia');

// URL do portal externo legado (CR2). E um app Bubble.io com roteamento client-side,
// entao deep links nao funcionam de forma confiavel - todos os itens nao migrados
// apontam para a raiz da entidade e o usuario navega no menu de la.
const CR2_BASE = 'https://www.portalcr2.com.br/entidade/cm-chaves';

type TransparenciaSubItem = {
  nome: string;
  href?: string;
  externalUrl?: string;
};

type TransparenciaItem = {
  nome: string;
  icon: LucideIcon;
  href?: string;
  externalUrl?: string;
  subItens?: TransparenciaSubItem[];
  // Slug que liga este item a uma categoria configuravel em
  // /admin/configuracoes/transparencia-periodos. Quando houver config ativa
  // no DB, os subItens hardcoded sao substituidos pelos periodos configurados.
  slug?: string;
};

type PeriodoDb = {
  id: string;
  label: string;
  url?: string;
  hrefInterno?: string;
  ano?: number | null;
  ordem: number;
  ativo: boolean;
};

type ConfigPeriodosDb = {
  enabled: boolean;
  titulo?: string;
  descricao?: string;
  periodos: PeriodoDb[];
};

type TransparenciaSecao = {
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
  itens: TransparenciaItem[];
};

// Estrutura espelhada do portal antigo (CR2) - 9 secoes, todos os itens e subitens.
// Itens com `href` usam rota interna; itens com `externalUrl` abrem o portal CR2 em nova aba.
const SECOES_TRANSPARENCIA: TransparenciaSecao[] = [
  {
    titulo: 'Informacoes Institucionais',
    subtitulo: 'Estrutura, parlamentares e funcionamento',
    icon: Building2,
    itens: [
      { nome: 'Estrutura Organizacional', icon: Activity, href: '/transparencia/institucional/organograma' },
      { nome: 'Legislaturas', icon: Calendar, externalUrl: CR2_BASE },
      { nome: 'Parlamentares', icon: Users, href: '/parlamentares' },
      { nome: 'Mesa Diretora', icon: UserCheck, href: '/transparencia/mesa-diretora' },
      { nome: 'Agenda Externa', icon: CalendarDays, externalUrl: CR2_BASE },
      { nome: 'Comissoes', icon: Briefcase, externalUrl: CR2_BASE },
      { nome: 'Perguntas Frequentes', icon: HelpCircle, href: '/institucional/sobre' },
      { nome: 'Legislacao Tributaria e Codigos de Postura', icon: Scale, externalUrl: CR2_BASE },
    ],
  },
  {
    titulo: 'Atividades do Legislativo',
    subtitulo: 'Documentos, materias e sessoes',
    icon: FolderOpen,
    itens: [
      {
        nome: 'Documentos Administrativos',
        icon: FileText,
        subItens: [
          { nome: 'Portarias', href: '/transparencia/atos/portarias' },
          { nome: 'Decretos Legislativos', href: '/transparencia/atos/decretos' },
          { nome: 'Resolucoes', href: '/transparencia/atos/resolucoes' },
          { nome: 'Atos da Mesa Diretora', href: '/transparencia/atos/atos-mesa' },
          { nome: 'Atos da Presidencia', href: '/transparencia/atos/atos-presidencia' },
          { nome: 'Oficios', href: '/transparencia/atos/oficios' },
          { nome: 'Editais', href: '/transparencia/atos/editais' },
          { nome: 'Erratas', href: '/transparencia/atos/erratas' },
          { nome: 'Convocacoes', href: '/transparencia/atos/convocacoes' },
          { nome: 'Comunicados', href: '/transparencia/atos/comunicados' },
          { nome: 'Agendas', href: '/transparencia/atos/agendas' },
          { nome: 'Atas de Sessao (avulsas)', href: '/transparencia/atos/atas' },
          { nome: 'Pautas de Sessao (avulsas)', href: '/transparencia/atos/pautas' },
        ],
      },
      { nome: 'Materias Legislativas', icon: ScrollText, href: '/legislativo' },
      { nome: 'Sessoes', icon: ClipboardList, href: '/legislativo/pautas-sessoes' },
      { nome: 'Normas Juridicas', icon: Gavel, href: '/legislativo/normas' },
    ],
  },
  {
    titulo: 'Receitas e Despesas',
    subtitulo: 'Execucao orcamentaria e financeira',
    icon: DollarSign,
    itens: [
      { nome: 'Receitas', icon: TrendingUp, href: '/transparencia/receitas', slug: 'receitas' },
      { nome: 'Despesas', icon: CreditCard, href: '/transparencia/despesas', slug: 'despesas' },
      { nome: 'Repasses', icon: Banknote, href: '/transparencia/repasses', slug: 'repasses' },
      { nome: 'Programas e Acoes', icon: ClipboardList, href: '/transparencia/programas-acoes', slug: 'programas-acoes' },
      { nome: 'Gastos com Cartao de Credito', icon: CreditCard, href: '/transparencia/cartoes-corporativos', slug: 'cartao-credito' },
      { nome: 'Notas Fiscais Liquidadas', icon: Receipt, href: '/transparencia/notas-fiscais', slug: 'notas-fiscais' },
      { nome: 'Cotas para Exercicio da Atividade Parlamentar', icon: Wallet, href: '/transparencia/cotas-parlamentar', slug: 'cotas-parlamentar' },
      { nome: 'Ordem Cronologica de Pagamentos', icon: Clock, href: '/transparencia/ordem-pagamentos', slug: 'ordem-pagamentos' },
    ],
  },
  {
    titulo: 'Recursos Humanos',
    subtitulo: 'Servidores, cargos e diarias',
    icon: UserCheck,
    itens: [
      { nome: 'Relacao Nominal de Remuneracao', icon: Users, externalUrl: CR2_BASE },
      { nome: 'Relacao de Cargos e Remuneracao', icon: Briefcase, externalUrl: CR2_BASE },
      { nome: 'Relacao de Estagiarios', icon: GraduationCap, href: '/transparencia/pessoal/estagiarios' },
      { nome: 'Relacao de Prestadores de Servicos Terceirizados', icon: UserPlus, href: '/transparencia/pessoal/terceirizados' },
      { nome: 'Concursos e Processos Seletivos', icon: FileCheck, href: '/transparencia/pessoal/concursos' },
      { nome: 'Diarias', icon: CalendarDays, href: '/transparencia/pessoal/diarias', slug: 'diarias' },
      { nome: 'Tabela com os Valores das Diarias', icon: FileBarChart, externalUrl: CR2_BASE },
      { nome: 'Folha de Pagamento', icon: Wallet, href: '/transparencia/folha-pagamento', slug: 'folha-pagamento' },
    ],
  },
  {
    titulo: 'Licitacoes, Contratos, Convenios e Obras',
    subtitulo: 'Contratacoes publicas e transferencias',
    icon: Search,
    itens: [
      { nome: 'Licitacoes', icon: Search, href: '/transparencia/licitacoes', slug: 'licitacoes' },
      { nome: 'Aviso de Licitacao', icon: Megaphone, externalUrl: CR2_BASE },
      { nome: 'Contratos', icon: FileSignature, href: '/transparencia/contratos', slug: 'contratos' },
      { nome: 'Plano Anual de Contratacoes', icon: ClipboardList, href: '/transparencia/documentos/plano-anual-contratacoes' },
      { nome: 'Licitantes/Contratados Sancionados Administrativamente', icon: Shield, href: '/transparencia/fornecedores-sancionados' },
      { nome: 'Cadastro de Fornecedores', icon: Database, externalUrl: CR2_BASE },
      { nome: 'Convenios / Transferencias Voluntarias', icon: Handshake, href: '/transparencia/convenios', slug: 'convenios' },
      { nome: 'Obras', icon: HardHat, href: '/transparencia/obras', slug: 'obras' },
      { nome: 'Obras Paralisadas', icon: HardHat, href: '/transparencia/obras?situacao=PARALISADA' },
    ],
  },
  {
    titulo: 'Patrimonio',
    subtitulo: 'Bens moveis, imoveis e veiculos',
    icon: Landmark,
    itens: [
      { nome: 'Bens Moveis', icon: Briefcase, href: '/transparencia/bens-moveis' },
      { nome: 'Bens Imoveis', icon: Building2, href: '/transparencia/bens-imoveis' },
      { nome: 'Veiculos', icon: Truck, href: '/transparencia/veiculos', slug: 'veiculos' },
    ],
  },
  {
    titulo: 'Planejamento e Prestacao de Contas',
    subtitulo: 'Orcamento, balancos e gestao fiscal',
    icon: PieChart,
    itens: [
      { nome: 'Balancete Financeiro', icon: FileBarChart, href: '/transparencia/documentos/balancete-financeiro' },
      { nome: 'Balanco e Relatorios Anuais', icon: BarChart3, href: '/transparencia/documentos/balanco-anual' },
      {
        nome: 'LDO, LOA e PPA',
        icon: FileText,
        subItens: [
          { nome: 'LDO - Lei de Diretrizes Orcamentarias', href: '/transparencia/ldo' },
          { nome: 'LOA - Lei Orcamentaria Anual', href: '/transparencia/loa' },
          { nome: 'PPA - Plano Plurianual', href: '/transparencia/ppa' },
        ],
      },
      { nome: 'Parecer do Tribunal de Contas', icon: Gavel, href: '/transparencia/documentos/parecer-tcm' },
      { nome: 'Julgamento das Contas do Executivo pelo Legislativo', icon: Scale, href: '/transparencia/documentos/julgamento-contas' },
      { nome: 'Relatorio de Gestao Fiscal - RGF', icon: BarChart3, href: '/transparencia/rgf' },
      { nome: 'Planejamento Estrategico', icon: TrendingUp, href: '/transparencia/documentos/planejamento-estrategico' },
    ],
  },
  {
    titulo: 'Ouvidoria / Servico de Informacao ao Cidadao',
    subtitulo: 'Canais de atendimento e manifestacoes',
    icon: MessageSquare,
    itens: [
      { nome: 'Ouvidoria', icon: MessageSquare, href: '/institucional/ouvidoria' },
      { nome: 'Servico de Informacao ao Cidadao (e-SIC)', icon: FileSearch, href: '/institucional/e-sic' },
      { nome: 'Consultar Manifestacoes', icon: Search, externalUrl: CR2_BASE },
      { nome: 'Manifestacoes Realizadas', icon: FileQuestion, externalUrl: CR2_BASE },
      { nome: 'Relatorios Estatisticos', icon: BarChart3, externalUrl: CR2_BASE },
      { nome: 'Regulamentacao', icon: BookOpen, externalUrl: CR2_BASE },
      { nome: 'Documentos e Informacoes Sigilosas', icon: Lock, externalUrl: CR2_BASE },
    ],
  },
  {
    titulo: 'LGPD e Governo Digital',
    subtitulo: 'Protecao de dados e servicos digitais',
    icon: Shield,
    itens: [
      { nome: 'LGPD e Governo Digital', icon: Shield, href: '/transparencia/documentos/lgpd' },
      { nome: 'Dados Abertos', icon: Database, href: '/transparencia/dados-abertos' },
      { nome: 'Servico Online', icon: Globe, href: '/transparencia/servicos-online' },
      { nome: 'Carta de Servicos ao Usuario', icon: ScrollText, href: '/transparencia/documentos/carta-servicos' },
      { nome: 'Pesquisas de Satisfacao', icon: CheckCircle2, href: '/transparencia/pesquisas' },
    ],
  },
];

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
  const [periodosConfig, setPeriodosConfig] = useState<Record<string, ConfigPeriodosDb>>({});
  const breadcrumbs = useBreadcrumbs();

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [institRes, periodosRes] = await Promise.all([
          fetch('/api/institucional'),
          fetch('/api/transparencia/periodos')
        ]);
        const institResult = await institRes.json();
        if (institResult.dados) setDados(institResult.dados);
        if (periodosRes.ok) {
          const periodosJson = await periodosRes.json();
          if (periodosJson?.data) setPeriodosConfig(periodosJson.data);
        }
      } catch (err) {
        log.error('Erro ao buscar dados institucionais', err);
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

  // Aplica periodos configurados no admin sobre os subItens hardcoded.
  // Se o item tem slug e a config do DB esta enabled, os subItens sao
  // substituidos pelos periodos ativos ordenados. Caso contrario mantem
  // o fallback hardcoded (ou nenhum).
  const resolveSubItens = (item: TransparenciaItem): TransparenciaSubItem[] | undefined => {
    if (!item.slug) return item.subItens;
    const cfg = periodosConfig[item.slug];
    if (!cfg || !cfg.enabled) return item.subItens;
    const periodosAtivos = cfg.periodos
      .filter((p) => p.ativo)
      .sort((a, b) => a.ordem - b.ordem);
    if (periodosAtivos.length === 0) return item.subItens;
    return periodosAtivos.map((p) => ({
      nome: p.label,
      href: p.hrefInterno || undefined,
      externalUrl: p.url || undefined,
    }));
  };

  const secoes = SECOES_TRANSPARENCIA.map((secao) => ({
    ...secao,
    itens: secao.itens.map((item) => ({
      ...item,
      subItens: resolveSubItens(item),
    })),
  }));

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
      <nav aria-label="Acesso rapido" className="container mx-auto px-4 -mt-6 md:-mt-8 relative z-10">
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
      </nav>

      {/* Secoes Tematicas */}
      <section aria-label="Secoes tematicas de transparencia" className="container mx-auto px-4 py-10 md:py-14">
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
                    <TransparenciaItemRow key={item.nome} item={item} themeStyles={themeStyles} />
                  ))}
                </div>
              </div>
          ))}
        </div>
      </section>

      {/* Legislacao Vigente - Barra horizontal */}
      <section aria-label="Legislacao vigente" className="bg-gray-50 border-y border-gray-200">
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
      </section>

      {/* Boas Praticas */}
      <section aria-label="Boas praticas de transparencia" className="container mx-auto px-4 py-8 md:py-10">
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
      </section>

      {/* Informacoes do Municipio e Ouvidoria */}
      <section aria-label="Informacoes do municipio e contato" className="bg-gray-50 border-t border-gray-200">
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
      </section>
    </div>
  );
}

// Linha de item do menu: suporta link interno, externo e subitens (details/summary).
type ThemeStyles = {
  iconBgLight: React.CSSProperties;
  iconColor: React.CSSProperties;
};

function TransparenciaItemRow({ item, themeStyles }: { item: TransparenciaItem; themeStyles: ThemeStyles }) {
  const Icon = item.icon;

  const content = (
    <>
      <div className="p-1.5 rounded-md flex-shrink-0" style={themeStyles.iconBgLight}>
        <Icon className="h-4 w-4" style={themeStyles.iconColor} />
      </div>
      <span className="text-sm text-gray-700 group-hover/item:text-gray-900 flex-1">
        {item.nome}
      </span>
    </>
  );

  const baseRow = 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group/item';

  // Caso 1: itens com subitens (periodos ou sub-links) → <details> nativo
  if (item.subItens && item.subItens.length > 0) {
    return (
      <details className="group/details">
        <summary className={`${baseRow} cursor-pointer list-none`}>
          {content}
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-gray-500 transition-transform group-open/details:rotate-90 flex-shrink-0" />
        </summary>
        <div className="ml-9 mt-1 mb-1 border-l-2 border-gray-100 pl-2 space-y-0.5">
          {item.subItens.map((sub) => {
            const subClass = 'flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-xs text-gray-600 hover:text-gray-900 transition-colors';
            if (sub.externalUrl) {
              return (
                <a
                  key={sub.nome}
                  href={sub.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={subClass}
                >
                  <span className="flex-1">{sub.nome}</span>
                  <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                </a>
              );
            }
            return (
              <Link key={sub.nome} href={sub.href || '#'} className={subClass}>
                <span className="flex-1">{sub.nome}</span>
                <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </details>
    );
  }

  // Caso 2: link externo → abre em nova aba
  if (item.externalUrl) {
    return (
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={baseRow}
      >
        {content}
        <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-gray-500 flex-shrink-0" />
      </a>
    );
  }

  // Caso 3: link interno
  return (
    <Link href={item.href || '#'} className={baseRow}>
      {content}
      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-gray-500 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

// Componente auxiliar para linhas de informacao
function InfoRow({ icon: Icon, label, color, bold }: { icon: LucideIcon; label: string; color: string; bold?: boolean }) {
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
