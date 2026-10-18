#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

mkdir -p dist
rm -rf dist/*

# Compile schema locally if missing (required for direct git clone installation)
test -f schemas/gschemas.compiled || glib-compile-schemas schemas

if command -v gnome-extensions >/dev/null 2>&1; then
  gnome-extensions pack --extra-source=calendar-data.js --force --out-dir=dist
  mv dist/nepali-date-minimal@itx-prash.shell-extension.zip dist/nepali-date-minimal@itx-prash.zip
else
  zip -q dist/nepali-date-minimal@itx-prash.zip \
    extension.js metadata.json calendar-data.js prefs.js \
    schemas/org.gnome.shell.extensions.nepali-date-minimal.gschema.xml
fi

echo "Successfully built extension packages in dist/:"
ls -lh dist/*.zip
