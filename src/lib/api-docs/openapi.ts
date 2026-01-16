// Documentação OpenAPI/Swagger para as APIs
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Gestão Legislativa - API',
    description: 'API para gestão de dados legislativos, parlamentares, sessões e participação cidadã',
    version: '1.0.0',
    contact: {
      name: 'Suporte Técnico',
      email: 'suporte@camaramojuic.pa.gov.br',
      url: 'https://camaramojuic.pa.gov.br'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desenvolvimento'
    },
    {
      url: 'https://api.camaramojuic.pa.gov.br',
      description: 'Servidor de produção'
    }
  ],
  tags: [
    {
      name: 'parlamentares',
      description: 'Gestão de parlamentares'
    },
    {
      name: 'legislaturas',
      description: 'Gestão de legislaturas'
    },
    {
      name: 'mesa-diretora',
      description: 'Gestão da mesa diretora'
    },
    {
      name: 'sessoes',
      description: 'Gestão de sessões legislativas'
    },
    {
      name: 'proposicoes',
      description: 'Gestão de proposições'
    },
    {
      name: 'participacao-cidada',
      description: 'Ferramentas de participação cidadã'
    },
    {
      name: 'configuracoes',
      description: 'Configurações do sistema'
    }
  ],
  paths: {
    '/parlamentares': {
      get: {
        tags: ['parlamentares'],
        summary: 'Listar parlamentares',
        description: 'Retorna uma lista paginada de parlamentares',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Número da página',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Quantidade de itens por página',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Termo de busca',
            schema: { type: 'string' }
          },
          {
            name: 'partido',
            in: 'query',
            description: 'Filtrar por partido',
            schema: { type: 'string' }
          },
          {
            name: 'legislatura',
            in: 'query',
            description: 'Filtrar por legislatura',
            schema: { type: 'string' }
          },
          {
            name: 'ativo',
            in: 'query',
            description: 'Filtrar por status ativo',
            schema: { type: 'boolean' }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de parlamentares retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Parlamentar' }
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 50 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 5 }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Parâmetros inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '500': {
            description: 'Erro interno do servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        tags: ['parlamentares'],
        summary: 'Criar novo parlamentar',
        description: 'Cria um novo parlamentar no sistema',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateParlamentar' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Parlamentar criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Parlamentar' },
                    message: { type: 'string', example: 'Parlamentar criado com sucesso' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Dados inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '409': {
            description: 'Conflito - Parlamentar já existe',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/parlamentares/{id}': {
      get: {
        tags: ['parlamentares'],
        summary: 'Buscar parlamentar por ID',
        description: 'Retorna os dados de um parlamentar específico',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID único do parlamentar',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Parlamentar encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Parlamentar' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Parlamentar não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['parlamentares'],
        summary: 'Atualizar parlamentar',
        description: 'Atualiza os dados de um parlamentar existente',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID único do parlamentar',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateParlamentar' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Parlamentar atualizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Parlamentar' },
                    message: { type: 'string', example: 'Parlamentar atualizado com sucesso' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Dados inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '404': {
            description: 'Parlamentar não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['parlamentares'],
        summary: 'Excluir parlamentar',
        description: 'Remove um parlamentar do sistema',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID único do parlamentar',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Parlamentar excluído com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Parlamentar excluído com sucesso' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Parlamentar não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/legislaturas': {
      get: {
        tags: ['legislaturas'],
        summary: 'Listar legislaturas',
        description: 'Retorna uma lista de legislaturas',
        responses: {
          '200': {
            description: 'Lista de legislaturas retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Legislatura' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/sessoes': {
      get: {
        tags: ['sessoes'],
        summary: 'Listar sessões legislativas',
        description: 'Retorna uma lista de sessões legislativas',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filtrar por status da sessão',
            schema: {
              type: 'string',
              enum: ['agendada', 'em_andamento', 'concluida', 'cancelada']
            }
          },
          {
            name: 'dataInicio',
            in: 'query',
            description: 'Data de início (YYYY-MM-DD)',
            schema: { type: 'string', format: 'date' }
          },
          {
            name: 'dataFim',
            in: 'query',
            description: 'Data de fim (YYYY-MM-DD)',
            schema: { type: 'string', format: 'date' }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de sessões retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SessaoLegislativa' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['sessoes'],
        summary: 'Criar nova sessão legislativa',
        description: 'Cria uma nova sessão legislativa',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SessaoLegislativa' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Sessão criada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SessaoLegislativa' },
                    message: { type: 'string', example: 'Sessão criada com sucesso' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/proposicoes': {
      get: {
        tags: ['proposicoes'],
        summary: 'Listar proposições',
        description: 'Retorna uma lista de proposições',
        parameters: [
          {
            name: 'tipo',
            in: 'query',
            description: 'Filtrar por tipo de proposição',
            schema: {
              type: 'string',
              enum: ['projeto_lei', 'projeto_resolucao', 'projeto_decreto', 'indicacao', 'requerimento']
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filtrar por status',
            schema: {
              type: 'string',
              enum: ['apresentada', 'em_tramitacao', 'aprovada', 'rejeitada', 'arquivada']
            }
          },
          {
            name: 'autor',
            in: 'query',
            description: 'Filtrar por autor',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de proposições retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Proposicao' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/participacao-cidada/consultas': {
      get: {
        tags: ['participacao-cidada'],
        summary: 'Listar consultas públicas',
        description: 'Retorna uma lista de consultas públicas ativas',
        responses: {
          '200': {
            description: 'Lista de consultas retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ConsultaPublica' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['participacao-cidada'],
        summary: 'Criar nova consulta pública',
        description: 'Cria uma nova consulta pública',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConsultaPublica' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Consulta criada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/ConsultaPublica' },
                    message: { type: 'string', example: 'Consulta criada com sucesso' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/participacao-cidada/sugestoes': {
      post: {
        tags: ['participacao-cidada'],
        summary: 'Enviar sugestão cidadã',
        description: 'Permite que cidadãos enviem sugestões',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SugestaoCidada' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Sugestão enviada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SugestaoCidada' },
                    message: { type: 'string', example: 'Sugestão enviada com sucesso' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Parlamentar: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'parl-001' },
          nome: { type: 'string', example: 'Francisco Pereira Pantoja' },
          apelido: { type: 'string', example: 'Pantoja do Cartório' },
          cargo: { 
            type: 'string', 
            enum: ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR'],
            example: 'PRESIDENTE'
          },
          partido: { type: 'string', example: 'MDB' },
          legislatura: { type: 'string', example: 'leg-2025-2028' },
          foto: { type: 'string', format: 'uri', example: 'https://example.com/foto.jpg' },
          email: { type: 'string', format: 'email', example: 'pantoja@camaramojuic.pa.gov.br' },
          telefone: { type: 'string', example: '(93) 99123-4567' },
          gabinete: { type: 'string', example: 'Gabinete 01' },
          telefoneGabinete: { type: 'string', example: '(93) 3530-1234' },
          biografia: { type: 'string', example: 'Biografia do parlamentar...' },
          redesSociais: {
            type: 'object',
            properties: {
              facebook: { type: 'string', format: 'uri' },
              instagram: { type: 'string', format: 'uri' },
              twitter: { type: 'string', format: 'uri' },
              linkedin: { type: 'string', format: 'uri' }
            }
          },
          ativo: { type: 'boolean', example: true }
        },
        required: ['id', 'nome', 'apelido', 'cargo', 'partido', 'legislatura']
      },
      CreateParlamentar: {
        type: 'object',
        properties: {
          nome: { type: 'string', example: 'Francisco Pereira Pantoja' },
          apelido: { type: 'string', example: 'Pantoja do Cartório' },
          cargo: { 
            type: 'string', 
            enum: ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR'],
            example: 'PRESIDENTE'
          },
          partido: { type: 'string', example: 'MDB' },
          legislatura: { type: 'string', example: 'leg-2025-2028' },
          foto: { type: 'string', format: 'uri' },
          email: { type: 'string', format: 'email' },
          telefone: { type: 'string' },
          gabinete: { type: 'string' },
          telefoneGabinete: { type: 'string' },
          biografia: { type: 'string' },
          redesSociais: {
            type: 'object',
            properties: {
              facebook: { type: 'string', format: 'uri' },
              instagram: { type: 'string', format: 'uri' },
              twitter: { type: 'string', format: 'uri' },
              linkedin: { type: 'string', format: 'uri' }
            }
          }
        },
        required: ['nome', 'apelido', 'cargo', 'partido', 'legislatura']
      },
      UpdateParlamentar: {
        type: 'object',
        properties: {
          nome: { type: 'string' },
          apelido: { type: 'string' },
          cargo: { 
            type: 'string', 
            enum: ['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']
          },
          partido: { type: 'string' },
          legislatura: { type: 'string' },
          foto: { type: 'string', format: 'uri' },
          email: { type: 'string', format: 'email' },
          telefone: { type: 'string' },
          gabinete: { type: 'string' },
          telefoneGabinete: { type: 'string' },
          biografia: { type: 'string' },
          redesSociais: {
            type: 'object',
            properties: {
              facebook: { type: 'string', format: 'uri' },
              instagram: { type: 'string', format: 'uri' },
              twitter: { type: 'string', format: 'uri' },
              linkedin: { type: 'string', format: 'uri' }
            }
          },
          ativo: { type: 'boolean' }
        }
      },
      Legislatura: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'leg-2025-2028' },
          numero: { type: 'string', example: '20ª' },
          periodoInicio: { type: 'string', format: 'date', example: '2025-01-01' },
          periodoFim: { type: 'string', format: 'date', example: '2028-12-31' },
          ano: { type: 'string', example: '2025-2028' },
          ativa: { type: 'boolean', example: true },
          periodosMesa: { type: 'integer', example: 4 }
        },
        required: ['id', 'numero', 'periodoInicio', 'periodoFim', 'ano']
      },
      SessaoLegislativa: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sess-001' },
          numero: { type: 'string', example: '001/2025' },
          tipo: { 
            type: 'string', 
            enum: ['ordinaria', 'extraordinaria', 'especial', 'solene'],
            example: 'ordinaria'
          },
          data: { type: 'string', format: 'date', example: '2025-01-15' },
          horarioInicio: { type: 'string', format: 'time', example: '09:00' },
          horarioFim: { type: 'string', format: 'time', example: '12:00' },
          status: { 
            type: 'string', 
            enum: ['agendada', 'em_andamento', 'concluida', 'cancelada'],
            example: 'agendada'
          },
          local: { type: 'string', example: 'Plenário da Câmara' },
          pauta: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                ordem: { type: 'integer', example: 1 },
                titulo: { type: 'string', example: 'Projeto de Lei 001/2025' },
                descricao: { type: 'string' },
                tipo: { type: 'string', example: 'Projeto de Lei' },
                autor: { type: 'string', example: 'Francisco Pantoja' }
              }
            }
          }
        },
        required: ['id', 'numero', 'tipo', 'data', 'horarioInicio', 'status', 'local']
      },
      Proposicao: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'prop-001' },
          numero: { type: 'string', example: '001/2025' },
          tipo: { 
            type: 'string', 
            enum: ['projeto_lei', 'projeto_resolucao', 'projeto_decreto', 'indicacao', 'requerimento'],
            example: 'projeto_lei'
          },
          titulo: { type: 'string', example: 'Projeto de Lei sobre...' },
          ementa: { type: 'string', example: 'Dispõe sobre...' },
          texto: { type: 'string', example: 'Texto completo da proposição...' },
          autor: { type: 'string', example: 'Francisco Pantoja' },
          dataApresentacao: { type: 'string', format: 'date', example: '2025-01-15' },
          status: { 
            type: 'string', 
            enum: ['apresentada', 'em_tramitacao', 'aprovada', 'rejeitada', 'arquivada'],
            example: 'apresentada'
          },
          anexos: {
            type: 'array',
            items: { type: 'string', format: 'uri' }
          },
          observacoes: { type: 'string' }
        },
        required: ['id', 'numero', 'tipo', 'titulo', 'ementa', 'texto', 'autor', 'dataApresentacao', 'status']
      },
      ConsultaPublica: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cons-001' },
          titulo: { type: 'string', example: 'Consulta sobre nova lei' },
          descricao: { type: 'string', example: 'Descrição da consulta...' },
          tipo: { 
            type: 'string', 
            enum: ['projeto_lei', 'politica_publica', 'orcamento', 'plano_diretor', 'outro'],
            example: 'projeto_lei'
          },
          categoria: { type: 'string', example: 'Educação' },
          dataInicio: { type: 'string', format: 'date', example: '2025-01-15' },
          dataFim: { type: 'string', format: 'date', example: '2025-02-15' },
          criadoPor: { type: 'string', example: 'admin' },
          configuracoes: {
            type: 'object',
            properties: {
              permiteAnonimo: { type: 'boolean', example: true },
              moderacao: { type: 'boolean', example: true },
              limiteCaracteres: { type: 'integer', example: 2000 },
              categoriasContribuicoes: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        },
        required: ['id', 'titulo', 'descricao', 'tipo', 'categoria', 'dataInicio', 'dataFim', 'criadoPor']
      },
      SugestaoCidada: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sug-001' },
          titulo: { type: 'string', example: 'Sugestão para melhoria' },
          descricao: { type: 'string', example: 'Descrição da sugestão...' },
          categoria: { 
            type: 'string', 
            enum: ['infraestrutura', 'educacao', 'saude', 'transporte', 'meio_ambiente', 'cultura', 'esporte', 'outro'],
            example: 'infraestrutura'
          },
          autorNome: { type: 'string', example: 'João Silva' },
          autorEmail: { type: 'string', format: 'email', example: 'joao@email.com' },
          autorTelefone: { type: 'string', example: '(93) 99123-4567' },
          autorEndereco: { type: 'string', example: 'Rua Exemplo, 123' },
          custoEstimado: {
            type: 'object',
            properties: {
              minimo: { type: 'number', example: 10000 },
              maximo: { type: 'number', example: 50000 },
              moeda: { type: 'string', example: 'BRL' }
            }
          },
          prazoEstimado: { type: 'string', example: '6 meses' },
          impacto: {
            type: 'object',
            properties: {
              beneficiarios: { type: 'integer', example: 1000 },
              area: { type: 'array', items: { type: 'string' } },
              tipo: { type: 'string', enum: ['positivo', 'negativo', 'neutro'], example: 'positivo' }
            }
          }
        },
        required: ['id', 'titulo', 'descricao', 'categoria', 'autorNome', 'autorEmail']
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Erro na operação' },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Campo obrigatório não informado']
          },
          code: { type: 'string', example: 'VALIDATION_ERROR' }
        },
        required: ['success', 'message']
      }
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ]
}

// Função para gerar documentação em diferentes formatos
export function generateApiDocs(format: 'json' | 'yaml' = 'json') {
  if (format === 'yaml') {
    // Aqui você poderia usar uma biblioteca como js-yaml para converter para YAML
    return openApiSpec
  }
  return openApiSpec
}

// Função para validar se uma requisição está de acordo com a documentação
export function validateAgainstOpenApi(
  method: string,
  path: string,
  body?: any,
  query?: Record<string, string>,
  params?: Record<string, string>
): { valid: boolean; errors?: string[] } {
  // Implementação simplificada - em produção, use uma biblioteca como swagger-parser
  const errors: string[] = []
  
  // Validações básicas baseadas na documentação
  if (method === 'POST' && path === '/parlamentares') {
    if (!body || !body.nome || !body.apelido || !body.cargo || !body.partido || !body.legislatura) {
      errors.push('Campos obrigatórios: nome, apelido, cargo, partido, legislatura')
    }
  }
  
  if (path.includes('{id}') && (!params || !params.id)) {
    errors.push('ID é obrigatório na URL')
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}
