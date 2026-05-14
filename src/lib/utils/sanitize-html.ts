/**
 * Utilitario para sanitizacao de HTML
 * Previne XSS ao renderizar HTML dinamico vindo de usuarios/integrações.
 *
 * F2.5 (PLANO-CORRECOES-MAIO-2026): trocado de DOMPurify (client-only) +
 * regex no servidor para `isomorphic-dompurify`, que roda DOMPurify tanto
 * no browser quanto no SSR via JSDOM. A versao regex era 90% segura no
 * happy path mas tinha bypass conhecidos com markup malformado. Agora ambos
 * os ambientes usam a mesma logica robusta.
 */

import DOMPurify from 'isomorphic-dompurify'

const COMMON_FORBID_TAGS = ['script', 'object', 'embed', 'form', 'input', 'applet', 'meta', 'link', 'base']
const COMMON_FORBID_ATTR = [
  'onerror',
  'onload',
  'onclick',
  'onmouseover',
  'onfocus',
  'onblur',
  'onchange',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'onsubmit',
]

/**
 * Sanitiza HTML para uso seguro com dangerouslySetInnerHTML.
 * Remove scripts, event handlers e elementos perigosos.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
      'mark', 'sub', 'sup', 'hr', 'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'style', 'src', 'alt', 'title', 'width', 'height'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [...COMMON_FORBID_TAGS, 'iframe', 'textarea', 'select', 'button'],
    FORBID_ATTR: COMMON_FORBID_ATTR,
  })
}

/**
 * Sanitiza HTML preservando mais formatacao (para conteudo editorial).
 *
 * F2.5: iframe foi REMOVIDO do allowlist por padrao. Para embedar videos
 * confiaveis (YouTube/Vimeo), use o componente `<VideoEmbed>` ou
 * `sanitizeRichHtmlWithVideo()` (allowlist explicita de hosts).
 */
export function sanitizeRichHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
      'span', 'div', 'mark', 'sub', 'sup', 'hr', 'img', 'figure', 'figcaption',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'src', 'alt', 'title', 'width', 'height',
      'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [...COMMON_FORBID_TAGS, 'iframe', 'textarea', 'select', 'button'],
    FORBID_ATTR: COMMON_FORBID_ATTR,
  })
}

const VIDEO_IFRAME_HOSTS = [
  'https://www.youtube.com/',
  'https://www.youtube-nocookie.com/',
  'https://player.vimeo.com/',
]

/**
 * Variante de sanitizeRichHtml que permite iframes APENAS de hosts confiaveis
 * (YouTube/Vimeo). Use quando o editor precise embedar videos institucionais.
 */
export function sanitizeRichHtmlWithVideo(dirty: string | null | undefined): string {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
      'span', 'div', 'mark', 'sub', 'sup', 'hr', 'img', 'figure', 'figcaption',
      'iframe',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'src', 'alt', 'title', 'width', 'height',
      'colspan', 'rowspan',
      'allow', 'allowfullscreen', 'frameborder', 'loading',
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [...COMMON_FORBID_TAGS, 'textarea', 'select', 'button'],
    FORBID_ATTR: COMMON_FORBID_ATTR,
    // Hook para bloquear iframe que nao seja de host whitelistado
    ADD_TAGS: ['iframe'],
  }).replace(/<iframe([^>]*?)src=["']([^"']+)["']([^>]*)>/gi, (match, before, src, after) => {
    const allowed = VIDEO_IFRAME_HOSTS.some((host) => src.startsWith(host))
    return allowed ? match : ''
  })
}
