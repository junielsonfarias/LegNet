/**
 * Parser CSV minimalista e robusto para os exports do Portal CR2 (Bubble).
 *
 * Por que não usar split(',')? Os CSVs do Bubble têm células com vírgulas,
 * aspas escapadas ("") e **quebras de linha embutidas** (ex.: biografia do
 * parlamentar em BBCode). Este parser respeita RFC 4180.
 *
 * Retorna um array de objetos { coluna: valor } usando a primeira linha como
 * cabeçalho. Valores sempre string (trim aplicado pelo chamador quando útil).
 */
import { readFileSync } from 'fs'

export function parseCsvString(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cur)
      cur = ''
      // Ignora linhas totalmente vazias
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      cur += c
    }
  }
  if (cur !== '' || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

export type CsvRecord = Record<string, string>

/** Lê um CSV de disco e retorna registros como objetos chaveados pelo header. */
export function readCsv(filePath: string): CsvRecord[] {
  const text = readFileSync(filePath, 'utf8')
  const rows = parseCsvString(text)
  if (rows.length === 0) return []
  const header = rows[0].map((h) => h.trim())
  const out: CsvRecord[] = []
  for (let r = 1; r < rows.length; r++) {
    const obj: CsvRecord = {}
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = (rows[r][c] ?? '').trim()
    }
    out.push(obj)
  }
  return out
}
