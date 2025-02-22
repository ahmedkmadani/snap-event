'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

const eventTypes = [
  'Wedding',
  'Birthday Party',
  'Conference',
  'Concert',
  'Corporate Event',
  'Graduation',
  'Workshop',
  'Social Gathering',
  'Other'
] as const;

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(1, 'Location is required'),
  eventType: z.enum(eventTypes),
  customEventType: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventType: 'Social Gathering',
    }
  });

  const selectedEventType = watch('eventType');

  // Update custom type visibility when event type changes
  useEffect(() => {
    setShowCustomType(selectedEventType === 'Other');
  }, [selectedEventType]);

  const handleDownloadQR = () => {
    if (!qrCodeRef.current || !eventId) return;

    // Get the SVG element
    const svg = qrCodeRef.current.querySelector('svg');
    if (!svg) return;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (making it larger for better quality)
    canvas.width = 1000;
    canvas.height = 1000;

    // Create an image from the SVG
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
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
      downloadLink.download = `event-qr-${eventId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const eventTypeToSave = data.eventType === 'Other' ? data.customEventType : data.eventType;
      const docRef = await addDoc(collection(db, 'events'), {
        ...data,
        eventType: eventTypeToSave,
        createdAt: new Date().toISOString(),
        userId: user.uid,
      });
      setEventId(docRef.id);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Create New Event
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Fill in the details below to create your event and generate a QR code for photo uploads
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 sm:p-8 rounded-lg shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
              <input
                {...register('title')}
                className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                type="text"
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                {...register('eventType')}
                className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.eventType && (
                <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>
              )}
            </div>

            {showCustomType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Event Type</label>
                <input
                  {...register('customEventType')}
                  className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  type="text"
                  placeholder="Enter custom event type"
                />
                {errors.customEventType && (
                  <p className="text-red-500 text-sm mt-1">{errors.customEventType.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                {...register('description')}
                className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                rows={4}
                placeholder="Describe your event"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                {...register('date')}
                className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                type="datetime-local"
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                {...register('location')}
                className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                type="text"
                placeholder="Enter event location"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="memory-button w-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </form>

          {eventId && (
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm flex flex-col items-center justify-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Event QR Code</h2>
              <div ref={qrCodeRef} className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/upload`}
                  size={200}
                  className="w-48 h-48 sm:w-56 sm:h-56"
                />
              </div>
              <p className="text-center mt-6 text-sm sm:text-base text-gray-600 max-w-xs">
                Scan this QR code to upload photos to the event
              </p>
              <button
                onClick={handleDownloadQR}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 