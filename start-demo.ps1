$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.run'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$pythonPath = Join-Path $projectRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) {
    & python -m venv (Join-Path $projectRoot '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Python environment creation failed.' }
}
& $pythonPath -m pip install -r (Join-Path $projectRoot 'backend\requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Backend dependencies failed.' }
Push-Location (Join-Path $projectRoot 'frontend')
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Frontend dependencies failed.' }
    }
} finally { Pop-Location }
$apiReady = $false
try { $apiReady = (Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 2).status -eq 'ok' } catch {}
if (-not $apiReady) {
    $apiProcess = Start-Process -FilePath $pythonPath -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000' -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'backend.log') -RedirectStandardError (Join-Path $runtimeDir 'backend-error.log')
    $apiProcess.Id | Set-Content -LiteralPath (Join-Path $runtimeDir 'backend.pid')
}
$webReady = $false
try { $webReady = (Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 2).Content.Contains('Forma AI') } catch {}
if (-not $webReady) {
    $nodePath = (Get-Command node.exe).Source
    $webProcess = Start-Process -FilePath $nodePath -ArgumentList 'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort' -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.log') -RedirectStandardError (Join-Path $runtimeDir 'frontend-error.log')
    $webProcess.Id | Set-Content -LiteralPath (Join-Path $runtimeDir 'frontend.pid')
}
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        $ready = (Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 1).status -eq 'ok'
        $web = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 1
        if ($ready -and $web.StatusCode -eq 200) {
            Write-Host 'Forma AI is ready: http://127.0.0.1:5173'
            Start-Process 'http://127.0.0.1:5173'
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds 1
}
throw 'Startup timed out. Check .run logs in the project folder.'
