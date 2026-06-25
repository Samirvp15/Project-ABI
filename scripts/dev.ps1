# ABI — Development helpers (PowerShell)

$Root = Split-Path -Parent $PSScriptRoot

function Start-AbiStack {
    Write-Host "Starting PostgreSQL via Docker Compose..."
    docker compose -f "$Root\docker\docker-compose.yml" up -d postgres
    Write-Host "Waiting for Postgres..."
    Start-Sleep -Seconds 5
}

function Init-AbiDb {
    Push-Location "$Root\backend"
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        & .\.venv\Scripts\Activate.ps1
    }
    alembic upgrade head
    Pop-Location
}

function Start-AbiBackend {
    Push-Location "$Root\backend"
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        & .\.venv\Scripts\Activate.ps1
    }
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

function Start-AbiFrontend {
    Push-Location "$Root\frontend"
    npm run dev
}

Write-Host @"
ABI Dev Scripts loaded. Available commands:
  Start-AbiStack     - Start PostgreSQL container
  Init-AbiDb         - Run Alembic migrations
  Start-AbiBackend   - Run FastAPI dev server
  Start-AbiFrontend  - Run Next.js dev server
"@
