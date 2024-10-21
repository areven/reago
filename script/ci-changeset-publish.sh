#!/bin/bash

set -exo pipefail
if [[ -z "$CI" ]]; then
  exit 1
fi

npm run build --workspaces --if-present
npx changeset publish
