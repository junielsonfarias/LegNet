'use client';

import { useState, useEffect } from 'react';
import {
  Shield, MessageSquare, FileSearch, Globe, FolderOpen, MapPin, Phone, Mail,
  Clock, Building2, Activity, Users, Loader2, Scale, BookOpen, DollarSign,
  FileText, Gavel, ScrollText, ClipboardList, CheckCircle2,
  ChevronRight, ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';
import { createLogger } from '@/lib/logging/logger';
import { RadarBadge } from '@/components/transparencia/radar-badge';
import { TransmissaoBannerClient } from '@/components/transparencia/transmissao-banner-client';
import { getIcone } from '@/lib/transparencia/itens-icones';
import type { ItemResolvido, MenuResolvido } from '@/lib/transparencia/itens-catalogo';

const log = createLogger('transparencia');

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
  const [menu, setMenu] = useState<MenuResolvido | null>(null);
  const [loading, setLoading] = useState(true);
  const breadcrumbs = useBreadcrumbs();

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [institRes, menuRes] = await Promise.all([
          fetch('/api/institucional'),
          fetch('/api/transparencia/menu'),
        ]);
        const institResult = await institRes.json();
        if (institResult.dados) setDados(institResult.dados);
        if (menuRes.ok) {
          const menuJson = await menuRes.json();
          if (menuJson?.data) setMenu(menuJson.data as MenuResolvido);
        }
      } catch (err) {
        log.error('Erro ao buscar dados', err);
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
    : 'Endereco nao configurado';

  // Estilos baseados no tema municipal (CSS variables da instalacao)
  const themeStyles = {
    iconBg: { backgroundColor: 'var(--municipal-primary)' },
    iconBgLight: { backgroundColor: 'var(--municipal-primary-lighter)' },
    sectionBg: { backgroundColor: 'var(--municipal-primary-lighter)' },
    textColor: { color: 'var(--municipal-primary-dark)' },
    iconColor: { color: 'var(--municipal-primary)' },
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
            <div className="flex justify-center pt-2">
              <RadarBadge variant="hero" />
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

      {/* Banner de Transmissao Ao Vivo (so aparece quando ativa) */}
      <div className="container mx-auto px-4 mt-8">
        <TransmissaoBannerClient />
      </div>

      {/* Secoes Tematicas */}
      <section aria-label="Secoes tematicas de transparencia" className="container mx-auto px-4 py-10 md:py-14">
        {loading || !menu ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={themeStyles.iconColor} />
            <span className="ml-2 text-gray-600">Carregando portal...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {menu.secoes.map((secao) => {
              const SecaoIcon = getIcone(secao.icone);
              return (
                <div
                  key={secao.slug}
                  className="bg-white rounded-xl border-2 border-gray-100 hover:border-[var(--municipal-primary-light)] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  <div className="px-5 py-4 border-b border-gray-100" style={themeStyles.sectionBg}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform" style={themeStyles.iconBg}>
                        <SecaoIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base" style={themeStyles.textColor}>{secao.titulo}</h3>
                        <p className="text-xs text-gray-500">{secao.subtitulo}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    {secao.itens.map((item) => (
                      <TransparenciaItemRow key={item.slug} item={item} themeStyles={themeStyles} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            { nome: 'Dados Abertos', href: '/transparencia/dados-abertos', icon: Globe },
            { nome: 'Glossario', href: '/institucional/dicionario', icon: BookOpen },
            { nome: 'Pesquisa Satisfacao', href: '/transparencia/pesquisas-satisfacao', icon: FileSearch },
            { nome: 'LGPD', href: '/transparencia/documentos/lgpd', icon: Shield },
            { nome: 'Mapa do Site', href: '/transparencia/mapa-do-site', icon: MapPin },
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

// Linha de item do menu — usa o catalogo resolvido pelo /api/transparencia/menu.
// Modos:
//  - 'redirect': link externo direto (sem sub-itens)
//  - 'periodos': expande sub-itens (cada um pode ser interno ou externo)
//  - 'interno': link interno padrao OU sub-itens padrao do catalogo
type ThemeStyles = {
  iconBgLight: React.CSSProperties;
  iconColor: React.CSSProperties;
};

function TransparenciaItemRow({ item, themeStyles }: { item: ItemResolvido; themeStyles: ThemeStyles }) {
  const Icon: LucideIcon = getIcone(item.icone);

  const content = (
    <>
      <div className="p-1.5 rounded-md flex-shrink-0" style={themeStyles.iconBgLight}>
        <Icon className="h-4 w-4" style={themeStyles.iconColor} />
      </div>
      <span className="text-sm text-gray-700 group-hover/item:text-gray-900 flex-1">
        {item.label}
      </span>
    </>
  );

  const baseRow = 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group/item';

  // 1) Modo redirect — link externo direto, sem sub-itens
  if (item.modo === 'redirect' && item.urlExterna) {
    return (
      <a
        href={item.urlExterna}
        target="_blank"
        rel="noopener noreferrer"
        className={baseRow}
        title={`Abrir ${item.label} em nova aba (sistema externo)`}
      >
        {content}
        <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-gray-500 flex-shrink-0" />
      </a>
    );
  }

  // 2) Modo periodos OU subItensPadrao do catalogo — expande em <details>
  if (item.subItensResolvidos && item.subItensResolvidos.length > 0) {
    return (
      <details className="group/details">
        <summary className={`${baseRow} cursor-pointer list-none`}>
          {content}
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-gray-500 transition-transform group-open/details:rotate-90 flex-shrink-0" />
        </summary>
        <div className="ml-9 mt-1 mb-1 border-l-2 border-gray-100 pl-2 space-y-0.5">
          {item.subItensResolvidos.map((sub) => {
            const subClass = 'flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-xs text-gray-600 hover:text-gray-900 transition-colors';
            if (sub.urlExterna) {
              return (
                <a
                  key={sub.slug}
                  href={sub.urlExterna}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={subClass}
                  title="Abrir em nova aba (sistema externo)"
                >
                  <span className="flex-1">{sub.label}</span>
                  <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                </a>
              );
            }
            return (
              <Link key={sub.slug} href={sub.href || '#'} className={subClass}>
                <span className="flex-1">{sub.label}</span>
                <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </details>
    );
  }

  // 3) Default — link interno padrao
  return (
    <Link href={item.hrefInterno || '#'} className={baseRow}>
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
