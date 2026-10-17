#!/usr/bin/env python3
"""Register the Royal Pay custom auth callback on generated Capacitor Android projects."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

if len(sys.argv) != 2:
    raise SystemExit("Usage: configure-android-auth-deep-link.py <AndroidManifest.xml>")

manifest_path = Path(sys.argv[1])
if not manifest_path.is_file():
    raise SystemExit(f"Android manifest not found: {manifest_path}")

ANDROID = "{http://schemas.android.com/apk/res/android}"
tree = ET.parse(manifest_path)
root = tree.getroot()
target_activity = None

for activity in root.iter("activity"):
    for intent_filter in activity.findall("intent-filter"):
        actions = {item.get(ANDROID + "name") for item in intent_filter.findall("action")}
        categories = {item.get(ANDROID + "name") for item in intent_filter.findall("category")}
        if "android.intent.action.MAIN" in actions and "android.intent.category.LAUNCHER" in categories:
            target_activity = activity
            break
    if target_activity is not None:
        break

if target_activity is None:
    raise SystemExit("Could not find the Capacitor launcher activity in AndroidManifest.xml")

for intent_filter in target_activity.findall("intent-filter"):
    for data in intent_filter.findall("data"):
        if (
            data.get(ANDROID + "scheme") == "lk.royalhires.payroll"
            and data.get(ANDROID + "host") == "auth"
            and data.get(ANDROID + "pathPrefix") == "/callback"
        ):
            print("Royal Pay auth callback deep link is already configured.")
            raise SystemExit(0)

intent_filter = ET.SubElement(target_activity, "intent-filter")
ET.SubElement(intent_filter, "action", {ANDROID + "name": "android.intent.action.VIEW"})
ET.SubElement(intent_filter, "category", {ANDROID + "name": "android.intent.category.DEFAULT"})
ET.SubElement(intent_filter, "category", {ANDROID + "name": "android.intent.category.BROWSABLE"})
ET.SubElement(intent_filter, "data", {
    ANDROID + "scheme": "lk.royalhires.payroll",
    ANDROID + "host": "auth",
    ANDROID + "pathPrefix": "/callback",
})

ET.register_namespace("android", "http://schemas.android.com/apk/res/android")
tree.write(manifest_path, encoding="utf-8", xml_declaration=True)
print("Registered lk.royalhires.payroll://auth/callback in AndroidManifest.xml.")
