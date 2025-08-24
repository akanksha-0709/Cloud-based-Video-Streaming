#!/bin/bash

# Video Streaming Platform - AWS Infrastructure Deployment Script
# This script deploys the complete AWS infrastructure for the video streaming platform

set -e

# Configuration
PROJECT_NAME="video-streaming-platform"
ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo "🚀 Deploying Video Streaming Platform Infrastructure"
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "Stack Name: $STACK_NAME"
echo "----------------------------------------"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured and ready"

# Deploy CloudFormation stack
echo "📦 Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file cloudformation-template.json \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        ProjectName=$PROJECT_NAME \
        Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo "✅ CloudFormation stack deployed successfully"
else
    echo "❌ CloudFormation deployment failed"
    exit 1
fi

# Get stack outputs
echo "📋 Retrieving stack outputs..."

VIDEOS_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`VideosBucketName`].OutputValue' \
    --output text)

THUMBNAILS_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ThumbnailsBucketName`].OutputValue' \
    --output text)

VIDEOS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`VideosTableName`].OutputValue' \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text)

echo "✅ Stack outputs retrieved"

# Package and deploy Lambda functions
echo "📦 Packaging and deploying Lambda functions..."

# Create deployment package directory
mkdir -p lambda-packages

# Package get-signed-upload-url function
cd lambda-functions
zip -r ../lambda-packages/get-signed-upload-url.zip get-signed-upload-url.js
zip -r ../lambda-packages/video-crud-handler.zip video-crud-handler.js
zip -r ../lambda-packages/video-processing.zip video-processing.js
cd ..

# Deploy Lambda functions (you'll need to create these functions in AWS Console or use SAM/CDK)
echo "⚠️  Lambda functions packaged. Deploy them manually or use AWS SAM/CDK for automated deployment."

# Create API Gateway (manual setup required)
echo "⚠️  API Gateway setup required - see documentation for endpoints configuration"

# Generate environment configuration
echo "📝 Generating environment configuration..."

cat > ../.env.${ENVIRONMENT} << EOF
# AWS Configuration for ${ENVIRONMENT}
VITE_AWS_REGION=${AWS_REGION}
VITE_S3_BUCKET_NAME=${VIDEOS_BUCKET}
VITE_CLOUDFRONT_DOMAIN=${CLOUDFRONT_DOMAIN}
VITE_API_GATEWAY_URL=https://your-api-id.execute-api.${AWS_REGION}.amazonaws.com/${ENVIRONMENT}
VITE_COGNITO_USER_POOL_ID=${USER_POOL_ID}
VITE_COGNITO_USER_POOL_CLIENT_ID=${USER_POOL_CLIENT_ID}

# Environment
VITE_NODE_ENV=${ENVIRONMENT}
EOF

echo "✅ Environment configuration generated: ../.env.${ENVIRONMENT}"

# Display summary
echo ""
echo "🎉 Infrastructure Deployment Complete!"
echo "----------------------------------------"
echo "Environment: $ENVIRONMENT"
echo "Videos Bucket: $VIDEOS_BUCKET"
echo "Thumbnails Bucket: $THUMBNAILS_BUCKET"
echo "Videos Table: $VIDEOS_TABLE"
echo "User Pool ID: $USER_POOL_ID"
echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy Lambda functions using AWS Console or SAM/CDK"
echo "2. Set up API Gateway endpoints"
echo "3. Configure CORS for your domain"
echo "4. Update frontend environment variables"
echo "5. Build and deploy frontend to S3/CloudFront"
echo ""
echo "📚 See README.md for detailed setup instructions"
