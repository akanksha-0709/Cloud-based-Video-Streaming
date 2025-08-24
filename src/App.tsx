import React, { useState } from 'react';
import { Header } from './components/Header';
import { VideoGrid } from './components/VideoGrid';
import { VideoPlayer } from './components/VideoPlayer';
import { UploadModal } from './components/UploadModal';
import { Video } from './types/video';

// Hardcoded mock videos for reliable rendering
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
  }
];
function App() {
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Simple search filter on mock data
    setVideos(
      mockVideos.filter(
        v => v.title.toLowerCase().includes(query.toLowerCase()) ||
             v.description.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleBackToGrid = () => {
    setSelectedVideo(null);
  };

  const handleUploadComplete = () => {
    setVideos(mockVideos);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={handleSearch}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedVideo ? (
          <div className="space-y-6">
            <button
              onClick={handleBackToGrid}
              className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Videos</span>
            </button>
            
            <VideoPlayer 
              videoUrl={selectedVideo.videoUrl}
              title={selectedVideo.title}
            />
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{selectedVideo.title}</h1>
                <div className="text-sm text-gray-500">
                  {selectedVideo.views.toLocaleString()} views
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{selectedVideo.uploader[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedVideo.uploader}</p>
                  <p className="text-sm text-gray-500">Uploaded {selectedVideo.uploadDate}</p>
                </div>
              </div>
              
              <p className="text-gray-700 whitespace-pre-wrap">{selectedVideo.description}</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? `Search results for "${searchQuery}"` : 'Featured Videos'}
              </h2>
              <p className="text-gray-600">
                {searchQuery 
                  ? `Found ${videos.length} video${videos.length !== 1 ? 's' : ''}`
                  : 'Discover amazing content from creators around the world'
                }
              </p>
            </div>
            
            <VideoGrid 
              videos={videos}
              onVideoSelect={handleVideoSelect}
              loading={false}
            />
          </div>
        )}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

export default App;