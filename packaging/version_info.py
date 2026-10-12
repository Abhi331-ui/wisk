"""Writes the Windows version resource PyInstaller embeds in Wisp.exe.

Usage: python packaging/version_info.py 1.0.1  >  packaging/version_info.txt
"""
import sys

ver = (sys.argv[1] if len(sys.argv) > 1 else "1.0.0").lstrip("v")
nums = [int(x) for x in (ver.split(".") + ["0"] * 4)[:4]]
t = tuple(nums)
print(f"""VSVersionInfo(
  ffi=FixedFileInfo(filevers={t}, prodvers={t}, mask=0x3f, flags=0x0, OS=0x40004,
                    fileType=0x1, subtype=0x0, date=(0, 0)),
  kids=[
    StringFileInfo([StringTable('040904B0', [
      StringStruct('CompanyName', 'Wisp'),
      StringStruct('FileDescription', 'Wisp - drop-down control panel for Windows'),
      StringStruct('FileVersion', '{ver}'),
      StringStruct('InternalName', 'Wisp'),
      StringStruct('LegalCopyright', 'Wisp contributors'),
      StringStruct('OriginalFilename', 'Wisp.exe'),
      StringStruct('ProductName', 'Wisp'),
      StringStruct('ProductVersion', '{ver}')])]),
    VarFileInfo([VarStruct('Translation', [1033, 1200])])
  ]
)""")
