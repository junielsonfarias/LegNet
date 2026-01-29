'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MapPin, FileText } from 'lucide-react'

export interface SessaoFormData {
  numero: string
  tipo: 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
  data: string
  horario: string
  local: string
  descricao: string
}

interface StepSessaoInfoProps {
  data: SessaoFormData
  onChange: (data: SessaoFormData) => void
}

const TIPOS_SESSAO = [
  { value: 'ORDINARIA', label: 'Ordinaria', description: 'Sessoes regulares do calendario' },
  { value: 'EXTRAORDINARIA', label: 'Extraordinaria', description: 'Convocada para materia especifica' },
  { value: 'SOLENE', label: 'Solene', description: 'Homenagens e datas comemorativas' },
  { value: 'ESPECIAL', label: 'Especial', description: 'Audiencias publicas, eventos' }
]

export function StepSessaoInfo({ data, onChange }: StepSessaoInfoProps) {
  const handleChange = (field: keyof SessaoFormData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Informacoes da Sessao</h2>
        <p className="text-sm text-gray-500">
          Defina o tipo, data, horario e local da sessao
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Numero da Sessao */}
        <div className="space-y-2">
          <Label htmlFor="numero" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Numero da Sessao *
          </Label>
          <Input
            id="numero"
            type="number"
            min="1"
            value={data.numero}
            onChange={(e) => handleChange('numero', e.target.value)}
            placeholder="Ex: 37"
            required
          />
          <p className="text-xs text-gray-500">
            Numero sequencial da sessao no ano
          </p>
        </div>

        {/* Tipo de Sessao */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Sessao *</Label>
          <select
            id="tipo"
            value={data.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {TIPOS_SESSAO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            {TIPOS_SESSAO.find(t => t.value === data.tipo)?.description}
          </p>
        </div>

        {/* Data */}
        <div className="space-y-2">
          <Label htmlFor="data" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data *
          </Label>
          <Input
            id="data"
            type="date"
            value={data.data}
            onChange={(e) => handleChange('data', e.target.value)}
            required
          />
        </div>

        {/* Horario */}
        <div className="space-y-2">
          <Label htmlFor="horario" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horario *
          </Label>
          <Input
            id="horario"
            type="time"
            value={data.horario}
            onChange={(e) => handleChange('horario', e.target.value)}
            required
          />
        </div>

        {/* Local */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="local" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Local
          </Label>
          <Input
            id="local"
            value={data.local}
            onChange={(e) => handleChange('local', e.target.value)}
            placeholder="Ex: Plenario da Camara Municipal"
          />
        </div>

        {/* Descricao */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descricao">Descricao / Observacoes</Label>
          <Textarea
            id="descricao"
            value={data.descricao}
            onChange={(e) => handleChange('descricao', e.target.value)}
            placeholder="Informacoes adicionais sobre a sessao..."
            rows={3}
          />
        </div>
      </div>

      {/* Preview */}
      {data.numero && data.data && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Preview</h3>
          <p className="text-blue-800">
            <strong>{data.numero}a Sessao {TIPOS_SESSAO.find(t => t.value === data.tipo)?.label}</strong>
          </p>
          <p className="text-sm text-blue-700">
            {data.data && new Date(data.data + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
            {data.horario && ` as ${data.horario}`}
          </p>
          {data.local && (
            <p className="text-sm text-blue-600">{data.local}</p>
          )}
        </div>
      )}
    </div>
  )
}
