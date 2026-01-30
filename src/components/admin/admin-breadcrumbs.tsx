'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isSlugProposicao, formatarSlugParaExibicao } from '@/lib/utils/proposicao-slug'

interface BreadcrumbItem {
  label: string
  href?: string
}

const breadcrumbMap: Record<string, string> = {
  'admin': 'Dashboard',
  'parlamentares': 'Parlamentares',
  'mesa-diretora': 'Mesa Diretora',
  'legislaturas': 'Legislaturas',
  'sessoes-legislativas': 'Sessões Legislativas',
  'painel-eletronico': 'Painel Eletrônico',
  'proposicoes': 'Proposições',
  'tramitacoes': 'Tramitações',
  'regras': 'Regras de Tramitação',
  'dashboard': 'Dashboard',
  'pautas-sessoes': 'Pautas das Sessões',
  'audiencias-publicas': 'Audiências Públicas',
  'noticias': 'Notícias',
  'licitacoes': 'Licitações',
  'publicacoes': 'Publicações',
  'categorias': 'Categorias',
  'gestao-fiscal': 'Gestão Fiscal',
  'relatorios': 'Relatórios',
  'configuracoes': 'Configurações',
  'usuarios': 'Usuários',
  'automacao': 'Automação',
  'tipos-tramitacao': 'Tipos de Tramitação',
  'unidades-tramitacao': 'Unidades de Tramitação',
  'testes-api': 'Testes da API',
  'monitoramento': 'Monitoramento',
  'status': 'Health Check',
  'seguranca': 'Segurança',
  'backups': 'Backups & Restauração',
  'logs': 'Logs',
  'novo': 'Novo',
  'editar': 'Editar',
  'emendas': 'Emendas',
  'comissoes': 'Comissões',
  'sessoes': 'Sessões',
  'pareceres': 'Pareceres',
  'votacoes': 'Votações',
  'auditoria': 'Auditoria',
  'participacao-cidada': 'Participação Cidadã',
  'transparencia': 'Transparência',
  'tipos-proposicoes': 'Tipos de Proposição'
}

// Função para detectar se um segmento é um ID técnico (CUID, UUID, etc.)
const isIdSegment = (segment: string): boolean => {
  // Primeiro, verifica se é um slug de proposição (não é ID técnico)
  if (isSlugProposicao(segment)) {
    return false
  }
  // CUIDs têm ~25 caracteres alfanuméricos
  if (segment.length >= 20 && /^[a-z0-9]+$/i.test(segment)) {
    return true
  }
  // UUID pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return true
  }
  return false
}

// Mapeamento de contexto para labels amigáveis quando há ID
const contextLabelMap: Record<string, string> = {
  'proposicoes': 'Detalhes',
  'parlamentares': 'Perfil',
  'sessoes': 'Detalhes',
  'comissoes': 'Detalhes',
  'usuarios': 'Perfil',
  'noticias': 'Visualizar',
  'publicacoes': 'Visualizar',
  'painel-eletronico': 'Sessão',
  'pareceres': 'Detalhes',
  'legislaturas': 'Detalhes',
  'tramitacoes': 'Detalhes'
}

export function AdminBreadcrumbs() {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/admin' }
    ]

    let currentPath = '/admin'
    let previousSegment = ''

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Pular o primeiro segmento 'admin' pois já foi adicionado
      if (index > 0) {
        let label: string

        // Verificar se é um slug de proposição (ex: pl-0022-2025)
        if (isSlugProposicao(segment)) {
          // Formatar slug para exibição amigável (ex: "PL 0022/2025")
          label = formatarSlugParaExibicao(segment)
        }
        // Verificar se é um ID técnico
        else if (isIdSegment(segment)) {
          // Usar label baseado no contexto (segmento anterior)
          label = contextLabelMap[previousSegment] || 'Detalhes'
        } else {
          label = breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        }

        const isLast = index === segments.length - 1

        breadcrumbs.push({
          label,
          href: isLast ? undefined : currentPath
        })
      }

      previousSegment = segment
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6">
      <Link
        href="/admin"
        className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Voltar para o painel administrativo"
        title="Painel Administrativo"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Painel Administrativo</span>
      </Link>
      
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        
        return (
          <div key={breadcrumb.href || breadcrumb.label} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4 text-gray-300" />
            
            {isLast ? (
              <span className="font-medium text-gray-900">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href!}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
