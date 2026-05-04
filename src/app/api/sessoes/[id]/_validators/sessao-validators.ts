import { z } from 'zod'

/**
 * Schema de validação para atualização de sessão
 */
export const UpdateSessaoSchema = z.object({
  numero: z.number().min(1).nullish().transform(v => v ?? undefined),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']).nullish().transform(v => v ?? undefined),
  data: z.string().nullish().transform(v => v ?? undefined),
  horario: z.string().nullish().transform(v => v ?? undefined),
  local: z.string().nullish().transform(v => v ?? undefined),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA']).nullish().transform(v => v ?? undefined),
  descricao: z.string().nullish().transform(v => v ?? undefined),
  ata: z.string().nullish().transform(v => v ?? undefined),
  arquivoAta: z.string().nullable().optional(),
  arquivoAtaAssinada: z.string().nullable().optional(),
  dataPublicacaoAta: z.string().nullable().optional(),
  statusAta: z.enum(['PENDENTE', 'APROVADA', 'REJEITADA']).nullable().optional(),
  urlTransmissao: z.string().nullable().optional(),
  urlVideo: z.string().nullable().optional(),
  urlAudio: z.string().nullable().optional(),
  finalizada: z.boolean().nullish().transform(v => v ?? undefined),
  legislaturaId: z.string().nullish().transform(v => v ?? undefined),
  periodoId: z.string().nullish().transform(v => v ?? undefined),
  tempoInicio: z.string().nullable().optional(),
  tempoAcumulado: z.number().min(0).nullish().transform(v => v ?? undefined)
})

export type UpdateSessaoInput = z.infer<typeof UpdateSessaoSchema>

/**
 * Include padrão para buscar sessão com relacionamentos
 */
export const sessaoIncludeBasic = {
  legislatura: {
    include: {
      mandatos: {
        where: { ativo: true },
        select: {
          id: true,
          parlamentarId: true,
          ativo: true,
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              partido: true,
              foto: true,
              ativo: true
            }
          }
        }
      }
    }
  },
  periodo: {
    select: {
      id: true,
      numero: true,
      dataInicio: true,
      dataFim: true
    }
  }
}

/**
 * Include completo para GET de sessão
 */
export const sessaoIncludeFull = {
  ...sessaoIncludeBasic,
  pautaSessao: {
    include: {
      itemAtual: {
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              tipo: true,
              status: true
            }
          }
        }
      },
      itens: {
        orderBy: { ordem: 'asc' as const },
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              ementa: true,
              tipo: true,
              status: true,
              autor: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true,
                  partido: true
                }
              },
              votacoes: {
                include: {
                  parlamentar: {
                    select: {
                      id: true,
                      nome: true,
                      apelido: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  proposicoes: {
    include: {
      autor: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    },
    orderBy: {
      dataApresentacao: 'desc' as const
    }
  },
  presencas: {
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    }
  }
}

/**
 * Include leve para painel do operador (sem votacoes individuais)
 * Reduz payload em ~70% comparado ao sessaoIncludeFull
 */
export const sessaoIncludeOperator = {
  ...sessaoIncludeBasic,
  pautaSessao: {
    include: {
      itemAtual: {
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              tipo: true,
              status: true
            }
          }
        }
      },
      itens: {
        orderBy: { ordem: 'asc' as const },
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              ementa: true,
              tipo: true,
              status: true,
              autor: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true,
                  partido: true
                }
              }
              // SEM votacoes individuais - usa contagem no frontend
            }
          }
        }
      }
    }
  },
  // SEM proposicoes duplicadas (já estão em pautaSessao.itens)
  presencas: {
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          foto: true
        }
      }
    }
  }
}

/**
 * Include para resposta de UPDATE
 */
export const sessaoIncludeUpdate = {
  ...sessaoIncludeBasic,
  pautaSessao: {
    include: {
      itens: {
        orderBy: { ordem: 'asc' as const },
        include: {
          proposicao: {
            select: {
              id: true,
              numero: true,
              ano: true,
              titulo: true,
              tipo: true,
              status: true
            }
          }
        }
      }
    }
  }
}
