$root = "C:\Users\Brittany\super-intelligence-game"
node "$root\test\bisect-selftest.js"
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
foreach ($ver in @("m4", "m5")) {
  $prof = "C:\Users\Brittany\AppData\Local\Temp\opencode\edge-bs-" + (Get-Random)
  $o = "C:\Users\Brittany\AppData\Local\Temp\opencode\bs-$ver.txt"
  $e = "C:\Users\Brittany\AppData\Local\Temp\opencode\bs-$ver.err.txt"
  Remove-Item $o, $e -ErrorAction SilentlyContinue
  $p = Start-Process -FilePath $edge -ArgumentList `
    "--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=$prof", `
    "--virtual-time-budget=8000", "--dump-dom", `
    ("file:///C:/Users/Brittany/super-intelligence-game/test/bs-$ver.html") `
    -RedirectStandardOutput $o -RedirectStandardError $e -NoNewWindow -PassThru
  $p.WaitForExit(90000) | Out-Null
  Start-Sleep -Milliseconds 1000
  $txt = $null
  for ($try = 0; $try -lt 8 -and -not $txt; $try++) { try { $txt = [IO.File]::ReadAllText($o) } catch { Start-Sleep -Milliseconds 600 } }
  $m = [regex]::Match($txt, '<div id="selftestOut"[^>]*>([\s\S]*?)</div>')
  if ($m.Success) { "$ver >>> [" + $m.Groups[1].Value.Substring(0, [Math]::Min(400, $m.Groups[1].Value.Length)) + "]" } else { "$ver >>> NO OUTPUT" }
}
