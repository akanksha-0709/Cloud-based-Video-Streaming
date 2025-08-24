const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    try {
        const { fileName, fileType } = JSON.parse(event.body);
        const videoId = uuidv4();
        const fileExtension = fileName.split('.').pop();
        const s3Key = `videos/${videoId}.${fileExtension}`;

        // Generate signed URL for S3 upload
        const signedUrl = s3.getSignedUrl('putObject', {
            Bucket: process.env.VIDEOS_BUCKET,
            Key: s3Key,
            ContentType: fileType,
            Expires: 300, // 5 minutes
            ACL: 'private'
        });

        // Create initial video record in DynamoDB
        const videoRecord = {
            id: videoId,
            fileName: fileName,
            s3Key: s3Key,
            fileType: fileType,
            status: 'uploading',
            uploadDate: new Date().toISOString(),
            createdAt: Date.now()
        };

        await dynamodb.put({
            TableName: process.env.VIDEOS_TABLE,
            Item: videoRecord
        }).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                uploadUrl: signedUrl,
                videoId: videoId,
                s3Key: s3Key
            })
        };

    } catch (error) {
        console.error('Error generating signed URL:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to generate upload URL',
                message: error.message
            })
        };
    }
};
