#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="dist"

rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

cp -R public "${OUTPUT_DIR}/public"
cp index.html "${OUTPUT_DIR}/index.html"

echo "Build complete: ${OUTPUT_DIR}/"
