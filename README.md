# Wisp

A drop-down control panel for Windows 10/11: quick toggles, media, calendar and notes,
system stats, clipboard history, app launcher, wallpaper picker and power actions —
opened with **Ctrl + Alt + Space** or by pushing the mouse to the top edge of the screen.

## Download

1. Download `Wisp-windows.zip` from the
   [latest release](https://github.com/abhi331-ui/wisk/releases/latest).
2. Right-click it → **Extract All**, open the `Wisp` folder and run `Wisp.exe`. No Python needed.

Wisp is not code-signed, so Windows SmartScreen or your browser may warn about it
("unrecognized app" / "may be dangerous"). That is a reputation warning for new, unsigned
programs, not a virus detection. The release is built from this repository's source by
GitHub Actions; compare the zip with the `.sha256` file in the release to verify it.

## Run from source

1. Install Python 3.11 or 3.12 from python.org (tick "Add python.exe to PATH").
2. Double-click `run.bat`. The first run installs the dependencies.

`build_exe.bat` builds `dist\Wisp.exe` locally. Every push is also built on Windows by
GitHub Actions. To publish a release, run the Build workflow manually (Actions → Build → Run workflow) with a tag such as `v1.0.1`, or push a `v*` tag.

See [README.txt](README.txt) for the full user guide, settings and troubleshooting.

## Development

```
pip install -r requirements.txt pyflakes
pyflakes wisp.py tests
QT_QPA_PLATFORM=offscreen python tests/smoke.py   # opens every tab headlessly
```
