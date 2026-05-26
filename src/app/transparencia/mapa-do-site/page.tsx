import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Map, ArrowLeft, Building2, FolderOpen, DollarSign, Users, Briefcase,
  FileText, HardHat, BarChart3, MessageSquare, Shield, Accessibility, Vote,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const dynamic = 'force-static'

interface SiteLink {
  nome: string
  href: string
}

interface SiteSecao {
  titulo: string
  icon: LucideIcon
  dimensaoPntp: string
  links: SiteLink[]
}

const MAPA_DO_SITE: SiteSecao[] = [
  {
    titulo: 'Informacoes Institucionais',
    icon: Building2,
    dimensaoPntp: 'Dimensoes 1 e 2 (PNTP)',
    links: [
      { nome: 'Sobre a Camara', href: '/institucional/sobre' },
      { nome: 'Estrutura Organizacional (Organograma)', href: '/transparencia/institucional/organograma' },
      { nome: 'Competencias e Atribuicoes', href: '/transparencia/institucional/competencias' },
      { nome: 'Horario de Atendimento', href: '/transparencia/institucional/horario-funcionamento' },
      { nome: 'Lei Organica', href: '/institucional/lei-organica' },
      { nome: 'Regimento Interno', href: '/institucional/regimento' },
      { nome: 'Codigo de Etica', href: '/institucional/codigo-etica' },
      { nome: 'Mesa Diretora', href: '/transparencia/mesa-diretora' },
      { nome: 'Legislaturas', href: '/transparencia/legislaturas' },
      { nome: 'Perguntas Frequentes (FAQ)', href: '/transparencia/faq' },
    ],
  },
  {
    titulo: 'Parlamentares e Atividade Legislativa',
    icon: Users,
    dimensaoPntp: 'Dimensao 20 (PNTP - Legislativo)',
    links: [
      { nome: 'Parlamentares (composicao da Casa)', href: '/parlamentares' },
      { nome: 'Comissoes e Membros', href: '/legislativo/comissoes' },
      { nome: 'Atas de Reunioes de Comissoes', href: '/transparencia/atos/atas-comissoes' },
      { nome: 'Pautas de Reunioes de Comissoes', href: '/transparencia/atos/pautas-comissoes' },
      { nome: 'Pareceres de Comissoes', href: '/transparencia/atos/pareceres-comissoes' },
      { nome: 'Emendas Parlamentares', href: '/transparencia/atos/emendas' },
      { nome: 'Materias Legislativas / Proposicoes', href: '/legislativo' },
      { nome: 'Sessoes (Pautas, Atas, Presencas)', href: '/legislativo/sessoes' },
      { nome: 'Pautas de Sessoes do Plenario', href: '/legislativo/pautas-sessoes' },
      { nome: 'Votacoes Nominais', href: '/transparencia/legislativo/votacoes-nominais' },
      { nome: 'Atas das Sessoes', href: '/transparencia/legislativo/atas' },
      { nome: 'Presencas em Sessoes', href: '/transparencia/legislativo/presencas' },
      { nome: 'Agenda Externa dos Parlamentares', href: '/transparencia/agenda-parlamentar' },
      { nome: 'Relatorios de Atividade Parlamentar', href: '/transparencia/parlamentar/relatorio' },
      { nome: 'Cotas / Verba Indenizatoria', href: '/transparencia/cotas-parlamentar' },
    ],
  },
  {
    titulo: 'Atos Normativos e Documentos',
    icon: FolderOpen,
    dimensaoPntp: 'Dimensoes 2 e 20',
    links: [
      { nome: 'Leis', href: '/transparencia/leis' },
      { nome: 'Decretos Legislativos', href: '/transparencia/atos/decretos' },
      { nome: 'Resolucoes', href: '/transparencia/atos/resolucoes' },
      { nome: 'Portarias', href: '/transparencia/atos/portarias' },
      { nome: 'Atos da Mesa Diretora', href: '/transparencia/atos/atos-mesa' },
      { nome: 'Atos da Presidencia', href: '/transparencia/atos/atos-presidencia' },
      { nome: 'Oficios', href: '/transparencia/atos/oficios' },
      { nome: 'Editais', href: '/transparencia/atos/editais' },
      { nome: 'Convocacoes', href: '/transparencia/atos/convocacoes' },
      { nome: 'Comunicados', href: '/transparencia/atos/comunicados' },
      { nome: 'Agendas', href: '/transparencia/atos/agendas' },
      { nome: 'Erratas', href: '/transparencia/atos/erratas' },
      { nome: 'Publicacoes Oficiais', href: '/transparencia/publicacoes' },
    ],
  },
  {
    titulo: 'Receitas e Despesas',
    icon: DollarSign,
    dimensaoPntp: 'Dimensoes 3 e 4 (PNTP - Essenciais)',
    links: [
      { nome: 'Receitas', href: '/transparencia/receitas' },
      { nome: 'Despesas', href: '/transparencia/despesas' },
      { nome: 'Convenios e Transferencias Realizadas', href: '/transparencia/convenios' },
      { nome: 'Repasses Recebidos', href: '/transparencia/repasses' },
      { nome: 'Notas Fiscais', href: '/transparencia/notas-fiscais' },
      { nome: 'Ordem Cronologica de Pagamentos', href: '/transparencia/ordem-pagamentos' },
      { nome: 'Cartoes Corporativos', href: '/transparencia/cartoes-corporativos' },
      { nome: 'Restos a Pagar', href: '/transparencia/restos-pagar' },
      { nome: 'Programas e Acoes', href: '/transparencia/programas-acoes' },
    ],
  },
  {
    titulo: 'Pessoal',
    icon: Briefcase,
    dimensaoPntp: 'Dimensoes 6 e 7 (PNTP)',
    links: [
      { nome: 'Quadro de Servidores', href: '/transparencia/pessoal/quadro-pessoal' },
      { nome: 'Remuneracao dos Servidores', href: '/transparencia/pessoal/remuneracao' },
      { nome: 'Estagiarios', href: '/transparencia/pessoal/estagiarios' },
      { nome: 'Terceirizados', href: '/transparencia/pessoal/terceirizados' },
      { nome: 'Concursos Publicos', href: '/transparencia/pessoal/concursos' },
      { nome: 'Diarias', href: '/transparencia/pessoal/diarias' },
      { nome: 'Tabela de Valores das Diarias', href: '/transparencia/pessoal/valores-diarias' },
      { nome: 'Folha de Pagamento', href: '/transparencia/folha-pagamento' },
      { nome: 'Cargos e Plano de Carreira', href: '/transparencia/cargos' },
    ],
  },
  {
    titulo: 'Licitacoes, Contratos e Patrimonio',
    icon: FileText,
    dimensaoPntp: 'Dimensoes 8, 9 e 10 (PNTP)',
    links: [
      { nome: 'Licitacoes', href: '/transparencia/licitacoes' },
      { nome: 'Contratos', href: '/transparencia/contratos' },
      { nome: 'Cadastro de Fornecedores', href: '/transparencia/fornecedores' },
      { nome: 'Fornecedores Sancionados', href: '/transparencia/fornecedores-sancionados' },
      { nome: 'Obras Publicas', href: '/transparencia/obras' },
      { nome: 'Veiculos (Frota)', href: '/transparencia/veiculos' },
      { nome: 'Bens Imoveis', href: '/transparencia/bens-imoveis' },
      { nome: 'Bens Moveis', href: '/transparencia/bens-moveis' },
    ],
  },
  {
    titulo: 'Planejamento e Prestacao de Contas',
    icon: BarChart3,
    dimensaoPntp: 'Dimensao 11 (PNTP)',
    links: [
      { nome: 'Gestao Fiscal', href: '/transparencia/gestao-fiscal' },
      { nome: 'Lei de Responsabilidade Fiscal', href: '/transparencia/lei-responsabilidade-fiscal' },
      { nome: 'Relatorio de Gestao Fiscal (RGF)', href: '/transparencia/documentos/rgf' },
      { nome: 'LDO - Lei de Diretrizes Orcamentarias', href: '/transparencia/documentos/ldo' },
      { nome: 'LOA - Lei Orcamentaria Anual', href: '/transparencia/documentos/loa' },
      { nome: 'PPA - Plano Plurianual', href: '/transparencia/documentos/ppa' },
      { nome: 'Balancete Financeiro', href: '/transparencia/documentos/balancete-financeiro' },
      { nome: 'Balanco Anual', href: '/transparencia/documentos/balanco-anual' },
      { nome: 'Parecer do TCM', href: '/transparencia/documentos/parecer-tcm' },
      { nome: 'Julgamento das Contas do Executivo', href: '/transparencia/documentos/julgamento-contas' },
      { nome: 'Relatorio de Gestao', href: '/transparencia/documentos/relatorio-gestao' },
      { nome: 'Plano de Contratacoes Anual (PCA)', href: '/transparencia/plano-contratacoes-anual' },
      { nome: 'Planejamento Estrategico', href: '/transparencia/plano-estrategico' },
    ],
  },
  {
    titulo: 'Atendimento ao Cidadao',
    icon: MessageSquare,
    dimensaoPntp: 'Dimensoes 12 e 14 (PNTP)',
    links: [
      { nome: 'e-SIC - Servico de Informacao ao Cidadao', href: '/institucional/e-sic' },
      { nome: 'Estatisticas do e-SIC', href: '/transparencia/e-sic/estatisticas' },
      { nome: 'Informacoes Classificadas (LAI Art. 30)', href: '/transparencia/informacoes-classificadas' },
      { nome: 'Ouvidoria', href: '/institucional/ouvidoria' },
      { nome: 'Manifestacoes da Ouvidoria', href: '/transparencia/ouvidoria/manifestacoes' },
      { nome: 'Estatisticas da Ouvidoria', href: '/transparencia/ouvidoria/estatisticas' },
      { nome: 'Regulamentacao da Ouvidoria', href: '/transparencia/ouvidoria/regulamentacao' },
      { nome: 'Carta de Servicos ao Usuario', href: '/transparencia/documentos/carta-servicos' },
      { nome: 'Participacao Cidada', href: '/participacao-cidada' },
      { nome: 'Pesquisas de Satisfacao', href: '/transparencia/pesquisas' },
    ],
  },
  {
    titulo: 'LGPD e Governo Digital',
    icon: Shield,
    dimensaoPntp: 'Dimensao 15 (PNTP)',
    links: [
      { nome: 'Politica de Privacidade e Protecao de Dados', href: '/transparencia/politica-privacidade' },
      { nome: 'Encarregado pelo Tratamento de Dados (DPO)', href: '/transparencia/encarregado-dados' },
      { nome: 'LGPD e Governo Digital (documentos)', href: '/transparencia/documentos/lgpd' },
      { nome: 'Servicos Online', href: '/transparencia/servicos-online' },
      { nome: 'Dados Abertos (API)', href: '/transparencia/dados-abertos' },
      { nome: 'Plano de Dados Abertos', href: '/transparencia/plano-dados-abertos' },
    ],
  },
  {
    titulo: 'Transmissao e Participacao Popular',
    icon: Vote,
    dimensaoPntp: 'Dimensao 20 (PNTP - Legislativo)',
    links: [
      { nome: 'Participacao Cidada (Sugestoes e Consultas)', href: '/participacao-cidada' },
      { nome: 'Sugestoes Legislativas', href: '/participacao-cidada/sugestoes/nova' },
      { nome: 'Audiencias Publicas', href: '/legislativo/audiencias-publicas' },
      { nome: 'Calendario de Eventos', href: '/calendario' },
      { nome: 'Noticias', href: '/noticias' },
    ],
  },
  {
    titulo: 'Acessibilidade',
    icon: Accessibility,
    dimensaoPntp: 'Dimensao 13 (PNTP)',
    links: [
      { nome: 'Pesquisa de Conteudo', href: '/transparencia/pesquisas' },
      { nome: 'Portal Completo da Transparencia', href: '/transparencia' },
      { nome: 'Conformidade PNTP', href: '/transparencia/conformidade' },
    ],
  },
  {
    titulo: 'Obras e Servicos Publicos',
    icon: HardHat,
    dimensaoPntp: 'Dimensao 10 (PNTP)',
    links: [
      { nome: 'Obras Publicas', href: '/transparencia/obras' },
      { nome: 'Obras Paralisadas', href: '/transparencia/obras?situacao=PARALISADA' },
    ],
  },
]

export default function MapaDoSitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Map className="h-8 w-8 text-primary" />
            Mapa do Site
          </h1>
          <p className="text-muted-foreground">
            Visao consolidada de todas as secoes e paginas publicas do Portal da
            Transparencia, organizada conforme as dimensoes do Programa Nacional
            de Transparencia Publica (PNTP 2026).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MAPA_DO_SITE.map((secao) => (
            <Card key={secao.titulo} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <secao.icon className="h-5 w-5 text-primary" />
                  {secao.titulo}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {secao.dimensaoPntp}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {secao.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-700 hover:text-camara-primary hover:underline focus:outline-none focus:ring-2 focus:ring-camara-primary rounded px-1 -mx-1"
                      >
                        {link.nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-l-4 border-l-camara-primary">
          <CardContent className="p-5">
            <h2 className="font-semibold mb-2">Sobre este Mapa</h2>
            <p className="text-sm text-gray-700 mb-2">
              Este mapa atende ao criterio 13.5 da Matriz PNTP 2026, garantindo
              uma visao panoramica e legivel de todas as informacoes publicadas.
              Para indexacao por mecanismos de busca, consulte tambem o{' '}
              <a href="/sitemap.xml" className="text-camara-primary hover:underline">
                sitemap.xml
              </a>{' '}
              do portal.
            </p>
            <p className="text-xs text-muted-foreground">
              Caso encontre uma pagina nao listada ou um link com problema,
              utilize o canal de Ouvidoria ou o e-SIC.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
