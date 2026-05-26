/**
 * Catalogo de tipos de "atos" (documentos normativos e administrativos)
 * exibidos em /transparencia/atos/[tipo] e /transparencia/atos (indice).
 *
 * Atende ao criterio PNTP 2.6 ("Divulga atos normativos proprios?").
 *
 * Fontes:
 *  - publicacao            : modelo Publicacao filtrado por tipo
 *  - sessao-ata            : RN-170 - le de Sessao.arquivoAtaAssinada
 *  - sessao-pauta          : RN-171 - le de Sessao (pauta publicada)
 *  - reuniao-comissao-ata  : RN-172 - le de ReuniaoComissao (ata)
 *  - reuniao-comissao-pauta: RN-172 - le de ReuniaoComissao (pauta)
 *  - parecer-comissao      : RN-173 - le de Parecer
 *  - emenda                : RN-174 - le de Emenda
 *
 * Mantenha em sincronia com `src/app/transparencia/atos/[tipo]/page.tsx`.
 */

export type AtoTipoFonte =
  | 'publicacao'
  | 'sessao-ata'
  | 'sessao-pauta'
  | 'reuniao-comissao-ata'
  | 'reuniao-comissao-pauta'
  | 'parecer-comissao'
  | 'emenda'

export type AtoTipoConfig = {
  codigo: string
  titulo: string
  descricao: string
  /** Agrupamento visual no indice. */
  grupo: 'normativo' | 'sessao' | 'comissao' | 'proposicao'
  fonte?: AtoTipoFonte
}

export const ATOS_TIPOS_MAP: Record<string, AtoTipoConfig> = {
  // Normativos (administrativos)
  'portarias': {
    codigo: 'PORTARIA',
    titulo: 'Portarias',
    descricao: 'Portarias administrativas da Câmara Municipal.',
    grupo: 'normativo',
  },
  'decretos': {
    codigo: 'DECRETO',
    titulo: 'Decretos Legislativos',
    descricao: 'Decretos legislativos publicados.',
    grupo: 'normativo',
  },
  'resolucoes': {
    codigo: 'RESOLUCAO',
    titulo: 'Resoluções',
    descricao: 'Resoluções da Mesa Diretora e do Plenário.',
    grupo: 'normativo',
  },
  'atos-mesa': {
    codigo: 'ATO_MESA',
    titulo: 'Atos da Mesa Diretora',
    descricao: 'Atos normativos expedidos pela Mesa Diretora.',
    grupo: 'normativo',
  },
  'atos-presidencia': {
    codigo: 'ATO_PRESIDENCIA',
    titulo: 'Atos da Presidência',
    descricao: 'Atos expedidos pela Presidência da Câmara.',
    grupo: 'normativo',
  },
  'oficios': {
    codigo: 'OFICIO',
    titulo: 'Ofícios',
    descricao: 'Ofícios expedidos pela Câmara Municipal.',
    grupo: 'normativo',
  },
  'editais': {
    codigo: 'EDITAL',
    titulo: 'Editais',
    descricao: 'Editais publicados.',
    grupo: 'normativo',
  },
  'erratas': {
    codigo: 'ERRATA',
    titulo: 'Erratas',
    descricao: 'Correções e erratas de publicações anteriores.',
    grupo: 'normativo',
  },
  'convocacoes': {
    codigo: 'CONVOCACAO',
    titulo: 'Convocações',
    descricao: 'Convocações para sessões e atividades oficiais.',
    grupo: 'normativo',
  },
  'comunicados': {
    codigo: 'COMUNICADO',
    titulo: 'Comunicados',
    descricao: 'Comunicados oficiais da Câmara.',
    grupo: 'normativo',
  },
  'agendas': {
    codigo: 'AGENDA',
    titulo: 'Agendas',
    descricao: 'Agendas oficiais publicadas.',
    grupo: 'normativo',
  },
  // Sessoes (avulsas)
  'atas': {
    codigo: 'ATA_SESSAO',
    titulo: 'Atas de Sessão',
    descricao: 'Atas das sessões plenárias publicadas pela Câmara.',
    grupo: 'sessao',
    fonte: 'sessao-ata',
  },
  'pautas': {
    codigo: 'PAUTA_SESSAO',
    titulo: 'Pautas de Sessão',
    descricao: 'Pautas das sessões plenárias publicadas pela Câmara.',
    grupo: 'sessao',
    fonte: 'sessao-pauta',
  },
  // Comissoes (RN-172, RN-173)
  'atas-comissoes': {
    codigo: 'ATA_COMISSAO',
    titulo: 'Atas de Reuniões de Comissões',
    descricao: 'Atas das reuniões das comissões permanentes e temporárias.',
    grupo: 'comissao',
    fonte: 'reuniao-comissao-ata',
  },
  'pautas-comissoes': {
    codigo: 'PAUTA_COMISSAO',
    titulo: 'Pautas de Reuniões de Comissões',
    descricao: 'Pautas das reuniões das comissões permanentes e temporárias.',
    grupo: 'comissao',
    fonte: 'reuniao-comissao-pauta',
  },
  'pareceres-comissoes': {
    codigo: 'PARECER_COMISSAO',
    titulo: 'Pareceres de Comissões',
    descricao: 'Pareceres técnicos emitidos pelas comissões sobre proposições.',
    grupo: 'comissao',
    fonte: 'parecer-comissao',
  },
  // Proposicoes (RN-174)
  'emendas': {
    codigo: 'EMENDA',
    titulo: 'Emendas',
    descricao: 'Emendas apresentadas a proposições legislativas.',
    grupo: 'proposicao',
    fonte: 'emenda',
  },
}

/** Ordem de exibicao no indice e no sitemap. */
export const ATOS_TIPOS_ORDEM: ReadonlyArray<string> = [
  'portarias',
  'decretos',
  'resolucoes',
  'atos-mesa',
  'atos-presidencia',
  'oficios',
  'editais',
  'erratas',
  'convocacoes',
  'comunicados',
  'agendas',
  'atas',
  'pautas',
  'atas-comissoes',
  'pautas-comissoes',
  'pareceres-comissoes',
  'emendas',
]

export const GRUPO_LABEL: Record<AtoTipoConfig['grupo'], string> = {
  normativo: 'Atos Normativos e Administrativos',
  sessao: 'Sessões Plenárias',
  comissao: 'Comissões',
  proposicao: 'Proposições',
}
