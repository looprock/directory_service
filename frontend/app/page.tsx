'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {!session && (
        <div className="text-right mb-4">
          <button
            onClick={() => signIn('google', { prompt: 'select_account' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign in
          </button>
        </div>
      )}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Directory Service
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Manage permissions, user groups, and contacts in one place
        </p>
      </div>

      {status === 'authenticated' ? (
        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/user-groups"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
          >
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-lg font-medium text-gray-900">User Groups</p>
              <p className="text-sm text-gray-500">Manage user group memberships</p>
            </div>
          </Link>

          <Link
            href="/permissions"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
          >
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-lg font-medium text-gray-900">Permissions</p>
              <p className="text-sm text-gray-500">Manage service permissions for groups</p>
            </div>
          </Link>

          <Link
            href="/contacts"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
          >
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-lg font-medium text-gray-900">Contacts</p>
              <p className="text-sm text-gray-500">Manage contact information</p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600">
            Please sign in with your Google Workspace account to continue
          </p>
        </div>
      )}
    </div>
  );
} 