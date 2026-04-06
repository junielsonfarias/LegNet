/**
 * Serviço de Impressão e Relatórios
 * Gera HTML formatado para impressão de documentos legislativos oficiais
 */

interface CabecalhoDocumento {
  nomeCasa?: string
  estado?: string
  logoUrl?: string
  titulo: string
  subtitulo?: string
}

interface RodapeDocumento {
  textoExtra?: string
}

/**
 * Gera o CSS base para documentos de impressão
 */
function getBaseCSS(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
      padding: 2cm 2.5cm;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 12pt;
      margin-bottom: 18pt;
    }
    .header-logo {
      height: 60px;
      margin-bottom: 6pt;
    }
    .header h1 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }
    .header h2 {
      font-size: 11pt;
      font-weight: normal;
      font-style: italic;
    }
    .doc-titulo {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 18pt 0;
      letter-spacing: 0.5pt;
    }
    .doc-subtitulo {
      text-align: center;
      font-size: 12pt;
      margin: -12pt 0 18pt;
      color: #333;
    }
    .secao {
      margin: 14pt 0;
      break-inside: avoid;
    }
    .secao-titulo {
      font-size: 12pt;
      font-weight: bold;
      border-bottom: 1px solid #999;
      padding-bottom: 4pt;
      margin-bottom: 8pt;
      text-transform: uppercase;
    }
    .info-box {
      background: #f5f5f5;
      border-left: 4px solid #333;
      padding: 10pt 14pt;
      margin: 10pt 0;
    }
    .info-box p { margin: 2pt 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      font-size: 11pt;
    }
    th, td {
      border: 1px solid #999;
      padding: 6pt 8pt;
      text-align: left;
    }
    th {
      background: #e8e8e8;
      font-weight: bold;
      font-size: 10pt;
      text-transform: uppercase;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .badge {
      display: inline-block;
      padding: 2pt 8pt;
      border-radius: 3pt;
      font-size: 9pt;
      font-weight: bold;
    }
    .badge-aprovado { background: #d4edda; color: #155724; }
    .badge-rejeitado { background: #f8d7da; color: #721c24; }
    .badge-pendente { background: #fff3cd; color: #856404; }
    .badge-tramitacao { background: #d1ecf1; color: #0c5460; }
    .footer {
      margin-top: 24pt;
      padding-top: 12pt;
      border-top: 1px solid #999;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
    .assinaturas {
      display: flex;
      justify-content: space-around;
      margin-top: 48pt;
      page-break-inside: avoid;
    }
    .assinatura {
      text-align: center;
      min-width: 200px;
    }
    .assinatura .linha {
      border-top: 1px solid #000;
      margin-top: 48pt;
      padding-top: 4pt;
    }
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
    @media print {
      body { padding: 0; margin: 0; }
      .no-print { display: none !important; }
    }
    @media screen {
      body { padding: 2cm; background: #f0f0f0; }
      .page {
        background: white;
        padding: 2cm 2.5cm;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 21cm;
        margin: 0 auto;
      }
      .btn-print {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 100;
      }
      .btn-print:hover { background: #1d4ed8; }
    }
  `
}

/**
 * Gera cabeçalho HTML do documento
 */
function renderCabecalho(cab: CabecalhoDocumento): string {
  return `
    <div class="header">
      ${cab.logoUrl ? `<img src="${cab.logoUrl}" alt="" class="header-logo" />` : ''}
      <h1>${cab.nomeCasa || 'CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS'}</h1>
      <h2>${cab.estado || 'Estado do Pará'}</h2>
    </div>
    <div class="doc-titulo">${cab.titulo}</div>
    ${cab.subtitulo ? `<div class="doc-subtitulo">${cab.subtitulo}</div>` : ''}
  `
}

/**
 * Gera rodapé HTML do documento
 */
function renderRodape(rodape?: RodapeDocumento): string {
  return `
    <div class="footer">
      ${rodape?.textoExtra ? `<p>${rodape.textoExtra}</p>` : ''}
      <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
      <p>Sistema Legislativo - Câmara Municipal de Mojuí dos Campos</p>
    </div>
  `
}

/**
 * Wraps conteúdo em documento HTML completo para impressão
 */
export function wrapDocumentoHTML(options: {
  cabecalho: CabecalhoDocumento
  conteudo: string
  rodape?: RodapeDocumento
  cssExtra?: string
}): string {
  const { cabecalho, conteudo, rodape, cssExtra } = options

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cabecalho.titulo}</title>
  <style>${getBaseCSS()}${cssExtra || ''}</style>
</head>
<body>
  <div class="page">
    ${renderCabecalho(cabecalho)}
    ${conteudo}
    ${renderRodape(rodape)}
  </div>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir</button>
</body>
</html>`
}

/**
 * Gera relatório de lista de presença de sessão
 */
export function gerarRelatorioPresenca(dados: {
  sessao: { numero: number; tipo: string; data: string; horario?: string }
  presentes: Array<{ nome: string; partido?: string; horaPresenca?: string }>
  ausentes: Array<{ nome: string; partido?: string; justificativa?: string }>
  totalVereadores: number
}): string {
  const { sessao, presentes, ausentes, totalVereadores } = dados

  const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const tipoLabel: Record<string, string> = {
    ORDINARIA: 'Ordinária', EXTRAORDINARIA: 'Extraordinária',
    SOLENE: 'Solene', ESPECIAL: 'Especial',
  }

  const conteudo = `
    <div class="info-box">
      <p><strong>Sessão:</strong> ${sessao.numero}ª Sessão ${tipoLabel[sessao.tipo] || sessao.tipo}</p>
      <p><strong>Data:</strong> ${dataFormatada}</p>
      ${sessao.horario ? `<p><strong>Horário:</strong> ${sessao.horario}</p>` : ''}
      <p><strong>Quórum:</strong> ${presentes.length} de ${totalVereadores} vereadores (${((presentes.length / totalVereadores) * 100).toFixed(0)}%)</p>
    </div>

    <div class="secao">
      <div class="secao-titulo">Presentes (${presentes.length})</div>
      <table>
        <thead>
          <tr><th>Nº</th><th>Vereador(a)</th><th>Partido</th><th>Hora</th></tr>
        </thead>
        <tbody>
          ${presentes.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.nome}</td>
              <td>${p.partido || '-'}</td>
              <td>${p.horaPresenca || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${ausentes.length > 0 ? `
    <div class="secao">
      <div class="secao-titulo">Ausentes (${ausentes.length})</div>
      <table>
        <thead>
          <tr><th>Nº</th><th>Vereador(a)</th><th>Partido</th><th>Justificativa</th></tr>
        </thead>
        <tbody>
          ${ausentes.map((a, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${a.nome}</td>
              <td>${a.partido || '-'}</td>
              <td>${a.justificativa || 'Não justificou'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="assinaturas no-break">
      <div class="assinatura">
        <div class="linha">Presidente</div>
      </div>
      <div class="assinatura">
        <div class="linha">1º Secretário</div>
      </div>
    </div>
  `

  return wrapDocumentoHTML({
    cabecalho: {
      titulo: 'Lista de Presença',
      subtitulo: `${sessao.numero}ª Sessão ${tipoLabel[sessao.tipo] || sessao.tipo} - ${dataFormatada}`,
    },
    conteudo,
  })
}

/**
 * Gera relatório de pauta da sessão
 */
export function gerarRelatorioPauta(dados: {
  sessao: { numero: number; tipo: string; data: string; horario?: string }
  itens: Array<{
    ordem: number
    tipo: string
    numero: string
    ano: number
    titulo: string
    autor?: string
    ementa?: string
  }>
}): string {
  const { sessao, itens } = dados

  const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const tipoLabel: Record<string, string> = {
    ORDINARIA: 'Ordinária', EXTRAORDINARIA: 'Extraordinária',
    SOLENE: 'Solene', ESPECIAL: 'Especial',
  }

  const conteudo = `
    <div class="info-box">
      <p><strong>Sessão:</strong> ${sessao.numero}ª Sessão ${tipoLabel[sessao.tipo] || sessao.tipo}</p>
      <p><strong>Data:</strong> ${dataFormatada}</p>
      ${sessao.horario ? `<p><strong>Horário:</strong> ${sessao.horario}</p>` : ''}
      <p><strong>Total de itens:</strong> ${itens.length}</p>
    </div>

    <div class="secao">
      <div class="secao-titulo">Ordem do Dia</div>
      <table>
        <thead>
          <tr><th style="width:40px">Nº</th><th style="width:120px">Proposição</th><th>Assunto</th><th style="width:120px">Autor</th></tr>
        </thead>
        <tbody>
          ${itens.map(item => `
            <tr class="no-break">
              <td>${item.ordem}</td>
              <td><strong>${item.tipo} ${item.numero}/${item.ano}</strong></td>
              <td>
                ${item.titulo}
                ${item.ementa ? `<br><small><em>${item.ementa}</em></small>` : ''}
              </td>
              <td>${item.autor || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `

  return wrapDocumentoHTML({
    cabecalho: {
      titulo: 'Pauta da Sessão',
      subtitulo: `${sessao.numero}ª Sessão ${tipoLabel[sessao.tipo] || sessao.tipo} - ${dataFormatada}`,
    },
    conteudo,
  })
}

/**
 * Gera relatório de tramitação de proposição
 */
export function gerarRelatorioTramitacao(dados: {
  proposicao: {
    tipo: string
    numero: string
    ano: number
    titulo: string
    ementa?: string
    autor: string
    dataApresentacao: string
    status: string
  }
  tramitacoes: Array<{
    data: string
    origem: string
    destino: string
    despacho?: string
    status: string
  }>
}): string {
  const { proposicao, tramitacoes } = dados

  const conteudo = `
    <div class="secao">
      <div class="secao-titulo">Dados da Proposição</div>
      <div class="info-box">
        <p><strong>Tipo:</strong> ${proposicao.tipo} nº ${proposicao.numero}/${proposicao.ano}</p>
        <p><strong>Autor:</strong> ${proposicao.autor}</p>
        <p><strong>Data de Apresentação:</strong> ${new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}</p>
        <p><strong>Status Atual:</strong> ${proposicao.status}</p>
      </div>
      <p><strong>Assunto:</strong> ${proposicao.titulo}</p>
      ${proposicao.ementa ? `<p><strong>Ementa:</strong> <em>${proposicao.ementa}</em></p>` : ''}
    </div>

    <div class="secao">
      <div class="secao-titulo">Histórico de Tramitação</div>
      <table>
        <thead>
          <tr><th>Data</th><th>Origem</th><th>Destino</th><th>Despacho</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${tramitacoes.map(t => `
            <tr>
              <td>${new Date(t.data).toLocaleDateString('pt-BR')}</td>
              <td>${t.origem}</td>
              <td>${t.destino}</td>
              <td>${t.despacho || '-'}</td>
              <td>${t.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `

  return wrapDocumentoHTML({
    cabecalho: {
      titulo: 'Relatório de Tramitação',
      subtitulo: `${proposicao.tipo} nº ${proposicao.numero}/${proposicao.ano}`,
    },
    conteudo,
  })
}

/**
 * Abre janela de impressão com HTML gerado
 */
export function abrirImpressao(html: string): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(html)
  printWindow.document.close()
}
