$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$HOME\Desktop\QANTUM-JULES.lnk")
$Shortcut.TargetPath = "c:\Users\papic\Downloads\RUST-AEGIS\QANTUM-JULES\LAUNCH_SOVEREIGN.bat"
$Shortcut.WorkingDirectory = "c:\Users\papic\Downloads\RUST-AEGIS\QANTUM-JULES"
$Shortcut.Description = "Execute Quantum Sovereign Protocol"
# Since we don't have a .ico, we will point to the png location for the user to see, 
# although Windows usually needs an .ico for the icon to show up correctly in the explorer.
# $Shortcut.IconLocation = "c:\Users\papic\Downloads\RUST-AEGIS\QANTUM-JULES\sovereign_logo.png"
$Shortcut.Save()

Write-Host "⚡ SOVEREIGN SHORTCUT MANIFESTED ON DESKTOP." -ForegroundColor Cyan
