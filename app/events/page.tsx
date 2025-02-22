'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  eventType: string;
  createdAt: string;
  userId: string;
};

type EventPhoto = {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
};

type EventWithPhotos = Event & {
  photos?: EventPhoto[];
};

export default function EventsList() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventWithPhotos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchEvents();
    }
  }, [user, loading]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(eventsQuery);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventWithPhotos[];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventPhotos = async (eventId: string) => {
    try {
      const photosQuery = query(
        collection(db, 'events', eventId, 'photos'),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(photosQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventPhoto[];
    } catch (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
  };

  const handleViewPhotos = async (event: EventWithPhotos) => {
    // Remove the modal-related state and photo fetching logic
  };

  const handleDownloadQR = (event: EventWithPhotos) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1000;
    canvas.height = 1000;

    // Create an SVG string
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">
        ${document.getElementById(`qr-${event.id}`)?.innerHTML}
      </svg>
    `;

    // Create an image from the SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the QR code
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to PNG and download
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `event-qr-${event.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return event.eventType === filter && matchesSearch;
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              My Events
            </h1>
            <p className="text-sm text-gray-500">
              Welcome back, {user?.displayName}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/create-event"
              className="memory-button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Event
            </Link>
          </div>
        </div>

        {events.length > 0 ? (
          <>
            <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {Array.from(new Set(events.map(event => event.eventType))).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm p-6 sm:p-8 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">{event.title}</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.eventType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p className="flex items-center">
                        <span className="mr-2">📅</span>
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      <p className="flex items-center">
                        <span className="mr-2">📍</span>
                        {event.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col items-center space-y-6">
                    <Link 
                      href={`/events/${event.id}/gallery`}
                      className="group relative bg-white p-6 rounded-lg transition-transform transform hover:scale-105 w-full flex justify-center"
                    >
                      <div id={`qr-${event.id}`} className="bg-white">
                        <QRCodeSVG
                          value={`${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}/gallery`}
                          size={180}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                          <div className="bg-white px-4 py-2 rounded-md shadow-sm">
                            <p className="text-sm font-medium text-gray-700">Click to View Photos</p>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Link
                        href={`/events/${event.id}/gallery`}
                        className="memory-button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        View
                      </Link>
                      <Link
                        href={`/events/${event.id}/upload`}
                        className="memory-button-outline"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Upload
                      </Link>
                      <button
                        onClick={() => handleDownloadQR(event)}
                        className="memory-button-outline"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        QR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No events found matching your criteria</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No events yet</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by creating your first event.</p>
            <div className="mt-6">
              <Link
                href="/create-event"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Event
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 