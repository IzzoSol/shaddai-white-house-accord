$root = "C:\Users\Brittany\super-intelligence-game"
node "$root\test\make-selftest.js"
$o = "C:\Users\Brittany\AppData\Local\Temp\opencode\dom.txt"
$e = "C:\Users\Brittany\AppData\Local\Temp\opencode\dom.err.txt"
Remove-Item $o, $e -ErrorAction SilentlyContinue
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$p = Start-Process -FilePath $edge -ArgumentList `
  "--headless=new", "--disable-gpu", "--no-first-run", `
  "--user-data-dir=C:\Users\Brittany\AppData\Local\Temp\opencode\edge-st", `
  "--virtual-time-budget=60000", "--window-size=1600,900", "--dump-dom", `
  "file:///C:/Users/Brittany/super-intelligence-game/test/browser-selftest.html" `
  -RedirectStandardOutput $o -RedirectStandardError $e -NoNewWindow -PassThru
$p.WaitForExit(120000) | Out-Null
Start-Sleep -Milliseconds 1500
$txt = $null
for ($try = 0; $try -lt 10 -and -not $txt; $try++) {
  try { $txt = [IO.File]::ReadAllText($o) } catch { Start-Sleep -Milliseconds 700 }
}
if (-not $txt) { "NO RESULT (could not read dump)"; exit 1 }
$m = [regex]::Match($txt, '<div id="selftestOut"[^>]*>(.*?)</div>')
if ($m.Success) { "RESULT >>> " + $m.Groups[1].Value } else { "NO RESULT (browser exited early)" }
