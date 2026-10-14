"""Small, repeatable tweaks to the generated Capacitor Android project.

Run from apps/mobile after `cap add android` (the bootstrap workflow does this):
- the launcher name is "Purrpose" in English and «پرپوز» on Persian phones;
- versionCode / versionName come from the build (VERSION_CODE / VERSION_NAME env),
  so every CI build installs as an update of the previous one.
"""
import pathlib, re, sys

root = pathlib.Path('android/app')
res = root / 'src/main/res'

fa = res / 'values-fa'
fa.mkdir(parents=True, exist_ok=True)
(fa / 'strings.xml').write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources>\n'
    '    <string name="app_name">پرپوز</string>\n'
    '    <string name="title_activity_main">پرپوز</string>\n'
    '</resources>\n',
    encoding='utf-8',
)

gradle = root / 'build.gradle'
src = gradle.read_text(encoding='utf-8')
new = re.sub(r'versionCode\s+\d+', 'versionCode((System.getenv("VERSION_CODE") ?: "1").toInteger())', src, count=1)
new = re.sub(r'versionName\s+"[^"]*"', 'versionName(System.getenv("VERSION_NAME") ?: "0.1.0")', new, count=1)
if new == src:
    sys.exit('customize-android: could not find versionCode/versionName in app/build.gradle')
gradle.write_text(new, encoding='utf-8')
print('customize-android: app name (fa) and CI version numbers set')
