$root = "C:\Users\Brittany\super-intelligence-game"
node "$root\test\make-shots.js"
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "C:\Users\Brittany\AppData\Local\Temp\opencode\shots"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
foreach ($name in @("room", "talk", "mini", "sign", "end")) {
  $prof = "C:\Users\Brittany\AppData\Local\Temp\opencode\edge-shot-" + (Get-Random)
  $png = Join-Path $outDir ("shot-" + $name + ".png")
  $p = Start-Process -FilePath $edge -ArgumentList `
    "--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=$prof", `
    "--virtual-time-budget=12000", "--window-size=1280,720", "--screenshot=$png", `
    ("file:///C:/Users/Brittany/super-intelligence-game/test/shot-" + $name + ".html") `
    -NoNewWindow -PassThru
  $p.WaitForExit(90000) | Out-Null
  Start-Sleep -Milliseconds 400
  $ok = (Test-Path $png) -and ((Get-Item $png).Length -gt 20000)
  "$name : " + $(if ($ok) { [math]::Round((Get-Item $png).Length / 1KB, 1).ToString() + " KB" } else { "FAILED/BLANK" })
}
