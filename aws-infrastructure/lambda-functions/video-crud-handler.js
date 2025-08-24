const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    try {
        const method = event.httpMethod;

        switch (method) {
            case 'GET':
                return await getVideos(event, headers);
            case 'POST':
                return await createVideo(event, headers);
            case 'PUT':
                return await updateVideo(event, headers);
            case 'DELETE':
                return await deleteVideo(event, headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error in video handler:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function getVideos(event, headers) {
    const { search, page = 1, limit = 12 } = event.queryStringParameters || {};
    
    try {
        let params = {
            TableName: process.env.VIDEOS_TABLE,
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'active'
            }
        };

        if (search) {
            params.FilterExpression += ' AND (contains(title, :search) OR contains(description, :search))';
            params.ExpressionAttributeValues[':search'] = search;
        }

        const result = await dynamodb.scan(params).promise();
        
        // Sort by upload date (newest first)
        const sortedVideos = result.Items.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedVideos = sortedVideos.slice(startIndex, endIndex);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                videos: paginatedVideos,
                total: sortedVideos.length,
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: endIndex < sortedVideos.length
            })
        };
    } catch (error) {
        throw error;
    }
}

async function createVideo(event, headers) {
    const videoData = JSON.parse(event.body);
    
    try {
        const video = {
            ...videoData,
            id: videoData.id || require('uuid').v4(),
            status: 'active',
            views: 0,
            uploadDate: new Date().toISOString(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await dynamodb.put({
            TableName: process.env.VIDEOS_TABLE,
            Item: video
        }).promise();

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(video)
        };
    } catch (error) {
        throw error;
    }
}

async function updateVideo(event, headers) {
    const videoId = event.pathParameters.id;
    const updates = JSON.parse(event.body);
    
    try {
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        Object.keys(updates).forEach(key => {
            updateExpression.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = updates[key];
        });

        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = Date.now();
        updateExpression.push('#updatedAt = :updatedAt');

        const params = {
            TableName: process.env.VIDEOS_TABLE,
            Key: { id: videoId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await dynamodb.update(params).promise();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.Attributes)
        };
    } catch (error) {
        throw error;
    }
}

async function deleteVideo(event, headers) {
    const videoId = event.pathParameters.id;
    
    try {
        await dynamodb.delete({
            TableName: process.env.VIDEOS_TABLE,
            Key: { id: videoId }
        }).promise();

        return {
            statusCode: 204,
            headers,
            body: ''
        };
    } catch (error) {
        throw error;
    }
}
