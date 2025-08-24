import { Video } from '../types/video';
import { getConfig } from '../config/aws';

const config = getConfig();

// AWS S3 Upload Service
class S3UploadService {
  async getSignedUploadUrl(fileName: string, fileType: string): Promise<string> {
    try {
      const response = await fetch(`${config.apiGateway.baseUrl}/upload/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          fileName,
          fileType,
        }),
      });
      
      const data = await response.json();
      return data.uploadUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw new Error('Failed to get upload URL');
    }
  }

  async uploadToS3(signedUrl: string, file: File, onProgress: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  private getAuthToken(): string {
    // In a real app, get this from Cognito or your auth service
    return localStorage.getItem('authToken') || '';
  }
}

// Main API Service
class VideoApiService {
  private s3Service = new S3UploadService();

  // Get all videos with optional search and pagination
  async getVideos(searchQuery?: string, page = 1, limit = 12): Promise<{ videos: Video[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`${config.apiGateway.baseUrl}/videos?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      return {
        videos: data.videos.map(this.transformVideo),
        total: data.total,
        hasMore: data.hasMore,
      };
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Fallback to mock data in development
      return this.getMockVideos(searchQuery);
    }
  }

  // Get single video by ID
  async getVideo(id: string): Promise<Video | null> {
    try {
      const response = await fetch(`${config.apiGateway.baseUrl}/videos/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Video not found');
      }

      const data = await response.json();
      return this.transformVideo(data);
    } catch (error) {
      console.error('Error fetching video:', error);
      return this.getMockVideo(id);
    }
  }

  // Upload video with AWS S3 integration
  async uploadVideo(
    file: File,
    metadata: { title: string; description: string; tags?: string[] },
    onProgress: (progress: number) => void
  ): Promise<{ success: boolean; videoId?: string; error?: string }> {
    try {
      // Step 1: Get signed upload URL
      onProgress(5);
      const signedUrl = await this.s3Service.getSignedUploadUrl(file.name, file.type);

      // Step 2: Upload to S3
      onProgress(10);
      await this.s3Service.uploadToS3(signedUrl, file, (uploadProgress) => {
        onProgress(10 + (uploadProgress * 0.7)); // 10% to 80%
      });

      // Step 3: Create video record in database
      onProgress(85);
      const response = await fetch(`${config.apiGateway.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          ...metadata,
          fileName: file.name,
          fileSize: file.size,
          duration: 0, // Will be populated after processing
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create video record');
      }

      const videoData = await response.json();
      onProgress(100);

      return {
        success: true,
        videoId: videoData.id,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Get video analytics
  async getVideoAnalytics(videoId: string): Promise<{
    views: number;
    watchTime: number;
    engagement: number;
    demographics: any;
  }> {
    try {
      const response = await fetch(`${config.apiGateway.baseUrl}/videos/${videoId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        views: 0,
        watchTime: 0,
        engagement: 0,
        demographics: {},
      };
    }
  }

  // Track video view
  async trackVideoView(videoId: string, watchTime: number): Promise<void> {
    try {
      await fetch(`${config.apiGateway.baseUrl}/videos/${videoId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          watchTime,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  private transformVideo(apiVideo: any): Video {
    return {
      id: apiVideo.id,
      title: apiVideo.title,
      description: apiVideo.description,
      thumbnail: `${config.cloudFront.distributionDomain}/thumbnails/${apiVideo.id}.jpg`,
      videoUrl: `${config.cloudFront.distributionDomain}/videos/${apiVideo.fileName}`,
      duration: apiVideo.duration || 0,
      views: apiVideo.views || 0,
      uploadDate: apiVideo.uploadDate,
      uploader: apiVideo.uploader || 'Unknown',
      size: apiVideo.fileSize || 0,
    };
  }

  private getAuthToken(): string {
    // In a real app, get this from Cognito or your auth service
    return localStorage.getItem('authToken') || '';
  }

  // Fallback mock data for development
  private async getMockVideos(searchQuery?: string): Promise<{ videos: Video[]; total: number; hasMore: boolean }> {
    const mockVideos: Video[] = [
      {
        id: '1',
        title: 'Beautiful Nature Documentary',
        description: 'Explore the wonders of wildlife in stunning 4K resolution.',
        thumbnail: 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=800',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 596,
        views: 12540,
        uploadDate: '2024-01-15',
        uploader: 'NatureFilms',
        size: 158000000
      },
      // ... other mock videos
    ];

    await new Promise(resolve => setTimeout(resolve, 1000));

    let filteredVideos = mockVideos;
    if (searchQuery) {
      filteredVideos = mockVideos.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return {
      videos: filteredVideos,
      total: filteredVideos.length,
      hasMore: false,
    };
  }

  private getMockVideo(id: string): Video | null {
    const mockVideos: Video[] = [
      {
        id: '1',
        title: 'Beautiful Nature Documentary',
        description: 'Explore the wonders of wildlife in stunning 4K resolution.',
        thumbnail: 'https://images.pexels.com/photos/1431822/pexels-photo-1431822.jpeg?auto=compress&cs=tinysrgb&w=800',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 596,
        views: 12540,
        uploadDate: '2024-01-15',
        uploader: 'NatureFilms',
        size: 158000000
      },
    ];

    return mockVideos.find(video => video.id === id) || null;
  }
}

export const apiService = new VideoApiService();