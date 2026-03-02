# Database Restore Script for OHMS
# Created on: December 2, 2024
# This script restores the PostgreSQL database from backup
# ⚠️  WARNING: This will completely replace the current database!

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [switch]$Force
)

if (-not $Force) {
    Write-Host "⚠️  WARNING: This will completely replace the current database!" -ForegroundColor Red
    Write-Host "⚠️  ALL CURRENT DATA WILL BE LOST!" -ForegroundColor Red
    $confirmation = Read-Host "Are you sure you want to continue? Type 'YES' to confirm"
    if ($confirmation -ne "YES") {
        Write-Host "❌ Restore cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

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

Write-Host "🔄 Starting database restore..." -ForegroundColor Yellow
Write-Host "Database: $database" -ForegroundColor Cyan
Write-Host "Host: $dbHost" -ForegroundColor Cyan
Write-Host "Backup file: $BackupFile" -ForegroundColor Cyan

# First, try to terminate active connections to the database
Write-Host "🔄 Terminating active connections..." -ForegroundColor Yellow
try {
    $terminateQuery = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$database' AND pid <> pg_backend_pid();"
    $psqlArgs = @(
        "--host=$dbHost",
        "--port=$port",
        "--username=$username",
        "--dbname=postgres",
        "--command=$terminateQuery"
    )
    & psql @psqlArgs 2>$null
} catch {
    Write-Host "⚠️  Could not terminate connections, continuing anyway..." -ForegroundColor Yellow
}

# Drop and recreate the database
Write-Host "🔄 Dropping and recreating database..." -ForegroundColor Yellow
try {
    # Drop database
    $dropQuery = "DROP DATABASE IF EXISTS `"$database`";"
    $psqlArgs = @(
        "--host=$dbHost",
        "--port=$port",
        "--username=$username",
        "--dbname=postgres",
        "--command=$dropQuery"
    )
    & psql @psqlArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database dropped successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to drop database" -ForegroundColor Red
        exit 1
    }
    
    # Create database
    $createQuery = "CREATE DATABASE `"$database`";"
    $psqlArgs = @(
        "--host=$dbHost",
        "--port=$port",
        "--username=$username",
        "--dbname=postgres",
        "--command=$createQuery"
    )
    & psql @psqlArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error managing database: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Restore the backup
Write-Host "🔄 Restoring backup..." -ForegroundColor Yellow
try {
    # Check if it's a custom format backup or SQL format
    $fileExtension = [System.IO.Path]::GetExtension($BackupFile)
    
    if ($fileExtension -eq ".sql") {
        # SQL format restore
        $psqlArgs = @(
            "--host=$dbHost",
            "--port=$port",
            "--username=$username",
            "--dbname=$database",
            "--file=$BackupFile"
        )
        & psql @psqlArgs
    } else {
        # Custom format restore
        $pgRestoreArgs = @(
            "--host=$dbHost",
            "--port=$port",
            "--username=$username",
            "--dbname=$database",
            "--verbose",
            "--clean",
            "--if-exists",
            "$BackupFile"
        )
        & pg_restore @pgRestoreArgs
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restored successfully!" -ForegroundColor Green
        
        # Verify restore by checking if tables exist
        Write-Host "🔄 Verifying restore..." -ForegroundColor Yellow
        $verifyQuery = "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
        $psqlArgs = @(
            "--host=$dbHost",
            "--port=$port",
            "--username=$username",
            "--dbname=$database",
            "--command=$verifyQuery",
            "--tuples-only",
            "--quiet"
        )
        $tableCount = & psql @psqlArgs
        
        if ($tableCount -and $tableCount.Trim() -gt 0) {
            Write-Host "✅ Verification successful: $($tableCount.Trim()) tables found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: No tables found after restore" -ForegroundColor Yellow
        }
        
        Write-Host "🔄 Running Prisma generate to sync..." -ForegroundColor Yellow
        Set-Location ..
        & npx prisma generate
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
        }
        
        Write-Host "✅ Database restore completed successfully!" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Restore failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error restoring backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Clean up environment variable
Remove-Item Env:PGPASSWORD

Write-Host ""
Write-Host "🎉 Restore operation completed!" -ForegroundColor Green
Write-Host "Remember to restart your application to ensure it connects to the restored database." -ForegroundColor Yellow