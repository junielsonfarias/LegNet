# Manual do Servidor — Sistema Legislativo

> **Publico-alvo:** servidores da Camara Municipal (Secretaria Legislativa, Editor, Operador, Auxiliar Legislativo, Administrador)
> **Formato:** tutorial passo-a-passo
> **Versao:** 1.0 · 17/04/2026

---

## 📦 Volumes disponiveis

O manual e dividido em **volumes independentes** por modulo/perfil. Cada volume e um PDF auto-contido que inclui a **Introducao** e **Primeiros Passos** (capitulos 00 e 01) + os capitulos especificos do modulo.

### Volumes completos (por modulo/perfil)

| ID | Volume | PDF | Publico-alvo |
|---|---|---|---|
| `completo` | Manual Completo | `manual-servidor-completo.pdf` | Biblioteca de referencia (todos) |
| `geral` | Primeiros Passos | `manual-geral-primeiros-passos.pdf` | Onboarding inicial |
| `legislativo` | Legislativo | `manual-legislativo.pdf` | Secretaria, Auxiliar, Editor |
| `sessoes` | Sessoes e Painel | `manual-sessoes.pdf` | Operador, Secretaria |
| `transparencia` | Transparencia | `manual-transparencia.pdf` | Editor, Admin |
| `admin` | Administrador | `manual-administrador.pdf` | Administrador |

### Volumes individuais por capitulo (para revisao/edicao)

| Capitulo | PDF |
|---|---|
| 02 Protocolo | `cap-02-protocolo.pdf` |
| 03 Proposicoes | `cap-03-proposicoes.pdf` |
| 04 Pareceres | `cap-04-pareceres.pdf` |
| 05 Comissoes | `cap-05-comissoes.pdf` |
| 06 Sessoes | `cap-06-sessoes.pdf` |
| 07 Painel Operador | `cap-07-painel-operador.pdf` |
| 09 Transparencia | `cap-09-transparencia.pdf` |
| 13 Configuracoes | `cap-13-configuracoes.pdf` |

---

## 📑 Indice dos capitulos (fontes)

| # | Capitulo | Status | Publico |
|---|---|---|---|
| 00 | [Introducao](./00-introducao.md) | ✅ | Todos |
| 01 | [Primeiros Passos — Login, navegacao e perfil](./01-primeiros-passos.md) | ✅ | Todos |
| 02 | [Protocolo de Documentos](./02-protocolo.md) | ✅ | Secretaria, Admin |
| 03 | [Proposicoes — criacao, edicao, tramitacao, emendas](./03-proposicoes.md) | ✅ | Secretaria, Auxiliar, Editor |
| 04 | [Pareceres de Comissao](./04-pareceres.md) | ✅ | Secretaria, Auxiliar |
| 05 | [Comissoes e Reunioes](./05-comissoes.md) | ✅ | Secretaria, Auxiliar |
| 06 | [Sessoes Legislativas — agendamento, pauta, ata](./06-sessoes.md) | ✅ | Secretaria, Operador |
| 07 | [Painel Operador e Votacoes — tempo real](./07-painel-operador.md) | ✅ | Operador, Secretaria |
| 08 | Publicacoes, Normas Juridicas e Noticias | 🔜 | Editor |
| 09 | [Transparencia (PNTP)](./09-transparencia.md) | ✅ | Editor, Admin |
| 10 | E-SIC e Ouvidoria | 🔜 | Editor, Secretaria |
| 11 | Participacao Cidada | 🔜 | Editor |
| 12 | Relatorios e Analytics | 🔜 | Admin |
| 13 | [Configuracoes Administrativas](./13-configuracoes.md) | ✅ | Admin |
| 14 | Glossario e FAQ | 🔜 | Todos |

---

## 🔧 Como gerar os PDFs

### Gerar todos os volumes

```bash
cd D:/Camara
bash scripts/build-manual.sh
```

Saida: `docs/manual/dist/*.pdf` (14 PDFs).

### Gerar apenas um volume

```bash
bash scripts/build-manual.sh legislativo
# ou
bash scripts/build-manual.sh cap-proposicoes
```

### Listar volumes disponiveis

```bash
node scripts/gerar-manual-pdf.js --list
```

### Editar a lista de volumes

Altere `scripts/manual-volumes.js` para adicionar/remover volumes ou
mudar quais capitulos cada um contem.

---

## 🖼️ Screenshots do sistema

Os capitulos contem **72 referencias de imagem** de telas do sistema. O
estado atual:

- **50 capturadas automaticamente** via Playwright em ambiente dev (Ruropolis)
- **22 placeholders** com card "SCREENSHOT PENDENTE" (fluxos complexos ou bugs do sistema)

Para regenerar todas as capturas (com dev server rodando):

```bash
npm run dev    # em outro terminal
node scripts/capturar-screenshots-manual.js
bash scripts/build-manual.sh
```

Para substituir um placeholder por print manual:

1. Capture a tela e salve em `docs/manual/images/` com o mesmo nome do placeholder
2. Rode `bash scripts/build-manual.sh` para atualizar os PDFs

---

## 🎨 Estilo dos PDFs

O CSS em `pdf-style.css` define:

- A4, margens 1,5 cm
- Fonte 10,5pt (Segoe UI / system-ui)
- Cabecalhos em azul institucional (`#1e40af`)
- Tabelas com header azul + zebra striping
- Callouts coloridos (💡 dica / ⚠️ atencao / ℹ️ nota / 🔒 permissao)
- Imagens centralizadas (85% largura) com borda leve
- Cada capitulo comeca em nova pagina
- Rodape: "Pagina X de Y • nome-do-arquivo.pdf"
- Cabecalho: titulo do volume

---

## ✏️ Convencoes nos capitulos

| Marcador | Significado |
|---|---|
| `> 💡 Dica` | Sugestao para agilizar o trabalho |
| `> ⚠️ Atencao` | Cuidado — acao sensivel ou irreversivel |
| `> ℹ️ Nota` | Esclarecimento adicional |
| `> 🔒 Requer permissao` | Acao restrita a perfis especificos |
| **Nome do botao** | Em negrito, como aparece na tela |
| `URL/Rota` | Em codigo, para rotas ou atalhos |
| *item de menu* | Em italico, para itens de menu lateral |

---

## 📧 Suporte

- **Documentacao tecnica** (para TI): `docs/` na raiz do repositorio
- **Regras de negocio**: `REGRAS-DE-NEGOCIO.md`
- **Fluxo legislativo**: `docs/FLUXO-LEGISLATIVO.md`
