Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Lenovo\teach"
WshShell.Run "cmd.exe /c npm run electron:dev", 0, False
