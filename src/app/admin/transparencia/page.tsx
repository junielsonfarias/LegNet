"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye, Download, Upload, Save, X, Calendar, FileText, Users, Building, DollarSign, Shield, BookOpen, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { transparenciaService } from "@/lib/transparencia-service";
import { TransparenciaItem, TransparenciaFiltros } from "@/lib/types/transparencia";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";

const categorias = [
  {
    id: 'portal-da-transparencia',
    nome: 'Portal da Transparência',
    descricao: 'Informações institucionais e organizacionais',
    icone: Building,
    cor: 'bg-blue-500',
    subcategorias: [
      'Mesa Diretora e Vereadores',
      'Estrutura Organizacional',
      'Endereço e Horário',
      'Organograma',
      'Agenda Externa do Presidente',
      'Competências Organizacionais',
      'Carta de Serviços ao Usuário',
      'Perguntas Frequentes FAQ'
    ]
  },
  {
    id: 'lei-de-responsabilidade-fiscal',
    nome: 'Lei de Responsabilidade Fiscal',
    descricao: 'Documentos fiscais e orçamentários',
    icone: DollarSign,
    cor: 'bg-green-500',
    subcategorias: [
      'LOA - Lei Orçamentária Anual',
      'LDO - Lei de Diretrizes Orçamentárias',
      'PPA - Plano Plurianual',
      'RGF - Relatório de Gestão Fiscal'
    ]
  },
  {
    id: 'receitas-despesas-convenios-folhas-licitacoes-contratos',
    nome: 'Receitas, Despesas, Convênios, Folhas, Licitações e Contratos',
    descricao: 'Informações financeiras e contratuais',
    icone: FileText,
    cor: 'bg-purple-500',
    subcategorias: [
      'Receitas',
      'Despesas',
      'Licitações',
      'Contratos',
      'Convênios',
      'Pessoal - Folha de Pagamento',
      'Cargos e Funções',
      'Diárias',
      'Balancete Financeiro',
      'Notas Fiscais',
      'Estagiários',
      'Terceirizados',
      'Plano de Contratação',
      'Inidôneas/Suspensas',
      'Cronograma de Pagamentos',
      'Contas de Governo',
      'Contas de Gestão',
      'Balanço Geral'
    ]
  },
  {
    id: 'ouvidoria-e-e-sic',
    nome: 'Ouvidoria e e-SIC',
    descricao: 'Canais de comunicação e acesso à informação',
    icone: MessageSquare,
    cor: 'bg-orange-500',
    subcategorias: [
      'Perguntas e Respostas',
      'E-SIC',
      'Ouvidoria',
      'Fale Conosco'
    ]
  },
  {
    id: 'publicacoes',
    nome: 'Publicações',
    descricao: 'Atos normativos e documentos oficiais',
    icone: BookOpen,
    cor: 'bg-red-500',
    subcategorias: [
      'Lei Orgânica',
      'Regulamentação da LAI',
      'Pautas das Sessões',
      'Atas das Sessões',
      'Decretos Legislativos',
      'Resoluções Vigentes',
      'Atos de Julgamentos',
      'Regime Jurídico',
      'Plano de Cargos',
      'Normativo sobre Diárias',
      'Relatório Controle Interno',
      'Projetos de Lei',
      'Bens Móveis',
      'Bens Imóveis',
      'Programas e Ações',
      'Projetos e Atividades',
      'Comissão Patrimônio',
      'Dispensa e Inexigibilidade',
      'Concursos/Processo Seletivo',
      'Relatório de Gestão ou Atividades',
      'Objetivos Estratégicos da Instituição',
      'Pautas das Comissões',
      'Lista de Votação Nominal',
      'Leis Municipais',
      'Regulamentação e Cotas Parlamentares'
    ]
  },
  {
    id: 'boas-praticas-de-transparencia-publica',
    nome: 'Boas Práticas de Transparência Pública',
    descricao: 'Recursos e informações de acessibilidade',
    icone: Shield,
    cor: 'bg-indigo-500',
    subcategorias: [
      'Mapa do Site',
      'Política de Privacidade',
      'Termos de Uso',
      'Acessibilidade'
    ]
  }
];

export default function AdminTransparenciaPage() {
  const [items, setItems] = useState<TransparenciaItem[]>([]);
  const [filtros, setFiltros] = useState<TransparenciaFiltros>({});
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('portal-da-transparencia');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TransparenciaItem | null>(null);
  const [formData, setFormData] = useState<Partial<TransparenciaItem>>({});

  const carregarItems = useCallback(() => {
    setLoading(true);
    let dados = transparenciaService.getAll().data;

    if (categoriaAtiva) {
      dados = transparenciaService.getByCategoria(categoriaAtiva);
    }

    if (filtros.subcategoria) {
      dados = dados.filter(item => item.subcategoria === filtros.subcategoria);
    }

    if (filtros.tipo) {
      dados = dados.filter(item => item.tipo === filtros.tipo);
    }

    if (filtros.ano) {
      dados = dados.filter(item => item.ano === filtros.ano);
    }

    if (filtros.busca) {
      dados = transparenciaService.search(filtros.busca);
    }

    setItems(dados);
    setLoading(false);
  }, [categoriaAtiva, filtros]);

  useEffect(() => {
    carregarItems();
  }, [carregarItems]);

  const handleFiltroChange = (campo: keyof TransparenciaFiltros, valor: string | number | undefined) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor === 'all' ? undefined : valor
    }));
  };

  const handleNovoItem = () => {
    setEditingItem(null);
    setFormData({
      categoria: categoriaAtiva,
      status: 'rascunho',
      dataPublicacao: new Date().toISOString().split('T')[0],
      ano: new Date().getFullYear(),
    });
    setShowForm(true);
  };

  const handleEditarItem = (item: TransparenciaItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSalvarItem = () => {
    // Aqui seria implementada a lógica de salvamento
    console.log('Salvando item:', formData);
    setShowForm(false);
    setFormData({});
    setEditingItem(null);
    carregarItems();
  };

  const handleExcluirItem = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      // Aqui seria implementada a lógica de exclusão
      console.log('Excluindo item:', id);
      carregarItems();
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'documento': return FileText;
      case 'relatorio': return FileText;
      case 'informacao': return Eye;
      case 'servico': return Users;
      case 'agenda': return Calendar;
      case 'lista': return FileText;
      default: return FileText;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'documento': return 'bg-blue-100 text-blue-800';
      case 'relatorio': return 'bg-green-100 text-green-800';
      case 'informacao': return 'bg-purple-100 text-purple-800';
      case 'servico': return 'bg-orange-100 text-orange-800';
      case 'agenda': return 'bg-red-100 text-red-800';
      case 'lista': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'publicado': return 'bg-green-100 text-green-800';
      case 'rascunho': return 'bg-yellow-100 text-yellow-800';
      case 'arquivado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const estatisticas = transparenciaService.getEstatisticas();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminBreadcrumbs />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Gestão da Transparência
              </h1>
              <p className="text-lg text-gray-600">
                Gerencie os itens do portal de transparência e mantenha as informações atualizadas.
              </p>
            </div>
            <Button onClick={handleNovoItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Itens</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Publicados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {items.filter(item => item.status === 'publicado').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rascunhos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {items.filter(item => item.status === 'rascunho').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categorias</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(estatisticas.porCategoria).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por título ou descrição..."
                    value={filtros.busca || ''}
                    onChange={(e) => handleFiltroChange('busca', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <Select
                  value={filtros.tipo || 'all'}
                  onValueChange={(value) => handleFiltroChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="relatorio">Relatório</SelectItem>
                    <SelectItem value="informacao">Informação</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="agenda">Agenda</SelectItem>
                    <SelectItem value="lista">Lista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select
                  value={filtros.status || 'all'}
                  onValueChange={(value) => handleFiltroChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setFiltros({})}
                  variant="outline"
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorias */}
        <Tabs value={categoriaAtiva} onValueChange={setCategoriaAtiva} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {categorias.map(categoria => {
              const Icone = categoria.icone;
              return (
                <TabsTrigger
                  key={categoria.id}
                  value={categoria.id}
                  className="flex flex-col items-center gap-2 p-4 h-auto"
                >
                  <Icone className="h-5 w-5" />
                  <span className="text-xs text-center">{categoria.nome}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categorias.map(categoria => (
            <TabsContent key={categoria.id} value={categoria.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${categoria.cor} text-white`}>
                      <categoria.icone className="h-6 w-6" />
                    </div>
                    {categoria.nome}
                  </CardTitle>
                  <CardDescription>{categoria.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Subcategorias */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Subcategorias:</h4>
                    <div className="flex flex-wrap gap-2">
                      {categoria.subcategorias.map(subcategoria => (
                        <Button
                          key={subcategoria}
                          variant={filtros.subcategoria === subcategoria ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFiltroChange('subcategoria', 
                            filtros.subcategoria === subcategoria ? undefined : subcategoria
                          )}
                        >
                          {subcategoria}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Itens */}
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando...</p>
                      </div>
                    ) : items.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum item encontrado para esta categoria.</p>
                      </div>
                    ) : (
                      items.map(item => {
                        const TipoIcon = getTipoIcon(item.tipo);
                        return (
                          <div
                            key={item.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <TipoIcon className="h-5 w-5 text-gray-600" />
                                  <h3 className="font-medium text-gray-900">
                                    {item.titulo}
                                  </h3>
                                  <Badge className={getTipoBadge(item.tipo)}>
                                    {item.tipo}
                                  </Badge>
                                  <Badge className={getStatusBadge(item.status)}>
                                    {item.status}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">
                                  {item.descricao}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatarData(item.dataPublicacao)}
                                  </span>
                                  <span>Ano: {item.ano}</span>
                                  <span>Subcategoria: {item.subcategoria}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(item.url, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Visualizar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditarItem(item)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExcluirItem(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Modal de Formulário */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Edite as informações do item de transparência.' : 'Adicione um novo item ao portal de transparência.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Digite o título do item"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="relatorio">Relatório</SelectItem>
                      <SelectItem value="informacao">Informação</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                      <SelectItem value="agenda">Agenda</SelectItem>
                      <SelectItem value="lista">Lista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Digite a descrição do item"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={formData.categoria || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(categoria => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategoria">Subcategoria *</Label>
                  <Input
                    id="subcategoria"
                    value={formData.subcategoria || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
                    placeholder="Digite a subcategoria"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataPublicacao">Data de Publicação *</Label>
                  <Input
                    id="dataPublicacao"
                    type="date"
                    value={formData.dataPublicacao || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataPublicacao: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="ano">Ano *</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                    placeholder="2024"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://exemplo.com/documento"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'rascunho'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarItem}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}