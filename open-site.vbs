' Dundun Pupu public site launcher. ASCII-only: wscript reads .vbs as ANSI.
' Hidden node window via Run style 0. No cmd, no powershell.
Option Explicit

Dim fso, sh, env, projectRoot, nodeExe, vinextJs, chromeExe, url, stamp, i
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

projectRoot = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = projectRoot

Set env = sh.Environment("PROCESS")
On Error Resume Next
env.Remove "HTTPS_PROXY"
env.Remove "https_proxy"
env.Remove "HTTP_PROXY"
env.Remove "http_proxy"
env.Remove "ALL_PROXY"
env.Remove "NODE_OPTIONS"
On Error GoTo 0
env("NO_PROXY") = "*"
env("no_proxy") = "*"

nodeExe = "C:\Program Files\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node.exe"
End If
If Not fso.FileExists(nodeExe) Then nodeExe = "node.exe"

vinextJs = fso.BuildPath(projectRoot, "node_modules\vinext\dist\cli.js")
chromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"

stamp = Year(Now) & Right("0" & Month(Now), 2) & Right("0" & Day(Now), 2) & Right("0" & Hour(Now), 2) & Right("0" & Minute(Now), 2) & Right("0" & Second(Now), 2)
url = "http://127.0.0.1:3000/?open=" & stamp

If Not IsSiteReady() Then
  KillOldDev
  If Not fso.FileExists(nodeExe) Or Not fso.FileExists(vinextJs) Then
    MsgBox "Local site launcher files were not found.", vbCritical, "DunDun PuPu"
    WScript.Quit 1
  End If
  sh.Run """" & nodeExe & """ """ & vinextJs & """ dev -H 127.0.0.1 -p 3000", 0, False
  For i = 1 To 180
    WScript.Sleep 250
    If IsSiteReady() Then Exit For
  Next
  If Not IsSiteReady() Then
    MsgBox "The local site could not start.", vbCritical, "DunDun PuPu"
    WScript.Quit 1
  End If
End If

If fso.FileExists(chromeExe) Then
  sh.Run """" & chromeExe & """ --new-tab " & url, 1, False
Else
  sh.Run url, 1, False
End If
WScript.Sleep 400
sh.AppActivate "Google Chrome"

Function IsSiteReady()
  Dim request
  On Error Resume Next
  Set request = CreateObject("WinHttp.WinHttpRequest.5.1")
  request.SetProxy 1
  Err.Clear
  request.SetTimeouts 800, 800, 2000, 2000
  request.Open "GET", "http://127.0.0.1:3000/", False
  request.Send
  IsSiteReady = (Err.Number = 0 And request.Status = 200)
  Err.Clear
  On Error GoTo 0
End Function

Sub KillOldDev
  Dim proc, cmd
  On Error Resume Next
  For Each proc In GetObject("winmgmts:").ExecQuery("Select * from Win32_Process Where Name='node.exe'")
    cmd = LCase(proc.CommandLine & "")
    If InStr(cmd, "vinext") > 0 And InStr(cmd, "-p 3000") > 0 Then
      proc.Terminate
    End If
  Next
  Err.Clear
  On Error GoTo 0
End Sub
