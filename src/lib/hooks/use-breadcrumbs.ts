import { usePathname } from 'next/navigation'
import { BreadcrumbItem } from '@/components/ui/breadcrumb'

// Mapeamento de rotas para labels amigáveis
const routeLabels: Record<string, string> = {
  // Institucional
  'institucional': 'Institucional',
  'sobre': 'Sobre a Câmara',
  'codigo-etica': 'Código de Ética',
  'dicionario': 'Dicionário Legislativo',
  'e-sic': 'E-SIC',
  'lei-organica': 'Lei Orgânica',
  'ouvidoria': 'Ouvidoria',
  'papel-vereador': 'Papel do Vereador',
  'papel-camara': 'Papel da Câmara',
  'regimento': 'Regimento Interno',
  
  // Parlamentares
  'parlamentares': 'Parlamentares',
  'galeria': 'Galeria de Vereadores',
  'mesa-diretora': 'Mesa Diretora',
  
  // Legislativo
  'legislativo': 'Legislativo',
  'sessoes': 'Sessões',
  'proposicoes': 'Proposições e Matérias',
  'comissoes': 'Comissões',
  'atas': 'Atas de Sessões',
  'legislatura': 'Legislatura',
  
  // Transparência
  'transparencia': 'Transparência',
  'gestao-fiscal': 'Gestão Fiscal',
  'pesquisas': 'Pesquisas LRF',
  'licitacoes': 'Licitações',
  'publicacoes': 'Publicações',
  'leis': 'Leis',
  'decretos': 'Decretos',
  'portarias': 'Portarias',
  
  // Serviços
  'servicos': 'Serviços',
  'contra-cheque': 'Contra Cheque Online',
  'videos': 'Vídeos',
  
  // Admin
  'admin': 'Painel Administrativo',
  'modulos': 'Módulos',
  'relatorios': 'Relatórios',
  'configuracoes': 'Configurações',
  'login': 'Login'
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()
  
  // Remove leading slash and split path
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) {
    return []
  }
  
  const breadcrumbs: BreadcrumbItem[] = []
  
  // Build breadcrumbs from path segments
  pathSegments.forEach((segment, index) => {
    const isLast = index === pathSegments.length - 1
    const href = '/' + pathSegments.slice(0, index + 1).join('/')
    
    // Get label from mapping or use segment as fallback
    const label = routeLabels[segment] || 
                  segment.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : href,
      current: isLast
    })
  })
  
  return breadcrumbs
}

// Hook para breadcrumbs customizados
export function useCustomBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return items
}
