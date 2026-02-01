/**
 * Utilitário para sanitização de HTML
 * Previne ataques XSS ao renderizar HTML dinâmico
 */

import DOMPurify from 'dompurify'

/**
 * Sanitiza HTML para uso seguro com dangerouslySetInnerHTML
 * Remove scripts, event handlers e outros elementos perigosos
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''

  // No servidor, retorna string vazia (DOMPurify precisa do DOM)
  if (typeof window === 'undefined') {
    // Sanitização básica para SSR - remove tags script
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
      'mark', 'sub', 'sup', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'style'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}

/**
 * Sanitiza HTML preservando mais formatação (para conteúdo editorial)
 */
export function sanitizeRichHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''

  if (typeof window === 'undefined') {
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
  }

  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'src'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}
