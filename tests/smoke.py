"""Headless smoke test: start Wisp, open every tab, copy to the clipboard, quit.

Run with QT_QPA_PLATFORM=offscreen. Exits non-zero if anything raised.
"""
import os
import runpy
import sys
import tempfile
from pathlib import Path

os.environ["APPDATA"] = tempfile.mkdtemp(prefix="wisp-test-")
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
sys.argv = ["wisp.py", "--show"]

from PySide6.QtCore import QTimer  # noqa: E402
from PySide6.QtWidgets import QApplication  # noqa: E402

errors = []
_real_exec = QApplication.exec


def _exec(*_):
    app = QApplication.instance()
    hook = sys.excepthook

    def record(*exc):
        errors.append(exc)
        hook(*exc)
    sys.excepthook = record

    def drive():
        panel = next(w for w in app.topLevelWidgets() if type(w).__name__ == "Panel")

        def step(i=0):
            if i < len(panel.TABS):
                print("tab:", panel.TABS[i][0], flush=True)
                panel.set_tab(i)
                QTimer.singleShot(1500, lambda: step(i + 1))
                return
            clip = panel.stack.widget(3)
            app.clipboard().setText("smoke test https://example.com")

            def finish():
                if not any(it.get("text") == "smoke test https://example.com" for it in clip.items):
                    errors.append("clipboard text was not captured")
                panel.hide_panel()
                QTimer.singleShot(600, app.quit)
            QTimer.singleShot(500, finish)
        step()

    QTimer.singleShot(800, drive)
    QTimer.singleShot(45000, lambda: (errors.append("timed out"), app.quit()))
    return _real_exec()


QApplication.exec = _exec
try:
    runpy.run_path(str(Path(__file__).resolve().parent.parent / "wisp.py"), run_name="__main__")
except SystemExit:
    pass

if errors:
    print("SMOKE TEST FAILED:", errors)
    sys.exit(1)
print("smoke test passed")
