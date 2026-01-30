'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { SessaoLocal } from '../_types'
import { formatDateTime } from '../_types'

interface SessaoViewModalProps {
  isOpen: boolean
  sessao: SessaoLocal | null
  onClose: () => void
}

export function SessaoViewModal({
  isOpen,
  sessao,
  onClose
}: SessaoViewModalProps) {
  if (!isOpen || !sessao) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{sessao.numero}ª Sessão {sessao.tipo}</CardTitle>
              <CardDescription>{formatDateTime(sessao.data)}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Local</p>
              <p className="font-medium">{sessao.local || 'Não definido'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge>{sessao.status}</Badge>
            </div>
          </div>
          {sessao.descricao && (
            <div>
              <p className="text-sm text-gray-500">Descrição</p>
              <p>{sessao.descricao}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
