#!/bin/sh
set -e

# Install Floating UI
npm install --no-save --silent @floating-ui/dom

# Build with esbuild + aggressive minify
npx esbuild <<'EOF' --bundle --minify --format=esm --outfile=../js/libs/floating-ui-tooltip.js
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
export { computePosition, flip, shift, offset };
EOF

# Cleanup
npm uninstall --no-save --silent @floating-ui/dom
rm -rf node_modules/
