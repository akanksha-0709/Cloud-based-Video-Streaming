const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Video processing event:', JSON.stringify(event, null, 2));

    try {
        // Process S3 event records
        for (const record of event.Records) {
            if (record.eventName.startsWith('ObjectCreated')) {
                await processVideo(record.s3);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Video processing completed' })
        };

    } catch (error) {
        console.error('Error processing video:', error);
        throw error;
    }
};

async function processVideo(s3Event) {
    const bucketName = s3Event.bucket.name;
    const objectKey = s3Event.object.key;
    
    console.log(`Processing video: ${bucketName}/${objectKey}`);

    try {
        // Extract video ID from S3 key
        const videoId = objectKey.split('/')[1].split('.')[0];

        // Update video status to processing
        await updateVideoStatus(videoId, 'processing');

        // Generate thumbnail
        await generateThumbnail(bucketName, objectKey, videoId);

        // Get video metadata
        const videoMetadata = await getVideoMetadata(bucketName, objectKey);

        // Update video record with metadata
        await updateVideoMetadata(videoId, videoMetadata);

        // Update video status to active
        await updateVideoStatus(videoId, 'active');

        console.log(`Video processing completed for: ${videoId}`);

    } catch (error) {
        console.error(`Error processing video ${objectKey}:`, error);
        
        // Extract video ID and mark as failed
        const videoId = objectKey.split('/')[1].split('.')[0];
        await updateVideoStatus(videoId, 'failed', error.message);
        
        throw error;
    }
}

async function generateThumbnail(bucketName, videoKey, videoId) {
    try {
        // For this example, we'll create a placeholder thumbnail
        // In a real implementation, you'd use FFmpeg or AWS MediaConvert to extract frames
        
        const placeholderThumbnail = await sharp({
            create: {
                width: 640,
                height: 360,
                channels: 3,
                background: { r: 52, g: 152, b: 219 }
            }
        })
        .png()
        .toBuffer();

        // Upload thumbnail to S3
        const thumbnailKey = `thumbnails/${videoId}.png`;
        
        await s3.putObject({
            Bucket: process.env.THUMBNAILS_BUCKET,
            Key: thumbnailKey,
            Body: placeholderThumbnail,
            ContentType: 'image/png',
            ACL: 'public-read'
        }).promise();

        console.log(`Thumbnail generated: ${thumbnailKey}`);
        return thumbnailKey;

    } catch (error) {
        console.error('Error generating thumbnail:', error);
        throw error;
    }
}

async function getVideoMetadata(bucketName, objectKey) {
    try {
        const headObject = await s3.headObject({
            Bucket: bucketName,
            Key: objectKey
        }).promise();

        return {
            fileSize: headObject.ContentLength,
            lastModified: headObject.LastModified,
            contentType: headObject.ContentType,
            duration: 0 // Would be extracted using FFmpeg in real implementation
        };

    } catch (error) {
        console.error('Error getting video metadata:', error);
        throw error;
    }
}

async function updateVideoStatus(videoId, status, errorMessage = null) {
    try {
        const updateParams = {
            TableName: process.env.VIDEOS_TABLE,
            Key: { id: videoId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':updatedAt': Date.now()
            }
        };

        if (errorMessage) {
            updateParams.UpdateExpression += ', errorMessage = :errorMessage';
            updateParams.ExpressionAttributeValues[':errorMessage'] = errorMessage;
        }

        await dynamodb.update(updateParams).promise();
        console.log(`Video ${videoId} status updated to: ${status}`);

    } catch (error) {
        console.error('Error updating video status:', error);
        throw error;
    }
}

async function updateVideoMetadata(videoId, metadata) {
    try {
        await dynamodb.update({
            TableName: process.env.VIDEOS_TABLE,
            Key: { id: videoId },
            UpdateExpression: 'SET fileSize = :fileSize, duration = :duration, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':fileSize': metadata.fileSize,
                ':duration': metadata.duration,
                ':updatedAt': Date.now()
            }
        }).promise();

        console.log(`Video ${videoId} metadata updated`);

    } catch (error) {
        console.error('Error updating video metadata:', error);
        throw error;
    }
}
