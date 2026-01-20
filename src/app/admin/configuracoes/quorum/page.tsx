'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Vote, Settings2, Info, Loader2 } from 'lucide-react'
import {
  useQuorum,
  type ConfiguracaoQuorum,
  type TipoQuorum,
  type AplicacaoQuorum,
  type BaseCalculo,
  type CreateQuorumInput
} from '@/lib/hooks/use-quorum'
import { toast } from 'sonner'

const TIPOS_QUORUM: { value: TipoQuorum; label: string; descricao: string }[] = [
  { value: 'MAIORIA_SIMPLES', label: 'Maioria Simples', descricao: 'Mais votos favoraveis que contrarios entre os presentes' },
  { value: 'MAIORIA_ABSOLUTA', label: 'Maioria Absoluta', descricao: 'Mais da metade dos membros (50% + 1 do total)' },
  { value: 'DOIS_TERCOS', label: 'Dois Tercos', descricao: '2/3 dos membros ou presentes' },
  { value: 'TRES_QUINTOS', label: 'Tres Quintos', descricao: '3/5 dos membros ou presentes' },
  { value: 'UNANIMIDADE', label: 'Unanimidade', descricao: 'Todos os presentes devem votar a favor' },
]

const APLICACOES_QUORUM: { value: AplicacaoQuorum; label: string; descricao: string }[] = [
  { value: 'INSTALACAO_SESSAO', label: 'Instalacao de Sessao', descricao: 'Quorum minimo para iniciar a sessao' },
  { value: 'VOTACAO_SIMPLES', label: 'Votacao Simples', descricao: 'Votacoes comuns (maioria simples)' },
  { value: 'VOTACAO_ABSOLUTA', label: 'Votacao Absoluta', descricao: 'Materias que requerem maioria absoluta' },
  { value: 'VOTACAO_QUALIFICADA', label: 'Votacao Qualificada', descricao: 'Materias que requerem quorum qualificado (2/3, 3/5)' },
  { value: 'VOTACAO_URGENCIA', label: 'Votacao de Urgencia', descricao: 'Regime de urgencia para proposicoes' },
  { value: 'VOTACAO_COMISSAO', label: 'Votacao em Comissao', descricao: 'Votacoes nas comissoes permanentes' },
  { value: 'DERRUBADA_VETO', label: 'Derrubada de Veto', descricao: 'Apreciacao de vetos do Executivo' },
]

const BASES_CALCULO: { value: BaseCalculo; label: string; descricao: string }[] = [
  { value: 'PRESENTES', label: 'Presentes', descricao: 'Calcula sobre o numero de parlamentares presentes na sessao' },
  { value: 'TOTAL_MEMBROS', label: 'Total de Membros', descricao: 'Calcula sobre o total de membros da Casa' },
  { value: 'TOTAL_MANDATOS', label: 'Total de Mandatos', descricao: 'Calcula sobre o total de mandatos vigentes' },
]

interface FormData {
  nome: string
  descricao: string
  aplicacao: AplicacaoQuorum
  tipoQuorum: TipoQuorum
  percentualMinimo: string
  numeroMinimo: string
  baseCalculo: BaseCalculo
  permitirAbstencao: boolean
  abstencaoContaContra: boolean
  requererVotacaoNominal: boolean
  mensagemAprovacao: string
  mensagemRejeicao: string
  ativo: boolean
  ordem: string
}

const initialFormData: FormData = {
  nome: '',
  descricao: '',
  aplicacao: 'VOTACAO_SIMPLES',
  tipoQuorum: 'MAIORIA_SIMPLES',
  percentualMinimo: '',
  numeroMinimo: '',
  baseCalculo: 'PRESENTES',
  permitirAbstencao: true,
  abstencaoContaContra: false,
  requererVotacaoNominal: false,
  mensagemAprovacao: '',
  mensagemRejeicao: '',
  ativo: true,
  ordem: '0'
}

export default function QuorumConfigPage() {
  const { configuracoes, loading, refetch, create, update, remove } = useQuorum()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfiguracaoQuorum | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data: CreateQuorumInput = {
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        aplicacao: formData.aplicacao,
        tipoQuorum: formData.tipoQuorum,
        percentualMinimo: formData.percentualMinimo ? parseFloat(formData.percentualMinimo) : undefined,
        numeroMinimo: formData.numeroMinimo ? parseInt(formData.numeroMinimo) : undefined,
        baseCalculo: formData.baseCalculo,
        permitirAbstencao: formData.permitirAbstencao,
        abstencaoContaContra: formData.abstencaoContaContra,
        requererVotacaoNominal: formData.requererVotacaoNominal,
        mensagemAprovacao: formData.mensagemAprovacao || undefined,
        mensagemRejeicao: formData.mensagemRejeicao || undefined,
        ativo: formData.ativo,
        ordem: parseInt(formData.ordem) || 0
      }

      if (editingConfig) {
        await update(editingConfig.id, data)
      } else {
        await create(data)
      }

      handleClose()
    } catch (error) {
      console.error('Erro ao salvar configuracao:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (config: ConfiguracaoQuorum) => {
    setEditingConfig(config)
    setFormData({
      nome: config.nome,
      descricao: config.descricao || '',
      aplicacao: config.aplicacao,
      tipoQuorum: config.tipoQuorum,
      percentualMinimo: config.percentualMinimo?.toString() || '',
      numeroMinimo: config.numeroMinimo?.toString() || '',
      baseCalculo: config.baseCalculo as BaseCalculo,
      permitirAbstencao: config.permitirAbstencao,
      abstencaoContaContra: config.abstencaoContaContra,
      requererVotacaoNominal: config.requererVotacaoNominal,
      mensagemAprovacao: config.mensagemAprovacao || '',
      mensagemRejeicao: config.mensagemRejeicao || '',
      ativo: config.ativo,
      ordem: config.ordem.toString()
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta configuracao de quorum?')) {
      await remove(id)
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingConfig(null)
    setFormData(initialFormData)
  }

  const getTipoQuorumLabel = (tipo: TipoQuorum) => {
    return TIPOS_QUORUM.find(t => t.value === tipo)?.label || tipo
  }

  const getAplicacaoLabel = (aplicacao: AplicacaoQuorum) => {
    return APLICACOES_QUORUM.find(a => a.value === aplicacao)?.label || aplicacao
  }

  const getBaseCalculoLabel = (base: string) => {
    return BASES_CALCULO.find(b => b.value === base)?.label || base
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuracao de Quorum</h1>
          <p className="text-gray-600">Gerencie os tipos de quorum para sessoes e votacoes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Configuracao
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre as Configuracoes de Quorum</p>
              <p>Configure os diferentes tipos de quorum utilizados nas sessoes e votacoes da Casa Legislativa.
                 Cada tipo de aplicacao pode ter sua propria regra de quorum conforme o Regimento Interno.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Configuracoes Cadastradas
          </CardTitle>
          <CardDescription>
            {configuracoes.length} configuracao(oes) de quorum
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : configuracoes.length === 0 ? (
            <div className="text-center py-12">
              <Settings2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma configuracao de quorum cadastrada.</p>
              <p className="text-sm text-gray-400 mt-1">Clique em &ldquo;Nova Configuracao&rdquo; para adicionar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {configuracoes.map((config) => (
                <div
                  key={config.id}
                  className={`flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 ${!config.ativo ? 'opacity-60' : ''}`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">{config.nome}</h3>
                      <Badge variant={config.ativo ? 'default' : 'secondary'}>
                        {config.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">
                        {getAplicacaoLabel(config.aplicacao)}
                      </Badge>
                    </div>

                    {config.descricao && (
                      <p className="text-sm text-gray-600">{config.descricao}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary" className="font-normal">
                        {getTipoQuorumLabel(config.tipoQuorum)}
                      </Badge>
                      <Badge variant="secondary" className="font-normal">
                        Base: {getBaseCalculoLabel(config.baseCalculo)}
                      </Badge>
                      {config.percentualMinimo && (
                        <Badge variant="secondary" className="font-normal">
                          Min: {config.percentualMinimo}%
                        </Badge>
                      )}
                      {config.numeroMinimo && (
                        <Badge variant="secondary" className="font-normal">
                          Min: {config.numeroMinimo} votos
                        </Badge>
                      )}
                      {config.requererVotacaoNominal && (
                        <Badge variant="secondary" className="font-normal bg-amber-100">
                          Votacao Nominal
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Abstencao: {config.permitirAbstencao ? 'Permitida' : 'Nao permitida'}</span>
                      {config.permitirAbstencao && (
                        <span>Abstencao conta como: {config.abstencaoContaContra ? 'Contra' : 'Neutro'}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cadastro/Edicao */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardHeader>
              <CardTitle>
                {editingConfig ? 'Editar Configuracao de Quorum' : 'Nova Configuracao de Quorum'}
              </CardTitle>
              <CardDescription>
                Configure os parametros de quorum para votacoes e sessoes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informacoes Basicas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Informacoes Basicas</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Maioria Absoluta para PLs"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="aplicacao">Aplicacao *</Label>
                      <select
                        id="aplicacao"
                        value={formData.aplicacao}
                        onChange={(e) => setFormData({ ...formData, aplicacao: e.target.value as AplicacaoQuorum })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!!editingConfig}
                      >
                        {APLICACOES_QUORUM.map(app => (
                          <option key={app.value} value={app.value}>{app.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {APLICACOES_QUORUM.find(a => a.value === formData.aplicacao)?.descricao}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descricao</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva quando este quorum se aplica..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Configuracao de Quorum */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Regra de Quorum</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipoQuorum">Tipo de Quorum *</Label>
                      <select
                        id="tipoQuorum"
                        value={formData.tipoQuorum}
                        onChange={(e) => setFormData({ ...formData, tipoQuorum: e.target.value as TipoQuorum })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {TIPOS_QUORUM.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {TIPOS_QUORUM.find(t => t.value === formData.tipoQuorum)?.descricao}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="baseCalculo">Base de Calculo *</Label>
                      <select
                        id="baseCalculo"
                        value={formData.baseCalculo}
                        onChange={(e) => setFormData({ ...formData, baseCalculo: e.target.value as BaseCalculo })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {BASES_CALCULO.map(base => (
                          <option key={base.value} value={base.value}>{base.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {BASES_CALCULO.find(b => b.value === formData.baseCalculo)?.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="percentualMinimo">Percentual Minimo (%)</Label>
                      <Input
                        id="percentualMinimo"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.percentualMinimo}
                        onChange={(e) => setFormData({ ...formData, percentualMinimo: e.target.value })}
                        placeholder="Ex: 50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Opcional</p>
                    </div>

                    <div>
                      <Label htmlFor="numeroMinimo">Numero Minimo de Votos</Label>
                      <Input
                        id="numeroMinimo"
                        type="number"
                        min="1"
                        value={formData.numeroMinimo}
                        onChange={(e) => setFormData({ ...formData, numeroMinimo: e.target.value })}
                        placeholder="Ex: 5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Opcional</p>
                    </div>

                    <div>
                      <Label htmlFor="ordem">Ordem de Exibicao</Label>
                      <Input
                        id="ordem"
                        type="number"
                        min="0"
                        value={formData.ordem}
                        onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Opcoes de Votacao */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Opcoes de Votacao</h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="permitirAbstencao">Permitir Abstencao</Label>
                        <p className="text-xs text-gray-500">Parlamentares podem se abster de votar</p>
                      </div>
                      <Switch
                        id="permitirAbstencao"
                        checked={formData.permitirAbstencao}
                        onCheckedChange={(checked) => setFormData({ ...formData, permitirAbstencao: checked })}
                      />
                    </div>

                    {formData.permitirAbstencao && (
                      <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200">
                        <div>
                          <Label htmlFor="abstencaoContaContra">Abstencao Conta como Contra</Label>
                          <p className="text-xs text-gray-500">Abstencoes sao contabilizadas como votos contrarios</p>
                        </div>
                        <Switch
                          id="abstencaoContaContra"
                          checked={formData.abstencaoContaContra}
                          onCheckedChange={(checked) => setFormData({ ...formData, abstencaoContaContra: checked })}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="requererVotacaoNominal">Requerer Votacao Nominal</Label>
                        <p className="text-xs text-gray-500">Exige votacao nominal (nao permite votacao simbolica)</p>
                      </div>
                      <Switch
                        id="requererVotacaoNominal"
                        checked={formData.requererVotacaoNominal}
                        onCheckedChange={(checked) => setFormData({ ...formData, requererVotacaoNominal: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ativo">Configuracao Ativa</Label>
                        <p className="text-xs text-gray-500">Desative para nao utilizar esta configuracao</p>
                      </div>
                      <Switch
                        id="ativo"
                        checked={formData.ativo}
                        onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Mensagens Personalizadas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Mensagens Personalizadas</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mensagemAprovacao">Mensagem de Aprovacao</Label>
                      <Input
                        id="mensagemAprovacao"
                        value={formData.mensagemAprovacao}
                        onChange={(e) => setFormData({ ...formData, mensagemAprovacao: e.target.value })}
                        placeholder="Ex: Aprovado por maioria"
                      />
                      <p className="text-xs text-gray-500 mt-1">Exibida quando aprovado</p>
                    </div>

                    <div>
                      <Label htmlFor="mensagemRejeicao">Mensagem de Rejeicao</Label>
                      <Input
                        id="mensagemRejeicao"
                        value={formData.mensagemRejeicao}
                        onChange={(e) => setFormData({ ...formData, mensagemRejeicao: e.target.value })}
                        placeholder="Ex: Rejeitado por nao atingir quorum"
                      />
                      <p className="text-xs text-gray-500 mt-1">Exibida quando rejeitado</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingConfig ? 'Atualizar' : 'Criar'} Configuracao
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
