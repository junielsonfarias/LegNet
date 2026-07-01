# Importadores — Dados do Site Antigo (Portal CR2 → novo sistema)

Importa os dados de transparência/legislativos do **Portal CR2 (Bubble)** para
o schema Prisma do novo sistema. Fase 1 = núcleo P0 a partir dos CSVs.

> Planejamento: `docs/PLANO-IMPORTACAO-DADOS-ANTIGOS.md`
> Dicionário/mapeamento: `docs/import-antigo/01-dicionario-colunas.md`

## Como rodar

```bash
# DRY-RUN (padrão): simula, NÃO grava nem baixa arquivos
npm run db:import-antigos

# Apenas algumas fases
npx tsx prisma/importers/index.ts --only=parlamentares,sessoes

# APLICAR de verdade (grava no banco + baixa PDFs/imagens p/ public/uploads)
npm run db:import-antigos:apply
```

⚠️ O padrão é **dry-run**. Só grava com `--apply`. Rode sempre no **banco DEV
local** (Docker) antes de qualquer ambiente real.

## Fonte de dados

`docs/backup antigo/portal-cr2/Portal CR2/*.csv` (extraído do zip do backup;
pasta gitignored). Arquivos (PDF/imagem) vêm do CDN Bubble e são re-hospedados
em `public/uploads/<pasta>/`.

## Estrutura

| Arquivo | Responsabilidade |
|---------|------------------|
| `index.ts` | Orquestrador (args, ordem das fases, relatório) |
| `01-legislatura.ts` | Legislatura + Período |
| `02-parlamentares.ts` | Parlamentar + Mandato + Filiação (+ mapa nome→id) |
| `03-mesa-diretora.ts` | Mesa Diretora + cargos |
| `04-comissoes.ts` | Comissões + membros |
| `05-normas.ts` | Normas Jurídicas |
| `06-proposicoes.ts` | Proposições (matérias legislativas) |
| `07-sessoes.ts` | Sessões (ata/pauta) |
| `19-ocr.ts` | OCR de PDFs (exporta `ocrPdf`/`ensureOcrBins` p/ reuso) |
| `30-folhas-presenca.ts` | Presença por folhas WordPress (2023-2024) |
| `31-folhas-cr2-presenca.ts` | Presença + folha oficial CR2 (2024-2025) |
| `lib/csv.ts` | Parser CSV (RFC 4180, células multilinha) |
| `lib/normalize.ts` | Datas Bubble, número/ano, nomes, placeholders |
| `lib/files.ts` | Download CDN + re-hospedagem + magic bytes |
| `lib/runner.ts` | Contexto (dry-run), stats, paths das fontes |

## Resultado do apply (2026-06-30, banco DEV local)

11 parlamentares (8 c/ foto) · mesa (4) · 4 comissões (12 membros) · 10 normas
(12 placeholders ignorados) · **121 proposições** (107 c/ autor) · 75 sessões
(28 atas + 29 pautas) · ~151 arquivos re-hospedados em `public/uploads/`.
Admin/login preservados.

Nota de fidelidade: a fonte CR2 reusa números (ex.: 3 requerimentos distintos
como "010/2025"); o importador desambigua `numero` (-2/-3) e mantém o número
oficial no título, preservando todas as matérias.

## Complemento histórico WordPress (17-wordpress.ts)

954 posts (1977–2025) roteados por categoria → 339 proposições + 68 normas +
532 publicações. PDFs do acervo local (`docs/backup antigo/wp-uploads/`,
extraído do zip via PowerShell). Fontes JSON: `wp-posts.json` (regenerar com a
query em `16-noticias-wp.ts` adaptada). Resolução de arquivos tolerante a
encoding (`normKey` remove não-ASCII dos dois lados).

## Folhas de presença CR2 (31-folhas-cr2-presenca.ts)

Presença oficial 2024-2025 a partir da coluna `listPresencaSessao` de
`Sessões.csv` (65 folhas assinadas: 40 Google Drive + 25 CDN Bubble). Casa
folha→sessão pela mesma derivação de `07-sessoes` (numero+data+tipo, desambigua
2 sessões no mesmo dia), baixa/re-hospeda o PDF em `public/uploads/presenca-cr2`,
grava `Sessao.arquivoPresenca` e extrai presença **conservadora** por OCR (só
presença CONFIRMADA por assinatura; remove partido/cabeçalho antes de medir o
ruído de assinatura para evitar falso-positivo no formato 2025).

```bash
# Requer tesseract (idioma por) + pdftoppm (poppler). Configure por env quando
# não estiverem no PATH padrão:
export TESSERACT_BIN="C:/Program Files/Tesseract-OCR/tesseract.exe"
export TESSDATA_DIR="/caminho/com/por.traineddata"   # baixe de tessdata_fast
export POPPLER_BIN=".../poppler-XX/Library/bin/pdftoppm.exe"
npx tsx prisma/importers/index.ts --apply --only=folhas-cr2
```

Resultado (2026-07-01): **64 folhas anexadas** (todas baixadas, 0 link externo) ·
**450 presenças confirmadas** em 64 sessões · presença total 663 → 1029 ·
sessões com presença 84 → 124. A folha aparece em `/legislativo/sessoes/[numero]`
("Baixar Folha de Presença").

## Pendente

- Editar `arquivoPresenca` pela tela admin (validador/handler de update-sessao).
- ~56 arquivos Google Drive "/view" (não-diretos) + 1 link WP quebrado.
- Vincular autoria via entidade `Autor` (hoje usa FK legado `autorId`).
- Extrair texto integral dos PDFs para `NormaJuridica.texto`.
- Reescrever URLs de imagens das notícias WP (apontam p/ domínio antigo).
- Revisar 14 nomes de diárias não casados (ex-vereadores/grafia).
