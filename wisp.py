"""
Wisp — a drop-down control panel for Windows.

Tabs: Controls · Today · Stats · Clipboard · Apps · Wallpaper · Power
Open with the hotkey (default Ctrl+Alt+Space) or by pushing the mouse to the
top-centre edge of the screen. Esc or clicking away closes it.

Runs on Windows 10/11 with Python 3.10+. On other systems it opens with
Windows-only features switched off (useful for UI work).
"""
from __future__ import annotations

import asyncio

import ctypes
import datetime as dt
import hashlib
import json
import os
import platform
import random
import re
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

import psutil
from PySide6.QtCore import (QEasingCurve, QFileInfo, QObject, QPoint, QPointF,
                            QPropertyAnimation, QRectF, QSize, Qt, QTimer,
                            Signal, Slot)
from PySide6.QtGui import (QAction, QColor, QCursor, QFont, QGuiApplication,
                           QIcon, QImage, QKeySequence, QPainter, QPen,
                           QPixmap, QShortcut)
from PySide6.QtNetwork import QLocalServer, QLocalSocket
from PySide6.QtWidgets import (QApplication, QCalendarWidget, QFileDialog,
                               QFileIconProvider, QFrame,
                               QGraphicsDropShadowEffect, QGridLayout,
                               QHBoxLayout, QLabel, QLineEdit, QListWidget,
                               QListWidgetItem, QMenu, QPlainTextEdit,
                               QProgressBar, QPushButton, QScrollArea,
                               QSlider, QStackedWidget,
                               QSystemTrayIcon, QVBoxLayout, QWidget)

APP_NAME = "Wisp"
IS_WIN = sys.platform == "win32"
APP_DIR = Path(os.getenv("APPDATA") or Path.home() / ".config") / APP_NAME
CLIP_DIR = APP_DIR / "clips"
CONFIG_PATH = APP_DIR / "config.json"
APP_DIR.mkdir(parents=True, exist_ok=True)
CLIP_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_CONFIG = {
    "hotkey": "ctrl+alt+space",
    "hot_edge": True,             # open by pushing the mouse to the top-centre edge
    "hot_edge_delay_ms": 250,
    "wallpaper_folder": str(Path.home() / "Pictures"),
    "clipboard_max": 100,
    "night_light_strength": 0.5,  # 0..1
    "panel_width": 940,
    "panel_height": 440,
    "accent": "#a6e3a1",
}


def load_config() -> dict:
    cfg = dict(DEFAULT_CONFIG)
    try:
        cfg.update(json.loads(CONFIG_PATH.read_text(encoding="utf-8")))
    except Exception:
        pass
    save_config(cfg)
    return cfg


def save_config(cfg: dict) -> None:
    try:
        CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    except Exception:
        pass


CFG = load_config()
ACCENT = CFG.get("accent", "#a6e3a1")

# ───────────────────────────── background helpers ─────────────────────────────


class Dispatcher(QObject):
    """Runs callbacks on the GUI thread for results produced on worker threads."""
    sig = Signal(object, object)

    def __init__(self):
        super().__init__()
        self.sig.connect(self._run, Qt.QueuedConnection)

    @Slot(object, object)
    def _run(self, fn, arg):
        try:
            fn(arg)
        except Exception as e:  # never let a callback kill the app
            print("callback error:", e)


DISPATCH: Dispatcher | None = None


def run_bg(fn, cb=None, *args):
    """Run fn(*args) on a thread; deliver result (or the Exception) to cb on the GUI thread."""
    def job():
        try:
            res = fn(*args)
        except Exception as e:
            res = e
        if cb is not None and DISPATCH is not None:
            DISPATCH.sig.emit(cb, res)
    threading.Thread(target=job, daemon=True).start()


def run_async(coro_fn, cb=None, *args):
    run_bg(lambda: asyncio.run(coro_fn(*args)), cb)


def human_bytes(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(n) < 1024 or unit == "TB":
            return f"{n:.0f} {unit}" if unit in ("B", "KB") else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def human_duration(seconds: float) -> str:
    seconds = int(seconds)
    d, r = divmod(seconds, 86400)
    h, r = divmod(r, 3600)
    m, _ = divmod(r, 60)
    if d:
        return f"{d} d {h} h"
    return f"{h} h {m} m"


def no_window_flags() -> int:
    return 0x08000000 if IS_WIN else 0  # CREATE_NO_WINDOW


def run_cmd(args: list[str], timeout=15) -> str:
    out = subprocess.run(args, capture_output=True, text=True, timeout=timeout,
                         creationflags=no_window_flags(), errors="ignore")
    return out.stdout


# ───────────────────────────── Windows integration ────────────────────────────

if IS_WIN:
    import winreg
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32
    gdi32 = ctypes.windll.gdi32

# WinRT (Wi-Fi/Bluetooth radios, media session). Optional.
Radio = MediaManager = None
if IS_WIN:
    try:
        from winrt.windows.devices.radios import Radio  # type: ignore
    except Exception:
        try:
            from winsdk.windows.devices.radios import Radio  # type: ignore
        except Exception:
            Radio = None
    try:
        from winrt.windows.media.control import \
            GlobalSystemMediaTransportControlsSessionManager as MediaManager  # type: ignore
    except Exception:
        try:
            from winsdk.windows.media.control import \
                GlobalSystemMediaTransportControlsSessionManager as MediaManager  # type: ignore
        except Exception:
            MediaManager = None

try:
    import screen_brightness_control as sbc  # type: ignore
except Exception:
    sbc = None


class Win:
    """Thin wrappers around Windows features. Every call is safe on other OSes."""

    # ---- radios (Wi-Fi / Bluetooth) ----
    RADIO_WIFI, RADIO_BT = 1, 3
    STATE_ON, STATE_OFF = 1, 2

    @staticmethod
    async def radio_states() -> dict:
        if Radio is None:
            return {}
        try:
            await Radio.request_access_async()
        except Exception:
            pass
        radios = await Radio.get_radios_async()
        res = {}
        for r in radios:
            res[int(r.kind)] = int(r.state) == Win.STATE_ON
        return res

    @staticmethod
    async def set_radio(kind: int, on: bool) -> bool:
        if Radio is None:
            return False
        await Radio.request_access_async()
        radios = await Radio.get_radios_async()
        ok = False
        for r in radios:
            if int(r.kind) == kind:
                state_enum = type(r.state)
                await r.set_state_async(state_enum(Win.STATE_ON if on else Win.STATE_OFF))
                ok = True
        return ok

    @staticmethod
    def wifi_ssid() -> str:
        if not IS_WIN:
            return ""
        out = run_cmd(["netsh", "wlan", "show", "interfaces"])
        m = re.search(r"^\s*SSID\s*:\s*(.+)$", out, re.M)
        return m.group(1).strip() if m else ""

    # ---- dark mode ----
    _THEME_KEY = r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"

    @staticmethod
    def dark_mode() -> bool:
        if not IS_WIN:
            return True
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, Win._THEME_KEY) as k:
                return winreg.QueryValueEx(k, "AppsUseLightTheme")[0] == 0
        except Exception:
            return False

    @staticmethod
    def set_dark_mode(dark: bool):
        if not IS_WIN:
            return
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, Win._THEME_KEY, 0, winreg.KEY_SET_VALUE) as k:
            val = 0 if dark else 1
            winreg.SetValueEx(k, "AppsUseLightTheme", 0, winreg.REG_DWORD, val)
            winreg.SetValueEx(k, "SystemUsesLightTheme", 0, winreg.REG_DWORD, val)
        res = wintypes.DWORD()
        user32.SendMessageTimeoutW(0xFFFF, 0x001A, 0, "ImmersiveColorSet", 0x0002, 200, ctypes.byref(res))

    # ---- night light (warm gamma ramp — works on any GPU that allows ramps) ----
    @staticmethod
    def set_warm(strength: float):
        """strength 0 = normal, 1 = very warm."""
        if not IS_WIN:
            return False
        strength = max(0.0, min(1.0, strength))
        g_scale = 1.0 - 0.25 * strength
        b_scale = 1.0 - 0.55 * strength
        ramp = (wintypes.WORD * 768)()
        for i in range(256):
            v = i * 257
            ramp[i] = v
            ramp[256 + i] = int(v * g_scale)
            ramp[512 + i] = int(v * b_scale)
        hdc = user32.GetDC(None)
        ok = gdi32.SetDeviceGammaRamp(hdc, ctypes.byref(ramp))
        user32.ReleaseDC(None, hdc)
        return bool(ok)

    # ---- volume ----
    _vol = None

    @staticmethod
    def _endpoint():
        if Win._vol is not None:
            return Win._vol
        if not IS_WIN:
            return None
        try:
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume  # type: ignore
            dev = AudioUtilities.GetSpeakers()
            ep = getattr(dev, "EndpointVolume", None)
            if ep is None:
                from comtypes import CLSCTX_ALL  # type: ignore
                iface = dev.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                ep = ctypes.cast(iface, ctypes.POINTER(IAudioEndpointVolume))
            Win._vol = ep
            return ep
        except Exception as e:
            print("volume unavailable:", e)
            return None

    @staticmethod
    def output_name() -> str:
        try:
            from pycaw.pycaw import AudioUtilities  # type: ignore
            dev = AudioUtilities.GetSpeakers()
            return getattr(dev, "FriendlyName", "") or "Default output"
        except Exception:
            return "Default output"

    @staticmethod
    def volume() -> tuple[int, bool]:
        ep = Win._endpoint()
        if ep is None:
            return 50, False
        try:
            return round(ep.GetMasterVolumeLevelScalar() * 100), bool(ep.GetMute())
        except Exception:
            Win._vol = None
            return 50, False

    @staticmethod
    def set_volume(pct: int):
        ep = Win._endpoint()
        if ep is not None:
            try:
                ep.SetMasterVolumeLevelScalar(max(0, min(100, pct)) / 100, None)
                if pct > 0 and ep.GetMute():
                    ep.SetMute(0, None)
            except Exception:
                Win._vol = None

    @staticmethod
    def toggle_mute():
        ep = Win._endpoint()
        if ep is not None:
            try:
                ep.SetMute(0 if ep.GetMute() else 1, None)
            except Exception:
                Win._vol = None

    # ---- brightness ----
    @staticmethod
    def brightness() -> int | None:
        if sbc is None:
            return None
        try:
            v = sbc.get_brightness(display=0)
            return int(v[0] if isinstance(v, list) else v)
        except Exception:
            return None

    @staticmethod
    def set_brightness(v: int):
        if sbc is not None:
            try:
                sbc.set_brightness(v, display=0)
            except Exception:
                pass

    # ---- media keys (fallback when WinRT media isn't installed) ----
    VK_NEXT, VK_PREV, VK_PLAYPAUSE = 0xB0, 0xB1, 0xB3

    @staticmethod
    def media_key(vk: int):
        if IS_WIN:
            user32.keybd_event(vk, 0, 0, 0)
            user32.keybd_event(vk, 0, 2, 0)

    # ---- now playing (WinRT) ----
    @staticmethod
    async def now_playing() -> dict | None:
        if MediaManager is None:
            return None
        mgr = await MediaManager.request_async()
        s = mgr.get_current_session()
        if s is None:
            return None
        props = await s.try_get_media_properties_async()
        info = s.get_playback_info()
        tl = s.get_timeline_properties()
        res = {
            "title": props.title or "Unknown",
            "artist": props.artist or "",
            "app": s.source_app_user_model_id or "",
            "playing": int(info.playback_status) == 4,
            "pos": _secs(tl.position),
            "end": _secs(tl.end_time),
            "thumb": None,
        }
        try:
            if props.thumbnail is not None:
                stream = await props.thumbnail.open_read_async()
                size = int(stream.size)
                try:
                    from winrt.windows.storage.streams import Buffer, DataReader, InputStreamOptions  # type: ignore
                except Exception:
                    from winsdk.windows.storage.streams import Buffer, DataReader, InputStreamOptions  # type: ignore
                buf = Buffer(size)
                await stream.read_async(buf, size, InputStreamOptions.READ_AHEAD)
                try:
                    data = bytes(memoryview(buf))
                except Exception:
                    reader = DataReader.from_buffer(buf)
                    arr = bytearray(buf.length)
                    reader.read_bytes(arr)
                    data = bytes(arr)
                res["thumb"] = data
        except Exception:
            pass
        return res

    @staticmethod
    async def media_cmd(cmd: str) -> bool:
        if MediaManager is None:
            return False
        mgr = await MediaManager.request_async()
        s = mgr.get_current_session()
        if s is None:
            return False
        if cmd == "toggle":
            await s.try_toggle_play_pause_async()
        elif cmd == "next":
            await s.try_skip_next_async()
        elif cmd == "prev":
            await s.try_skip_previous_async()
        return True

    # ---- wallpaper ----
    @staticmethod
    def set_wallpaper(path: str) -> bool:
        if not IS_WIN:
            return False
        return bool(user32.SystemParametersInfoW(20, 0, str(path), 3))

    @staticmethod
    def current_wallpaper() -> str:
        if not IS_WIN:
            return ""
        buf = ctypes.create_unicode_buffer(520)
        user32.SystemParametersInfoW(0x73, 520, buf, 0)
        return buf.value

    # ---- power ----
    @staticmethod
    def power(action: str):
        if not IS_WIN:
            print("power action (not on Windows):", action)
            return
        if action == "lock":
            user32.LockWorkStation()
        elif action == "sleep":
            ctypes.windll.powrprof.SetSuspendState(0, 1, 0)
        elif action == "restart":
            subprocess.Popen(["shutdown", "/r", "/t", "0"], creationflags=no_window_flags())
        elif action == "shutdown":
            subprocess.Popen(["shutdown", "/s", "/t", "0"], creationflags=no_window_flags())
        elif action == "signout":
            subprocess.Popen(["shutdown", "/l"], creationflags=no_window_flags())

    # ---- system info ----
    @staticmethod
    def cpu_name() -> str:
        if IS_WIN:
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                    r"HARDWARE\DESCRIPTION\System\CentralProcessor\0") as k:
                    return winreg.QueryValueEx(k, "ProcessorNameString")[0].strip()
            except Exception:
                pass
        return platform.processor() or "CPU"

    @staticmethod
    def gpu_name() -> str:
        if not IS_WIN:
            return "GPU"
        out = run_cmd(["powershell", "-NoProfile", "-Command",
                       "(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join '|'"])
        names = [n.strip() for n in out.strip().split("|") if n.strip()]
        # prefer a discrete GPU
        for n in names:
            if any(x in n for x in ("NVIDIA", "Radeon RX", "Arc")):
                return n
        return names[0] if names else "GPU"

    # ---- autostart ----
    _RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"

    @staticmethod
    def launch_command() -> str:
        if getattr(sys, "frozen", False):
            return f'"{sys.executable}"'
        exe = Path(sys.executable)
        pyw = exe.with_name("pythonw.exe")
        return f'"{pyw if pyw.exists() else exe}" "{Path(__file__).resolve()}"'

    @staticmethod
    def autostart() -> bool:
        if not IS_WIN:
            return False
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, Win._RUN_KEY) as k:
                winreg.QueryValueEx(k, APP_NAME)
                return True
        except Exception:
            return False

    @staticmethod
    def set_autostart(on: bool):
        if not IS_WIN:
            return
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, Win._RUN_KEY, 0, winreg.KEY_SET_VALUE) as k:
            if on:
                winreg.SetValueEx(k, APP_NAME, 0, winreg.REG_SZ, Win.launch_command())
            else:
                try:
                    winreg.DeleteValue(k, APP_NAME)
                except FileNotFoundError:
                    pass


def _secs(v) -> float:
    try:
        return v.total_seconds()
    except AttributeError:
        try:
            return v.duration / 10_000_000  # older projections: TimeSpan in 100ns ticks
        except Exception:
            return 0.0


class GpuCounter:
    """GPU 3D-engine utilisation and dedicated VRAM via Windows performance counters."""

    def __init__(self):
        self.ok = False
        self._last_expand = 0
        if not IS_WIN:
            return
        try:
            import win32pdh  # type: ignore
            self.pdh = win32pdh
            self._expand()
            self.ok = True
        except Exception as e:
            print("GPU counters unavailable:", e)

    def _expand(self):
        p = self.pdh
        self.q = p.OpenQuery()
        self.util = [p.AddCounter(self.q, c) for c in
                     p.ExpandCounterPath(r"\GPU Engine(*engtype_3D)\Utilization Percentage")]
        try:
            self.mem = [p.AddCounter(self.q, c) for c in
                        p.ExpandCounterPath(r"\GPU Adapter Memory(*)\Dedicated Usage")]
        except Exception:
            self.mem = []
        p.CollectQueryData(self.q)
        self._last_expand = time.time()

    def read(self) -> tuple[float, float]:
        if not self.ok:
            return 0.0, 0.0
        p = self.pdh
        try:
            if time.time() - self._last_expand > 15:   # process instances come and go
                p.CloseQuery(self.q)
                self._expand()
                time.sleep(0.2)
            p.CollectQueryData(self.q)
            util = 0.0
            for c in self.util:
                try:
                    util += p.GetFormattedCounterValue(c, p.PDH_FMT_DOUBLE)[1]
                except Exception:
                    pass
            mem = 0.0
            for c in self.mem:
                try:
                    mem += p.GetFormattedCounterValue(c, p.PDH_FMT_LARGE)[1]
                except Exception:
                    pass
            return min(util, 100.0), mem
        except Exception:
            return 0.0, 0.0


# ───────────────────────────── global hotkey ─────────────────────────────

class HotkeyThread(threading.Thread):
    MODS = {"alt": 0x1, "ctrl": 0x2, "control": 0x2, "shift": 0x4, "win": 0x8}
    KEYS = {"space": 0x20, "tab": 0x09, "enter": 0x0D, "esc": 0x1B, "`": 0xC0,
            "backquote": 0xC0, "grave": 0xC0}

    def __init__(self, combo: str, on_trigger, on_fail):
        super().__init__(daemon=True)
        self.combo, self.on_trigger, self.on_fail = combo, on_trigger, on_fail
        self.tid = 0

    def parse(self):
        mods, vk = 0x4000, None  # MOD_NOREPEAT
        for part in self.combo.lower().replace(" ", "").split("+"):
            if part in self.MODS:
                mods |= self.MODS[part]
            elif part in self.KEYS:
                vk = self.KEYS[part]
            elif re.fullmatch(r"f\d{1,2}", part):
                vk = 0x6F + int(part[1:])
            elif len(part) == 1 and part.isalnum():
                vk = ord(part.upper())
        return mods, vk

    def run(self):
        if not IS_WIN:
            return
        self.tid = kernel32.GetCurrentThreadId()
        mods, vk = self.parse()
        if vk is None or not user32.RegisterHotKey(None, 1, mods, vk):
            DISPATCH.sig.emit(self.on_fail, self.combo)
            return
        msg = wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), None, 0, 0) > 0:
            if msg.message == 0x0312:  # WM_HOTKEY
                DISPATCH.sig.emit(self.on_trigger, None)
        user32.UnregisterHotKey(None, 1)

    def stop(self):
        if IS_WIN and self.tid:
            user32.PostThreadMessageW(self.tid, 0x0012, 0, 0)  # WM_QUIT


# ───────────────────────────── styling & small widgets ─────────────────────────

ICON_FONT = "Segoe Fluent Icons"
ICONS = {
    "wifi": "\uE701", "bt": "\uE702", "vol": "\uE767", "mute": "\uE74F",
    "sun": "\uE706", "moon": "\uE708", "contrast": "\uE793", "lock": "\uE72E",
    "restart": "\uE777", "power": "\uE7E8", "signout": "\uF3B1", "play": "\uE768",
    "pause": "\uE769", "next": "\uE893", "prev": "\uE892", "search": "\uE721",
    "copy": "\uE8C8", "delete": "\uE74D", "folder": "\uE838", "shuffle": "\uE8B1",
    "speaker": "\uE7F5",
}


def icon_font(px: int) -> QFont:
    f = QFont(ICON_FONT)
    f.setFamilies([ICON_FONT, "Segoe MDL2 Assets"])
    f.setPixelSize(px)
    return f


def glyph(name: str, px=16) -> QLabel:
    lbl = QLabel(ICONS.get(name, "?"))
    lbl.setFont(icon_font(px))
    lbl.setObjectName("glyph")
    return lbl


STYLE = f"""
* {{ font-family: "Segoe UI Variable Text", "Segoe UI", sans-serif; color: #e6e8ec; font-size: 13px; }}
#panel {{ background: rgba(17, 19, 23, 238); border: 1px solid rgba(255,255,255,18); border-radius: 22px; }}
QLabel {{ background: transparent; }}
#muted {{ color: #8b919c; font-size: 12px; }}
#big {{ font-size: 44px; font-weight: 600; }}
#h2 {{ font-size: 15px; font-weight: 600; }}
#tabbtn {{ background: transparent; border: none; padding: 6px 12px; border-radius: 12px; color: #9aa0aa; font-size: 13px; }}
#tabbtn:hover {{ color: #e6e8ec; background: rgba(255,255,255,10); }}
#tabbtn:checked {{ color: #0f1a10; background: {ACCENT}; font-weight: 600; }}
#card {{ background: rgba(255,255,255,9); border: 1px solid rgba(255,255,255,12); border-radius: 16px; }}
#tile {{ background: #23272e; border-radius: 16px; }}
#tile:hover {{ background: #2b3038; }}
#tile[on="true"] {{ background: {ACCENT}; }}
#tile[on="true"] QLabel {{ color: #0f1a10; }}
#tile[on="true"] #muted {{ color: #2d4a2c; }}
QPushButton {{ background: #262a31; border: none; border-radius: 10px; padding: 7px 12px; }}
QPushButton:hover {{ background: #30353e; }}
QPushButton:pressed {{ background: #3a404a; }}
QPushButton#accent {{ background: {ACCENT}; color: #0f1a10; font-weight: 600; }}
QPushButton#chip {{ background: #23272e; border-radius: 12px; padding: 4px 12px; color: #aab0ba; }}
QPushButton#chip:checked {{ background: {ACCENT}; color: #0f1a10; }}
QPushButton#danger {{ background: #3a2224; color: #f2b8b5; }}
QPushButton#danger:hover {{ background: #5a2a2d; }}
QPushButton#round {{ border-radius: 18px; min-width: 36px; min-height: 36px; padding: 0; }}
QLineEdit, QPlainTextEdit {{ background: #1d2026; border: 1px solid #2d323a; border-radius: 10px; padding: 7px 10px; selection-background-color: {ACCENT}; selection-color: #0f1a10; }}
QLineEdit:focus, QPlainTextEdit:focus {{ border-color: {ACCENT}; }}
QSlider::groove:horizontal {{ height: 8px; background: #2a2e35; border-radius: 4px; }}
QSlider::sub-page:horizontal {{ background: {ACCENT}; border-radius: 4px; }}
QSlider::handle:horizontal {{ background: #ffffff; width: 16px; height: 16px; margin: -4px 0; border-radius: 8px; }}
QProgressBar {{ background: #2a2e35; border: none; border-radius: 3px; max-height: 6px; text-align: center; }}
QProgressBar::chunk {{ background: {ACCENT}; border-radius: 3px; }}
QListWidget {{ background: transparent; border: none; outline: none; }}
QListWidget::item {{ border-radius: 10px; padding: 6px; }}
QListWidget::item:hover {{ background: rgba(255,255,255,12); }}
QListWidget::item:selected {{ background: rgba(166,227,161,40); color: #e6e8ec; }}
QScrollBar:vertical, QScrollBar:horizontal {{ background: transparent; width: 8px; height: 8px; }}
QScrollBar::handle {{ background: #3a3f48; border-radius: 4px; min-height: 30px; min-width: 30px; }}
QScrollBar::add-line, QScrollBar::sub-line {{ width: 0; height: 0; }}
QScrollBar::add-page, QScrollBar::sub-page {{ background: transparent; }}
QCalendarWidget QWidget {{ alternate-background-color: transparent; }}
QCalendarWidget QAbstractItemView {{ background: #1a1d22; border-radius: 10px; selection-background-color: {ACCENT}; selection-color: #0f1a10; outline: none; }}
QCalendarWidget QToolButton {{ background: transparent; border: none; font-weight: 600; padding: 4px; }}
QCalendarWidget #qt_calendar_navigationbar {{ background: transparent; }}
QMenu {{ background: #1d2026; border: 1px solid #2d323a; border-radius: 8px; padding: 4px; }}
QMenu::item {{ padding: 6px 18px; border-radius: 6px; }}
QMenu::item:selected {{ background: #2d323a; }}
"""


def repolish(w: QWidget):
    w.style().unpolish(w)
    w.style().polish(w)
    for c in w.findChildren(QWidget):
        c.style().unpolish(c)
        c.style().polish(c)


def card() -> QFrame:
    f = QFrame()
    f.setObjectName("card")
    return f


def label(text="", obj=None) -> QLabel:
    lbl = QLabel(text)
    if obj:
        lbl.setObjectName(obj)
    return lbl


class Tile(QFrame):
    """Quick-settings tile: icon + title + subtitle, toggles on click."""
    clicked = Signal()

    def __init__(self, icon: str, title: str, subtitle=""):
        super().__init__()
        self.setObjectName("tile")
        self.setCursor(Qt.PointingHandCursor)
        self.setMinimumHeight(64)
        lay = QHBoxLayout(self)
        lay.setContentsMargins(14, 10, 14, 10)
        lay.setSpacing(12)
        self.icon = glyph(icon, 18)
        lay.addWidget(self.icon)
        col = QVBoxLayout()
        col.setSpacing(0)
        self.title = label(title)
        self.title.setStyleSheet("font-weight:600;")
        self.sub = label(subtitle, "muted")
        col.addWidget(self.title)
        col.addWidget(self.sub)
        lay.addLayout(col, 1)
        self.set_on(False)

    def set_on(self, on: bool, subtitle: str | None = None):
        self.setProperty("on", "true" if on else "false")
        if subtitle is not None:
            self.sub.setText(subtitle)
        repolish(self)

    def is_on(self) -> bool:
        return self.property("on") == "true"

    def mouseReleaseEvent(self, e):
        if e.button() == Qt.LeftButton and self.rect().contains(e.position().toPoint()):
            self.clicked.emit()


class Ring(QWidget):
    """Circular gauge."""

    def __init__(self, size=92, thickness=9):
        super().__init__()
        self.value, self.text = 0.0, "0%"
        self.thickness = thickness
        self.setFixedSize(size, size)

    def set_value(self, pct: float, text: str | None = None):
        self.value = max(0.0, min(100.0, pct))
        self.text = text if text is not None else f"{pct:.0f}%"
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        t = self.thickness
        r = QRectF(t / 2, t / 2, self.width() - t, self.height() - t)
        pen = QPen(QColor("#2a2e35"), t, Qt.SolidLine, Qt.RoundCap)
        p.setPen(pen)
        p.drawArc(r, 0, 360 * 16)
        col = QColor(ACCENT)
        if self.value > 85:
            col = QColor("#f38ba8")
        elif self.value > 65:
            col = QColor("#f9e2af")
        pen.setColor(col)
        p.setPen(pen)
        p.drawArc(r, 90 * 16, int(-self.value * 3.6 * 16))
        p.setPen(QColor("#e6e8ec"))
        f = self.font()
        f.setPixelSize(17)
        f.setBold(True)
        p.setFont(f)
        p.drawText(self.rect(), Qt.AlignCenter, self.text)


def make_tray_icon() -> QIcon:
    pm = QPixmap(64, 64)
    pm.fill(Qt.transparent)
    p = QPainter(pm)
    p.setRenderHint(QPainter.Antialiasing)
    p.setBrush(QColor(ACCENT))
    p.setPen(Qt.NoPen)
    p.drawEllipse(QRectF(14, 22, 36, 36))
    p.drawEllipse(QRectF(24, 6, 18, 24))
    p.setBrush(QColor("#11131a"))
    p.drawEllipse(QRectF(22, 34, 7, 8))
    p.drawEllipse(QRectF(35, 34, 7, 8))
    p.end()
    return QIcon(pm)


def avg_color(img: QImage) -> QColor:
    if img.isNull():
        return QColor("#3a2224")
    c = img.scaled(1, 1, Qt.IgnoreAspectRatio, Qt.SmoothTransformation).pixelColor(0, 0)
    h, s, v, _ = c.getHsv()
    return QColor.fromHsv(h, min(255, int(s * 0.9)), min(v, 90))


# ───────────────────────────── pages ─────────────────────────────

class Page(QWidget):
    def on_show(self):
        pass

    def on_hide(self):
        pass


class ControlsPage(Page):
    def __init__(self):
        super().__init__()
        self.night_on = False
        root = QHBoxLayout(self)
        root.setSpacing(14)

        left = QVBoxLayout()
        left.setSpacing(10)
        grid = QGridLayout()
        grid.setSpacing(10)
        self.wifi = Tile("wifi", "Wi-Fi", "…")
        self.bt = Tile("bt", "Bluetooth", "…")
        self.audio = Tile("speaker", "Audio", Win.output_name() if IS_WIN else "Default output")
        self.night = Tile("moon", "Night light", "Off")
        self.dark = Tile("contrast", "Dark mode", "")
        grid.addWidget(self.wifi, 0, 0)
        grid.addWidget(self.bt, 0, 1)
        grid.addWidget(self.audio, 0, 2)
        grid.addWidget(self.night, 1, 0)
        grid.addWidget(self.dark, 1, 1)
        left.addLayout(grid)

        # sliders
        sl = card()
        sll = QVBoxLayout(sl)
        sll.setContentsMargins(14, 10, 14, 10)
        self.vol_icon = QPushButton(ICONS["vol"])
        self.vol_icon.setFont(icon_font(15))
        self.vol_icon.setFixedSize(34, 30)
        self.vol = QSlider(Qt.Horizontal)
        self.vol.setRange(0, 100)
        self.vol_lbl = label("0%")
        self.vol_lbl.setFixedWidth(40)
        row = QHBoxLayout()
        row.addWidget(self.vol_icon)
        row.addWidget(self.vol, 1)
        row.addWidget(self.vol_lbl)
        sll.addLayout(row)
        self.bri = QSlider(Qt.Horizontal)
        self.bri.setRange(0, 100)
        self.bri_lbl = label("—")
        self.bri_lbl.setFixedWidth(40)
        brow = QHBoxLayout()
        bi = glyph("sun", 15)
        bi.setFixedWidth(34)
        bi.setAlignment(Qt.AlignCenter)
        brow.addWidget(bi)
        brow.addWidget(self.bri, 1)
        brow.addWidget(self.bri_lbl)
        self.bri_row = QWidget()
        self.bri_row.setLayout(brow)
        brow.setContentsMargins(0, 0, 0, 0)
        sll.addWidget(self.bri_row)
        left.addWidget(sl)
        left.addStretch()
        root.addLayout(left, 3)

        # media card
        self.media = QFrame()
        self.media.setObjectName("media")
        self.media.setMinimumWidth(300)
        ml = QVBoxLayout(self.media)
        ml.setContentsMargins(16, 16, 16, 16)
        top = QHBoxLayout()
        self.art = QLabel()
        self.art.setFixedSize(72, 72)
        self.art.setAlignment(Qt.AlignCenter)
        self.art.setStyleSheet("background: rgba(0,0,0,60); border-radius: 12px;")
        top.addWidget(self.art)
        meta = QVBoxLayout()
        self.src = label("Nothing playing", "muted")
        self.song = label("—")
        self.song.setStyleSheet("font-size:17px; font-weight:700;")
        self.song.setWordWrap(True)
        self.artist = label("", "muted")
        meta.addWidget(self.src)
        meta.addWidget(self.song)
        meta.addWidget(self.artist)
        meta.addStretch()
        top.addLayout(meta, 1)
        ml.addLayout(top)
        ml.addStretch()
        self.prog = QProgressBar()
        self.prog.setTextVisible(False)
        self.prog.setRange(0, 1000)
        ml.addWidget(self.prog)
        ctr = QHBoxLayout()
        ctr.addStretch()
        self.btn_prev = self._media_btn("prev", "prev")
        self.btn_play = self._media_btn("play", "toggle", accent=True)
        self.btn_next = self._media_btn("next", "next")
        for b in (self.btn_prev, self.btn_play, self.btn_next):
            ctr.addWidget(b)
        ctr.addStretch()
        ml.addLayout(ctr)
        self._set_media_bg(QColor("#3a2224"))
        root.addWidget(self.media, 2)

        self.wifi.clicked.connect(lambda: self._toggle_radio(Win.RADIO_WIFI, self.wifi))
        self.bt.clicked.connect(lambda: self._toggle_radio(Win.RADIO_BT, self.bt))
        self.audio.clicked.connect(self._toggle_mute)
        self.night.clicked.connect(self._toggle_night)
        self.dark.clicked.connect(self._toggle_dark)
        self.vol_icon.clicked.connect(self._toggle_mute)
        self.vol.valueChanged.connect(self._vol_changed)
        self.bri.valueChanged.connect(lambda v: self.bri_lbl.setText(f"{v}%"))
        self.bri.sliderReleased.connect(lambda: run_bg(Win.set_brightness, None, self.bri.value()))

        self._vol_pending = None
        self._vol_timer = QTimer(self, singleShot=True, interval=40, timeout=self._apply_vol)
        self.timer = QTimer(self, interval=2000, timeout=self.refresh_media)
        self.pos_timer = QTimer(self, interval=500, timeout=self._tick_pos)
        self._media_state = None
        self._last_title = None

    def _media_btn(self, icon, cmd, accent=False):
        b = QPushButton(ICONS[icon])
        b.setFont(icon_font(14))
        b.setObjectName("round")
        if accent:
            b.setStyleSheet(f"background:{ACCENT}; color:#0f1a10;")
        b.clicked.connect(lambda: self._media(cmd))
        return b

    def _set_media_bg(self, c: QColor):
        c2 = c.darker(160)
        self.media.setStyleSheet(
            f"#media {{ border-radius: 18px; background: qlineargradient(x1:0,y1:0,x2:1,y2:1,"
            f"stop:0 {c.name()}, stop:1 {c2.name()}); }}")

    def on_show(self):
        self.refresh_all()
        self.timer.start()
        self.pos_timer.start()

    def on_hide(self):
        self.timer.stop()
        self.pos_timer.stop()

    def refresh_all(self):
        run_async(Win.radio_states, self._got_radios)
        run_bg(Win.wifi_ssid, lambda s: None if isinstance(s, Exception) else
               (self.wifi.is_on() and self.wifi.sub.setText(s or "On")))
        self.dark.set_on(Win.dark_mode(), "On" if Win.dark_mode() else "Off")
        self.night.set_on(self.night_on, "On" if self.night_on else "Off")
        v, muted = Win.volume()
        self.vol.blockSignals(True)
        self.vol.setValue(v)
        self.vol.blockSignals(False)
        self.vol_lbl.setText(f"{v}%")
        self._show_mute(muted)
        run_bg(Win.brightness, self._got_brightness)
        self.refresh_media()

    def _got_radios(self, res):
        if isinstance(res, Exception) or not res:
            for t in (self.wifi, self.bt):
                t.set_on(False, "Unavailable" if not IS_WIN else "Open settings")
            return
        wifi_on = res.get(Win.RADIO_WIFI)
        bt_on = res.get(Win.RADIO_BT)
        if wifi_on is None:
            self.wifi.set_on(False, "No adapter")
        else:
            self.wifi.set_on(wifi_on, self.wifi.sub.text() if wifi_on and self.wifi.sub.text() not in ("…", "Off") else ("On" if wifi_on else "Off"))
            if wifi_on:
                run_bg(Win.wifi_ssid, lambda s: None if isinstance(s, Exception) or not s else self.wifi.sub.setText(s))
        if bt_on is None:
            self.bt.set_on(False, "No adapter")
        else:
            self.bt.set_on(bt_on, "On" if bt_on else "Off")

    def _toggle_radio(self, kind, tile: Tile):
        if Radio is None:
            if IS_WIN:
                os.startfile("ms-settings:network-wifi" if kind == Win.RADIO_WIFI else "ms-settings:bluetooth")
            return
        want = not tile.is_on()
        tile.set_on(want, "Turning on…" if want else "Turning off…")
        run_async(Win.set_radio, lambda _: QTimer.singleShot(800, lambda: run_async(Win.radio_states, self._got_radios)), kind, want)

    def _toggle_dark(self):
        want = not self.dark.is_on()
        self.dark.set_on(want, "On" if want else "Off")
        run_bg(Win.set_dark_mode, None, want)

    def _toggle_night(self):
        self.night_on = not self.night_on
        ok = Win.set_warm(CFG.get("night_light_strength", 0.5) if self.night_on else 0.0)
        if IS_WIN and not ok and self.night_on:
            self.night_on = False
            self.night.set_on(False, "Blocked by driver")
            return
        self.night.set_on(self.night_on, "On" if self.night_on else "Off")

    def _vol_changed(self, v):
        self.vol_lbl.setText(f"{v}%")
        self._vol_pending = v
        self._vol_timer.start()

    def _apply_vol(self):
        if self._vol_pending is not None:
            Win.set_volume(self._vol_pending)
            self._vol_pending = None
            self._show_mute(Win.volume()[1])

    def _toggle_mute(self):
        Win.toggle_mute()
        self._show_mute(Win.volume()[1])

    def _show_mute(self, muted):
        self.vol_icon.setText(ICONS["mute" if muted else "vol"])
        self.audio.set_on(not muted, self.audio.sub.text())

    def _got_brightness(self, v):
        if isinstance(v, Exception) or v is None:
            self.bri_row.setVisible(False)
            return
        self.bri_row.setVisible(True)
        self.bri.blockSignals(True)
        self.bri.setValue(v)
        self.bri.blockSignals(False)
        self.bri_lbl.setText(f"{v}%")

    # media
    def refresh_media(self):
        if MediaManager is None:
            self.src.setText("Media keys")
            self.song.setText("Play / pause")
            self.artist.setText("Install winrt packages for track info")
            return
        run_async(Win.now_playing, self._got_media)

    def _got_media(self, res):
        if isinstance(res, Exception) or res is None:
            self._media_state = None
            self.src.setText("Nothing playing")
            self.song.setText("—")
            self.artist.setText("")
            self.prog.setValue(0)
            self.art.clear()
            self.btn_play.setText(ICONS["play"])
            return
        res["fetched"] = time.time()
        self._media_state = res
        app = res["app"].split("!")[-1].split(".")[0] if res["app"] else ""
        self.src.setText(app or "Now playing")
        self.song.setText(res["title"])
        self.artist.setText(res["artist"])
        self.btn_play.setText(ICONS["pause" if res["playing"] else "play"])
        if res["title"] != self._last_title:
            self._last_title = res["title"]
            img = QImage.fromData(res["thumb"]) if res.get("thumb") else QImage()
            if not img.isNull():
                self.art.setPixmap(QPixmap.fromImage(img).scaled(72, 72, Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation))
            else:
                self.art.setText(ICONS["play"])
                self.art.setFont(icon_font(24))
            self._set_media_bg(avg_color(img))
        self._tick_pos()

    def _tick_pos(self):
        s = self._media_state
        if not s or not s["end"]:
            return
        pos = s["pos"] + ((time.time() - s["fetched"]) if s["playing"] else 0)
        self.prog.setValue(int(1000 * min(1.0, pos / s["end"])))

    def _media(self, cmd):
        if MediaManager is None:
            Win.media_key({"toggle": Win.VK_PLAYPAUSE, "next": Win.VK_NEXT, "prev": Win.VK_PREV}[cmd])
            return
        run_async(Win.media_cmd, lambda _: QTimer.singleShot(400, self.refresh_media), cmd)


class TodayPage(Page):
    def __init__(self):
        super().__init__()
        root = QHBoxLayout(self)
        root.setSpacing(14)

        left = card()
        ll = QVBoxLayout(left)
        ll.setContentsMargins(20, 18, 20, 18)
        self.clock = label("", "big")
        self.date = label("", "h2")
        self.extra = label("", "muted")
        self.weather = label("", "muted")
        self.weather.setWordWrap(True)
        ll.addWidget(self.clock)
        ll.addWidget(self.date)
        ll.addSpacing(8)
        ll.addWidget(self.extra)
        ll.addWidget(self.weather)
        ll.addStretch()
        root.addWidget(left, 2)

        cal_card = card()
        cl = QVBoxLayout(cal_card)
        cl.setContentsMargins(10, 8, 10, 8)
        self.cal = QCalendarWidget()
        self.cal.setVerticalHeaderFormat(QCalendarWidget.NoVerticalHeader)
        self.cal.setGridVisible(False)
        self.cal.setFirstDayOfWeek(Qt.Monday)
        from PySide6.QtGui import QPalette, QTextCharFormat
        pal = self.cal.palette()
        for role, col in ((QPalette.Base, "#1a1d22"), (QPalette.AlternateBase, "#1a1d22"),
                          (QPalette.Window, "#1a1d22"), (QPalette.Button, "#1a1d22"),
                          (QPalette.Text, "#e6e8ec"), (QPalette.WindowText, "#e6e8ec"),
                          (QPalette.ButtonText, "#e6e8ec"), (QPalette.Highlight, ACCENT),
                          (QPalette.HighlightedText, "#0f1a10")):
            pal.setColor(role, QColor(col))
        self.cal.setPalette(pal)
        hdr = QTextCharFormat()
        hdr.setForeground(QColor("#8b919c"))
        hdr.setBackground(QColor("#1a1d22"))
        self.cal.setHeaderTextFormat(hdr)
        wk = QTextCharFormat()
        wk.setForeground(QColor("#f5c2a8"))
        for day in (Qt.Saturday, Qt.Sunday):
            self.cal.setWeekdayTextFormat(day, wk)
        cl.addWidget(self.cal)
        root.addWidget(cal_card, 3)

        notes = card()
        nl = QVBoxLayout(notes)
        nl.setContentsMargins(14, 12, 14, 12)
        nl.addWidget(label("Notes", "h2"))
        self.notes = QPlainTextEdit()
        self.notes.setPlaceholderText("Jot something down… (saved automatically)")
        self.notes_path = APP_DIR / "notes.txt"
        try:
            self.notes.setPlainText(self.notes_path.read_text(encoding="utf-8"))
        except Exception:
            pass
        self._save_timer = QTimer(self, singleShot=True, interval=600,
                                  timeout=lambda: self.notes_path.write_text(self.notes.toPlainText(), encoding="utf-8"))
        self.notes.textChanged.connect(self._save_timer.start)
        nl.addWidget(self.notes)
        root.addWidget(notes, 3)

        self.timer = QTimer(self, interval=1000, timeout=self.tick)
        self._weather_at = 0

    def on_show(self):
        self.tick()
        self.cal.setSelectedDate(QDate_today())
        self.timer.start()
        if time.time() - self._weather_at > 1800:
            self._weather_at = time.time()
            run_bg(self._fetch_weather, self._got_weather)

    def on_hide(self):
        self.timer.stop()

    def tick(self):
        now = dt.datetime.now()
        self.clock.setText(now.strftime("%H:%M"))
        self.date.setText(now.strftime("%A, %d %B %Y"))
        parts = [f"Week {now.isocalendar()[1]}", f"Up for {human_duration(time.time() - psutil.boot_time())}"]
        try:
            b = psutil.sensors_battery()
            if b:
                parts.append(f"Battery {b.percent:.0f}%{' · charging' if b.power_plugged else ''}")
        except Exception:
            pass
        self.extra.setText("   ·   ".join(parts))

    @staticmethod
    def _fetch_weather():
        req = urllib.request.Request("https://wttr.in/?format=%l:+%C+%t+(feels+%f),+wind+%w",
                                     headers={"User-Agent": "curl/8"})
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.read().decode("utf-8", "ignore").strip()

    def _got_weather(self, res):
        if isinstance(res, Exception) or not res or "<" in res:
            self.weather.setText("")
            self._weather_at = 0
        else:
            self.weather.setText(res)


def QDate_today():
    from PySide6.QtCore import QDate
    return QDate.currentDate()


class StatsPage(Page):
    def __init__(self):
        super().__init__()
        root = QHBoxLayout(self)
        root.setSpacing(14)

        rings = card()
        rl = QGridLayout(rings)
        rl.setContentsMargins(16, 14, 16, 14)
        rl.setHorizontalSpacing(18)
        self.r_cpu, self.r_gpu, self.r_ram = Ring(), Ring(), Ring()
        self.l_cpu, self.l_gpu, self.l_ram = label("", "muted"), label("", "muted"), label("", "muted")
        for i, (r, title, sub) in enumerate([(self.r_cpu, "CPU", self.l_cpu),
                                             (self.r_gpu, "GPU", self.l_gpu),
                                             (self.r_ram, "RAM", self.l_ram)]):
            rl.addWidget(r, 0, i, Qt.AlignHCenter)
            t = label(title)
            t.setStyleSheet("font-weight:700;")
            t.setAlignment(Qt.AlignCenter)
            rl.addWidget(t, 1, i)
            sub.setAlignment(Qt.AlignCenter)
            sub.setWordWrap(True)
            rl.addWidget(sub, 2, i)

        # small numbers row
        self.disk = label("", "muted")
        self.net = label("", "muted")
        self.up = label("", "muted")
        row = QHBoxLayout()
        for title, w in (("DISK C:", self.disk), ("NETWORK", self.net), ("UP FOR", self.up)):
            col = QVBoxLayout()
            col.setSpacing(2)
            t = label(title, "muted")
            t.setStyleSheet("font-size:10px; letter-spacing:1px;")
            w.setStyleSheet("color:#e6e8ec; font-weight:600;")
            col.addWidget(t)
            col.addWidget(w)
            row.addLayout(col)
        rl.setRowMinimumHeight(3, 16)
        rl.addLayout(row, 4, 0, 1, 3)
        rl.setRowStretch(3, 1)
        rl.setVerticalSpacing(4)
        root.addWidget(rings, 3)

        right = QVBoxLayout()
        right.setSpacing(12)
        apps = card()
        al = QVBoxLayout(apps)
        al.setContentsMargins(14, 12, 14, 12)
        al.setSpacing(6)
        al.addWidget(label("Top apps · RAM", "h2"))
        self.top_rows = []
        for _ in range(5):
            r = QHBoxLayout()
            ic = QLabel()
            ic.setFixedSize(18, 18)
            name = label("")
            mem = label("", "muted")
            bar = QProgressBar()
            bar.setTextVisible(False)
            bar.setRange(0, 1000)
            col = QVBoxLayout()
            col.setSpacing(2)
            nr = QHBoxLayout()
            nr.addWidget(name, 1)
            nr.addWidget(mem)
            col.addLayout(nr)
            col.addWidget(bar)
            r.addWidget(ic)
            r.addLayout(col, 1)
            al.addLayout(r)
            self.top_rows.append((ic, name, mem, bar))
        right.addWidget(apps)

        sp = card()
        sl = QHBoxLayout(sp)
        sl.setContentsMargins(14, 10, 14, 10)
        col = QVBoxLayout()
        col.setSpacing(2)
        col.addWidget(label("Internet speed", "muted"))
        self.speed = label("— Mbps ↓   — Mbps ↑")
        self.speed.setStyleSheet("font-size:16px; font-weight:700;")
        col.addWidget(self.speed)
        sl.addLayout(col, 1)
        self.speed_btn = QPushButton("Test")
        self.speed_btn.setObjectName("accent")
        self.speed_btn.clicked.connect(self.speed_test)
        sl.addWidget(self.speed_btn)
        right.addWidget(sp)
        root.addLayout(right, 2)

        self.cpu_name = Win.cpu_name()
        self.gpu_name = "GPU"
        run_bg(Win.gpu_name, lambda n: None if isinstance(n, Exception) else setattr(self, "gpu_name", n))
        self.gpu = None
        self.icon_provider = QFileIconProvider()
        self.icon_cache: dict[str, QIcon] = {}
        self.last_net = psutil.net_io_counters()
        self.last_t = time.time()
        self.timer = QTimer(self, interval=1000, timeout=self.tick)
        self.top_timer = QTimer(self, interval=3000, timeout=lambda: run_bg(self._top_apps, self._got_top))
        self._gpu_busy = False

    def on_show(self):
        psutil.cpu_percent(None)
        self.tick()
        run_bg(self._top_apps, self._got_top)
        self.timer.start()
        self.top_timer.start()

    def on_hide(self):
        self.timer.stop()
        self.top_timer.stop()

    def tick(self):
        cpu = psutil.cpu_percent(None)
        freq = psutil.cpu_freq()
        self.r_cpu.set_value(cpu)
        short_cpu = re.sub(r"\s*(with|w/).*$|\(R\)|\(TM\)|CPU|Processor|\d+-Core", "", self.cpu_name).strip()
        self.l_cpu.setText(f"{short_cpu}\n{freq.current / 1000:.1f} GHz" if freq else short_cpu)

        vm = psutil.virtual_memory()
        self.r_ram.set_value(vm.percent)
        self.l_ram.setText(f"{human_bytes(vm.used)} / {human_bytes(vm.total)}\n{human_bytes(vm.available)} free")

        if not self._gpu_busy:
            self._gpu_busy = True
            run_bg(self._read_gpu, self._got_gpu)

        try:
            du = psutil.disk_usage("C:\\" if IS_WIN else "/")
            self.disk.setText(f"{human_bytes(du.used)} / {human_bytes(du.total)}")
        except Exception:
            pass
        now = time.time()
        n = psutil.net_io_counters()
        dt_ = max(0.1, now - self.last_t)
        down = (n.bytes_recv - self.last_net.bytes_recv) / dt_
        up = (n.bytes_sent - self.last_net.bytes_sent) / dt_
        self.last_net, self.last_t = n, now
        self.net.setText(f"↓ {human_bytes(down)}/s  ↑ {human_bytes(up)}/s")
        self.up.setText(human_duration(now - psutil.boot_time()))

    def _read_gpu(self):
        if self.gpu is None:
            self.gpu = GpuCounter()
        return self.gpu.read()

    def _got_gpu(self, res):
        self._gpu_busy = False
        if isinstance(res, Exception):
            return
        util, mem = res
        if self.gpu and self.gpu.ok:
            self.r_gpu.set_value(util)
            short = re.sub(r"NVIDIA GeForce |AMD |\(TM\)|\(R\)", "", self.gpu_name).strip()
            self.l_gpu.setText(f"{short}\n{human_bytes(mem)} VRAM" if mem else short)
        else:
            self.r_gpu.set_value(0, "—")
            self.l_gpu.setText(self.gpu_name)

    @staticmethod
    def _top_apps():
        agg: dict[str, list] = {}
        for p in psutil.process_iter(["name", "memory_info", "exe"]):
            try:
                name = p.info["name"] or ""
                mem = p.info["memory_info"].rss if p.info["memory_info"] else 0
                if not name or name.lower() in ("system", "registry", "memory compression", "idle"):
                    continue
                a = agg.setdefault(name, [0, p.info.get("exe") or ""])
                a[0] += mem
                if not a[1] and p.info.get("exe"):
                    a[1] = p.info["exe"]
            except Exception:
                continue
        total = psutil.virtual_memory().total
        items = sorted(agg.items(), key=lambda kv: kv[1][0], reverse=True)[:5]
        return [(n, m, exe, m / total) for n, (m, exe) in items]

    def _got_top(self, res):
        if isinstance(res, Exception):
            return
        top = res[0][3] if res else 1
        for (ic, name, mem, bar), item in zip(self.top_rows, res + [None] * 5):
            if item is None:
                name.setText("")
                mem.setText("")
                bar.setValue(0)
                ic.clear()
                continue
            n, m, exe, frac = item
            name.setText(self._pretty(n, exe))
            mem.setText(human_bytes(m))
            bar.setValue(int(1000 * frac / max(top, 1e-9)))
            if exe:
                icon = self.icon_cache.get(exe)
                if icon is None:
                    icon = self.icon_provider.icon(QFileInfo(exe))
                    self.icon_cache[exe] = icon
                ic.setPixmap(icon.pixmap(18, 18))

    @staticmethod
    def _pretty(name: str, exe: str) -> str:
        known = {"code.exe": "Visual Studio Code", "chrome.exe": "Google Chrome", "msedge.exe": "Microsoft Edge",
                 "opera.exe": "Opera", "firefox.exe": "Firefox", "explorer.exe": "File Explorer",
                 "discord.exe": "Discord", "spotify.exe": "Spotify", "brave.exe": "Brave",
                 "python.exe": "Python", "pythonw.exe": "Python", "steam.exe": "Steam",
                 "obs64.exe": "OBS Studio", "photoshop.exe": "Photoshop", "resolve.exe": "DaVinci Resolve"}
        return known.get(name.lower(), re.sub(r"\.exe$", "", name, flags=re.I))

    def speed_test(self):
        self.speed_btn.setEnabled(False)
        self.speed_btn.setText("Testing…")
        self.speed.setText("Measuring…")
        run_bg(self._run_speed, self._got_speed)

    @staticmethod
    def _run_speed():
        # Download: pull 25 MB from Cloudflare's speed endpoint
        size = 25_000_000
        t0 = time.time()
        req = urllib.request.Request(f"https://speed.cloudflare.com/__down?bytes={size}",
                                     headers={"User-Agent": "Wisp"})
        got = 0
        with urllib.request.urlopen(req, timeout=30) as r:
            while chunk := r.read(262144):
                got += len(chunk)
        down = got * 8 / (time.time() - t0) / 1e6
        # Upload: push 8 MB
        payload = os.urandom(8_000_000)
        t0 = time.time()
        req = urllib.request.Request("https://speed.cloudflare.com/__up", data=payload, method="POST",
                                     headers={"User-Agent": "Wisp", "Content-Type": "application/octet-stream"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                r.read()
            up = len(payload) * 8 / (time.time() - t0) / 1e6
        except Exception:
            up = None
        return down, up

    def _got_speed(self, res):
        self.speed_btn.setEnabled(True)
        self.speed_btn.setText("Test")
        if isinstance(res, Exception):
            self.speed.setText("Test failed — offline?")
            return
        down, up = res
        self.speed.setText(f"{down:.0f} Mbps ↓   {up:.0f} Mbps ↑" if up else f"{down:.0f} Mbps ↓")


class ClipboardPage(Page):
    URL_RE = re.compile(r"^\s*(https?://|www\.)\S+\s*$", re.I)

    def __init__(self):
        super().__init__()
        self.items: list[dict] = []
        self.hist_path = APP_DIR / "clipboard.json"
        self._load()

        root = QHBoxLayout(self)
        root.setSpacing(14)

        left = QVBoxLayout()
        top = QHBoxLayout()
        self.search = QLineEdit()
        self.search.setPlaceholderText("Search clipboard…")
        self.search.textChanged.connect(self.rebuild)
        top.addWidget(self.search, 1)
        self.filter = "all"
        self.chips = {}
        for key, txt in (("all", "All"), ("text", "Text"), ("image", "Images"), ("link", "Links")):
            b = QPushButton(txt)
            b.setObjectName("chip")
            b.setCheckable(True)
            b.setChecked(key == "all")
            b.clicked.connect(lambda _=False, k=key: self.set_filter(k))
            top.addWidget(b)
            self.chips[key] = b
        left.addLayout(top)
        self.list = QListWidget()
        self.list.setIconSize(QSize(44, 32))
        self.list.currentRowChanged.connect(self.preview)
        self.list.itemActivated.connect(lambda _: self.copy_current())
        self.list.itemDoubleClicked.connect(lambda _: self.copy_current())
        left.addWidget(self.list, 1)
        root.addLayout(left, 3)

        pv = card()
        pl = QVBoxLayout(pv)
        pl.setContentsMargins(14, 12, 14, 12)
        self.pv_img = QLabel()
        self.pv_img.setAlignment(Qt.AlignCenter)
        self.pv_img.setMinimumHeight(120)
        self.pv_text = QLabel()
        self.pv_text.setWordWrap(True)
        self.pv_text.setAlignment(Qt.AlignTop | Qt.AlignLeft)
        self.pv_text.setTextInteractionFlags(Qt.TextSelectableByMouse)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.NoFrame)
        scroll.setStyleSheet("background: transparent;")
        holder = QWidget()
        hl = QVBoxLayout(holder)
        hl.setContentsMargins(0, 0, 0, 0)
        hl.addWidget(self.pv_img)
        hl.addWidget(self.pv_text)
        hl.addStretch()
        scroll.setWidget(holder)
        pl.addWidget(scroll, 1)
        self.pv_meta = label("", "muted")
        pl.addWidget(self.pv_meta)
        btns = QHBoxLayout()
        copy = QPushButton("Copy")
        copy.setObjectName("accent")
        copy.clicked.connect(self.copy_current)
        dele = QPushButton("Delete")
        dele.clicked.connect(self.delete_current)
        clear = QPushButton("Clear all")
        clear.setObjectName("danger")
        clear.clicked.connect(self.clear_all)
        btns.addWidget(copy)
        btns.addWidget(dele)
        btns.addStretch()
        btns.addWidget(clear)
        pl.addLayout(btns)
        root.addWidget(pv, 2)

        QShortcut(QKeySequence.Delete, self.list, activated=self.delete_current)
        self.cb = QGuiApplication.clipboard()
        self.cb.dataChanged.connect(self.on_clipboard)
        self.rebuild()

    # persistence
    def _load(self):
        try:
            data = json.loads(self.hist_path.read_text(encoding="utf-8"))
            self.items = [i for i in data if i.get("type") == "text" or Path(i.get("path", "")).exists()]
        except Exception:
            self.items = []

    def _save(self):
        try:
            self.hist_path.write_text(json.dumps(self.items, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

    # capture
    def on_clipboard(self):
        md = self.cb.mimeData()
        if md is None:
            return
        now = time.time()
        if md.hasImage():
            img = self.cb.image()
            if img.isNull():
                return
            h = hashlib.md5(bytes(img.constBits())).hexdigest()
            for i, it in enumerate(self.items):
                if it.get("hash") == h:
                    it["ts"] = now
                    self.items.insert(0, self.items.pop(i))
                    break
            else:
                path = CLIP_DIR / f"{h}.png"
                img.save(str(path), "PNG")
                self.items.insert(0, {"type": "image", "path": str(path), "hash": h, "ts": now,
                                      "w": img.width(), "h": img.height()})
        elif md.hasText():
            text = md.text()
            if not text.strip():
                return
            for i, it in enumerate(self.items):
                if it["type"] == "text" and it["text"] == text:
                    it["ts"] = now
                    self.items.insert(0, self.items.pop(i))
                    break
            else:
                self.items.insert(0, {"type": "text", "text": text, "ts": now})
        else:
            return
        self._trim()
        self._save()
        self.rebuild()

    def _trim(self):
        maxn = int(CFG.get("clipboard_max", 100))
        while len(self.items) > maxn:
            it = self.items.pop()
            if it["type"] == "image":
                try:
                    Path(it["path"]).unlink()
                except Exception:
                    pass

    # view
    def kind(self, it):
        if it["type"] == "image":
            return "image"
        return "link" if self.URL_RE.match(it["text"]) else "text"

    def set_filter(self, k):
        self.filter = k
        for key, b in self.chips.items():
            b.setChecked(key == k)
        self.rebuild()

    def visible_items(self):
        q = self.search.text().lower().strip()
        out = []
        for it in self.items:
            k = self.kind(it)
            if self.filter != "all" and k != self.filter:
                continue
            if q and (it["type"] != "text" or q not in it["text"].lower()):
                continue
            out.append(it)
        return out

    def rebuild(self):
        self.shown = self.visible_items()
        self.list.blockSignals(True)
        self.list.clear()
        for it in self.shown:
            if it["type"] == "image":
                li = QListWidgetItem(f"Image  ·  {it.get('w')}×{it.get('h')}")
                li.setIcon(QIcon(QPixmap(it["path"]).scaled(44, 32, Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)))
            else:
                first = " ".join(it["text"].split())
                li = QListWidgetItem(first[:90] + ("…" if len(first) > 90 else ""))
            self.list.addItem(li)
        self.list.blockSignals(False)
        if self.shown:
            self.list.setCurrentRow(0)
        self.preview(self.list.currentRow())

    def preview(self, row):
        if row < 0 or row >= len(getattr(self, "shown", [])):
            self.pv_img.clear()
            self.pv_img.setVisible(False)
            self.pv_text.setText("Clipboard history is empty.\nCopy something and it appears here." if not self.items else "")
            self.pv_meta.setText("")
            return
        it = self.shown[row]
        when = dt.datetime.fromtimestamp(it["ts"]).strftime("%d %b, %H:%M")
        if it["type"] == "image":
            self.pv_img.setVisible(True)
            self.pv_img.setPixmap(QPixmap(it["path"]).scaled(300, 170, Qt.KeepAspectRatio, Qt.SmoothTransformation))
            self.pv_text.setText("")
            self.pv_meta.setText(f"Image · {it.get('w')}×{it.get('h')} · copied {when}")
        else:
            self.pv_img.setVisible(False)
            t = it["text"]
            self.pv_text.setText(t[:4000])
            self.pv_meta.setText(f"{self.kind(it).title()} · {len(t)} chars · copied {when}")

    def current(self):
        r = self.list.currentRow()
        return self.shown[r] if 0 <= r < len(self.shown) else None

    def copy_current(self):
        it = self.current()
        if not it:
            return
        if it["type"] == "image":
            self.cb.setImage(QImage(it["path"]))
        else:
            self.cb.setText(it["text"])
        w = self.window()
        if hasattr(w, "hide_panel"):
            w.hide_panel()

    def delete_current(self):
        it = self.current()
        if not it:
            return
        self.items.remove(it)
        if it["type"] == "image":
            try:
                Path(it["path"]).unlink()
            except Exception:
                pass
        self._save()
        self.rebuild()

    def clear_all(self):
        for it in self.items:
            if it["type"] == "image":
                try:
                    Path(it["path"]).unlink()
                except Exception:
                    pass
        self.items = []
        self._save()
        self.rebuild()

    def on_show(self):
        self.search.setFocus()


class AppsPage(Page):
    def __init__(self):
        super().__init__()
        self.apps: list[dict] = []
        self.loaded = False
        root = QVBoxLayout(self)
        self.search = QLineEdit()
        self.search.setPlaceholderText("Search apps…  (Enter launches the first match)")
        self.search.textChanged.connect(self.filter)
        self.search.returnPressed.connect(self.launch_first)
        root.addWidget(self.search)
        self.grid = QListWidget()
        self.grid.setViewMode(QListWidget.IconMode)
        self.grid.setIconSize(QSize(40, 40))
        self.grid.setGridSize(QSize(104, 92))
        self.grid.setResizeMode(QListWidget.Adjust)
        self.grid.setMovement(QListWidget.Static)
        self.grid.setWordWrap(True)
        self.grid.setUniformItemSizes(True)
        self.grid.itemActivated.connect(self.launch)
        self.grid.itemClicked.connect(self.launch)
        root.addWidget(self.grid, 1)
        self.provider = QFileIconProvider()
        self._icon_queue: list[QListWidgetItem] = []
        self._icon_timer = QTimer(self, interval=0, timeout=self._load_icons)

    def on_show(self):
        if not self.loaded:
            self.loaded = True
            self.grid.addItem(QListWidgetItem("Loading…"))
            run_bg(self.scan, self.got_apps)
        self.search.setFocus()
        self.search.selectAll()

    @staticmethod
    def scan():
        apps: dict[str, dict] = {}
        dirs = []
        if IS_WIN:
            dirs = [Path(os.environ.get("ProgramData", r"C:\ProgramData")) / r"Microsoft\Windows\Start Menu\Programs",
                    Path(os.environ.get("APPDATA", "")) / r"Microsoft\Windows\Start Menu\Programs"]
        skip = re.compile(r"uninstall|readme|help|documentation|license|release notes|website|manual", re.I)
        for d in dirs:
            if not d.exists():
                continue
            for p in d.rglob("*"):
                if p.suffix.lower() not in (".lnk", ".url") or skip.search(p.stem):
                    continue
                apps.setdefault(p.stem.lower(), {"name": p.stem, "path": str(p), "aumid": None})
        # Store / UWP apps (Settings, Calculator, WhatsApp, …) via Get-StartApps
        if IS_WIN:
            try:
                out = run_cmd(["powershell", "-NoProfile", "-Command",
                               "Get-StartApps | Select-Object Name,AppID | ConvertTo-Json -Compress"], timeout=20)
                data = json.loads(out) if out.strip() else []
                if isinstance(data, dict):
                    data = [data]
                for a in data:
                    name, aid = a.get("Name"), a.get("AppID")
                    if name and aid and name.lower() not in apps and not skip.search(name):
                        apps[name.lower()] = {"name": name, "path": None, "aumid": aid}
            except Exception as e:
                print("Get-StartApps failed:", e)
        return sorted(apps.values(), key=lambda a: a["name"].lower())

    def got_apps(self, res):
        self.grid.clear()
        if isinstance(res, Exception):
            self.grid.addItem(QListWidgetItem("Couldn't read the Start menu"))
            return
        self.apps = res
        if not res:
            self.grid.addItem(QListWidgetItem("No apps found"))
        placeholder = self._letter_icon
        for a in res:
            it = QListWidgetItem(placeholder(a["name"]), a["name"])
            it.setData(Qt.UserRole, a)
            it.setToolTip(a["name"])
            self.grid.addItem(it)
            if a["path"]:
                self._icon_queue.append(it)
        self._icon_timer.start()
        self.filter(self.search.text())

    def _load_icons(self):
        for _ in range(12):
            if not self._icon_queue:
                self._icon_timer.stop()
                return
            it = self._icon_queue.pop(0)
            a = it.data(Qt.UserRole)
            ic = self.provider.icon(QFileInfo(a["path"]))
            if not ic.isNull():
                it.setIcon(ic)

    @staticmethod
    def _letter_icon(name: str) -> QIcon:
        pm = QPixmap(40, 40)
        pm.fill(Qt.transparent)
        p = QPainter(pm)
        p.setRenderHint(QPainter.Antialiasing)
        hue = int(hashlib.md5(name.encode()).hexdigest()[:2], 16) * 360 // 256
        p.setBrush(QColor.fromHsv(hue, 90, 200))
        p.setPen(Qt.NoPen)
        p.drawRoundedRect(QRectF(2, 2, 36, 36), 10, 10)
        p.setPen(QColor("#11131a"))
        f = QFont()
        f.setPixelSize(18)
        f.setBold(True)
        p.setFont(f)
        p.drawText(pm.rect(), Qt.AlignCenter, name[:1].upper())
        p.end()
        return QIcon(pm)

    def filter(self, text):
        q = text.lower().strip()
        for i in range(self.grid.count()):
            it = self.grid.item(i)
            a = it.data(Qt.UserRole)
            if a is None:
                continue
            name = a["name"].lower()
            match = not q or q in name or "".join(w[:1] for w in name.split()) .startswith(q)
            it.setHidden(not match)

    def launch_first(self):
        for i in range(self.grid.count()):
            it = self.grid.item(i)
            if not it.isHidden() and it.data(Qt.UserRole):
                self.launch(it)
                return

    def launch(self, it: QListWidgetItem):
        a = it.data(Qt.UserRole)
        if not a:
            return
        try:
            if a["path"]:
                os.startfile(a["path"])  # type: ignore[attr-defined]
            elif a["aumid"]:
                subprocess.Popen(["explorer.exe", f"shell:AppsFolder\\{a['aumid']}"])
        except Exception as e:
            print("launch failed:", e)
        w = self.window()
        if hasattr(w, "hide_panel"):
            w.hide_panel()


class WallpaperPage(Page):
    EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    def __init__(self):
        super().__init__()
        root = QVBoxLayout(self)
        top = QHBoxLayout()
        self.folder_lbl = label("", "muted")
        top.addWidget(self.folder_lbl, 1)
        rnd = QPushButton("Random")
        rnd.clicked.connect(self.random)
        pick = QPushButton("Choose folder…")
        pick.clicked.connect(self.choose_folder)
        top.addWidget(rnd)
        top.addWidget(pick)
        root.addLayout(top)
        self.list = QListWidget()
        self.list.setViewMode(QListWidget.IconMode)
        self.list.setFlow(QListWidget.LeftToRight)
        self.list.setWrapping(False)
        self.list.setIconSize(QSize(256, 150))
        self.list.setSpacing(8)
        self.list.setMovement(QListWidget.Static)
        self.list.setHorizontalScrollMode(QListWidget.ScrollPerPixel)
        self.list.itemClicked.connect(self.apply)
        self.list.setStyleSheet(f"QListWidget::item:selected {{ background: transparent; border: 3px solid {ACCENT}; }}")
        root.addWidget(self.list, 1)
        self.status = label("", "muted")
        root.addWidget(self.status)
        self.folder = CFG.get("wallpaper_folder") or str(Path.home() / "Pictures")
        self.loaded_folder = None
        self._gen = 0

    def on_show(self):
        if self.loaded_folder != self.folder:
            self.load()

    def choose_folder(self):
        f = QFileDialog.getExistingDirectory(self, "Wallpaper folder", self.folder)
        if f:
            self.folder = f
            CFG["wallpaper_folder"] = f
            save_config(CFG)
            self.load()

    def load(self):
        self.loaded_folder = self.folder
        self.folder_lbl.setText(self.folder)
        self.list.clear()
        files = []
        try:
            files = sorted(p for p in Path(self.folder).iterdir() if p.suffix.lower() in self.EXTS)
        except Exception:
            pass
        self.status.setText(f"{len(files)} pictures" if files else "No pictures here — choose a folder.")
        current = os.path.normcase(Win.current_wallpaper())
        self._gen += 1
        gen = self._gen
        items = []
        for f in files:
            it = QListWidgetItem()
            it.setData(Qt.UserRole, str(f))
            it.setToolTip(f.name)
            it.setSizeHint(QSize(268, 162))
            self.list.addItem(it)
            items.append(it)
            if os.path.normcase(str(f)) == current:
                self.list.setCurrentItem(it)

        def thumbs():
            out = []
            for f in files:
                img = QImage(str(f))
                if not img.isNull():
                    img = img.scaled(256, 150, Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)
                    x = (img.width() - 256) // 2
                    y = (img.height() - 150) // 2
                    img = img.copy(x, y, 256, 150)
                out.append(img)
                if len(out) % 6 == 0:
                    DISPATCH.sig.emit(self._apply_thumbs, (gen, items, list(out)))
            return gen, items, out
        run_bg(thumbs, self._apply_thumbs)
        if self.list.currentItem():
            self.list.scrollToItem(self.list.currentItem(), QListWidget.PositionAtCenter)

    def _apply_thumbs(self, res):
        if isinstance(res, Exception):
            return
        gen, items, imgs = res
        if gen != self._gen:
            return
        for it, img in zip(items, imgs):
            if not img.isNull() and it.icon().isNull():
                it.setIcon(QIcon(QPixmap.fromImage(_round(img, 12))))

    def apply(self, it: QListWidgetItem):
        path = it.data(Qt.UserRole)
        ok = Win.set_wallpaper(path)
        self.status.setText(f"Wallpaper set: {Path(path).name}" if ok or not IS_WIN else "Couldn't set wallpaper")

    def random(self):
        if self.list.count():
            it = self.list.item(random.randrange(self.list.count()))
            self.list.setCurrentItem(it)
            self.list.scrollToItem(it, QListWidget.PositionAtCenter)
            self.apply(it)


def _round(img: QImage, r: int) -> QImage:
    out = QImage(img.size(), QImage.Format_ARGB32_Premultiplied)
    out.fill(Qt.transparent)
    p = QPainter(out)
    p.setRenderHint(QPainter.Antialiasing)
    p.setBrush(QPixmap.fromImage(img))
    p.setPen(Qt.NoPen)
    p.drawRoundedRect(QRectF(0, 0, img.width(), img.height()), r, r)
    p.end()
    return out


class PowerPage(Page):
    ACTIONS = [("lock", "lock", "Lock", False), ("moon", "sleep", "Sleep", False),
               ("signout", "signout", "Sign out", True), ("restart", "restart", "Restart", True),
               ("power", "shutdown", "Shut down", True)]

    def __init__(self):
        super().__init__()
        root = QVBoxLayout(self)
        root.addStretch()
        row = QHBoxLayout()
        row.setSpacing(14)
        row.addStretch()
        self.buttons = {}
        self.armed = None
        for icon, action, text, confirm in self.ACTIONS:
            b = QPushButton()
            b.setFixedSize(130, 120)
            b.setCursor(Qt.PointingHandCursor)
            lay = QVBoxLayout(b)
            ic = glyph(icon, 28)
            ic.setAlignment(Qt.AlignCenter)
            tl = label(text)
            tl.setAlignment(Qt.AlignCenter)
            lay.addStretch()
            lay.addWidget(ic)
            lay.addWidget(tl)
            lay.addStretch()
            b.setStyleSheet("QPushButton { border-radius: 20px; background:#23272e; }"
                            "QPushButton:hover { background:#2d323a; }")
            b.clicked.connect(lambda _=False, a=action, c=confirm: self.press(a, c))
            row.addWidget(b)
            self.buttons[action] = (b, tl, text)
        row.addStretch()
        root.addLayout(row)
        self.hint = label("Restart, sign out and shut down ask for a second click.", "muted")
        self.hint.setAlignment(Qt.AlignCenter)
        root.addSpacing(10)
        root.addWidget(self.hint)
        root.addStretch()
        self.disarm_timer = QTimer(self, singleShot=True, interval=3000, timeout=self.disarm)

    def press(self, action, confirm):
        if confirm and self.armed != action:
            self.disarm()
            self.armed = action
            b, tl, _ = self.buttons[action]
            tl.setText("Click again")
            b.setStyleSheet("QPushButton { border-radius: 20px; background:#5a2a2d; }")
            self.disarm_timer.start()
            return
        self.disarm()
        w = self.window()
        if hasattr(w, "hide_panel"):
            w.hide_panel()
        QTimer.singleShot(250, lambda: Win.power(action))

    def disarm(self):
        if self.armed:
            b, tl, text = self.buttons[self.armed]
            tl.setText(text)
            b.setStyleSheet("QPushButton { border-radius: 20px; background:#23272e; }"
                            "QPushButton:hover { background:#2d323a; }")
        self.armed = None

    def on_hide(self):
        self.disarm()


# ───────────────────────────── main panel window ─────────────────────────────

class Panel(QWidget):
    TABS = [("Controls", ControlsPage), ("Today", TodayPage), ("Stats", StatsPage),
            ("Clipboard", ClipboardPage), ("Apps", AppsPage), ("Wallpaper", WallpaperPage),
            ("Power", PowerPage)]

    def __init__(self):
        super().__init__(None, Qt.FramelessWindowHint | Qt.Tool | Qt.WindowStaysOnTopHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setWindowTitle(APP_NAME)
        W, H = int(CFG["panel_width"]), int(CFG["panel_height"])
        self.resize(W + 48, H + 36)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(24, 6, 24, 30)
        self.frame = QFrame()
        self.frame.setObjectName("panel")
        shadow = QGraphicsDropShadowEffect(self.frame)
        shadow.setBlurRadius(36)
        shadow.setOffset(QPointF(0, 8))
        shadow.setColor(QColor(0, 0, 0, 150))
        self.frame.setGraphicsEffect(shadow)
        outer.addWidget(self.frame)

        lay = QVBoxLayout(self.frame)
        lay.setContentsMargins(18, 12, 18, 16)
        lay.setSpacing(12)
        tabs = QHBoxLayout()
        tabs.setSpacing(4)
        tabs.addStretch()
        self.tab_btns = []
        self.stack = QStackedWidget()
        for i, (name, cls) in enumerate(self.TABS):
            b = QPushButton(name)
            b.setObjectName("tabbtn")
            b.setCheckable(True)
            b.setCursor(Qt.PointingHandCursor)
            b.clicked.connect(lambda _=False, idx=i: self.set_tab(idx))
            tabs.addWidget(b)
            self.tab_btns.append(b)
            self.stack.addWidget(cls())
        tabs.addStretch()
        lay.addLayout(tabs)
        lay.addWidget(self.stack, 1)

        for i in range(len(self.TABS)):
            QShortcut(QKeySequence(f"Ctrl+{i + 1}"), self, activated=lambda idx=i: self.set_tab(idx))
        QShortcut(QKeySequence("Ctrl+Tab"), self, activated=lambda: self.set_tab((self.stack.currentIndex() + 1) % len(self.TABS)))
        QShortcut(QKeySequence("Ctrl+Shift+Tab"), self, activated=lambda: self.set_tab((self.stack.currentIndex() - 1) % len(self.TABS)))
        QShortcut(QKeySequence(Qt.Key_Escape), self, activated=self.hide_panel)

        self.anim = QPropertyAnimation(self, b"pos", self)
        self.anim.setDuration(220)
        self.anim.setEasingCurve(QEasingCurve.OutCubic)
        self.anim.finished.connect(self._anim_done)
        self._hiding = False
        self._shown_at = 0.0
        self.current = 0
        self.tab_btns[0].setChecked(True)

        # auto-hide when the mouse wanders off and we don't have focus
        self.away_timer = QTimer(self, interval=200, timeout=self._check_away)
        self._away_since = None

    # tabs
    def set_tab(self, idx):
        if idx == self.current and self.isVisible():
            return
        old = self.stack.widget(self.current)
        if self.isVisible():
            old.on_hide()
        self.current = idx
        self.stack.setCurrentIndex(idx)
        for i, b in enumerate(self.tab_btns):
            b.setChecked(i == idx)
        if self.isVisible():
            self.stack.widget(idx).on_show()

    # show / hide
    def toggle(self):
        if self.isVisible() and not self._hiding:
            self.hide_panel()
        else:
            self.show_panel()

    def _geometry_targets(self):
        screen = QGuiApplication.screenAt(QCursor.pos()) or QGuiApplication.primaryScreen()
        g = screen.availableGeometry()
        x = g.x() + (g.width() - self.width()) // 2
        return QPoint(x, g.y() - self.height()), QPoint(x, g.y())

    def show_panel(self):
        start, end = self._geometry_targets()
        self._hiding = False
        self.anim.stop()
        if not self.isVisible():
            self.move(start)
            self.show()
            self.stack.currentWidget().on_show()
        self.raise_()
        self.activateWindow()
        if IS_WIN:
            user32.SetForegroundWindow(int(self.winId()))
        self.anim.setStartValue(self.pos())
        self.anim.setEndValue(end)
        self.anim.start()
        self._shown_at = time.time()
        self.away_timer.start()

    def hide_panel(self):
        if not self.isVisible() or self._hiding:
            return
        self._hiding = True
        self.away_timer.stop()
        start, _ = self._geometry_targets()
        start.setX(self.x())
        self.anim.stop()
        self.anim.setStartValue(self.pos())
        self.anim.setEndValue(start)
        self.anim.start()

    def _anim_done(self):
        if self._hiding:
            self.hide()
            self._hiding = False
            self.stack.currentWidget().on_hide()

    def _check_away(self):
        if time.time() - self._shown_at < 0.6:
            return
        inside = self.frameGeometry().adjusted(0, 0, 0, 40).contains(QCursor.pos())
        if self.isActiveWindow() or inside or QApplication.activeModalWidget() or QApplication.activePopupWidget():
            self._away_since = None
            return
        self._away_since = self._away_since or time.time()
        if time.time() - self._away_since > 0.5:
            self._away_since = None
            self.hide_panel()

    def changeEvent(self, e):
        from PySide6.QtCore import QEvent
        if e.type() == QEvent.ActivationChange and not self.isActiveWindow():
            if (time.time() - self._shown_at > 0.4 and not QApplication.activeModalWidget()
                    and not self.frameGeometry().contains(QCursor.pos())):
                self.hide_panel()
        super().changeEvent(e)


class HotEdge(QObject):
    """Opens the panel when the cursor rests on the top-centre edge of a screen."""

    def __init__(self, panel: Panel):
        super().__init__()
        self.panel = panel
        self.since = None
        self.timer = QTimer(self, interval=60, timeout=self.check)
        if CFG.get("hot_edge", True):
            self.timer.start()

    def check(self):
        if self.panel.isVisible():
            self.since = None
            return
        if QApplication.mouseButtons() != Qt.NoButton:   # don't fire while dragging windows
            self.since = None
            return
        pos = QCursor.pos()
        screen = QGuiApplication.screenAt(pos)
        if not screen:
            return
        g = screen.geometry()
        third = g.width() // 3
        if pos.y() <= g.y() + 1 and g.x() + third <= pos.x() <= g.x() + 2 * third:
            self.since = self.since or time.time()
            if (time.time() - self.since) * 1000 >= CFG.get("hot_edge_delay_ms", 250):
                self.since = None
                self.panel.show_panel()
        else:
            self.since = None


# ───────────────────────────── app entry ─────────────────────────────

def main():
    global DISPATCH
    QApplication.setHighDpiScaleFactorRoundingPolicy(Qt.HighDpiScaleFactorRoundingPolicy.PassThrough)
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setQuitOnLastWindowClosed(False)

    # single instance: a second launch just toggles the running panel
    server_name = f"{APP_NAME}-{os.getlogin() if hasattr(os, 'getlogin') else 'user'}"
    sock = QLocalSocket()
    sock.connectToServer(server_name)
    if sock.waitForConnected(300):
        sock.write(b"toggle")
        sock.flush()
        sock.waitForBytesWritten(300)
        return 0

    DISPATCH = Dispatcher()
    app.setStyleSheet(STYLE)
    panel = Panel()

    server = QLocalServer()
    QLocalServer.removeServer(server_name)
    server.listen(server_name)

    def on_conn():
        c = server.nextPendingConnection()
        c.readyRead.connect(lambda: (c.readAll(), panel.show_panel()))
    server.newConnection.connect(on_conn)

    # tray
    tray = QSystemTrayIcon(make_tray_icon())
    tray.setToolTip(f"{APP_NAME} — {CFG['hotkey']}")
    menu = QMenu()
    menu.addAction("Open panel", panel.show_panel)
    auto = QAction("Start with Windows", menu, checkable=True)
    auto.setChecked(Win.autostart())
    auto.toggled.connect(Win.set_autostart)
    auto.setEnabled(IS_WIN)
    menu.addAction(auto)
    menu.addAction("Edit settings (config.json)", lambda: os.startfile(CONFIG_PATH) if IS_WIN else print(CONFIG_PATH))
    menu.addSeparator()

    def quit_app():
        if panel.stack.widget(0).night_on:
            Win.set_warm(0)
        hk.stop()
        app.quit()
    menu.addAction("Quit", quit_app)
    tray.setContextMenu(menu)
    tray.activated.connect(lambda r: panel.toggle() if r == QSystemTrayIcon.Trigger else None)
    tray.show()

    def hotkey_failed(combo):
        tray.showMessage(APP_NAME, f"Hotkey {combo} is taken by another app. "
                                   f"Change \"hotkey\" in config.json.", QSystemTrayIcon.Warning, 6000)
    hk = HotkeyThread(CFG.get("hotkey", "ctrl+alt+space"), lambda _: panel.toggle(), hotkey_failed)
    hk.start()
    edge = HotEdge(panel)  # noqa: F841  (kept alive)

    if "--show" in sys.argv or not IS_WIN:
        QTimer.singleShot(300, panel.show_panel)
    else:
        tray.showMessage(APP_NAME, f"Running. Press {CFG['hotkey'].title()} or push the mouse to the top edge.",
                         QSystemTrayIcon.Information, 4000)
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
