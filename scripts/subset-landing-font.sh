#!/usr/bin/env sh
# Rebuild landing/assets/inter-var.woff2 as a Latin subset of the bundled Inter variable font.
#
# The full font is 351 KB and dominates the landing page's Largest Contentful Paint. The subset
# keeps every glyph the page uses, the whole 100-900 weight axis, and the OpenType features the
# site relies on, at roughly 65 KB. The source stays untouched at public/fonts/inter-var.woff2,
# which the extension bundle ships as-is.
#
# The unicode list is deliberately a little wider than today's copy: Latin-1, Latin Extended-A,
# common punctuation, currency, and arrows. If new copy needs a glyph outside it, add the range
# here and rerun. Inter is OFL with no Reserved Font Name, so subsetting needs no rename; keep
# landing/assets/INTER-LICENSE.txt next to the file.
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
source_font="$root/public/fonts/inter-var.woff2"
target_font="$root/landing/assets/inter-var.woff2"
unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+02C6,U+02DA,U+02DC,U+2007-2011,U+2013-2014,U+2018-201F,U+2020-2022,U+2026,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2116,U+2122,U+2190-2199,U+2212,U+2264-2265"
features="kern,liga,calt,ccmp,locl,mark,mkmk,rclt,rlig"

if command -v pyftsubset >/dev/null 2>&1; then
  pyftsubset "$source_font" \
    --unicodes="$unicodes" \
    --layout-features="$features" \
    --flavor=woff2 \
    --output-file="$target_font"
elif command -v uvx >/dev/null 2>&1; then
  uvx --from 'fonttools[woff]' fonttools subset "$source_font" \
    --unicodes="$unicodes" \
    --layout-features="$features" \
    --flavor=woff2 \
    --output-file="$target_font"
else
  echo "Need pyftsubset (pip install 'fonttools[woff]') or uvx to subset the font." >&2
  exit 1
fi

printf '%s: %s bytes\n' "${target_font#"$root"/}" "$(wc -c <"$target_font" | tr -d ' ')"
