/**
 * Servico de templates de parecer
 * Gera textos base para pareceres conforme tipo
 */

export type TipoParecer =
  | 'FAVORAVEL'
  | 'FAVORAVEL_COM_EMENDA'
  | 'CONTRARIO'
  | 'PELA_INCONSTITUCIONALIDADE'
  | 'PELA_ILEGALIDADE'
  | 'PELA_INEPCIA'
  | 'PELA_PREJUDICIALIDADE'
  | 'PELA_REJEICAO'
  | 'PELA_APROVACAO'

export interface DadosProposicao {
  tipo: string
  numero: number | string
  ano: number
  ementa?: string
  autorNome?: string
}

export interface DadosRelator {
  nome: string
  cargo?: string
}

export interface DadosComissao {
  nome: string
  sigla?: string
}

interface TemplateConfig {
  titulo: string
  introducao: string
  conclusao: string
  fundamentacao: string
}

const TEMPLATES: Record<TipoParecer, TemplateConfig> = {
  FAVORAVEL: {
    titulo: 'PARECER FAVORAVEL',
    introducao: 'Tendo analisado detidamente a proposicao em epigrafe, esta Comissao manifesta-se favoravelmente a sua aprovacao.',
    fundamentacao: 'A materia apresentada encontra-se em conformidade com a Lei Organica Municipal e o Regimento Interno desta Casa Legislativa. Do ponto de vista tecnico-juridico, nao ha obices a sua tramitacao regular.',
    conclusao: 'Ante o exposto, somos pela APROVACAO da materia, nos termos em que se encontra redigida.'
  },
  FAVORAVEL_COM_EMENDA: {
    titulo: 'PARECER FAVORAVEL COM EMENDA',
    introducao: 'Apos analise criteriosa da proposicao em questao, esta Comissao manifesta-se favoravelmente, propondo, contudo, emendas para seu aperfeicoamento.',
    fundamentacao: 'Embora a proposicao seja meritoria em sua essencia, identificamos aspectos que merecem ajustes para melhor atender ao interesse publico e a tecnica legislativa.',
    conclusao: 'Ante o exposto, somos pela APROVACAO da materia, com as emendas sugeridas em anexo.'
  },
  CONTRARIO: {
    titulo: 'PARECER CONTRARIO',
    introducao: 'Apos analise detalhada da proposicao em epigrafe, esta Comissao manifesta-se contrariamente a sua aprovacao.',
    fundamentacao: 'A materia apresentada, embora bem intencionada, apresenta aspectos que desaconselham sua aprovacao no atual momento, conforme fundamentacao a seguir exposta.',
    conclusao: 'Ante o exposto, somos pela REJEICAO da materia.'
  },
  PELA_INCONSTITUCIONALIDADE: {
    titulo: 'PARECER PELA INCONSTITUCIONALIDADE',
    introducao: 'A proposicao em analise apresenta vicio de constitucionalidade que impede sua regular tramitacao.',
    fundamentacao: 'Verificou-se que a materia afronta dispositivos da Constituicao Federal e/ou Estadual, configurando inconstitucionalidade material e/ou formal.',
    conclusao: 'Ante o exposto, somos pela declaracao de INCONSTITUCIONALIDADE da materia, com consequente ARQUIVAMENTO.'
  },
  PELA_ILEGALIDADE: {
    titulo: 'PARECER PELA ILEGALIDADE',
    introducao: 'A proposicao em tela apresenta vicio de legalidade que obsta seu prosseguimento.',
    fundamentacao: 'Constatou-se que a materia contraria legislacao federal, estadual ou municipal vigente, configurando ilegalidade.',
    conclusao: 'Ante o exposto, somos pela declaracao de ILEGALIDADE da materia, com consequente ARQUIVAMENTO.'
  },
  PELA_INEPCIA: {
    titulo: 'PARECER PELA INEPCIA',
    introducao: 'A proposicao apresentada nao reune os requisitos formais necessarios para sua regular tramitacao.',
    fundamentacao: 'Verificou-se que a materia carece de elementos essenciais a sua compreensao e/ou aplicabilidade, nao atendendo aos requisitos regimentais.',
    conclusao: 'Ante o exposto, somos pela declaracao de INEPCIA da materia, com consequente ARQUIVAMENTO ou DEVOLUCAO ao autor para correcoes.'
  },
  PELA_PREJUDICIALIDADE: {
    titulo: 'PARECER PELA PREJUDICIALIDADE',
    introducao: 'A proposicao em analise encontra-se prejudicada em virtude de fato superveniente.',
    fundamentacao: 'A materia perdeu seu objeto em razao de aprovacao de proposicao similar ou modificacao nas circunstancias faticas que motivaram sua apresentacao.',
    conclusao: 'Ante o exposto, somos pela declaracao de PREJUDICIALIDADE da materia, com consequente ARQUIVAMENTO.'
  },
  PELA_REJEICAO: {
    titulo: 'PARECER PELA REJEICAO',
    introducao: 'Apos criterioso exame, esta Comissao manifesta-se pela rejeicao da proposicao.',
    fundamentacao: 'A analise da materia revelou aspectos que desaconselham sua aprovacao, seja por questoes de merito, oportunidade ou conveniencia.',
    conclusao: 'Ante o exposto, somos pela REJEICAO da materia.'
  },
  PELA_APROVACAO: {
    titulo: 'PARECER PELA APROVACAO',
    introducao: 'Esta Comissao, apos analise da materia, manifesta-se pela sua aprovacao.',
    fundamentacao: 'A proposicao atende aos requisitos legais e regimentais, sendo meritoria e oportuna.',
    conclusao: 'Ante o exposto, somos pela APROVACAO da materia.'
  }
}

/**
 * Gera texto completo do parecer baseado no template
 */
export function gerarTextoParecer(
  tipo: TipoParecer,
  proposicao: DadosProposicao,
  relator: DadosRelator,
  comissao: DadosComissao
): string {
  const template = TEMPLATES[tipo]
  if (!template) {
    throw new Error(`Tipo de parecer invalido: ${tipo}`)
  }

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const siglaComissao = comissao.sigla ? `(${comissao.sigla})` : ''
  const cargoRelator = relator.cargo || 'Relator(a)'

  return `
${template.titulo}

COMISSAO: ${comissao.nome} ${siglaComissao}
MATERIA: ${proposicao.tipo} No ${proposicao.numero}/${proposicao.ano}
${proposicao.autorNome ? `AUTOR(A): ${proposicao.autorNome}` : ''}
${proposicao.ementa ? `EMENTA: ${proposicao.ementa}` : ''}

---

I - RELATORIO

${template.introducao}

II - FUNDAMENTACAO

${template.fundamentacao}

III - CONCLUSAO

${template.conclusao}

---

Sala das Comissoes, ${dataAtual}.

${relator.nome}
${cargoRelator}
`.trim()
}

/**
 * Retorna a lista de tipos de parecer disponiveis
 */
export function getTiposParecer(): { value: TipoParecer; label: string }[] {
  return [
    { value: 'FAVORAVEL', label: 'Favoravel' },
    { value: 'FAVORAVEL_COM_EMENDA', label: 'Favoravel com Emenda' },
    { value: 'CONTRARIO', label: 'Contrario' },
    { value: 'PELA_APROVACAO', label: 'Pela Aprovacao' },
    { value: 'PELA_REJEICAO', label: 'Pela Rejeicao' },
    { value: 'PELA_INCONSTITUCIONALIDADE', label: 'Pela Inconstitucionalidade' },
    { value: 'PELA_ILEGALIDADE', label: 'Pela Ilegalidade' },
    { value: 'PELA_INEPCIA', label: 'Pela Inepcia' },
    { value: 'PELA_PREJUDICIALIDADE', label: 'Pela Prejudicialidade' }
  ]
}

/**
 * Retorna o titulo do tipo de parecer
 */
export function getTituloParecer(tipo: TipoParecer): string {
  return TEMPLATES[tipo]?.titulo || tipo
}
