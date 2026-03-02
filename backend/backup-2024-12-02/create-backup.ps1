# Database Backup Script for OHMS
# Created on: December 2, 2024
# This script creates a complete backup of the PostgreSQL database

# Load environment variables from .env file
$envFile = "../.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $key = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Parse DATABASE_URL to extract connection parameters
$databaseUrl = $env:DATABASE_URL
if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)") {
    $username = $matches[1]
    $password = $matches[2]
    $dbHost = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
} else {
    Write-Host "❌ Could not parse DATABASE_URL" -ForegroundColor Red
    Write-Host "DATABASE_URL format: $databaseUrl" -ForegroundColor Red
    exit 1
}

# Set PGPASSWORD for authentication
$env:PGPASSWORD = $password

# Create backup filename with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "ohms_backup_$timestamp.sql"

Write-Host "🔄 Creating database backup..." -ForegroundColor Yellow
Write-Host "Database: $database" -ForegroundColor Cyan
Write-Host "Host: $dbHost" -ForegroundColor Cyan
Write-Host "Backup file: $backupFile" -ForegroundColor Cyan

# Create the backup using pg_dump
try {
    $pgDumpArgs = @(
        "--host=$dbHost",
        "--port=$port",
        "--username=$username",
        "--format=custom",
        "--verbose",
        "--file=$backupFile",
        "$database"
    )
    
    & pg_dump @pgDumpArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database backup created successfully!" -ForegroundColor Green
        Write-Host "Backup saved to: $backupFile" -ForegroundColor Green
        
        # Get file size
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "Backup size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        
        # Also create a plain SQL backup for easier inspection
        $sqlBackupFile = "ohms_backup_$timestamp.sql"
        $sqlBackupArgs = @(
            "--host=$dbHost",
            "--port=$port",
            "--username=$username",
            "--format=plain",
            "--file=$sqlBackupFile",
            "$database"
        )
        
        Write-Host "🔄 Creating plain SQL backup for inspection..." -ForegroundColor Yellow
        & pg_dump @sqlBackupArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Plain SQL backup also created: $sqlBackupFile" -ForegroundColor Green
        }
        
    } else {
        Write-Host "❌ Backup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error creating backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Clean up environment variable
Remove-Item Env:PGPASSWORD