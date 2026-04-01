param(
    [string]$DbName = "insureon_db",
    [string]$DbUser = "insureon_user",
    [string]$DbPassword = "insureon_pass",
    [string]$PgVersion = "16",
    [string]$PgSuperPassword = "postgres"
)

$ErrorActionPreference = "Stop"

# Windows PostgreSQL setup script (PowerShell)
# Run in elevated PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\setup_postgresql_windows.ps1 -DbName insureon_db -DbUser insureon_user -DbPassword strong_password -PgSuperPassword very_strong_postgres_password

function Ensure-Chocolatey {
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
}

function Ensure-Postgres {
    Write-Host "Installing PostgreSQL via Chocolatey..."
    choco install postgresql$PgVersion --params "/Password:$PgSuperPassword" -y --no-progress
}

function Find-Psql {
    $candidates = @(
        "C:\\Program Files\\PostgreSQL\\$PgVersion\\bin\\psql.exe",
        "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
        "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe",
        "C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe"
    )

    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }

    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    throw "Could not find psql.exe. Check PostgreSQL installation."
}

Ensure-Chocolatey
Ensure-Postgres

$psql = Find-Psql
$env:PGPASSWORD = $PgSuperPassword

Write-Host "Creating database user if it does not exist..."
& $psql -U postgres -h localhost -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DbUser'" | Out-String | ForEach-Object {
    if ($_ -notmatch "1") {
        & $psql -U postgres -h localhost -d postgres -c "CREATE USER $DbUser WITH PASSWORD '$DbPassword';"
    }
}

Write-Host "Creating database if it does not exist..."
& $psql -U postgres -h localhost -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" | Out-String | ForEach-Object {
    if ($_ -notmatch "1") {
        & $psql -U postgres -h localhost -d postgres -c "CREATE DATABASE $DbName OWNER $DbUser;"
    }
}

Write-Host "Granting privileges..."
& $psql -U postgres -h localhost -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;"

Write-Host "PostgreSQL setup complete."
Write-Host "Database: $DbName"
Write-Host "User: $DbUser"
Write-Host "Local connection string: postgresql://$DbUser:$DbPassword@localhost:5432/$DbName"
