export interface Comissao {
  id: string;
  nome: string;
  descricao: string;
  membros: { parlamentarId: string; cargo: string }[];
  ativa: boolean;
  dataInicio: string;
  dataFim?: string;
  legislaturaId: string;
}

const comissoesData: Comissao[] = [
  {
    id: '1',
    nome: 'Comissão de Constituição e Justiça',
    descricao: 'Comissão responsável pela análise de questões constitucionais e jurídicas',
    membros: [
      { parlamentarId: '1', cargo: 'Presidente' },
      { parlamentarId: '2', cargo: 'Vice-Presidente' },
      { parlamentarId: '3', cargo: 'Membro' },
    ],
    ativa: true,
    dataInicio: '2021-01-01',
    dataFim: '2024-12-31',
    legislaturaId: 'leg-2021-2024',
  },
  {
    id: '2',
    nome: 'Comissão de Finanças e Orçamento',
    descricao: 'Comissão responsável pela análise de questões financeiras e orçamentárias',
    membros: [
      { parlamentarId: '4', cargo: 'Presidente' },
      { parlamentarId: '5', cargo: 'Vice-Presidente' },
      { parlamentarId: '1', cargo: 'Membro' },
    ],
    ativa: true,
    dataInicio: '2021-01-01',
    dataFim: '2024-12-31',
    legislaturaId: 'leg-2021-2024',
  },
  {
    id: '3',
    nome: 'Comissão de Educação e Cultura',
    descricao: 'Comissão responsável pela análise de questões educacionais e culturais',
    membros: [
      { parlamentarId: '6', cargo: 'Presidente' },
      { parlamentarId: '7', cargo: 'Vice-Presidente' },
      { parlamentarId: '2', cargo: 'Membro' },
    ],
    ativa: false,
    dataInicio: '2021-01-01',
    dataFim: '2022-12-31',
    legislaturaId: 'leg-2021-2024',
  },
  {
    id: '4',
    nome: 'Comissão de Saúde e Bem-Estar Social',
    descricao: 'Comissão responsável pela análise de questões de saúde e assistência social',
    membros: [
      { parlamentarId: '8', cargo: 'Presidente' },
      { parlamentarId: '9', cargo: 'Vice-Presidente' },
      { parlamentarId: '3', cargo: 'Membro' },
    ],
    ativa: true,
    dataInicio: '2021-01-01',
    dataFim: '2024-12-31',
    legislaturaId: 'leg-2021-2024',
  },
  {
    id: '5',
    nome: 'Comissão de Meio Ambiente e Desenvolvimento Sustentável',
    descricao: 'Comissão responsável pela análise de questões ambientais e de desenvolvimento sustentável',
    membros: [
      { parlamentarId: '10', cargo: 'Presidente' },
      { parlamentarId: '1', cargo: 'Vice-Presidente' },
      { parlamentarId: '4', cargo: 'Membro' },
    ],
    ativa: true,
    dataInicio: '2021-01-01',
    dataFim: '2024-12-31',
    legislaturaId: 'leg-2021-2024',
  },
]

export const comissoesService = {
  getAll: (): Comissao[] => {
    return comissoesData
  },
  getById: (id: string): Comissao | undefined => {
    return comissoesData.find(comissao => comissao.id === id)
  },
  getByLegislatura: (legislaturaId: string): Comissao[] => {
    return comissoesData.filter(comissao => comissao.legislaturaId === legislaturaId)
  },
  getAtivas: (): Comissao[] => {
    return comissoesData.filter(comissao => comissao.ativa)
  },
  create: (novaComissao: Omit<Comissao, 'id'>): Comissao => {
    const comissao: Comissao = {
      ...novaComissao,
      id: `comissao-${Date.now()}`,
    }
    comissoesData.push(comissao)
    return comissao
  },
  update: (comissaoAtualizada: Comissao): Comissao => {
    const index = comissoesData.findIndex(comissao => comissao.id === comissaoAtualizada.id)
    if (index !== -1) {
      comissoesData[index] = comissaoAtualizada
      return comissaoAtualizada
    }
    throw new Error('Comissão não encontrada')
  },
  delete: (id: string): void => {
    const index = comissoesData.findIndex(comissao => comissao.id === id)
    if (index !== -1) {
      comissoesData.splice(index, 1)
    } else {
      throw new Error('Comissão não encontrada')
    }
  },
}
