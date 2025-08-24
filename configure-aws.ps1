# AWS Configuration Script for Video Streaming Platform
# This script helps you configure AWS credentials securely

param(
    [Parameter(Mandatory=$true)]
    [string]$AccessKeyId,
    
    [Parameter(Mandatory=$true)]
    [string]$SecretAccessKey,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev"
)

Write-Host "🔐 Configuring AWS Credentials for Video Streaming Platform" -ForegroundColor Green
Write-Host "============================================================="

# Validate inputs
if ([string]::IsNullOrWhiteSpace($AccessKeyId) -or [string]::IsNullOrWhiteSpace($SecretAccessKey)) {
    Write-Host "❌ Access Key ID and Secret Access Key are required!" -ForegroundColor Red
    exit 1
}

Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host ""

# Configure AWS CLI
Write-Host "📝 Configuring AWS CLI..." -ForegroundColor Yellow
try {
    # Set AWS credentials
    aws configure set aws_access_key_id $AccessKeyId
    aws configure set aws_secret_access_key $SecretAccessKey
    aws configure set default.region $Region
    aws configure set default.output json
    
    Write-Host "✅ AWS CLI configured successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to configure AWS CLI: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test AWS connectivity
Write-Host "🔍 Testing AWS connectivity..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS connection successful!" -ForegroundColor Green
    Write-Host "Account ID: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "User ARN: $($identity.Arn)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ AWS connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your credentials and try again." -ForegroundColor Yellow
    exit 1
}

# Update environment files with real AWS values
Write-Host "📝 Updating environment configuration..." -ForegroundColor Yellow

# Generate unique resource names
$timestamp = Get-Date -Format "yyyyMMdd"
$projectName = "video-streaming-platform"
$bucketSuffix = $timestamp.Substring(4) + "-" + $Environment

$videoBucket = "$projectName-videos-$bucketSuffix"
$thumbnailBucket = "$projectName-thumbnails-$bucketSuffix"

# Update .env.development
$envDevContent = @"
# AWS Configuration for development
VITE_AWS_REGION=$Region
VITE_S3_BUCKET_NAME=$videoBucket
VITE_CLOUDFRONT_DOMAIN=localhost:3000
VITE_API_GATEWAY_URL=http://localhost:3001/api
VITE_COGNITO_USER_POOL_ID=us-east-1_DEVXXXXXX
VITE_COGNITO_USER_POOL_CLIENT_ID=DEVXXXXXXXXXXXXXXXXXXXXXXX

# Development Environment
VITE_NODE_ENV=development
"@

$envDevContent | Out-File -FilePath ".env.development" -Encoding UTF8

# Update .env.production  
$envProdContent = @"
# AWS Configuration for production
VITE_AWS_REGION=$Region
VITE_S3_BUCKET_NAME=$videoBucket
VITE_CLOUDFRONT_DOMAIN=will-be-updated-after-deployment
VITE_API_GATEWAY_URL=will-be-updated-after-deployment
VITE_COGNITO_USER_POOL_ID=will-be-updated-after-deployment
VITE_COGNITO_USER_POOL_CLIENT_ID=will-be-updated-after-deployment

# Production Environment
VITE_NODE_ENV=production
"@

$envProdContent | Out-File -FilePath ".env.production" -Encoding UTF8

Write-Host "✅ Environment files updated" -ForegroundColor Green

# Show next steps
Write-Host ""
Write-Host "🎉 AWS Configuration Complete!" -ForegroundColor Green
Write-Host "================================="
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy AWS Infrastructure:" -ForegroundColor White
Write-Host "   cd aws-infrastructure" -ForegroundColor Gray
Write-Host "   .\deploy.ps1 -Environment $Environment" -ForegroundColor Gray
Write-Host ""
Write-Host "2. After deployment, your resources will be:" -ForegroundColor White
Write-Host "   - Videos Bucket: $videoBucket" -ForegroundColor Gray
Write-Host "   - Thumbnails Bucket: $thumbnailBucket" -ForegroundColor Gray
Write-Host "   - Region: $Region" -ForegroundColor Gray
Write-Host ""
Write-Host "3. The deployment will update your environment files with real AWS URLs" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to deploy infrastructure? Run the deploy command above!" -ForegroundColor Cyan
