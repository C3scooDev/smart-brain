#!/bin/sh
# Copies the site (no .git or docs) to the folder the live server reads.
set -e
dst="${SMART_BRAIN_SITE:-$HOME/.local/share/smart-brain/site}"
mkdir -p "$dst"
rsync -a --delete --include='index.html' --include='src/***' --include='assets/***' --exclude='*' "$(dirname "$0")/../" "$dst/"
echo "published to $dst"
