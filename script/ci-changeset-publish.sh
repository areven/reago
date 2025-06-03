#!/bin/bash

set -exo pipefail
if [[ -z "$CI" ]]; then
  exit 1
fi

# use the root readme for `reago`
git config --global core.excludesfile ~/.gitignore
echo "readme.md" >> ~/.gitignore
cp readme.md package/reago/readme.md

# copy the license to all packages
echo "license.md" >> ~/.gitignore
find package -mindepth 1 -maxdepth 1 -type d -exec cp license.md {}/license.md \;

# build everything
npm run build --workspaces --if-present

# publish changed packages
npx changeset publish

# `changesets/action` expects an upper-case CHANGELOG.md file
if ! [ -f .NPMRC ]; then
  # case-sensitive fs
  find . -type f -name "changelog.md" -execdir cp {} CHANGELOG.md \;
  echo "CHANGELOG.md" >> ~/.gitignore
fi
