'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { UserGroup, DirectoryService } from '@/lib/api';

export default function UserGroupsPage() {
  const { data: session } = useSession();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const [newUserGroup, setNewUserGroup] = useState({
    user_id: '',
    group_name: '',
    contact: {
      target: '',
      type: '',
      data: ''
    }
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string;
    groupName: string;
  }>({
    isOpen: false,
    userId: '',
    groupName: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: 'user_id' | 'group_name' | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });
  const [showContactFields, setShowContactFields] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [userAdminGroups, setUserAdminGroups] = useState<string[]>([]);

  const checkGroupAdminStatus = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const userGroups = await DirectoryService.getUserGroups(session.user.email);
      const isAdmin = userGroups.some((group: UserGroup) => 
        group.group_name === 'directory_service_admins'
      );
      const isGroupAdmin = userGroups.some((group: UserGroup) => 
        group.group_name === 'directory_service_group_admins'
      );
      
      setIsGroupAdmin(isGroupAdmin && !isAdmin); // Only set true if group admin but not service admin
      
      if (isGroupAdmin && !isAdmin) {
        // Get list of groups the admin is a member of
        const adminGroups = userGroups
          .map((group: UserGroup) => group.group_name)
          .filter((name: string) => !name.startsWith('directory_service'));
        setUserAdminGroups(adminGroups);
      }
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      loadUserGroups();
      checkGroupAdminStatus();
    }
  }, [session, checkGroupAdminStatus]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setTimeout(() => {
          setIsGroupDropdownOpen(false);
          setActiveIndex(-1);
        }, 100);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showContactFields && newUserGroup.group_name) {
      setNewUserGroup(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          target: prev.group_name
        }
      }));
    }
  }, [newUserGroup.group_name, showContactFields]);

  useEffect(() => {
    if (newUserGroup.contact?.type) {
      console.log('Contact type changed to:', newUserGroup.contact.type);
      console.log('Full contact state:', newUserGroup.contact);
    }
  }, [newUserGroup.contact]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const filteredOptions = getUniqueGroupNames().filter(name =>
      name.toLowerCase().includes(newUserGroup.group_name.toLowerCase())
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          const selectedName = filteredOptions[activeIndex];
          setNewUserGroup(prev => ({
            ...prev,
            group_name: selectedName,
            contact: {
              target: selectedName,
              type: prev.contact?.type || '',
              data: prev.contact?.data || ''
            }
          }));
          setIsGroupDropdownOpen(false);
          setActiveIndex(-1);
        }
        break;
      case 'Escape':
        setIsGroupDropdownOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const loadUserGroups = async () => {
    try {
      const data = await DirectoryService.getUserGroups();
      setUserGroups(data);
      setError(null);
    } catch (err) {
      setError('Failed to load user groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent creation of directory_service groups
    if (newUserGroup.group_name.startsWith('directory_service')) {
      setError('Cannot create groups with prefix "directory_service"');
      return;
    }

    // Check if group admin has permission for this group
    if (isGroupAdmin && !userAdminGroups.includes(newUserGroup.group_name)) {
      setError('You can only add users to groups you are a member of');
      return;
    }

    setLoading(true);
    try {
      // Create contact first if contact info is provided
      if (showContactFields && newUserGroup.contact?.target && newUserGroup.contact?.type) {
        const contactData = {
          target: newUserGroup.contact.target,
          type: newUserGroup.contact.type,
          data: newUserGroup.contact.data || ''
        };
        await DirectoryService.createContact(contactData);
      }

      await DirectoryService.assignUserToGroup({
        user_id: newUserGroup.user_id,
        group_name: newUserGroup.group_name
      });

      // Reset form
      setNewUserGroup({
        user_id: '',
        group_name: '',
        contact: {
          target: '',
          type: '',
          data: ''
        }
      });
      setShowContactFields(false);
      await loadUserGroups();
      setError(null);
    } catch (err) {
      setError('Failed to create user group');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (userId: string, groupName: string) => {
    setDeleteConfirm({
      isOpen: true,
      userId,
      groupName
    });
  };

  const handleDeleteUserGroup = async () => {
    setLoading(true);
    try {
      await DirectoryService.removeUserFromGroup(deleteConfirm.userId, deleteConfirm.groupName);
      await loadUserGroups();
      setError(null);
    } catch (err) {
      setError('Failed to delete user group');
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, userId: '', groupName: '' });
    }
  };

  const handleSort = (key: 'user_id' | 'group_name') => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedUserGroups = () => {
    if (!sortConfig.key) return userGroups.filter(group => !group.group_name.startsWith('directory_service'));

    return [...userGroups]
      .filter(group => !group.group_name.startsWith('directory_service'))
      .sort((a: UserGroup, b: UserGroup) => {
        if (!sortConfig.key) return 0;
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
  };

  const getUniqueGroupNames = () => {
    const groupNames = userGroups
      .map(group => group.group_name)
      .filter(name => !name.startsWith('directory_service'));
    
    // Filter groups for group admins
    if (isGroupAdmin) {
      return [...new Set(groupNames)].filter(name => userAdminGroups.includes(name));
    }
    
    return [...new Set(groupNames)];
  };

  const sanitizeInput = (value: string): string => {
    return value.replace(/[^a-zA-Z0-9_\-#@.]/g, '');
  };

  const handleGroupSelect = (selectedName: string) => {
    setNewUserGroup(prev => ({
      ...prev,
      group_name: selectedName,
      contact: showContactFields ? {
        target: selectedName,
        type: prev.contact?.type || '',
        data: prev.contact?.data || ''
      } : prev.contact
    }));
    setIsGroupDropdownOpen(false);
    setActiveIndex(-1);
  };

  if (!session) {
    return (
      <div className="text-center mt-12">
        <p className="text-lg">Please sign in to view user groups</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold mb-8">User Groups</h1>
        
        {/* Create User Group Form */}
        <div className="bg-gray-200 shadow rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">Create User Group</h2>
          <form onSubmit={handleCreateUserGroup} className="grid grid-cols-[120px,1fr] gap-4 items-center max-w-2xl">
            <label className="text-sm font-medium">User ID</label>
            <input
              type="email"
              value={newUserGroup.user_id}
              onChange={(e) => setNewUserGroup({...newUserGroup, user_id: e.target.value})}
              pattern="[^@]+@[^@]+\.[a-zA-Z]{2,}"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              required
            />
            <div className="relative">
              <label 
                htmlFor="group-name-input" 
                className="text-sm font-medium"
              >
                Group Name
              </label>
              <div className="relative mt-1">
                <div className="relative" ref={comboboxRef}>
                  <input
                    id="group-name-input"
                    type="text"
                    role="combobox"
                    aria-controls="group-name-options"
                    aria-expanded={isGroupDropdownOpen}
                    aria-activedescendant={activeIndex >= 0 ? `group-option-${activeIndex}` : undefined}
                    value={newUserGroup.group_name}
                    onChange={(e) => {
                      setNewUserGroup({...newUserGroup, group_name: sanitizeInput(e.target.value)});
                      setIsGroupDropdownOpen(true);
                      setActiveIndex(-1);
                    }}
                    onFocus={() => setIsGroupDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="block w-[310px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-auto"
                    aria-label="Toggle group names dropdown"
                    style={{ right: '-200px' }}
                  >
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {isGroupDropdownOpen && (
                <div className="absolute z-50 w-[500px] mt-1">
                  <div className="bg-white shadow-lg rounded-md border border-gray-300">
                    <div className="max-h-60 overflow-y-auto">
                      {getUniqueGroupNames()
                        .filter(name =>
                          name.toLowerCase().includes(newUserGroup.group_name.toLowerCase())
                        )
                        .map((name, index) => (
                          <div
                            key={name}
                            id={`group-option-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleGroupSelect(name);
                            }}
                            className={`cursor-pointer px-4 py-2 text-sm ${
                              index === activeIndex ? 'bg-indigo-600 text-white' : 'text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {name}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-2 mt-4">
              <button
                type="button"
                onClick={() => setShowContactFields(!showContactFields)}
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
              >
                <svg
                  className={`mr-2 h-5 w-5 transform ${showContactFields ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                Add New Group Contact Information
              </button>
            </div>

            {showContactFields && (
              <div className="mt-4 grid grid-cols-[120px,1fr] gap-4 items-start border-t pt-4">
                <label htmlFor="contact-target" className="text-sm font-medium pt-2">Target</label>
                <input
                  id="contact-target"
                  name="contact-target"
                  type="text"
                  value={newUserGroup.contact?.target || newUserGroup.group_name}
                  disabled
                  className="block w-[500px] rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                />

                <label htmlFor="contact-type" className="text-sm font-medium pt-2">Type</label>
                <select
                    id="contact-type"
                    name="contact-type"
                    value={newUserGroup.contact?.type || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        setNewUserGroup({
                            ...newUserGroup,
                            contact: {
                                target: newUserGroup.group_name,
                                type: value,
                                data: newUserGroup.contact?.data ?? ''
                            }
                        });
                    }}
                    className="block w-[500px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    style={{
                        backgroundColor: 'white',
                        color: 'black'
                    }}
                >
                    <option value="">Choose contact type</option>
                    <option value="email">Email</option>
                    <option value="pagerduty">PagerDuty</option>
                    <option value="slack">Slack</option>
                </select>

                <label htmlFor="contact-data" className="text-sm font-medium pt-2">Data</label>
                <input
                  id="contact-data"
                  name="contact-data"
                  type="text"
                  value={newUserGroup.contact?.data || ''}
                  onChange={(e) => setNewUserGroup({
                    ...newUserGroup,
                    contact: {
                      target: newUserGroup.group_name,
                      type: newUserGroup.contact?.type || '',
                      data: sanitizeInput(e.target.value)
                    }
                  })}
                  className="block w-[500px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                  required
                />
              </div>
            )}

            <div className="col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Creating...' : 'Create or Update User Group'}
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

        {/* User Groups List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-8 text-gray-500">Current User Groups</h2>
            {loading ? (
              <p className="text-gray-500">Loading user groups...</p>
            ) : userGroups.length === 0 ? (
              <p className="text-gray-500">No user groups found</p>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '400px' }} />
                    <col style={{ width: '400px' }} />
                    <col style={{ width: '200px' }} />
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('user_id')}
                          className="flex items-center justify-center w-full mx-auto"
                        >
                          <span className="mx-auto flex items-center">
                            User ID
                            {sortConfig.key === 'user_id' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </span>
                        </button>
                      </th>
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
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getSortedUserGroups().map((userGroup) => (
                      <tr 
                        key={`${userGroup.user_id}-${userGroup.group_name}`}
                        className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                      >
                        <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{userGroup.user_id}</td>
                        <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{userGroup.group_name}</td>
                        <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          <button
                            onClick={() => confirmDelete(userGroup.user_id, userGroup.group_name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
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
                Are you sure you want to remove this user from the group? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, userId: '', groupName: '' })}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUserGroup}
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
  );
} 