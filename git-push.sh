#!/usr/bin/env bash
set -euo pipefail

# Simple helper to: status -> add -> commit -> push
# Usage:
#   ./git-push.sh "mensaje de commit"
# or:
#   ./git-push.sh   # will prompt for message

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: este directorio no es un repositorio git." >&2
  exit 1
fi

echo "== git status =="
git status

echo

echo "== git add -A (todos los cambios) =="
git add -A

# Abort early if nothing staged
if git diff --cached --quiet; then
  echo "No hay cambios staged. Nada para commitear." >&2
  exit 0
fi

msg="${1:-}"
if [[ -z "${msg}" ]]; then
  read -r -p "Mensaje de commit: " msg
fi

if [[ -z "${msg}" ]]; then
  echo "Error: mensaje de commit vacío." >&2
  exit 1
fi

echo "== git commit =="
git commit -m "$msg"

echo "== git push =="
# push to the upstream if set, otherwise default remote/branch
if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  git push
else
  current_branch="$(git branch --show-current)"
  git push -u origin "$current_branch"
fi

echo "Listo." 
