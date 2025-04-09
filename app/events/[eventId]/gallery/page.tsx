'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

type EventPhoto = {
  id: string;
  url?: string;
  message?: string;
  fileName?: string;
  uploadedAt: string;
  type: 'image' | 'message' | 'combined';
  groupId?: string;
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

  // Get only image-type photos with URLs
  const imagePhotos = photos.filter((p): p is EventPhoto & { url: string } => 
    !!p.url
  );

  // Get ONLY standalone text messages (no URL)
  const textOnlyMessages = photos.filter(p => !p.url && p.message);

  // Group photos by upload timestamp (within 1 minute = same group)
  const groupedPhotos = imagePhotos.reduce<{ [key: string]: EventPhoto[] }>((acc, photo) => {
    const key = photo.groupId || photo.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(photo);
    return acc;
  }, {});

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (imagePhotos.length === 0) return;
    
    if (direction === 'prev') {
      setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : imagePhotos.length - 1));
    } else {
      setCurrentPhotoIndex(prev => (prev < imagePhotos.length - 1 ? prev + 1 : 0));
    }
  };

  const closeFullscreen = () => {
    setViewMode('grid');
  };

  const fetchEventAndPhotos = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      // Fetch event details
      const eventDoc = await getDoc(doc(db, 'events', eventId as string));
      if (eventDoc.exists()) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
      }

      // Fetch photos and messages
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
      console.error('Error fetching event and photos:', error);
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
      if (!photo.url) continue; // Skip photos without URLs
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.fileName || `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const openFullscreen = (index: number) => {
    if (imagePhotos.length > 0) {
      setCurrentPhotoIndex(index);
      setViewMode('fullscreen');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Event Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {event?.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {event?.description}
          </p>
        </div>

        {/* Album Pages */}
        <div className="space-y-12">
          {/* Text-only messages */}
          {textOnlyMessages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {textOnlyMessages.map((message) => (
                <div 
                  key={message.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300"
                >
                  <p className="text-lg text-gray-900 whitespace-pre-wrap mb-4">
                    {message.message}
                  </p>
                  <div className="text-sm text-gray-500">
                    {new Date(message.uploadedAt).toLocaleDateString()} at {new Date(message.uploadedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Images with captions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(groupedPhotos).map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-6">
                {group.map((photo, photoIndex) => (
                  <div 
                    key={photo.id} 
                    className="relative aspect-[3/4] rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => openFullscreen(imagePhotos.findIndex(p => p.id === photo.id))}
                  >
                    <img
                      src={photo.url}
                      alt={`Photo ${photoIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.message && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4">
                        <div className="text-white">
                          <p className="text-lg font-medium leading-snug mb-2">
                            {photo.message}
                          </p>
                          <p className="text-sm text-white/80">
                            {new Date(photo.uploadedAt).toLocaleDateString()} at {new Date(photo.uploadedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg font-medium transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        View Full Size
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {photos.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No content yet</h3>
            <p className="mt-2 text-sm text-gray-500">Be the first to share photos or messages!</p>
            <div className="mt-6">
              <Link
                href={`/events/${eventId}/upload`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Share Photos & Messages
              </Link>
            </div>
          </div>
        )}

        {/* Fullscreen View */}
        {viewMode === 'fullscreen' && currentPhotoIndex < imagePhotos.length && (
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={closeFullscreen}
          >
            <div className="relative w-full h-full flex items-center justify-center"
                 onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeFullscreen}
                className="absolute top-4 right-4 text-white/90 p-2 hover:bg-white/10 rounded-full backdrop-blur-sm transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <button
                onClick={() => navigatePhoto('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/90 p-3 hover:bg-white/10 rounded-full backdrop-blur-sm transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="relative max-w-5xl w-full mx-4">
                <img
                  src={imagePhotos[currentPhotoIndex].url}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                {imagePhotos[currentPhotoIndex].message && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/50 backdrop-blur-sm rounded-b-lg">
                    <p className="text-white/90 text-lg font-light leading-relaxed">
                      {imagePhotos[currentPhotoIndex].message}
                    </p>
                  </div>
                )}
                <div className="absolute -bottom-8 left-0 right-0 p-4 text-center text-white/75 text-sm">
                  {currentPhotoIndex + 1} of {imagePhotos.length}
                </div>
              </div>

              <button
                onClick={() => navigatePhoto('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/90 p-3 hover:bg-white/10 rounded-full backdrop-blur-sm transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}