'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Save, Download, Upload, RefreshCcw, Building2, Settings, Shield, SlidersHorizontal, AlertCircle, ArrowRight, FileText, Workflow, Vote, Database, Layers, Key } from 'lucide-react'
import Link from 'next/link'

import { configuracoesApi, ConfiguracaoInstitucionalApi } from '@/lib/api/configuracoes-api'
import {
  configuracoesSistemaApi,
  configuracoesBackupApi,
  SystemConfigApi,
  SystemConfigType
} from '@/lib/api/configuracoes-sistema-api'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const temaOptions = [
  { label: 'Claro', value: 'claro' },
  { label: 'Escuro', value: 'escuro' },
  { label: 'Automático', value: 'auto' }
]

const timezoneOptions = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Cuiaba'
]

const SESSION_MANAGER_ROLES = ['ADMIN', 'SECRETARIA'] as const

const initialInstitutional: ConfiguracaoInstitucionalApi = {
  id: '',
  slug: 'principal',
  nomeCasa: '',
  sigla: '',
  cnpj: '',
  enderecoLogradouro: '',
  enderecoNumero: '',
  enderecoBairro: '',
  enderecoCidade: '',
  enderecoEstado: '',
  enderecoCep: '',
  telefone: '',
  email: '',
  site: '',
  logoUrl: '',
  tema: 'claro',
  timezone: 'America/Sao_Paulo',
  descricao: '',
  createdAt: '',
  updatedAt: ''
}

type SystemDraftValues = Record<string, string | boolean>

const buildDraftValue = (config: SystemConfigApi): string | boolean => {
  switch (config.tipo) {
    case 'boolean':
      return Boolean(config.valor)
    case 'number':
      return config.valor !== undefined && config.valor !== null ? String(config.valor) : ''
    case 'json':
      try {
        return JSON.stringify(config.valor ?? null, null, 2)
      } catch (error) {
        console.error('Erro ao serializar valor de configuração:', error)
        return String(config.valor ?? '')
      }
    default:
      return String(config.valor ?? '')
  }
}

const isEqualValue = (tipo: SystemConfigType, original: any, draft: string | boolean): boolean => {
  switch (tipo) {
    case 'boolean':
      return Boolean(original) === Boolean(draft)
    case 'number':
      return Number(original) === Number(draft)
    case 'json':
      try {
        const originalString = JSON.stringify(original ?? null)
        const draftParsed = typeof draft === 'string' ? JSON.parse(draft) : draft
        return originalString === JSON.stringify(draftParsed ?? null)
      } catch (error) {
        console.error('Erro ao comparar valores JSON:', error)
        return false
      }
    default:
      return String(original ?? '') === String(draft ?? '')
  }
}

const parseDraftForUpdate = (tipo: SystemConfigType, draft: string | boolean): any => {
  switch (tipo) {
    case 'boolean':
      return Boolean(draft)
    case 'number':
      return Number(draft)
    case 'json':
      if (typeof draft !== 'string') return draft
      try {
        return JSON.parse(draft || 'null')
      } catch {
        return null
      }
    default:
      return typeof draft === 'string' ? draft : String(draft)
  }
}

const formatUpdatedDraft = (config: SystemConfigApi): string | boolean => buildDraftValue(config)

export default function ConfiguracoesPage() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'

  const [loading, setLoading] = useState(true)
  const [institutional, setInstitutional] = useState(initialInstitutional)
  const [savingInstitutional, setSavingInstitutional] = useState(false)

  const [systemConfigs, setSystemConfigs] = useState<SystemConfigApi[]>([])
  const [systemDraft, setSystemDraft] = useState<SystemDraftValues>({})
  const [savingSystem, setSavingSystem] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const role = session?.user?.role as string | undefined
  const canManage = !!role && SESSION_MANAGER_ROLES.includes(role as (typeof SESSION_MANAGER_ROLES)[number])

  const handleLoad = useCallback(async () => {
    try {
      setLoading(true)
      const [institucionalResponse, sistemaResponse] = await Promise.all([
        configuracoesApi.get(),
        configuracoesSistemaApi.getAll()
      ])

      setInstitutional({ ...initialInstitutional, ...institucionalResponse })
      setSystemConfigs(sistemaResponse)

      const drafts: SystemDraftValues = {}
      sistemaResponse.forEach(config => {
        drafts[config.chave] = buildDraftValue(config)
      })
      setSystemDraft(drafts)
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error)
      toast.error(error?.message ?? 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      handleLoad()
    }
  }, [status, handleLoad])

  const groupedSystemConfigs = useMemo(() => {
    const groups = new Map<string, SystemConfigApi[]>()
    systemConfigs.forEach(config => {
      const category = config.categoria || 'Geral'
      if (!groups.has(category)) {
        groups.set(category, [])
      }
      groups.get(category)!.push(config)
    })
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [systemConfigs])

  const handleInstitutionalChange = (field: keyof ConfiguracaoInstitucionalApi) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setInstitutional(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSubmitInstitutional = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canManage) {
      toast.error('Você não possui permissão para alterar as configurações institucionais.')
      return
    }

    setSavingInstitutional(true)
    try {
      const payload = {
        nomeCasa: institutional.nomeCasa,
        sigla: institutional.sigla,
        cnpj: institutional.cnpj,
        enderecoLogradouro: institutional.enderecoLogradouro,
        enderecoNumero: institutional.enderecoNumero,
        enderecoBairro: institutional.enderecoBairro,
        enderecoCidade: institutional.enderecoCidade,
        enderecoEstado: institutional.enderecoEstado,
        enderecoCep: institutional.enderecoCep,
        telefone: institutional.telefone,
        email: institutional.email,
        site: institutional.site,
        logoUrl: institutional.logoUrl,
        tema: institutional.tema ?? 'claro',
        timezone: institutional.timezone ?? 'America/Sao_Paulo',
        descricao: institutional.descricao
      }

      const updated = await configuracoesApi.update(payload)
      setInstitutional({ ...institutional, ...updated })
      toast.success('Configurações institucionais atualizadas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar configurações institucionais:', error)
      toast.error(error?.message ?? 'Erro ao atualizar configurações institucionais')
    } finally {
      setSavingInstitutional(false)
    }
  }

  const handleSystemValueChange = (config: SystemConfigApi, value: string | boolean) => {
    if (!config.editavel) return
    setSystemDraft(prev => ({
      ...prev,
      [config.chave]: value
    }))
  }

  const handleSaveSystem = async () => {
    if (!canManage) {
      toast.error('Você não possui permissão para alterar as configurações do sistema.')
      return
    }

    const updates: Array<{ chave: string; valor: any; tipo?: SystemConfigType }> = []

    try {
      systemConfigs.forEach(config => {
        if (!config.editavel) return
        const draftValue = systemDraft[config.chave]

        if (draftValue === undefined) return

        if (isEqualValue(config.tipo, config.valor, draftValue)) {
          return
        }

        const parsedValue = parseDraftForUpdate(config.tipo, draftValue)

        if (config.tipo === 'number' && Number.isNaN(parsedValue)) {
          throw new Error(`Valor inválido para ${config.chave}. Informe um número.`)
        }

        updates.push({
          chave: config.chave,
          valor: parsedValue,
          tipo: config.tipo
        })
      })
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao validar configurações do sistema')
      return
    }

    if (updates.length === 0) {
      toast.info('Nenhuma alteração foi realizada nas configurações do sistema.')
      return
    }

    setSavingSystem(true)
    try {
      const updated = await configuracoesSistemaApi.update(updates)

      setSystemConfigs(prev => {
        const map = new Map(prev.map(item => [item.chave, item]))
        updated.forEach(item => {
          map.set(item.chave, item)
        })
        return Array.from(map.values()).sort((a, b) => a.chave.localeCompare(b.chave))
      })

      setSystemDraft(prev => {
        const next = { ...prev }
        updated.forEach(config => {
          next[config.chave] = formatUpdatedDraft(config)
        })
        return next
      })

      toast.success('Configurações do sistema atualizadas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar configurações de sistema:', error)
      toast.error(error?.message ?? 'Erro ao atualizar configurações do sistema')
    } finally {
      setSavingSystem(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const backup = await configuracoesBackupApi.exportar()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup-configuracoes-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Backup exportado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao exportar backup:', error)
      toast.error(error?.message ?? 'Não foi possível exportar o backup')
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      await configuracoesBackupApi.restaurar(payload)
      toast.success('Backup importado com sucesso!')
      await handleLoad()
    } catch (error: any) {
      console.error('Erro ao importar backup:', error)
      toast.error(error?.message ?? 'Não foi possível importar o backup')
    } finally {
      setImporting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCcw className="h-5 w-5 animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações Gerais</h1>
          <p className="text-sm text-muted-foreground">
            Defina parâmetros institucionais, operacionais e de segurança do sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || loading}
            tabIndex={0}
            aria-label="Exportar backup das configurações"
          >
            <Download className={cn('h-4 w-4', exporting && 'animate-spin')} />
            <span className="ml-2">Exportar</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            disabled={importing}
            tabIndex={0}
            aria-label="Importar backup das configurações"
          >
            <Upload className={cn('h-4 w-4', importing && 'animate-pulse')} />
            <span className="ml-2">Importar</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <AdminBreadcrumbs />
      </div>

      {/* Links rápidos para configurações avançadas */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Link
          href="/admin/configuracoes/tipos-proposicoes"
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-camara-primary hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Tipos de Proposição</p>
            <p className="text-xs text-gray-500">Gerenciar tipos e configurações</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-camara-primary" />
        </Link>

        <Link
          href="/admin/configuracoes/tipos-tramitacao"
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-camara-primary hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100">
            <Workflow className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Tipos de Tramitação</p>
            <p className="text-xs text-gray-500">Fluxos de tramitação</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-camara-primary" />
        </Link>

        <Link
          href="/admin/configuracoes/quorum"
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-camara-primary hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100">
            <Vote className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Quórum</p>
            <p className="text-xs text-gray-500">Regras de votação</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-camara-primary" />
        </Link>

        <Link
          href="/admin/configuracoes/backups"
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-camara-primary hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Backups</p>
            <p className="text-xs text-gray-500">Backup e restauração</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-camara-primary" />
        </Link>

        <Link
          href="/admin/templates-sessao"
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-camara-primary hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Templates de Sessão</p>
            <p className="text-xs text-gray-500">Modelos de pauta</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-camara-primary" />
        </Link>

        <Link
          href="/admin/integracoes"
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-camara-primary hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
            <Key className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Integrações</p>
            <p className="text-xs text-gray-500">APIs e webhooks</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-camara-primary" />
        </Link>
      </div>

      {!canManage && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900" role="alert">
          <AlertCircle className="h-4 w-4" />
          <span>Você possui acesso somente para consulta. Apenas perfis Secretaria ou Admin podem salvar alterações.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-camara-primary" />
            Configurações Institucionais
          </CardTitle>
          <CardDescription>Identidade da casa legislativa, informações de contato e apresentação pública.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitInstitutional} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomeCasa">Nome da Casa Legislativa *</Label>
                <Input
                  id="nomeCasa"
                  value={institutional.nomeCasa}
                  onChange={handleInstitutionalChange('nomeCasa')}
                  placeholder="Câmara Municipal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla</Label>
                <Input
                  id="sigla"
                  value={institutional.sigla ?? ''}
                  onChange={handleInstitutionalChange('sigla')}
                  placeholder="CMMC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={institutional.cnpj ?? ''}
                  onChange={handleInstitutionalChange('cnpj')}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={institutional.telefone ?? ''}
                  onChange={handleInstitutionalChange('telefone')}
                  placeholder="(93) 99999-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={institutional.email ?? ''}
                  onChange={handleInstitutionalChange('email')}
                  placeholder="contato@camara.pa.gov.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site">Site Oficial</Label>
                <Input
                  id="site"
                  type="url"
                  value={institutional.site ?? ''}
                  onChange={handleInstitutionalChange('site')}
                  placeholder="https://www.camara.pa.gov.br"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="enderecoLogradouro">Logradouro</Label>
                <Input
                  id="enderecoLogradouro"
                  value={institutional.enderecoLogradouro ?? ''}
                  onChange={handleInstitutionalChange('enderecoLogradouro')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enderecoNumero">Número</Label>
                <Input
                  id="enderecoNumero"
                  value={institutional.enderecoNumero ?? ''}
                  onChange={handleInstitutionalChange('enderecoNumero')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enderecoBairro">Bairro</Label>
                <Input
                  id="enderecoBairro"
                  value={institutional.enderecoBairro ?? ''}
                  onChange={handleInstitutionalChange('enderecoBairro')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enderecoCidade">Cidade</Label>
                <Input
                  id="enderecoCidade"
                  value={institutional.enderecoCidade ?? ''}
                  onChange={handleInstitutionalChange('enderecoCidade')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enderecoEstado">Estado</Label>
                <Input
                  id="enderecoEstado"
                  value={institutional.enderecoEstado ?? ''}
                  onChange={handleInstitutionalChange('enderecoEstado')}
                  placeholder="PA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enderecoCep">CEP</Label>
                <Input
                  id="enderecoCep"
                  value={institutional.enderecoCep ?? ''}
                  onChange={handleInstitutionalChange('enderecoCep')}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tema">Tema</Label>
                <select
                  id="tema"
                  value={institutional.tema ?? 'claro'}
                  onChange={handleInstitutionalChange('tema')}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-camara-primary focus:outline-none"
                >
                  {temaOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <select
                  id="timezone"
                  value={institutional.timezone ?? 'America/Sao_Paulo'}
                  onChange={handleInstitutionalChange('timezone')}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-camara-primary focus:outline-none"
                >
                  {timezoneOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL do Logotipo</Label>
              <Input
                id="logoUrl"
                value={institutional.logoUrl ?? ''}
                onChange={handleInstitutionalChange('logoUrl')}
                placeholder="https://.../logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição / Observações</Label>
              <Textarea
                id="descricao"
                value={institutional.descricao ?? ''}
                onChange={handleInstitutionalChange('descricao')}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={savingInstitutional || !canManage}
                className="flex items-center"
                aria-label="Salvar configurações institucionais"
              >
                <Save className={cn('mr-2 h-4 w-4', savingInstitutional && 'animate-spin')} />
                {savingInstitutional ? 'Salvando...' : 'Salvar' }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-camara-primary" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription>Parâmetros operacionais, integrações e segurança.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {groupedSystemConfigs.map(([categoria, configs]) => (
            <div key={categoria} className="space-y-4" role="group" aria-label={`Configurações da categoria ${categoria}`}>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-camara-primary/10 text-camara-primary">
                  {categoria}
                </Badge>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-6">
                {configs.map(config => {
                  const draftValue = systemDraft[config.chave]
                  const isBoolean = config.tipo === 'boolean'
                  const isNumber = config.tipo === 'number'
                  const isJson = config.tipo === 'json'

                  return (
                    <div
                      key={config.id}
                      className="rounded-lg border border-gray-200 p-4 focus-within:border-camara-primary"
                      tabIndex={0}
                      aria-label={`Configuração ${config.descricao ?? config.chave}`}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{config.descricao ?? config.chave}</p>
                          <p className="text-xs text-muted-foreground">Chave: {config.chave}</p>
                        </div>
                        <Badge variant={config.editavel ? 'default' : 'outline'}>
                          {config.editavel ? 'Editável' : 'Somente leitura'}
                        </Badge>
                      </div>

                      <div className="mt-3">
                        {isBoolean ? (
                          <Switch
                            checked={Boolean(draftValue)}
                            onCheckedChange={checked => handleSystemValueChange(config, checked)}
                            disabled={!config.editavel || savingSystem}
                            aria-label={`Alternar ${config.descricao ?? config.chave}`}
                          />
                        ) : isJson ? (
                          <Textarea
                            value={typeof draftValue === 'string' ? draftValue : ''}
                            onChange={event => handleSystemValueChange(config, event.target.value)}
                            disabled={!config.editavel || savingSystem}
                            rows={4}
                            className="font-mono text-sm"
                            aria-label={`Editar ${config.descricao ?? config.chave}`}
                          />
                        ) : (
                          <Input
                            type={isNumber ? 'number' : 'text'}
                            value={typeof draftValue === 'string' ? draftValue : ''}
                            onChange={event => handleSystemValueChange(config, event.target.value)}
                            disabled={!config.editavel || savingSystem}
                            aria-label={`Editar ${config.descricao ?? config.chave}`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSaveSystem}
              disabled={savingSystem || !canManage}
              className="flex items-center"
              aria-label="Salvar configurações do sistema"
            >
              <SlidersHorizontal className={cn('mr-2 h-4 w-4', savingSystem && 'animate-spin')} />
              {savingSystem ? 'Salvando...' : 'Salvar alterações do sistema'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-camara-primary" />
            Auditoria e Segurança
          </CardTitle>
          <CardDescription>Registros de auditoria são gerados automaticamente para cada alteração salva.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Toda alteração registrada por usuários autorizados gera um log de auditoria com data, usuário, IP e detalhes da operação,
            reforçando a transparência e o alinhamento com as diretrizes do SAPL.
          </p>
          <p>
            Utilize os backups para versionar configurações antes de mudanças relevantes e mantenha-os em local seguro.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
