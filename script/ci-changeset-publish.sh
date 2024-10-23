#!/bin/bash

set -exo pipefail
if [[ -z "$CI" ]]; then
  exit 1
fi

# build everything
npm run build --workspaces --if-present

# publish changed packages
npx changeset publish

# `changesets/action` expects an upper-case CHANGELOG.md file
if ! [ -f .NPMRC ]; then
  # case-sensitive fs
  find . -type f -name "changelog.md" -execdir cp {} CHANGELOG.md \;
  git config --global core.excludesfile ~/.gitignore
  echo "CHANGELOG.md" >> ~/.gitignore
fi
