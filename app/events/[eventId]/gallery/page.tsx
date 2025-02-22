'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

type EventPhoto = {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  eventType: string;
};

export default function GalleryPage() {
  const { eventId } = useParams();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
    } else {
      setCurrentPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
    }
  };

  const closeFullscreen = () => {
    setViewMode('grid');
  };

  const fetchEventAndPhotos = async () => {
    try {
      setIsLoading(true);
      // Fetch event details
      const eventDoc = await getDoc(doc(db, 'events', eventId as string));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
      }

      // Fetch photos
      const photosQuery = query(
        collection(db, 'events', eventId as string, 'photos'),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(photosQuery);
      const photosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventPhoto[];
      setPhotos(photosData);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndPhotos();
  }, [eventId]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'fullscreen') {
        if (e.key === 'ArrowLeft') {
          navigatePhoto('prev');
        } else if (e.key === 'ArrowRight') {
          navigatePhoto('next');
        } else if (e.key === 'Escape') {
          closeFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, navigatePhoto, closeFullscreen]);

  // Add touch swipe navigation
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      const minSwipeDistance = 50;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          navigatePhoto('prev');
        } else {
          navigatePhoto('next');
        }
      }
    };

    if (viewMode === 'fullscreen') {
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [viewMode, navigatePhoto]);

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const downloadSelectedPhotos = async () => {
    const selectedPhotosList = photos.filter(photo => selectedPhotos.has(photo.id));
    
    for (const photo of selectedPhotosList) {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const openFullscreen = (index: number) => {
    setCurrentPhotoIndex(index);
    setViewMode('fullscreen');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex justify-between items-center">
          <div className="text-white">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
          <button
            onClick={closeFullscreen}
            className="text-white hover:text-gray-300 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => navigatePhoto('prev')}
            className="absolute left-4 text-white hover:text-gray-300 bg-black bg-opacity-50 p-2 rounded-full transition-opacity opacity-50 hover:opacity-100"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            src={photos[currentPhotoIndex].url}
            alt="Full screen view"
            className="max-h-[calc(100vh-200px)] max-w-screen-lg object-contain"
          />
          <button
            onClick={() => navigatePhoto('next')}
            className="absolute right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 p-2 rounded-full transition-opacity opacity-50 hover:opacity-100"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Bottom Slider */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
          <div className="max-w-screen-lg mx-auto">
            <div className="flex space-x-2 overflow-x-auto py-2 px-4 scrollbar-hide">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden transition-all ${
                    currentPhotoIndex === index ? 'ring-2 ring-white scale-105' : 'opacity-50 hover:opacity-75'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {event?.title} - Gallery
            </h1>
            <p className="text-sm text-gray-500">{event?.description}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-4">
            <Link
              href={`/events/${eventId}/upload`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload More Photos
            </Link>
            {selectedPhotos.size > 0 && (
              <button
                onClick={downloadSelectedPhotos}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Download Selected ({selectedPhotos.size})
              </button>
            )}
          </div>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative aspect-square group cursor-pointer ${
                  selectedPhotos.has(photo.id) ? 'ring-4 ring-blue-500' : ''
                }`}
                onClick={() => togglePhotoSelection(photo.id)}
                onDoubleClick={() => openFullscreen(index)}
              >
                <img
                  src={photo.url}
                  alt="Event photo"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-lg">
                  <div className="absolute top-2 right-2">
                    <div className={`w-6 h-6 rounded-full border-2 ${
                      selectedPhotos.has(photo.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-white bg-opacity-50'
                    }`}>
                      {selectedPhotos.has(photo.id) && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No photos uploaded yet</p>
            <Link
              href={`/events/${eventId}/upload`}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Photos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 