WISP — drop-down control panel for Windows 10/11
================================================

1. SETUP (one time)
   1. Install Python 3.11 or 3.12 from python.org (tick "Add python.exe to PATH").
   2. Unzip this folder anywhere, e.g. D:\Apps\Wisp
   3. Double-click run.bat. The first run installs everything (about 2 minutes).

2. OPEN THE PANEL
   - Press Ctrl + Alt + Space
   - Or push your mouse to the top-centre edge of the screen
   - Or click the green wisp icon in the system tray
   - Esc or clicking outside closes it. Ctrl+1 to Ctrl+7 jump between tabs.

3. TABS
   1. Controls  : Wi-Fi, Bluetooth, Audio mute, Night light, Dark mode,
                  volume and brightness sliders, now-playing card with album art
   2. Today     : clock, date, calendar, weather, battery, auto-saved notes
   3. Stats     : CPU / GPU / RAM rings, disk, live network speed, uptime,
                  top 5 apps by RAM, internet speed test
   4. Clipboard : history of text and images, filters (All / Text / Images / Links),
                  search, preview, copy back, delete
   5. Apps      : every Start menu app (including Store apps), type and press Enter
   6. Wallpaper : pick a folder, click a picture to set it, Random button
   7. Power     : Lock, Sleep, Sign out, Restart, Shut down
                  (the last three need a second click to confirm)

4. START WITH WINDOWS
   Right-click the tray icon, then tick "Start with Windows".

5. SETTINGS
   Right-click the tray icon, then "Edit settings". This opens config.json:
   - "hotkey"               : e.g. "ctrl+alt+space", "win+alt+w", "alt+`", "ctrl+shift+f12"
   - "hot_edge"             : true/false (open by touching the top edge)
   - "wallpaper_folder"     : default folder for the Wallpaper tab
   - "accent"               : panel colour, e.g. "#a6e3a1" (green), "#89b4fa" (blue)
   - "night_light_strength" : 0.0 to 1.0
   - "panel_width" / "panel_height"
   Restart Wisp after editing (tray, then Quit, then run.bat).

6. MAKE A STANDALONE .EXE (optional)
   Double-click build_exe.bat. You get dist\Wisp.exe, which runs without Python.

7. TROUBLESHOOTING
   - Errors are written to %APPDATA%\Wisp\wisp.log.
   - If config.json has a mistake, Wisp starts with defaults and renames the
     broken file to config.invalid.json so you can fix it.
   - "Hotkey is taken"  : change "hotkey" in config.json.
   - Brightness slider missing : your monitor does not support DDC/CI.
                          This is normal on some desktop monitors.
   - Night light says "Blocked by driver" : some GPU drivers block colour ramps.
   - Wi-Fi/Bluetooth tiles say "Open settings" : the winrt packages did not install.
                          Delete the .venv folder and run run.bat again.
   - Data is stored in %APPDATA%\Wisp (clipboard history, notes, config).
