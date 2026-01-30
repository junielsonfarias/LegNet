'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Layers, X } from 'lucide-react'
import type { TemplateMode } from '../_types'

interface TemplateSessao {
  id: string
  nome: string
  descricao?: string | null
  itens?: any[]
}

interface TemplateApplyModalProps {
  isOpen: boolean
  templates: TemplateSessao[]
  loadingTemplates: boolean
  templateApplyingId: string | null
  templateSearch: string
  templateMode: TemplateMode
  onClose: () => void
  onApply: (templateId: string) => void
  onSearchChange: (search: string) => void
  onModeChange: (mode: TemplateMode) => void
}

export function TemplateApplyModal({
  isOpen,
  templates,
  loadingTemplates,
  templateApplyingId,
  templateSearch,
  templateMode,
  onClose,
  onApply,
  onSearchChange,
  onModeChange
}: TemplateApplyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Aplicar Template de Pauta
              </CardTitle>
              <CardDescription>Selecione um template para aplicar à sessão</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar template..."
                value={templateSearch}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <select
              value={templateMode}
              onChange={(e) => onModeChange(e.target.value as TemplateMode)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="REPLACE">Substituir pauta</option>
              <option value="APPEND">Adicionar à pauta</option>
            </select>
          </div>

          {loadingTemplates ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum template encontrado</p>
          ) : (
            <div className="space-y-3">
              {templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{template.nome}</h4>
                      {template.descricao && (
                        <p className="text-sm text-gray-500">{template.descricao}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {template.itens?.length || 0} itens
                      </p>
                    </div>
                    <Button
                      onClick={() => onApply(template.id)}
                      disabled={templateApplyingId === template.id}
                    >
                      {templateApplyingId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Aplicar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
