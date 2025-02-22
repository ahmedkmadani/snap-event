'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Emit a custom event that the events page can listen to
    const searchEvent = new CustomEvent('searchUpdate', { detail: e.target.value });
    window.dispatchEvent(searchEvent);
  };

  if (!user) return null;

  const showSearch = pathname === '/events';

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link 
              href="/events" 
              className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900"
            >
              <span className="text-xl font-bold">SnapEvent</span>
            </Link>
          </div>

          <div className="flex items-center">
            <Link
              href="/events"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              My Events
            </Link>
            
            {showSearch && (
              <div className="ml-4 relative w-64">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}

            <Link
              href="/create-event"
              className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Create Event
            </Link>

            {/* Profile Dropdown */}
            <div className="ml-4 relative flex-shrink-0">
              <div>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                </button>
              </div>

              {isProfileOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="px-4 py-3 text-sm text-gray-700 border-b">
                    <p className="font-medium truncate">{user.displayName || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate mt-1">{user.email}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 