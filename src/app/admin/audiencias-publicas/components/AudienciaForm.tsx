'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Save, Trash2 } from 'lucide-react'
import type { AudienciaFormData, ParticipanteFormData, ParlamentarApi } from '../types'
import { getParticipanteColor, getParticipanteLabel } from '../types'

interface AudienciaFormProps {
  editingId: string | null
  formData: AudienciaFormData
  participanteForm: ParticipanteFormData
  parlamentares: ParlamentarApi[]
  onClose: () => void
  onSubmit: () => void
  onInputChange: (field: string, value: any) => void
  onParticipanteChange: (field: string, value: any) => void
  onAddParticipante: () => void
  onRemoveParticipante: (id: string) => void
}

export function AudienciaForm({
  editingId,
  formData,
  participanteForm,
  parlamentares,
  onClose,
  onSubmit,
  onInputChange,
  onParticipanteChange,
  onAddParticipante,
  onRemoveParticipante
}: AudienciaFormProps) {
  return (
    <Card className="camara-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-camara-primary">
          {editingId ? 'Editar Audiencia' : 'Nova Audiencia'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informacoes Basicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="titulo">Titulo *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => onInputChange('titulo', e.target.value)}
              placeholder="Titulo da audiencia"
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(value: any) => onInputChange('tipo', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORDINARIA">Ordinaria</SelectItem>
                <SelectItem value="EXTRAORDINARIA">Extraordinaria</SelectItem>
                <SelectItem value="ESPECIAL">Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <Select value={formData.status} onValueChange={(value: any) => onInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AGENDADA">Agendada</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="CONCLUIDA">Concluida</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
                <SelectItem value="ADIADA">Adiada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dataHora">Data e Hora *</Label>
            <Input
              id="dataHora"
              type="datetime-local"
              value={formData.dataHora}
              onChange={(e) => onInputChange('dataHora', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="local">Local *</Label>
            <Input
              id="local"
              value={formData.local}
              onChange={(e) => onInputChange('local', e.target.value)}
              placeholder="Local da audiencia"
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereco</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => onInputChange('endereco', e.target.value)}
              placeholder="Endereco completo"
            />
          </div>

          <div>
            <Label htmlFor="responsavel">Responsavel *</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => onInputChange('responsavel', e.target.value)}
              placeholder="Nome do responsavel"
            />
          </div>

          <div>
            <Label htmlFor="parlamentarId">Parlamentar Responsavel</Label>
            <Select value={formData.parlamentarId} onValueChange={(value) => onInputChange('parlamentarId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um parlamentar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {parlamentares.map(parlamentar => (
                  <SelectItem key={parlamentar.id} value={parlamentar.id}>
                    {parlamentar.apelido || parlamentar.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Descricao e Objetivos */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descricao *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => onInputChange('descricao', e.target.value)}
              placeholder="Descricao detalhada da audiencia"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="objetivo">Objetivo *</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => onInputChange('objetivo', e.target.value)}
              placeholder="Objetivo da audiencia"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="publicoAlvo">Publico-Alvo *</Label>
            <Textarea
              id="publicoAlvo"
              value={formData.publicoAlvo}
              onChange={(e) => onInputChange('publicoAlvo', e.target.value)}
              placeholder="Publico-alvo da audiencia"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observacoes</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => onInputChange('observacoes', e.target.value)}
              placeholder="Observacoes adicionais"
              rows={2}
            />
          </div>
        </div>

        {/* Configuracoes Avancadas */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Configuracoes Avancadas</h3>

          {/* Transmissao ao Vivo */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="transmissaoAtiva"
                checked={formData.transmissaoAoVivo?.ativa || false}
                onChange={(e) => onInputChange('transmissaoAoVivo', { ...formData.transmissaoAoVivo, ativa: e.target.checked })}
              />
              <Label htmlFor="transmissaoAtiva">Habilitar Transmissao ao Vivo</Label>
            </div>

            {formData.transmissaoAoVivo?.ativa && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="plataforma">Plataforma</Label>
                  <Select value={formData.transmissaoAoVivo?.plataforma || 'YouTube'} onValueChange={(value) => onInputChange('transmissaoAoVivo', { ...formData.transmissaoAoVivo, plataforma: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Twitch">Twitch</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="urlTransmissao">URL da Transmissao</Label>
                  <Input
                    id="urlTransmissao"
                    value={formData.transmissaoAoVivo?.url || ''}
                    onChange={(e) => onInputChange('transmissaoAoVivo', { ...formData.transmissaoAoVivo, url: e.target.value })}
                    placeholder="https://youtube.com/live/..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Inscricoes Publicas */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="inscricoesAtivas"
                checked={formData.inscricoesPublicas?.ativa || false}
                onChange={(e) => onInputChange('inscricoesPublicas', { ...formData.inscricoesPublicas, ativa: e.target.checked })}
              />
              <Label htmlFor="inscricoesAtivas">Habilitar Inscricoes Publicas</Label>
            </div>

            {formData.inscricoesPublicas?.ativa && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="dataLimiteInscricao">Data Limite para Inscricoes</Label>
                  <Input
                    id="dataLimiteInscricao"
                    type="datetime-local"
                    value={formData.inscricoesPublicas?.dataLimite || ''}
                    onChange={(e) => onInputChange('inscricoesPublicas', { ...formData.inscricoesPublicas, dataLimite: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="linkInscricao">Link de Inscricao</Label>
                  <Input
                    id="linkInscricao"
                    value={formData.inscricoesPublicas?.linkInscricao || ''}
                    onChange={(e) => onInputChange('inscricoesPublicas', { ...formData.inscricoesPublicas, linkInscricao: e.target.value })}
                    placeholder="/inscricoes/audiencia/..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Publicacao Publica */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="publicacaoAtiva"
                checked={formData.publicacaoPublica?.ativa || false}
                onChange={(e) => onInputChange('publicacaoPublica', { ...formData.publicacaoPublica, ativa: e.target.checked })}
              />
              <Label htmlFor="publicacaoAtiva">Publicar no Portal Publico</Label>
            </div>

            {formData.publicacaoPublica?.ativa && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="visivelPortal"
                    checked={formData.publicacaoPublica?.visivelPortal || false}
                    onChange={(e) => onInputChange('publicacaoPublica', { ...formData.publicacaoPublica, visivelPortal: e.target.checked })}
                  />
                  <Label htmlFor="visivelPortal">Visivel no Portal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="destaque"
                    checked={formData.publicacaoPublica?.destaque || false}
                    onChange={(e) => onInputChange('publicacaoPublica', { ...formData.publicacaoPublica, destaque: e.target.checked })}
                  />
                  <Label htmlFor="destaque">Destacar na Pagina Inicial</Label>
                </div>
              </div>
            )}
          </div>

          {/* Cronograma */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Cronograma da Audiencia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inicioCronograma">Inicio</Label>
                <Input
                  id="inicioCronograma"
                  type="datetime-local"
                  value={formData.cronograma?.inicio || ''}
                  onChange={(e) => onInputChange('cronograma', { ...formData.cronograma, inicio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fimCronograma">Fim</Label>
                <Input
                  id="fimCronograma"
                  type="datetime-local"
                  value={formData.cronograma?.fim || ''}
                  onChange={(e) => onInputChange('cronograma', { ...formData.cronograma, fim: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Participantes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Participantes</h3>
            <Badge variant="outline">{(formData.participantes || []).length} participantes</Badge>
          </div>

          {/* Formulario de Participante */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="participanteNome">Nome *</Label>
              <Input
                id="participanteNome"
                value={participanteForm.nome}
                onChange={(e) => onParticipanteChange('nome', e.target.value)}
                placeholder="Nome do participante"
              />
            </div>

            <div>
              <Label htmlFor="participanteCargo">Cargo</Label>
              <Input
                id="participanteCargo"
                value={participanteForm.cargo}
                onChange={(e) => onParticipanteChange('cargo', e.target.value)}
                placeholder="Cargo ou funcao"
              />
            </div>

            <div>
              <Label htmlFor="participanteInstituicao">Instituicao</Label>
              <Input
                id="participanteInstituicao"
                value={participanteForm.instituicao}
                onChange={(e) => onParticipanteChange('instituicao', e.target.value)}
                placeholder="Instituicao"
              />
            </div>

            <div>
              <Label htmlFor="participanteTipo">Tipo</Label>
              <Select value={participanteForm.tipo} onValueChange={(value: any) => onParticipanteChange('tipo', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARLAMENTAR">Parlamentar</SelectItem>
                  <SelectItem value="CONVIDADO">Convidado</SelectItem>
                  <SelectItem value="CIDADAO">Cidadao</SelectItem>
                  <SelectItem value="ORGAO_PUBLICO">Orgao Publico</SelectItem>
                  <SelectItem value="ENTIDADE">Entidade</SelectItem>
                  <SelectItem value="ESPECIALISTA">Especialista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={onAddParticipante} className="w-full">
                Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de Participantes */}
          {(formData.participantes || []).length > 0 && (
            <div className="space-y-2">
              {(formData.participantes || []).map((participante) => (
                <div key={participante.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-900">{participante.nome}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {participante.cargo && <span>{participante.cargo}</span>}
                        {participante.instituicao && <span>- {participante.instituicao}</span>}
                        <Badge className={getParticipanteColor(participante.tipo)}>
                          {getParticipanteLabel(participante.tipo)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveParticipante(participante.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botoes */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={onSubmit} className="bg-camara-primary hover:bg-camara-primary/90">
            <Save className="h-4 w-4 mr-2" />
            {editingId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
