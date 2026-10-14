#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RES="$ROOT/android/app/src/main/res"
ASSETS="$ROOT/brand-assets"
MANIFEST="$ROOT/android/app/src/main/AndroidManifest.xml"
EMBLEM="$ASSETS/royal-hires-emblem-white.png"

if [ ! -d "$RES" ]; then
  echo "ERROR: Android project not found at $RES. Run npx cap add android first." >&2
  exit 1
fi
if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: AndroidManifest.xml not found at $MANIFEST." >&2
  exit 1
fi
if [ ! -s "$EMBLEM" ]; then
  echo "ERROR: White Royal Hires emblem missing at $EMBLEM." >&2
  exit 1
fi

# Build density icons from the Royal Hires emblem rather than template defaults.
if command -v magick >/dev/null 2>&1; then
  IMAGE_TOOL="magick"
elif command -v convert >/dev/null 2>&1; then
  IMAGE_TOOL="convert"
else
  echo "ERROR: ImageMagick (magick or convert) is required to generate branded launcher icons." >&2
  exit 1
fi

mkdir -p "$RES/drawable-nodpi" "$RES/mipmap-anydpi-v26" "$RES/values"
cp "$EMBLEM" "$RES/drawable-nodpi/ic_launcher_foreground.png"

for spec in "mdpi 48 32" "hdpi 72 48" "xhdpi 96 64" "xxhdpi 144 96" "xxxhdpi 192 128"; do
  read -r density size emblem_size <<< "$spec"
  dst="$RES/mipmap-$density"
  mkdir -p "$dst"
  tmp_emblem="$(mktemp --suffix=.png)"
  trap 'rm -f "$tmp_emblem"' EXIT
  if [ "$IMAGE_TOOL" = "magick" ]; then
    magick "$EMBLEM" -resize "${emblem_size}x${emblem_size}" "$tmp_emblem"
    magick -size "${size}x${size}" xc:"#0B4D3B" "$tmp_emblem" -gravity center -composite "$dst/ic_launcher.png"
  else
    convert "$EMBLEM" -resize "${emblem_size}x${emblem_size}" "$tmp_emblem"
    convert -size "${size}x${size}" xc:"#0B4D3B" "$tmp_emblem" -gravity center -composite "$dst/ic_launcher.png"
  fi
  cp "$dst/ic_launcher.png" "$dst/ic_launcher_round.png"
  rm -f "$tmp_emblem"
  trap - EXIT
done

cat > "$RES/mipmap-anydpi-v26/ic_launcher.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
XML
cat > "$RES/mipmap-anydpi-v26/ic_launcher_round.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
XML

COLORS="$RES/values/colors.xml"
if [ -f "$COLORS" ]; then
  if grep -q 'name="ic_launcher_background"' "$COLORS"; then
    sed -i 's|<color name="ic_launcher_background">[^<]*</color>|<color name="ic_launcher_background">#0B4D3B</color>|' "$COLORS"
  else
    sed -i 's|</resources>|    <color name="ic_launcher_background">#0B4D3B</color>\n</resources>|' "$COLORS"
  fi
else
  printf '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B4D3B</color>\n</resources>\n' > "$COLORS"
fi

if grep -q 'android:icon=' "$MANIFEST"; then
  sed -i 's|android:icon="[^"]*"|android:icon="@mipmap/ic_launcher"|' "$MANIFEST"
else
  sed -i 's|<application|<application android:icon="@mipmap/ic_launcher"|' "$MANIFEST"
fi
if grep -q 'android:roundIcon=' "$MANIFEST"; then
  sed -i 's|android:roundIcon="[^"]*"|android:roundIcon="@mipmap/ic_launcher_round"|' "$MANIFEST"
else
  sed -i 's|android:icon="@mipmap/ic_launcher"|android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"|' "$MANIFEST"
fi

rm -f "$RES/values/ic_launcher_background.xml"
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  test -s "$RES/mipmap-$density/ic_launcher.png"
  test -s "$RES/mipmap-$density/ic_launcher_round.png"
done
grep -q 'android:icon="@mipmap/ic_launcher"' "$MANIFEST"
grep -q 'android:roundIcon="@mipmap/ic_launcher_round"' "$MANIFEST"
test -s "$RES/mipmap-anydpi-v26/ic_launcher.xml"
test -s "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"
echo "Royal Hires launcher icons generated and manifest references verified."
