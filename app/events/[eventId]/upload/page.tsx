'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { useLanguage } from '@/lib/context/LanguageContext';

type UploadingFile = {
  file: File;
  preview: string;
  progress: number;
  error?: string;
  uploading: boolean;
  completed: boolean;
};

type UploadSummary = {
  total: number;
  successful: number;
  failed: number;
  show: boolean;
};

export default function UploadPhoto() {
  const { eventId } = useParams();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadSummary, setUploadSummary] = useState<UploadSummary>({
    total: 0,
    successful: 0,
    failed: 0,
    show: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if all uploads are complete
  useEffect(() => {
    if (uploadingFiles.length === 0) return;

    const allComplete = uploadingFiles.every(file => file.completed || file.error);
    if (allComplete) {
      const successful = uploadingFiles.filter(file => file.completed).length;
      const failed = uploadingFiles.filter(file => file.error).length;
      setUploadSummary({
        total: uploadingFiles.length,
        successful,
        failed,
        show: true
      });
    }
  }, [uploadingFiles]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadingFile[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      uploading: false,
      completed: false
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const uploadFile = async (fileIndex: number) => {
    const fileInfo = uploadingFiles[fileIndex];
    if (!fileInfo || fileInfo.uploading || fileInfo.completed) return;

    setUploadingFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, uploading: true, error: undefined } : f
    ));

    try {
      const fileName = `${eventId}/${Date.now()}-${fileInfo.file.name}`;
      const storageRef = ref(storage, fileName);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, fileInfo.file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Save to Firestore with message if exists
      await addDoc(collection(db, 'events', eventId as string, 'photos'), {
        url: downloadURL,
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        type: message.trim() ? 'combined' : 'image',
        ...(message.trim() && { message: message.trim() })
      });

      setUploadingFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { ...f, uploading: false, completed: true, progress: 100 } : f
      ));

      // Clear message if this was a combined upload
      if (message.trim()) {
        setMessage('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadingFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { ...f, uploading: false, error: errorMessage } : f
      ));
    }
  };

  const uploadMessage = async () => {
    if (!message.trim()) return;

    try {
      await addDoc(collection(db, 'events', eventId as string, 'photos'), {
        message: message.trim(),
        uploadedAt: new Date().toISOString(),
        type: 'message'
      });
      setMessage('');
      // Show success message
      setUploadSummary({
        total: 1,
        successful: 1,
        failed: 0,
        show: true
      });
    } catch (error) {
      console.error('Error uploading message:', error);
    }
  };

  const uploadAllFiles = () => {
    uploadingFiles.forEach((_, index) => {
      uploadFile(index);
    });
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const resetUploads = () => {
    setUploadingFiles([]);
    setMessage('');
    setUploadSummary(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Upload Event Photos
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Share your memories by uploading photos from the event
          </p>
        </div>

        {uploadSummary.show && (
          <div className="mb-8">
            <div className={`rounded-lg p-4 ${uploadSummary.failed === 0 ? 'bg-green-50' : uploadSummary.successful === 0 ? 'bg-red-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${uploadSummary.failed === 0 ? 'bg-green-100' : uploadSummary.successful === 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  {uploadSummary.failed === 0 ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : uploadSummary.successful === 0 ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-medium ${uploadSummary.failed === 0 ? 'text-green-800' : uploadSummary.successful === 0 ? 'text-red-800' : 'text-yellow-800'}`}>
                    Upload Complete
                  </h3>
                  <div className="mt-1">
                    <p className={`text-sm ${uploadSummary.failed === 0 ? 'text-green-700' : uploadSummary.successful === 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                      Successfully uploaded {uploadSummary.successful} of {uploadSummary.total} images
                      {uploadSummary.failed > 0 && ` (${uploadSummary.failed} failed)`}
                    </p>
                  </div>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={resetUploads}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Upload More Photos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Message Input Section */}
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add a Congratulatory Message
            </h3>
            <div className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your congratulations or message here..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
              />
              <button
                onClick={uploadMessage}
                disabled={!message.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Message
              </button>
            </div>
          </div>

          {/* Image Upload Section */}
          <div 
            className={`bg-white p-6 sm:p-8 rounded-lg shadow-sm ${
              isDragging ? 'border-2 border-blue-500 bg-blue-50' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload Photos
            </h3>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-10 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer block"
              >
                <div className="space-y-4">
                  <div className="text-5xl sm:text-6xl mb-4">📸</div>
                  <p className="text-base sm:text-lg font-medium text-gray-900">
                    Click or drag images here to upload
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </label>
            </div>

            {uploadingFiles.length > 0 && (
              <div className="mt-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Selected Images ({uploadingFiles.length})
                  </h3>
                  <button
                    onClick={uploadAllFiles}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Upload All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="relative bg-gray-50 p-4 rounded-lg">
                      <img
                        src={file.preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      {file.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}

                      {file.completed && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="bg-white rounded-full p-2">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {!file.uploading && !file.completed && (
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      {file.error && (
                        <p className="text-xs text-red-500 mt-1">{file.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 