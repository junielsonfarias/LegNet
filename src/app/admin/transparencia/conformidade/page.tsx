"use client"

import { createLogger } from '@/lib/logging/logger'
const log = createLogger('admin/transparencia/conformidade')

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { PageHeader } from "@/components/admin/page-header"
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Diamond, Award, Medal,
  Loader2, Building2, Scale, Users, DollarSign, UserCheck, Database, Eye,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { RedirectConfig } from "@/components/admin/redirect-config"

interface ItemConformidade {
  nome: string
  obrigatorio: boolean
  atendido: boolean
  recomendacao?: string
}

interface CategoriaConformidade {
  nome: string
  pontuacao: number
  pontuacaoMaxima: number
  percentual: number
  status: "CONFORME" | "ALERTA" | "NAO_CONFORME"
  itens: ItemConformidade[]
}

interface DadosConformidade {
  nivel: string
  pontuacaoTotal: number
  pontuacaoMaxima: number
  percentualGeral: number
  categorias: CategoriaConformidade[]
  dataGeracao: string
}

const nivelConfig: Record<string, { color: string; bg: string; icon: React.ElementType; border: string; badge: string }> = {
  DIAMANTE: { color: "text-purple-700", bg: "bg-purple-100", icon: Diamond, border: "border-purple-300", badge: "bg-purple-100 text-purple-800" },
  OURO: { color: "text-amber-700", bg: "bg-amber-100", icon: Award, border: "border-amber-300", badge: "bg-amber-100 text-amber-800" },
  PRATA: { color: "text-gray-600", bg: "bg-gray-100", icon: Medal, border: "border-gray-300", badge: "bg-gray-100 text-gray-700" },
  BRONZE: { color: "text-orange-700", bg: "bg-orange-100", icon: Medal, border: "border-orange-300", badge: "bg-orange-100 text-orange-800" },
}

const categoriaIcons: Record<string, React.ElementType> = {
  Institucional: Building2,
  Legislativo: Scale,
  Parlamentar: Users,
  Financeiro: DollarSign,
  Pessoal: UserCheck,
  "Dados Abertos": Database,
  Acessibilidade: Eye,
}

export default function AdminConformidadePage() {
  const [dados, setDados] = useState<DadosConformidade | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDados = async () => {
    try {
      const res = await fetch("/api/publico/conformidade")
      const json = await res.json()
      if (json.success) setDados(json.data)
    } catch (err) {
      log.error("Erro ao carregar conformidade", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDados()
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "CONFORME":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conforme
          </Badge>
        )
      case "ALERTA":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Alerta
          </Badge>
        )
      case "NAO_CONFORME":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">
            <XCircle className="h-3 w-3 mr-1" />
            Nao Conforme
          </Badge>
        )
      default:
        return null
    }
  }

  const config = dados ? (nivelConfig[dados.nivel] || nivelConfig.BRONZE) : nivelConfig.BRONZE
  const NivelIcon = config.icon

  const totalConformes = dados?.categorias.filter((c) => c.status === "CONFORME").length || 0
  const totalAlertas = dados?.categorias.filter((c) => c.status === "ALERTA").length || 0
  const totalNaoConformes = dados?.categorias.filter((c) => c.status === "NAO_CONFORME").length || 0

  const itensNaoConformes = dados?.categorias.flatMap((c) =>
    c.itens.filter((i) => !i.atendido && i.recomendacao).map((i) => ({
      categoria: c.nome,
      ...i,
    }))
  ) || []

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div className="flex items-center justify-between">
        <PageHeader
          title="Conformidade PNTP"
          subtitle="Painel de conformidade com o Programa Nacional de Transparencia Publica"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <RedirectConfig slug="conformidade" label="Conformidade PNTP" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !dados ? (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <p className="text-gray-500">Nao foi possivel carregar os dados de conformidade.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Nivel Card */}
            <Card className={`border-2 ${config.border}`}>
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <NivelIcon className={`h-8 w-8 ${config.color}`} />
                </div>
                <p className="text-sm text-gray-500 mb-1">Nivel Atual</p>
                <p className={`text-2xl font-bold ${config.color}`}>{dados.nivel}</p>
              </CardContent>
            </Card>

            {/* Percentual Geral */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Conformidade Geral</p>
                    <p className="text-2xl font-bold text-gray-900">{dados.percentualGeral}%</p>
                  </div>
                </div>
                <Progress value={dados.percentualGeral} className="h-2" />
                <p className="text-xs text-gray-400 mt-2">
                  {dados.pontuacaoTotal} / {dados.pontuacaoMaxima} pontos
                </p>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-3">Resumo das Categorias</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">Conformes</span>
                    </div>
                    <span className="text-sm font-bold text-green-700">{totalConformes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-700">Alertas</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-700">{totalAlertas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-700">Nao Conformes</span>
                    </div>
                    <span className="text-sm font-bold text-red-700">{totalNaoConformes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data de Geracao */}
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-3">Ultima Atualizacao</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(dados.dataGeracao).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(dados.dataGeracao).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Categorias */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Categorias de Conformidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dados.categorias.map((cat) => {
                const CatIcon = categoriaIcons[cat.nome] || Shield
                return (
                  <Card key={cat.nome} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <CatIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-base font-semibold">{cat.nome}</span>
                        </div>
                        {statusBadge(cat.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                        <span>{cat.pontuacao} / {cat.pontuacaoMaxima} pontos</span>
                        <span className="font-semibold">{cat.percentual}%</span>
                      </div>
                      <Progress
                        value={cat.percentual}
                        className={`h-2 ${
                          cat.status === "CONFORME"
                            ? "[&>div]:bg-green-500"
                            : cat.status === "ALERTA"
                            ? "[&>div]:bg-yellow-500"
                            : "[&>div]:bg-red-500"
                        }`}
                      />
                      <div className="mt-3 space-y-1.5">
                        {cat.itens.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {item.atendido ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                            )}
                            <span className={item.atendido ? "text-gray-700" : "text-gray-500"}>
                              {item.nome}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recomendacoes */}
          {itensNaoConformes.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Recomendacoes de Melhoria ({itensNaoConformes.length})
              </h2>
              <div className="space-y-3">
                {itensNaoConformes.map((item, idx) => (
                  <Card key={idx} className="border-l-4 border-l-yellow-400">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900">{item.nome}</p>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {item.categoria}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.recomendacao}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
