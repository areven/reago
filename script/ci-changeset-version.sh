#!/bin/bash

set -exo pipefail
if [[ -z "$CI" ]]; then
  exit 1
fi

# `changeset` expects an upper-case CHANGELOG.md file
if ! [ -f .NPMRC ]; then
  # case-sensitive fs
  find . -type f -name "changelog.md" -execdir mv {} CHANGELOG.md \;
fi

# consume changesets and set new versions
npx changeset version

# sync the lock file
npm install --save

# force lower-case file name for changelog.md
if ! [ -f .NPMRC ]; then
  # case-sensitive fs
  find . -type f -name "CHANGELOG.md" -execdir cp {} changelog.md \;
  git config --global core.excludesfile ~/.gitignore
  echo "CHANGELOG.md" >> ~/.gitignore
else
  # case-insensitive fs
  find . -type f -name "CHANGELOG.md" -execdir mv {} changelog.md \;
fi
