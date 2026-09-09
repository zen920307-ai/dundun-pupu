# -*- coding: utf-8 -*-
"""Create desktop shortcut for 墩墩和噗噗 site launcher."""
import os
import win32com.client

ws = win32com.client.Dispatch("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")
lnk = ws.CreateShortcut(os.path.join(desktop, "墩墩和噗噗.lnk"))
lnk.TargetPath = r"C:\Windows\System32\wscript.exe"
lnk.Arguments = r'"K:\墩墩和噗噗\dundun-pupu-site\scripts\start-site.vbs"'
lnk.WorkingDirectory = r"K:\墩墩和噗噗\dundun-pupu-site"
lnk.IconLocation = r"K:\墩墩和噗噗\dundun-pupu-site\scripts\dundun-pupu.ico"
lnk.Description = "启动墩墩和噗噗网站（后台静默）"
lnk.WindowStyle = 7
lnk.Save()
p = os.path.join(desktop, "墩墩和噗噗.lnk")
print("OK:", p, os.path.getsize(p), "bytes")
