import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploadStatus('uploading');
    setErrorMessage('');
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const s3 = new S3Client({
        region: import.meta.env.VITE_AWS_REGION,
        credentials: fromCognitoIdentityPool({
          clientConfig: { region: import.meta.env.VITE_AWS_REGION },
          identityPoolId: 'us-east-1:EXAMPLE-IDENTITY-POOL-ID' // TODO: Replace with your Cognito Identity Pool ID
        })
      });
      const command = new PutObjectCommand({
        Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: file.type,
        ACL: 'public-read'
      });
      await s3.send(command);
      const videoUrl = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${fileName}`;
      setUploadStatus('success');
      setVideoUrl(videoUrl);
    } catch (err) {
      setUploadStatus('error');
      setErrorMessage('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    if (uploadStatus !== 'uploading') {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Video</h2>
          <button
            onClick={handleClose}
            disabled={uploadStatus === 'uploading'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {uploadStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Successful!</h3>
              <p className="text-gray-600">Your video has been uploaded and is now processing.</p>
              {videoUrl && (
                <div className="mt-4">
                  <p className="text-gray-700">Video URL:</p>
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{videoUrl}</a>
                </div>
              )}
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="text-center py-8">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Failed</h3>
              <p className="text-red-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => setUploadStatus('idle')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={uploadStatus === 'uploading'}
                />
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  disabled={uploadStatus === 'uploading'}
                  className="mt-4"
                />
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleUpload}
                    disabled={!title.trim() || uploadStatus === 'uploading' || !file}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};