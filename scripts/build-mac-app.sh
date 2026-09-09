#!/bin/bash
# Builds सर्राफ.app — a native window around the same web app the phone runs.
#
# No Xcode project, no developer account, no fee: swiftc and iconutil ship with
# the Command Line Tools. The app loads the live site, so pushing to GitHub
# Pages updates the Mac app too; nothing here has to be rebuilt for a content
# change. Rebuild only when Sarafa.swift itself changes.
set -euo pipefail
cd "$(dirname "$0")/.."

APP="dist/सर्राफ.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

# Icon: the same gold tarazu the phone shows, at every size macOS asks for.
ICONSET="$(mktemp -d)/AppIcon.iconset"
mkdir -p "$ICONSET"
for size in 16 32 64 128 256 512; do
  sips -z $size $size icons/icon-512.png --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  sips -z $double $double icons/icon-512.png --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>सर्राफ</string>
  <key>CFBundleDisplayName</key><string>सर्राफ</string>
  <key>CFBundleIdentifier</key><string>in.neuralq.sarafa</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>Sarafa</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

swiftc -O -target arm64-apple-macosx12.0 \
  -o "$APP/Contents/MacOS/Sarafa" scripts/mac/Sarafa.swift

# Ad-hoc signature: enough for this Mac and any Mac the folder is copied to,
# without an Apple Developer account. Gatekeeper still asks once on first open.
codesign --force --deep --sign - "$APP"

echo "built $APP"
