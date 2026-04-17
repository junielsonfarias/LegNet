#!/usr/bin/env bash
# =============================================================================
# gerar-manual-pdf.sh — Gera o PDF consolidado do Manual do Servidor
#
# Requer: pandoc + xelatex (texlive-xetex no Debian/Ubuntu, MacTeX no macOS,
# MikTeX no Windows com pandoc no PATH).
#
# Uso:
#   bash scripts/gerar-manual-pdf.sh
#
# Saida: docs/manual/manual-servidor.pdf
# =============================================================================

set -euo pipefail

MANUAL_DIR="docs/manual"
OUTPUT="$MANUAL_DIR/manual-servidor.pdf"

cd "$(git rev-parse --show-toplevel)" 2>/dev/null || cd "$(dirname "$0")/.."

if ! command -v pandoc >/dev/null 2>&1; then
  echo "ERRO: pandoc nao instalado."
  echo "  Debian/Ubuntu: sudo apt install pandoc texlive-xetex"
  echo "  macOS:         brew install pandoc && brew install --cask mactex"
  echo "  Windows:       choco install pandoc miktex"
  exit 1
fi

# Ordena capitulos numericamente
CHAPTERS=$(ls "$MANUAL_DIR"/[0-9][0-9]-*.md 2>/dev/null | sort)

if [ -z "$CHAPTERS" ]; then
  echo "ERRO: nenhum capitulo encontrado em $MANUAL_DIR/"
  exit 1
fi

echo "Capitulos encontrados:"
echo "$CHAPTERS" | sed 's/^/  - /'
echo ""
echo "Gerando $OUTPUT..."

# shellcheck disable=SC2086
pandoc $CHAPTERS \
  -o "$OUTPUT" \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=3 \
  --resource-path="$MANUAL_DIR" \
  -V geometry:margin=2cm \
  -V mainfont="DejaVu Sans" \
  -V monofont="DejaVu Sans Mono" \
  -V documentclass=report \
  -V linkcolor=blue \
  -V urlcolor=blue \
  -V toccolor=black \
  --highlight-style=tango \
  --metadata title="Manual do Servidor — Sistema Legislativo" \
  --metadata author="Câmara Municipal" \
  --metadata date="$(date +%Y-%m-%d)"

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo "✓ PDF gerado: $OUTPUT ($SIZE)"
