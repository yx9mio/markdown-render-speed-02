#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
for n in 1 2 3; do
  node --import ./validation/local-preload.mjs main.ts 2> "validation/raw-$n.json"
  node validation/verify-output.mjs > "validation/output-$n.json"
  node validation/empty.mjs 2> "validation/empty-$n.json"
done
node validation/bench.mjs
