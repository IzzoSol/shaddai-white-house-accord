$root = "C:\Users\Brittany\super-intelligence-game"
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
foreach ($page in @("bs-half", "bs-m4")) {
  $prof = "C:\Users\Brittany\AppData\Local\Temp\opencode\edge-" + $page + "-" + (Get-Random)
  $o = "C:\Users\Brittany\AppData\Local\Temp\opencode\" + $page + "-out.txt"
  $e = "C:\Users\Brittany\AppData\Local\Temp\opencode\" + $page + "-err.txt"
  Remove-Item $o, $e -ErrorAction SilentlyContinue
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $p = Start-Process -FilePath $edge -ArgumentList `
    "--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=$prof", `
    "--virtual-time-budget=20000", "--dump-dom", `
    ("file:///C:/Users/Brittany/super-intelligence-game/test/" + $page + ".html") `
    -RedirectStandardOutput $o -RedirectStandardError $e -NoNewWindow -PassThru
  $p.WaitForExit(120000) | Out-Null
  $sw.Stop()
  Start-Sleep -Milliseconds 1200
  $txt = $null
  for ($try = 0; $try -lt 8 -and -not $txt; $try++) { try { $txt = [IO.File]::ReadAllText($o) } catch { Start-Sleep -Milliseconds 600 } }
  $m = [regex]::Match($txt, '<div id="selftestOut"[^>]*>([\s\S]*?)</div>')
  $res = if ($m.Success) { $m.Groups[1].Value.Substring(0, [Math]::Min(280, $m.Groups[1].Value.Length)) } else { "NO DIV" }
  "$page (" + [math]::Round($sw.Elapsed.TotalSeconds, 1) + "s) >>> [$res]"
}
