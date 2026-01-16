'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Download, Calendar } from 'lucide-react';

interface LeiOrganica {
  id: string;
  numero: string;
  descricao: string;
  dataPublicacao: string;
  arquivo?: string;
}

// Dados mockados baseados no site oficial
const leisOrganicasMock: LeiOrganica[] = [
  {
    id: '1',
    numero: '003/2022',
    descricao: 'EMENDA Nº003/2022 SÚMULA: MODIFICA O § 2º DO ARTIGO 66 DA LEI ORGANICA DO MUNICÍPIO DE MOJUÍ DOS CAMPOS ESTADO DO PARÁ E DÁ OUTRAS PROVIDENCIAS.',
    dataPublicacao: '02/09/2022',
    arquivo: '/documentos/lei-organica-003-2022.pdf'
  },
  {
    id: '2',
    numero: '01/2013',
    descricao: 'DISPÕE SOBRE A LEI ORGÂNICA DO MUNICÍPIO DE MOJUÍ DOS CAMPOS E DÁ OUTRAS PROVIDÊNCIAS',
    dataPublicacao: '11/12/2013',
    arquivo: '/documentos/lei-organica-01-2013.pdf'
  }
];

export default function LeiOrganicaPage() {
  const [periodo, setPeriodo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numero, setNumero] = useState('');

  // Filtrar leis orgânicas
  const leisFiltradas = useMemo(() => {
    return leisOrganicasMock.filter(lei => {
      const matchesPeriodo = periodo === '' || lei.dataPublicacao.includes(periodo);
      const matchesDescricao = descricao === '' || 
        lei.descricao.toLowerCase().includes(descricao.toLowerCase());
      const matchesNumero = numero === '' || lei.numero.includes(numero);
      
      return matchesPeriodo && matchesDescricao && matchesNumero;
    });
  }, [periodo, descricao, numero]);

  const handleLimpar = () => {
    setPeriodo('');
    setDescricao('');
    setNumero('');
  };

  const handleExportar = () => {
    console.log('Exportando dados...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            LEI ORGÂNICA MUNICIPAL
          </h1>
        </div>

        {/* Campos para pesquisa */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Campos para pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 2022"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <Input
                  type="text"
                  placeholder="Digite a descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número
                </label>
                <Input
                  type="text"
                  placeholder="Digite o número"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 italic mb-4">
              Para usar as opções de filtro, escolha o campo para a pesquisa e clique no botão pesquisar
            </p>

            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleLimpar}
                variant="outline"
                className="flex items-center gap-2"
              >
                LIMPAR
              </Button>
              <Button 
                onClick={handleExportar}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                EXPORTAÇÃO
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contador de registros */}
        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-900">
            Foram encontradas {leisFiltradas.length} registros
          </p>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {leisFiltradas.length > 0 ? (
            leisFiltradas.map((lei) => (
              <Card key={lei.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          LEI ORGÂNICA MUNICIPAL
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-900">
                          <span className="font-semibold">LEI ORGÂNICA - {lei.numero}</span>
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {lei.descricao}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{lei.dataPublicacao}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Documento
                      </Button>
                      {lei.arquivo && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhum registro encontrado com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
