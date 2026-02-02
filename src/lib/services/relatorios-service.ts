/**
 * Serviço de Geração de Relatórios em PDF e Excel
 * Suporta exportação de dados legislativos em múltiplos formatos
 */

// Import dinâmico do ExcelJS para reduzir bundle size (~23MB)
// O módulo só é carregado quando uma função de exportação é chamada
async function getExcelJS() {
  const ExcelJS = (await import('exceljs')).default
  return ExcelJS
}

// Tipos para os relatórios
export interface RelatorioParlamentar {
  id: string
  nome: string
  apelido: string | null
  cargo: string
  partido: string | null
  email: string | null
  telefone: string | null
  ativo: boolean
  totalProposicoes?: number
  totalPresencas?: number
  percentualPresenca?: number
}

export interface RelatorioSessao {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  status: string
  totalPresentes?: number
  totalAusentes?: number
  totalItens?: number
}

export interface RelatorioProposicao {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  status: string
  autor: string
  dataApresentacao: string
  resultado?: string | null
}

export interface RelatorioVotacao {
  proposicao: string
  sessao: string
  data: string
  resultado: string
  votosSim: number
  votosNao: number
  abstencoes: number
  ausentes: number
}

export interface RelatorioPresenca {
  parlamentar: string
  partido: string | null
  totalSessoes: number
  presencas: number
  ausencias: number
  justificadas: number
  percentual: number
}

// Configurações de estilo para Excel
const excelStyles = {
  header: {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1E3A8A' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  },
  title: {
    font: { bold: true, size: 16, color: { argb: 'FF1E3A8A' } },
    alignment: { horizontal: 'center' as const }
  },
  subtitle: {
    font: { bold: true, size: 12, color: { argb: 'FF666666' } },
    alignment: { horizontal: 'center' as const }
  },
  cell: {
    border: {
      top: { style: 'thin' as const, color: { argb: 'FFE5E5E5' } },
      left: { style: 'thin' as const, color: { argb: 'FFE5E5E5' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFE5E5E5' } },
      right: { style: 'thin' as const, color: { argb: 'FFE5E5E5' } }
    },
    alignment: { vertical: 'middle' as const }
  }
}

/**
 * Gera relatório de parlamentares em Excel
 */
export async function gerarRelatorioExcelParlamentares(
  parlamentares: RelatorioParlamentar[],
  titulo: string = 'Relatório de Parlamentares'
): Promise<Buffer> {
  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Legislativo - Câmara Municipal'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Parlamentares')

  // Título
  sheet.mergeCells('A1:H1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = titulo
  titleCell.style = excelStyles.title
  titleCell.alignment = { horizontal: 'center' }

  // Subtítulo com data
  sheet.mergeCells('A2:H2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`
  subtitleCell.style = excelStyles.subtitle

  // Espaço
  sheet.addRow([])

  // Cabeçalhos
  const headers = ['Nome', 'Apelido', 'Cargo', 'Partido', 'Email', 'Telefone', 'Status', 'Proposições']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.style = excelStyles.header
  })

  // Dados
  parlamentares.forEach(p => {
    const row = sheet.addRow([
      p.nome,
      p.apelido || '-',
      p.cargo,
      p.partido || '-',
      p.email || '-',
      p.telefone || '-',
      p.ativo ? 'Ativo' : 'Inativo',
      p.totalProposicoes || 0
    ])
    row.eachCell((cell) => {
      cell.style = excelStyles.cell
    })
  })

  // Ajustar largura das colunas
  sheet.columns.forEach((column, index) => {
    const widths = [30, 20, 20, 15, 30, 20, 12, 15]
    column.width = widths[index] || 15
  })

  // Linha de totais
  sheet.addRow([])
  const totalRow = sheet.addRow(['Total de Parlamentares:', parlamentares.length])
  totalRow.getCell(1).font = { bold: true }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

/**
 * Gera relatório de sessões em Excel
 */
export async function gerarRelatorioExcelSessoes(
  sessoes: RelatorioSessao[],
  titulo: string = 'Relatório de Sessões'
): Promise<Buffer> {
  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Legislativo - Câmara Municipal'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Sessões')

  // Título
  sheet.mergeCells('A1:H1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = titulo
  titleCell.style = excelStyles.title

  // Subtítulo
  sheet.mergeCells('A2:H2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`
  subtitleCell.style = excelStyles.subtitle

  sheet.addRow([])

  // Cabeçalhos
  const headers = ['Número', 'Tipo', 'Data', 'Horário', 'Status', 'Presentes', 'Ausentes', 'Itens na Pauta']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.style = excelStyles.header
  })

  // Dados
  sessoes.forEach(s => {
    const row = sheet.addRow([
      s.numero,
      s.tipo,
      new Date(s.data).toLocaleDateString('pt-BR'),
      s.horario || '-',
      s.status,
      s.totalPresentes || 0,
      s.totalAusentes || 0,
      s.totalItens || 0
    ])
    row.eachCell((cell) => {
      cell.style = excelStyles.cell
    })
  })

  // Ajustar colunas
  sheet.columns.forEach((column, index) => {
    const widths = [12, 18, 15, 12, 18, 15, 15, 18]
    column.width = widths[index] || 15
  })

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

/**
 * Gera relatório de proposições em Excel
 */
export async function gerarRelatorioExcelProposicoes(
  proposicoes: RelatorioProposicao[],
  titulo: string = 'Relatório de Proposições'
): Promise<Buffer> {
  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Legislativo - Câmara Municipal'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Proposições')

  // Título
  sheet.mergeCells('A1:H1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = titulo
  titleCell.style = excelStyles.title

  // Subtítulo
  sheet.mergeCells('A2:H2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`
  subtitleCell.style = excelStyles.subtitle

  sheet.addRow([])

  // Cabeçalhos
  const headers = ['Número/Ano', 'Tipo', 'Título', 'Autor', 'Data Apresentação', 'Status', 'Resultado']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.style = excelStyles.header
  })

  // Dados
  proposicoes.forEach(p => {
    const row = sheet.addRow([
      `${p.numero}/${p.ano}`,
      p.tipo.replace(/_/g, ' '),
      p.titulo,
      p.autor,
      new Date(p.dataApresentacao).toLocaleDateString('pt-BR'),
      p.status.replace(/_/g, ' '),
      p.resultado || '-'
    ])
    row.eachCell((cell) => {
      cell.style = excelStyles.cell
    })
  })

  // Ajustar colunas
  sheet.columns.forEach((column, index) => {
    const widths = [15, 20, 40, 25, 18, 18, 15]
    column.width = widths[index] || 15
  })

  // Estatísticas
  sheet.addRow([])
  sheet.addRow(['ESTATÍSTICAS'])
  const stats = {
    total: proposicoes.length,
    aprovadas: proposicoes.filter(p => p.status === 'APROVADA').length,
    rejeitadas: proposicoes.filter(p => p.status === 'REJEITADA').length,
    emTramitacao: proposicoes.filter(p => p.status === 'EM_TRAMITACAO').length
  }
  sheet.addRow(['Total:', stats.total])
  sheet.addRow(['Aprovadas:', stats.aprovadas])
  sheet.addRow(['Rejeitadas:', stats.rejeitadas])
  sheet.addRow(['Em Tramitação:', stats.emTramitacao])

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

/**
 * Gera relatório de presença em Excel
 */
export async function gerarRelatorioExcelPresenca(
  presencas: RelatorioPresenca[],
  titulo: string = 'Relatório de Presença'
): Promise<Buffer> {
  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Legislativo - Câmara Municipal'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Presença')

  // Título
  sheet.mergeCells('A1:G1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = titulo
  titleCell.style = excelStyles.title

  // Subtítulo
  sheet.mergeCells('A2:G2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`
  subtitleCell.style = excelStyles.subtitle

  sheet.addRow([])

  // Cabeçalhos
  const headers = ['Parlamentar', 'Partido', 'Total Sessões', 'Presenças', 'Ausências', 'Justificadas', '% Presença']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.style = excelStyles.header
  })

  // Dados ordenados por percentual de presença (decrescente)
  const presencasOrdenadas = [...presencas].sort((a, b) => b.percentual - a.percentual)

  presencasOrdenadas.forEach(p => {
    const row = sheet.addRow([
      p.parlamentar,
      p.partido || '-',
      p.totalSessoes,
      p.presencas,
      p.ausencias,
      p.justificadas,
      `${p.percentual.toFixed(1)}%`
    ])
    row.eachCell((cell, colNumber) => {
      cell.style = excelStyles.cell
      // Colorir percentual baseado no valor
      if (colNumber === 7) {
        if (p.percentual >= 80) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }
        } else if (p.percentual >= 50) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } }
        }
      }
    })
  })

  // Ajustar colunas
  sheet.columns.forEach((column, index) => {
    const widths = [30, 15, 15, 15, 15, 15, 15]
    column.width = widths[index] || 15
  })

  // Média geral
  sheet.addRow([])
  const mediaGeral = presencas.length > 0
    ? presencas.reduce((acc, p) => acc + p.percentual, 0) / presencas.length
    : 0
  const mediaRow = sheet.addRow(['Média Geral de Presença:', '', '', '', '', '', `${mediaGeral.toFixed(1)}%`])
  mediaRow.getCell(1).font = { bold: true }
  mediaRow.getCell(7).font = { bold: true }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

/**
 * Gera relatório de votações em Excel
 */
export async function gerarRelatorioExcelVotacoes(
  votacoes: RelatorioVotacao[],
  titulo: string = 'Relatório de Votações'
): Promise<Buffer> {
  const ExcelJS = await getExcelJS()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Legislativo - Câmara Municipal'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Votações')

  // Título
  sheet.mergeCells('A1:H1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = titulo
  titleCell.style = excelStyles.title

  // Subtítulo
  sheet.mergeCells('A2:H2')
  const subtitleCell = sheet.getCell('A2')
  subtitleCell.value = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`
  subtitleCell.style = excelStyles.subtitle

  sheet.addRow([])

  // Cabeçalhos
  const headers = ['Proposição', 'Sessão', 'Data', 'Resultado', 'Sim', 'Não', 'Abstenções', 'Ausentes']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell) => {
    cell.style = excelStyles.header
  })

  // Dados
  votacoes.forEach(v => {
    const row = sheet.addRow([
      v.proposicao,
      v.sessao,
      new Date(v.data).toLocaleDateString('pt-BR'),
      v.resultado,
      v.votosSim,
      v.votosNao,
      v.abstencoes,
      v.ausentes
    ])
    row.eachCell((cell, colNumber) => {
      cell.style = excelStyles.cell
      // Colorir resultado
      if (colNumber === 4) {
        if (v.resultado === 'APROVADA') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }
        } else if (v.resultado === 'REJEITADA') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } }
        }
      }
    })
  })

  // Ajustar colunas
  sheet.columns.forEach((column, index) => {
    const widths = [25, 20, 15, 15, 10, 10, 12, 12]
    column.width = widths[index] || 15
  })

  // Estatísticas
  sheet.addRow([])
  const stats = {
    total: votacoes.length,
    aprovadas: votacoes.filter(v => v.resultado === 'APROVADA').length,
    rejeitadas: votacoes.filter(v => v.resultado === 'REJEITADA').length
  }
  sheet.addRow(['ESTATÍSTICAS'])
  sheet.addRow(['Total de Votações:', stats.total])
  sheet.addRow(['Aprovadas:', stats.aprovadas])
  sheet.addRow(['Rejeitadas:', stats.rejeitadas])

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
