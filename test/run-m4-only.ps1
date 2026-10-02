$root = "C:\Users\Brittany\super-intelligence-game"
node "$root\test\make-m4-only.js"
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$prof = "C:\Users\Brittany\AppData\Local\Temp\opencode\edge-m4o-" + (Get-Random)
$o = "C:\Users\Brittany\AppData\Local\Temp\opencode\m4o.txt"
$e = "C:\Users\Brittany\AppData\Local\Temp\opencode\m4o.err.txt"
Remove-Item $o, $e -ErrorAction SilentlyContinue
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$p = Start-Process -FilePath $edge -ArgumentList `
  "--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=$prof", `
  "--virtual-time-budget=6000", "--dump-dom", `
  "file:///C:/Users/Brittany/super-intelligence-game/test/m4-only.html" `
  -RedirectStandardOutput $o -RedirectStandardError $e -NoNewWindow -PassThru
$p.WaitForExit(90000) | Out-Null
Start-Sleep -Milliseconds 1200
$txt = $null
for ($try = 0; $try -lt 8 -and -not $txt; $try++) { try { $txt = [IO.File]::ReadAllText($o) } catch { Start-Sleep -Milliseconds 600 } }
$m = [regex]::Match($txt, '<div id="selftestOut"[^>]*>([\s\S]*?)</div>')
if ($m.Success) { "M4-ONLY >>> [" + $m.Groups[1].Value.Substring(0, [Math]::Min(500, $m.Groups[1].Value.Length)) + "]" } else { "NO OUTPUT" }
