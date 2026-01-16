'use client'

import { useEffect } from 'react'

export function ConsoleSuppressor() {
  useEffect(() => {
    // Suprimir warnings específicos de desenvolvimento
    const originalError = console.error
    const originalLog = console.log
    const originalWarn = console.warn
    const originalInfo = console.info

    // Função para verificar se deve suprimir a mensagem
    const shouldSuppress = (message: any) => {
      if (typeof message === 'string') {
        return (
          message.includes('Extra attributes from the server') ||
          message.includes('Warning: Extra attributes') ||
          message.includes('data-new-gr-c-s-check-loaded') ||
          message.includes('data-gr-ext-installed') ||
          message.includes('cz-shortcut-listen') ||
          message.includes('warnForExtraAttributes') ||
          message.includes('Download the React DevTools') ||
          message.includes('Fast Refresh') ||
          message.includes('rebuilding') ||
          message.includes('done in') ||
          message.includes('class,style') ||
          message.includes('hydration') ||
          message.includes('Prop `className` did not match') ||
          message.includes('Server: "__className_') ||
          message.includes('Client: "__className_') ||
          message.includes('window.console.error') ||
          message.includes('console.error') ||
          message.includes('hydration-error-info.ts') ||
          message.includes('app-index.tsx') ||
          message === 'false' ||
          message === 'undefined' ||
          message === '{}' ||
          message.includes('89ab11b9ffc8d1e5416de675cd8f2997811d0a3c7989c8bb863b64f48f8d67b8608f8fb137a27ed860c229384e0ca724bbf8e2ade2f75ca17c8dec12cb6bf7ea')
        )
      }
      
      // Verificar também se é um array com mensagens específicas
      if (Array.isArray(message)) {
        return message.some((msg: any) => 
          typeof msg === 'string' && (
            msg.includes('Extra attributes from the server') ||
            msg.includes('Warning: Extra attributes') ||
            msg.includes('Fast Refresh') ||
            msg.includes('class,style') ||
            msg.includes('hydration') ||
            msg.includes('Prop `className` did not match') ||
            msg.includes('Server: "__className_') ||
            msg.includes('Client: "__className_') ||
            msg.includes('window.console.error') ||
            msg.includes('console.error') ||
            msg.includes('hydration-error-info.ts') ||
            msg.includes('app-index.tsx')
          )
        )
      }
      
      return false
    }

    // Função genérica para suprimir mensagens
    const suppressMessage = (...args: any[]) => {
      // Verificar se qualquer argumento deve ser suprimido
      for (const arg of args) {
        if (shouldSuppress(arg)) {
          return
        }
      }
      return args
    }

    // Suprimir console.error
    console.error = (...args: any[]) => {
      const filteredArgs = suppressMessage(...args)
      if (filteredArgs) {
        originalError.apply(console, filteredArgs)
      }
    }

    // Suprimir console.log - MAS PERMITIR LOGS COM EMOJIS DE DEBUG
    console.log = (...args: any[]) => {
      // Permitir logs de debug (com emojis específicos)
      if (args.some(arg => typeof arg === 'string' && (
        arg.includes('🚀') || arg.includes('✅') || arg.includes('❌') || 
        arg.includes('📤') || arg.includes('📥') || arg.includes('🔄') ||
        arg.includes('➕') || arg.includes('📊') || arg.includes('📋') ||
        arg.includes('🔍') || arg.includes('🔨') || arg.includes('⚠️') ||
        arg.includes('📝') || arg.includes('👁️') || arg.includes('🖱️')
      ))) {
        originalLog.apply(console, args)
        return
      }
      const filteredArgs = suppressMessage(...args)
      if (filteredArgs) {
        originalLog.apply(console, filteredArgs)
      }
    }

    // Suprimir console.warn
    console.warn = (...args: any[]) => {
      const filteredArgs = suppressMessage(...args)
      if (filteredArgs) {
        originalWarn.apply(console, filteredArgs)
      }
    }

    // Suprimir console.info
    console.info = (...args: any[]) => {
      const filteredArgs = suppressMessage(...args)
      if (filteredArgs) {
        originalInfo.apply(console, filteredArgs)
      }
    }

    // Suprimir também mensagens específicas do React
    const originalConsole = { ...console }
    
    // Interceptar todas as chamadas de console
    const interceptConsole = (method: keyof Console) => {
      const original = console[method] as any
      ;(console as any)[method] = (...args: any[]) => {
        if (shouldSuppress(args[0])) {
          return
        }
        original.apply(console, args)
      }
    }

    // Aplicar interceptação a todos os métodos
    ;(['error', 'warn', 'log', 'info', 'debug'] as (keyof Console)[]).forEach(interceptConsole)

    // Cleanup function
    return () => {
      console.error = originalError
      console.log = originalLog
      console.warn = originalWarn
      console.info = originalInfo
    }
  }, [])

  return null // Este componente não renderiza nada
}
