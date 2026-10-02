$root = "C:\Users\Brittany\super-intelligence-game"
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$prof = "C:\Users\Brittany\AppData\Local\Temp\opencode\edge-m4-" + (Get-Random)
$png = "C:\Users\Brittany\AppData\Local\Temp\opencode\m4.png"
$o = "C:\Users\Brittany\AppData\Local\Temp\opencode\m4-dom.txt"
$e = "C:\Users\Brittany\AppData\Local\Temp\opencode\m4.err.txt"
Remove-Item $png, $o, $e -ErrorAction SilentlyContinue
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$p = Start-Process -FilePath $edge -ArgumentList `
  "--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=$prof", `
  "--virtual-time-budget=8000", "--window-size=1280,720", "--screenshot=$png", `
  "file:///C:/Users/Brittany/super-intelligence-game/test/bs-m4.html" `
  -RedirectStandardError $e -NoNewWindow -PassThru
$p.WaitForExit(150000) | Out-Null
$sw.Stop()
Start-Sleep -Milliseconds 1000
"real-time: " + [math]::Round($sw.Elapsed.TotalSeconds, 1) + "s   png: " + (Test-Path $png) + " " + (Get-Item $png -ErrorAction SilentlyContinue).Length + " bytes"
Get-Content $e -ErrorAction SilentlyContinue | Select-String -Pattern "CONSOLE|Shutdown" | Select-Object -Last 3 | ForEach-Object { $_.Line.Substring(0, [Math]::Min(140, $_.Line.Length)) }
