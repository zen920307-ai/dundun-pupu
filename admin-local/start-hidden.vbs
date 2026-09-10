' dundun-pupu admin launcher
' NOTE: keep this file ASCII-only. wscript reads .vbs as ANSI,
' so any non-ASCII character in the paths would break the launcher.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

' derive project dir from this script's location (no Chinese literals here)
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
baseDir = fso.GetParentFolderName(scriptDir)

nodeExe = "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = "node.exe"
End If

sh.CurrentDirectory = baseDir
sh.Run """" & nodeExe & """ admin-local\server.mjs", 0, False
