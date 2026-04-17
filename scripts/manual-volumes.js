/**
 * Configuracao dos volumes do Manual do Servidor.
 *
 * Cada volume e um PDF independente focado em um modulo/perfil.
 * Capitulos 00-introducao e 01-primeiros-passos sao INCLUIDOS EM TODOS
 * os volumes (sao a base de onboarding de qualquer servidor).
 *
 * Para adicionar novo volume, basta adicionar uma entrada abaixo.
 */

const volumes = [
  {
    id: 'completo',
    nome: 'Manual Completo',
    descricao: 'Manual integral com todos os capitulos — referencia mestra',
    arquivo: 'manual-servidor-completo.pdf',
    capitulos: ['*'], // especial: inclui tudo
    publicoAlvo: 'Todos os servidores, biblioteca de referencia',
  },

  {
    id: 'geral',
    nome: 'Manual Geral — Primeiros Passos',
    descricao: 'Login, navegacao e perfil — onboarding basico',
    arquivo: 'manual-geral-primeiros-passos.pdf',
    capitulos: ['00-introducao', '01-primeiros-passos'],
    publicoAlvo: 'Qualquer servidor em seu primeiro acesso',
  },

  {
    id: 'legislativo',
    nome: 'Manual Legislativo',
    descricao: 'Protocolo, proposicoes, pareceres, comissoes — processo legislativo completo',
    arquivo: 'manual-legislativo.pdf',
    capitulos: [
      '00-introducao',
      '01-primeiros-passos',
      '02-protocolo',
      '03-proposicoes',
      '04-pareceres',
      '05-comissoes',
    ],
    publicoAlvo: 'Secretaria Legislativa, Auxiliar Legislativo, Editor',
  },

  {
    id: 'sessoes',
    nome: 'Manual de Sessoes',
    descricao: 'Sessoes, pauta, painel operador, votacoes em tempo real',
    arquivo: 'manual-sessoes.pdf',
    capitulos: [
      '00-introducao',
      '01-primeiros-passos',
      '06-sessoes',
      '07-painel-operador',
    ],
    publicoAlvo: 'Operador, Secretaria, Auxiliar Legislativo',
  },

  {
    id: 'transparencia',
    nome: 'Manual de Transparencia',
    descricao: 'Portal PNTP — despesas, contratos, folha, documentos oficiais',
    arquivo: 'manual-transparencia.pdf',
    capitulos: [
      '00-introducao',
      '01-primeiros-passos',
      '09-transparencia',
    ],
    publicoAlvo: 'Editor de transparencia, Administrador',
  },

  {
    id: 'admin',
    nome: 'Manual do Administrador',
    descricao: 'Configuracoes do sistema, usuarios, quorum, fluxos, auditoria',
    arquivo: 'manual-administrador.pdf',
    capitulos: [
      '00-introducao',
      '01-primeiros-passos',
      '13-configuracoes',
    ],
    publicoAlvo: 'Administrador',
  },

  // Volumes individuais por capitulo (uteis para revisao/iteracao)
  {
    id: 'cap-protocolo',
    nome: 'Capitulo 02 — Protocolo',
    descricao: 'Apenas o capitulo de Protocolo (para revisao)',
    arquivo: 'cap-02-protocolo.pdf',
    capitulos: ['02-protocolo'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
  {
    id: 'cap-proposicoes',
    nome: 'Capitulo 03 — Proposicoes',
    descricao: 'Apenas o capitulo de Proposicoes (para revisao)',
    arquivo: 'cap-03-proposicoes.pdf',
    capitulos: ['03-proposicoes'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
  {
    id: 'cap-pareceres',
    nome: 'Capitulo 04 — Pareceres',
    descricao: 'Apenas o capitulo de Pareceres (para revisao)',
    arquivo: 'cap-04-pareceres.pdf',
    capitulos: ['04-pareceres'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
  {
    id: 'cap-comissoes',
    nome: 'Capitulo 05 — Comissoes',
    descricao: 'Apenas o capitulo de Comissoes (para revisao)',
    arquivo: 'cap-05-comissoes.pdf',
    capitulos: ['05-comissoes'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
  {
    id: 'cap-sessoes',
    nome: 'Capitulo 06 — Sessoes',
    descricao: 'Apenas o capitulo de Sessoes (para revisao)',
    arquivo: 'cap-06-sessoes.pdf',
    capitulos: ['06-sessoes'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
  {
    id: 'cap-painel',
    nome: 'Capitulo 07 — Painel Operador',
    descricao: 'Apenas o capitulo de Painel Operador (para revisao)',
    arquivo: 'cap-07-painel-operador.pdf',
    capitulos: ['07-painel-operador'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
  {
    id: 'cap-transparencia',
    nome: 'Capitulo 09 — Transparencia',
    descricao: 'Apenas o capitulo de Transparencia (para revisao)',
    arquivo: 'cap-09-transparencia.pdf',
    capitulos: ['09-transparencia'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
  {
    id: 'cap-admin',
    nome: 'Capitulo 13 — Configuracoes Admin',
    descricao: 'Apenas o capitulo de Configuracoes (para revisao)',
    arquivo: 'cap-13-configuracoes.pdf',
    capitulos: ['13-configuracoes'],
    publicoAlvo: 'Revisao/edicao isolada',
  },
];

module.exports = { volumes };
