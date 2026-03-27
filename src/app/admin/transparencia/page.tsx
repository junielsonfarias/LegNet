"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Edit, Trash2, Eye, Upload, Save, X,
  FileText, ExternalLink, Download, Loader2, CheckCircle,
  AlertCircle, Gavel, ScrollText, ClipboardList, BarChart3,
  BookOpen, File
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { toast } from "sonner";
import Link from "next/link";

const TIPOS_DOCUMENTO = [
  { value: "PORTARIA", label: "Portaria", icon: ClipboardList },
  { value: "DECRETO", label: "Decreto Legislativo", icon: Gavel },
  { value: "LEI", label: "Lei", icon: ScrollText },
  { value: "RESOLUCAO", label: "Resolucao", icon: FileText },
  { value: "RELATORIO", label: "Relatorio", icon: BarChart3 },
  { value: "INFORMATIVO", label: "Informativo", icon: BookOpen },
  { value: "OUTRO", label: "Outro", icon: File },
];

interface Publicacao {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  numero: string | null;
  ano: number;
  data: string;
  conteudo: string;
  arquivo: string | null;
  url: string | null;
  publicada: boolean;
  visualizacoes: number;
  autorNome: string;
  createdAt: string;
}

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

const tipoLabel = (tipo: string) => TIPOS_DOCUMENTO.find(t => t.value === tipo)?.label || tipo;

export default function TransparenciaAdminPage() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroAno, setFiltroAno] = useState<string>("all");

  // Formulario
  const [form, setForm] = useState({
    tipo: "PORTARIA",
    numero: "",
    ano: new Date().getFullYear(),
    data: new Date().toISOString().split("T")[0],
    descricao: "",
    conteudo: "",
    arquivo: "",
    url: "",
    publicada: true,
    autorNome: "Administrador",
  });

  const resetForm = () => {
    setForm({
      tipo: "PORTARIA",
      numero: "",
      ano: new Date().getFullYear(),
      data: new Date().toISOString().split("T")[0],
      descricao: "",
      conteudo: "",
      arquivo: "",
      url: "",
      publicada: true,
      autorNome: "Administrador",
    });
    setEditingId(null);
  };

  const gerarTitulo = () => {
    const tipoInfo = TIPOS_DOCUMENTO.find(t => t.value === form.tipo);
    const label = tipoInfo?.label || form.tipo;
    if (form.numero) {
      return `${label} No ${form.numero}/${form.ano}`;
    }
    return `${label} - ${form.ano}`;
  };

  // Carregar publicacoes
  const fetchPublicacoes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filtroTipo !== "all") params.set("tipo", filtroTipo);
      if (filtroAno !== "all") params.set("ano", filtroAno);
      if (filtroBusca) params.set("search", filtroBusca);

      const res = await fetch(`/api/publicacoes?${params}`);
      const data = await res.json();
      if (data.success) {
        setPublicacoes(data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar publicacoes:", err);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroAno, filtroBusca]);

  useEffect(() => {
    fetchPublicacoes();
  }, [fetchPublicacoes]);

  // Upload de arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (max 10MB)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "transparencia");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setForm(prev => ({ ...prev, arquivo: data.url, url: "" }));
        toast.success("Arquivo enviado");
      } else {
        toast.error(data.error || "Erro no upload");
      }
    } catch {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  // Salvar (criar ou editar)
  const handleSalvar = async () => {
    if (!form.descricao.trim()) {
      toast.error("Informe a ementa/descricao do documento");
      return;
    }

    setSaving(true);
    try {
      const titulo = gerarTitulo();
      const payload = {
        titulo,
        descricao: form.descricao,
        tipo: form.tipo,
        numero: form.numero || null,
        ano: form.ano,
        data: form.data,
        conteudo: form.conteudo || form.descricao,
        arquivo: form.arquivo || null,
        url: form.url || null,
        publicada: form.publicada,
        autorNome: form.autorNome || "Administrador",
        autorTipo: "ORGAO",
      };

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/publicacoes/${editingId}` : "/api/publicacoes";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Documento atualizado" : "Documento publicado");
        setDialogOpen(false);
        resetForm();
        fetchPublicacoes();
      } else {
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar documento");
    } finally {
      setSaving(false);
    }
  };

  // Editar
  const handleEditar = (pub: Publicacao) => {
    setEditingId(pub.id);
    setForm({
      tipo: pub.tipo,
      numero: pub.numero || "",
      ano: pub.ano,
      data: pub.data?.split("T")[0] || new Date().toISOString().split("T")[0],
      descricao: pub.descricao || "",
      conteudo: pub.conteudo || "",
      arquivo: pub.arquivo || "",
      url: (pub as any).url || "",
      publicada: pub.publicada,
      autorNome: pub.autorNome || "Administrador",
    });
    setDialogOpen(true);
  };

  // Excluir
  const handleExcluir = async (id: string) => {
    if (!confirm("Deseja excluir este documento?")) return;
    try {
      const res = await fetch(`/api/publicacoes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Documento excluido");
        fetchPublicacoes();
      } else {
        toast.error(data.error || "Erro ao excluir");
      }
    } catch {
      toast.error("Erro ao excluir documento");
    }
  };

  // Toggle publicacao
  const handleTogglePublicada = async (pub: Publicacao) => {
    try {
      const res = await fetch(`/api/publicacoes/${pub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicada: !pub.publicada }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(pub.publicada ? "Despublicado" : "Publicado");
        fetchPublicacoes();
      }
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  // Stats
  const stats = {
    total: publicacoes.length,
    publicados: publicacoes.filter(p => p.publicada).length,
    rascunhos: publicacoes.filter(p => !p.publicada).length,
    comArquivo: publicacoes.filter(p => p.arquivo || (p as any).url).length,
  };

  const anos = [...new Set(publicacoes.map(p => p.ano))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: "Transparencia - Publicacao de Documentos" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Publicacao de Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publique portarias, decretos, leis e outros documentos para o Portal da Transparencia
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.publicados}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rascunhos}</p>
                <p className="text-xs text-muted-foreground">Rascunhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Download className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.comArquivo}</p>
                <p className="text-xs text-muted-foreground">Com Arquivo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por titulo, numero ou descricao..."
                className="pl-10"
                value={filtroBusca}
                onChange={e => setFiltroBusca(e.target.value)}
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TIPOS_DOCUMENTO.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroAno} onValueChange={setFiltroAno}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {anos.map(a => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Documentos ({publicacoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : publicacoes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum documento encontrado</p>
              <Button className="mt-4" onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Publicar primeiro documento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">No</th>
                    <th className="pb-3 font-medium">Ementa</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Arquivo</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {publicacoes.map(pub => (
                    <tr key={pub.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {tipoLabel(pub.tipo)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-2 whitespace-nowrap font-mono text-xs">
                        {pub.numero ? `${pub.numero}/${pub.ano}` : pub.ano}
                      </td>
                      <td className="py-3 pr-2 max-w-xs truncate" title={pub.descricao || pub.titulo}>
                        {pub.descricao || pub.titulo}
                      </td>
                      <td className="py-3 pr-2 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(pub.data)}
                      </td>
                      <td className="py-3 pr-2">
                        {pub.arquivo ? (
                          <a href={pub.arquivo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                            <Download className="h-3 w-3" /> PDF
                          </a>
                        ) : (pub as any).url ? (
                          <a href={(pub as any).url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Link
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-2">
                        <button onClick={() => handleTogglePublicada(pub)} className="cursor-pointer">
                          <Badge variant={pub.publicada ? "default" : "secondary"} className="text-xs">
                            {pub.publicada ? "Publicado" : "Rascunho"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditar(pub)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleExcluir(pub.id)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Documento" : "Publicar Novo Documento"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo + Numero + Ano */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Numero</Label>
                <Input
                  placeholder="001"
                  value={form.numero}
                  onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                />
              </div>
              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={form.ano}
                  onChange={e => setForm(f => ({ ...f, ano: parseInt(e.target.value) || new Date().getFullYear() }))}
                />
              </div>
            </div>

            {/* Preview do titulo */}
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Titulo gerado:</p>
              <p className="font-semibold text-sm">{gerarTitulo()}</p>
            </div>

            {/* Data */}
            <div>
              <Label>Data de Publicacao</Label>
              <Input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              />
            </div>

            {/* Ementa */}
            <div>
              <Label>Ementa / Descricao *</Label>
              <Textarea
                placeholder="Descreva o conteudo do documento..."
                rows={3}
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            {/* Conteudo completo (opcional) */}
            <div>
              <Label>Texto completo (opcional)</Label>
              <Textarea
                placeholder="Texto integral do documento (opcional se tiver arquivo)"
                rows={4}
                value={form.conteudo}
                onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
              />
            </div>

            {/* Arquivo ou URL */}
            <div className="space-y-3">
              <Label>Arquivo ou Link Externo</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Upload de arquivo (PDF, max 10MB)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="text-xs"
                    />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  {form.arquivo && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Arquivo enviado</span>
                      <button onClick={() => setForm(f => ({ ...f, arquivo: "" }))} className="text-red-500 hover:text-red-700">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* URL externa */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Ou link externo (Google Drive, etc.)</p>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value, arquivo: e.target.value ? "" : f.arquivo }))}
                    disabled={!!form.arquivo}
                  />
                  {form.url && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <ExternalLink className="h-3 w-3" />
                      <span>Link configurado</span>
                      <button onClick={() => setForm(f => ({ ...f, url: "" }))} className="text-red-500 hover:text-red-700">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <Label>Status:</Label>
              <Button
                type="button"
                variant={form.publicada ? "default" : "secondary"}
                size="sm"
                onClick={() => setForm(f => ({ ...f, publicada: !f.publicada }))}
              >
                {form.publicada ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Publicado</>
                ) : (
                  <><AlertCircle className="h-4 w-4 mr-1" /> Rascunho</>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                {form.publicada ? "Visivel no portal" : "Salvo mas nao visivel"}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> {editingId ? "Atualizar" : "Publicar"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
