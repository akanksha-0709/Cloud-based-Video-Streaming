# Video Streaming Platform - AWS Infrastructure Deployment Script (PowerShell)
# This script deploys the complete AWS infrastructure for the video streaming platform

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_NAME = "video-streaming-platform"
$STACK_NAME = "$PROJECT_NAME-$Environment"

Write-Host "🚀 Deploying Video Streaming Platform Infrastructure" -ForegroundColor Green
Write-Host "Project: $PROJECT_NAME"
Write-Host "Environment: $Environment"
Write-Host "Region: $Region"
Write-Host "Stack Name: $STACK_NAME"
Write-Host "----------------------------------------"

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if user is authenticated
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS CLI is configured and ready" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Deploy CloudFormation stack
Write-Host "📦 Deploying CloudFormation stack..." -ForegroundColor Yellow

try {
    aws cloudformation deploy `
        --template-file cloudformation-template.json `
        --stack-name $STACK_NAME `
        --parameter-overrides `
            ProjectName=$PROJECT_NAME `
            Environment=$Environment `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region

    Write-Host "✅ CloudFormation stack deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ CloudFormation deployment failed" -ForegroundColor Red
    exit 1
}

# Get stack outputs
Write-Host "📋 Retrieving stack outputs..." -ForegroundColor Yellow

$VIDEOS_BUCKET = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`VideosBucketName`].OutputValue' `
    --output text

$THUMBNAILS_BUCKET = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`ThumbnailsBucketName`].OutputValue' `
    --output text

$VIDEOS_TABLE = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`VideosTableName`].OutputValue' `
    --output text

$USER_POOL_ID = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' `
    --output text

$USER_POOL_CLIENT_ID = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' `
    --output text

$CLOUDFRONT_DOMAIN = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $Region `
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' `
    --output text

Write-Host "✅ Stack outputs retrieved" -ForegroundColor Green

# Package Lambda functions
Write-Host "📦 Packaging Lambda functions..." -ForegroundColor Yellow

# Create deployment package directory
if (!(Test-Path "lambda-packages")) {
    New-Item -ItemType Directory -Path "lambda-packages"
}

# Package Lambda functions
Push-Location "lambda-functions"
Compress-Archive -Path "get-signed-upload-url.js" -DestinationPath "../lambda-packages/get-signed-upload-url.zip" -Force
Compress-Archive -Path "video-crud-handler.js" -DestinationPath "../lambda-packages/video-crud-handler.zip" -Force
Compress-Archive -Path "video-processing.js" -DestinationPath "../lambda-packages/video-processing.zip" -Force
Pop-Location

Write-Host "✅ Lambda functions packaged" -ForegroundColor Green

# Generate environment configuration
Write-Host "📝 Generating environment configuration..." -ForegroundColor Yellow

$envContent = @"
# AWS Configuration for $Environment
VITE_AWS_REGION=$Region
VITE_S3_BUCKET_NAME=$VIDEOS_BUCKET
VITE_CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
VITE_API_GATEWAY_URL=https://your-api-id.execute-api.$Region.amazonaws.com/$Environment
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID

# Environment
VITE_NODE_ENV=$Environment
"@

$envContent | Out-File -FilePath "../.env.$Environment" -Encoding UTF8

Write-Host "✅ Environment configuration generated: ../.env.$Environment" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "🎉 Infrastructure Deployment Complete!" -ForegroundColor Green
Write-Host "----------------------------------------"
Write-Host "Environment: $Environment"
Write-Host "Videos Bucket: $VIDEOS_BUCKET"
Write-Host "Thumbnails Bucket: $THUMBNAILS_BUCKET"
Write-Host "Videos Table: $VIDEOS_TABLE"
Write-Host "User Pool ID: $USER_POOL_ID"
Write-Host "User Pool Client ID: $USER_POOL_CLIENT_ID"
Write-Host "CloudFront Domain: $CLOUDFRONT_DOMAIN"
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy Lambda functions using AWS Console or SAM/CDK"
Write-Host "2. Set up API Gateway endpoints"
Write-Host "3. Configure CORS for your domain"
Write-Host "4. Update frontend environment variables"
Write-Host "5. Build and deploy frontend to S3/CloudFront"
Write-Host ""
Write-Host "📚 See README.md for detailed setup instructions"
