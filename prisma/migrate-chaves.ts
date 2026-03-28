/**
 * Script de Migracao - Dados da Camara Municipal de Chaves
 * Fonte: cm-chaves-MAXIMO (2).json (portal antigo CR2)
 *
 * Uso na VPS:
 *   cd /opt/camara
 *   npx tsx prisma/migrate-chaves.ts
 *
 * O que faz:
 *   1. Le o JSON de dados do portal antigo
 *   2. Baixa todos os arquivos (PDFs e fotos) do CDN bubble.io
 *   3. Importa Parlamentares (11 unicos)
 *   4. Importa Materias Legislativas como Proposicoes (121)
 *   5. Importa Normas Juridicas (25)
 *   6. Importa Contratos (18)
 *   7. Importa Licitacoes (24)
 *   8. Importa Diarias (40)
 *   9. Importa Documentos Administrativos como Publicacoes (29)
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

const prisma = new PrismaClient()

// Mapa de IDs antigos para IDs novos (Prisma CUIDs)
const idMap: Record<string, string> = {}

// Diretorio de uploads
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// ============================================================================
// UTILIDADES
// ============================================================================

function log(msg: string) {
  console.log(`[MIGRACAO] ${msg}`)
}

function warn(msg: string) {
  console.warn(`[AVISO] ${msg}`)
}

function normalizeUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('//')) return 'https:' + url
  return url
}

async function downloadFile(url: string, destDir: string, filename: string): Promise<string> {
  const fullUrl = normalizeUrl(url)
  if (!fullUrl) return ''

  const destPath = path.join(destDir, filename)

  // Se ja existe, pular
  if (fs.existsSync(destPath)) {
    return `/uploads/${path.relative(path.join(process.cwd(), 'public'), destPath).replace(/\\/g, '/')}`
  }

  fs.mkdirSync(destDir, { recursive: true })

  return new Promise((resolve) => {
    const protocol = fullUrl.startsWith('https') ? https : http
    const request = protocol.get(fullUrl, { timeout: 30000 }, (response) => {
      // Seguir redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          downloadFile(redirectUrl, destDir, filename).then(resolve)
          return
        }
      }

      if (response.statusCode !== 200) {
        warn(`Download falhou (${response.statusCode}): ${fullUrl.substring(0, 80)}`)
        resolve(fullUrl) // Manter URL original como fallback
        return
      }

      const file = fs.createWriteStream(destPath)
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        const localPath = `/uploads/${path.relative(path.join(process.cwd(), 'public'), destPath).replace(/\\/g, '/')}`
        resolve(localPath)
      })
    })

    request.on('error', () => {
      warn(`Erro download: ${fullUrl.substring(0, 80)}`)
      resolve(fullUrl) // Manter URL original
    })

    request.on('timeout', () => {
      request.destroy()
      warn(`Timeout: ${fullUrl.substring(0, 80)}`)
      resolve(fullUrl)
    })
  })
}

function extractNumero(numStr: string): number {
  const match = numStr.match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

function extractAno(numStr: string): number {
  const match = numStr.match(/\/(\d{4})/)
  return match ? parseInt(match[1]) : new Date().getFullYear()
}

function cleanBBCode(text: string): string {
  if (!text) return ''
  return text
    .replace(/\[ml\]/g, '').replace(/\[\/ml\]/g, '')
    .replace(/\[ul\]/g, '').replace(/\[\/ul\]/g, '')
    .replace(/\[li[^\]]*\]/g, '').replace(/\[\/li\]/g, '')
    .replace(/\[url=[^\]]*\]/g, '').replace(/\[\/url\]/g, '')
    .replace(/\[b\]/g, '').replace(/\[\/b\]/g, '')
    .trim()
}

function mapTipoMateria(tipo: string): string {
  const map: Record<string, string> = {
    'Requerimento': 'REQUERIMENTO',
    'Indicação': 'INDICACAO',
    'Projeto de Lei': 'PROJETO_LEI',
    'Projeto de Resolução': 'PROJETO_RESOLUCAO',
    'Projeto de Indicação': 'INDICACAO',
    'Moção de Aplauso': 'MOCAO',
  }
  return map[tipo] || 'REQUERIMENTO'
}

function mapSituacaoMateria(sit: string): string {
  const map: Record<string, string> = {
    'Em Tramitação': 'EM_TRAMITACAO',
    'Aprovado': 'APROVADA',
    'Matéria Lida': 'APROVADA',
    'Rejeitado': 'REJEITADA',
    'undefined': 'APRESENTADA',
  }
  return map[sit] || 'APRESENTADA'
}

function mapTipoNorma(tipo: string): string {
  const map: Record<string, string> = {
    'Lei': 'LEI_ORDINARIA',
    'Decreto Legislativo': 'DECRETO_LEGISLATIVO',
    'Resolução': 'RESOLUCAO',
    'Lei Orgânica': 'LEI_ORGANICA',
    'PPA - Plano Plurianual': 'LEI_ORDINARIA',
    'LDO - Lei de Diretrizes Orçamentárias': 'LEI_ORDINARIA',
    'LOA - Lei Orçamentárias Anual': 'LEI_ORDINARIA',
    'PCCR - Plano de cargos, carreiras e remunerações': 'LEI_ORDINARIA',
  }
  return map[tipo] || 'LEI_ORDINARIA'
}

function mapTipoPublicacao(tipo: string): string {
  const map: Record<string, string> = {
    'Portaria': 'PORTARIA',
    'Ato da Presidência': 'DECRETO',
    'Ofício': 'OUTRO',
  }
  return map[tipo] || 'OUTRO'
}

// ============================================================================
// IMPORTADORES
// ============================================================================

async function importarParlamentares(parlamentares: any[]) {
  log('Importando parlamentares...')

  // Limpar duplicatas
  const vistos = new Set<string>()
  const unicos = parlamentares.filter(p => {
    if (p.deletado) return false
    const nome = (p.nomeCompletoParlamentar || p.nomeParlamentar || '').trim()
    if (!nome || nome === '***' || vistos.has(nome)) return false
    vistos.add(nome)
    return true
  })

  // Buscar legislatura ativa
  const legislatura = await prisma.legislatura.findFirst({
    where: { ativa: true },
    select: { id: true }
  })

  let importados = 0
  for (const p of unicos) {
    const nomeCompleto = (p.nomeCompletoParlamentar || p.nomeParlamentar).trim()
    const apelido = (p.nomeParlamentar || nomeCompleto).trim()

    // Verificar se ja existe
    const existente = await prisma.parlamentar.findFirst({
      where: { nome: nomeCompleto }
    })

    if (existente) {
      idMap[p._id] = existente.id
      log(`  Parlamentar ja existe: ${nomeCompleto}`)
      continue
    }

    // Baixar foto
    let fotoUrl = p.fotoParlamentar ? normalizeUrl(p.fotoParlamentar) : null
    if (fotoUrl) {
      const ext = fotoUrl.includes('.png') ? '.png' : '.jpg'
      const filename = `${apelido.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}${ext}`
      fotoUrl = await downloadFile(p.fotoParlamentar, path.join(UPLOAD_DIR, 'parlamentares'), filename)
    }

    const parlamentar = await prisma.parlamentar.create({
      data: {
        nome: nomeCompleto,
        apelido,
        partido: (p.partidoParlamentar || '').trim(),
        foto: fotoUrl,
        biografia: cleanBBCode(p.biografiaParlamentar || ''),
        cargo: 'VEREADOR',
        ativo: p.ativo !== false,
        legislatura: legislatura ? `${new Date().getFullYear()}` : '2025',
        ...(legislatura && {
          mandatos: {
            create: {
              legislaturaId: legislatura.id,
              cargo: 'VEREADOR',
              ativo: true,
              dataInicio: new Date('2025-01-01'),
            }
          }
        })
      }
    })

    idMap[p._id] = parlamentar.id
    importados++
    log(`  + ${nomeCompleto} (${p.partidoParlamentar})`)
  }

  log(`Parlamentares importados: ${importados}/${unicos.length}`)
}

async function importarMaterias(materias: any[]) {
  log('Importando materias legislativas como proposicoes...')

  // Buscar tipo proposicao padrao
  let tipoConfig = await prisma.tipoProposicao.findFirst()
  if (!tipoConfig) {
    tipoConfig = await prisma.tipoProposicao.create({
      data: {
        nome: 'Requerimento',
        codigo: 'REQUERIMENTO',
        descricao: 'Requerimento legislativo',
        ativo: true
      }
    })
  }

  let importados = 0
  for (const m of materias) {
    if (m.deletado) continue

    const numero = extractNumero(m.numero || '0')
    const ano = extractAno(m.numero || '') || new Date(m.mesEano || m['Created Date']).getFullYear()
    const tipo = mapTipoMateria(m.tipoMateria)

    // Verificar duplicata
    const existente = await prisma.proposicao.findFirst({
      where: { numero, ano, tipo }
    })
    if (existente) {
      idMap[m._id] = existente.id
      continue
    }

    // Resolver autor
    let autorId: string | undefined
    if (m.PARLAMENTAR && m.PARLAMENTAR.length > 0) {
      autorId = idMap[m.PARLAMENTAR[0]]
    }

    try {
      const proposicao = await prisma.proposicao.create({
        data: {
          numero,
          ano,
          tipo,
          titulo: `${m.tipoMateria} ${m.numero || ''}`.trim(),
          ementa: m.ementa || `${m.tipoMateria} ${m.numero}`,
          status: mapSituacaoMateria(m.situacaoMateria || 'undefined'),
          dataApresentacao: m.mesEano ? new Date(m.mesEano) : new Date(m['Created Date']),
          ...(autorId && { autorId }),
        }
      })

      idMap[m._id] = proposicao.id
      importados++
    } catch (err: any) {
      if (!err.message?.includes('Unique constraint')) {
        warn(`Erro ao importar materia ${m.numero}: ${err.message}`)
      }
    }
  }

  log(`Materias importadas: ${importados}/${materias.filter(m => !m.deletado).length}`)
}

async function importarNormas(normas: any[]) {
  log('Importando normas juridicas...')

  let importados = 0
  for (const n of normas) {
    if (n.deletado) continue

    const tipo = mapTipoNorma(n.tipoNormaJuridica)
    const ano = n.anoIn ? parseInt(n.anoIn) : (n.dataPublicacao ? new Date(n.dataPublicacao).getFullYear() : 2025)

    // Baixar documento PDF
    let arquivoUrl = n.documento ? normalizeUrl(n.documento) : null
    if (arquivoUrl) {
      const filename = `norma-${tipo.toLowerCase()}-${ano}-${importados + 1}.pdf`
      arquivoUrl = await downloadFile(n.documento, path.join(UPLOAD_DIR, 'normas'), filename)
    }

    // Criar como Publicacao (para aparecer no portal)
    try {
      await prisma.publicacao.create({
        data: {
          titulo: `${n.tipoNormaJuridica} - ${ano}`,
          descricao: n.ementa,
          tipo: tipo === 'DECRETO_LEGISLATIVO' ? 'DECRETO' : 'LEI',
          numero: String(importados + 1),
          ano,
          data: n.dataPublicacao ? new Date(n.dataPublicacao) : new Date(`${ano}-01-01`),
          conteudo: n.ementa,
          arquivo: arquivoUrl,
          publicada: true,
          autorTipo: 'ORGAO',
          autorNome: n.poderExecutivo || n.tipoAutoria || 'Camara Municipal',
        }
      })
      importados++
    } catch (err: any) {
      warn(`Erro norma: ${err.message?.substring(0, 80)}`)
    }
  }

  log(`Normas importadas: ${importados}/${normas.filter(n => !n.deletado).length}`)
}

async function importarContratos(contratos: any[]) {
  log('Importando contratos...')

  let importados = 0
  for (const c of contratos) {
    if (c.deletado) continue

    // Baixar documento
    let arquivoUrl = c.documento ? normalizeUrl(c.documento) : null
    if (arquivoUrl) {
      const filename = `contrato-${(c.numero || '').replace(/[\/\\]/g, '-')}.pdf`
      arquivoUrl = await downloadFile(c.documento, path.join(UPLOAD_DIR, 'contratos'), filename)
    }

    try {
      const contrato = await prisma.contrato.create({
        data: {
          numero: c.numero || `${c.ordemSequencial}/${c.ano}`,
          objeto: c.objeto,
          valor: c.valor || 0,
          fornecedor: c.nomeRazaoSocial || '',
          cnpjCpf: c.cpfCnpj || '',
          tipo: c.tipoContrato || 'Contrato',
          dataInicio: c.dataVigenciaIN ? new Date(c.dataVigenciaIN) : new Date(),
          dataFim: c.dataVigenciaFIM ? new Date(c.dataVigenciaFIM) : null,
          fiscal: c.fiscalContrato || '',
          arquivo: arquivoUrl,
          ano: parseInt(c.ano) || new Date().getFullYear(),
          situacao: 'VIGENTE',
        }
      })
      idMap[c._id] = contrato.id
      importados++
    } catch (err: any) {
      warn(`Erro contrato ${c.numero}: ${err.message?.substring(0, 80)}`)
    }
  }

  log(`Contratos importados: ${importados}/${contratos.filter(c => !c.deletado).length}`)
}

async function importarLicitacoes(licitacoes: any[]) {
  log('Importando licitacoes...')

  let importados = 0
  for (const l of licitacoes) {
    if (l.deletado) continue

    try {
      const licitacao = await prisma.licitacao.create({
        data: {
          numero: l.numero || `${l.ordemSequencial}/${l.ano}`,
          objeto: l.objeto || '',
          modalidade: l.modalidade || 'Outros',
          situacao: l.situacao === 'Finalizado' ? 'HOMOLOGADA' : l.situacao === 'Anulado' ? 'ANULADA' : 'EM_ANDAMENTO',
          valorEstimado: l.valorEstimado || 0,
          valorHomologado: l.valorHomologado || null,
          dataAbertura: l.dataAbertura ? new Date(l.dataAbertura) : new Date(),
          dataPublicacao: l.dataPubli ? new Date(l.dataPubli) : null,
          ano: parseInt(l.ano) || new Date().getFullYear(),
        }
      })
      idMap[l._id] = licitacao.id
      importados++
    } catch (err: any) {
      warn(`Erro licitacao ${l.numero}: ${err.message?.substring(0, 80)}`)
    }
  }

  log(`Licitacoes importadas: ${importados}/${licitacoes.filter(l => !l.deletado).length}`)
}

async function importarDiarias(diarias: any[]) {
  log('Importando diarias...')

  let importados = 0
  for (const di of diarias) {
    if (di.deletado) continue

    try {
      await prisma.diaria.create({
        data: {
          beneficiario: di.nome || '',
          cargo: di.cargo || '',
          destino: di.destino || '',
          motivo: di.motivo || '',
          valor: di.valorTotal || 0,
          quantidade: di.quantidadeDiarias || 1,
          dataInicio: di.inicioViagem ? new Date(di.inicioViagem) : new Date(),
          dataFim: di.fimViagem ? new Date(di.fimViagem) : null,
          numeroPortaria: di.numeroPortaria || '',
          dataPortaria: di.dataPortaria ? new Date(di.dataPortaria) : null,
          ano: new Date(di.inicioViagem || di['Created Date']).getFullYear(),
          status: 'PUBLICADA',
        }
      })
      importados++
    } catch (err: any) {
      warn(`Erro diaria: ${err.message?.substring(0, 80)}`)
    }
  }

  log(`Diarias importadas: ${importados}/${diarias.filter(d => !d.deletado).length}`)
}

async function importarDocumentos(docs: any[]) {
  log('Importando documentos administrativos como publicacoes...')

  let importados = 0
  for (const doc of docs) {
    if (doc.deletado) continue

    // Baixar arquivo
    let arquivoUrl = doc.arquivoDocumento ? normalizeUrl(doc.arquivoDocumento) : null
    if (arquivoUrl) {
      const tipo = (doc.TipoDocumentoAdm || 'doc').toLowerCase().replace(/\s+/g, '-')
      const filename = `${tipo}-${(doc.numero || '').replace(/[\/\\]/g, '-')}.pdf`
      arquivoUrl = await downloadFile(doc.arquivoDocumento, path.join(UPLOAD_DIR, 'documentos'), filename)
    }

    // Resolver autor
    let autorNome = 'Camara Municipal'
    if (doc.PARLAMENTAR && doc.PARLAMENTAR.length > 0) {
      const parlamentarId = idMap[doc.PARLAMENTAR[0]]
      if (parlamentarId) {
        const p = await prisma.parlamentar.findUnique({ where: { id: parlamentarId }, select: { nome: true } })
        if (p) autorNome = p.nome
      }
    }

    try {
      await prisma.publicacao.create({
        data: {
          titulo: `${doc.TipoDocumentoAdm} No ${doc.numero || 's/n'}`,
          descricao: doc.descricao || '',
          tipo: mapTipoPublicacao(doc.TipoDocumentoAdm) as any,
          numero: doc.numero || null,
          ano: doc.dataPublicacao ? new Date(doc.dataPublicacao).getFullYear() : new Date(doc['Created Date']).getFullYear(),
          data: doc.dataPublicacao ? new Date(doc.dataPublicacao) : new Date(doc['Created Date']),
          conteudo: doc.descricao || `${doc.TipoDocumentoAdm} ${doc.numero}`,
          arquivo: arquivoUrl,
          publicada: true,
          autorTipo: 'ORGAO',
          autorNome,
        }
      })
      importados++
    } catch (err: any) {
      warn(`Erro doc ${doc.numero}: ${err.message?.substring(0, 80)}`)
    }
  }

  log(`Documentos importados: ${importados}/${docs.filter(d => !d.deletado).length}`)
}

// ============================================================================
// FUNCAO PRINCIPAL
// ============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('MIGRACAO DE DADOS - CAMARA MUNICIPAL DE CHAVES')
  console.log('Fonte: Portal antigo (CR2 / bubble.io)')
  console.log('='.repeat(60))
  console.log()

  // Ler JSON
  const jsonPath = path.join(process.cwd(), 'docs', 'cm-chaves-MAXIMO (2).json')
  if (!fs.existsSync(jsonPath)) {
    console.error('Arquivo nao encontrado:', jsonPath)
    process.exit(1)
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const d = rawData.dados

  log(`Entidade: ${rawData.entidade.nome}`)
  log(`Extraido em: ${rawData.extraidoEm}`)
  console.log()

  // Criar diretorios de upload
  const dirs = ['parlamentares', 'documentos', 'contratos', 'normas', 'licitacoes']
  dirs.forEach(dir => fs.mkdirSync(path.join(UPLOAD_DIR, dir), { recursive: true }))

  // Filtrar apenas dados de Chaves
  log('Filtrando dados especificos de Chaves...')
  log(`  Parlamentares: ${d['Parlamentares'].length}`)
  log(`  Materias: ${d['Matérias Legislativas'].length}`)
  log(`  Normas: ${d['Normas Jurídicas'].length}`)
  log(`  Contratos: ${d['Contratos'].length} (especificos, ignorando 50k globais)`)
  log(`  Licitacoes: ${d['Licitações'].length} (especificas, ignorando 50k globais)`)
  log(`  Diarias: ${d['Diárias'].length}`)
  log(`  Docs Admin: ${d['Documentos Administrativos'].length}`)
  console.log()

  // Executar importacoes na ordem correta (respeitando dependencias)
  try {
    await importarParlamentares(d['Parlamentares'])
    console.log()

    await importarMaterias(d['Matérias Legislativas'])
    console.log()

    await importarNormas(d['Normas Jurídicas'])
    console.log()

    await importarLicitacoes(d['Licitações'])
    console.log()

    await importarContratos(d['Contratos'])
    console.log()

    await importarDiarias(d['Diárias'])
    console.log()

    await importarDocumentos(d['Documentos Administrativos'])
    console.log()

    // Resumo final
    console.log('='.repeat(60))
    log('MIGRACAO CONCLUIDA!')
    console.log('='.repeat(60))
    log(`IDs mapeados: ${Object.keys(idMap).length}`)
    log(`Arquivos baixados em: ${UPLOAD_DIR}`)
    console.log()
    log('Verifique os dados em:')
    log('  - /admin/parlamentares')
    log('  - /admin/proposicoes')
    log('  - /admin/transparencia (documentos)')
    log('  - /admin/contratos')
    log('  - /admin/licitacoes')
    log('  - /admin/diarias')
  } catch (error) {
    console.error('Erro fatal na migracao:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
