#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
RES="$ROOT/android/app/src/main/res"
BRAND="$ROOT/brand-kit-export/android-assets"
MANIFEST="$ROOT/android/app/src/main/AndroidManifest.xml"

if [ ! -d "$RES" ]; then
  echo "ERROR: Android project not found at $RES. Run npx cap add android first." >&2
  exit 1
fi
if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: AndroidManifest.xml not found at $MANIFEST." >&2
  exit 1
fi
for required in ic_launcher.xml ic_launcher_round.xml colors.xml; do
  if [ ! -s "$BRAND/$required" ]; then
    echo "ERROR: Required Royal Hires brand resource missing: $BRAND/$required" >&2
    exit 1
  fi
done

# Copy committed pre-rendered brand-kit resources instead of regenerating launcher
# images from the previous emblem. This preserves the approved icon artwork.
mkdir -p "$RES/mipmap-anydpi-v26" "$RES/values"
cp "$BRAND/ic_launcher.xml" "$RES/mipmap-anydpi-v26/ic_launcher.xml"
cp "$BRAND/ic_launcher_round.xml" "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"

# Capacitor creates values/ic_launcher_background.xml. Update that resource when present
# instead of declaring the same resource again in colors.xml (which breaks AAPT merge).
BACKGROUND_XML="$RES/values/ic_launcher_background.xml"
COLORS="$RES/values/colors.xml"
if [ -f "$BACKGROUND_XML" ]; then
  sed -i 's|<color name="ic_launcher_background">[^<]*</color>|<color name="ic_launcher_background">#064E3B</color>|' "$BACKGROUND_XML"
elif [ -f "$COLORS" ] && grep -q 'name="ic_launcher_background"' "$COLORS"; then
  sed -i 's|<color name="ic_launcher_background">[^<]*</color>|<color name="ic_launcher_background">#064E3B</color>|' "$COLORS"
else
  echo "ERROR: No existing ic_launcher_background resource to update." >&2
  exit 1
fi

for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  src="$BRAND/mipmap-$density"
  dst="$RES/mipmap-$density"
  if [ ! -s "$src/ic_launcher.png" ] || [ ! -s "$src/ic_launcher_round.png" ] || [ ! -s "$src/ic_launcher_foreground.png" ]; then
    echo "ERROR: Incomplete launcher resources for $density in $src" >&2
    exit 1
  fi
  mkdir -p "$dst"
  cp "$src/ic_launcher.png" "$dst/ic_launcher.png"
  cp "$src/ic_launcher_round.png" "$dst/ic_launcher_round.png"
  cp "$src/ic_launcher_foreground.png" "$dst/ic_launcher_foreground.png"
done

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

for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  test -s "$RES/mipmap-$density/ic_launcher.png"
  test -s "$RES/mipmap-$density/ic_launcher_round.png"
  test -s "$RES/mipmap-$density/ic_launcher_foreground.png"
done
grep -q 'android:icon="@mipmap/ic_launcher"' "$MANIFEST"
grep -q 'android:roundIcon="@mipmap/ic_launcher_round"' "$MANIFEST"
test -s "$RES/mipmap-anydpi-v26/ic_launcher.xml"
test -s "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"
if [ -f "$BACKGROUND_XML" ]; then
  grep -q 'name="ic_launcher_background"' "$BACKGROUND_XML"
elif [ -f "$COLORS" ]; then
  grep -q 'name="ic_launcher_background"' "$COLORS"
else
  echo "ERROR: Launcher background color resource is missing after branding." >&2
  exit 1
fi
echo "Royal Hires brand-kit launcher resources copied and manifest references verified."
