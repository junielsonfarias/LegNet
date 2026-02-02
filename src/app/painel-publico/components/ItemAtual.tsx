'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, User, ListOrdered } from 'lucide-react'
import type { PautaItem } from '../types'

interface ItemAtualProps {
  itemAtual: PautaItem | null
}

function getItemStatusBadge(item: PautaItem) {
  const status = item.status
  const tipoAcao = item.tipoAcao

  if (status === 'APROVADO' || status === 'CONCLUIDO') {
    return { className: 'bg-green-600/30 text-green-200 border-green-400/50', label: 'Aprovado' }
  }
  if (status === 'REJEITADO') {
    return { className: 'bg-red-600/30 text-red-200 border-red-400/50', label: 'Rejeitado' }
  }
  if (status === 'EM_VOTACAO') {
    return { className: 'bg-orange-600/30 text-orange-200 border-orange-400/50', label: 'Em Votacao' }
  }
  if (status === 'EM_DISCUSSAO' && tipoAcao === 'LEITURA') {
    return { className: 'bg-sky-600/30 text-sky-200 border-sky-400/50', label: 'Em Leitura' }
  }
  if (status === 'EM_DISCUSSAO') {
    return { className: 'bg-yellow-600/30 text-yellow-200 border-yellow-400/50', label: 'Em Discussao' }
  }
  if (status === 'VISTA') {
    return { className: 'bg-purple-600/30 text-purple-200 border-purple-400/50', label: 'Vista' }
  }
  if (status === 'PENDENTE') {
    return { className: 'bg-gray-600/30 text-gray-200 border-gray-400/50', label: 'Pendente' }
  }
  return { className: 'bg-gray-600/30 text-gray-200 border-gray-400/50', label: status }
}

export function ItemAtual({ itemAtual }: ItemAtualProps) {
  if (!itemAtual) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
        <CardContent className="py-12 text-center">
          <ListOrdered className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-xl text-blue-200">Nenhum item na pauta</p>
        </CardContent>
      </Card>
    )
  }

  const statusBadge = getItemStatusBadge(itemAtual)

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-400" />
            Materia em Pauta
          </div>
          <Badge className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-400/30">
          <div className="flex items-start justify-between mb-3">
            <Badge className="bg-blue-600/30 text-blue-200 border-blue-400/50">
              {itemAtual.secao}
            </Badge>
            <span className="text-sm text-blue-300">Item #{itemAtual.ordem}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {itemAtual.proposicao
              ? `${itemAtual.proposicao.tipo} no ${itemAtual.proposicao.numero}/${itemAtual.proposicao.ano}`
              : itemAtual.titulo
            }
          </h2>
          <p className="text-lg text-blue-200">
            {itemAtual.proposicao?.titulo || itemAtual.descricao || 'Sem descricao'}
          </p>
          {itemAtual.proposicao?.autor && (
            <div className="flex items-center gap-2 mt-4">
              <User className="h-4 w-4 text-blue-300" />
              <span className="text-white">
                Autor: <span className="font-semibold text-blue-300">
                  {itemAtual.proposicao.autor.apelido || itemAtual.proposicao.autor.nome}
                </span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
