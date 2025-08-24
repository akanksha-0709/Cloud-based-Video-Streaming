# Quick Start Script for Video Streaming Platform
# Run this to test your current application

Write-Host "🎥 Video Streaming Platform - Quick Start" -ForegroundColor Green
Write-Host "========================================="

# Check Node.js installation
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm installation
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

# Install dependencies
try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
Write-Host "The application will open in your browser automatically." -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Local server will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features to test:" -ForegroundColor Yellow
Write-Host "  ✅ Video grid with sample videos" -ForegroundColor White
Write-Host "  ✅ Video player with custom controls" -ForegroundColor White
Write-Host "  ✅ Search functionality" -ForegroundColor White
Write-Host "  ✅ Upload modal (mock upload)" -ForegroundColor White
Write-Host "  ✅ Responsive design" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start development server
npm run dev
