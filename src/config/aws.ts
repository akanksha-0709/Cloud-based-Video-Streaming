// AWS Configuration
export const AWS_CONFIG = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
    userPoolWebClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  s3: {
    bucketName: import.meta.env.VITE_S3_BUCKET_NAME || 'your-video-streaming-bucket',
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  },
  cloudFront: {
    distributionDomain: import.meta.env.VITE_CLOUDFRONT_DOMAIN || 'XXXXXXXXXXXXX.cloudfront.net',
  },
  apiGateway: {
    baseUrl: import.meta.env.VITE_API_GATEWAY_URL || 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod',
  },
  lambda: {
    videoProcessingFunction: 'video-processing-function',
  }
};

// Environment-specific configurations
export const getConfig = () => {
  const env = import.meta.env.VITE_NODE_ENV || 'production';
  
  if (env === 'development') {
    return {
      ...AWS_CONFIG,
      apiGateway: {
        baseUrl: 'http://localhost:3001/api', // Local development API
      }
    };
  }
  
  return AWS_CONFIG;
};
