#!/usr/bin/env bash
# =============================================================================
# build-manual.sh — Gera todos os volumes do Manual em PDF
#
# Uso:
#   bash scripts/build-manual.sh
#   bash scripts/build-manual.sh legislativo     # so 1 volume
#
# Saida: docs/manual/dist/*.pdf
# =============================================================================

set -euo pipefail

cd "$(git rev-parse --show-toplevel)" 2>/dev/null || cd "$(dirname "$0")/.."

MANUAL_DIR="docs/manual"
DIST_DIR="$MANUAL_DIR/dist"
CSS="$MANUAL_DIR/pdf-style.css"

FILTRO="${1:-}"

# 1. Gera os markdowns consolidados
if [[ -n "$FILTRO" ]]; then
  node scripts/gerar-manual-pdf.js --only="$FILTRO"
else
  node scripts/gerar-manual-pdf.js
fi

# 2. Converte cada .md do dist/ em .pdf
cd "$DIST_DIR"
mapfile -t MDS < <(ls -1 *.md 2>/dev/null)

if [[ ${#MDS[@]} -eq 0 ]]; then
  echo "Nenhum .md em $DIST_DIR para converter"
  exit 1
fi

echo ""
echo "Convertendo ${#MDS[@]} arquivo(s) em PDF..."
echo ""

for md in "${MDS[@]}"; do
  pdf="${md%.md}.pdf"
  echo "  → $pdf"
  cd "$(git rev-parse --show-toplevel)"
  npx md-to-pdf "$DIST_DIR/$md" --stylesheet "$CSS" 2>&1 | grep -E "started|completed|error" || true
  cd "$DIST_DIR"
done

cd "$(git rev-parse --show-toplevel)"
echo ""
echo "✓ PDFs gerados em $DIST_DIR/:"
ls -lh "$DIST_DIR"/*.pdf 2>/dev/null | awk '{printf "  %s  %s\n", $5, $9}'
