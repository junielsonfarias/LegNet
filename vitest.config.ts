import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Ambiente node por padrao; testes que precisam de DOM (react testing,
    // jest-axe) devem declarar `// @vitest-environment jsdom` no topo do
    // arquivo OU usar `environmentMatchGlobs` se houver muitos.
    environment: 'node',
    globals: true,
    // Inclui .ts e .tsx (componentes React e testes de a11y).
    include: [
      'src/__tests__/**/*.test.{ts,tsx}',
      'src/tests/**/*.test.{ts,tsx}',
    ],
    exclude: ['node_modules', '.next']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/app': path.resolve(__dirname, './src/app')
    }
  }
})
