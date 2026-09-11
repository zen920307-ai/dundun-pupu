' dundun-pupu admin launcher
' NOTE: keep this file ASCII-only. wscript reads .vbs as ANSI,
' so any non-ASCII character in the paths would break the launcher.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
baseDir = fso.GetParentFolderName(scriptDir)
sh.CurrentDirectory = baseDir

nodeExe = "C:\Program Files\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node.exe"
End If
If Not fso.FileExists(nodeExe) Then
  nodeExe = "node.exe"
End If

chromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
' Unique query so Chrome cannot reuse an already-open tab (user wants a new tab).
url = "http://127.0.0.1:4321/?open=" & Year(Now) & Right("0" & Month(Now), 2) & Right("0" & Day(Now), 2) & Right("0" & Hour(Now), 2) & Right("0" & Minute(Now), 2) & Right("0" & Second(Now), 2)

' Start server hidden. --no-browser: this script opens Chrome itself so the
' process is still user-initiated and Windows 11 will let it take focus.
' (node child_process with windowsHide cannot steal the foreground.)
sh.Run """" & nodeExe & """ admin-local\server.mjs --no-browser", 0, False
WScript.Sleep 800

' Style 1 = normal window. Do not use 0/7 or Chrome stays behind / minimized.
If fso.FileExists(chromeExe) Then
  sh.Run """" & chromeExe & """ --new-tab " & url, 1, False
Else
  sh.Run "cmd /c start """" " & url, 1, False
End If
WScript.Sleep 400
sh.AppActivate "Google Chrome"
