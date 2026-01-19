'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useLegislaturas } from '@/lib/hooks/use-legislaturas'
import { toast } from 'sonner'

export default function NovoParlamentarPage() {
  const router = useRouter()
  const { create } = useParlamentares()
  const { legislaturas } = useLegislaturas({ ativa: true })
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    email: '',
    telefone: '',
    partido: '',
    biografia: '',
    foto: '',
    gabinete: '',
    cargo: 'VEREADOR' as 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'PRIMEIRO_SECRETARIO' | 'SEGUNDO_SECRETARIO' | 'VEREADOR',
    legislatura: '',
    ativo: true
  })

  const [mandatos, setMandatos] = useState<Array<{
    legislaturaId: string
    numeroVotos: number
    cargo: string
    dataInicio: string
    dataFim?: string
  }>>([])

  const [filiacoes, setFiliacoes] = useState<Array<{
    partido: string
    dataInicio: string
    dataFim?: string
  }>>([])

  // Preencher legislatura atual por padrão
  useEffect(() => {
    if (legislaturas && legislaturas.length > 0) {
      const atual = legislaturas.find(l => l.ativa) || legislaturas[0]
      if (atual) {
        setFormData(prev => ({ ...prev, legislatura: `${atual.anoInicio}/${atual.anoFim}` }))
        // Adicionar mandato inicial
        setMandatos([{
          legislaturaId: atual.id,
          numeroVotos: 0,
          cargo: 'VEREADOR',
          dataInicio: new Date().toISOString().split('T')[0]
        }])
      }
    }
  }, [legislaturas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obrigatórios
      if (!formData.nome || !formData.apelido || !formData.legislatura) {
        toast.error('Preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      // Criar parlamentar
      const novo = await create({
        nome: formData.nome,
        apelido: formData.apelido,
        cargo: formData.cargo,
        partido: formData.partido || undefined,
        legislatura: formData.legislatura,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        biografia: formData.biografia || undefined,
        foto: formData.foto || undefined,
        gabinete: formData.gabinete || undefined,
        ativo: formData.ativo,
        mandatos: mandatos.length > 0 ? mandatos.map(m => ({
          legislaturaId: m.legislaturaId,
          numeroVotos: m.numeroVotos,
          cargo: m.cargo as any,
          dataInicio: m.dataInicio,
          dataFim: m.dataFim
        })) : undefined,
        filiacoes: filiacoes.length > 0 ? filiacoes.map(f => ({
          partido: f.partido,
          dataInicio: f.dataInicio,
          dataFim: f.dataFim
        })) : undefined
      })

      if (novo) {
        toast.success('Parlamentar criado com sucesso')
        router.push('/admin/parlamentares')
      } else {
        toast.error('Erro ao criar parlamentar')
      }
    } catch (error) {
      console.error('Erro ao criar parlamentar:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar parlamentar')
    } finally {
      setLoading(false)
    }
  }

  const adicionarMandato = () => {
    setMandatos([...mandatos, {
      legislaturaId: '',
      numeroVotos: 0,
      cargo: 'VEREADOR',
      dataInicio: new Date().toISOString().split('T')[0]
    }])
  }

  const removerMandato = (index: number) => {
    setMandatos(mandatos.filter((_, i) => i !== index))
  }

  const adicionarFiliacao = () => {
    setFiliacoes([...filiacoes, {
      partido: '',
      dataInicio: new Date().toISOString().split('T')[0]
    }])
  }

  const removerFiliacao = (index: number) => {
    setFiliacoes(filiacoes.filter((_, i) => i !== index))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Novo Parlamentar</h1>
        <p className="text-gray-600 mt-2">Cadastre um novo vereador na Câmara Municipal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apelido">Apelido *</Label>
                <Input
                  id="apelido"
                  value={formData.apelido}
                  onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  required
                  placeholder="Ex: João do Bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(93) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gabinete">Gabinete</Label>
                <Input
                  id="gabinete"
                  value={formData.gabinete}
                  onChange={(e) => setFormData({ ...formData, gabinete: e.target.value })}
                  placeholder="Ex: Gabinete 01, Sala 102"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto">Foto</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="foto"
                    value={formData.foto}
                    onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                    placeholder="URL da foto ou faca upload"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    id="fotoUpload"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const formDataUpload = new FormData()
                      formDataUpload.append('file', file)
                      formDataUpload.append('folder', 'parlamentares')
                      try {
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formDataUpload
                        })
                        if (response.ok) {
                          const data = await response.json()
                          setFormData(prev => ({ ...prev, foto: data.url }))
                          toast.success('Foto enviada com sucesso')
                        } else {
                          toast.error('Erro ao enviar foto')
                        }
                      } catch (error) {
                        console.error('Erro ao enviar foto:', error)
                        toast.error('Erro ao enviar foto')
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('fotoUpload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {formData.foto && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 truncate">{formData.foto}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="biografia">Biografia</Label>
              <Textarea
                id="biografia"
                value={formData.biografia}
                onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                rows={4}
                placeholder="Breve biografia do parlamentar..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Cargo e Status */}
        <Card>
          <CardHeader>
            <CardTitle>Cargo e Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <select
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="VEREADOR">Vereador</option>
                  <option value="PRESIDENTE">Presidente</option>
                  <option value="VICE_PRESIDENTE">Vice-Presidente</option>
                  <option value="PRIMEIRO_SECRETARIO">1º Secretário</option>
                  <option value="SEGUNDO_SECRETARIO">2º Secretário</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legislatura">Legislatura Atual *</Label>
                <Input
                  id="legislatura"
                  value={formData.legislatura}
                  onChange={(e) => setFormData({ ...formData, legislatura: e.target.value })}
                  required
                  placeholder="Ex: 2025/2028"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partido">Partido Atual</Label>
              <Input
                id="partido"
                value={formData.partido}
                onChange={(e) => setFormData({ ...formData, partido: e.target.value })}
                placeholder="Ex: Partido A"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ativo">Parlamentar Ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Mandatos (Legislaturas) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mandatos (Legislaturas)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarMandato}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Mandato
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mandatos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum mandato cadastrado. Clique no botão Adicionar Mandato para incluir.
              </p>
            ) : (
              mandatos.map((mandato, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Mandato {index + 1}</h4>
                    {mandatos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerMandato(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Legislatura</Label>
                      <select
                        value={mandato.legislaturaId}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].legislaturaId = e.target.value
                          setMandatos(novos)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Selecione...</option>
                        {legislaturas?.map(leg => (
                          <option key={leg.id} value={leg.id}>
                            {leg.numero}ª - {leg.anoInicio}/{leg.anoFim}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número de Votos</Label>
                      <Input
                        type="number"
                        min="0"
                        value={mandato.numeroVotos}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].numeroVotos = parseInt(e.target.value) || 0
                          setMandatos(novos)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo no Mandato</Label>
                      <select
                        value={mandato.cargo}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].cargo = e.target.value
                          setMandatos(novos)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="VEREADOR">Vereador</option>
                        <option value="PRESIDENTE">Presidente</option>
                        <option value="VICE_PRESIDENTE">Vice-Presidente</option>
                        <option value="PRIMEIRO_SECRETARIO">1º Secretário</option>
                        <option value="SEGUNDO_SECRETARIO">2º Secretário</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={mandato.dataInicio}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].dataInicio = e.target.value
                          setMandatos(novos)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Fim (opcional)</Label>
                      <Input
                        type="date"
                        value={mandato.dataFim || ''}
                        onChange={(e) => {
                          const novos = [...mandatos]
                          novos[index].dataFim = e.target.value || undefined
                          setMandatos(novos)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Filiações Partidárias */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filiações Partidárias</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarFiliacao}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Filiação
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filiacoes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma filiação cadastrada. Clique no botão Adicionar Filiação para incluir.
              </p>
            ) : (
              filiacoes.map((filiacao, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Filiação {index + 1}</h4>
                    {filiacoes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerFiliacao(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Partido</Label>
                      <Input
                        value={filiacao.partido}
                        onChange={(e) => {
                          const novas = [...filiacoes]
                          novas[index].partido = e.target.value
                          setFiliacoes(novas)
                        }}
                        placeholder="Ex: Partido A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={filiacao.dataInicio}
                        onChange={(e) => {
                          const novas = [...filiacoes]
                          novas[index].dataInicio = e.target.value
                          setFiliacoes(novas)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Fim (opcional)</Label>
                      <Input
                        type="date"
                        value={filiacao.dataFim || ''}
                        onChange={(e) => {
                          const novas = [...filiacoes]
                          novas[index].dataFim = e.target.value || undefined
                          setFiliacoes(novas)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-camara-primary hover:bg-camara-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Parlamentar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

