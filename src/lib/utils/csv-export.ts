/**
 * Helper compartilhado para exportacao CSV nas rotas de dados abertos.
 * Formato: separador ';' (padrao brasileiro), aspas duplas em valores com ';'.
 */

export function convertToCSV(
  data: Record<string, unknown>[],
  campos: string[]
): string {
  const header = campos.join(';')
  const rows = data.map((item) =>
    campos
      .map((campo) => {
        const valor = item[campo]
        if (valor === null || valor === undefined) return ''
        if (typeof valor === 'string' && valor.includes(';')) {
          return `"${valor}"`
        }
        return String(valor)
      })
      .join(';')
  )
  return [header, ...rows].join('\n')
}
