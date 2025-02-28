'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { DirectoryService } from '@/lib/api';
import { PowerIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    try {
      const userGroups = await DirectoryService.getUserGroups(session?.user?.email || '');
      setIsAdmin(userGroups.some((group: { group_name: string }) => group.group_name === 'directory_service_admins'));
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.email) {
      checkAdminStatus();
    }
  }, [session, checkAdminStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('user-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigation = [
    { name: 'Contacts', href: '/contacts' },
    { name: 'Permissions', href: '/permissions' },
    { name: 'User Groups', href: '/user-groups' },
  ];

  if (!session) return null;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Directory Service
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.name}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/admin'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <PowerIcon className="h-6 w-6 text-gray-500" />
            </button>

            {dropdownOpen && (
              <div
                id="user-dropdown"
                className="absolute right-0 top-12 w-48 py-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              >
                <div className="px-4 py-2 text-sm">
                  <div className="text-gray-700">Signed in as</div>
                  {session?.user?.name && session?.user?.email && (
                    <a 
                      href={`mailto:${session.user.email}`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {session.user.name}
                    </a>
                  )}
                </div>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 