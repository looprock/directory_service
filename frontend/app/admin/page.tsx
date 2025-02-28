'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { UserGroup, DirectoryService } from '@/lib/api';

export default function AdminPage() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserGroup[]>([]);
  const [groupAdminUsers, setGroupAdminUsers] = useState<UserGroup[]>([]);
  const [newAdmin, setNewAdmin] = useState({
    user_id: '',
    group_name: 'directory_service_admins'
  });

  const checkAdminStatus = useCallback(async () => {
    try {
      const userGroups = await DirectoryService.getUserGroups(session?.user?.email || '');
      setIsAdmin(userGroups.some((group: { group_name: string }) => group.group_name === 'directory_service_admins'));
    } catch (err) {
      console.error('Failed to check admin status:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      checkAdminStatus();
      loadAdminUsers();
    }
  }, [session, checkAdminStatus]);

  const loadAdminUsers = async () => {
    try {
      const [admins, groupAdmins] = await Promise.all([
        DirectoryService.getGroupUsers('directory_service_admins'),
        DirectoryService.getGroupUsers('directory_service_group_admins')
      ]);
      setAdminUsers(admins);
      setGroupAdminUsers(groupAdmins);
    } catch (err) {
      setError('Failed to load admin users');
      console.error(err);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await DirectoryService.assignUserToGroup(newAdmin);
      await loadAdminUsers();
      setNewAdmin({ ...newAdmin, user_id: '' });
      setError(null);
    } catch (err) {
      setError('Failed to add admin user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string, groupName: string) => {
    setLoading(true);
    try {
      await DirectoryService.removeUserFromGroup(userId, groupName);
      await loadAdminUsers();
      setError(null);
    } catch (err) {
      setError('Failed to remove admin user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="text-center mt-12">
        <p className="text-lg">Please sign in to access admin panel</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center mt-12">
        <p className="text-lg text-red-600">Access denied. You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        {/* Add Admin Form */}
        <div className="bg-gray-200 shadow rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">Add Admin User</h2>
          <form onSubmit={handleAddAdmin} className="grid grid-cols-[120px,1fr] gap-4 items-center max-w-2xl">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={newAdmin.user_id}
              onChange={(e) => setNewAdmin({...newAdmin, user_id: e.target.value})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              required
            />

            <label className="text-sm font-medium">Role</label>
            <select
              value={newAdmin.group_name}
              onChange={(e) => setNewAdmin({...newAdmin, group_name: e.target.value})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              required
            >
              <option value="directory_service_admins">Service Admin</option>
              <option value="directory_service_group_admins">Group Admin</option>
            </select>

            <div className="col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Lists */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Service Admins */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-500">Service Admins</h2>
            <div className="space-y-4">
              {adminUsers.map((admin) => (
                <div key={admin.user_id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900">{admin.user_id}</span>
                  <button
                    onClick={() => handleRemoveAdmin(admin.user_id, 'directory_service_admins')}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Group Admins */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-500">Group Admins</h2>
            <div className="space-y-4">
              {groupAdminUsers.map((admin) => (
                <div key={admin.user_id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900">{admin.user_id}</span>
                  <button
                    onClick={() => handleRemoveAdmin(admin.user_id, 'directory_service_group_admins')}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 