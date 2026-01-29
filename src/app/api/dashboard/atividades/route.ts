import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'

interface AtividadeRecente {
  id: string
  type: 'proposicao' | 'votacao' | 'sessao' | 'parecer' | 'usuario' | 'comissao'
  title: string
  description: string
  timestamp: Date
  status: 'success' | 'warning' | 'pending'
  user?: string
}

// GET - Buscar atividades recentes
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

  const atividades: AtividadeRecente[] = []

  // Buscar proposições recentes
  const proposicoesRecentes = await prisma.proposicao.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      autor: {
        select: { nome: true, apelido: true }
      }
    }
  })

  proposicoesRecentes.forEach(p => {
    atividades.push({
      id: `prop-${p.id}`,
      type: 'proposicao',
      title: `${p.tipo} ${String(p.numero).padStart(3, '0')}/${p.ano} cadastrado`,
      description: p.titulo || p.ementa?.substring(0, 60) + '...' || 'Sem descrição',
      timestamp: p.createdAt,
      status: p.status === 'APROVADA' ? 'success' : p.status === 'REJEITADA' ? 'warning' : 'pending',
      user: p.autor?.apelido || p.autor?.nome
    })
  })

  // Buscar sessões recentes
  const sessoesRecentes = await prisma.sessao.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  sessoesRecentes.forEach(s => {
    const statusMap = {
      'CONCLUIDA': 'success' as const,
      'CANCELADA': 'warning' as const,
      'AGENDADA': 'pending' as const,
      'EM_ANDAMENTO': 'pending' as const
    }
    atividades.push({
      id: `sessao-${s.id}`,
      type: 'sessao',
      title: s.status === 'AGENDADA' ? 'Sessão agendada' : s.status === 'CONCLUIDA' ? 'Sessão concluída' : 'Sessão atualizada',
      description: `${s.tipo} ${String(s.numero).padStart(3, '0')} - ${new Date(s.data).toLocaleDateString('pt-BR')}`,
      timestamp: s.updatedAt,
      status: statusMap[s.status] || 'pending'
    })
  })

  // Buscar votacoes agrupadas recentes (com resultado)
  const votacoesRecentes = await prisma.votacaoAgrupada.findMany({
    where: { resultado: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  // Buscar proposicoes relacionadas
  const proposicaoIds = votacoesRecentes.map(v => v.proposicaoId)
  const proposicoes = await prisma.proposicao.findMany({
    where: { id: { in: proposicaoIds } },
    select: { id: true, numero: true, ano: true, tipo: true }
  })
  const proposicoesMap = new Map(proposicoes.map(p => [p.id, p]))

  votacoesRecentes.forEach(v => {
    const prop = proposicoesMap.get(v.proposicaoId)
    const resultadoTexto = v.resultado === 'APROVADA' ? 'aprovado' : v.resultado === 'REJEITADA' ? 'rejeitado' : 'votado'
    atividades.push({
      id: `votacao-${v.id}`,
      type: 'votacao',
      title: 'Votacao concluida',
      description: prop
        ? `${prop.tipo} ${String(prop.numero).padStart(3, '0')}/${prop.ano} ${resultadoTexto} (${v.votosSim || 0}x${v.votosNao || 0})`
        : `Votacao ${resultadoTexto}`,
      timestamp: v.createdAt,
      status: v.resultado === 'APROVADA' ? 'success' : v.resultado === 'REJEITADA' ? 'warning' : 'pending'
    })
  })

  // Buscar pareceres recentes
  const pareceresRecentes = await prisma.parecer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      comissao: { select: { sigla: true, nome: true } },
      relator: { select: { apelido: true, nome: true } },
      proposicao: { select: { numero: true, ano: true, tipo: true } }
    }
  })

  pareceresRecentes.forEach(p => {
    const tipoTexto = p.tipo === 'FAVORAVEL' ? 'Favorável' : p.tipo === 'CONTRARIO' ? 'Contrário' : p.tipo
    atividades.push({
      id: `parecer-${p.id}`,
      type: 'parecer',
      title: 'Parecer emitido',
      description: p.proposicao && p.comissao
        ? `${p.comissao.sigla || p.comissao.nome}: ${tipoTexto} ao ${p.proposicao.tipo} ${p.proposicao.numero}/${p.proposicao.ano}`
        : `Parecer ${tipoTexto}`,
      timestamp: p.createdAt,
      status: p.tipo === 'FAVORAVEL' ? 'success' : 'warning',
      user: p.relator?.apelido || p.relator?.nome
    })
  })

  // Buscar usuários criados recentemente
  const usuariosRecentes = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, name: true, role: true, createdAt: true }
  })

  usuariosRecentes.forEach(u => {
    atividades.push({
      id: `user-${u.id}`,
      type: 'usuario',
      title: 'Novo usuário cadastrado',
      description: `${u.name} (${u.role})`,
      timestamp: u.createdAt,
      status: 'success'
    })
  })

  // Ordenar por timestamp e limitar
  atividades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const atividadesLimitadas = atividades.slice(0, limit)

  return createSuccessResponse(atividadesLimitadas, 'Atividades carregadas com sucesso')
}, { permissions: 'dashboard.view' })
