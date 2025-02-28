'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { DirectoryService } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter, usePathname } from 'next/navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (status === 'loading') return;
      
      if (!session) {
        setLoading(false);
        if (pathname !== '/') {
          router.push('/');
        }
        return;
      }

      try {
        const userGroups = await DirectoryService.getUserGroups(session.user?.email || '');
        const hasAccess = userGroups.some((group: { group_name: string }) => 
          group.group_name.startsWith('directory_service')
        );
        
        if (!hasAccess) {
          setAuthError('Access denied. You must be a member of a directory service group.');
          await signOut({ redirect: false });
          router.push('/');
        }
        
        setAuthorized(hasAccess);
      } catch (err) {
        console.error('Failed to check authorization:', err);
        setAuthorized(false);
        if (pathname !== '/') {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [session, router, status, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {authorized && <Navbar />}
      <main className="w-full">
        {authError && !authorized && (
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <p>{authError}</p>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
} 