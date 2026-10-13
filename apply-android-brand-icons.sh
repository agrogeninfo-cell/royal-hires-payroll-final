#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
RES="$ROOT/android/app/src/main/res"
ASSETS="$ROOT/brand-assets"
if [ ! -d "$RES" ]; then
  echo "ERROR: Android project not found at $RES. Run npx cap add android first."
  exit 1
fi
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  src="$ASSETS/android-mipmap/mipmap-$density"
  dst="$RES/mipmap-$density"
  [ -d "$src" ] || continue
  mkdir -p "$dst"
  cp "$src/ic_launcher.png" "$dst/ic_launcher.png"
  cp "$src/ic_launcher_round.png" "$dst/ic_launcher_round.png"
done
mkdir -p "$RES/drawable-nodpi" "$RES/mipmap-anydpi-v26" "$RES/values"
cp "$ASSETS/royal-hires-emblem-white.png" "$RES/drawable-nodpi/ic_launcher_foreground.png"
# Native adaptive launcher icons: white emblem on emerald background.
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
echo "Royal Hires launcher branding applied."
