import { z } from 'zod'

/**
 * Schema de validação para atualização de sessão
 */
export const UpdateSessaoSchema = z.object({
  numero: z.number().min(1).optional(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']).optional(),
  data: z.string().optional(),
  horario: z.string().optional(),
  local: z.string().optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA']).optional(),
  descricao: z.string().optional(),
  ata: z.string().optional(),
  finalizada: z.boolean().optional(),
  legislaturaId: z.string().optional(),
  periodoId: z.string().optional(),
  tempoInicio: z.string().nullable().optional(),
  tempoAcumulado: z.number().min(0).optional()
})

export type UpdateSessaoInput = z.infer<typeof UpdateSessaoSchema>

/**
 * Include padrão para buscar sessão com relacionamentos
 */
export const sessaoIncludeBasic = {
  legislatura: {
    select: {
      id: true,
      numero: true,
      anoInicio: true,
      anoFim: true
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
