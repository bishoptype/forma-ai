$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
foreach ($serviceName in @('backend','frontend')) {
    $pidPath = Join-Path $projectRoot ".run\$serviceName.pid"
    if (Test-Path -LiteralPath $pidPath) {
        $processId = [int](Get-Content -LiteralPath $pidPath)
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
        $expectedCommand = if ($serviceName -eq 'backend') { 'uvicorn app.main:app' } else { 'node_modules/vite/bin/vite.js' }
        if ($process -and $process.CommandLine -like "*$expectedCommand*") {
            Stop-Process -Id $processId
        }
        Remove-Item -LiteralPath $pidPath
    }
}
Write-Host 'Demo processes started by start-demo.ps1 have been stopped.'
