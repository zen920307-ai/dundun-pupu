' 墩墩和噗噗 · 内容后台 隐藏启动脚本
' 双击桌面快捷方式 → 后台服务在后台启动（无黑窗口）→ 自动打开浏览器
' 若服务已在运行，则只打开浏览器页面，不会重复启动
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

Dim baseDir, nodeExe
baseDir = "K:\墩墩和噗噗\dundun-pupu-site"
nodeExe = "C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node.exe"

If Not fso.FileExists(nodeExe) Then
  ' 找不到固定版本就用系统 PATH 里的 node
  nodeExe = "node.exe"
End If

sh.CurrentDirectory = baseDir
sh.Run """" & nodeExe & """ admin-local\server.mjs", 0, False
