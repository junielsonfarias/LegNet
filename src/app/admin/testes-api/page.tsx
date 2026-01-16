'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TestTube,
  BarChart3,
  Zap,
  RefreshCw,
  Download
} from 'lucide-react'
import { 
  runAllTests, 
  runSpecificTests, 
  ApiTestRunner,
  TestResult,
  parlamentaresTestSuite,
  legislaturasTestSuite,
  sessoesTestSuite,
  participacaoCidadaTestSuite,
  validationTestSuite,
  performanceTestSuite
} from '@/lib/testing/api-tests'

export default function TestesApiPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<{
    total: number
    passed: number
    failed: number
    successRate: number
    averageDuration: number
  } | null>(null)
  const [selectedTests, setSelectedTests] = useState<string[]>([])

  const testSuites = [
    { name: 'Parlamentares', suite: parlamentaresTestSuite, color: 'bg-blue-500' },
    { name: 'Legislaturas', suite: legislaturasTestSuite, color: 'bg-green-500' },
    { name: 'Sessões', suite: sessoesTestSuite, color: 'bg-purple-500' },
    { name: 'Participação Cidadã', suite: participacaoCidadaTestSuite, color: 'bg-pink-500' },
    { name: 'Validação', suite: validationTestSuite, color: 'bg-yellow-500' },
    { name: 'Performance', suite: performanceTestSuite, color: 'bg-orange-500' }
  ]

  const runAllTestsHandler = async () => {
    setIsRunning(true)
    setResults([])
    setSummary(null)

    try {
      const { results: testResults, summary: testSummary } = await runAllTests()
      setResults(testResults)
      setSummary(testSummary)
    } catch (error) {
      console.error('Erro ao executar testes:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const runSelectedTestsHandler = async () => {
    if (selectedTests.length === 0) return

    setIsRunning(true)
    setResults([])
    setSummary(null)

    try {
      const testResults = await runSpecificTests(selectedTests)
      setResults(testResults)
      
      // Calcular summary
      const total = testResults.length
      const passed = testResults.filter(r => r.success).length
      const failed = total - passed
      const successRate = total > 0 ? (passed / total) * 100 : 0
      const averageDuration = total > 0 
        ? testResults.reduce((sum, r) => sum + r.duration, 0) / total 
        : 0

      setSummary({
        total,
        passed,
        failed,
        successRate,
        averageDuration
      })
    } catch (error) {
      console.error('Erro ao executar testes:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const toggleTestSelection = (testName: string) => {
    setSelectedTests(prev => 
      prev.includes(testName) 
        ? prev.filter(name => name !== testName)
        : [...prev, testName]
    )
  }

  const selectAllTests = () => {
    const allTestNames = testSuites.flatMap(suite => suite.suite.tests.map(test => test.name))
    setSelectedTests(allTestNames)
  }

  const clearSelection = () => {
    setSelectedTests([])
  }

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      summary,
      results
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-test-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <TestTube className="h-8 w-8 text-blue-600" />
          Testes da API
        </h1>
        <p className="text-gray-600">
          Execute testes automatizados para validar o funcionamento das APIs do sistema.
        </p>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Executar Testes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runAllTestsHandler} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? 'Executando...' : 'Executar Todos'}
              </Button>
              
              <Button 
                onClick={runSelectedTestsHandler} 
                disabled={isRunning || selectedTests.length === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Executar Selecionados ({selectedTests.length})
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={selectAllTests} 
                variant="outline" 
                size="sm"
              >
                Selecionar Todos
              </Button>
              <Button 
                onClick={clearSelection} 
                variant="outline" 
                size="sm"
              >
                Limpar Seleção
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total de Testes</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">
                      {summary.successRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <Progress value={summary.successRate} className="h-2" />
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-green-600 font-semibold">{summary.passed}</p>
                    <p className="text-xs text-gray-600">Aprovados</p>
                  </div>
                  <div>
                    <p className="text-red-600 font-semibold">{summary.failed}</p>
                    <p className="text-xs text-gray-600">Falharam</p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-semibold">
                      {summary.averageDuration.toFixed(0)}ms
                    </p>
                    <p className="text-xs text-gray-600">Tempo Médio</p>
                  </div>
                </div>

                {summary.failed > 0 && (
                  <Button 
                    onClick={exportResults} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Resultados
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Execute os testes para ver o resumo
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seleção de Testes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Selecionar Testes Específicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testSuites.map(({ name, suite, color }) => (
              <div key={name} className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`}></div>
                  {name}
                </h3>
                <div className="space-y-1">
                  {suite.tests.map((test) => (
                    <label key={test.name} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.name)}
                        onChange={() => toggleTestSelection(test.name)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{test.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados dos Testes</span>
              <Badge variant={summary && summary.successRate === 100 ? "default" : "destructive"}>
                {summary ? `${summary.successRate.toFixed(1)}%` : '0%'} Sucesso
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.success)}
                      <h4 className={`font-semibold ${getStatusColor(result.success)}`}>
                        {result.testName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {result.status && (
                        <Badge variant="outline">
                          Status: {result.status}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {result.duration}ms
                      </div>
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Erro:</span>
                      </div>
                      <p className="mt-1">{result.error}</p>
                    </div>
                  )}
                  
                  {result.response && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Ver resposta
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre os Testes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Informações sobre os Testes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Tipos de Teste</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• <strong>Funcionais:</strong> Validação de endpoints e dados</li>
                <li>• <strong>Validação:</strong> Teste de schemas e regras</li>
                <li>• <strong>Performance:</strong> Tempo de resposta</li>
                <li>• <strong>Integração:</strong> Fluxos completos</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Critérios de Sucesso</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Status HTTP correto</li>
                <li>• Schema de resposta válido</li>
                <li>• Tempo de resposta aceitável</li>
                <li>• Dados consistentes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
