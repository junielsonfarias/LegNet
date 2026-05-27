// @vitest-environment jsdom

import { vi } from "vitest"
/**
 * Testes de acessibilidade automatizados com jest-axe
 * Verifica conformidade WCAG 2.1 AA em componentes criticos
 */
import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Declarar matcher customizado para TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R
    }
  }
}

expect.extend(toHaveNoViolations)

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, unoptimized, ...rest } = props
    return React.createElement('img', rest)
  },
}))

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}))

// Mock hooks
vi.mock('@/lib/hooks/use-configuracao-institucional', () => ({
  useConfiguracaoInstitucional: () => ({
    nomeCasa: 'Câmara Municipal',
    sigla: 'CM',
    logoUrl: null,
  }),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

describe('Acessibilidade WCAG 2.1 AA', () => {
  describe('SkipLinks', () => {
    it('nao deve ter violacoes de acessibilidade', async () => {
      const { SkipLinks } = require('@/components/ui/skip-link')
      const { container } = render(React.createElement(SkipLinks))
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('deve ter role navigation e aria-label', () => {
      const { SkipLinks } = require('@/components/ui/skip-link')
      const { container } = render(React.createElement(SkipLinks))
      const nav = container.querySelector('[role="navigation"]')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBeTruthy()
    })
  })

  describe('Formulario de busca', () => {
    it('input com label acessivel nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('form', { role: 'search', 'aria-label': 'Buscar no portal' },
          React.createElement('label', { htmlFor: 'busca' }, 'Buscar'),
          React.createElement('input', { id: 'busca', type: 'search', placeholder: 'Digite sua busca' }),
          React.createElement('button', { type: 'submit' }, 'Pesquisar')
        )
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Tabela de dados', () => {
    it('tabela com caption e headers nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('table', null,
          React.createElement('caption', null, 'Lista de parlamentares'),
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', { scope: 'col' }, 'Nome'),
              React.createElement('th', { scope: 'col' }, 'Partido'),
              React.createElement('th', { scope: 'col' }, 'Status')
            )
          ),
          React.createElement('tbody', null,
            React.createElement('tr', null,
              React.createElement('td', null, 'Fulano'),
              React.createElement('td', null, 'PT'),
              React.createElement('td', null, 'Ativo')
            )
          )
        )
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Navegacao', () => {
    it('nav com aria-label nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('nav', { 'aria-label': 'Navegação principal' },
          React.createElement('ul', null,
            React.createElement('li', null,
              React.createElement('a', { href: '/' }, 'Início')
            ),
            React.createElement('li', null,
              React.createElement('a', { href: '/parlamentares' }, 'Parlamentares')
            ),
            React.createElement('li', null,
              React.createElement('a', { href: '/transparencia' }, 'Transparência')
            )
          )
        )
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Imagens', () => {
    it('imagem com alt descritivo nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('img', {
          src: '/foto.jpg',
          alt: 'Foto de João da Silva, Vereador',
          width: 80,
          height: 80,
        })
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('imagem decorativa com alt vazio nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('img', {
          src: '/decorativo.png',
          alt: '',
          role: 'presentation',
        })
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Botoes', () => {
    it('botao com texto acessivel nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('div', null,
          React.createElement('button', { type: 'button' }, 'Salvar'),
          React.createElement('button', { type: 'button', 'aria-label': 'Fechar modal' },
            React.createElement('span', { 'aria-hidden': 'true' }, '×')
          )
        )
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Landmarks', () => {
    it('pagina com landmarks corretos nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('div', null,
          React.createElement('header', { role: 'banner' },
            React.createElement('nav', { 'aria-label': 'Menu principal' },
              React.createElement('a', { href: '/' }, 'Início')
            )
          ),
          React.createElement('main', { id: 'main-content' },
            React.createElement('h1', null, 'Título da página'),
            React.createElement('p', null, 'Conteúdo')
          ),
          React.createElement('footer', { role: 'contentinfo' },
            React.createElement('p', null, '© 2026 Câmara Municipal')
          )
        )
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Formularios', () => {
    it('formulario com labels e fieldset nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('form', { 'aria-label': 'Cadastro' },
          React.createElement('fieldset', null,
            React.createElement('legend', null, 'Dados pessoais'),
            React.createElement('div', null,
              React.createElement('label', { htmlFor: 'nome' }, 'Nome completo'),
              React.createElement('input', { id: 'nome', type: 'text', required: true })
            ),
            React.createElement('div', null,
              React.createElement('label', { htmlFor: 'email' }, 'E-mail'),
              React.createElement('input', { id: 'email', type: 'email', required: true })
            )
          ),
          React.createElement('button', { type: 'submit' }, 'Enviar')
        )
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('select com label nao deve ter violacoes', async () => {
      const { container } = render(
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'filtro-tipo' }, 'Tipo'),
          React.createElement('select', { id: 'filtro-tipo' },
            React.createElement('option', { value: '' }, 'Todos'),
            React.createElement('option', { value: 'PL' }, 'Projeto de Lei'),
            React.createElement('option', { value: 'RQ' }, 'Requerimento')
          )
        )
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
