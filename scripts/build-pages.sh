#!/usr/bin/env bash
# Export estático para GitHub Pages. Las rutas de servidor (API, login, proxy) no
# existen en un export estático, así que se apartan durante el build y se restauran
# siempre al terminar, aunque el build falle.
set -euo pipefail

STASH=".pages-stash"
SERVER_ONLY=(src/app/api src/app/login src/proxy.ts)

restore() {
  for p in "${SERVER_ONLY[@]}"; do
    if [ -e "$STASH/$p" ]; then
      mkdir -p "$(dirname "$p")"
      rm -rf "$p"
      mv "$STASH/$p" "$p"
    fi
  done
  rm -rf "$STASH"
}
trap restore EXIT

for p in "${SERVER_ONLY[@]}"; do
  if [ -e "$p" ]; then
    mkdir -p "$STASH/$(dirname "$p")"
    mv "$p" "$STASH/$p"
  fi
done

GITHUB_PAGES=true NEXT_PUBLIC_STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/more-news npm run build
