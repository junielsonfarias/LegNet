'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Título personalizado para o card de erro */
  title?: string
  /** Descrição personalizada */
  description?: string
  /** Se deve mostrar o botão de retry */
  showRetry?: boolean
  /** Callback quando o usuário clica em retry */
  onRetry?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Componente Error Boundary para capturar erros em componentes filhos
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   title="Erro no Painel"
 *   description="Não foi possível carregar o painel em tempo real"
 *   showRetry
 *   onRetry={() => window.location.reload()}
 * >
 *   <PainelComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    // Log para monitoramento
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {this.props.title || 'Ocorreu um erro'}
            </CardTitle>
            <CardDescription>
              {this.props.description || 'Algo deu errado ao carregar este componente.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-md bg-muted p-3 font-mono text-xs">
                <p className="font-semibold text-destructive">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 max-h-32 overflow-auto text-muted-foreground">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
          {this.props.showRetry && (
            <CardFooter>
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </CardFooter>
          )}
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Error Boundary específico para componentes SSE (Server-Sent Events)
 * Inclui tratamento especial para erros de conexão
 */
export class SSEErrorBoundary extends Component<
  ErrorBoundaryProps & { onReconnect?: () => void },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { onReconnect?: () => void }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    console.error('SSEErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  handleReconnect = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    this.props.onReconnect?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isConnectionError = this.state.error?.message.toLowerCase().includes('conexao') ||
        this.state.error?.message.toLowerCase().includes('connection') ||
        this.state.error?.message.toLowerCase().includes('sse')

      return (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              {this.props.title || (isConnectionError ? 'Conexão perdida' : 'Erro no painel')}
            </CardTitle>
            <CardDescription>
              {this.props.description || (
                isConnectionError
                  ? 'A conexão em tempo real foi interrompida. Clique para reconectar.'
                  : 'Ocorreu um erro ao processar os dados em tempo real.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="rounded-md bg-muted p-3 font-mono text-xs">
                <p className="font-semibold text-destructive">{this.state.error.message}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="default" onClick={this.handleReconnect}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconectar
            </Button>
            {this.props.showRetry && this.props.onRetry && (
              <Button variant="outline" onClick={this.props.onRetry}>
                Recarregar página
              </Button>
            )}
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
