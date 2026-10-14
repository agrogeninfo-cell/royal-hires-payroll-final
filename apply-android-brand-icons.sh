#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
for required in ic_launcher.xml ic_launcher_round.xml colors.xml ic_launcher_foreground.png; do
  if [ ! -s "$BRAND/$required" ]; then
    echo "ERROR: Required Royal Hires brand resource missing: $BRAND/$required" >&2
    exit 1
  fi
done

# Copy the approved, pre-rendered brand-kit icon resources instead of regenerating
# icons from an older emblem. This keeps the CI APK aligned with the committed kit.
mkdir -p "$RES/drawable-nodpi" "$RES/mipmap-anydpi-v26" "$RES/values"
cp "$BRAND/ic_launcher_foreground.png" "$RES/drawable-nodpi/ic_launcher_foreground.png"
cp "$BRAND/ic_launcher.xml" "$RES/mipmap-anydpi-v26/ic_launcher.xml"
cp "$BRAND/ic_launcher_round.xml" "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"
cp "$BRAND/colors.xml" "$RES/values/colors.xml"

for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  src="$BRAND/mipmap-$density"
  dst="$RES/mipmap-$density"
  if [ ! -s "$src/ic_launcher.png" ] || [ ! -s "$src/ic_launcher_round.png" ]; then
    echo "ERROR: Incomplete launcher icons for $density in $src" >&2
    exit 1
  fi
  mkdir -p "$dst"
  cp "$src/ic_launcher.png" "$dst/ic_launcher.png"
  cp "$src/ic_launcher_round.png" "$dst/ic_launcher_round.png"
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
done
grep -q 'android:icon="@mipmap/ic_launcher"' "$MANIFEST"
grep -q 'android:roundIcon="@mipmap/ic_launcher_round"' "$MANIFEST"
test -s "$RES/mipmap-anydpi-v26/ic_launcher.xml"
test -s "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"
echo "Royal Hires brand-kit launcher resources copied and manifest references verified."
