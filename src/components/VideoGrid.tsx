import React from 'react';
import { Video } from '../types/video';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  loading?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ videos, onVideoSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-video bg-gray-300" />
            <div className="p-4">
              <div className="h-4 bg-gray-300 rounded mb-2" />
              <div className="h-3 bg-gray-300 rounded w-3/4 mb-3" />
              <div className="flex justify-between">
                <div className="h-3 bg-gray-300 rounded w-1/4" />
                <div className="h-3 bg-gray-300 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📹</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos found</h3>
        <p className="text-gray-600">Try adjusting your search or upload some videos to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onClick={() => onVideoSelect(video)}
        />
      ))}
    </div>
  );
};