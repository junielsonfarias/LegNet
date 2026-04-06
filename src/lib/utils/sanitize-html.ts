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

  // No servidor, sanitização robusta sem DOM
  if (typeof window === 'undefined') {
    return dirty
      // Remove scripts (incluindo variações malformadas)
      .replace(/<script\b[^]*?<\/script\s*>/gi, '')
      .replace(/<script\b[^>]*\/?>/gi, '')
      // Remove event handlers (on*)
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      // Remove tags perigosas (iframe, object, embed, form, input, svg com scripts)
      .replace(/<\s*\/?\s*(iframe|object|embed|form|input|textarea|select|button|applet|meta|link|base)\b[^>]*\/?>/gi, '')
      // Remove SVG event handlers e scripts inline
      .replace(/<svg\b[^>]*\bon\w+\s*=/gi, '<svg ')
      // Remove javascript: e data: URLs em atributos
      .replace(/(href|src|action|formaction)\s*=\s*(?:"[^"]*(?:javascript|data|vbscript)\s*:[^"]*"|'[^']*(?:javascript|data|vbscript)\s*:[^']*')/gi, '')
      // Remove expressões CSS perigosas
      .replace(/expression\s*\(/gi, 'blocked(')
      .replace(/url\s*\(\s*(?:"[^"]*(?:javascript|data)\s*:[^"]*"|'[^']*(?:javascript|data)\s*:[^']*')/gi, 'url(about:blank')
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
      .replace(/<script\b[^]*?<\/script\s*>/gi, '')
      .replace(/<script\b[^>]*\/?>/gi, '')
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      .replace(/<\s*\/?\s*(object|embed|form|input|textarea|select|button|applet|meta|link|base)\b[^>]*\/?>/gi, '')
      .replace(/(href|src|action|formaction)\s*=\s*(?:"[^"]*(?:javascript|data|vbscript)\s*:[^"]*"|'[^']*(?:javascript|data|vbscript)\s*:[^']*')/gi, '')
  }

  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'src'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}
