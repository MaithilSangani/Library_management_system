# PowerShell script to properly restart the development server
Write-Host "🔄 Restarting Library Management System..." -ForegroundColor Cyan

# Kill any existing Node.js processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Install dependencies if needed
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Start the development server
Write-Host "🚀 Starting development server..." -ForegroundColor Green
npm run dev
