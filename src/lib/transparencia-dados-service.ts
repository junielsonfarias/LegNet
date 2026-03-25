import { TransparenciaItem } from './types/transparencia';

// Dados de transparência - array vazio para instalação limpa
// Itens são gerenciados pelo painel administrativo em /admin/transparencia
const transparenciaData: TransparenciaItem[] = [];

export const transparenciaService = {
  getByCategoria: (categoria: string): TransparenciaItem[] => {
    return transparenciaData.filter(item => item.categoria === categoria);
  },

  getBySubcategoria: (categoria: string, subcategoria: string): TransparenciaItem[] => {
    return transparenciaData.filter(
      item => item.categoria === categoria && item.subcategoria === subcategoria
    );
  },

  getByAno: (ano: number): TransparenciaItem[] => {
    return transparenciaData.filter(item => item.ano === ano);
  },

  getByTipo: (tipo: string): TransparenciaItem[] => {
    return transparenciaData.filter(item => item.tipo === tipo);
  },

  search: (query: string): TransparenciaItem[] => {
    const searchTerm = query.toLowerCase();
    return transparenciaData.filter(
      item =>
        item.titulo.toLowerCase().includes(searchTerm) ||
        item.descricao.toLowerCase().includes(searchTerm) ||
        item.categoria.toLowerCase().includes(searchTerm) ||
        item.subcategoria.toLowerCase().includes(searchTerm)
    );
  },

  getCategorias: (): string[] => {
    return Array.from(new Set(transparenciaData.map(item => item.categoria)));
  },

  getSubcategorias: (categoria: string): string[] => {
    return Array.from(
      new Set(
        transparenciaData
          .filter(item => item.categoria === categoria)
          .map(item => item.subcategoria)
      )
    );
  },

  getAnos: (): number[] => {
    return Array.from(new Set(transparenciaData.map(item => item.ano))).sort(
      (a, b) => b - a
    );
  },

  getTipos: (): string[] => {
    return Array.from(new Set(transparenciaData.map(item => item.tipo)));
  },

  getById: (id: string): TransparenciaItem | undefined => {
    return transparenciaData.find(item => item.id === id);
  },

  getEstatisticas: () => {
    const total = transparenciaData.length;
    const porCategoria = transparenciaData.reduce((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const porTipo = transparenciaData.reduce((acc, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const porAno = transparenciaData.reduce((acc, item) => {
      acc[item.ano] = (acc[item.ano] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return { total, porCategoria, porTipo, porAno };
  },

  getAll: () => ({
    data: transparenciaData,
    categorias: Array.from(new Set(transparenciaData.map(item => item.categoria))),
    tipos: Array.from(new Set(transparenciaData.map(item => item.tipo))),
    anos: Array.from(new Set(transparenciaData.map(item => item.ano))).sort((a, b) => b - a),
    stats: {
      total: transparenciaData.length,
      publicados: transparenciaData.filter(item => item.status === 'publicado').length,
      rascunhos: transparenciaData.filter(item => item.status === 'rascunho').length,
      arquivados: transparenciaData.filter(item => item.status === 'arquivado').length
    }
  }),

  getRecentes: (limite: number = 10) => ({
    data: [...transparenciaData]
      .sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime())
      .slice(0, limite)
  }),

  getMaisAcessados: (limite: number = 10) => {
    const maisAcessados = [...transparenciaData]
      .sort((a, b) => {
        const pesoA = new Date(a.dataPublicacao).getTime() + (a.tipo === 'documento' ? 1000000 : 0)
        const pesoB = new Date(b.dataPublicacao).getTime() + (b.tipo === 'documento' ? 1000000 : 0)
        return pesoB - pesoA
      })
      .slice(0, limite)
    return { data: maisAcessados }
  },

  getPorSubcategoria: (categoria: string) => {
    const items = transparenciaData.filter(item => item.categoria === categoria)
    const subcategorias = Array.from(new Set(items.map(item => item.subcategoria)))
    return {
      data: items,
      subcategorias: subcategorias.map(subcategoria => ({
        nome: subcategoria,
        total: items.filter(item => item.subcategoria === subcategoria).length,
        publicados: items.filter(item => item.subcategoria === subcategoria && item.status === 'publicado').length
      }))
    }
  },

  getEstatisticasPorCategoria: () => {
    const categorias = Array.from(new Set(transparenciaData.map(item => item.categoria)))
    return categorias.map(categoria => {
      const items = transparenciaData.filter(item => item.categoria === categoria)
      return {
        categoria,
        total: items.length,
        publicados: items.filter(item => item.status === 'publicado').length,
        rascunhos: items.filter(item => item.status === 'rascunho').length,
        arquivados: items.filter(item => item.status === 'arquivado').length,
        ultimaAtualizacao: items.length > 0 ?
          Math.max(...items.map(item => new Date(item.dataPublicacao).getTime())) : 0
      }
    }).sort((a, b) => b.total - a.total)
  }
};
