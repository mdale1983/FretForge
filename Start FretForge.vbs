Option Explicit

Dim fileSystem, shell, projectDirectory, logPath, command

Set fileSystem = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

projectDirectory = fileSystem.GetParentFolderName(WScript.ScriptFullName)
logPath = fileSystem.BuildPath(projectDirectory, ".fretforge-dev.log")

command = "cmd.exe /d /c cd /d """ & projectDirectory & _
  """ && npm.cmd run tauri dev > """ & logPath & """ 2>&1"

' Window style 0 keeps the development terminal hidden. The process remains
' asynchronous so this launcher exits immediately after starting FretForge.
shell.Run command, 0, False
