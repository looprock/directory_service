'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Permission, UserGroup, DirectoryService } from '@/lib/api';

export default function PermissionsPage() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState({
    group_name: '',
    service: '',
    action: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    groupName: string;
    serviceAction: string;
  }>({
    isOpen: false,
    groupName: '',
    serviceAction: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: 'group_name' | 'service' | 'action' | 'service_action' | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });

  useEffect(() => {
    if (session) {
      loadPermissions();
      loadUserGroups();
    }
  }, [session]);

  const loadUserGroups = async () => {
    try {
      const data = await DirectoryService.getUserGroups();
      setUserGroups(data);
    } catch (err) {
      console.error('Failed to load user groups:', err);
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await DirectoryService.getPermissions();
      setPermissions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load permissions');
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const permissionData = {
        group_name: newPermission.group_name,
        service: newPermission.service,
        action: newPermission.action,
        service_action: `${newPermission.service}#${newPermission.action}`
      };
      await DirectoryService.createPermission(permissionData);
      
      // Reset form
      setNewPermission({
        group_name: '',
        service: '',
        action: ''
      });
      await loadPermissions();
      setError(null);
    } catch (err) {
      setError('Failed to create permission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (groupName: string, serviceAction: string) => {
    setDeleteConfirm({
      isOpen: true,
      groupName,
      serviceAction
    });
  };

  const handleDeletePermission = async () => {
    setLoading(true);
    try {
      await DirectoryService.deletePermission(deleteConfirm.groupName, deleteConfirm.serviceAction);
      await loadPermissions();
      setError(null);
    } catch (err) {
      setError('Failed to delete permission');
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, groupName: '', serviceAction: '' });
    }
  };

  const handleSort = (key: 'group_name' | 'service' | 'action' | 'service_action') => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedPermissions = () => {
    if (!permissions || !Array.isArray(permissions)) return [];
    if (!sortConfig.key) return permissions;

    return [...permissions].sort((a, b) => {
      const key = sortConfig.key as keyof Permission;
      if (a[key] < b[key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getUniqueUserGroups = () => {
    return [...new Set(userGroups
      .map(group => group.group_name)
      .filter(name => !name.startsWith('directory_service')))]
      .sort()
      .map(group_name => ({
        group_name
      }));
  };

  const sanitizeInput = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9_\-#]/g, '');
  };

  if (!session) {
    return (
      <div className="text-center mt-12">
        <p className="text-lg">Please sign in to view permissions</p>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full">
      <div className="w-full py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Permissions</h1>
          
          {/* Create Permission Form */}
          <div className="bg-gray-200 shadow rounded-lg p-6 mb-12">
            <h2 className="text-xl font-semibold mb-4">Create Permission</h2>
            <form onSubmit={handleCreatePermission} className="grid grid-cols-[120px,1fr] gap-4 items-center max-w-2xl">
              <label className="text-sm font-medium">Group Name</label>
              <select
                value={newPermission.group_name}
                onChange={(e) => setNewPermission({...newPermission, group_name: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                required
              >
                <option value="">Select a group</option>
                {getUniqueUserGroups().map((group) => (
                  <option key={`group-${group.group_name}`} value={group.group_name}>
                    {group.group_name}
                  </option>
                ))}
              </select>
              <label className="text-sm font-medium">Service</label>
              <input
                type="text"
                value={newPermission.service}
                onChange={(e) => setNewPermission({...newPermission, service: sanitizeInput(e.target.value)})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                required
              />
              <label className="text-sm font-medium">Action</label>
              <input
                type="text"
                value={newPermission.action}
                onChange={(e) => setNewPermission({...newPermission, action: sanitizeInput(e.target.value)})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                required
              />
              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Creating...' : 'Create Permission'}
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

          <div className="h-px my-12 bg-gray-400" />

          {/* Permissions List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-8 text-gray-500">Current Permissions</h2>
              {loading ? (
                <p className="text-gray-500">Loading permissions...</p>
              ) : permissions.length === 0 ? (
                <p className="text-gray-500">No permissions found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '300px' }} />
                      <col style={{ width: '300px' }} />
                      <col style={{ width: '300px' }} />
                      <col style={{ width: '200px' }} />
                    </colgroup>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('group_name')}
                            className="flex items-center justify-center w-full mx-auto"
                          >
                            <span className="mx-auto flex items-center">
                              Group Name
                              {sortConfig.key === 'group_name' && (
                                <span className="ml-1">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                          </button>
                        </th>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('service')}
                            className="flex items-center justify-center w-full mx-auto"
                          >
                            <span className="mx-auto flex items-center">
                              Service
                              {sortConfig.key === 'service' && (
                                <span className="ml-1">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                          </button>
                        </th>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('action')}
                            className="flex items-center justify-center w-full mx-auto"
                          >
                            <span className="mx-auto flex items-center">
                              Action
                              {sortConfig.key === 'action' && (
                                <span className="ml-1">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                          </button>
                        </th>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedPermissions().map((permission, index) => {
                        // Create a unique timestamp-based suffix
                        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        return (
                          <tr 
                            key={`${permission.group_name}-${permission.service_action}-${permission.service}-${permission.action}-${index}-${uniqueSuffix}`}
                            className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                          >
                            <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{permission.group_name}</td>
                            <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{permission.service}</td>
                            <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{permission.action}</td>
                            <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <button
                                onClick={() => confirmDelete(
                                  permission.group_name, 
                                  permission.service_action
                                )}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Add Confirmation Dialog */}
          {deleteConfirm.isOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete this permission? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: false, groupName: '', serviceAction: '' })}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePermission}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-red-200 rounded-md hover:bg-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 