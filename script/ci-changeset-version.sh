#!/bin/bash

set -exo pipefail
if [[ -z "$CI" ]]; then
  exit 1
fi

npx changeset version

if ! [ -f .NPMRC ]; then
  # case-sensitive fs
  find . -type f -iname "CHANGELOG.md" -execdir cp {} changelog.md \;
  git config --global core.excludesfile ~/.gitignore
  echo "CHANGELOG.md" >> ~/.gitignore
else
  # case-insensitive fs
  find . -type f -iname "CHANGELOG.md" -execdir mv {} changelog.md \;
fi
