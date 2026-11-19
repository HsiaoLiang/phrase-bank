#!/bin/bash
# Build the app into one self-contained HTML file and copy it to the repo root,
# which is what GitHub Pages serves.
set -e
cd "$(dirname "$0")/.."
rm -rf dist .parcel-cache
pnpm exec parcel build index.html --dist-dir dist --no-source-maps
node scripts/inline.mjs dist/index.html ../index.html
echo "Wrote ../index.html ($(du -h ../index.html | cut -f1))"
