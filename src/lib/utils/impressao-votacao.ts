/**
 * Utilitário para gerar documento de resultado de votação para impressão
 */

interface Voto {
  parlamentar: {
    nome: string
    apelido?: string | null
    partido?: string | null
  }
  voto: 'SIM' | 'NAO' | 'ABSTENCAO'
}

interface DadosVotacao {
  proposicao: {
    tipo: string
    numero: number
    ano: number
    titulo: string
    ementa?: string | null
    autor?: {
      nome: string
    }
  }
  sessao: {
    numero: number
    tipo: string
    data: string
    horario?: string | null
  }
  votos: Voto[]
  resultado: 'APROVADO' | 'REJEITADO'
  tipoVotacao: 'NOMINAL' | 'SECRETA'
  dataHoraVotacao: Date
}

/**
 * Gera o texto formatado do resultado da votação para impressão
 */
export function gerarDocumentoResultadoVotacao(dados: DadosVotacao): string {
  const { proposicao, sessao, votos, resultado, tipoVotacao, dataHoraVotacao } = dados

  const votosSim = votos.filter(v => v.voto === 'SIM')
  const votosNao = votos.filter(v => v.voto === 'NAO')
  const votosAbstencao = votos.filter(v => v.voto === 'ABSTENCAO')

  const tipoSessaoLabel = {
    'ORDINARIA': 'Ordinária',
    'EXTRAORDINARIA': 'Extraordinária',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[sessao.tipo] || sessao.tipo

  const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  let doc = ''

  // Cabeçalho
  doc += '═'.repeat(70) + '\n'
  doc += '           CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS\n'
  doc += '                     ESTADO DO PARÁ\n'
  doc += '═'.repeat(70) + '\n\n'

  doc += '              RESULTADO DE VOTAÇÃO\n\n'

  // Informações da sessão
  doc += '─'.repeat(70) + '\n'
  doc += `Sessão: ${sessao.numero}ª Sessão ${tipoSessaoLabel}\n`
  doc += `Data: ${dataFormatada}\n`
  doc += `Horário da Votação: ${dataHoraVotacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`
  doc += '─'.repeat(70) + '\n\n'

  // Informações da proposição
  doc += 'PROPOSIÇÃO:\n'
  doc += `${proposicao.tipo} nº ${proposicao.numero}/${proposicao.ano}\n`
  doc += `${proposicao.titulo}\n`
  if (proposicao.ementa) {
    doc += `\nEmenta: ${proposicao.ementa}\n`
  }
  if (proposicao.autor) {
    doc += `Autor: ${proposicao.autor.nome}\n`
  }
  doc += '\n'

  // Resultado
  doc += '─'.repeat(70) + '\n'
  doc += `                    ${resultado === 'APROVADO' ? '✓ APROVADO' : '✗ REJEITADO'}\n`
  doc += '─'.repeat(70) + '\n\n'

  // Contagem
  doc += 'RESULTADO DA VOTAÇÃO:\n'
  doc += `  SIM:       ${votosSim.length.toString().padStart(2)} voto(s)\n`
  doc += `  NÃO:       ${votosNao.length.toString().padStart(2)} voto(s)\n`
  doc += `  ABSTENÇÃO: ${votosAbstencao.length.toString().padStart(2)} voto(s)\n`
  doc += `  TOTAL:     ${votos.length.toString().padStart(2)} voto(s)\n\n`

  // Votos nominais (apenas se não for votação secreta)
  if (tipoVotacao === 'NOMINAL') {
    doc += '─'.repeat(70) + '\n'
    doc += 'VOTAÇÃO NOMINAL:\n\n'

    if (votosSim.length > 0) {
      doc += 'VOTARAM SIM:\n'
      votosSim.forEach((v, i) => {
        const nome = v.parlamentar.apelido || v.parlamentar.nome.split(' ').slice(0, 2).join(' ')
        const partido = v.parlamentar.partido ? ` (${v.parlamentar.partido})` : ''
        doc += `  ${(i + 1).toString().padStart(2)}. ${nome}${partido}\n`
      })
      doc += '\n'
    }

    if (votosNao.length > 0) {
      doc += 'VOTARAM NÃO:\n'
      votosNao.forEach((v, i) => {
        const nome = v.parlamentar.apelido || v.parlamentar.nome.split(' ').slice(0, 2).join(' ')
        const partido = v.parlamentar.partido ? ` (${v.parlamentar.partido})` : ''
        doc += `  ${(i + 1).toString().padStart(2)}. ${nome}${partido}\n`
      })
      doc += '\n'
    }

    if (votosAbstencao.length > 0) {
      doc += 'ABSTENÇÕES:\n'
      votosAbstencao.forEach((v, i) => {
        const nome = v.parlamentar.apelido || v.parlamentar.nome.split(' ').slice(0, 2).join(' ')
        const partido = v.parlamentar.partido ? ` (${v.parlamentar.partido})` : ''
        doc += `  ${(i + 1).toString().padStart(2)}. ${nome}${partido}\n`
      })
      doc += '\n'
    }
  } else {
    doc += '─'.repeat(70) + '\n'
    doc += 'VOTAÇÃO SECRETA - Votos individuais não registrados\n'
    doc += '─'.repeat(70) + '\n\n'
  }

  // Rodapé
  doc += '\n'
  doc += '═'.repeat(70) + '\n'
  doc += `Documento gerado em ${new Date().toLocaleString('pt-BR')}\n`
  doc += 'Sistema Legislativo - Câmara Municipal de Mojuí dos Campos\n'
  doc += '═'.repeat(70) + '\n'

  return doc
}

/**
 * Gera HTML para impressão do resultado da votação
 */
export function gerarHTMLResultadoVotacao(dados: DadosVotacao): string {
  const { proposicao, sessao, votos, resultado, tipoVotacao, dataHoraVotacao } = dados

  const votosSim = votos.filter(v => v.voto === 'SIM')
  const votosNao = votos.filter(v => v.voto === 'NAO')
  const votosAbstencao = votos.filter(v => v.voto === 'ABSTENCAO')

  const tipoSessaoLabel = {
    'ORDINARIA': 'Ordinária',
    'EXTRAORDINARIA': 'Extraordinária',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[sessao.tipo] || sessao.tipo

  const dataFormatada = new Date(sessao.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resultado de Votação - ${proposicao.tipo} ${proposicao.numero}/${proposicao.ano}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      max-width: 21cm;
      margin: 0 auto;
      padding: 2cm;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 1em;
      margin-bottom: 1em;
    }
    .header h1 {
      font-size: 14pt;
      margin: 0;
    }
    .header h2 {
      font-size: 12pt;
      font-weight: normal;
      margin: 0.5em 0;
    }
    .titulo {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin: 1em 0;
    }
    .info-sessao {
      background: #f5f5f5;
      padding: 1em;
      margin: 1em 0;
      border-left: 4px solid #333;
    }
    .proposicao {
      margin: 1em 0;
    }
    .proposicao h3 {
      font-size: 12pt;
      color: #333;
    }
    .resultado {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      padding: 1em;
      margin: 1em 0;
      border: 2px solid;
    }
    .resultado.aprovado {
      background: #d4edda;
      border-color: #28a745;
      color: #155724;
    }
    .resultado.rejeitado {
      background: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
    }
    .contagem {
      display: flex;
      justify-content: center;
      gap: 2em;
      margin: 1em 0;
    }
    .contagem div {
      text-align: center;
      padding: 0.5em 1em;
      border: 1px solid #ccc;
      min-width: 80px;
    }
    .contagem .sim { background: #d4edda; }
    .contagem .nao { background: #f8d7da; }
    .contagem .abstencao { background: #fff3cd; }
    .votos-nominais {
      margin-top: 1em;
    }
    .votos-nominais h4 {
      font-size: 12pt;
      border-bottom: 1px solid #ccc;
      padding-bottom: 0.5em;
    }
    .lista-votos {
      columns: 2;
      column-gap: 2em;
    }
    .lista-votos p {
      margin: 0.25em 0;
      break-inside: avoid;
    }
    .footer {
      margin-top: 2em;
      border-top: 1px solid #ccc;
      padding-top: 1em;
      font-size: 10pt;
      color: #666;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CÂMARA MUNICIPAL DE MOJUÍ DOS CAMPOS</h1>
    <h2>Estado do Pará</h2>
  </div>

  <div class="titulo">RESULTADO DE VOTAÇÃO</div>

  <div class="info-sessao">
    <strong>Sessão:</strong> ${sessao.numero}ª Sessão ${tipoSessaoLabel}<br>
    <strong>Data:</strong> ${dataFormatada}<br>
    <strong>Horário da Votação:</strong> ${dataHoraVotacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
  </div>

  <div class="proposicao">
    <h3>PROPOSIÇÃO</h3>
    <p><strong>${proposicao.tipo} nº ${proposicao.numero}/${proposicao.ano}</strong></p>
    <p>${proposicao.titulo}</p>
    ${proposicao.ementa ? `<p><em>Ementa: ${proposicao.ementa}</em></p>` : ''}
    ${proposicao.autor ? `<p><strong>Autor:</strong> ${proposicao.autor.nome}</p>` : ''}
  </div>

  <div class="resultado ${resultado.toLowerCase()}">
    ${resultado === 'APROVADO' ? '✓ APROVADO' : '✗ REJEITADO'}
  </div>

  <div class="contagem">
    <div class="sim">
      <strong>${votosSim.length}</strong><br>
      <small>SIM</small>
    </div>
    <div class="nao">
      <strong>${votosNao.length}</strong><br>
      <small>NÃO</small>
    </div>
    <div class="abstencao">
      <strong>${votosAbstencao.length}</strong><br>
      <small>ABSTENÇÃO</small>
    </div>
  </div>

  ${tipoVotacao === 'NOMINAL' ? `
  <div class="votos-nominais">
    <h4>VOTAÇÃO NOMINAL</h4>
    ${votosSim.length > 0 ? `
    <p><strong>VOTARAM SIM:</strong></p>
    <div class="lista-votos">
      ${votosSim.map(v => `<p>• ${v.parlamentar.apelido || v.parlamentar.nome}${v.parlamentar.partido ? ` (${v.parlamentar.partido})` : ''}</p>`).join('')}
    </div>
    ` : ''}
    ${votosNao.length > 0 ? `
    <p><strong>VOTARAM NÃO:</strong></p>
    <div class="lista-votos">
      ${votosNao.map(v => `<p>• ${v.parlamentar.apelido || v.parlamentar.nome}${v.parlamentar.partido ? ` (${v.parlamentar.partido})` : ''}</p>`).join('')}
    </div>
    ` : ''}
    ${votosAbstencao.length > 0 ? `
    <p><strong>ABSTENÇÕES:</strong></p>
    <div class="lista-votos">
      ${votosAbstencao.map(v => `<p>• ${v.parlamentar.apelido || v.parlamentar.nome}${v.parlamentar.partido ? ` (${v.parlamentar.partido})` : ''}</p>`).join('')}
    </div>
    ` : ''}
  </div>
  ` : `
  <div class="votos-nominais">
    <h4>VOTAÇÃO SECRETA</h4>
    <p><em>Votos individuais não registrados conforme determinação do tipo de votação.</em></p>
  </div>
  `}

  <div class="footer">
    Documento gerado em ${new Date().toLocaleString('pt-BR')}<br>
    Sistema Legislativo - Câmara Municipal de Mojuí dos Campos
  </div>

  <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 20px; right: 20px; padding: 10px 20px; cursor: pointer;">
    Imprimir
  </button>
</body>
</html>
`
}
