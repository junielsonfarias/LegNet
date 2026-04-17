# Manual do Servidor — Sistema Legislativo

> **Público-alvo:** servidores da Câmara Municipal (Secretaria Legislativa, Editor, Operador, Auxiliar Legislativo, Administrador)
> **Formato:** tutorial passo-a-passo
> **Versão:** 1.0 · 17/04/2026

---

## 📑 Índice

| # | Capítulo | Status | Público |
|---|---|---|---|
| 00 | [Introdução](./00-introducao.md) | ✅ | Todos |
| 01 | [Primeiros Passos — Login, navegação e perfil](./01-primeiros-passos.md) | ✅ | Todos |
| 02 | [Protocolo de Documentos](./02-protocolo.md) | ✅ | Secretaria, Admin |
| 03 | [Proposições — criação, edição, tramitação, emendas](./03-proposicoes.md) | ✅ | Secretaria, Auxiliar, Editor |
| 04 | Pareceres de Comissão | 🔜 | Secretaria, Auxiliar |
| 05 | Comissões e Reuniões | 🔜 | Secretaria, Auxiliar |
| 06 | [Sessões Legislativas — agendamento, pauta, ata](./06-sessoes.md) | ✅ | Secretaria, Operador |
| 07 | [Painel Operador e Votações — tempo real](./07-painel-operador.md) | ✅ | Operador, Secretaria |
| 08 | Publicações, Normas Jurídicas e Notícias | 🔜 | Editor |
| 09 | Transparência (PNTP) — despesas, contratos, folha, etc. | 🔜 | Editor, Admin |
| 10 | E-SIC e Ouvidoria | 🔜 | Editor, Secretaria |
| 11 | Participação Cidadã — consultas e sugestões | 🔜 | Editor |
| 12 | Relatórios e Analytics | 🔜 | Admin |
| 13 | Configurações Administrativas (ADMIN) | 🔜 | Admin |
| 14 | Glossário e FAQ | 🔜 | Todos |

> **Legenda:** ✅ Capítulo completo · 🔜 Em produção · 📝 Precisa revisão

---

## 🖼️ Sobre as imagens

Os capítulos contêm **placeholders** no formato:

```markdown
![Descrição da tela](./images/XX-YY-nome.png)
```

Para adicionar uma imagem:

1. Tire um print da tela mencionada (ferramenta de sua preferência — Win+Shift+S no Windows, Cmd+Shift+4 no Mac)
2. Salve em `docs/manual/images/` com o nome indicado no placeholder
3. Comite junto com o manual

**Dica de captura**: use resolução mínima de 1366×768 e faça zoom em 100% do navegador. Evite informações sensíveis reais nos prints (use dados de seed/teste).

---

## 📄 Como gerar o PDF

O manual é escrito em Markdown. Para gerar o PDF consolidado, há 3 opções:

### Opção 1 — Pandoc + LaTeX (melhor qualidade)

Requer instalação de [pandoc](https://pandoc.org/installing.html) e um engine LaTeX (`texlive` ou `MikTeX`).

```bash
cd docs/manual
pandoc README.md 00-introducao.md 01-primeiros-passos.md 02-protocolo.md \
  -o manual-servidor.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=3 \
  -V geometry:margin=2cm \
  -V mainfont="Arial" \
  -V monofont="Consolas" \
  -V documentclass=report \
  --highlight-style=tango
```

### Opção 2 — md-to-pdf (mais simples, Node.js)

```bash
npm install -g md-to-pdf
cd docs/manual
cat README.md 00-*.md 01-*.md 02-*.md | md-to-pdf > manual-servidor.pdf
```

### Opção 3 — Typora / Obsidian / VS Code

Abra os arquivos `.md` no editor, use **Arquivo → Exportar como PDF**. Funciona para um arquivo por vez — consolide antes unindo os markdowns.

### Script pronto

Há um script em `scripts/gerar-manual-pdf.sh` que faz o pandoc com defaults corretos (ver capítulo quando implementado).

---

## 🎯 Como usar este manual

- **Treinamento de novo servidor**: capítulos 00 → 02 (tudo) + capítulos específicos do cargo dele
- **Referência rápida**: busque pelo termo no PDF (Ctrl+F)
- **Dúvida sobre processo**: veja capítulos 03-07 (fluxo legislativo)
- **Suporte a cidadão**: capítulos 10-11 (e-SIC, ouvidoria, participação)

---

## ✏️ Convenções usadas

| Marcador | Significado |
|---|---|
| `> 💡 Dica` | Sugestão para agilizar o trabalho |
| `> ⚠️ Atenção` | Cuidado — ação sensível ou irreversível |
| `> ℹ️ Nota` | Esclarecimento adicional |
| `> 🔒 Requer permissão` | Ação restrita a roles específicos |
| **Nome do botão** | Em negrito, como aparece na tela |
| `URL/Rota` | Em código, para rotas ou atalhos de teclado |
| *item de menu* | Em itálico, para itens de menu lateral |

---

## 📧 Suporte

- **Documentação técnica** (para TI): `docs/` na raiz do repositório
- **Regras de negócio**: `REGRAS-DE-NEGOCIO.md`
- **Fluxo legislativo**: `docs/FLUXO-LEGISLATIVO.md`
- **Contato administrador**: *[preencher com e-mail de suporte]*
