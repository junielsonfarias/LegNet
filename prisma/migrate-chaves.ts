/**
 * Script de Migracao - Dados da Camara Municipal de Chaves
 * Fonte: cm-chaves-limpo.json (filtrado, apenas dados de Chaves)
 *
 * Uso: cd /opt/camara && npx tsx prisma/migrate-chaves.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

const prisma = new PrismaClient()
const idMap: Record<string, string> = {}
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// ============================================================================
// UTILIDADES
// ============================================================================

function log(msg: string) { console.log(`[MIGRACAO] ${msg}`) }
function warn(msg: string) { console.warn(`[AVISO] ${msg}`) }

function normalizeUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('//')) return 'https:' + url
  return url
}

async function downloadFile(url: string, destDir: string, filename: string): Promise<string> {
  const fullUrl = normalizeUrl(url)
  if (!fullUrl) return ''
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)
  const destPath = path.join(destDir, safe)
  if (fs.existsSync(destPath)) {
    return `/${path.relative(path.join(process.cwd(), 'public'), destPath).replace(/\\/g, '/')}`
  }
  fs.mkdirSync(destDir, { recursive: true })

  return new Promise((resolve) => {
    const proto = fullUrl.startsWith('https') ? https : http
    const req = proto.get(fullUrl, { timeout: 30000 }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        downloadFile(res.headers.location, destDir, safe).then(resolve)
        return
      }
      if (res.statusCode !== 200) { resolve(fullUrl); return }
      const file = fs.createWriteStream(destPath)
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(`/${path.relative(path.join(process.cwd(), 'public'), destPath).replace(/\\/g, '/')}`)
      })
    })
    req.on('error', () => resolve(fullUrl))
    req.on('timeout', () => { req.destroy(); resolve(fullUrl) })
  })
}

function extractNumero(s: string): number {
  const m = s.match(/(\d+)/); return m ? parseInt(m[1]) : 0
}
function extractAno(s: string): number {
  const m = s.match(/\/(\d{4})/); return m ? parseInt(m[1]) : new Date().getFullYear()
}
function cleanBBCode(t: string): string {
  if (!t) return ''
  return t.replace(/\[[^\]]*\]/g, '').trim()
}

// ============================================================================
// IMPORTADORES
// ============================================================================

async function importarParlamentares(parlamentares: any[]) {
  log('=== PARLAMENTARES ===')
  const vistos = new Set<string>()
  const unicos = parlamentares.filter(p => {
    if (p.deletado) return false
    const nome = (p.nomeCompletoParlamentar || p.nomeParlamentar || '').trim()
    if (!nome || nome === '***' || vistos.has(nome)) return false
    vistos.add(nome); return true
  })

  const legislatura = await prisma.legislatura.findFirst({ where: { ativa: true }, select: { id: true } })
  let ok = 0

  for (const p of unicos) {
    const nome = (p.nomeCompletoParlamentar || p.nomeParlamentar).trim()
    const apelido = (p.nomeParlamentar || nome).trim()
    const existente = await prisma.parlamentar.findFirst({ where: { nome } })
    if (existente) { idMap[p._id] = existente.id; continue }

    let foto: string | null = null
    if (p.fotoParlamentar) {
      const ext = p.fotoParlamentar.includes('.png') ? '.png' : '.jpg'
      foto = await downloadFile(p.fotoParlamentar, path.join(UPLOAD_DIR, 'parlamentares'),
        `${apelido.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}${ext}`)
    }

    const parlamentar = await prisma.parlamentar.create({
      data: {
        nome, apelido,
        partido: (p.partidoParlamentar || '').trim(),
        foto,
        biografia: cleanBBCode(p.biografiaParlamentar || ''),
        cargo: 'VEREADOR',
        ativo: p.ativo !== false,
        legislatura: '2025',
        ...(legislatura && {
          mandatos: { create: { legislaturaId: legislatura.id, cargo: 'VEREADOR', ativo: true, dataInicio: new Date('2025-01-01') } }
        })
      }
    })
    idMap[p._id] = parlamentar.id; ok++
    log(`  + ${nome} (${p.partidoParlamentar})`)
  }
  log(`Parlamentares: ${ok} importados, ${unicos.length - ok} ja existiam`)
}

async function importarMaterias(materias: any[], docsGerais: any[]) {
  log('=== MATERIAS LEGISLATIVAS → PROPOSICOES ===')

  // Garantir tipos de proposicao existem
  const tiposMap: Record<string, string> = {
    'Requerimento': 'REQUERIMENTO',
    'Indicação': 'INDICACAO',
    'Projeto de Lei': 'PROJETO_LEI',
    'Projeto de Resolução': 'PROJETO_RESOLUCAO',
    'Projeto de Indicação': 'INDICACAO',
    'Moção de Aplauso': 'MOCAO',
  }
  const statusMap: Record<string, string> = {
    'Em Tramitação': 'EM_TRAMITACAO',
    'Aprovado': 'APROVADA',
    'Matéria Lida': 'APROVADA',
    'Rejeitado': 'REJEITADA',
  }

  // Index docs gerais por _id
  const docsIndex: Record<string, any> = {}
  docsGerais.forEach(dg => { docsIndex[dg._id] = dg })

  let ok = 0
  for (const m of materias) {
    if (m.deletado) continue
    const numero = extractNumero(m.numero || '0')
    const ano = extractAno(m.numero || '') || (m.mesEano ? new Date(m.mesEano).getFullYear() : 2025)
    const tipo = tiposMap[m.tipoMateria] || 'REQUERIMENTO'

    const existente = await prisma.proposicao.findFirst({ where: { numero: String(numero), ano, tipo } })
    if (existente) { idMap[m._id] = existente.id; continue }

    // Resolver autor
    let autorId: string | undefined
    if (m.PARLAMENTAR?.length > 0) autorId = idMap[m.PARLAMENTAR[0]]

    // Resolver documento PDF vinculado
    let urlDocumento: string | null = null
    if (m.DOCUMENTO?.length > 0) {
      const doc = docsIndex[m.DOCUMENTO[0]]
      if (doc?.arquivo) {
        const filename = `${tipo.toLowerCase()}-${numero}-${ano}.pdf`
        urlDocumento = await downloadFile(doc.arquivo, path.join(UPLOAD_DIR, 'documentos'), filename)
      }
    }

    try {
      const proposicao = await prisma.proposicao.create({
        data: {
          numero: String(numero), ano, tipo,
          titulo: `${m.tipoMateria} ${m.numero || ''}`.trim(),
          ementa: m.ementa || `${m.tipoMateria} ${m.numero}`,
          status: statusMap[m.situacaoMateria] || 'APRESENTADA',
          dataApresentacao: m.mesEano ? new Date(m.mesEano) : new Date(m['Created Date']),
          urlDocumento,
          ...(autorId && { autorId }),
        }
      })
      idMap[m._id] = proposicao.id; ok++
    } catch (err: any) {
      if (!err.message?.includes('Unique constraint'))
        warn(`Materia ${m.numero}: ${err.message?.substring(0, 60)}`)
    }
  }

  // Resumo por tipo
  const contagem: Record<string, number> = {}
  materias.filter(m => !m.deletado).forEach(m => {
    const t = m.tipoMateria || 'Outro'
    contagem[t] = (contagem[t] || 0) + 1
  })
  log(`Proposicoes: ${ok} importadas`)
  Object.entries(contagem).forEach(([t, n]) => log(`  ${t}: ${n}`))
}

async function importarNormas(normas: any[]) {
  log('=== NORMAS JURIDICAS → PUBLICACOES ===')

  const tipoMap: Record<string, string> = {
    'Lei': 'LEI', 'Decreto Legislativo': 'DECRETO', 'Resolução': 'RESOLUCAO',
    'Lei Orgânica': 'LEI', 'PPA - Plano Plurianual': 'LEI',
    'LDO - Lei de Diretrizes Orçamentárias': 'LEI', 'LOA - Lei Orçamentárias Anual': 'LEI',
    'PCCR - Plano de cargos, carreiras e remunerações': 'LEI',
  }

  let ok = 0
  for (const n of normas) {
    if (n.deletado) continue
    const ano = n.anoIn ? parseInt(n.anoIn) : (n.dataPublicacao ? new Date(n.dataPublicacao).getFullYear() : 2025)
    const tipoPub = tipoMap[n.tipoNormaJuridica] || 'LEI'

    let arquivo: string | null = null
    if (n.documento) {
      const filename = `${n.tipoNormaJuridica?.toLowerCase().replace(/\s+/g, '-') || 'norma'}-${ano}-${ok + 1}.pdf`
      arquivo = await downloadFile(n.documento, path.join(UPLOAD_DIR, 'normas'), filename)
    }

    try {
      await prisma.publicacao.create({
        data: {
          titulo: `${n.tipoNormaJuridica} - ${ano}`,
          descricao: n.ementa,
          tipo: tipoPub as any,
          numero: String(ok + 1),
          ano,
          data: n.dataPublicacao ? new Date(n.dataPublicacao) : new Date(`${ano}-01-01`),
          conteudo: n.ementa,
          arquivo,
          publicada: true,
          autorTipo: 'ORGAO',
          autorNome: n.poderExecutivo || n.tipoAutoria || 'Camara Municipal',
        }
      })
      ok++
      log(`  + ${n.tipoNormaJuridica} - ${n.ementa?.substring(0, 60)}`)
    } catch (err: any) {
      warn(`Norma: ${err.message?.substring(0, 60)}`)
    }
  }
  log(`Normas: ${ok} importadas como Publicacoes`)
}

async function importarLicitacoes(licitacoes: any[], docsGerais: any[]) {
  log('=== LICITACOES ===')

  const docsIndex: Record<string, any> = {}
  docsGerais.forEach(dg => { docsIndex[dg._id] = dg })

  const modalidadeMap: Record<string, string> = {
    'Inexigibilidade de Licitação': 'INEXIGIBILIDADE',
    'Dispensa de Licitação': 'DISPENSA',
    'Adesão a Ata de Registro de Preço': 'ADESAO_ATA',
    'Convite': 'CONVITE',
    'Pregão Eletrônico': 'PREGAO_ELETRONICO',
    'Pregão Presencial': 'PREGAO_PRESENCIAL',
  }
  const situacaoMap: Record<string, string> = {
    'Finalizado': 'HOMOLOGADA', 'Anulado': 'ANULADA', 'Em Andamento': 'EM_ANDAMENTO',
  }

  let ok = 0
  for (const l of licitacoes) {
    if (l.deletado) continue
    try {
      const licitacao = await prisma.licitacao.create({
        data: {
          numero: l.numero || `${l.ordemSequencial}/${l.ano}`,
          ano: parseInt(l.ano) || 2025,
          objeto: l.objeto || '',
          modalidade: (modalidadeMap[l.modalidade] || 'DISPENSA') as any,
          situacao: (situacaoMap[l.situacao] || 'EM_ANDAMENTO') as any,
          valorEstimado: l.valorEstimado || 0,
          valorHomologado: l.valorHomologado || null,
          dataAbertura: l.dataAbertura ? new Date(l.dataAbertura) : new Date(),
          dataPublicacao: l.dataPubli ? new Date(l.dataPubli) : null,
        }
      })
      idMap[l._id] = licitacao.id; ok++

      // Importar documentos anexos da licitacao
      if (l.DOCUMENTOS?.length > 0) {
        let docOk = 0
        for (const docId of l.DOCUMENTOS) {
          const doc = docsIndex[docId]
          if (doc?.arquivo) {
            const filename = `lic-${l.numero?.replace(/[\/\\]/g, '-') || ok}-doc-${docOk + 1}.pdf`
            const arquivoLocal = await downloadFile(doc.arquivo, path.join(UPLOAD_DIR, 'licitacoes'), filename)
            try {
              await prisma.licitacaoDocumento.create({
                data: {
                  licitacaoId: licitacao.id,
                  titulo: doc.descricao || `Documento ${docOk + 1}`,
                  tipo: 'anexo',
                  arquivo: arquivoLocal,
                }
              })
              docOk++
            } catch {}
          }
        }
        if (docOk > 0) log(`  + Lic ${l.numero}: ${docOk} documentos anexados`)
      }
    } catch (err: any) {
      warn(`Licitacao ${l.numero}: ${err.message?.substring(0, 60)}`)
    }
  }
  log(`Licitacoes: ${ok} importadas`)
}

async function importarContratos(contratos: any[]) {
  log('=== CONTRATOS ===')
  let ok = 0
  for (const c of contratos) {
    if (c.deletado) continue
    let arquivo: string | null = null
    if (c.documento) {
      const filename = `contrato-${(c.numero || '').replace(/[\/\\]/g, '-')}.pdf`
      arquivo = await downloadFile(c.documento, path.join(UPLOAD_DIR, 'contratos'), filename)
    }
    try {
      const ano = parseInt(c.ano) || 2025
      const contrato = await prisma.contrato.create({
        data: {
          numero: c.numero || `${c.ordemSequencial}/${c.ano}`,
          ano,
          objeto: c.objeto || '',
          contratado: c.nomeRazaoSocial || '',
          cnpjCpf: c.cpfCnpj || '',
          valorTotal: c.valor || 0,
          dataAssinatura: c.dataVigenciaIN ? new Date(c.dataVigenciaIN) : new Date(),
          vigenciaInicio: c.dataVigenciaIN ? new Date(c.dataVigenciaIN) : new Date(),
          vigenciaFim: c.dataVigenciaFIM ? new Date(c.dataVigenciaFIM) : new Date(ano + 1, 0, 1),
          fiscalContrato: c.fiscalContrato || null,
          arquivo,
          situacao: 'VIGENTE',
          ...(c.licitacaoOrigem && idMap[c.licitacaoOrigem] && { licitacaoId: idMap[c.licitacaoOrigem] }),
        }
      })
      idMap[c._id] = contrato.id; ok++
    } catch (err: any) {
      warn(`Contrato ${c.numero}: ${err.message?.substring(0, 60)}`)
    }
  }
  log(`Contratos: ${ok} importados`)
}

async function importarDiarias(diarias: any[]) {
  log('=== DIARIAS ===')
  let ok = 0
  for (const di of diarias) {
    if (di.deletado) continue
    try {
      const dataRef = di.inicioViagem || di['Created Date']
      const qtd = di.quantidadeDiarias || 1
      const valorTotal = di.valorTotal || 0
      await prisma.diaria.create({
        data: {
          nome: di.nome || '',
          cargo: di.cargo || '',
          destino: di.destino || '',
          motivo: di.motivo || '',
          valorUnitario: qtd > 0 ? valorTotal / qtd : valorTotal,
          valorTotal,
          quantidade: qtd,
          dataInicio: di.inicioViagem ? new Date(di.inicioViagem) : new Date(),
          dataFim: di.fimViagem ? new Date(di.fimViagem) : new Date(dataRef),
          numeroPortaria: di.numeroPortaria || null,
          dataPortaria: di.dataPortaria ? new Date(di.dataPortaria) : null,
          status: 'PUBLICADA',
          ano: new Date(dataRef).getFullYear(),
          mes: new Date(dataRef).getMonth() + 1,
        }
      })
      ok++
    } catch (err: any) {
      warn(`Diaria: ${err.message?.substring(0, 60)}`)
    }
  }
  log(`Diarias: ${ok} importadas`)
}

async function importarDocumentos(docs: any[]) {
  log('=== DOCUMENTOS ADMINISTRATIVOS → PUBLICACOES ===')

  const tipoMap: Record<string, string> = {
    'Portaria': 'PORTARIA', 'Ato da Presidência': 'DECRETO', 'Ofício': 'OUTRO',
  }

  let ok = 0
  for (const doc of docs) {
    if (doc.deletado) continue
    let arquivo: string | null = null
    if (doc.arquivoDocumento) {
      const tipo = (doc.TipoDocumentoAdm || 'doc').toLowerCase().replace(/\s+/g, '-')
      const filename = `${tipo}-${(doc.numero || 'sn').replace(/[\/\\]/g, '-')}.pdf`
      arquivo = await downloadFile(doc.arquivoDocumento, path.join(UPLOAD_DIR, 'documentos'), filename)
    }

    let autorNome = 'Camara Municipal'
    if (doc.PARLAMENTAR?.length > 0 && idMap[doc.PARLAMENTAR[0]]) {
      const p = await prisma.parlamentar.findUnique({ where: { id: idMap[doc.PARLAMENTAR[0]] }, select: { nome: true } })
      if (p) autorNome = p.nome
    }

    try {
      await prisma.publicacao.create({
        data: {
          titulo: `${doc.TipoDocumentoAdm} No ${doc.numero || 's/n'}`,
          descricao: doc.descricao || '',
          tipo: (tipoMap[doc.TipoDocumentoAdm] || 'OUTRO') as any,
          numero: doc.numero || null,
          ano: doc.dataPublicacao ? new Date(doc.dataPublicacao).getFullYear() : new Date(doc['Created Date']).getFullYear(),
          data: doc.dataPublicacao ? new Date(doc.dataPublicacao) : new Date(doc['Created Date']),
          conteudo: doc.descricao || `${doc.TipoDocumentoAdm} ${doc.numero}`,
          arquivo,
          publicada: true,
          autorTipo: 'ORGAO',
          autorNome,
        }
      })
      ok++
    } catch (err: any) {
      warn(`Doc ${doc.numero}: ${err.message?.substring(0, 60)}`)
    }
  }
  log(`Documentos: ${ok} importados como Publicacoes`)

  // Resumo por tipo
  const contagem: Record<string, number> = {}
  docs.filter(d => !d.deletado).forEach(d => {
    const t = d.TipoDocumentoAdm || 'Outro'
    contagem[t] = (contagem[t] || 0) + 1
  })
  Object.entries(contagem).forEach(([t, n]) => log(`  ${t}: ${n}`))
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('MIGRACAO DE DADOS - CAMARA MUNICIPAL DE CHAVES')
  console.log('='.repeat(60))

  // Tentar JSON limpo primeiro, depois original
  let jsonPath = path.join(process.cwd(), 'docs', 'cm-chaves-limpo.json')
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.join(process.cwd(), 'docs', 'cm-chaves-MAXIMO (2).json')
  }
  if (!fs.existsSync(jsonPath)) {
    console.error('Arquivo nao encontrado. Coloque em docs/cm-chaves-limpo.json')
    process.exit(1)
  }

  log(`Lendo: ${path.basename(jsonPath)}`)
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const d = raw.dados
  log(`Entidade: ${raw.entidade.nome}`)

  const dirs = ['parlamentares', 'documentos', 'contratos', 'normas', 'licitacoes']
  dirs.forEach(dir => fs.mkdirSync(path.join(UPLOAD_DIR, dir), { recursive: true }))

  const docsGerais = d['Documentos Gerais'] || []

  try {
    await importarParlamentares(d['Parlamentares'] || [])
    await importarMaterias(d['Matérias Legislativas'] || [], docsGerais)
    await importarNormas(d['Normas Jurídicas'] || [])
    await importarLicitacoes(d['Licitações'] || [], docsGerais)
    await importarContratos(d['Contratos'] || [])
    await importarDiarias(d['Diárias'] || [])
    await importarDocumentos(d['Documentos Administrativos'] || [])

    console.log()
    console.log('='.repeat(60))
    log('MIGRACAO CONCLUIDA!')
    log(`IDs mapeados: ${Object.keys(idMap).length}`)
    log(`Arquivos em: ${UPLOAD_DIR}`)
    console.log('='.repeat(60))
  } catch (error) {
    console.error('Erro fatal:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
