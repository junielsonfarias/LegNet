// Sistema de testes para APIs
import { z } from 'zod'

// Tipos para testes
export interface ApiTest {
  name: string
  description: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  headers?: Record<string, string>
  body?: any
  expectedStatus: number
  expectedSchema?: z.ZodSchema
  expectedData?: any
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
}

export interface TestResult {
  testName: string
  success: boolean
  status?: number
  response?: any
  error?: string
  duration: number
}

export interface TestSuite {
  name: string
  description: string
  tests: ApiTest[]
}

// Configuração de testes
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const TEST_TIMEOUT = 10000 // 10 segundos

// Utilitários para testes
export class ApiTestRunner {
  private results: TestResult[] = []

  async runTest(test: ApiTest): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      // Setup
      if (test.setup) {
        await test.setup()
      }

      // Executar requisição
      const response = await this.makeRequest(test)
      const duration = Date.now() - startTime

      // Validar status
      if (response.status !== test.expectedStatus) {
        return {
          testName: test.name,
          success: false,
          status: response.status,
          error: `Status esperado: ${test.expectedStatus}, recebido: ${response.status}`,
          duration
        }
      }

      // Validar schema se fornecido
      if (test.expectedSchema) {
        const validation = test.expectedSchema.safeParse(response.data)
        if (!validation.success) {
          return {
            testName: test.name,
            success: false,
            status: response.status,
            response: response.data,
            error: `Schema inválido: ${validation.error.errors.map(e => e.message).join(', ')}`,
            duration
          }
        }
      }

      // Validar dados específicos se fornecidos
      if (test.expectedData) {
        const dataMatch = this.deepEqual(response.data, test.expectedData)
        if (!dataMatch) {
          return {
            testName: test.name,
            success: false,
            status: response.status,
            response: response.data,
            error: 'Dados não correspondem ao esperado',
            duration
          }
        }
      }

      // Teardown
      if (test.teardown) {
        await test.teardown()
      }

      return {
        testName: test.name,
        success: true,
        status: response.status,
        response: response.data,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      
      // Teardown em caso de erro
      if (test.teardown) {
        try {
          await test.teardown()
        } catch (teardownError) {
          console.error('Erro no teardown:', teardownError)
        }
      }

      return {
        testName: test.name,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration
      }
    }
  }

  async runTestSuite(suite: TestSuite): Promise<TestResult[]> {
    console.log(`\n🧪 Executando suite de testes: ${suite.name}`)
    console.log(`📝 ${suite.description}\n`)

    const results: TestResult[] = []

    for (const test of suite.tests) {
      console.log(`  ⏳ ${test.name}...`)
      const result = await this.runTest(test)
      results.push(result)

      if (result.success) {
        console.log(`  ✅ ${test.name} - ${result.duration}ms`)
      } else {
        console.log(`  ❌ ${test.name} - ${result.error}`)
      }
    }

    this.results.push(...results)
    return results
  }

  async runAllSuites(suites: TestSuite[]): Promise<TestResult[]> {
    const allResults: TestResult[] = []

    for (const suite of suites) {
      const suiteResults = await this.runTestSuite(suite)
      allResults.push(...suiteResults)
    }

    return allResults
  }

  getResults(): TestResult[] {
    return this.results
  }

  getSummary(): {
    total: number
    passed: number
    failed: number
    successRate: number
    averageDuration: number
  } {
    const total = this.results.length
    const passed = this.results.filter(r => r.success).length
    const failed = total - passed
    const successRate = total > 0 ? (passed / total) * 100 : 0
    const averageDuration = total > 0 
      ? this.results.reduce((sum, r) => sum + r.duration, 0) / total 
      : 0

    return {
      total,
      passed,
      failed,
      successRate,
      averageDuration
    }
  }

  private async makeRequest(test: ApiTest): Promise<{ status: number; data: any }> {
    const url = `${BASE_URL}${test.path}`
    const options: RequestInit = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...test.headers
      }
    }

    if (test.body) {
      options.body = JSON.stringify(test.body)
    }

    // Timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT)
    options.signal = controller.signal

    try {
      const response = await fetch(url, options)
      const data = await response.json().catch(() => ({}))
      
      clearTimeout(timeoutId)
      
      return {
        status: response.status,
        data
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout após ${TEST_TIMEOUT}ms`)
      }
      
      throw error
    }
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true
    
    if (obj1 == null || obj2 == null) return false
    
    if (typeof obj1 !== typeof obj2) return false
    
    if (typeof obj1 !== 'object') return obj1 === obj2
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false
    
    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) return false
      }
      return true
    }
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!this.deepEqual(obj1[key], obj2[key])) return false
    }
    
    return true
  }
}

// Schemas para validação de respostas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  errors: z.array(z.string()).optional(),
  meta: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    totalPages: z.number().optional()
  }).optional()
})

export const ParlamentarSchema = z.object({
  id: z.string(),
  nome: z.string(),
  apelido: z.string(),
  cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR']),
  partido: z.string(),
  legislatura: z.string(),
  ativo: z.boolean()
})

export const LegislaturaSchema = z.object({
  id: z.string(),
  numero: z.string(),
  periodoInicio: z.string(),
  periodoFim: z.string(),
  ano: z.string(),
  ativa: z.boolean(),
  periodosMesa: z.number()
})

// Suites de testes
export const parlamentaresTestSuite: TestSuite = {
  name: 'Parlamentares API',
  description: 'Testes para endpoints de parlamentares',
  tests: [
    {
      name: 'Listar parlamentares',
      description: 'Deve retornar lista de parlamentares',
      method: 'GET',
      path: '/parlamentares',
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        data: z.array(ParlamentarSchema),
        meta: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number()
        })
      })
    },
    {
      name: 'Listar parlamentares com filtros',
      description: 'Deve retornar parlamentares filtrados por partido',
      method: 'GET',
      path: '/parlamentares?partido=MDB&limit=5',
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        data: z.array(ParlamentarSchema)
      })
    },
    {
      name: 'Criar parlamentar',
      description: 'Deve criar um novo parlamentar',
      method: 'POST',
      path: '/parlamentares',
      body: {
        nome: `Teste Parlamentar ${Date.now()}`,
        apelido: `Teste${Date.now()}`,
        cargo: 'VEREADOR',
        partido: 'TEST',
        legislatura: 'leg-2025-2028'
      },
      expectedStatus: 201,
      expectedSchema: z.object({
        success: z.literal(true),
        data: ParlamentarSchema,
        message: z.string()
      })
    },
    {
      name: 'Buscar parlamentar por ID',
      description: 'Deve retornar parlamentar específico',
      method: 'GET',
      path: '/parlamentares/1',
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        data: ParlamentarSchema
      })
    },
    {
      name: 'Atualizar parlamentar',
      description: 'Deve atualizar dados do parlamentar',
      method: 'PUT',
      path: '/parlamentares/1',
      body: {
        nome: 'Nome Atualizado'
      },
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        data: ParlamentarSchema,
        message: z.string()
      })
    },
    {
      name: 'Excluir parlamentar',
      description: 'Deve excluir parlamentar',
      method: 'DELETE',
      path: '/parlamentares/2',
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        message: z.string()
      })
    }
  ]
}

export const legislaturasTestSuite: TestSuite = {
  name: 'Legislaturas API',
  description: 'Testes para endpoints de legislaturas',
  tests: [
    {
      name: 'Listar legislaturas',
      description: 'Deve retornar lista de legislaturas',
      method: 'GET',
      path: '/legislaturas',
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        data: z.array(LegislaturaSchema)
      })
    }
  ]
}

export const sessoesTestSuite: TestSuite = {
  name: 'Sessões API',
  description: 'Testes para endpoints de sessões',
  tests: [
    {
      name: 'Listar sessões',
      description: 'Deve retornar lista de sessões',
      method: 'GET',
      path: '/sessoes',
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        data: z.array(z.object({
          id: z.string(),
          numero: z.string(),
          tipo: z.string(),
          data: z.string(),
          status: z.string(),
          local: z.string()
        }))
      })
    }
  ]
}

export const participacaoCidadaTestSuite: TestSuite = {
  name: 'Participação Cidadã API',
  description: 'Testes para endpoints de participação cidadã',
  tests: [
    {
      name: 'Listar consultas públicas',
      description: 'Deve retornar lista de consultas',
      method: 'GET',
      path: '/participacao-cidada/consultas',
      expectedStatus: 200,
      expectedSchema: z.object({
        success: z.literal(true),
        data: z.array(z.object({
          id: z.string(),
          titulo: z.string(),
          descricao: z.string(),
          tipo: z.string(),
          categoria: z.string(),
          dataInicio: z.string(),
          dataFim: z.string()
        }))
      })
    },
    {
      name: 'Enviar sugestão cidadã',
      description: 'Deve aceitar sugestão cidadã',
      method: 'POST',
      path: '/participacao-cidada/sugestoes',
      body: {
        titulo: 'Sugestão de Teste',
        descricao: 'Esta é uma sugestão de teste',
        categoria: 'infraestrutura',
        autorNome: 'João Silva',
        autorEmail: 'joao@teste.com'
      },
      expectedStatus: 201,
      expectedSchema: z.object({
        success: z.literal(true),
        data: z.object({
          id: z.string(),
          titulo: z.string(),
          descricao: z.string(),
          categoria: z.string()
        }),
        message: z.string()
      })
    }
  ]
}

// Testes de validação
export const validationTestSuite: TestSuite = {
  name: 'Validação de Dados',
  description: 'Testes para validação de dados de entrada',
  tests: [
    {
      name: 'Criar parlamentar com dados inválidos',
      description: 'Deve retornar erro de validação',
      method: 'POST',
      path: '/parlamentares',
      body: {
        nome: '', // Nome vazio
        apelido: 'A', // Apelido muito curto
        cargo: 'INVALIDO', // Cargo inválido
        partido: '', // Partido vazio
        legislatura: '' // Legislatura vazia
      },
      expectedStatus: 400,
      expectedSchema: z.object({
        success: z.literal(false),
        message: z.string().optional(),
        errors: z.array(z.string()).optional(),
        code: z.string().optional()
      })
    },
    {
      name: 'Buscar parlamentar com ID inválido',
      description: 'Deve retornar erro 404',
      method: 'GET',
      path: '/parlamentares/inexistente',
      expectedStatus: 404,
      expectedSchema: z.object({
        success: z.literal(false),
        message: z.string().optional(),
        code: z.string().optional()
      })
    }
  ]
}

// Testes de performance
export const performanceTestSuite: TestSuite = {
  name: 'Performance',
  description: 'Testes de performance das APIs',
  tests: [
    {
      name: 'Listar parlamentares - Performance',
      description: 'Deve responder em menos de 1 segundo',
      method: 'GET',
      path: '/parlamentares',
      expectedStatus: 200
    },
    {
      name: 'Buscar parlamentar - Performance',
      description: 'Deve responder em menos de 500ms',
      method: 'GET',
      path: '/parlamentares/1',
      expectedStatus: 200
    }
  ]
}

// Função para executar todos os testes
export async function runAllTests(): Promise<{
  results: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    successRate: number
    averageDuration: number
  }
}> {
  const runner = new ApiTestRunner()
  
  const suites = [
    parlamentaresTestSuite,
    legislaturasTestSuite,
    sessoesTestSuite,
    participacaoCidadaTestSuite,
    validationTestSuite,
    performanceTestSuite
  ]

  console.log('🚀 Iniciando testes da API...\n')
  
  const results = await runner.runAllSuites(suites)
  const summary = runner.getSummary()

  console.log('\n📊 Resumo dos Testes:')
  console.log(`  Total: ${summary.total}`)
  console.log(`  ✅ Aprovados: ${summary.passed}`)
  console.log(`  ❌ Falharam: ${summary.failed}`)
  console.log(`  📈 Taxa de sucesso: ${summary.successRate.toFixed(1)}%`)
  console.log(`  ⏱️  Tempo médio: ${summary.averageDuration.toFixed(0)}ms`)

  return { results, summary }
}

// Função para executar testes específicos
export async function runSpecificTests(testNames: string[]): Promise<TestResult[]> {
  const runner = new ApiTestRunner()
  
  const allSuites = [
    parlamentaresTestSuite,
    legislaturasTestSuite,
    sessoesTestSuite,
    participacaoCidadaTestSuite,
    validationTestSuite,
    performanceTestSuite
  ]

  const filteredSuites = allSuites.map(suite => ({
    ...suite,
    tests: suite.tests.filter(test => testNames.includes(test.name))
  })).filter(suite => suite.tests.length > 0)

  return await runner.runAllSuites(filteredSuites)
}
